import { describe, expect, it } from "vitest";
import { extractConstraints } from "../apps/api/src/services/constraint-extractor.js";

describe("constraint extraction gate", () => {
  it("extracts mobile platform, Swift language, and SpriteKit framework", () => {
    const result = extractConstraints("Build an iOS mobile physics game in Swift with SpriteKit.");

    expect(result.platforms).toEqual(["mobile"]);
    expect(result.languages).toEqual(["swift"]);
    expect(result.frameworks).toEqual(["spritekit"]);
    expect(result.stackMentions).toEqual(expect.arrayContaining(["mobile", "swift", "spritekit"]));
    expect(result.prohibitions).toEqual([]);
    expect(result.unrecognizedMentions).toEqual([]);
  });

  it("extracts desktop Python and Flet requirements", () => {
    const result = extractConstraints("Create a native desktop app using Python and Flet for windowed forms.");

    expect(result.platforms).toEqual(["desktop"]);
    expect(result.languages).toEqual(["python"]);
    expect(result.frameworks).toEqual(["flet"]);
    expect(result.unrecognizedMentions).toEqual([]);
  });

  it("extracts web, TypeScript, React, and Tailwind requirements", () => {
    const result = extractConstraints("Build an accessible React and TypeScript web dashboard with Tailwind.");

    expect(result.platforms).toEqual(["web"]);
    expect(result.languages).toEqual(["typescript"]);
    expect(result.frameworks).toEqual(["react", "tailwind"]);
    expect(result.unrecognizedMentions).toEqual([]);
  });

  it("parses explicit platform and framework prohibitions", () => {
    const result = extractConstraints("Build a Swift SpriteKit mobile game. No web, React, or Tailwind.");

    expect(result.platforms).toEqual(["mobile"]);
    expect(result.frameworks).toEqual(["spritekit"]);
    expect(result.prohibitions).toEqual(expect.arrayContaining(["web", "react", "tailwind"]));
    expect(result.stackMentions).toEqual(expect.arrayContaining(["web", "react", "tailwind"]));
  });

  it("distinguishes exact tokens so Swift does not match SwiftUI", () => {
    const result = extractConstraints("Build a SwiftUI settings application without SpriteKit.");

    expect(result.languages).toEqual([]);
    expect(result.frameworks).toEqual(["swiftui"]);
    expect(result.prohibitions).toEqual(["spritekit"]);
  });

  it("handles phrase negation while retaining positive stack evidence", () => {
    const result = extractConstraints("Use Flet for a desktop app; do not use React.");

    expect(result.platforms).toEqual(["desktop"]);
    expect(result.frameworks).toEqual(["flet"]);
    expect(result.prohibitions).toEqual(["react"]);
    expect(result.stackMentions).toEqual(expect.arrayContaining(["flet", "react"]));
  });

  it("records an explicit unsupported framework mention", () => {
    const result = extractConstraints("Build a Vue TypeScript web dashboard.");

    expect(result.unrecognizedMentions).toContain("vue");
    expect(result.stackMentions).toContain("vue");
  });

  it("does not treat ordinary capitalized words as unsupported technologies", () => {
    const result = extractConstraints("Build an AI dashboard with local persistence.");

    expect(result.unrecognizedMentions).toEqual([]);
  });
});
