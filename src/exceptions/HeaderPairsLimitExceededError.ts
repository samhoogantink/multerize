import MulterizeError from './base';

export default class HeaderPairsLimitExceededError extends MulterizeError {

    constructor(maxCount: number) {
        super();

        this.name = 'HeaderPairsLimitExceeded';
        this.message = `Number of fields exceeded the limit of ${maxCount}.`;
    }
    
}