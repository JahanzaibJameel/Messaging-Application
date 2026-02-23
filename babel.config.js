module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./client",
            "@components": "./client/components",
            "@screens": "./client/screens",
            "@navigation": "./client/navigation",
            "@hooks": "./client/hooks",
            "@store": "./client/store",
            "@utils": "./client/utils",
            "@constants": "./client/constants",
            "@types": "./client/types",
            "@services": "./client/services",
            "@shared": "./shared",
          },
          extensions: [
            ".ios.ts",
            ".android.ts",
            ".ts",
            ".ios.tsx",
            ".android.tsx",
            ".tsx",
            ".ios.js",
            ".android.js",
            ".js",
            ".json",
          ],
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
