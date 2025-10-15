/**
 * IMPORTANT: DO NOT DELETE THIS FILE.
 *
 * This file serves as a workaround to prevent `changelogithub` from incorrectly loading
 * the main `index.js` CLI entry point during the GitHub Release workflow execution.
 *
 * This issue happens specifically when the reusable release workflow from sxzz (Kevin)
 * runs the `changelogithub` tool. Its configuration loader (`c12`/`unconfig`)
 * mistakenly resolves and executes/loads `index.js` if no explicit config file is found.
 *
 * This fails in the CI environment because the `dist/` directory has not been built yet,
 * causing the changelog generation to crash and thus preventing the GitHub Release from
 * being created.
 *
 * Providing this empty config file satisfies the loader and fixes this issue.
 */
export default {}
