export default class MulterizeError extends Error {

    constructor() {
        super();

        this.name = 'MulterizeError';
        this.message = 'An error occurred while processing the request.';
    }

}