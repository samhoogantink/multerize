import type { Context, Next } from 'hono';
import type { Config, CreateConfig, HandleFieldsOptions, HandleOptions, SmallFileResult, ParseBodyResult, HandleTypes, FilesResultObject, Nullable, MiddlewareResponse, MiddlewareResponseValue } from './types';
import { createDefaultConfig } from './config';

// Exceptions
import ExpectedSingleFileError from './exceptions/ExpectedSingleFileError';
import NumberFilesExceededError from './exceptions/NumberFilesExceededError';
import ExpectedTextFieldsOnlyError from './exceptions/ExpectedTextFieldsOnlyError';
import HeaderPairsLimitExceededError from './exceptions/HeaderPairsLimitExceededError';
import FieldNameSizeExceededError from './exceptions/FieldNameSizeExceededError';
import FieldSizeExceededError from './exceptions/FieldSizeExceededError';
import TotalNumberFilesExceededError from './exceptions/TotalNumberFilesExceededError';
import FileSizeExceededError from './exceptions/FileSizeExceededError';

export default class Multerize {
    private config: Config = createDefaultConfig();

    constructor(config?: CreateConfig) {
        this.config = { 
            storage: config?.storage || this.config.storage,
            fileFilter: config?.fileFilter || this.config.fileFilter,
            limits: { ...this.config.limits, ...config?.limits },
            preservePath: config?.preservePath || this.config.preservePath,
            custom: { ...this.config.custom, ...config?.custom }
        };
    }

    /**
     * Parses the body of the request.
     * @param body FormData body
     * @param options Options
     * @returns {Promise<ParseBodyResult>} The parsed body
     */
    private async _parseBody(body: FormData, options: HandleOptions): Promise<ParseBodyResult> {
        const { type, fields } = options;

        // Verify that the amount of entries doesn't exceed the header pairs limit (limits.headerPairs)
        const bodyKeys = Array.from(body.keys());
        if(bodyKeys.length > this.config.limits.headerPairs) {
            throw new HeaderPairsLimitExceededError(this.config.limits.headerPairs);
        }

        let fieldsCount = 0;
        let filesCount = 0;
        const entries = body.entries();
        for(const [ key, value ] of entries) {
            // Verify that the field value is a text field
            if(type === 'NONE' && (value instanceof File || typeof value !== 'string')) {
                throw new ExpectedTextFieldsOnlyError(key);
            }

            // Verify that the field names don't exceed the field name size limit (limits.fieldNameSize)
            if(key.length > this.config.limits.fieldNameSize) {
                throw new FieldNameSizeExceededError(key);
            }

            // These checks are only for text fields
            if(!(value instanceof File) && typeof value === 'string') {
                fieldsCount++;

                // Verify that the field value size doesn't exceed the field size limit (limits.fieldSize)
                if(value.length > this.config.limits.fieldSize) {
                    throw new FieldSizeExceededError(key);
                }

                // Verify that the amount of text fields doesn't exceed the limit (limits.fields)
                if(fieldsCount > this.config.limits.fields) {
                    throw new ExpectedTextFieldsOnlyError(key);
                }
            } else if(value instanceof File) {
                filesCount++;
            }
        }

        // No files found, continue
        if(type === 'NONE') {
            return {
                type,
                files: []
            }
        }

        // Verify the max amount of files (limits.files)
        if(filesCount > this.config.limits.files) {
            throw new TotalNumberFilesExceededError();
        }

        const loopedFields: HandleFieldsOptions[] = type === 'ARRAY' && fields.length === 0 ? bodyKeys.map(key => ({ name: key, maxCount: Infinity })) : fields;
        const results: SmallFileResult[] = [];
        for(const field of loopedFields) {
            const rawFiles = body.getAll(field.name);
            const files = rawFiles.filter(value => value instanceof File).map(file => file as File);

            // No files found, continue
            if(files.length === 0) continue;

            // Check if the amount of files exceeds the limit
            if(files.length > 1 && (type === 'VALUE' || field.maxCount === 1)) {
                throw new ExpectedSingleFileError(field.name);
            }

            // Check if the amount of files exceeds the limit
            if(files.length > field.maxCount) {
                throw new NumberFilesExceededError(field.name, field.maxCount);
            }

            for(const file of files) {
                const buffer = await file.arrayBuffer();

                // Verify that the file size doesn't exceed the file size limit (limits.fileSize)
                if(buffer.byteLength > this.config.limits.fileSize) {
                    throw new FileSizeExceededError(field.name);
                }

                results.push({
                    fieldName: field.name,
                    originalName: file.name,
                    mimetype: file.type,
                    buffer,
                    size: buffer.byteLength
                });
            }
        }

        return {
            type,
            files: results
        }
    }

