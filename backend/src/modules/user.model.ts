import mongoose, { type Model } from "mongoose";
import { hashPassword, isPasswordHashed } from "@/helper/password.helper.ts";

export interface IUser {
  first_name: string;
  middle_name?: string;
  last_name: string;
  user_name: string;
  password: string;
  is_active: boolean;
  created_date?: Date;
  updated_date?: Date;
  created_by?: string;
  updated_by?: string;
}

type UserDocument = mongoose.Document<unknown, object, IUser> & IUser;

const userSchema = new mongoose.Schema<UserDocument>(
  {
    first_name: { type: String, required: true, trim: true },
    middle_name: { type: String, trim: true },
    last_name: { type: String, required: true, trim: true },
    user_name: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    is_active: { type: Boolean, default: true },
    created_by: { type: String, trim: true },
    updated_by: { type: String, trim: true },
  },
  {
    timestamps: {
      createdAt: "created_date",
      updatedAt: "updated_date",
    },
    collection: "user",
  }
);

userSchema.pre("save", async function hashPasswordOnSave(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  const rawPassword = this.get("password");
  if (typeof rawPassword !== "string") {
    next();
    return;
  }

  if (isPasswordHashed(rawPassword)) {
    next();
    return;
  }

  this.set("password", await hashPassword(rawPassword));
  next();
});

userSchema.pre("findOneAndUpdate", async function hashPasswordOnUpdate(next) {
  const update = this.getUpdate() as
    | { password?: unknown; $set?: { password?: unknown } }
    | undefined;

  if (!update) {
    next();
    return;
  }

  const directPassword = update.password;
  const setPassword = update.$set?.password;

  if (typeof directPassword === "string" && !isPasswordHashed(directPassword)) {
    update.password = await hashPassword(directPassword);
  }

  if (typeof setPassword === "string" && !isPasswordHashed(setPassword)) {
    update.$set = {
      ...(update.$set ?? {}),
      password: await hashPassword(setPassword),
    };
  }

  this.setUpdate(update);
  next();
});

const User: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ||
  mongoose.model<UserDocument>("User", userSchema);

export default User;
