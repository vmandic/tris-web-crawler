import express from "express";
import path, { dirname } from "path";
import { startScraping } from "./scraper.mjs";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

const app = express();
const port = process.argv[2] || 8080;
const wsPort = Number(port) + 1;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files
app.use("/static", express.static(path.join(__dirname, "static")));

// Serve scrape.html for /scrape
app.get("/scrape", (req, res) => {
  res.sendFile(path.join(__dirname, "static", "scrape.html"));
});

// Serve index.html for / and /index.html
app.get(["/", "/index.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "static/index.html"));
});

// Fallback for all other routes
app.use((req, res) => {
  res.status(404).send("The page you are looking for does not exist.");
});

// Create a WebSocket server
const wss = new WebSocketServer({ port: wsPort });

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("Client connected.");

  ws.send("Connection established.");

  ws.on("close", () => console.log("Client has disconnected."));

  ws.on("message", async (message) => {
    const url = message.toString('utf-8');

    if (!url) {
      ws.send("Error: Please provide a URL parameter.");
    } else {
      try {
        ws.send(`Starting scraper for URL: ${url}`);
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
