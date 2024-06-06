import MulterizeError from './base';

export default class FileSizeExceededError extends MulterizeError {

    constructor(fieldName: string) {
        super();

        this.name = 'FileSizeExceeded';
        this.message = `File size exceeded for field: ${fieldName}.`;
    }
    
}