export default {
  plugins: ["@prettier/plugin-xml", "prettier-plugin-packagejson", "@ianvs/prettier-plugin-sort-imports"],
  printWidth: 120,
  tabWidth: 2,
  semi: true,
  // "importOrderParsers": ["typescript", "jsx", "decorators"],
  overrides: [
    {
      files: ["*.html", "*.xml"],
      options: {
        // "xmlSelfClosingTags": true,
        xmlWhitespaceSensitivity: "ignore",
      },
    },
  ],
};
