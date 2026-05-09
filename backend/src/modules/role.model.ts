import mongoose, { type Model } from "mongoose";

export interface IRole {
  role_name: string;
  role_code: string;
  description?: string;
  permissions: string[];
  is_active: boolean;
  created_date?: Date;
  updated_date?: Date;
  created_by?: string;
  updated_by?: string;
}

type RoleDocument = mongoose.Document<unknown, object, IRole> & IRole;

const roleSchema = new mongoose.Schema<RoleDocument>(
  {
    role_name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    role_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 50,
    },
    description: { type: String, trim: true, maxlength: 500 },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: (value: string[]) => value.every((permission) => permission.trim().length > 0),
        message: "Permissions must not include empty values",
      },
    },
    is_active: { type: Boolean, default: true },
    created_by: { type: String, trim: true, maxlength: 100 },
    updated_by: { type: String, trim: true, maxlength: 100 },
  },
  {
    timestamps: {
      createdAt: "created_date",
      updatedAt: "updated_date",
    },
    collection: "role",
  }
);

roleSchema.index({ role_code: 1 }, { unique: true });
roleSchema.index({ role_name: 1 });
roleSchema.index({ is_active: 1 });

const Role: Model<RoleDocument> =
  (mongoose.models.Role as Model<RoleDocument>) ||
  mongoose.model<RoleDocument>("Role", roleSchema);

export default Role;
