import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  features: string[];
  inStock: boolean;
  rating: number;
  reviews: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String, required: true },
  category: { type: String, required: true },
  features: [{ type: String }],
  inStock: { type: Boolean, default: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

// Pre-save hook to generate ID if not provided
ProductSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  next();
});

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);