import mongoose, { type Model } from "mongoose";

export interface IJwtAuth {
  user_id: mongoose.Types.ObjectId;
  user_data: Record<string, unknown>;
  access_token: string;
  refresh_token: string;
  access_expires_at: Date;
  refresh_expires_at: Date;
  is_revoked: boolean;
  revoked_at?: Date;
  device_info?: string;
  ip_address?: string;
  created_date?: Date;
  updated_date?: Date;
  created_by?: string;
  updated_by?: string;
}

type JwtAuthDocument = mongoose.Document<unknown, object, IJwtAuth> & IJwtAuth;

const jwtAuthSchema = new mongoose.Schema<JwtAuthDocument>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    user_data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    access_token: { type: String, required: true, trim: true },
    refresh_token: { type: String, required: true, unique: true, trim: true },
    access_expires_at: { type: Date, required: true },
    refresh_expires_at: { type: Date, required: true },
    is_revoked: { type: Boolean, default: false, index: true },
    revoked_at: { type: Date },
    device_info: { type: String, trim: true, maxlength: 500 },
    ip_address: { type: String, trim: true, maxlength: 45 },
    created_by: { type: String, trim: true, maxlength: 100 },
    updated_by: { type: String, trim: true, maxlength: 100 },
  },
  {
    timestamps: {
      createdAt: "created_date",
      updatedAt: "updated_date",
    },
    collection: "jwt_auth",
  }
);

jwtAuthSchema.index({ refresh_token: 1 }, { unique: true });
jwtAuthSchema.index({ user_id: 1, is_revoked: 1 });
jwtAuthSchema.index({ access_expires_at: 1 });
jwtAuthSchema.index({ refresh_expires_at: 1 });

const JwtAuth: Model<JwtAuthDocument> =
  (mongoose.models.JwtAuth as Model<JwtAuthDocument>) ||
  mongoose.model<JwtAuthDocument>("JwtAuth", jwtAuthSchema);

export default JwtAuth;
