import type { Context } from 'hono';
import type { DefaultEnv, StorageProvider, SmallFileResult, FileResult, R2StorageProviderOptions, R2StorageProviderClass, R2StorageProviderDestination, R2StorageProviderFileName, R2StorageProviderCustomMetadata } from './../types';

// Exceptions
import MissingR2BucketError from './../exceptions/MissingR2BucketError';

export class R2StorageProvider<E extends DefaultEnv = any, V extends DefaultEnv = any> implements StorageProvider {

    private r2Client: R2Bucket = null!;
    private envBucketKey: keyof E = null!;
    private r2StorageClass: R2StorageProviderClass = 'Standard';
    private returnBuffer: boolean = false;

    private destination: R2StorageProviderDestination = async (_c, _file) => '';
    private fileName: R2StorageProviderFileName = async (_c, file) => file.originalName;
    private r2CustomMetadata: R2StorageProviderCustomMetadata = async () => ({});

    private disableDestinationTrailSlashWarning: boolean = false;

    public constructor(options: R2StorageProviderOptions<E, V>) {
        this.r2Client = options.r2Client ?? this.r2Client;
        this.envBucketKey = options.envBucketKey ?? this.envBucketKey;
        this.r2StorageClass = options.r2StorageClass ?? this.r2StorageClass;
        this.returnBuffer = options.returnBuffer ?? this.returnBuffer;
        this.destination = options.destination ?? this.destination;
        this.disableDestinationTrailSlashWarning = options.disableDestinationTrailSlashWarning ?? this.disableDestinationTrailSlashWarning;
        this.fileName = options.fileName ?? this.fileName;
        this.r2CustomMetadata = options.r2CustomMetadata ?? this.r2CustomMetadata;

        // Check if the R2 client or environment bucket key is provided
        if(!this.r2Client && !this.envBucketKey) {
            throw new MissingR2BucketError();
        }
    }

    public async _handleFile(c: Context, files: SmallFileResult[]): Promise<FileResult[]> {
        const results: FileResult[] = [];

        for(const file of files) {
            const destination = await this.destination(c, file);
            
            if(!this.disableDestinationTrailSlashWarning && (destination !== '' && !destination.endsWith('/'))) {
                console.warn(`The destination "${destination}" does not end with a forward slash. This could lead to unexpected behavior.`);
            }

            const fileName = await this.fileName(c, file);
            const path = `${destination}${fileName}`;

            await this._uploadToBucket(c, path, file);

            results.push({
                fieldName: file.fieldName,
                originalName: file.originalName,
                mimetype: file.mimetype,
                size: file.size,
                buffer: this.returnBuffer ? Buffer.from(file.buffer) : null,
                destination,
                fileName,
                path
            });
        }

        return results;
    }

    private detectBucket(c: Context) {
        if(this.r2Client) {
            return this.r2Client;
        }

        if(!this.envBucketKey || typeof this.envBucketKey !== 'string') {
            throw new MissingR2BucketError();
        }

        const bucket = c.env[this.envBucketKey];
        if(!bucket) {
            throw new MissingR2BucketError();
        }

        this.r2Client = bucket;
        return c.env[this.envBucketKey] as R2Bucket;
    }

    private async _uploadToBucket(c: Context, path: string, file: SmallFileResult) {
        const bucket = this.detectBucket(c);
        const customMetaData = await this.r2CustomMetadata(c, file);

        await bucket.put(path, file.buffer, {
            httpMetadata: {
                contentType: file.mimetype
            },
            customMetadata: customMetaData,
            storageClass: this.r2StorageClass
        });
    }

}