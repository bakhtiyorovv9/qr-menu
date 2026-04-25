import { BaseException } from "./base.exception.js";

export class BadRequestException extends BaseException{
    constructor(message) {
        super(message);
        this.status = 400;
        this.name = `Bad Request Exception`
    }
}