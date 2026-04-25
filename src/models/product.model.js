import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
    name : {
        type: mongoose.SchemaTypes.String,
        required: true,
        min: [1, `Name must a character`],
    },
    price: {
        type: mongoose.SchemaTypes.Number,
        required: true,
        min: 100,
        max:1000000,
    },
    raiting: {
        type: mongoose.SchemaTypes.Number,
        required: true,
        min: 1,
    },
    category_id: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        ref: 'Category',
    },
    image: { 
        type: mongoose.SchemaTypes.String,
        required: true,
    }
}, {
    timestamps: true,
    versionKey: false,
    collection: "products"
})

export const Product = mongoose.model(`Product`, ProductSchema)