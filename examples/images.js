const { Session, ClientIdentifier } = require("node-tls-client");
const fs = require("fs");

/**
 * @description Demonstrates a example for downloading images.
 *
 * @important
 * Ensure you specify `byteResponse: true` in the options to receive image data in base64 format.
 * This is necessary only for receiving image data, not for sending byte data in requests, which is handled internally.
 *
 * @see {@link https://sahil1337.github.io/node-tls-client/interfaces/SessionOptions.html SessionOptions} for more details.
 */
(async () => {
  const session = new Session({
    clientIdentifier: ClientIdentifier.chrome_103,
  });

  const avatarURI = "https://avatars.githubusercontent.com/u/69236315?v=4";

  try {
    const avatarRes = await session.get(avatarURI, { byteResponse: true });

    const avatarResText = await avatarRes.text();
    const avatarBase64 = avatarResText.replace(/^data:image\/\w+;base64,/, "");

    fs.writeFileSync("avatar.png", avatarBase64, "base64");
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await session.close();
  }
})();
