"use strict";

const handleResize = () => {
  const headerHeight = document.querySelector("header").clientHeight;
  document.querySelector("main").style.marginTop = headerHeight + "px";
};

const scrollToBottom = () => {
  document.documentElement.scrollTop = document.documentElement.scrollHeight;
};

const shouldAutoScroll = () =>
  document.querySelector("#cb-autoscroll").checked;

window.addEventListener("resize", handleResize);

document.addEventListener("DOMContentLoaded", function () {
  handleResize();

  document
    .querySelector("a#nav-home")
    .setAttribute("href", window.location.origin);

  // Extract URL from the query string
  const urlParams = new URLSearchParams(window.location.search);
  const crawledUrl = urlParams.get("url");

  // Validate the URL format
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  if (!crawledUrl || !urlRegex.test(crawledUrl)) {
    document.getElementById("results").innerText =
      "Error: Invalid or missing URL. The URL must start with http (if not specified alike).";
  } else {
    // Display the extracted URL
    document.getElementById("crawledUrl").textContent = crawledUrl;

    // Extract port from the current window location
    const portNumber = Number(window.location.port);
    const port = portNumber ? `:${portNumber}` : "";

    const isSsl = window.location.protocol === "https:";
    const scheme = isSsl ? "wss" : "ws";

    // Establish WebSocket connection
    const socket = new WebSocket(
      `${scheme}://${window.location.hostname}${port}`
    );

    socket.onopen = function (event) {
      // The connection is open, send the crawled URL and kick off the crawler
      socket.send(crawledUrl);
    };

    // Handle errors during WebSocket connection
    socket.onerror = function (event) {
      document.getElementById(
        "results"
      ).innerText = `Error connecting to WebSocket: ${JSON.stringify(event)}`;
    };

    socket.onmessage = function (event) {
      const result = event.data;
      // Display the result in the 'results' pre element
      document.getElementById(
        "results"
      ).innerHTML += `<span class="result">${result}</span>\n`;

      if(shouldAutoScroll()) {
        scrollToBottom();
      }
    };

    // Close the WebSocket connection when scraping is complete
    socket.onclose = function (event) {
      if (event.code === 1006) {
        document.getElementById("results").innerHTML +=
          "<br>Error: WebSocket connection closed unexpectedly. " +
          JSON.stringify(event);
      } else {
        console.log("WebSocket closed.");
      }
    };
  }
});
