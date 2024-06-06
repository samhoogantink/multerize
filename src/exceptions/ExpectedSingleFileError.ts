import MulterizeError from './base';

export default class ExpectedSingleFileError extends MulterizeError {

    constructor(fieldName: string) {
        super();

        this.name = 'ExpectedSingleFile';
        this.message = `Expected single file for field '${fieldName}' but got multiple files.`;
    }
    
}