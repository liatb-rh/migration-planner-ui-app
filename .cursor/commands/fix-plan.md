# Fix Plan

Create a plan describing how to fix the issue specified in $ARGUMENTS.

## Steps

1. Parse the issue identifier from arguments (by default assume it's a JIRA ticket)
2. If it's a GitHub issue, fetch details with `gh issue view <number>`
3. Search the codebase for relevant code using semantic search and grep
4. Understand the root cause before making changes
5. Create a plan describing how to address the issue following project conventions:
   - Use TypeScript with proper types
   - Follow PatternFly patterns for UI components
   - Add or update tests if applicable