    /**
     * Filters the files using the user provided file filter.
     * @param files The files to filter
     * @returns {Promise<SmallFileResult[]>} The filtered files
     */
    private _filterFiles(files: SmallFileResult[]): Promise<SmallFileResult[]> {
        return Promise.all(files.map(async file => {
            const shouldAccept = await this.config.fileFilter({} as Context, file);
            return shouldAccept ? file : null;
        })).then(filteredFiles => filteredFiles.filter(file => file !== null) as SmallFileResult[]);
    }

    /**
     * Handles the middleware.
     * @param c The Hono context
     * @param next The Hono next function
     * @param options The options
     * @param scopedField The scoped field
     * @returns {Promise<MiddlewareResponseValue>} The middleware response value
     * @internal
     */
    private async _handle(c: Context, next: Next, options: HandleOptions, scopedField: Nullable<string> = null): Promise<MiddlewareResponseValue> {
        // Initialize default values
        c.set(this.config.custom.FILE_VARIABLE_KEY, null);
        c.set(this.config.custom.FILES_VARIABLE_KEY, null);

        if(!c.req.header('Content-Type') || !c.req.header('Content-Type')?.includes('multipart/form-data')) {
            return await next();
        }

        const body = await c.req.formData();
        const { type, files: unfilteredFiles } = await this._parseBody(body, options);

        const parsedFiles = await this._filterFiles(unfilteredFiles);
        const files = await this.config.storage._handleFile(c, parsedFiles);

        // No files found, continue
        if(files.length === 0) {
            return await next();
        }

        if(type === 'VALUE') {
            const selectedFile = scopedField ? files.find(file => file.fieldName === scopedField) : files[0];
            c.set(this.config.custom.FILE_VARIABLE_KEY, selectedFile || null);
        } else if(type === 'ARRAY') {
            const filteredFiles = scopedField ? files.filter(file => file.fieldName === scopedField) : files;
            c.set(this.config.custom.FILES_VARIABLE_KEY, filteredFiles);
        } else if(type === 'OBJECT') {
            const obj: FilesResultObject = {};
            for(const file of files) {
                if(!obj[file.fieldName]) {
                    obj[file.fieldName] = [];
                }

                obj[file.fieldName].push(file);
            }

            c.set(this.config.custom.FILES_VARIABLE_KEY, obj);
        }

        return await next();
    };

    /**
     * Handles the middleware.
     * @param type The type of the handler
     * @param fields The fields to handle
     * @param scopedField The scoped field
     * @returns {MiddlewareResponse} The middleware
     * @internal
     */
    private _useHandler(type: HandleTypes, fields: HandleFieldsOptions[] = [], scopedField: Nullable<string> = null): MiddlewareResponse {
        return (c: Context, next: Next) => this._handle(c, next, { type, fields }, scopedField);
    }

    /**
     * Accepts a single file for the specified field.
     * @param fieldName Field name
     * @returns {Middleware} The Hono Middleware
     */
    public single(fieldName: string): MiddlewareResponse {
        return this._useHandler('VALUE', [ { name: fieldName, maxCount: 1 } ], fieldName);
    }

    /**
     * Accepts multiple files for the specified field.
     * @param fieldName Field name
     * @param maxCount Maximum amount of files to accept, rejects if exceeded
     * @returns {Middleware} The Hono Middleware
     */
    public array(fieldName: string, maxCount: number = Infinity): MiddlewareResponse {
        return this._useHandler('ARRAY', [ { name: fieldName, maxCount } ], fieldName);
    }

    /**
     * Accepts multiple files for the specified fields.
     * @param fields Fields to accept
     * @returns {Middleware} The Hono Middleware
     */
    public fields(fields: HandleFieldsOptions[]): MiddlewareResponse {
        return this._useHandler('OBJECT', fields);
    }

    /**
     * Accepts no files.
     * @returns {Middleware} The Hono Middleware
     */
    public none(): MiddlewareResponse {
        return this._useHandler('NONE');
    }

    /**
     * Accepts any amount of files.
     * @returns {Middleware} The Hono Middleware
     */
    public any(): MiddlewareResponse {
        return this._useHandler('ARRAY');
    }
}