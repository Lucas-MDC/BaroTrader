import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const conventionsDoc = "/docs/conventions.md";

const allowedTypes = new Set([
  "feat",
  "fix",
  "refactor",
  "perf",
  "style",
  "test",
  "docs",
  "build",
  "ops",
  "chore",
]);

const allowedScopes = [
  // "api",
  // "ui",
  // "auth",
  // "database",
  // "ci",
  // "docs",
];

export function isAutomaticCommit(header) {
  return /^Merge branch '.+' into .+$/.test(header)
    || /^Merge pull request #[0-9]+ from .+$/.test(header)
    || /^Revert ".+"$/.test(header);
}

export function isTicketLikeScope(scope) {
  return /^[0-9]+$/.test(scope)
    || /^#[0-9]+$/.test(scope)
    || /^[A-Z]+-[0-9]+$/.test(scope);
}

export function isValidCommitMessage(message) {
  const header = message.split(/\r?\n/, 1)[0];

  if (isAutomaticCommit(header)) {
    return true;
  }

  const match = header.match(/^([a-z]+)(?:\(([^)]+)\))?: (.+)$/);

  if (!match || header.length > 100) {
    return false;
  }

  const [, type, scope, description] = match;

  return allowedTypes.has(type)
    && description.length <= 100
    && /^[a-z]/.test(description)
    && !description.endsWith(".")
    && (!scope || !isTicketLikeScope(scope))
    && (!scope || allowedScopes.length === 0 || allowedScopes.includes(scope));
}

function readCommitMessage(messageFile) {
  try {
    return readFileSync(messageFile, "utf8");
  } catch (error) {
    console.error(`Nao foi possivel ler a mensagem do commit: ${error.message}`);
    process.exit(1);
  }
}

function main() {
  const [, , messageFile] = process.argv;

  if (!messageFile) {
    console.error("Uso: node scripts/validate-commit-message.js <commit-msg-file>");
    process.exit(1);
  }

  const message = readCommitMessage(messageFile);

  if (!isValidCommitMessage(message)) {
    console.error(`Convencao invalida. Consulte ${conventionsDoc}.`);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
