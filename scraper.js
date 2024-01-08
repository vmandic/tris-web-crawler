require("dotenv").config();

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs").promises;
const url = require("url");

const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS) || 10;
const PATH_DEPTH = parseInt(process.env.PATH_DEPTH) || 3;
const USER_AGENTS = process.env.USER_AGENTS
  ? process.env.USER_AGENTS.split(",")
  : [];
const SKIP_WORDS = process.env.SKIP_WORDS
  ? process.env.SKIP_WORDS.split(",")
  : [];
const SORT_OUTPUT = process.env.SORT_OUTPUT === "true";
const DELAY_MS = parseInt(process.env.DELAY_MS) || 0;
const INCLUDE_PATH = process.env.INCLUDE_PATH || null;
const OUTPUT_HTTP_CODE = process.env.OUTPUT_HTTP_CODE === "true";
const REQS_LIMIT = parseInt(process.env.REQS_LIMIT) || 0;

const now = new Date();
const formattedDate = now.toISOString().replace(/[-T:]/g, "").slice(0, 14);

const outputName = `spider-output-${formattedDate}.out`;
const visitedLinks = new Map();
let totalRequests = 0;
let limited = false;

async function scrape(baseUrl, relativeUrl, currentDepth = 0) {
  let resolvedUrl;
  let statusCode;

  try {
    // Check if the total number of requests exceeds the limit
    if (REQS_LIMIT > 0 && totalRequests >= REQS_LIMIT) {
      if (!limited)
      {
        console.log("Requests limit reached. Stopping further scraping.");
        limited = true;
      }
      return;
    }

    // Check path depth
    if (currentDepth > PATH_DEPTH) {
      return;
    }

    resolvedUrl = url.resolve(baseUrl || "", relativeUrl || "");

    // Check if INCLUDE_PATH is specified and if the pathname of resolvedUrl includes the specified path pattern
    if (INCLUDE_PATH && !new URL(resolvedUrl).pathname.includes(INCLUDE_PATH)) {
      // console.log("Skip URL: " + resolvedUrl);
      return;
    }

    // Check user-agent headers
    const randomUserAgent =
      USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const response = await axios.get(resolvedUrl, {
      headers: { "User-Agent": randomUserAgent },
      timeout: TIMEOUT_MS,
    });

    totalRequests++;
    statusCode = response.status;

    // Check skip words
    if (SKIP_WORDS.some((word) => resolvedUrl.includes(word))) {
      return;
    }

    const html = response.data;
    const $ = cheerio.load(html);

    let links = $("a[href]")
      .map((_, element) => $(element).attr("href"))
      .get();
    const domain = new URL(resolvedUrl).hostname;

    links = links.map((link) =>{
      // Check if link is relative and does not contain the domain
      if (!url.parse(link).hostname) {
        return url.resolve(resolvedUrl, link);
      }

      return link;
    });

    const domainLinks = links.filter(
      (link) => url.parse(link).hostname === domain
    );

    console.log(`Visited: ${resolvedUrl}${OUTPUT_HTTP_CODE ? ` | ${statusCode}` : ""}`);
    visitedLinks.set(resolvedUrl, statusCode);

    for (const link of domainLinks) {
      if (!visitedLinks.has(link)) {
        await scrape(resolvedUrl, link, currentDepth + 1);
      }
    }

    // Introduce a delay before making the next request
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  } catch (error) {
    visitedLinks.set(resolvedUrl, error.response.status);
    console.error(
      `Error scraping: ${resolvedUrl || relativeUrl}: ${error.message}${
        error.response ? `, HTTP ${error.response.status}` : ""
      }`
    );
  }
}

const initialUrl = process.argv[2];

if (!initialUrl) {
  throw new Error("Please provide a URL as the first command-line argument.");
}

// Define an async function to use await
async function startScraping() {
  // Start the scraper with the initial URL
  await scrape(initialUrl);

  // After scraping is complete, convert the Set to an array
  let linksArray = Array.from(visitedLinks);

  // Sort the array if SORT_OUTPUT is true
  if (SORT_OUTPUT) {
    linksArray.sort();
  }

// Write the array to the output file with optional HTTP status code
await fs.writeFile(
  outputName,
  linksArray
    .map(([url, statusCode]) => `${url}${OUTPUT_HTTP_CODE ? `${"|" + statusCode || "|N/A"}` : ""}`)
    .join("\n"),
  "utf-8"
);

  console.log("Scraping completed.");
}

// Call the async function
startScraping().catch((error) => console.error(`Error: ${error.message}`));
