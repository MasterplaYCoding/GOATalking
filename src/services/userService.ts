import { nanoid } from "nanoid";
import type { User } from "../domain/User";

export function createUser(
  username: string,
  email: string,
  passwordHash: string,
  avatarUrl: string
): User {
  return {
    id: nanoid(),
    username,
    email,
    passwordHash,
    avatarUrl
  };
}