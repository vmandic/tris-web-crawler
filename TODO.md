# TODOs list

This document is just rough flow of ideas I will get to document in one place so I can keep track of what could or should be implemented for this project. There is no specific order or priority to the items listed here, if there is I will exclaim so. And yes I am lazy to use a Github project or Trello or similar.

## Technical

- [ ] CHORE/DEVUX/QA: add frontend HTML, CSS and JS linter
- [ ] CHORE/DEVUX/QA: add backend linter
- [ ] CHORE/DEVUX/QA: add dockerfile lint with hadolint
- [ ] CHORE/DEVUX/QA: add git commit hooks with husky to run linters
- [ ] CHORE/DEVUX/QA: switch backend to TypeScript
- [ ] CHORE/DEVUX/QA: switch frontend to TypeScript (and some build system like bun)
- [ ] CHORE/DEVUX/QA: add some kind of spell checker utility for all kinds of files while coding in vscode?
- [ ] FEAT: change index and crawl HTML pages to be rendered from a template engine like handlebars/nunjucks etc, build a layout with header, body and footer
- [ ] FEAT/BRANDING: add version info + git hash of a latest deployment and a link to latest release from Github to a page footer
- [ ] FEAT/SEO: replace GA, add page visitor analytics with seogets tool
- [ ] FEAT/UX: figure a way to stop the crawler process if the user navigates away or signals a stop, maybe keep sending a heartbeat signal the client is connected ie. interested in results
- [ ] FEAT: remove cheerio to send the HTML page request, replace with fetch and add a retry to fetch with some logic to the retry attempts
- [ ] FEAT/UX: add a proxy support to increase the changes of passing by protection, eg. smartproxy.com looks nice
- [ ] CHORE/DEVUX: make the Github CI action have a manual step to make the fly.io deployment from main head ie. job in question

## Product

- [ ] UX: add an input on index.html to allow end user to specify a target URL
- [ ] UX: infer HTTP or HTTPS, loosen the way the user specifies the domain eg. google.com or www.google.com or https://www.google.com, do some preflight checks to find the proper one before starting
- [ ] SEO: count words of the actual HTML page and list them out as a valuable metric for the end user
- [ ] UX: results breakdown: after finishing crawling print a an overview of the process like total sucessful links, dead links, HTTP code breakdown, avg/median etc
- [ ] UX: add a file download at the end of crawling run of a .csv file which can offer selected (configured) columns per .env settings, file should get auto deleted with a separate worker after 1 minute
- [ ] UI/UX: choose a color and font scheme, apply to index and crawl pages

## Other

Non so far.