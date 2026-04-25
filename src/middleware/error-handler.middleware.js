import logger from "../helpers/logger.helper.js";

export const ErrorHandlerMiddleware = (err, _, res, __) => {
    logger.error(JSON.stringify(err));
    if (err.isException) {
        return res.status(err.status).send({
            success: false,
            message: err.message,
        });
    }

    console.log(err);

    res.status(500).send({
        success: false,
        message: `Internal server error`,
        consolelog: err,
    });
};
