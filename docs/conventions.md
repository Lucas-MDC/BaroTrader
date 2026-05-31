# Conventions:

## Branch naming conventions:
```
<category>/<reference>/description-in-kebab-case
```

### Category
- `feature`: for adding, refactoring or removing a feature
- `bugfix`: for fixing a bug
- `hotfix`: for critical, immediate production fixes
- `test`: for experimenting outside of an issue/ticket

### Reference
Put the ID of the issue you're working on.

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

> https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13
> https://dev.to/varbsan/a-simplified-convention-for-naming-branches-and-commits-in-git-il4
