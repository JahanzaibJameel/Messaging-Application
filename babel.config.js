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
            // New clean-arch aliases (src-relative)
            "@domain": "./client/src/domain",
            "@data": "./client/src/data",
            "@core": "./client/src/core",
            "@presentation": "./client/src/presentation",
            "@services": "./client/src/services",
            "@shared": "./client/src/shared",
            // Legacy UI layer aliases (still used by components/hooks/constants)
            "@": "./client",
            "@components": "./client/components",
            "@hooks": "./client/hooks",
            "@utils": "./client/utils",
            "@constants": "./client/constants",
            "@types": "./client/types",
            "@theme": "./client/theme",
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
