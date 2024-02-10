import axios from "axios";
import cheerio, { CheerioAPI } from "cheerio";
import url from "url";
import fs from "fs/promises";
import { getSettings } from "./settings";
import { isSameDomain } from "./utils";

const {
  WEB_REQUESTS_LIMIT,
  PATH_DEPTH,
  INCLUDE_PATH,
  USER_AGENTS,
  TIMEOUT_MS,
  SKIP_WORDS,
  OUTPUT_HTTP_CODE,
  DELAY_MS,
  SORT_FILE_OUTPUT,
  TRIM_ENDING_SLASH,
  EXCLUDE_QUERY_STRING,
  EXCLUDE_FRAGMENT,
} = getSettings();

function filterLinksFromCurrentPage(
  links: any[],
  resolvedUrl: any,
  baseUrl: string,
  attemptedLinks: any
) {
  const parsedBaseUrl = url.parse(baseUrl);
  const parsedDomain = `${parsedBaseUrl.protocol}//${parsedBaseUrl.hostname}`;

  links = links ??= [];
  links = links.map((link: string) => {
    // Convert domain root relative link to absolute link
    if (link[0] === "/") {
      link = `${parsedDomain}${link}`;
    }

    // Convert relative link to absolute link
    if (!url.parse(link).hostname) {
      link = `${resolvedUrl}/${link}`;
    }

    link = transformLink(link);
    return link;
  });

  links = links.filter((link: any) => {
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

function extractLinksFromAnchorElements($doc: CheerioAPI) {
  return Array.from(
    new Set(
      $doc("a[href]")
        .map((_: any, element: any) => $doc(element).attr("href"))
        .get()
    )
  );
}

async function crawlRecursive(opts: {
  baseUrl: any;
  relativeUrl?: any;
  currentDepth?: any;
  attemptedLinks?: Map<string, number>;
  logCallbackFn: any;
  counter: any;
}) {
  let {
    baseUrl,
    relativeUrl,
    currentDepth,
    attemptedLinks,
    logCallbackFn,
    counter,
  } = opts;

  currentDepth = currentDepth || 0;
  attemptedLinks = attemptedLinks || new Map<string, number>();

  let resolvedUrl;
  let statusCode;

  try {
    // Check if the total number of requests exceeds the limit
    if (WEB_REQUESTS_LIMIT && counter.totalRequests >= WEB_REQUESTS_LIMIT) {
      if (!counter.limited) {
        logCallbackFn(`Requests limit (${WEB_REQUESTS_LIMIT}) reached.`);
        counter.limited = true;
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

    counter.totalRequests++;
    const response = await axios.get(resolvedUrl, {
      headers: { "User-Agent": randomUserAgent },
      timeout: TIMEOUT_MS,
    });

    statusCode = response.status;

    const html = response.data;
    const $doc = cheerio.load(html);

    let pageLinks = extractLinksFromAnchorElements($doc);
    pageLinks = filterLinksFromCurrentPage(
      pageLinks,
      resolvedUrl,
      baseUrl,
      attemptedLinks
    );

    logCallbackFn(
      `Request ${
        counter.totalRequests
      }, visited: ${resolvedUrl}, new domain links found: ${pageLinks.length}${
        OUTPUT_HTTP_CODE ? ` | ${statusCode}` : ""
      }`
    );

    attemptedLinks.set(resolvedUrl, statusCode);

    for (const link of pageLinks) {
      if (!attemptedLinks.has(link)) {
        const nextDepth = currentDepth + 1;
        await crawlRecursive({
          baseUrl: resolvedUrl,
          relativeUrl: link,
          currentDepth: nextDepth,
          attemptedLinks,
          logCallbackFn,
          counter,
        });
      }
    }

    // Introduce a delay before making the next request
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      // Axios-specific error (network issue, timeout, etc.)
      console.warn(
        `HTTP error for ${resolvedUrl || relativeUrl}: ${error.message}`
      );
    }

    if (resolvedUrl) {
      attemptedLinks.set(resolvedUrl, error.response?.status);
    } else {
      logCallbackFn(
        "Request ${counter.totalRequests}, error: " +
          `failed to resolve URL | ${
            error.response?.status || "STATUS_UNKNOWN"
          }`
      );
    }

    logCallbackFn(
      `Request ${counter.totalRequests}, error: ${
        resolvedUrl || relativeUrl
      } | ${error.response?.status || "STATUS_UNKNOWN"}`
    );
  }

  return attemptedLinks;
}

function isValidLink(
  link: string,
  baseUrl: string,
  attemptedLinks: { has: (arg0: any) => any }
) {
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

function transformLink(link: string | URL) {
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

export async function startCrawling(opts: {
  initialUrl: any;
  logCallbackFn: any;
  saveCrawlFile: any;
}) {
  let { initialUrl, logCallbackFn, saveCrawlFile } = opts;
  const startTimestamp = performance.now();

  // Start the crawler with the initial URL, trim end '/' if specified
  if (initialUrl.endsWith("/")) {
    initialUrl = initialUrl.slice(0, -1);
  }

  // Make sure we pass it as reference so it can get accessed
  // across different recursive calls
  const counter = { totalRequests: 0, limited: false };

  const attemptedLinks =
    (await crawlRecursive({ baseUrl: initialUrl, logCallbackFn, counter })) ||
    new Map<string, number>();

  if (attemptedLinks.size == 0) {
    logCallbackFn("No links were crawled. Check your crawler settings.");
    return;
  }

  if (saveCrawlFile) {
    const formattedDate = new Date()
      .toISOString()
      .replace(/[-T:]/g, "")
      .slice(0, 12);
    const outputName = `s${formattedDate}-${encodeURIComponent(
      initialUrl
    )}.out`;
    await writeCrawlFile(attemptedLinks, outputName);
  }

  const endTimestamp = performance.now();
  const executionTimeMs = endTimestamp - startTimestamp;
  const executionTimeSec = (executionTimeMs / 1000).toFixed(2);
  logCallbackFn(
    `Crawling completed. Crawler execution time ${executionTimeSec}s.`
  );
}

async function writeCrawlFile(
  attemptedLinks: Map<string, number>,
  outputName: string
) {
  // After crawling is complete, convert the Set to an array
  let linksArray = Array.from(attemptedLinks);

  // Sort the array if SORT_FILE_OUTPUT is trues
  if (SORT_FILE_OUTPUT) {
    linksArray.sort();
  }

  // Write the array to the output file with optional HTTP status code
  await fs.writeFile(
    outputName,
    linksArray
      .map(([url, statusCode]) => {
        return `${url}${
          OUTPUT_HTTP_CODE ? `${"|" + statusCode || "|N/A"}` : ""
        }`;
      })
      .join("\n"),
    "utf-8"
  );
}
