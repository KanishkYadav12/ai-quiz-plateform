import "dotenv/config";

/**
 * Reads an environment variable.
 * Throws immediately on startup if a required variable is missing.
 * Pass a defaultValue to make it optional.
 */
export const getEnv = (key, defaultValue) => {
  const value = process.env[key];

  if (value === undefined || value === "") {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(
      `[ENV] Missing required environment variable: "${key}"\n` +
        `Make sure it is defined in your .env file.`,
    );
  }

  return value;
};

// Validate all required vars at import time so the server
// refuses to start instead of failing at runtime.
const REQUIRED_VARS = ["MONGODB_URL", "JWT_SECRET", "GEMINI_API_KEY"];

for (const key of REQUIRED_VARS) {
  getEnv(key); // throws if missing
}
