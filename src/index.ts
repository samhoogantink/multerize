import type { CreateConfig, HonoFileBodyEnv, HandleFieldsOptions, FileResult, FilesResultObject } from './types';

// Multerize
import Multerize from './multerize';

// Storage providers
import { MemoryStorageProvider } from './storage/memory';
import { R2StorageProvider } from './storage/r2';

// Exporting
const createMulterize = (config?: CreateConfig) => {
    return new Multerize(config);
}

export default Multerize;

export {
    Multerize,
    createMulterize,

    MemoryStorageProvider,
    R2StorageProvider,

    // Typings
    FileResult,
    FilesResultObject,
    HonoFileBodyEnv,
    HandleFieldsOptions
}