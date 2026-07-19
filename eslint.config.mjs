import { defineConfig, globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import babelParser from "@babel/eslint-parser";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import vitest from "@vitest/eslint-plugin";

// The Next.js maintainers' bundled preset (see research/STACK.md CORRECTION)
// crashes at require-time against this project's locked typescript@7.0.2
// (tsgo) -- it pulls in a TypeScript-aware ESLint dependency with no
// published version supporting TypeScript >=6.1. Using this plugin's own
// flat-config export directly avoids that dependency chain entirely (it
// only depends on fast-glob).
const eslintConfig = defineConfig([
  nextPlugin.configs["core-web-vitals"],
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          // @babel/eslint-parser@8's babelrc:false/configFile:false fast path
          // reads babelOptions.parserOpts.plugins directly and never applies
          // babelOptions.presets -- specifying the underlying @babel/parser
          // plugin names here (not preset package names) is what actually
          // enables TypeScript + JSX syntax stripping in this Babel 8 setup.
          parserOpts: {
            plugins: ["typescript", "jsx"],
          },
        },
      },
    },
  },
  {
    extends: [eslintPluginBetterTailwindcss.configs.recommended],
    settings: {
      "better-tailwindcss": {
        // Tailwind v4 points at its CSS entry point (not a JS/TS config
        // file) -- app/globals.css line 1 is `@import "tailwindcss";`.
        entryPoint: "app/globals.css",
      },
    },
  },
  {
    // Vitest-specific correctness rules (expect-expect, no-disabled-tests,
    // no-focused-tests, ...) only make sense against files that actually
    // import Vitest's API -- scoped to match vitest.config.ts's own
    // test.include glob exactly, so these rules never apply to non-test
    // source files.
    files: ["src/**/*.test.{ts,tsx}"],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
