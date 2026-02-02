---
name: create-plan-for-jira
description: Creates a plan to address a Jira issue. Use it when the user wants you to suggest how to address an issue or implement a feature.
disable-model-invocation: true
---

# Create plan for Jira

## Overview

Creates a plan describing how to fix or implement the specified Jira issue or refine an existing one

## Prerequisites

- Cursor must be in Plan mode (user can switch via Shift+Tab or the mode selector in the UI)
- The user must be on the master branch, which must be updated with the kubev2v remote's master branch

If not in Plan mode, ask the user: "Please switch to Plan mode (Shift+Tab) so I can create a properly registered plan."

## Inputs

A Jira issue ID matching the pattern: `ECOPROJECT-\d+`

## Authentication Blockers

The agent cannot perform operations requiring user credentials. For these operations, provide ready-to-use commands for the user to copy-paste:

- **GPG-signed commits**: User's private key requires a passphrase
- **Git push**: May require GitHub authentication
- **GitHub PR creation**: MCP token may lack upstream repo permissions

Always prepare complete commands so the user can execute them directly.

## Steps

1. Use the `jira_get_issue` tool to fetch the issue details; always pay attention to linked issues (parent and child issues) to understand the full context of the task.
2. Search for an existing plan matching the issue ID, if more than one is found ask the user which one should be refined.
3. Understand the root cause before making changes.
4. Use TDD as part of the refactor strategy.
5. Create a plan describing how to address the issue:
   - If not already in Plan mode, ask the user to switch to Plan mode (Shift+Tab or via Cursor UI)
   - The Plan name must contain the issue ID and a short summary, e.g.: `ECOPROJECT-3871 | fix: Default report view to first cluster`
   - Cursor will automatically register the plan when created in Plan mode
6. Create a git branch, use the issue ID as branch name (e.g.: ECOPROJECT-1234).
7. Wait for user approval or refinement.
8. After implementation is done:
   - Validate code quality using the `/validate` skill. Fix any outstanding issues.
   - Create a pull request using the `/create-pull-request` skill.

## Workflow Checkpoints

Track progress through these phases:

- [ ] Cursor is in Plan mode
- [ ] Jira issue fetched and analyzed
- [ ] Plan created and registered by Cursor
- [ ] Branch created
- [ ] User approved plan
- [ ] Implementation complete
- [ ] Tests pass
- [ ] Validation passes
- [ ] User committed (manual - provide command)
- [ ] User pushed (manual - provide command)
- [ ] PR created (manual - provide command)
- [ ] PR URL recorded
