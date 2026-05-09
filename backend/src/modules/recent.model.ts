import mongoose, { type Model } from "mongoose";

export interface IRecent {
  user_id: string;
  media_id: string;
  media_type: string;
  title: string;
  overview?: string;
  poster_url?: string;
  background_image_url?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  watched_at?: Date;
  is_active: boolean;
  created_date?: Date;
  updated_date?: Date;
  created_by?: string;
  updated_by?: string;
}

type RecentDocument = mongoose.Document<unknown, object, IRecent> & IRecent;

const recentSchema = new mongoose.Schema<RecentDocument>(
  {
    user_id: { type: String, required: true, trim: true, index: true },
    media_id: { type: String, required: true, trim: true, index: true },
    media_type: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: "movie",
    },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    overview: { type: String, trim: true, maxlength: 2000 },
    poster_url: { type: String, trim: true },
    background_image_url: { type: String, trim: true },
    source: { type: String, trim: true, default: "tmdb" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    watched_at: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true },
    created_by: { type: String, trim: true },
    updated_by: { type: String, trim: true },
  },
  {
    timestamps: {
      createdAt: "created_date",
      updatedAt: "updated_date",
    },
    collection: "recent",
  }
);

recentSchema.index({ user_id: 1, watched_at: -1 });
recentSchema.index({ user_id: 1, media_id: 1, media_type: 1 });
recentSchema.index({ title: 1 });

const Recent: Model<RecentDocument> =
  (mongoose.models.Recent as Model<RecentDocument>) ||
  mongoose.model<RecentDocument>("Recent", recentSchema);

export default Recent;
