import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = join(root, "..", "..");
const candidates = [
  join(workspaceRoot, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs"),
  join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs"),
];

const source = candidates.find((path) => existsSync(path));
if (!source) {
  console.warn("[copy-pdf-worker] pdf.worker.min.mjs not found; skip");
  process.exit(0);
}

const targetDir = join(root, "public");
mkdirSync(targetDir, { recursive: true });
const target = join(targetDir, "pdf.worker.min.mjs");
copyFileSync(source, target);
console.log(`[copy-pdf-worker] copied to ${target}`);
