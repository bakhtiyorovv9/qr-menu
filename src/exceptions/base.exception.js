export class BaseException extends Error {
    constructor(message) {
        super(message);
        this.isException = true;
    }
}
