module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    "react-native-reanimated/plugin", // This line is crucial
    [
      "module-resolver",
      {
        root: ["./src"],
        alias: {
          "~assets": "./src/assets",
          "~components": "./src/components",
          "~constants": "./src/constants",
          "~containers": "./src/containers",
          "~redux": "./src/redux",
          "~context": "./src/context",
          "~hooks": "./src/hooks",
          "~routes": "./src/routes",
          "~screens": "./src/screens",
          "~theme": "./src/theme",
          "~utils": "./src/utils",
          "~translations": "./src/translations",
          "~services": "./src/services",
          "~native": "./src/native",
          "~styles": "./src/styles",
        },
      },
    ],
  ],
};
