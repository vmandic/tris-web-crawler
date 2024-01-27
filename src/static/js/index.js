"use strict";

const loadCrawlerSettings = () => {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", "/settings", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      document.querySelector("#settings").innerText = JSON.stringify(
        JSON.parse(xhr.responseText),
        null,
        2
      );
    }
  };
  xhr.send();
};

const setCrawlLink = () => {
  const absoluteLink = document.querySelector("#crawl-link").getAttribute("href");
  document.querySelector("#crawl-link-text").innerHTML = window.location.origin + absoluteLink;
};

document.addEventListener("DOMContentLoaded", function () {
  setCrawlLink();
  loadCrawlerSettings();
});
