import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
    {
        name: {
            type: mongoose.SchemaTypes.String,
            min: [1, "must be a character"],
            required: true,
        },
        admin_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: `User`,
            required: true,
        },
        image: {
            type: mongoose.SchemaTypes.String, 
        }
    },
    {
        versionKey: false,
        timestamps: true,
        collection: "category",
    },
);

export const Category = mongoose.model("Category", CategorySchema);
