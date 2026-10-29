import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default defineConfig([
  globalIgnores(["dist/", "typings/", "docs/", "plans/"]),
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    extends: [tseslint.configs.recommended],
    rules: {
      // FFI callbacks and the logger take arbitrary values; surface but don't block.
      "@typescript-eslint/no-explicit-any": "warn",
      // `interface GetRequestOptions extends BaseRequestOptions {}` is the public API shape.
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowInterfaces: "with-single-extends" },
      ],
      // package.json lives outside rootDir, so it can't be imported; require() is the way.
      "@typescript-eslint/no-require-imports": [
        "error",
        { allow: ["/package\\.json$"] },
      ],
    },
  },
  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
  },
  prettier, // must be last: turns off rules that conflict with Prettier
]);
