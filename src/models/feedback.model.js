import mongoose from "mongoose";
import { User } from "./user.model.js";

const FeedbackSchema = new mongoose.Schema(
    {
        message: {
            type: mongoose.SchemaTypes.String,
            required: true,
            min: [1, `Name must a character`],
        },
        type: {
            type: mongoose.SchemaTypes.String,
            enum: [`review`, `complaint`],
            required: true,
        },
        rating: {
            type: mongoose.SchemaTypes.Number,
            min: 1,
            max: 5,
            default: 5,
        },
        image: {
            type: mongoose.SchemaTypes.String,
        },
        device_info: {
            type: mongoose.SchemaTypes.String,
            default: "none",
        },
        created_at: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: User,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: "feedbacks",
    },
);

export const Feedback = mongoose.model(`Feedback`, FeedbackSchema);
