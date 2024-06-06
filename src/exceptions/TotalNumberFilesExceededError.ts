import MulterizeError from './base';

export default class TotalNumberFilesExceededError extends MulterizeError {

    constructor() {
        super();

        this.name = 'TotalNumberFilesExceeded';
        this.message = `Total number of files exceeded.`;
    }
    
}