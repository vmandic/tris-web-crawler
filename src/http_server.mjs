// starting point for HTTP server run mode
import express from "express";
import path, { dirname } from "path";
import { startScraping } from "./scraper.mjs";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { sortObjectByPropertyNames } from "./utils.mjs";
import { getSettings } from "./settings.mjs";
import http from "http";
import https from "https";
import fs from "fs";

const app = express();
const httpPort = process.argv[2] || 8080;
const httpsPort = Number(httpPort) + 2;

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
  settings.WSS_PRIVATE_KEY = "REDACTED";
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

const sslKey = fs.readFileSync("certs/tris-self-signed-key.pem", "utf8");
// Load SSL certificate and key
if (!sslKey || !sslKey.startsWith("-----BEGIN PRIVATE KEY-----")) {
  throw new Error("Invalid private key: " + WSS_PRIVATE_KEY);
} else {
  console.log("WSS SSL cert successfully read, applying it to web server configuration");
}

const sslCert = fs.readFileSync("certs/tris-self-signed-cert.pem", "utf8");

// Create an HTTPS server with the SSL certificate and key
const httpsServer = https.createServer(
  {
    key: sslKey,
    cert: sslCert,
  },
  app
);

// Create an HTTP server
const httpServer = http.createServer(app);

// Create a WebSocket server attached to the HTTPS server
const wss = new WebSocketServer({
  server: httpsServer,
  rejectUnauthorized: false,
});

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
        // TODO: implement a failsafe to unhook on client disconnect
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

// Start the servers
httpsServer.listen(httpsPort, () => {
  console.log(`HTTPS/WSS server is running on port ${httpsPort}`);
});

httpServer.listen(httpPort, () => {
  console.log(`HTTP server is running on port ${httpPort}`);
});
