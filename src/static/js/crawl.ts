const handleResize = (): void => {
  const headerElement = document.querySelector("header") as HTMLElement | null;
  if (headerElement) {
    const mainElement = document.querySelector("main") as HTMLElement | null;
    if (mainElement) {
      mainElement.style.marginTop = headerElement.clientHeight + "px";
    }
  }
};

const scrollToBottom = (): void => {
  document.documentElement.scrollTop = document.documentElement.scrollHeight;
};

const shouldAutoScroll = (): boolean => {
  const autoScrollElement = document.querySelector(
    "#cb-autoscroll"
  ) as HTMLInputElement | null;
  if (autoScrollElement) {
    return autoScrollElement.checked;
  }
  return false;
};

window.addEventListener("resize", handleResize);

const getResultsElement = (): HTMLElement | null => {
  return document.getElementById("results");
};

document.addEventListener("DOMContentLoaded", function () {
  handleResize();

  const navHomeElement = document.querySelector(
    "a#nav-home"
  ) as HTMLElement | null;
  if (navHomeElement) {
    navHomeElement.setAttribute("href", window.location.origin);
  }

  // Extract URL from the query string
  const urlParams = new URLSearchParams(window.location.search);
  const crawledUrl = urlParams.get("url");

  // Validate the URL format
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  const resultsElement = getResultsElement();
  if (!crawledUrl || !urlRegex.test(crawledUrl)) {
    if (resultsElement) {
      resultsElement.innerText =
        "Error: Invalid or missing URL. The URL must" +
        " start with http (if not specified alike).";
    }
  } else {
    // Display the extracted URL
    const crawledUrlInput = document.getElementById(
      "crawledUrl"
    ) as HTMLInputElement | null;
    if (crawledUrlInput) {
      crawledUrlInput.textContent = crawledUrl;
    }

    // Extract port from the current window location
    const portNumber = Number(window.location.port);
    const port = portNumber ? `:${portNumber}` : "";

    const isSsl = window.location.protocol === "https:";
    const scheme = isSsl ? "wss" : "ws";

    // Establish WebSocket connection
    const socket = new WebSocket(
      `${scheme}://${window.location.hostname}${port}`
    );

    socket.onopen = (): void => {
      // The connection is open, send the crawled URL and kick off the crawler
      socket.send(crawledUrl);
    };

    // Handle errors during WebSocket connection
    socket.onerror = (event): void => {
      if (resultsElement) {
        resultsElement.innerText = `Error connecting to WebSocket: ${JSON.stringify(
          event
        )}`;
      }
    };

    socket.onmessage = (event): void => {
      const result = event.data;
      // Display the result in the 'results' pre element
      if (resultsElement) {
        resultsElement.innerHTML += `<span class="result">${result}</span>\n`;
      }

      if (shouldAutoScroll()) {
        scrollToBottom();
      }
    };

    // Close the WebSocket connection when scraping is complete
    socket.onclose = function (event) {
      if (event.code === 1006) {
        if (resultsElement) {
          resultsElement.innerHTML +=
            "<br>Error: WebSocket connection closed unexpectedly. " +
            JSON.stringify(event);
        }
      } else {
        console.log("WebSocket closed.");
      }
    };
  }
});
