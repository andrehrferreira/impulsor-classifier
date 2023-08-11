import mongoose from "mongoose";

export default mongoose.model("Categories", new mongoose.Schema({
    ref: { type: String, index: true, unique: true, required: true },
    breadcrumb: { type: String, index: true, unique: true, required: true },
    name: { type: String, index: true, required: true },
    raw: { type: String, index: true, required: true },
    root: { type: String, index: true },
    tree: { type: Array, index: true },
    relevance: { type: Number, default: 0, index: true, required: true },
    level: { type: Number, default: 0, index: true, required: true },
    haschildren: { type: Boolean, default: false, index: true, required: true }
}, { 
    collection: "categories",
    timestamps: true
}));
