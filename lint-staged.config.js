// ESM default export -- package.json is "type": "module", matching the rest of the repo's
// module convention.
//
// Deliberately staged-file `eslint --fix` only:
// - No Prettier step -- a repo-wide reformat (FMT-01) is an explicitly deferred v2 item.
// - No `tsc`/`typecheck` entry -- TypeScript's checker needs the whole project graph, so
//   scoping it to staged files would produce false negatives (see ARCHITECTURE.md
//   Anti-Pattern 1). The full typecheck stays CI-only, never pre-commit.
export default {
  "*.{js,jsx,mjs,cjs,ts,tsx}": ["eslint --fix"],
};
