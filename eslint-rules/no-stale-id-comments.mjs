// Local ESLint rule (registered via eslint.config.mjs's `plugins.local.rules`,
// ESLint's own documented flat-config pattern for replacing the deprecated
// `--rulesdir` flag) operationalizing CLAUDE.md's comment convention: "never
// reference a task/plan ID that will rot once the plan is archived --
// reference the *reason* instead."
//
// The regex below is broadened beyond a naive `Phase \d+`/`REQ-\d+` match to
// also catch phrasing styles confirmed live in this repo's own comments: a
// short requirement-code token with no `REQ-` prefix (e.g. `GAL-03`), a bare
// phase/plan-number pair appearing inside a parenthetical alongside other
// words (e.g. `(blocking, 04-01)` or `(07-01, blocking)`), where the
// intervening words rule out a simple `\(`-prefix anchor, and a bare
// `NN(.N)?-<word-chars>.md` phase-artifact doc-filename reference (e.g.
// `08-UI-SPEC.md`, `04-HUMAN-UAT.md`, `09-RESEARCH.md`) -- the single most
// common rotting-pointer shape in this codebase's comments, since these
// filenames stop existing once their phase directory is archived.
const STALE_ID_PATTERN =
  /\b(Phase\s+\d+|Plan\s+\d+|REQ-[A-Z]+-\d+|[A-Z]{2,6}-\d{2,3}|\d{2}(\.\d+)?-\d{2}-PLAN\.md|\d{2}(\.\d+)?-[A-Za-z][\w-]*\.md|this\s+(phase|plan))\b|\d{2}(\.\d+)?-\d{2}(?=\s*[),])/i;

/** @type {import("eslint").Rule.RuleModule} */
const noStaleIdComments = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow stale Phase/Plan/REQ-ID references in comments (CLAUDE.md comment convention).",
    },
    schema: [],
  },
  create(context) {
    return {
      Program() {
        const sourceCode = context.sourceCode ?? context.getSourceCode();
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          if (STALE_ID_PATTERN.test(comment.value)) {
            context.report({
              loc: comment.loc,
              message:
                "Comment references a rotting Phase/Plan/REQ-ID pointer -- explain the underlying reason/decision instead of the plan/phase number (CLAUDE.md comment convention).",
            });
          }
        }
      },
    };
  },
};

export default noStaleIdComments;
