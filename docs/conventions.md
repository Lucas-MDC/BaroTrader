# Conventions:

## Branch naming conventions:
```
<category>/[<reference>/]description-in-kebab-case
```

### Category
- `feature`: for adding, changing or removing product behavior
- `bugfix`: for fixing a non-critical bug
- `hotfix`: for fixing a critical production issue
- `test`: for adding or changing automated tests or test plans
- `experiment`: for evaluating a tool or approach, or building a proof of concept
- `docs`: for changes that only update documentation
- `refactor`: for restructuring code without changing its behavior
- `ops`: for CI/CD, deployment, infrastructure or environment configuration work

### Reference (optional)
Use the issue ID, either numeric (for example, `123`) or project-key format
(for example, `PROJ-123`).

Examples:

- `feature/expand-branch-categories`
- `bugfix/123/fix-login-timeout`
- `experiment/evaluate-adr-manager`
- `docs/PROJ-123/document-branch-workflow`

### Automatic validation

- The local Husky `pre-push` hook validates branches being pushed using
  `scripts/validate-conventions.js`.
- The GitHub Actions workflow `Validate Conventions` imports the same branch
  validator, keeping the accepted categories and naming rules consistent.

## Commit messages conventions:
```
<type>(<optional scope>): <description>
```

### Types
- Changes relevant to the API or UI:
    - `feat` Commits that add, adjust or remove a feature to/of/from the API or UI
    - `fix` Commits that fix an API or UI bug of a preceded `feat` commit
- `refactor` Commits that rewrite or restructure code without altering API or UI behavior
    - `perf` Commits are special type of `refactor` commits that specifically improve performance
- `style` Commits that address code style (e.g., white-space, formatting, missing semi-colons) and do not affect application behavior
- `test` Commits that add missing tests or correct existing ones
- `docs` Commits that exclusively affect documentation
- `build` Commits that affect build-related components such as build tools, dependencies, project version, ...
- `ops` Commits that affect operational aspects like infrastructure (IaC), deployment scripts, CI/CD pipelines, backups, monitoring, or recovery procedures, ...
- `chore` Commits that represent tasks like initial commit, modifying `.gitignore`, ...

---

# References
https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13

https://dev.to/varbsan/a-simplified-convention-for-naming-branches-and-commits-in-git-il4
