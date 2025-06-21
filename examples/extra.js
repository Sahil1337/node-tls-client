const { Session, ClientIdentifier, initTLS, destroyTLS } = require("node-tls-client");

(async () => {
  await initTLS();

  const session = new Session({
    clientIdentifier: ClientIdentifier.chrome_120, //client identifier
    timeout: 30 * 1000, //timeout in *milliseconds*, applies for each requests, checkout examples/timeout.js for using different timeouts.
    insecureSkipVerify: false,
  });
    
  const response = await session.get("https://example.com", {
    proxy: `http://user:pass@ip:port`, //proxy format: http://user:pass@ip:port or http://ip:port
    cookies: { parameter: "value" }, //cookies
    followRedirects: true, //follow redirected urls
    headers: { authorization: "test" }, //request headers
  });

  console.log(response.status);

  await session.close();
  await destroyTLS();
})();
