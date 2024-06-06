import MulterizeError from './base';

export default class FieldSizeExceededError extends MulterizeError {

    constructor(fieldName: string) {
        super();

        this.name = 'FieldSizeExceeded';
        this.message = `Field value size exceeded for field: ${fieldName}.`;
    }
    
}