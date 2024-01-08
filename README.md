# Tris - Simple Spider Scraper

Simple Spider Scraper or Tris is a Node.js web scraper that allows you to recursively crawl a website and collect links within the specified depth. It provides various customization options to tailor the scraping process according to your needs.

## Features

- **Customizable Settings**: Configure the scraper with various settings using environment variables.
- **Timeout Handling**: Specify the timeout in milliseconds for each request.
- **Path Depth Limitation**: Set the maximum depth of paths to be scraped.
- **Randomized User Agents**: Provide a list of custom user-agent headers that are randomized between requests.
- **Skip Words**: Skip links that contain specified skip words.
- **Sorting Output**: Optionally sort the output file lines in ascending order.
- **Delay Between Requests**: Introduce a delay between requests to avoid overloading the server.
- **HTTP Status Codes**: Optionally include HTTP status codes in the output file.

## Setup

1. Clone the repository:

```bash
git clone https://github.com/vmandic/spider-scraper.git
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

- `TIMEOUT_MS`: Set the timeout in milliseconds (default: 10ms).
- `PATH_DEPTH`: Set the path depth limit (default: 3).
- `USER_AGENTS`: Provide a list of custom user-agent headers (comma-delimited).
- `SKIP_WORDS`: Specify skip words to skip links (comma-delimited).
- `SORT_OUTPUT`: Set to "true" to sort output lines in ascending order.
- `DELAY_MS`: Introduce a delay between requests (default: 0).
- `INCLUDE_PATH`: Specify a path pattern to include only matching paths.
- `OUTPUT_HTTP_CODE`: Set to "true" to include HTTP status codes in the output.

## License

This project is licensed under the [ISC License](LICENSE) - see the [LICENSE](LICENSE) file for details.

## Author 

Vedran Mandić

