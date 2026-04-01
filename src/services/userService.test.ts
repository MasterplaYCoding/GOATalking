import { describe, expect, it } from "vitest";
import { createUser } from "./userService";

describe("userService", () => {
  it("creates a user entity", () => {
    const user = createUser("maria", "maria@example.com", "hashed-password", "/avatar.png");

    expect(user.id).toBeTruthy();
    expect(user.username).toBe("maria");
    expect(user.email).toBe("maria@example.com");
    expect(user.avatarUrl).toBe("/avatar.png");
  });
});
