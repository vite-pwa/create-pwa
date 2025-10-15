/**
 * IMPORTANT: DO NOT DELETE THIS FILE.
 *
 * This file serves as a workaround to prevent `bumpp` from incorrectly loading
 * the main `index.js` CLI entry point when running the 'release' script via pnpm.
 *
 * This issue happens locally when `bumpp` is executed. Its configuration loader
 * (`c12`/`unconfig`) mistakenly resolves and executes/loads `index.js` if no
 * explicit config file like this one is found.
 *
 * This causes a conflict in the terminal, making the project's own CLI prompts
 * appear and interfere with the `bumpp` release process.
 *
 * Providing this empty config file satisfies the loader and fixes this issue.
 */
export default {}
