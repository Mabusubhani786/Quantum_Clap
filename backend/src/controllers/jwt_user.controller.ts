import type { FastifyReply, FastifyRequest } from "fastify";
import mongoose from "mongoose";
import JwtAuth from "@/modules/jwt_auth.model.ts";
import User, { type IUser } from "@/modules/user.model.ts";
import {
  generateAccessToken,
  generateRefreshToken,
} from "@/helper/jwtTokenGenerater.ts";
import { verifyPassword } from "@/helper/password.helper.ts";
import {
  formatFailResponse,
  formatSuccessResponse,
} from "@/helper/response-formatter.ts";

interface JwtUserTokenRequestBody {
  user_name: string;
  password: string;
}

interface JwtUserRefreshRequestBody {
  access_token: string;
}

interface JwtUserRevokeRequestBody {
  access_token: string;
  user_id: string;
}

type UserRecord = IUser & { _id: mongoose.Types.ObjectId };
type DuplicateKeyError = {
  code?: number;
  keyPattern?: Record<string, number>;
};

const sanitizeUserRecord = (user: Record<string, unknown>) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && typeof error.message === "string") {
    return error.message;
  }

  return "Unexpected error";
};

const isDuplicateKeyError = (error: unknown): boolean => {
  const candidate = error as DuplicateKeyError | undefined;
  return candidate?.code === 11000;
};

class JwtUserController {
  public readonly createToken = async (
    request: FastifyRequest<{ Body: JwtUserTokenRequestBody }>,
    reply: FastifyReply
  ) => {
    try {
      const userName = request.body?.user_name?.trim();
      const password = request.body?.password;

      if (!userName || !password) {
        return reply.code(400).send(
          formatFailResponse({
            message: "user_name and password are required",
          })
        );
      }

      const user = await User.findOne({
        user_name: userName,
        is_active: true,
      })
        .lean<UserRecord>()
        .exec();

      if (!user || typeof user.password !== "string") {
        return reply.code(401).send(
          formatFailResponse({
            message: "Invalid credentials",
          })
        );
      }

      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return reply.code(401).send(
          formatFailResponse({
            message: "Invalid credentials",
          })
        );
      }

      const userSnapshot = sanitizeUserRecord(
        user as unknown as Record<string, unknown>
      );
      const userId = String(user._id);

      const accessToken = generateAccessToken({
        sub: userId,
        user_name: user.user_name,
        user_data: userSnapshot,
      });
      const refreshToken = generateRefreshToken({
        sub: userId,
        user_name: user.user_name,
      });

      const deviceInfo = String(request.headers["user-agent"] ?? "");
      const ipAddress = request.ip;

      await JwtAuth.create({
        user_id: user._id,
        user_data: userSnapshot,
        access_token: accessToken.token,
        refresh_token: refreshToken.token,
        access_expires_at: accessToken.expiresAt,
        refresh_expires_at: refreshToken.expiresAt,
        is_revoked: false,
        device_info: deviceInfo,
        ip_address: ipAddress,
        created_by: user.user_name,
        updated_by: user.user_name,
      });

      return reply.send(
        formatSuccessResponse({
          message: "Token generated successfully",
          data: {
            user: userSnapshot,
            access_token: accessToken.token,
            refresh_token: refreshToken.token,
            access_expires_at: accessToken.expiresAt,
            refresh_expires_at: refreshToken.expiresAt,
          },
        })
      );
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes("JWT_SECRET env var is required")) {
        return reply.code(500).send(
          formatFailResponse({
            message: "Server configuration error: JWT_SECRET is missing",
          })
        );
      }

      if (isDuplicateKeyError(error)) {
        return reply.code(409).send(
          formatFailResponse({
            message: "Token session already exists. Please retry.",
          })
        );
      }

