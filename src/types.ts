import type { Context } from 'hono';

export type DefaultEnv = {
    [k: string]: any;
}
export type Nullable<T> = T | null;
export type MiddlewareResponse = (c: Context, next: () => Promise<void>) => Promise<MiddlewareResponseValue>;
export type MiddlewareResponseValue = Response|void;

export type HandleTypes = 'VALUE' | 'ARRAY' | 'OBJECT' | 'NONE';

/**
 * Describes the fields to handle.
 */
export interface HandleFieldsOptions {
    name: string;
    maxCount: number;
}

/**
 * Describes the handle options.
 */
export interface HandleOptions {
    type: HandleTypes;
    fields: HandleFieldsOptions[];
}

export interface Config {
    storage: StorageProvider;
    fileFilter: (c: Context, file: SmallFileResult) => Promise<boolean>;
    limits: CreateConfigLimits;
    preservePath: boolean;
    custom: ConfigCustom;
}

export interface ConfigCustom {
    /**
     * A custom key for the file variable.
     */
    FILE_VARIABLE_KEY: string;
    /**
     * A custom key for the files variable.
     */
    FILES_VARIABLE_KEY: string;
}

export interface CreateConfig {
    /**
     * The storage provider.
     */
    storage?: Config['storage'];
    /**
     * A custom file filter.
     */
    fileFilter?: Config['fileFilter'];
    /**
     * The limits for the file upload.
     */
    limits?: Partial<Config['limits']>;
    /**
     * Whether to preserve the file path.
     */
    preservePath?: Config['preservePath'];
    /**
     * Custom configuration.
     */
    custom?: Partial<Config['custom']>;
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

export type FilesResult = FileResult[] | FilesResultObject;

export type MulterizeHonoBindings = {
    file: FileResult;
    files: FilesResult;
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

type HonoBindings<E, V> = { Variables: Omit<V, keyof MulterizeHonoBindings>; Bindings: E; };

/**
 * The destination folder of the file in the R2 bucket.
 */
export type R2StorageProviderDestination<E extends DefaultEnv = any, V extends DefaultEnv = any> = (c: Context<HonoBindings<E, V>>, file: SmallFileResult) => Promise<string>;

/**
 * The filename of the file in the R2 bucket.
 */
export type R2StorageProviderFileName<E extends DefaultEnv = any, V extends DefaultEnv = any> = (c: Context<HonoBindings<E, V>>, file: SmallFileResult) => Promise<string>;

/**
 * Custom metadata for the file in the R2 bucket.
 */
export type R2StorageProviderCustomMetadata<E extends DefaultEnv = any, V extends DefaultEnv = any> = (c: Context<HonoBindings<E, V>>, file: SmallFileResult) => Promise<Record<string, string>>;

/**
 * Options for the R2 Storage Provider.
 */
export interface R2StorageProviderOptions<E extends DefaultEnv = any, V extends DefaultEnv = any> {
    /**
     * The R2 client.
     */
    r2Client?: R2Bucket;
    /**
     * The environment variable key for the R2 bucket. Value will be used if `r2Client` is not provided.
     */
    envBucketKey?: keyof E;
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
    destination?: R2StorageProviderDestination<E, V>;
    /**
     * Whether to disable the destination trail slash warning.
     * @default false
     */
    disableDestinationTrailSlashWarning?: boolean;
    /**
     * The filename of the file in the R2 bucket.
     */
    fileName?: R2StorageProviderFileName<E, V>;
    /**
     * Custom metadata for the file in the R2 bucket.
     */
    r2CustomMetadata?: R2StorageProviderCustomMetadata<E, V>;
}