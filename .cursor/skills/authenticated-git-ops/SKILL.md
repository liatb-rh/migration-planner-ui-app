---
name: authenticated-git-ops
description: Provides ready-to-use commands for git operations requiring user authentication (commits, push, PR creation).
disable-model-invocation: true
---

# Authenticated Git Operations

## Overview

Provides copy-paste commands for git operations that require user authentication. Use this skill when the agent cannot execute commands due to:

- GPG-signed commits requiring a passphrase
- Git push requiring GitHub credentials
- GitHub API calls requiring elevated permissions

## When to Use

Call this skill when you need to:

1. Commit changes (GPG signing required)
2. Push to a remote branch
3. Create a pull request on the upstream repository

## Command Templates

### 1. Commit with GPG Signing

```bash
git commit -s -m '<TICKET-ID> | <type>: <short description>

<bullet-list of changes>'
```

**Example:**

```bash
git commit -s -m 'ECOPROJECT-1234 | fix: Resolve cluster selection bug

- Updated Report.tsx to auto-select first cluster
- Added tests for new behavior
- Fixed lint warnings'
```

### 2. Push to Remote

```bash
git push -u origin <branch-name>
```

**Example:**

```bash
git push -u origin ECOPROJECT-1234
```

### 3. Create Pull Request (Upstream)

```bash
gh pr create --repo kubev2v/migration-planner-ui-app \
  --title "<TICKET-ID> | <type>: <short description>" \
  --body "## Summary
<bullet-list of changes>

## Test plan
- [ ] <test item 1>
- [ ] <test item 2>

Fixes: [<TICKET-ID>](https://issues.redhat.com/browse/<TICKET-ID>)"
```

**Example:**

```bash
gh pr create --repo kubev2v/migration-planner-ui-app \
  --title "ECOPROJECT-1234 | fix: Resolve cluster selection bug" \
  --body "## Summary
- Auto-select first cluster on initial load
- Makes recommendations button visible by default
- Preserves user ability to select 'All clusters'

## Test plan
- [x] All tests pass
- [x] Lint checks pass
- [ ] Manual verification of cluster selection

Fixes: [ECOPROJECT-1234](https://issues.redhat.com/browse/ECOPROJECT-1234)"
```

## Workflow

1. Agent stages files with `git add`
2. Agent provides commit command (user executes)
3. User confirms commit done
4. Agent provides push command (user executes)
5. User confirms push done
6. Agent provides PR command (user executes)
7. User shares PR URL

## Notes

- Always use the `-s` flag for commits (sign-off required)
- PR target repo is `kubev2v/migration-planner-ui-app` (upstream)
- Branch names should match the Jira ticket ID (e.g., `ECOPROJECT-1234`)