      return reply.code(500).send(
        formatFailResponse({
          message: "Unable to generate token",
        })
      );
    }
  };

  public readonly refreshToken = async (
    request: FastifyRequest<{ Body: JwtUserRefreshRequestBody }>,
    reply: FastifyReply
  ) => {
    try {
      const accessTokenValue = request.body?.access_token?.trim();
      if (!accessTokenValue) {
        return reply.code(400).send(
          formatFailResponse({
            message: "access_token is required",
          })
        );
      }

      const tokenRecord = await JwtAuth.findOne({
        access_token: accessTokenValue,
        is_revoked: false,
      })
        .lean()
        .exec();

      if (!tokenRecord) {
        return reply.code(401).send(
          formatFailResponse({
            message: "Invalid access token",
          })
        );
      }

      if (new Date(tokenRecord.refresh_expires_at).getTime() <= Date.now()) {
        await JwtAuth.updateOne(
          { _id: tokenRecord._id },
          { is_revoked: true, revoked_at: new Date() }
        ).exec();

        return reply.code(401).send(
          formatFailResponse({
            message: "Refresh token expired",
          })
        );
      }

      const user = await User.findById(tokenRecord.user_id).lean<UserRecord>().exec();
      if (!user || !user.is_active) {
        return reply.code(404).send(
          formatFailResponse({
            message: "User not found",
          })
        );
      }

      const userSnapshot = sanitizeUserRecord(user as unknown as Record<string, unknown>);
      const userId = String(user._id);

      const accessToken = generateAccessToken({
        sub: userId,
        user_name: user.user_name,
        user_data: userSnapshot,
      });
      const refreshToken = generateRefreshToken({
        sub: userId,
        user_name: user.user_name,
      });

      await JwtAuth.updateOne(
        { _id: tokenRecord._id, is_revoked: false },
        {
          access_token: accessToken.token,
          refresh_token: refreshToken.token,
          access_expires_at: accessToken.expiresAt,
          refresh_expires_at: refreshToken.expiresAt,
          user_data: userSnapshot,
          updated_by: user.user_name,
        }
      ).exec();

      return reply.send(
        formatSuccessResponse({
          message: "Token refreshed successfully",
          data: {
            user: userSnapshot,
            access_token: accessToken.token,
            refresh_token: refreshToken.token,
            access_expires_at: accessToken.expiresAt,
            refresh_expires_at: refreshToken.expiresAt,
          },
        })
      );
    } catch {
      return reply.code(500).send(
        formatFailResponse({
          message: "Unable to refresh token",
        })
      );
    }
  };

  public readonly revokeToken = async (
    request: FastifyRequest<{ Body: JwtUserRevokeRequestBody }>,
    reply: FastifyReply
  ) => {
    try {
      const accessTokenValue = request.body?.access_token?.trim();
      const userId = request.body?.user_id?.trim();

      if (!accessTokenValue || !userId) {
        return reply.code(400).send(
          formatFailResponse({
            message: "access_token and user_id are required",
          })
        );
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return reply.code(400).send(
          formatFailResponse({
            message: "Invalid user_id",
          })
        );
      }

      const revoked = await JwtAuth.findOneAndUpdate(
        {
          access_token: accessTokenValue,
          user_id: new mongoose.Types.ObjectId(userId),
          is_revoked: false,
        },
        {
          is_revoked: true,
          revoked_at: new Date(),
          updated_by: userId,
        },
        { new: true, lean: true }
      ).exec();

      if (!revoked) {
        return reply.code(404).send(
          formatFailResponse({
            message: "Active token not found for this user",
          })
        );
      }

      return reply.send(
        formatSuccessResponse({
          message: "Token revoked successfully",
          data: {
            user_id: userId,
            access_token: accessTokenValue,
            is_revoked: true,
            revoked_at: revoked.revoked_at,
          },
        })
      );
    } catch {
      return reply.code(500).send(
        formatFailResponse({
          message: "Unable to revoke token",
        })
      );
    }
  };
}

export default new JwtUserController();
