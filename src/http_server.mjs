// starting point for HTTP server run mode
import express from "express";
import path, { dirname } from "path";
import { startCrawling } from "./crawler.mjs";
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

// Serve crawl.html for /crawl
app.get("/crawl", (req, res) => {
  res.sendFile(path.join(__dirname, "static", "crawl.html"));
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
let crawlingConcurrentCount = 0;
function resetScrapingConcurrentCount() {
  if (crawlingConcurrentCount > 0) {
    setTimeout(() => {
      if (crawlingConcurrentCount > 0) {
        crawlingConcurrentCount--;
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

        if (crawlingConcurrentCount > 3) {
          console.log("Rate limited");
          ws.send(`Crawler is limited to 3 scraping processes at a time, please try again in 10s`);
          resetScrapingConcurrentCount();
          ws.close();
          return;
        }

        crawlingConcurrentCount++;
        // TODO: implement a failsafe to unhook on client disconnect
        ws.send(`Starting Crawler for URL: ${url}`);
        console.log(`Starting Crawler for URL: ${url}`);
        await startCrawling({
          initialUrl: url,
          saveCrawlFile: false,
          logCallbackFn: (result) => {
            // Send crawling results to the connected client
            ws.send(result);
          },
        });

        // Signal the end of scraping
        ws.close();

        if (crawlingConcurrentCount > 0) {
          crawlingConcurrentCount--;
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
