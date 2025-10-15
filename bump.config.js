/**
 * IMPORTANT: DO NOT DELETE THIS FILE.
 *
 * This file serves as a workaround to prevent `bumpp` from incorrectly loading
 * the main `index.js` CLI entry point when running the 'release' script via pnpm.
 *
 * The configuration loader used by `bumpp` (c12/unconfig) seems to resolve and
 * execute/load `index.js` if no explicit config file like this one is found.
 * This causes a conflict, making the project's own CLI prompts appear during
 * the release process.
 *
 * Providing this empty, explicit config file satisfies the loader and prevents it
 * from mistakenly executing the main CLI script.
 */
export default {}
