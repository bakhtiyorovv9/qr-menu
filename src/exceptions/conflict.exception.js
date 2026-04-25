import { BaseException } from "./base.exception.js";

export class ConflictException extends BaseException {
    constructor(message) {
        super(message);
        this.status(409);
        this.name = `Conflict Exception`;
    }
}