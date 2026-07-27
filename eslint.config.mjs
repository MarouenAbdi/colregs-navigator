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
    rules: {
      // `radar-sweep-dot`(`--lg`), the `trail-*` family, and `hero-live-pulse`
      // are real, plain CSS classes defined directly in app/globals.css
      // (Phase 19 Guided Tour accent; Phase 20 Reasoning Trail connector/
      // token layers and Hero LIVE-dot pulse, respectively -- none are
      // Tailwind utilities) -- the plugin's Tailwind-v4-compiler-backed
      // candidate check can't generate CSS for a non-utility class name, so
      // it otherwise false-flags these as unknown every time they're
      // referenced from a className.
      "better-tailwindcss/no-unknown-classes": [
        "error",
        {
          ignore: [
            "^radar-sweep-dot(--lg)?$",
            "^trail-connector(-pulse)?$",
            "^trail-token(-sweep-ring)?$",
            "^hero-live-pulse$",
          ],
        },
      ],
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
  {
    // Architecture boundary (CLAUDE.md: "the hard rule to enforce" for the
    // domain-modeling-depth claim to be real, not aspirational) -- src/domain/
    // must stay pure/framework-free, so it may never reach into src/server/,
    // Next.js, tRPC, or Prisma.
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/server/**", "@/server/**"],
              message:
                "src/domain/ must never import from src/server/ -- architecture boundary, CLAUDE.md.",
            },
            {
              // A bare `next/*` glob only matches one path segment past
              // "next/" (e.g. next/navigation) -- `next/**` is required
              // too, so deeper subpaths like next/font/google are also
              // caught.
              group: ["next", "next/*", "next/**"],
              message:
                "src/domain/ must never import Next.js -- architecture boundary, CLAUDE.md.",
            },
            {
              group: ["@trpc/*", "@trpc/**"],
              message:
                "src/domain/ must never import tRPC -- architecture boundary, CLAUDE.md.",
            },
            {
              group: ["@prisma/*", "@prisma/**", "prisma", "prisma/*", "prisma/**"],
              message:
                "src/domain/ must never import Prisma -- architecture boundary, CLAUDE.md.",
            },
          ],
        },
      ],
      // 200 is the upper bound of CLAUDE.md's documented "~150-200 lines"
      // split-computation-from-presentation convention -- kept at warn
      // since file length is a proxy for a judgment call, not the
      // judgment itself.
      "max-lines": ["warn", { max: 200, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // Operationalizes CLAUDE.md's "no raw CSS composed as strings in
    // component files" convention. Both selectors are content-gated (not a
    // bare TemplateLiteral match) so CLAUDE.md's own sanctioned pattern --
    // a single CSS-custom-property value formatted via template literal,
    // e.g. style={{ "--rotation": `${angle}deg` }} -- is never flagged.
    files: ["src/components/**/*.tsx", "app/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='style'] TemplateLiteral > TemplateElement[value.raw=/background-image|animation|gradient|:|;/]",
          message:
            "Raw CSS composed as a template-literal string in a style attribute -- move it to app/globals.css (or a CSS custom property) per CLAUDE.md's convention.",
        },
        {
          selector:
            "TemplateLiteral > TemplateElement[value.raw=/background-image|animation:|@keyframes/]",
          message:
            "Raw CSS composed as a template-literal string -- move it to app/globals.css (or a CSS custom property) per CLAUDE.md's convention.",
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "generated/**"]),
]);

export default eslintConfig;
