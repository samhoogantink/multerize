import type { CreateConfig, MulterizeHonoBindings, HandleFieldsOptions, FileResult, FilesResultObject } from './types';

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
    MemoryStorageProvider,
    R2StorageProvider,

    // Exception base
    MulterizeError,

    // Typings
    FileResult,
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