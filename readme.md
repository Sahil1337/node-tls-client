<div align="center">
  <h1>node-tls-client</h1>
  <p>Advanced library based on node-fetch syntax and tls-client.</p>
  <p>
    <a href="https://www.npmjs.com/package/node-tls-client"><img src="https://img.shields.io/npm/v/node-tls-client?maxAge=3600" alt="NPM version" /></a>
    <a href="https://www.npmjs.com/package/node-tls-client"><img src="https://img.shields.io/npm/dt/node-tls-client?maxAge=3600" alt="NPM downloads" /></a>
  </p>
  <p>
    <a href="https://www.npmjs.com/package/node-tls-client"><img src="https://nodei.co/npm/node-tls-client.png?downloads=true&stars=true" alt="NPM Banner"></a>
  </p>
</div>

<div align="center"> <p> <b> What is TLS Fingerprinting? </b> </p>
Some people think it is enough to change the user-agent header of a request to let the server think that the client requesting a resource is a specific browser. Nowadays this is not enough, because the server might use a technique to detect the client browser which is called TLS Fingerprinting. <b>This library aims to defeat it.</b> </p></div>

## Installation

```sh
npm install node-tls-client
# (or)
yarn add node-tls-client
# (or)
pnpm add node-tls-client
```

## Example

```javascript
const { Session } = require("node-tls-client");

/**
 * @description Demonstrates using the node-tls-client library to make HTTP requests with a specified timeout.
 * Note: The timeout is set per session and cannot be changed during the session.
 *
 * @see {@link https://sahil1337.github.io/node-tls-client/interfaces/SessionOptions.html SessionOptions} for more details.
 */

(async () => {
  const session = new Session({ clientIdentifer: "chrome_103", timeout: 3000 });

  try {
    const response = await session.get("https://website.com/");

    console.log(response.status, await response.text());
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await session.close();
  }
})();
```

## Advanced example

```javascript
const { Session } = require("node-tls-client");

/**
 * @description Demonstrates an advanced usage scenario with the node-tls-client library, showcasing custom TLS client configuration.
 *
 * This example illustrates the creation of a TLS session with tailored settings and the execution of a GET request.
 *
 * Custom TLS settings encompass a wide array of configurations, including:
 * - JA3 string specification
 * - Fine-tuning HTTP/2 settings
 * - Defining supported signature algorithms
 * - Specifying ALPN (Application-Layer Protocol Negotiation) protocols
 * - Declaring supported TLS versions
 * - Setting key share curves for cryptographic key exchange
 * - Choosing a certificate compression algorithm
 * - Configuring connection and header flow parameters
 * - Defining the order of headers and priority frames
 * - Providing default headers for HTTP requests
 *
 * @see {@link https://sahil1337.github.io/node-tls-client/interfaces/SessionOptions.html SessionOptions} for more details on session options.
 */

(async () => {
  const session = new Session({
    ja3string:
      "771,2570-4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,2570-0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-2570-21,2570-29-23-24,0",
    h2Settings: {
      HEADER_TABLE_SIZE: 65536,
      MAX_CONCURRENT_STREAMS: 1000,
      INITIAL_WINDOW_SIZE: 6291456,
      MAX_HEADER_LIST_SIZE: 262144,
    },
    h2SettingsOrder: [
      "HEADER_TABLE_SIZE",
      "MAX_CONCURRENT_STREAMS",
      "INITIAL_WINDOW_SIZE",
      "MAX_HEADER_LIST_SIZE",
    ],
    supportedSignatureAlgorithms: [
      "ECDSAWithP256AndSHA256",
      "PSSWithSHA256",
      "PKCS1WithSHA256",
      "ECDSAWithP384AndSHA384",
      "PSSWithSHA384",
      "PKCS1WithSHA384",
      "PSSWithSHA512",
      "PKCS1WithSHA512",
    ],
    alpnProtocols: ["h2", "http/1.1"],
    alpsProtocols: ["h2"],
    supportedVersions: ["GREASE", "1.3", "1.2"],
    keyShareCurves: ["GREASE", "X25519"],
    certCompressionAlgo: "brotli",
    pseudoHeaderOrder: [":method", ":authority", ":scheme", ":path"],
    connectionFlow: 15663105,
    headerOrder: ["accept", "user-agent", "accept-encoding", "accept-language"],
    priorityFrames: [
      {
        streamID: 1,
        priorityParam: {
          streamDep: 1,
          exclusive: true,
          weight: 1,
        },
      },
    ],
    headerPriority: {
      streamDep: 1,
      exclusive: true,
      weight: 1,
    },
    headers: {
      accept:
        "application/json,text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  const response = await session.get("http://localhost:3000/");
  console.log(response.status, await response.text());
  await session.close();
})();
```

## More examples
```javascript
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
  //more details: https://sahil1337.github.io/node-tls-client/hierarchy.html#BaseRequestOptions
```

## Session

<div id="session-options">

## Session Options

