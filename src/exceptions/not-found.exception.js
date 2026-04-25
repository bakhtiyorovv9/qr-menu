import { BaseException } from "./base.exception.js";

export class NotFoundException extends BaseException{
    constructor(message) {
        super(message);
        this.status = 404;
        this.name = "Not Found Exception";
    }
}