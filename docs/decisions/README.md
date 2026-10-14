# Architecture Decision Records

This directory contains the project's Architecture Decision Records (ADRs),
written in Markdown using the MADR format supported by the ADR Manager for VS
Code extension.

## Conventions

- Write all ADRs in English.
- Name decision records with a four-digit sequence number and a kebab-case
  title, for example `0001-client-side-authentication-state.md`.
- Keep each decision self-contained: describe its context, considered options,
  outcome, and consequences.
- Record the status, date, and deciders near the top of each ADR.
- Treat the server as the authority for authentication and authorization. A
  client-side session hint must never grant access to protected data.

The VS Code workspace recommends `stevenchen.vscode-adr-manager` and sets its
ADR directory to `docs/decisions`. ADRs remain ordinary Markdown files and can
be read or edited without the extension.

## Records

- [0001 — Client-Side Authentication State for Private Navigation](0001-client-side-authentication-state-for-private-navigation.md)