| Property                       | Type                                                                                                                                    | Description                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `sessionId`                    | string                                                                                                                                  | A unique identifier for the session.                                   |
| `headers`                      | IncomingHttpHeaders                                                                                                                     | An object containing custom headers to send with the request.          |
| `proxy`                        | string                                                                                                                                  | A proxy server URL to use for the request. [format: 'http://user:pass@ip:port or http://ip:port']                             |
| `clientIdentifier`             | [ClientIdentifier](https://sahil1337.github.io/node-tls-client/enums/ClientIdentifier.html)                                                                                                                                  | A string identifier for the client, e.g., `"chrome_120"`.              |
| `ja3string`                    | string                                                                                                                                  | A string representing JA3 fingerprinting configuration.                |
| `h2Settings`                   | [h2Settings](https://sahil1337.github.io/node-tls-client/interfaces/H2Settings.html)[]                                       | An object specifying HTTP/2 settings.                                  |
| `h2SettingsOrder`              | [h2Settings](https://sahil1337.github.io/node-tls-client/interfaces/H2Settings.html)[]                                       | An array specifying the order of HTTP/2 settings.                      |
| `supportedSignatureAlgorithms` | [supportedSignatureAlgorithms](https://sahil1337.github.io/node-tls-client/types/SupportedSignatureAlgorithms.html)[] | An array of supported signature algorithms.                            |
| `supportedVersions`            | [supportedVersions](https://sahil1337.github.io/node-tls-client/types/SupportedVersions.html)[]                        | An array of supported TLS versions.                                    |
| `keyShareCurves`               | [keyShareCurves](https://sahil1337.github.io/node-tls-client/types/KeyShareCurves.html)[]                               | An array of key share curves.                                          |
| `certCompressionAlgo`          | [certCompressionAlgo](https://sahil1337.github.io/node-tls-client/types/CertCompressionAlgo.html)                  | A certificate compression algorithm, e.g., `"brotli"`.                 |
| `pseudoHeaderOrder`            | [pseudoHeaderOrder](https://sahil1337.github.io/node-tls-client/types/PseudoHeaderOrder.html)[]                                                                                                                     | An array specifying the order of pseudo-headers.                       |
| `connectionFlow`               | number                                                                                                                                  | A number specifying the connection flow control window size.           |
| `priorityFrames`               | [priorityFrame](https://sahil1337.github.io/node-tls-client/interfaces/PriorityFrames.html)[]                                | An array of priority frames to send with the request.                  |
| `headerOrder`                  | string[]                                                                                                                                | An array specifying the order of headers.                              |
| `alpnProtocols`                | string[]                                                                                                                                | An array of Application-Layer Protocol Negotiation (ALPN) protocols.   |
| `alpsProtocols`                | string[]                                                                                                                                | An array of Application Layer Protocol Settings (ALPS) protocols.      |
| `headerPriority`               | [priorityParam](https://sahil1337.github.io/node-tls-client/interfaces/PriorityParam.html)                                   | An object specifying header priority parameters.                       |
| `randomTlsExtensionOrder`      | boolean                                                                                                                                 | A boolean indicating whether to use a random order for TLS extensions. |
| `forceHttp1`                   | boolean                                                                                                                                 | A boolean indicating whether to force the use of HTTP/1.1.             |
| `debug`                        | boolean                                                                                                                                 | A boolean indicating whether to enable debug mode.                     |
| `insecureSkipVerify`           | boolean                                                                                                                                 | A boolean indicating whether to skip SSL certificate verification.     |

</div>

<div id="session-methods">

## Session methods

| Method                                          | Description                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `get(url: string, options: RequestOptions)`     | Sends a GET request to the specified URL and returns the response.                                |
| `put(url: string, options: RequestOptions)`     | Sends a PUT request to the specified URL with the provided options and returns the response.      |
| `delete(url: string, options: RequestOptions)`  | Sends a DELETE request to the specified URL with the provided options and returns the response.   |
| `options(url: string, options: RequestOptions)` | Sends an OPTIONS request to the specified URL with the provided options and returns the response. |
| `head(url: string, options: RequestOptions)`    | Sends a HEAD request to the specified URL with the provided options and returns the response.     |
| `post(url: string, options: RequestOptions)`    | Sends a POST request to the specified URL with the provided options and returns the response.     |
| `patch(url: string, options: RequestOptions)`   | Sends a PATCH request to the specified URL with the provided options and returns the response.    |
| `close()`                                       | Closes the session.                          

</div>

<div id="request">

## Request Options

| Parameter            | Description                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `body`               | The body of the request, if applicable. This can be a string, a buffer, or an object.           |
| `headers`            | An object containing the request headers.                                                       |
| `redirect`           | A boolean value indicating whether to follow redirects.                                         |
| `additionalDecode`   | A boolean value indicating whether to perform additional decoding of the response content.      |
| `proxy`              | The URL of the proxy server to be used for the request. [format: 'http://user:pass@ip:port or http://ip:port']                                                                                                                |
| `cookies`            | An object containing cookies to be sent with the request.                                       |

</div>

<div id="response">

## Response

| Properties | Description                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ok`       | This boolean value indicates whether the request was successful or not. It returns "true" if the response status is within the range 200-299, indicating success. Otherwise, it returns "false".` |
| `headers`  | This object contains the response headers returned by the server.                                                                                                                                 |
| `status`   | This integer represents the HTTP status code of the response.                                                                                                                                     |
| `url`      | This is the URL to which the request was made.                                                                                                                                                    |

| Methods     | Description                                                                          |
| ----------- | ------------------------------------------------------------------------------------ |
| `text()`    | Returns the response body as plain text.                                             |
| `json()`    | Returns the response body parsed as json.                                            |
| `cookies()` | Returns a promise that resolves with cookie information processed from the response. |

</div>



## Acknowledgements
This library is based on [bogdanfinn's](https://github.com/bogdanfinn) tls client in golang. A big thanks to him.
