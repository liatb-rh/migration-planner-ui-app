# Validate Code

Run all validation checks on the codebase.

## Steps

1. Run `make validate-all` which includes:
   - `make lint` - ESLint checks
   - `make format-check` - Prettier formatting check
   - `make type-check` - TypeScript type checking
   - `make security-scan` - Security vulnerability scan

2. If any checks fail:
   - For lint errors: Run `make lint-fix` or fix manually
   - For format errors: Run `make format`
   - For type errors: Fix the TypeScript issues
   - For security issues: Review and address vulnerabilities

3. Run `npm test` to ensure all unit tests pass

4. Report the results and any issues that need attention
