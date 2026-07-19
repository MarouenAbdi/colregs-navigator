import { defineConfig, globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import babelParser from "@babel/eslint-parser";

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
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
