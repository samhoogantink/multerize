import MulterizeError from './base';

export default class FieldNameSizeExceededError extends MulterizeError {

    constructor(fieldName: string) {
        super();

        this.name = 'FieldNameSizeExceeded';
        this.message = `Field name size exceeded for field: ${fieldName}.`;
    }
    
}