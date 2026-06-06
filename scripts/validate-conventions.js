import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const conventionsDoc = "/docs/conventions.md";
const localConventionValidationEnabled = true;

const protectedBranches = [
  "main",
  "master",
  "develop",
  "dev",
  "staging",
  "production",
];

const allowedReferences = [
  // "123",
  // "PROJ-123",
  // "ABC-456",
  // "TASK-789",
];

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

function isZeroSha(sha) {
  return /^0+$/.test(sha || "");
}

function getBranchNameFromRef(ref) {
  return ref?.startsWith("refs/heads/")
    ? ref.replace(/^refs\/heads\//, "")
    : null;
}

function runGit(args) {
  return spawnSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

function getCurrentBranchName() {
  const result = runGit(["branch", "--show-current"]);

  return result.status === 0 ? result.stdout.trim() : "";
}

function getDefaultBranchName(remoteName) {
  const result = runGit([
    "symbolic-ref",
    "--quiet",
    "--short",
    `refs/remotes/${remoteName}/HEAD`,
  ]);

  if (result.status !== 0) {
    return "";
  }

  const defaultBranchRef = result.stdout.trim();
  const remotePrefix = `${remoteName}/`;

  return defaultBranchRef.startsWith(remotePrefix)
    ? defaultBranchRef.slice(remotePrefix.length)
    : defaultBranchRef;
}

export function parsePushedBranchNames(prePushInput) {
  const branchNames = new Set();

  for (const line of prePushInput.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    const [localRef, localSha, remoteRef] = line.trim().split(/\s+/);

    if (isZeroSha(localSha)) {
      continue;
    }

    const branchName = getBranchNameFromRef(remoteRef) || getBranchNameFromRef(localRef);

    if (branchName) {
      branchNames.add(branchName);
    }
  }

  return [...branchNames];
}

export function isValidBranchName(branchName, defaultBranchName = "") {
  const allProtectedBranches = new Set([
    ...protectedBranches,
    defaultBranchName,
  ].filter(Boolean));

  if (allProtectedBranches.has(branchName)) {
    return true;
  }

  const branchMatch = branchName.match(
    /^(?:feature|bugfix|hotfix|test)\/(?:(?<reference>[0-9]+|[A-Z]+-[0-9]+)\/)?[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
  );
  const reference = branchMatch?.groups?.reference;

  return Boolean(branchMatch)
    && (!reference || allowedReferences.length === 0 || allowedReferences.includes(reference));
}

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

function readPrePushInput(stdinIsTty) {
  if (stdinIsTty) {
    return "";
  }

  return readFileSync(0, "utf8");
}

function readCommitMessage(messageFile) {
  try {
    return readFileSync(messageFile, "utf8");
  } catch (error) {
    console.error(`Nao foi possivel ler a mensagem do commit: ${error.message}`);
    process.exit(1);
  }
}

function validateBranchConvention(args) {
  const [remoteName = "origin"] = args;
  const stdinIsTty = Boolean(process.stdin.isTTY);
  const prePushInput = readPrePushInput(stdinIsTty);
  const defaultBranchName = getDefaultBranchName(remoteName);
  const branchNames = parsePushedBranchNames(prePushInput);

  if (branchNames.length === 0 && stdinIsTty) {
    const currentBranchName = getCurrentBranchName();

    if (currentBranchName) {
      branchNames.push(currentBranchName);
    }
  }

  const hasInvalidBranch = branchNames.some((branchName) => (
    !isValidBranchName(branchName, defaultBranchName)
  ));

  if (hasInvalidBranch) {
    console.error(`Convencao invalida. Consulte ${conventionsDoc}.`);
    process.exit(1);
  }
}

function validateCommitConvention(args) {
  const [messageFile] = args;

  if (!messageFile) {
    console.error("Uso: node scripts/validate-conventions.js commit <commit-msg-file>");
    process.exit(1);
  }

  const message = readCommitMessage(messageFile);

  if (!isValidCommitMessage(message)) {
    console.error(`Convencao invalida. Consulte ${conventionsDoc}.`);
    process.exit(1);
  }
}

function printUsage() {
  console.error("Uso: node scripts/validate-conventions.js <branch|commit> [...args]");
}

function main() {
  if (!localConventionValidationEnabled) {
    return;
  }

  const [, , command, ...args] = process.argv;

  switch (command) {
    case "branch":
      validateBranchConvention(args);
      break;
    case "commit":
      validateCommitConvention(args);
      break;
    default:
      printUsage();
      process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
