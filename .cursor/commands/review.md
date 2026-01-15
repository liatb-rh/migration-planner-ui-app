# Review Changes

Review the current changes for issues and improvements.

## Steps

1. Get the current diff with `git diff` and `git diff --cached`
2. Analyze the changes for:
   - **Correctness**: Does the code work as intended?
   - **Types**: Are TypeScript types properly defined?
   - **React patterns**: Are hooks used correctly? Any missing dependencies?
   - **PatternFly usage**: Are components used according to PatternFly guidelines?
   - **Performance**: Any unnecessary re-renders or expensive operations?
   - **Security**: Any potential vulnerabilities?
3. Run `make validate-all` to check for linting/formatting/type issues
4. Run `npm test` to ensure tests pass
5. Provide a summary of:
   - Issues found that should be fixed
   - Suggestions for improvements
   - What looks good
