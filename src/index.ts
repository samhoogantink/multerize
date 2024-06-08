import type { CreateConfig, MulterizeHonoBindings, StorageProvider, HandleFieldsOptions, FileResult, FilesResult, FilesResultObject } from './types';

// Multerize
import Multerize from './multerize';

// Storage providers
import { MemoryStorageProvider } from './storage/memory';
import { R2StorageProvider } from './storage/r2';

// Prebuilt filters
import { imagesOnlyFilter, plainTextOnlyFilter, audioOnlyFilter, videoOnlyFilter, pdfOnlyFilter, zipOnlyFilter, rarOnlyFilter, compressedOnlyFilter } from './filters';

// Base error
import MulterizeError from './exceptions/base';

// Exporting
const createMulterize = (config?: CreateConfig) => {
    return new Multerize(config);
}

export {
    Multerize,
    createMulterize,

    // Storage providers
    StorageProvider,
    MemoryStorageProvider,
    R2StorageProvider,

    // Exception base
    MulterizeError,

    // Typings
    FileResult,
    FilesResult,
    FilesResultObject,
    MulterizeHonoBindings,
    HandleFieldsOptions,

    // Filters
    imagesOnlyFilter,
    plainTextOnlyFilter,
    audioOnlyFilter,
    videoOnlyFilter,
    pdfOnlyFilter,
    zipOnlyFilter,
    rarOnlyFilter,
    compressedOnlyFilter
}