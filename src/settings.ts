import dotenv from "dotenv";
import randomUseragent from "random-useragent";
dotenv.config();

let settings: {
  WEB_REQUESTS_LIMIT: number | undefined;
  PATH_DEPTH: number;
  USE_RANDOM_AGENTS_COUNT: string | number;
  USER_AGENTS: string[];
  SKIP_WORDS: string[];
  SORT_FILE_OUTPUT: boolean;
  DELAY_MS: number;
  INCLUDE_PATH: string | null;
  OUTPUT_HTTP_CODE: boolean;
  TRIM_ENDING_SLASH: boolean;
  TIMEOUT_MS: number;
  EXCLUDE_QUERY_STRING: boolean;
  EXCLUDE_FRAGMENT: boolean;
};

export function getSettings() {
  return (
    settings ||
    (settings = {
      WEB_REQUESTS_LIMIT: parseInt(process.env["WEB_REQUESTS_LIMIT"] || "") || undefined,
      PATH_DEPTH: parseInt(process.env["PATH_DEPTH"] || "3"),
      USE_RANDOM_AGENTS_COUNT: getUserRandomAgentsCount(),
      USER_AGENTS: getUserAgents(),
      SKIP_WORDS: process.env["SKIP_WORDS"]
        ? process.env["SKIP_WORDS"].split(",")
        : [],
      SORT_FILE_OUTPUT: process.env["SORT_FILE_OUTPUT"] === "true",
      DELAY_MS: parseInt(process.env["DELAY_MS"] || "20"),
      INCLUDE_PATH: process.env["INCLUDE_PATH"] || null,
      OUTPUT_HTTP_CODE: process.env["OUTPUT_HTTP_CODE"] === "true",
      TRIM_ENDING_SLASH: process.env["TRIM_ENDING_SLASH"] !== "false",
      TIMEOUT_MS: parseInt(process.env["TIMEOUT_MS"] || "5000"),
      EXCLUDE_QUERY_STRING: process.env["EXCLUDE_QUERY_STRING"] === "true",
      EXCLUDE_FRAGMENT: process.env["EXCLUDE_FRAGMENT"] === "true",
    })
  );
}

function getUserRandomAgentsCount() : number {
  return parseInt(process.env["USE_RANDOM_AGENTS_COUNT"] || "0");
}

function getUserAgents() {
  const randomAgentsCount = getUserRandomAgentsCount();

  if (randomAgentsCount && randomAgentsCount < 1) {
    return process.env["USER_AGENTS"]
      ? process.env["USER_AGENTS"].split("\\")
      : ["tris-web-crawler v1"]; // TODO: interpret active version
  }

  let agents = [];

  for (let i = 0; i < randomAgentsCount; i++) {
    agents.push(randomUseragent.getRandom());
  }

  return agents;
}
