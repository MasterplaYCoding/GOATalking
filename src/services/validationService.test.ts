import { describe, expect, it } from "vitest";
import {
  hasValidationErrors,
  validateDynamicProfileValues,
  validateEmail,
  validateImageUrl,
  validateLogInInput,
  validatePassword,
  validatePollInput,
  validateSignUpInput,
  validateUsername,
} from "./validationService";

describe("validationService", () => {
  it("validates auth fields thoroughly", () => {
    expect(validateEmail("bad-email")).toBe("Enter a valid email address.");
    expect(validateEmail("")).toBe("Email is required.");
    expect(validatePassword("short")).toBe("Password must have at least 8 characters.");
    expect(validatePassword("alllowercase1")).toBe("Password must include upper-case, lower-case, and a digit.");
    expect(validateUsername("a!")).toBe("Username must have at least 3 characters.");
    expect(validateUsername("bad name")).toBe("Username can use letters, numbers, dots, underscores, and dashes.");

    const signUpErrors = validateSignUpInput({
      username: "john_doe",
      email: "john@example.com",
      password: "GoodPass1",
    });

    expect(hasValidationErrors(signUpErrors)).toBe(false);
    expect(validateLogInInput({ email: "john@example.com", password: "secret" })).toEqual({
      email: undefined,
      password: undefined,
    });
  });

  it("rejects weak poll input and duplicate options", () => {
    const invalidPollErrors = validatePollInput({
      title: "abc",
      description: "short",
      imageUrl: "invalid-path",
      options: ["Messi", "messi"],
    });

    expect(invalidPollErrors.title).toBeTruthy();
    expect(invalidPollErrors.description).toBeTruthy();
    expect(invalidPollErrors.imageUrl).toBeTruthy();
    expect(invalidPollErrors.options).toBe("Poll options must be unique.");
  });

  it("accepts valid image urls and optional empty urls", () => {
    expect(validateImageUrl("https://example.com/image.png")).toBeUndefined();
    expect(validateImageUrl("/logo.png")).toBeUndefined();
    expect(validateImageUrl("")).toBeUndefined();
    expect(validateImageUrl("", true)).toBe("Image URL is required.");
  });

  it("validates dynamic marginality profile fields", () => {
    const errors = validateDynamicProfileValues(
      [
        { key: "age", label: "Age", inputType: "number", required: true, min: 13, max: 100 },
        { key: "country", label: "Country", inputType: "text", required: true },
      ],
      {
        age: "9",
        country: "",
      }
    );

    expect(errors.age).toBe("Age must be at least 13.");
    expect(errors.country).toBe("Country is required.");
  });

  it("validates numeric profile values above max and non-number input", () => {
    const overMaxErrors = validateDynamicProfileValues(
      [{ key: "age", label: "Age", inputType: "number", required: true, min: 13, max: 100 }],
      { age: "130" }
    );
    const nonNumberErrors = validateDynamicProfileValues(
      [{ key: "age", label: "Age", inputType: "number", required: true, min: 13, max: 100 }],
      { age: "abc" }
    );

    expect(overMaxErrors.age).toBe("Age must be at most 100.");
    expect(nonNumberErrors.age).toBe("Age must be a number.");
  });
});
