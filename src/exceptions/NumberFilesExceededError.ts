import MulterizeError from './base';

export default class NumberFilesExceededError extends MulterizeError {

    constructor(fieldName: string, maxCount: number) {
        super();

        this.name = 'NumberFilesExceeded';
        this.message = `Number of files exceeded the limit of ${maxCount} for field '${fieldName}'.`;
    }
    
}