import type { MarginalityCategoryDefinition } from "../domain/MarginalityTest";

export type ValidationErrors<T extends string> = Partial<Record<T, string>>;

export type PollInput = {
  title: string;
  description: string;
  imageUrl: string;
  options: string[];
};

export function validateEmail(email: string): string | undefined {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    return "Email is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return "Enter a valid email address.";
  }

  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Password is required.";
  }

  if (password.length < 8) {
    return "Password must have at least 8 characters.";
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include upper-case, lower-case, and a digit.";
  }

  return undefined;
}

export function validateUsername(username: string): string | undefined {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return "Username is required.";
  }

  if (normalizedUsername.length < 3) {
    return "Username must have at least 3 characters.";
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(normalizedUsername)) {
    return "Username can use letters, numbers, dots, underscores, and dashes.";
  }

  return undefined;
}

export function validateImageUrl(imageUrl: string, isRequired = false): string | undefined {
  const normalizedUrl = imageUrl.trim();

  if (!normalizedUrl) {
    return isRequired ? "Image URL is required." : undefined;
  }

  if (!/^https?:\/\/.+|^\/.+/.test(normalizedUrl)) {
    return "Use an absolute URL or a local path starting with /.";
  }

  return undefined;
}

export function validatePollInput(pollInput: PollInput): ValidationErrors<"title" | "description" | "imageUrl" | "options"> {
  const errors: ValidationErrors<"title" | "description" | "imageUrl" | "options"> = {};
  const normalizedOptions = pollInput.options.map((option) => option.trim()).filter(Boolean);

  if (!pollInput.title.trim()) {
    errors.title = "Title is required.";
  } else if (pollInput.title.trim().length < 5) {
    errors.title = "Title should have at least 5 characters.";
  }

  if (!pollInput.description.trim()) {
    errors.description = "Description is required.";
  } else if (pollInput.description.trim().length < 10) {
    errors.description = "Description should have at least 10 characters.";
  }

  const imageUrlError = validateImageUrl(pollInput.imageUrl);

  if (imageUrlError) {
    errors.imageUrl = imageUrlError;
  }

  if (normalizedOptions.length < 2) {
    errors.options = "At least two poll options are required.";
  } else if (new Set(normalizedOptions.map((option) => option.toLowerCase())).size !== normalizedOptions.length) {
    errors.options = "Poll options must be unique.";
  }

  return errors;
}

export function validateLogInInput(input: {
  email: string;
  password: string;
}): ValidationErrors<"email" | "password"> {
  return {
    email: validateEmail(input.email),
    password: input.password ? undefined : "Password is required.",
  };
}

export function validateSignUpInput(input: {
  username: string;
  email: string;
  password: string;
}): ValidationErrors<"username" | "email" | "password"> {
  return {
    username: validateUsername(input.username),
    email: validateEmail(input.email),
    password: validatePassword(input.password),
  };
}

export function validateDynamicProfileValues(
  fields: MarginalityCategoryDefinition[],
  values: Record<string, string>
): Record<string, string> {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    const rawValue = values[field.key] ?? "";
    const normalizedValue = rawValue.trim();

    if (field.required && !normalizedValue) {
      errors[field.key] = `${field.label} is required.`;
      return;
    }

    if (!normalizedValue) {
      return;
    }

    if (field.inputType === "number") {
      const numericValue = Number(rawValue);

      if (Number.isNaN(numericValue)) {
        errors[field.key] = `${field.label} must be a number.`;
        return;
      }

      if (typeof field.min === "number" && numericValue < field.min) {
        errors[field.key] = `${field.label} must be at least ${field.min}.`;
        return;
      }

      if (typeof field.max === "number" && numericValue > field.max) {
        errors[field.key] = `${field.label} must be at most ${field.max}.`;
      }
    }
  });

  return errors;
}

export function hasValidationErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
