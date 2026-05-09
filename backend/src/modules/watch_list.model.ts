import mongoose, { type Model } from "mongoose";

export interface IWatchList {
  user_id: string;
  media_id: string;
  media_type: string;
  title: string;
  overview?: string;
  poster_url?: string;
  background_image_url?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  is_active: boolean;
  created_date?: Date;
  updated_date?: Date;
  created_by?: string;
  updated_by?: string;
}

type WatchListDocument = mongoose.Document<unknown, object, IWatchList> &
  IWatchList;

const watchListSchema = new mongoose.Schema<WatchListDocument>(
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
    is_active: { type: Boolean, default: true },
    created_by: { type: String, trim: true },
    updated_by: { type: String, trim: true },
  },
  {
    timestamps: {
      createdAt: "created_date",
      updatedAt: "updated_date",
    },
    collection: "watch_list",
  }
);

watchListSchema.index(
  { user_id: 1, media_id: 1, media_type: 1 },
  { unique: true }
);
watchListSchema.index({ user_id: 1, created_date: -1 });
watchListSchema.index({ title: 1 });

const WatchList: Model<WatchListDocument> =
  (mongoose.models.WatchList as Model<WatchListDocument>) ||
  mongoose.model<WatchListDocument>("WatchList", watchListSchema);

export default WatchList;
