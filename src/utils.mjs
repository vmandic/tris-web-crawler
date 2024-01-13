export const reverseHostname = (url) => url.split(".").reverse().join(".");

export function isSameDomain(domain1, domain2) {
  const parsedDomain1 = new URL(domain1);
  const parsedDomain2 = new URL(domain2);
  const revHost1 = reverseHostname(parsedDomain1.hostname);
  const revHost2 = reverseHostname(parsedDomain2.hostname);
  const revHost1Parts = revHost1.split(".");
  const revHost2Parts = revHost2.split(".");

  // Reverse the hostnames and check if link's reversed hostname starts with base URL's reversed hostname
  return revHost1Parts[0] == revHost2Parts[0] && revHost1Parts[1] == revHost2Parts[1];
}
