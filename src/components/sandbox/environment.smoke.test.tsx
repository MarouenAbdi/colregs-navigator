// @vitest-environment jsdom
/**
 * Pitfall-4 (vitest-dev/vitest#9279) early-warning smoke test: an open,
 * unresolved GitHub issue reports jsdom-latest + Vitest-4-latest causing
 * obscure test failures. This trivial render+assert must pass before any
 * real component test is built on top of the RTL/jsdom harness.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("RTL/jsdom environment", () => {
  it("renders a component and finds it by text", () => {
    render(<div>Hello</div>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
