const { fetch } = require("node-tls-client");

/**
 * @description Demonstrates using the node-tls-client library to make HTTP requests with different timeouts.
 *
 * The `fetch` method in the node-tls-client library creates a new session with the provided options
 * and closes the session after the request ends. As a result, session cookies and cache won't be
 * automatically cached across multiple requests.
 *
 * This example shows how to make two HTTP requests with different timeout settings.
 * Checkout docs for fetchOptions information.
 */
(async () => {
  const response1 = await fetch("https://example.com", {
    options: { timeout: 3000 },
  });
  console.log("Response 1:", await response1.text());

  // Making the second request with a 6000ms timeout and a specific client identifier
  const response2 = await fetch("https://example.com", {
    options: { timeout: 6000, clientIdentifer: "chrome_103" }, //options: SessionOptions
  });
  console.log("Response 2:", await response2.text());
})();
