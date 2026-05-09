import { createHmac, randomBytes } from "node:crypto";

interface TokenPayload {
  sub: string;
  user_name: string;
  user_data?: Record<string, unknown>;
  type: "access" | "refresh";
  iat: number;
  exp: number;
  jti: string;
}

interface GeneratedToken {
  token: string;
  expiresAt: Date;
}

const ACCESS_EXPIRES_IN_SECONDS = Number(process.env.JWT_ACCESS_EXPIRES_IN_SECONDS ?? 900);
const REFRESH_EXPIRES_IN_SECONDS = Number(process.env.JWT_REFRESH_EXPIRES_IN_SECONDS ?? 604800);

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET env var is required");
  }

  return secret;
};

const base64Url = (value: Buffer | string): string =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const signHs256 = (headerPayload: string, secret: string): string =>
  base64Url(createHmac("sha256", secret).update(headerPayload).digest());

const generateToken = (
  payload: Omit<TokenPayload, "iat" | "exp" | "jti" | "type">,
  type: "access" | "refresh"
): GeneratedToken => {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = type === "access" ? ACCESS_EXPIRES_IN_SECONDS : REFRESH_EXPIRES_IN_SECONDS;
  const exp = now + expiresIn;

  const tokenPayload: TokenPayload = {
    ...payload,
    type,
    iat: now,
    exp,
    jti: randomBytes(16).toString("hex"),
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(tokenPayload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = signHs256(signingInput, getJwtSecret());

  return {
    token: `${signingInput}.${signature}`,
    expiresAt: new Date(exp * 1000),
  };
};

export const generateAccessToken = (payload: {
  sub: string;
  user_name: string;
  user_data?: Record<string, unknown>;
}): GeneratedToken => generateToken(payload, "access");

export const generateRefreshToken = (payload: {
  sub: string;
  user_name: string;
}): GeneratedToken => generateToken(payload, "refresh");
