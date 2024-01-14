import axios from "axios";
import cheerio from "cheerio";
import url from "url";
import fs from "fs/promises";
import { loadEnvSettings } from "./settings.mjs";
import { isSameDomain } from "./utils.mjs";

const {
  WEB_REQUESTS_LIMIT,
  PATH_DEPTH,
  INCLUDE_PATH,
  USER_AGENTS,
  TIMEOUT_MS,
  SKIP_WORDS,
  OUTPUT_HTTP_CODE,
  DELAY_MS,
  SORT_OUTPUT,
  TRIM_ENDING_SLASH,
  EXCLUDE_QUERY_STRING,
  EXCLUDE_FRAGMENT,
} = loadEnvSettings();



function filterLinksFromCurrentPage(links, resolvedUrl, baseUrl, attemptedLinks) {
  const parsedBaseUrl = url.parse(baseUrl);
  const parsedDomain = `${parsedBaseUrl.protocol}//${parsedBaseUrl.hostname}`;

  links = links.map((link) => {
    // Convert domain root relative link to absolute link
    if (link[0] === '/') {
      link = `${parsedDomain}${link}`;
    }

    // Convert relative link to absolute link
    if (!url.parse(link).hostname) {
      link = `${resolvedUrl}/${link}`;
    }

    link = transformLink(link);
    return link;
  });

  links = links.filter((link) => {
    if (link == resolvedUrl) {
      return false;
    }

    if (!isValidLink(link, baseUrl, attemptedLinks)) {
      return false;
    }

    return true;
  });

  // dedupe
  return Array.from(new Set(links));
}

function extractLinksFromAnchorElements($doc) {
  return Array.from(new Set($doc("a[href]")
    .map((_, element) => $doc(element).attr("href"))
    .get()));
}

let totalRequests = 0;
let limited = false;
async function scrapeRecursive(
  baseUrl,
  relativeUrl,
  currentDepth,
  attemptedLinks
) {
  currentDepth = currentDepth || 0;
  attemptedLinks = attemptedLinks || new Map();

  let resolvedUrl;
  let statusCode;

  try {
    // Check if the total number of requests exceeds the limit
    if (WEB_REQUESTS_LIMIT && totalRequests >= WEB_REQUESTS_LIMIT) {
      if (!limited) {
        console.log(`Requests limit (${WEB_REQUESTS_LIMIT}) reached.`);
        limited = true;
      }
      return;
    }

    // Check path depth
    if (currentDepth > PATH_DEPTH) {
      return;
    }

    resolvedUrl = url.resolve(baseUrl || "", relativeUrl || "");
    resolvedUrl = transformLink(resolvedUrl);
    if (!isValidLink(resolvedUrl, baseUrl, attemptedLinks)) {
      return;
    }

    // Get a random UA for more randomness when requesting
    const randomUserAgent =
      USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    totalRequests++;
    const response = await axios.get(resolvedUrl, {
      headers: { "User-Agent": randomUserAgent },
      timeout: TIMEOUT_MS,
    });

    statusCode = response.status;

    const html = response.data;
    const $doc = cheerio.load(html);

    let pageLinks = extractLinksFromAnchorElements($doc);
    pageLinks = filterLinksFromCurrentPage(pageLinks, resolvedUrl, baseUrl, attemptedLinks);

    console.log(
      `Request ${totalRequests}, visited: ${resolvedUrl}, new domain links found: ${pageLinks.length}${
        OUTPUT_HTTP_CODE ? ` | ${statusCode}` : ""
      }`
    );

    attemptedLinks.set(resolvedUrl, statusCode);

    for (const link of pageLinks) {
      if (!attemptedLinks.has(link)) {
        const nextDepth = currentDepth + 1;
        await scrapeRecursive(resolvedUrl, link, nextDepth, attemptedLinks);
      }
    }

    // Introduce a delay before making the next request
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Axios-specific error (network issue, timeout, etc.)
      console.error(`Axios HTTP error for ${resolvedUrl || relativeUrl}: ${error.message}`);
    }

    attemptedLinks.set(resolvedUrl, error.response?.status);
    console.error(
      `Request ${totalRequests}, error: ${resolvedUrl || relativeUrl}: ${
        error.message
      }${error.response ? `, HTTP ${error.response.status}` : ""}`
    );
  }

  return attemptedLinks;
}

function isValidLink(link, baseUrl, attemptedLinks) {
  if (attemptedLinks.has(link)) {
    return false;
  }

  // Check if INCLUDE_PATH is specified and if the pathname
  // of resolvedUrl includes the specified path pattern
  if (INCLUDE_PATH && !new URL(link).pathname.includes(INCLUDE_PATH)) {
    // NOTE: uncomment for debugging, might cause a lot of noise
    // console.log("Skip URL: " + resolvedUrl);
    return false;
  }

  // If the link was already attempted let's skip visiting it again
  if (attemptedLinks.has(link)) {
    return false;
  }

  // Check skip words, ie. skip links with any of the skip words
  if (SKIP_WORDS.some((word) => link.includes(word))) {
    return false;
  }

  const areSameDomains = isSameDomain(link, baseUrl);
  return areSameDomains;
}

function transformLink(link) {
  const urlObject = new URL(link);

  // Remove query string ie. ?
  if (EXCLUDE_QUERY_STRING) {
    urlObject.search = "";
  }

  // Remove fragment ie. #
  if (EXCLUDE_FRAGMENT) {
    urlObject.hash = "";
  }

  link = urlObject.toString();

  if (TRIM_ENDING_SLASH && link.endsWith("/")) {
    link = link.slice(0, -1);
  }

  return link;
}

export async function startScraping(initialUrl) {
  const startTimestamp = performance.now();
  const now = new Date();
  const formattedDate = now.toISOString().replace(/[-T:]/g, "").slice(0, 14);
  const outputName = `spider-output-${formattedDate}.out`;

  // Start the scraper with the initial URL, trim end '/' if specified
  if (initialUrl.endsWith("/")) {
    initialUrl = initialUrl.slice(0, -1);
  }
  const attemptedLinks = (await scrapeRecursive(initialUrl)) || [];
  // After scraping is complete, convert the Set to an array

  if (attemptedLinks.length == 0) {
    console.warn("No links were scraped. Check your scraper settings.");
    return;
  }

  let linksArray = Array.from(attemptedLinks);

  // Sort the array if SORT_OUTPUT is trues
  if (SORT_OUTPUT) {
    linksArray.sort();
  }

  // Write the array to the output file with optional HTTP status code
  await fs.writeFile(
    outputName,
    linksArray
      .map(
        ([url, statusCode]) =>
          `${url}${OUTPUT_HTTP_CODE ? `${"|" + statusCode || "|N/A"}` : ""}`
      )
      .join("\n"),
    "utf-8"
  );

  const endTimestamp = performance.now();
  const executionTimeMs = endTimestamp - startTimestamp;
  const executionTimeSec = (executionTimeMs / 1000).toFixed(2);
  console.log(
    `Scraping completed. Scraper execution time ${executionTimeSec}s.`
  );
}