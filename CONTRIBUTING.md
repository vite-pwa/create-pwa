# Contributing Guide

Hi! We are really excited that you are interested in contributing to `@vite-pwa/astro`. Before submitting your contribution, please make sure to take a moment and read through the following guide.

Refer also to https://github.com/antfu/contribute.

## Set up your local development environment

The package manager used to install and link dependencies must be [pnpm](https://pnpm.io/).

To develop and test the `@vite-pwa/create-pwa` package:

1. Fork the `@vite-pwa/create-pwa` repository to your own GitHub account and then clone it to your local device.

2. Ensure using the latest Node.js (^18.0.0 || >=20.0.0)

3. `@vite-pwa/create-pwa` uses pnpm v9. If you are working on multiple projects with different versions of pnpm, it's recommended to enable [Corepack](https://github.com/nodejs/corepack) by running `corepack enable`.

4. Check out a branch where you can work and commit your changes:
```shell
git checkout -b my-new-branch
```

5. Run `pnpm i` in `@vite-pwa/create-pwa`'s root folder

6. Run `pnpm run build` in `@vite-pwa/create-pwa`'s root folder.

7. Change to `examples` folder and run `node ../index.js` to test the changes: don't add the created folder to git.

## Adding a new template

If you're including a new template, follow previous steps, you'll need to add `enabled: true` to the corresponding template in `src/prompts.ts` module.

Our suggestion is to run the template creation process, include/modify the assets and then copy it to the corresponding template folder.

To test the new template, run it outside the project folder, we can later add it to the `examples` folder.
