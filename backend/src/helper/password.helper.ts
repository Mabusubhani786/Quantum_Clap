import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export const isPasswordHashed = (value: string): boolean =>
  /^\$2[aby]\$\d{2}\$/.test(value);

export const hashPassword = async (plainPassword: string): Promise<string> => {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
};

export const verifyPassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  if (!isPasswordHashed(hashedPassword)) {
    return false;
  }

  return bcrypt.compare(plainPassword, hashedPassword);
};
