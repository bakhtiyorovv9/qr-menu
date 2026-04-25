import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: mongoose.SchemaTypes.String,
            min: [1, "must be a character"],
            required: true,
        },
        email: {
            type: mongoose.SchemaTypes.String,
            required: true,
            unique: true,
        },
        password: {
            type: mongoose.SchemaTypes.String,
            required: true,
            min: [6, "must be 6 character on password"],
        },
        role: {
            type: mongoose.SchemaTypes.String,
            enum: [`USER`, `ADMIN`, `VIEWER`],
            default: `VIEWER`,
        },
    },
    {
        versionKey: false,
        timestamps: true,
        collection: "users",
    },
);

export const User = mongoose.model("User", UserSchema);
