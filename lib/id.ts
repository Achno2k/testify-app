import { customAlphabet } from "nanoid";

// Lowercase alphanumeric, no ambiguous characters. URL-safe.
const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
export const newId = customAlphabet(alphabet, 10);
