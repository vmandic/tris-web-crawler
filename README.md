# Tris - Simple Spider Scraper

Simple Spider Scraper or _Tris_ is a Node.js CLI tool which is by its core feature a web scraper (link spider) that allows you to recursively crawl a website and collect links within the specified depth. It provides various customization options to tailor the scraping process according to your needs.

## Features

- **Customizable Settings**: Configure the scraper with various settings using environment variables.
- **Timeout Handling**: Specify the timeout in milliseconds for each request.
- **Path Depth Limitation**: Set the maximum depth of paths to be scraped.
- **Randomized User Agents**: Provide a list of custom user-agent headers that are randomized between requests.
- **Skip Words**: Skip links that contain specified skip words.
- **Sorting Output**: Optionally sort the output file lines in ascending order.
- **Delay Between Requests**: Introduce a delay between requests to avoid overloading the server.
- **HTTP Status Codes**: Optionally include HTTP status codes in the output file.
- **Include/Exclude Paths**: Filter links based on specified path patterns.
- **Trim Ending Slash**: Control whether trailing slashes are removed from URLs.
- **Exclude Query String and Fragment**: Optionally exclude query strings and fragments from URLs.
- **Limit amount of requests**: Optionally limit the total amount of web requests to be sent.

## Setup

1. Clone the repository:

```bash
git clone https://github.com/vmandic/tris-simple-spider-scraper.git
```

2. Yarn install:

```bash
yarn install
```

3. Run scraper:

```
yarn start www.google.com
```

## Configuration (Environment Variables)

Setup the .env file by copying .env.example:

```bash
cp .env.example .env
```

- `WEB_REQUESTS_LIMIT`: Set to limit the amount of requests (default: unlimited ie. 0).
- `TIMEOUT_MS`: Set the timeout in milliseconds (default: 10ms).
- `PATH_DEPTH`: Set the path depth limit (default: 3).
- `USER_AGENTS`: Provide a list of custom user-agent headers (comma-delimited).
- `SKIP_WORDS`: Specify skip words to skip links (comma-delimited).
- `SORT_OUTPUT`: Set to "true" to sort output lines in ascending order.
- `DELAY_MS`: Introduce a delay between requests (default: 0).
- `INCLUDE_PATH`: Specify a path pattern to include only matching paths.
- `OUTPUT_HTTP_CODE`: Set to "true" to include HTTP status codes in the output.
- `EXCLUDE_QUERY_STRING`: Set to "true" to exclude query strings from URLs (default: false).
- `EXCLUDE_FRAGMENT`: Set to "true" to exclude fragments from URLs (default: false).

## License

This project is licensed under the [ISC License](LICENSE) - see the [LICENSE](LICENSE) file for details.

## Author

Vedran Mandić

Feel free to modify or extend it further based on your preferences!
