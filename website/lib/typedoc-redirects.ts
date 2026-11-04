// Old TypeDoc API pages (the docs site before 2.2.0) → their new pages,
// without ".html". GitHub Pages serves the 404 page for these URLs, and
// components/typedoc-redirect.tsx forwards visitors from there.
const sessionOptions = "/reference/session-options";
const requestOptions = "/guides/requests";
const initTls = "/reference/init-tls";

const pages = (
  folder: string,
  names: string[],
  target: (name: string) => string,
) =>
  Object.fromEntries(names.map((name) => [`${folder}/${name}`, target(name)]));

export const typedocRedirects: Record<string, string> = {
  modules: "/guides/sessions",
  hierarchy: `${requestOptions}#options`,
  "classes/Session": "/guides/sessions",
  "classes/Response": "/guides/responses",
  "classes/TlsClientError": "/guides/errors",
  "enums/ClientIdentifier": "/reference/client-identifier",
  "functions/fetch": "/reference/fetch",
  "functions/initTLS": initTls,
  "functions/destroyTLS": `${initTls}#destroytls`,
  "interfaces/InitTLSOptions": `${initTls}#inittlsoptions`,
  "interfaces/TlsNativeLibrary": `${initTls}#native-bindings`,
  "interfaces/IClient": `${initTls}#native-bindings`,
  "types/IClient": `${initTls}#native-bindings`,
  "interfaces/SessionOptions": sessionOptions,
  "interfaces/TlsResponse": "/guides/responses#properties",
  "interfaces/fetchOptions": "/reference/fetch#fetchoptions",
  ...pages(
    "interfaces",
    [
      "TransportOptions",
      "H2Settings",
      "H3Settings",
      "PriorityFrames",
      "PriorityParam",
      "CandidateCipherSuite",
    ],
    (name) => `${sessionOptions}#${name.toLowerCase()}`,
  ),
  ...pages(
    "interfaces",
    ["Base", "Get", "Delete", "Head", "Options"].map(
      (m) => `${m}RequestOptions`,
    ),
    () => `${requestOptions}#options`,
  ),
  ...pages(
    "interfaces",
    ["", "Post", "Put", "Patch"].map((m) => `${m}RequestOptions`),
    () => `${requestOptions}#options`,
  ),
  ...pages(
    "types",
    [
      "AeadId",
      "CertCompressionAlgo",
      "HeaderInput",
      "KdfId",
      "KeyShareCurves",
      "Methods",
      "PseudoHeaderOrder",
      "SupportedDelegatedCredentialsAlgorithms",
      "SupportedSignatureAlgorithms",
      "SupportedVersions",
    ],
    (name) => `/reference/types#${name.toLowerCase()}`,
  ),
};
