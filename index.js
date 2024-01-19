import { startScraping } from "./src/scraper.mjs";

let initialUrl = process.argv[2];

// NOTE: when debugging via vscode launchProfile.json we are off by one
if (initialUrl.indexOf("index.js") > -1) {
  initialUrl = process.argv[3];
}

// NOTE: only for debug
// console.log("Command-line arguments:", process.argv);

if (!initialUrl) {
  throw new Error("Please provide a URL as the first command-line argument.");
}

const log = (msg) => console.log(msg);

startScraping({ initialUrl, logCallbackFn: log, saveScrapeFile: true }).catch(
  (error) => console.error(`Error: ${error.message}`)
);
