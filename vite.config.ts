import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        tailwindcss(),
    ],
    resolve: {
        
        alias: {
            "@ubs-platform/neolit/core": path.resolve(__dirname, "src/package/core/index.ts"),
            "@ubs-platform/neolit/injectables": path.resolve(__dirname, "src/package/injectables/index.ts"),
            "@ubs-platform/neolit/structural": path.resolve(__dirname, "src/package/structural/index.ts"),
            "@ubs-platform/neolit/jsx-runtime": path.resolve(__dirname, "src/package/jsx/jsx-runtime.ts"),
            "@ubs-platform/neolit/jsx-dev-runtime": path.resolve(__dirname, "src/package/jsx/jsx-dev-runtime.ts"),
        },
    },
});
