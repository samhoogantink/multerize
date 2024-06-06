import type { Context, Env } from 'hono';

export type Nullable<T> = T | null;
export type MiddlewareResponse = (c: Context, next: () => Promise<void>) => Promise<MiddlewareResponseValue>;
export type MiddlewareResponseValue = Response|void;

export type HandleTypes = 'VALUE' | 'ARRAY' | 'OBJECT' | 'NONE';

export interface HandleFieldsOptions {
    name: string;
    maxCount: number;
}

export interface HandleOptions {
    type: HandleTypes;
    fields: HandleFieldsOptions[];
}

export interface Config {
    storage: StorageProvider;
    fileFilter: (c: Context, file: SmallFileResult) => Promise<boolean>;
    limits: CreateConfigLimits;
    preservePath: boolean;
}

export interface CreateConfig {
    storage?: Config['storage'];
    fileFilter?: Config['fileFilter'];
    limits?: Partial<Config['limits']>;
    preservePath?: Config['preservePath'];
}

export interface CreateConfigLimits {
    /**
     * Max field name size (in bytes)
     * @default 100
     */
    fieldNameSize: number;
    /**
     * Max field value size (in bytes)
     * @default 1e6
     */
    fieldSize: number;
    /**
     * Max number of non-file fields
     * @default Infinity
     */
    fields: number;
    /**
     * For multipart forms, the max file size (in bytes)
     * @default Infinity
     */
    fileSize: number;
    /**
     * For multipart forms, the max number of file fields
     * @default Infinity
     */
    files: number;
    /**
     * For multipart forms, the max number of parts (fields + files)
     * Note: not implemented yet
     * @default Infinity
     */
    parts: number;
    /**
     * Max number of header key-value pairs. Specifying this value can help prevent some forms of denial of service attacks.
     * @default 2000
     */
    headerPairs: number;
}

/**
 * Describes a small file result.
 */
export interface SmallFileResult {
    fieldName: string;
    originalName: string;
    mimetype: string;
    size: number;
    buffer: ArrayBuffer;
}

/**
 * Describes the file result.
 */
export interface FileResult {
    fieldName: string;
    originalName: string;
    mimetype: string;
    size: number;
    buffer: Nullable<Buffer>;
    destination: Nullable<string>;
    fileName: Nullable<string>;
    path: Nullable<string>;
}

export interface FilesResultObject {
    [k: string]: FileResult[];
}

export type HonoFileBodyEnv = {
    file: FileResult;
    files: FileResult[] | FilesResultObject;
}

export interface ParseBodyResult {
    type: HandleTypes;
    files: SmallFileResult[];
}

/**
 * Describes the storage provider.
 */
export interface StorageProvider {
    _handleFile(c: Context, files: SmallFileResult[]): Promise<FileResult[]>;
}

/**
 * Specifies the storage class of the file in the R2 bucket.
 */
export type R2StorageProviderClass = 'Standard' | 'InfrequentAccess';

/**
 * The destination folder of the file in the R2 bucket.
 */
export type R2StorageProviderDestination = <E extends Env = any>(c: Context<E>, file: SmallFileResult) => Promise<string>;

/**
 * The filename of the file in the R2 bucket.
 */
export type R2StorageProviderFileName = <E extends Env = any>(c: Context<E>, file: SmallFileResult) => Promise<string>;

/**
 * Custom metadata for the file in the R2 bucket.
 */
export type R2StorageProviderCustomMetadata = <E extends Env = any>(c: Context<E>, file: SmallFileResult) => Promise<Record<string, string>>;

/**
 * Options for the R2 Storage Provider.
 */
export interface R2StorageProviderOptions {
    /**
     * The R2 client.
     */
    r2Client?: R2Bucket;
    /**
     * The environment variable key for the R2 bucket. Value will be used if `r2Client` is not provided.
     */
    envBucketKey?: string;
    /**
     * The storage class of the file in the R2 bucket.
     * @link https://developers.cloudflare.com/r2/buckets/storage-classes/
     */
    r2StorageClass?: 'Standard' | 'InfrequentAccess';
    /**
     * Whether to return the buffer of the file in the Hono context.
     */
    returnBuffer?: boolean;
    /**
     * The destination folder of the file in the R2 bucket. 
     * Note: MUST end with a forward slash.
     */
    destination?: R2StorageProviderDestination;
    /**
     * Whether to disable the destination trail slash warning.
     * @default false
     */
    disableDestinationTrailSlashWarning?: boolean;
    /**
     * The filename of the file in the R2 bucket.
     */
    fileName?: R2StorageProviderFileName;
    /**
     * Custom metadata for the file in the R2 bucket.
     */
    r2CustomMetadata?: R2StorageProviderCustomMetadata;
}