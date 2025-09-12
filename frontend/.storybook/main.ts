import type { StorybookConfig } from '@storybook/react-webpack5';
import path from 'path';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions"
  ],
  "framework": {
    "name": "@storybook/react-webpack5",
    "options": {}
  },
  webpackFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve?.alias || {}),
      '@': path.resolve(__dirname, '../src'),
    } as any;
    config.resolve.extensions = Array.from(new Set([...(config.resolve?.extensions || []), '.ts', '.tsx'])) as any;
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      tty: require.resolve('tty-browserify'),
      os: require.resolve('os-browserify/browser'),
    } as any;

    config.module = config.module || { rules: [] } as any;
    (config.module as any).rules = [
      ...((config.module as any).rules || []),
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: {
              presets: [
                [require.resolve('@babel/preset-typescript'), { allowDeclareFields: true }],
                [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
              ],
            },
          },
        ],
      },
    ];
    return config;
  }
};
export default config;
