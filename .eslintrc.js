module.exports = {
  root: true,
  extends: [
    "@react-native",
    "plugin:react/recommended",
    "plugin:react-native/all",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2021,
    sourceType: "module",
  },
  plugins: ["react", "react-native"],
  rules: {
    "react-native/no-inline-styles": "off",
    "react-native/no-unused-styles": "warn",
    "react-native/no-color-literals": "off",
    "react/no-unescaped-entities": "off",
    "react/prop-types": "off",
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
    quotes: ["error", "double"],
    "react-native/sort-styles": "off",
    "react/display-name": "off",
  },
};
