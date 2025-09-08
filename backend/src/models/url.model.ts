import mongoose, { Document, Schema } from 'mongoose';

interface IClick {
    timestamp: Date;
    source: string; 
}

export interface IUrl extends Document {
    longUrl: string;
    shortCode: string;
    createdAt: Date;
    expiresAt: Date;
    clicks: IClick[];
}

const ClickSchema: Schema = new Schema({
    timestamp: { type: Date, default: Date.now },
    source: { type: String, required: true },
});

const UrlSchema: Schema = new Schema({
    longUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    clicks: [ClickSchema],
});

export default mongoose.model<IUrl>('Url', UrlSchema);