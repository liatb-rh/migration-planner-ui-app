# Create Pull Request

Create a pull request for the current changes.

## Steps

1. Run `make validate-all` to ensure code passes all checks
2. Look at staged and unstaged changes with `git diff` and `git diff --cached`
3. Write a commit message following the format: `ECOPROJECT-XXXX | type: description`
   - If no JIRA ticket is provided, use this format: `NO-JIRA | type: description`
4. Sign off the commit with the `-s` flag
5. Commit and push to the current branch
6. Use `gh pr create` to open a pull request with:
   - A clear title matching the commit message
   - A description explaining what changed and why
   - Screenshots if UI changes were made
7. Return the PR URL when done
