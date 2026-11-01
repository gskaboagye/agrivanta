import { parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod";

// Normalize email addresses consistently across AgriVanta.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address." }).max(254));

// Validate phone numbers using Ghana as the default country.
// International numbers beginning with + are parsed using their country code.
export function normalizePhoneNumber(value: string): string | null {
  const input = value.trim();

  if (!input) return null;

  if (input.length > 30) return null;

  const phoneNumber = parsePhoneNumberFromString(
    input,
    input.startsWith("+") ? undefined : "GH"
  );

  if (!phoneNumber || !phoneNumber.isValid()) {
    return null;
  }

  return phoneNumber.number;
}

// Optional phone number: blank is allowed, invalid non-empty values are rejected.
export const optionalPhoneSchema = z
  .string()
  .trim()
  .max(30, "Phone number is too long.")
  .transform((value, context) => {
    if (!value) return "";

    const normalized = normalizePhoneNumber(value);

    if (!normalized) {
      context.addIssue({
        code: "custom",
        message: "Enter a valid phone number, including the country code.",
      });
      return z.NEVER;
    }

    return normalized;
  });
