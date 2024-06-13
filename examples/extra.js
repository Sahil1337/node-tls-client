const { Session } = require("node-tls-client");

(async () => {
  const session = new tlsClient.Session({
    clientIdentifier: "chrome_120", //client identifier
    timeout: 30 * 1000, //timeout in *milliseconds*, applies for each requests, checkout examples/timeout.js for using different timeouts.
    rejectUnauthorized: false, //SSL certificate verification
  });

  const response = await session.get("https://example.com", {
    proxy: `http://user:pass@ip:port`, //proxy format: http://user:pass@ip:port or http://ip:port
    cookies: { parameter: "value" }, //cookies
    redirect: true, //follow redirected urls
    headers: { authorization: "test" }, //request headers
  });

  console.log(response.status);

  await session.close();
})();
