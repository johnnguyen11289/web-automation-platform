import mongoose, { Schema, Document } from 'mongoose';
import { BrowserProfile, BrowserType, ViewportSettings, ProxySettings } from '../types/browser.types';

const ViewportSchema = new Schema({
  width: { type: Number, required: true },
  height: { type: Number, required: true }
});

const ProxySchema = new Schema({
  host: { type: String },
  port: { type: Number },
  username: { type: String },
  password: { type: String }
});

const BrowserProfileSchema = new Schema({
  name: { type: String, required: true },
  browserType: { type: String, required: true, enum: ['chromium', 'firefox', 'webkit'] },
  automationLibrary: { type: String, required: true, enum: ['Playwright', 'Puppeteer'] },
  userAgent: { type: String },
  isHeadless: { type: Boolean, default: false },
  proxy: { type: ProxySchema, required: false },
  viewport: { type: ViewportSchema, required: true },
  cookies: [{ type: Schema.Types.Mixed }],
  localStorage: { type: Schema.Types.Mixed },
  sessionStorage: { type: Schema.Types.Mixed },
  startupScript: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  useLocalChrome: { type: Boolean, default: false },
  userDataDir: { type: String },
  locale: { type: String },
  timezone: { type: String },
  geolocation: {
    type: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    required: false
  },
  permissions: [{ type: String }],
  customJs: { type: String },
  businessType: { type: String }
});

// Update the updatedAt timestamp before saving
BrowserProfileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const BrowserProfileModel = mongoose.model<BrowserProfile & Document>('BrowserProfile', BrowserProfileSchema); 