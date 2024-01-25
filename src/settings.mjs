import dotenv from "dotenv";
import randomUseragent from "random-useragent";
import fs from "fs";
dotenv.config();

let settings;
export function getSettings() {
  return (
    settings ||
    (settings = {
      WEB_REQUESTS_LIMIT: parseInt(process.env.WEB_REQUESTS_LIMIT) || undefined,
      PATH_DEPTH: parseInt(process.env.PATH_DEPTH) || 3,
      USE_RANDOM_AGENTS_COUNT: getUserRandomAgentsCount(),
      USER_AGENTS: getUserAgents(),
      SKIP_WORDS: process.env.SKIP_WORDS
        ? process.env.SKIP_WORDS.split(",")
        : [],
      SORT_OUTPUT: process.env.SORT_OUTPUT === "true",
      DELAY_MS: parseInt(process.env.DELAY_MS) || 20,
      INCLUDE_PATH: process.env.INCLUDE_PATH || null,
      OUTPUT_HTTP_CODE: process.env.OUTPUT_HTTP_CODE === "true",
      TRIM_ENDING_SLASH: process.env.TRIM_ENDING_SLASH !== "false",
      TIMEOUT_MS: parseInt(process.env.TIMEOUT_MS) || 5000,
      EXCLUDE_QUERY_STRING: process.env.EXCLUDE_QUERY_STRING === "true",
      EXCLUDE_FRAGMENT: process.env.EXCLUDE_FRAGMENT === "true",
      WSS_PRIVATE_KEY: getWssPrivateKey(),
    })
  );
}

function getWssPrivateKey() {
  let key = process.env.WSS_PRIVATE_KEY;
  if (!key) {
    try {
      console.log("Using WSS SSL key from existing file: certs/tris-self-signed-key.pem");
      key = fs.readFileSync("certs/tris-self-signed-key.pem", "utf-8");
    } catch (error) {
      throw new Error(
        `Could not load a default WSS key file: ` +
        `certs/tris-self-signed-key.pem, details: ${JSON.stringify(error)}`
      );
    }
  } else {
    // ref: https://stackoverflow.com/a/74668003/1534753
    key = key.split(String.raw`\n`).join('\n');
    console.log("WSS SSL key loaded from .env, writing it to: certs/tris-self-signed-key.pem");
    fs.writeFileSync("certs/tris-self-signed-key.pem", key);
    console.log("WSS SSL key recorded to file")
  }

  return key;
}

function getUserRandomAgentsCount() {
  return process.env.USE_RANDOM_AGENTS_COUNT || 0;
}

function getUserAgents() {
  const randomAgentsCount = getUserRandomAgentsCount();

  if (randomAgentsCount && randomAgentsCount < 1) {
    return process.env.USER_AGENTS
      ? process.env.USER_AGENTS.split("\\")
      : ["tris-simple-spider-scraper v1"];
  }

  let agents = [];

  for (let i = 0; i < randomAgentsCount; i++) {
    agents.push(randomUseragent.getRandom());
  }

  return agents;
}
