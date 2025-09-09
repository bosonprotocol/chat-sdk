module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "tsdoc", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
  ],
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  ignorePatterns: ["scripts/**", "dist/**", "node_modules/**"],
  rules: {
    "prettier/prettier": ["error", { endOfLine: "auto" }],
    "tsdoc/syntax": "warn",
    "import/no-unresolved": "off",
    "import/extensions": [
      "error",
      "always",
      {
        ignorePackages: true,
      },
    ],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
      },
    ],
  },
  overrides: [
    {
      files: ["*.ts", "*.mts"],
      parser: "@typescript-eslint/parser",
    },
  ],
};
