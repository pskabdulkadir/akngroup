import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClonePage extends Document {
  id: string;
  userId: string;
  name: string;
  slug: string;
  isActive: boolean;
  visitCount: number;
  conversionCount: number;
  customizations?: {
    customMessage?: string;
    theme?: string;
    backgroundColor?: string;
    fontFamily?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ClonePageSchema = new Schema<IClonePage>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  isActive: { type: Boolean, default: true },
  visitCount: { type: Number, default: 0, min: 0 },
  conversionCount: { type: Number, default: 0, min: 0 },
  customizations: {
    customMessage: { type: String },
    theme: { type: String },
    backgroundColor: { type: String },
    fontFamily: { type: String }
  },
}, {
  timestamps: true
});

// Pre-save hook to generate ID if not provided
ClonePageSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = `clone-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  next();
});

export const ClonePage: Model<IClonePage> = mongoose.models.ClonePage || mongoose.model<IClonePage>("ClonePage", ClonePageSchema);