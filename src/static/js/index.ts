const loadCrawlerSettings = () => {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", "/settings", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const settingsElement = document.querySelector(
        "#settings"
      ) as HTMLElement | null;
      if (settingsElement) {
        settingsElement.innerText = JSON.stringify(
          JSON.parse(xhr.responseText),
          null,
          2
        );
      }
    }
  };
  xhr.send();
};

const setClearHandler = () => {
  const clearElement = document.getElementById("clear") as HTMLElement | null;
  if (clearElement) {
    clearElement.addEventListener("click", (evt) => {
      evt.preventDefault();
      const urlTextBox = document.getElementById(
        "url"
      ) as HTMLInputElement | null;
      if (urlTextBox) urlTextBox.value = "";
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  loadCrawlerSettings();
  setClearHandler();
});
