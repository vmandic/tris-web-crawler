// starting point for HTTP server run mode
import express from "express";
import path, { dirname } from "path";
import { startScraping } from "./scraper.mjs";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { sortObjectByPropertyNames } from "./utils.mjs";
import { getSettings } from "./settings.mjs";

const app = express();
const httpPort = process.argv[2] || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files
app.use("/static", express.static(path.join(__dirname, "static")));

// Serve scrape.html for /scrape
app.get("/scrape", (req, res) => {
  res.sendFile(path.join(__dirname, "static", "scrape.html"));
});

app.get("/settings", (req, res) => {
  const settings = sortObjectByPropertyNames(getSettings());
  res.send(settings);
});

// Serve index.html for / and /index.html
app.get(["/", "/index.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "static/index.html"));
});

// Fallback for all other routes
app.use((req, res) => {
  res.status(404).send("The page you are looking for does not exist.");
});

 const httpServer = app.listen(httpPort, () => {
  console.log(`HTTP server is running on port ${httpPort}`);
});

// Create a WebSocket server attached to the HTTPS server
const wss = new WebSocketServer({
  server: httpServer
});

// Poor man's single-replica anti-abuse :-)
let scrapingConcurrentCount = 0;
function resetScrapingConcurrentCount() {
  if (scrapingConcurrentCount > 0) {
    setTimeout(() => {
      if (scrapingConcurrentCount > 0) {
        scrapingConcurrentCount--;
      }
    }, 10000);
  }
}

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("Client connected.");

  ws.send("Connection established.");

  ws.on("close", () => console.log("Client has disconnected."));

  ws.on("message", async (message) => {
    const url = message.toString("utf-8");

    if (!url) {
      ws.send("Error: Please provide a URL parameter.");
    } else {
      try {

        if (scrapingConcurrentCount > 3) {
          console.log("Rate limited");
          ws.send(`Scraper is limited to 3 scraping processes at a time, please try again in 10s`);
          resetScrapingConcurrentCount();
          ws.close();
          return;
        }

        scrapingConcurrentCount++;
        // TODO: implement a failsafe to unhook on client disconnect
        ws.send(`Starting scraper for URL: ${url}`);
        console.log(`Starting scraper for URL: ${url}`);
        await startScraping({
          initialUrl: url,
          saveScrapeFile: false,
          logCallbackFn: (result) => {
            // Send scrape results to the connected client
            ws.send(result);
          },
        });

        // Signal the end of scraping
        ws.close();

        if (scrapingConcurrentCount > 0) {
          scrapingConcurrentCount--;
        }
      } catch (error) {
        ws.send(`Error: ${error.message}`);
      }
    }
  });

  ws.onerror = function (event) {
    console.log(`Websocket error: ${JSON.stringify(event)}`);
  };
});

wss.on("error", (error) => {
  console.log("WebSocket Server Error:", error);
});
