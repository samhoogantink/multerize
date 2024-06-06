import type { Context } from 'hono';
import type { SmallFileResult } from './../types';

/**
 * Filters files to only allow images. Checks if the mimetype starts with 'image'.
 * @returns {Promise<boolean>} True if the file is an image, false otherwise
 */
export const imagesOnlyFilter = async (_c: Context, file: SmallFileResult): Promise<boolean> => {
    return file.mimetype.startsWith('image');
}

/**
 * Filters files to only allow plain text. Checks if the mimetype is 'text/plain'.
 * @returns {Promise<boolean>} True if the file is plain text, false otherwise
 */
export const plainTextOnlyFilter = async (_c: Context, file: SmallFileResult): Promise<boolean> => {
    return file.mimetype === 'text/plain';
}

/**
 * Filters files to only allow audio. Checks if the mimetype starts with 'audio'.
 * @returns {Promise<boolean>} True if the file is audio, false otherwise
 */
export const audioOnlyFilter = async (_c: Context, file: SmallFileResult): Promise<boolean> => {
    return file.mimetype.startsWith('audio');
}

/**
 * Filters files to only allow video. Checks if the mimetype starts with 'video'.
 * @returns {Promise<boolean>} True if the file is video, false otherwise
 */
export const videoOnlyFilter = async (_c: Context, file: SmallFileResult): Promise<boolean> => {
    return file.mimetype.startsWith('video');
}

/**
 * Filters files to only allow PDF files. Checks if the mimetype is 'application/pdf'.
 * @returns {Promise<boolean>} True if the file is a PDF, false otherwise
 */
export const pdfOnlyFilter = async (_c: Context, file: SmallFileResult): Promise<boolean> => {
    return file.mimetype === 'application/pdf';
}

/**
 * Filters files to only allow ZIP files. Checks if the mimetype is 'application/zip'.
 * @returns {Promise<boolean>} True if the file is a ZIP file, false otherwise
 */
export const zipOnlyFilter = async (_c: Context, file: SmallFileResult): Promise<boolean> => {
    return file.mimetype === 'application/zip';
}

/**
 * Filters files to only allow RAR files. Checks if the mimetype is 'application/vnd.rar'.
 * @returns {Promise<boolean>} True if the file is a RAR file, false otherwise
 */
export const rarOnlyFilter = async (_c: Context, file: SmallFileResult): Promise<boolean> => {
    return file.mimetype === 'application/vnd.rar';
}

/**
 * Filters files to only allow compressed files. Checks if the mimetype is 'application/zip', 'application/x-tar', 'application/gzip', 'application/x-7z-compressed' or 'application/vnd.rar'.
 * @returns {Promise<boolean>} True if the file is a compressed file, false otherwise
 */
export const compressedOnlyFilter = async (_c: Context, file: SmallFileResult): Promise<boolean> => {
    return file.mimetype === 'application/zip' || 
            file.mimetype === 'application/x-tar' || 
            file.mimetype === 'application/gzip' || 
            file.mimetype === 'application/x-7z-compressed' || 
            file.mimetype === 'application/vnd.rar';
}