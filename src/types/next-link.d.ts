/**
 * Ambient shim for `next/link`.
 *
 * Next.js 16.2.10's package.json has no `"exports"` map (subpaths like
 * `./link` are declared only via the legacy `"files"` array). Under this
 * project's locked `"module"/"moduleResolution": "NodeNext"` + `"type":
 * "module"` combination (established Phase 1 -- see tsconfig.json), Node's
 * actual ESM loader still resolves exports-less subpaths via plain
 * filesystem lookup (Node docs: "when the exports field is not defined,
 * subpath exports are similarly not enforced, and resolution proceeds via
 * the file system as before"), so `next/link` works fine at runtime and
 * under Next's own SWC/webpack bundling. TypeScript 7.0.2's Node16/NodeNext
 * resolver, however, does not fall back to that same filesystem lookup for
 * bare subpath specifiers once ESM mode is in effect -- reproduced in
 * isolation outside this project's other tsconfig settings, so this is a
 * resolver gap, not a project misconfiguration. Declaring the module here
 * (rather than loosening `moduleResolution` project-wide, an architectural
 * change out of scope for a single page) unblocks `tsc --noEmit` without
 * touching the module system every other file in the codebase relies on.
 */
declare module "next/link" {
  import type { AnchorHTMLAttributes, ComponentType, ReactNode } from "react";

  export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    children?: ReactNode;
  }

  const Link: ComponentType<LinkProps>;
  export default Link;
}
