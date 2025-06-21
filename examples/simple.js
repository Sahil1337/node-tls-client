const {
  Session,
  ClientIdentifier,
  initTLS,
  destroyTLS,
} = require("node-tls-client");

/**
 * @description Demonstrates using the node-tls-client library to make HTTP requests with a specified timeout.
 * Note: The timeout is set per session and cannot be changed during the session.
 *
 * @see {@link https://sahil1337.github.io/node-tls-client/interfaces/SessionOptions.html SessionOptions} for more details.
 */
(async () => {
  await initTLS();

  const session = new Session({
    clientIdentifier: ClientIdentifier.chrome_103,
    timeout: 3000,
  });

  try {
    const response = await session.get("https://website.com/");

    console.log(response.status, await response.text());
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await session.close();
    await destroyTLS();
  }
})();
