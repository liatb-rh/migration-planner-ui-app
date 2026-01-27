const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

module.exports = () => {
  const config = {
    mode: "development",
    devtool: "source-map",

    entry: "./src/standalone-entry.tsx",

    output: {
      filename: "js/bundle.[contenthash].js",
      path: path.resolve(__dirname, "dist-standalone"),
      publicPath: "/",
      clean: true,
    },

    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: [
            /node_modules\/(?!@migration-planner-ui)/,
            /\.test\.(ts|tsx)$/,
            /\.spec\.(ts|tsx)$/,
          ],
          use: [
            {
              loader: "ts-loader",
              options: {
                compilerOptions: {
                  jsx: "react-jsx",
                },
                transpileOnly: true,
              },
            },
          ],
          include: [
            path.resolve(__dirname, "src"),
            path.resolve(__dirname, "node_modules/@migration-planner-ui"),
            // path.resolve(__dirname, 'node_modules/@migration-planner-ui/agent-client/src'),
          ],
        },
        // Allow extensionless ESM imports (e.g., './Label') inside the api-client dist
        {
          test: /\.js$/,
          include: [
            path.resolve(
              __dirname,
              "node_modules/@migration-planner-ui/api-client/dist",
            ),
          ],
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
          // PatternFly CSS is often in node_modules, so this rule should apply to it.
          // If you have Sass files, you might need to add 'sass-loader' here:
          // use: ['style-loader', 'css-loader', 'sass-loader'],
        },
        // --- If you use SASS/SCSS for your own components, add a specific rule for that ---
        // {
        //   test: /\.scss$/,
        //   use: ['style-loader', 'css-loader', 'sass-loader'],
        // },
        {
          test: /\.(png|svg|jpg|jpeg|gif|woff|woff2|eot|ttf|otf)$/i,
          type: "asset/resource",
          generator: {
            filename: "assets/[name].[contenthash][ext]",
          },
        },
      ],
    },

    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      fullySpecified: false,
      byDependency: {
        esm: {
          fullySpecified: false,
        },
      },
      alias: {
        "@redhat-cloud-services/frontend-components/useChrome": path.resolve(
          __dirname,
          "src/standalone-mocks/useChrome-mock.ts",
        ),
        "@redhat-cloud-services/frontend-components/InvalidObject":
          path.resolve(
            __dirname,
            "src/standalone-mocks/frontend-components-mock.tsx",
          ),
        "@redhat-cloud-services/frontend-components/PageHeader": path.resolve(
          __dirname,
          "src/standalone-mocks/frontend-components-mock.tsx",
        ),
        "@redhat-cloud-services/frontend-components": path.resolve(
          __dirname,
          "src/standalone-mocks/frontend-components-mock.tsx",
        ), // Keep as fallback
        "@redhat-cloud-services/frontend-components-notifications":
          path.resolve(
            __dirname,
            "src/standalone-mocks/notifications-mock.tsx",
          ),
        "@redhat-cloud-services/frontend-components-utilities": path.resolve(
          __dirname,
          "src/standalone-mocks/utilities-mock.ts",
        ),
      },
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/standalone.html", // This path seems correct if public is at root
        filename: "index.html",
      }),
      new webpack.DefinePlugin({
        "process.env.STANDALONE_MODE": JSON.stringify(true),
        "process.env.PLANNER_API_BASE_URL": JSON.stringify(
          process.env.USE_MIGRATION_PLANNER_API === "true"
            ? process.env.PLANNER_API_BASE_URL || ""
            : "/planner",
        ),
        "process.env.MIGRATION_PLANNER_UI_GIT_COMMIT": JSON.stringify(
          process.env.MIGRATION_PLANNER_UI_GIT_COMMIT,
        ),
        "process.env.MIGRATION_PLANNER_UI_VERSION": JSON.stringify(
          process.env.MIGRATION_PLANNER_UI_VERSION,
        ),
      }),
      // Append .js to extensionless relative imports, but only within the api-client dist
      new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
        try {
          const inApiClientDist =
            resource.context &&
            (resource.context.includes(
              "/node_modules/@migration-planner-ui/api-client/dist/models",
            ) ||
              resource.context.includes(
                "/node_modules/@migration-planner-ui/api-client/dist/apis",
              ) ||
              resource.context.includes(
                "/node_modules/@migration-planner-ui/api-client/dist",
              ));
          const isRelative =
            typeof resource.request === "string" &&
            resource.request.startsWith("./");
          const hasExtension =
            typeof resource.request === "string" &&
            path.extname(resource.request) !== "";
          if (inApiClientDist && isRelative && !hasExtension) {
            resource.request = `${resource.request}.js`;
          }
        } catch (error) {
          console.error(error);
        }
      }),
    ],
  };

  // Configure webpack-dev-server with proper proxy settings
  // Using array format for compatibility with webpack-dev-server v5+
  const devServerConfig = {
    port: 3000,
    historyApiFallback: true,
    open: ["/openshift/migration-assessment"],
    hot: true,
    compress: true,
  };

  // Configure proxy based on environment variable
  if (process.env.PLANNER_LOCAL_DEV === "true") {
    // Local development: proxy to local migration-planner API
    devServerConfig.proxy = [
      {
        context: ["/planner"],
        target: "http://localhost:3443",
        secure: false,
        changeOrigin: true,
        pathRewrite: {
          "^/planner": "", // Remove /planner prefix for local dev
        },
      },
    ];
  } else {
    // Default: proxy to remote services
    devServerConfig.proxy = [
      {
        context: ["/api/migration-assessment"],
        target:
          "https://migration-planner-assisted-migration-stage.apps.crcs02ue1.urby.p1.openshiftapps.com",
        secure: false,
        changeOrigin: true,
      },
      {
        context: ["/planner"],
        target: "http://localhost:3443",
        secure: false,
        changeOrigin: true,
      },
    ];
  }

  config.devServer = devServerConfig;
  return config;
};
