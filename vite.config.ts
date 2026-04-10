import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@ubs-platform/neolit/core": path.resolve(__dirname, "src/package/core/index.ts"),
            "@ubs-platform/neolit/jsx-runtime": path.resolve(__dirname, "src/package/jsx/jsx-runtime.ts"),
            "@ubs-platform/neolit/jsx-dev-runtime": path.resolve(__dirname, "src/package/jsx/jsx-dev-runtime.ts"),
        },
    },
});
