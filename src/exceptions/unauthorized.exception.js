import { BaseException } from "./base.exception.js";

export class UnAuthorizedException extends BaseException {
    constructor(message) {
        super(message);
        this.status(401);
        this.name = `Unauthorized Exception`;
    }
}
