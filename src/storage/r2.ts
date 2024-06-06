import type { Context } from 'hono';
import type { StorageProvider, SmallFileResult, FileResult, R2StorageProviderOptions, R2StorageProviderClass, R2StorageProviderDestination, R2StorageProviderFileName, R2StorageProviderCustomMetadata } from './../types';

export class R2StorageProvider implements StorageProvider {

    private r2Client: R2Bucket = null!;
    private r2StorageClass: R2StorageProviderClass = 'Standard';
    private returnBuffer: boolean = false;

    private destination: R2StorageProviderDestination = async (_c, _file) => '';
    private fileName: R2StorageProviderFileName = async (_c, file) => file.originalName;
    private r2CustomMetadata: R2StorageProviderCustomMetadata = async () => ({});

    private disableDestinationTrailSlashWarning: boolean = false;

    public constructor(options: R2StorageProviderOptions) {
        this.r2Client = options.r2Client;
        this.r2StorageClass = options.r2StorageClass ?? this.r2StorageClass;
        this.returnBuffer = options.returnBuffer ?? this.returnBuffer;
        this.destination = options.destination ?? this.destination;
        this.disableDestinationTrailSlashWarning = options.disableDestinationTrailSlashWarning ?? this.disableDestinationTrailSlashWarning;
        this.fileName = options.fileName ?? this.fileName;
        this.r2CustomMetadata = options.r2CustomMetadata ?? this.r2CustomMetadata;
    }

    public async _handleFile(c: Context, files: SmallFileResult[]): Promise<FileResult[]> {
        const results: FileResult[] = [];

        for(const file of files) {
            const destination = await this.destination(c, file);
            
            if(!this.disableDestinationTrailSlashWarning && !destination.endsWith('/')) {
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

    private async _uploadToBucket(c: Context, path: string, file: SmallFileResult) {
        const customMetaData = await this.r2CustomMetadata(c, file);

        await this.r2Client.put(path, file.buffer, {
            httpMetadata: {
                contentType: file.mimetype
            },
            customMetadata: customMetaData,
            storageClass: this.r2StorageClass
        });
    }

}