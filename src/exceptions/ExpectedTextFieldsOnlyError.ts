import MulterizeError from './base';

export default class ExpectedTextFieldsOnlyError extends MulterizeError {

    constructor(fieldName: string) {
        super();

        this.name = 'ExpectedTextFieldsOnly';
        this.message = `Expected text fields only, field: ${fieldName}.`;
    }
    
}