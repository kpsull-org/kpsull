import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      "@next/next/no-html-link-for-pages": ["error", "src/app"],
    },
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["src/app/not-found.tsx", "src/app/error.tsx", "src/app/global-error.tsx"],
  },
];

export default eslintConfig;
