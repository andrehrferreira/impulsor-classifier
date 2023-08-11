import mongoose from "mongoose";

export default mongoose.model("ProductsClassifier", new mongoose.Schema({
    image: { type: String, trim: true },
    breadcrumb: { type: String, required: true, trim: true },
    inprocess: { type: Boolean, default: true, required: true },
    result: { type: String },
}, {
    collection: "products-classifier",
    timestamps: true
}));

