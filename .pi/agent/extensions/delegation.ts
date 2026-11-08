import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const REQUIRED = [
  "TASK",
  "EXPECTED OUTCOME",
  "MUST DO",
  "MUST NOT DO",
  "CONTEXT",
] as const;

// Accepts headings in several shapes: any ATX level (#..######), bold markers
// (**TASK** with or without a heading), optional numbering (### 1. TASK), an
// optional trailing colon, any letter case, and CRLF line endings. The section
// name must still be the only content on its line, so prose like "TASK:"
// inside a section body is never mistaken for a heading.
const HEADER = new RegExp(
  "^[ \\t]*(?:#{1,6}[ \\t]+(?:\\d+[.)][ \\t]+)?|\\*\\*)\\**[ \\t]*" +
    `(${REQUIRED.join("|")})` +
    "[ \\t]*[:*]*[ \\t]*\\r?$",
  "gim",
);

function validateDelegation(prompt: string): string[] {
  const errors: string[] = [];
  const matches = [...prompt.matchAll(HEADER)];
  const names = matches.map((match) => match[1].toUpperCase());

  // Validate required sections and uniqueness.
  for (const name of REQUIRED) {
    const count = names.filter((section) => section === name).length;
    if (count !== 1) {
      errors.push(`${name}: expected exactly once, found ${count}`);
    }
  }

  // Validate section order.
  if (names.join("|") !== REQUIRED.join("|")) {
    errors.push("Invalid section order");
  }

  // Validate non-empty sections.
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const start = (current.index ?? 0) + current[0].length;
    const end = matches[i + 1]?.index ?? prompt.length;
    if (!prompt.slice(start, end).trim()) {
      errors.push(`${current[1].toUpperCase()}: empty section`);
    }
  }

  return errors;
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", (event) => {
    if (event.toolName !== "Agent") return;

    const input = event.input as {
      prompt?: unknown;
      resume?: unknown;
    };

    // Resume operations are excluded by policy.
    if (typeof input.resume === "string" && input.resume.trim()) {
      return;
    }

    if (typeof input.prompt !== "string") {
      return {
        block: true,
        reason: "Delegation rejected: missing prompt",
      };
    }

    const errors = validateDelegation(input.prompt);
    if (errors.length > 0) {
      return {
        block: true,
        reason:
          "Delegation contract violation:\n" +
          errors.map((error) => `- ${error}`).join("\n") +
          "\nCorrect the prompt and retry Agent.",
      };
    }
  });
}
