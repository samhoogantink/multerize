import MulterizeError from './base';

export default class MissingR2BucketError extends MulterizeError {

    constructor() {
        super();

        this.name = 'MissingR2Bucket';
        this.message = `The R2 Storage Provider requires an environment bucket key or a R2 client.`;
    }
    
}