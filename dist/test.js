"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("./src");
(async () => {
    const session = new src_1.Session({ disableIPV4: true, disableIPV6: true });
    try {
        const req1 = await session.get("https://example.com", {
            cookies: { cookie1: "value1", cookie2: "value2" },
        });
        const req2 = await session.get("https://example.com", {
            cookies: { cookie3: "value3", cookie4: "value4" },
        });
        const req3 = await session.get("https://website.com", {
            cookies: { website: "example.com" },
        });
        console.log(session.cookies);
        // const avatarRes = await session.get(
        //   "https://avatars.githubusercontent.com/u/69236315?v=4",
        //   {
        //     byteResponse: true,
        //   }
        // );
        // const avatarResText = await avatarRes.text();
        // const avatarBase64 = avatarResText.replace(/^data:image\/\w+;base64,/, "");
        // fs.writeFileSync("avatar.png", avatarBase64, "base64");
    }
    catch (error) {
        console.error("An error occurred:", error);
    }
    finally {
        await session.close();
    }
})();
