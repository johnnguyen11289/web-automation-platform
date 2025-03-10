import mongoose, { Schema, Document } from 'mongoose';
import { BrowserProfile, BrowserType, ViewportSettings, ProxySettings } from '../types/browser.types';

const ViewportSchema = new Schema({
  width: { type: Number, required: true },
  height: { type: Number, required: true }
});

const ProxySchema = new Schema({
  host: { type: String, required: true },
  port: { type: Number, required: true },
  username: { type: String },
  password: { type: String }
});

const BrowserProfileSchema = new Schema({
  name: { type: String, required: true },
  browserType: { type: String, required: true, enum: ['chromium', 'firefox', 'webkit'] },
  userAgent: { type: String },
  isHeadless: { type: Boolean, default: false },
  proxy: { type: ProxySchema },
  viewport: { type: ViewportSchema, required: true },
  cookies: [{ type: Schema.Types.Mixed }],
  localStorage: { type: Schema.Types.Mixed },
  sessionStorage: { type: Schema.Types.Mixed },
  startupScript: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
BrowserProfileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const BrowserProfileModel = mongoose.model<BrowserProfile & Document>('BrowserProfile', BrowserProfileSchema); 