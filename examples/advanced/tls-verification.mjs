import { initTLS, destroyTLS, Session } from "node-tls-client";

await initTLS();

//#region skip-verify
// Accept any certificate: self-signed, expired, wrong host. Testing only.
const insecure = new Session({ insecureSkipVerify: true });
const res = await insecure.get("https://self-signed.badssl.com/");
console.log(res.status); // 200 (without the option: status 0, "certificate signed by unknown authority")
//#endregion

//#region find-pins
// A deliberately wrong pin makes the error list the pins the server presented.
const probe = new Session({
  certificatePinningHosts: {
    "httpbin.org": ["AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="],
  },
});
const failed = await probe.get("https://httpbin.org/get");
console.log(failed.status, failed.body);
// 0 failed to do request: … bad ssl pin detected, found pins: [xVo7DF… brzvtC… …]
//#endregion

await Promise.all([insecure.close(), probe.close()]);
await destroyTLS();
