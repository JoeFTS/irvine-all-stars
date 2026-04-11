// Tiny helper that reads src/content/fundraising-ideas.ts via esbuild-style
// evaluation and writes the data to a JSON file consumed by the Python PDF
// generator. Run automatically from generate-fundraising-playbooks.py.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INPUT = path.join(__dirname, "..", "src", "content", "fundraising-ideas.ts");
const OUTPUT = path.join(__dirname, "..", "src", "content", "fundraising-ideas.generated.json");

const source = fs.readFileSync(INPUT, "utf8");

// Isolate the exported array and strip the export / type annotation.
const match = source.match(
  /export const fundraisingIdeas:[^=]*=\s*(\[[\s\S]*?\n\]);/
);
if (!match) {
  console.error("Could not find fundraisingIdeas export in", INPUT);
  process.exit(1);
}

// Evaluate the JS array literal in a sandboxed Function so we can convert
// the TS object-literal syntax into a real JavaScript array.
const arrayLiteral = match[1];
let ideas;
try {
  ideas = new Function(`return ${arrayLiteral};`)();
} catch (err) {
  console.error("Failed to evaluate fundraising ideas array:", err.message);
  process.exit(1);
}

fs.writeFileSync(OUTPUT, JSON.stringify(ideas, null, 2));
console.log(`Wrote ${ideas.length} fundraising ideas to ${OUTPUT}`);
