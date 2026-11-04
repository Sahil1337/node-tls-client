import { initTLS, destroyTLS } from "node-tls-client";
import { readdirSync, rmSync } from "node:fs";

//#region library-dir
// Downloads to (and later loads from) ./vendor/tls instead of os.tmpdir().
await initTLS({ libraryDir: "./vendor/tls" });
//#endregion

console.log(readdirSync("./vendor/tls")); // [ 'tls-client-2.2.0-darwin-arm64.dylib' ]
await destroyTLS();
rmSync("./vendor", { recursive: true, force: true });
