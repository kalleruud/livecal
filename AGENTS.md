---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun instead of Node.js.
  - Use `bun <file>` instead of `node <file>` or `ts-node <file>`
  - Use `bun test` instead of `jest` or `vitest`
  - Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
  - Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
  - Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
  - Use `bunx <package> <command>` instead of `npx <package> <command>`
  - Bun automatically loads .env, so don't use dotenv.

# Rules (Important)

- Always read [`README.md`](README.md)
- Always keep relevant `.md`-files in the docs folder updated, and the `README.md`-file updated with a list of doc-files.
- Regularly commit changes with a one-line description
- Always provide tests to prove implementation works.
