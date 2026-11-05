/**
 * Vite+ toolchain config: format (Oxfmt), lint + type check (Oxlint with
 * tsgolint), unit tests (Vitest) and staged-file checks.
 *
 * Next.js still owns `dev` and `build` (Turbopack). Vite+ is used for the
 * static checks and tests only. `vp check` is the single static gate; see the
 * constitution in AGENTS.md.
 */
import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: { tsconfigPaths: true },

  fmt: {
    printWidth: 110,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    sortPackageJson: true,
    ignorePatterns: [
      ".next/**",
      "next-env.d.ts",
      "package-lock.json",
      "src/lib/supabase/database.types.ts",
      "supabase/**",
      "docs/**",
      "*.md",
    ],
  },

  lint: {
    plugins: ["typescript", "unicorn", "oxc", "import", "react", "jsx-a11y", "nextjs", "vitest", "promise"],
    jsPlugins: ["./tools/lint/constitution.ts"],
    categories: {
      correctness: "error",
      suspicious: "error",
      perf: "warn",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    ignorePatterns: [".next/**", "next-env.d.ts", "src/lib/supabase/database.types.ts", "supabase/**"],
    rules: {
      // Constitution (AGENTS.md "Hard rules"). Never downgrade these to warnings.
      "constitution/supabase-server-only": "error",
      "constitution/no-get-session": "error",
      "constitution/no-service-role": "error",
      "constitution/rpc-only-lifecycle": "error",
      "constitution/require-role": "error",
      "constitution/dynamic-rendering-only": "error",
      "constitution/no-inline-script": "error",
      "constitution/token-colors-only": "error",

      // Security
      "react/no-danger": "error",
      "no-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "react/jsx-no-target-blank": "error",

      // Types: strict, no escape hatches
      "typescript/no-explicit-any": "error",
      "typescript/no-non-null-assertion": "error",
      "typescript/ban-ts-comment": ["error", { "ts-expect-error": "allow-with-description" }],
      "typescript/consistent-type-imports": "error",
      "typescript/no-floating-promises": "error",
      "typescript/no-misused-promises": "error",
      "typescript/await-thenable": "error",
      "typescript/switch-exhaustiveness-check": "error",
      "typescript/no-unnecessary-type-assertion": "error",

      // React / hooks (automatic JSX runtime: React is never in scope)
      "react/react-in-jsx-scope": "off",
      "react/rules-of-hooks": "error",
      "react/exhaustive-deps": "error",
      "react/jsx-key": "error",

      // Hygiene
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "import/no-cycle": "error",
      "import/no-duplicates": "error",
      // `server-only` and global CSS are side-effect imports by design.
      "import/no-unassigned-import": ["error", { allow: ["server-only", "**/*.css"] }],
      // Declared return types already force every path to return; redirect() returns `never`.
      "typescript/consistent-return": "off",
    },
    overrides: [
      {
        // The lint plugin, its tests and this config name forbidden patterns on purpose.
        files: ["tools/lint/**", "vite.config.mts"],
        rules: { "constitution/no-service-role": "off" },
      },
      {
        // Tests feed hostile input (javascript: URLs, bad casts) to the code under test.
        files: ["**/*.test.ts"],
        rules: { "no-script-url": "off" },
      },
      {
        // CLI scripts report progress on stdout.
        files: ["scripts/**"],
        rules: { "no-console": "off" },
      },
    ],
  },

  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tools/**/*.test.ts"],
  },

  staged: {
    "*.{ts,tsx,mts,mjs,js,json,css}": "vp check --fix",
  },
});
