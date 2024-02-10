import * as path from "path";
import * as fs from "fs";

export const reverseHostname = (url: string) =>
  url.split(".").reverse().join(".");

export function isSameDomain(domain1: string | URL, domain2: string | URL) {
  const parsedDomain1 = new URL(domain1);
  const parsedDomain2 = new URL(domain2);
  const revHost1 = reverseHostname(parsedDomain1.hostname);
  const revHost2 = reverseHostname(parsedDomain2.hostname);
  const revHost1Parts = revHost1.split(".");
  const revHost2Parts = revHost2.split(".");

  // Reverse the hostnames and check if link's reversed hostname starts with base URL's reversed hostname
  return (
    revHost1Parts[0] == revHost2Parts[0] && revHost1Parts[1] == revHost2Parts[1]
  );
}

export function sortObjectByPropertyNames(obj: { [x: string]: any }): {
  [x: string]: any;
} {
  const sortedKeys = Object.keys(obj).sort();
  const sortedObject: { [x: string]: any } = {};

  sortedKeys.forEach((key) => {
    sortedObject[key] = obj[key];
  });

  return sortedObject;
}

export function getRootDir(startDir: string): string {
  let currentDir = path.resolve(startDir);

  while (true) {
      if (fs.existsSync(path.join(currentDir, 'package.json'))) {
          return currentDir;
      }
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
          // Reached the root directory
          throw new Error("Root directory containing 'package.json' not found.");
      }
      currentDir = parentDir;
  }
}
