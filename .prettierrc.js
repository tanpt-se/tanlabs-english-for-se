/** @type {import('prettier').Config} */
module.exports = {
  // Cross-platform: force LF so Windows/macOS/Linux CI all agree
  endOfLine: 'lf',

  // Layout
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,

  // Quotes & punctuation
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  quoteProps: 'as-needed',
  trailingComma: 'all',

  // Spacing & wrapping
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  // Misc
  proseWrap: 'preserve',
};
