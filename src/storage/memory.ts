import type { Context } from 'hono';
import type { StorageProvider, SmallFileResult, FileResult } from './../types';

export class MemoryStorageProvider implements StorageProvider {

    public async _handleFile(_c: Context, files: SmallFileResult[]): Promise<FileResult[]> {
        return files.map(file => ({
            fieldName: file.fieldName,
            originalName: file.originalName,
            mimetype: file.mimetype,
            size: file.size,
            buffer: Buffer.from(file.buffer),
            destination: null,
            fileName: null,
            path: null
        }));
    }

}