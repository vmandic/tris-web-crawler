import dotenv from "dotenv";
dotenv.config();

export function loadEnvSettings() {
  return {
    WEB_REQUESTS_LIMIT: parseInt(process.env.WEB_REQUESTS_LIMIT) || undefined,
    PATH_DEPTH: parseInt(process.env.PATH_DEPTH) || 3,
    USER_AGENTS: process.env.USER_AGENTS
      ? process.env.USER_AGENTS.split(",")
      : [],
    SKIP_WORDS: process.env.SKIP_WORDS ? process.env.SKIP_WORDS.split(",") : [],
    SORT_OUTPUT: process.env.SORT_OUTPUT === "true",
    DELAY_MS: parseInt(process.env.DELAY_MS) || 20,
    INCLUDE_PATH: process.env.INCLUDE_PATH || null,
    OUTPUT_HTTP_CODE: process.env.OUTPUT_HTTP_CODE === "true",
    TRIM_ENDING_SLASH: process.env.TRIM_ENDING_SLASH !== "false",
    TIMEOUT_MS: parseInt(process.env.TIMEOUT_MS) || 5000,
    EXCLUDE_QUERY_STRING: process.env.EXCLUDE_QUERY_STRING === "true",
    EXCLUDE_FRAGMENT: process.env.EXCLUDE_FRAGMENT === "true",
  };
}