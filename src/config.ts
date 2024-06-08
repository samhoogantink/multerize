import type { Config } from './types';

// Memory storage provider
import { MemoryStorageProvider } from './storage/memory';

export const createDefaultConfig = (): Config => ({
    storage: new MemoryStorageProvider(),
    fileFilter: () => Promise.resolve(true),
    limits: {
        fieldNameSize: 100,
        fieldSize: 1e6,
        fields: Infinity,
        fileSize: Infinity,
        files: Infinity,
        parts: Infinity,
        headerPairs: 2e3
    },
    preservePath: false,
    custom: {
        FILE_VARIABLE_KEY: 'file',
        FILES_VARIABLE_KEY: 'files'   
    }
});