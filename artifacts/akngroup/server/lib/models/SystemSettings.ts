import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISystemSettings extends Document {
  key: string;
  value: any;
  description?: string;
  category: 'system' | 'commission' | 'monoline' | 'email' | 'payment' | 'general';
  isActive: boolean;
  updatedAt: Date;
  updatedBy?: string;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  description: { type: String },
  category: { 
    type: String, 
    enum: ['system', 'commission', 'monoline', 'email', 'payment', 'general'],
    default: 'general'
  },
  isActive: { type: Boolean, default: true },
  updatedBy: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save hook to update the updatedAt timestamp
SystemSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const SystemSettings: Model<ISystemSettings> = mongoose.models.SystemSettings || mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);