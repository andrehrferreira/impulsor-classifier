import mongoose from "mongoose";

export default mongoose.model("Product", new mongoose.Schema({
    ref: { type: String, index: true, unique: true, required: true },
    campaign: { type: String, index: true, required: true },
    title: { type: String, index: true, required: true, trim: true },
    sku: { type: String, index: true, required: true },
    price: { type: Number, index: true, required: true },
    priceof: { type: Number },
    id: { type: String, index: true },    
    gtin: { type: String, index: true },
    isbn: { type: String, index: true },
    breadcrumb: { type: String, index: true, trim: true }, 
    category: { type: String, index: true, trim: true }, 
    categorized: { type: Boolean, default: false, required: true },
    image: { type: String, trim: true, required: true }, 
    link: { type: String, trim: true, required: true }, 
    coin: { type: String, default: "BRL", required: true }, 
    marketplace: { type: Boolean, default: false, trim: true }, 
    seller: { type: String, trim: true }, 
    brand: { type: String, trim: true }, 
    description: { type: String, trim: true },
    plots: { type: Number, trim: true },
    installment: { type: Number, trim: true },
    video: { type: String, trim: true },
    color: { type: String, trim: true },
    gender: { type: String, trim: true },
    agegroup: { type: String, trim: true },
    size: { type: String, trim: true },
    author: { type: String, trim: true }, 
    publisher: { type: String, trim: true },
    availability: { type: String, default: "InStock", trim: true },
    relevance: { type: Number, default: 0, required: true }
}, { 
    collection: "products",
    timestamps: true
}));
