import { defineConfig } from "vite";
import path from "path";

/**
 * Library build config for publishing @ubs-platform/neolit to npm.
 * Produces ESM + CJS outputs with type declarations via tsconfig.lib.json.
 *
 * Entry points:
 *   @ubs-platform/neolit/core          -> src/package/core/index.ts
 *   @ubs-platform/neolit/injectables   -> src/package/injectables/index.ts
 *   @ubs-platform/neolit/jsx-runtime   -> src/package/jsx/jsx-runtime.ts
 *   @ubs-platform/neolit/jsx-dev-runtime -> src/package/jsx/jsx-dev-runtime.ts
 *   @ubs-platform/neolit/structural    -> src/package/structural/index.ts
 */
export default defineConfig({
    build: {
        outDir: "dist/lib",
        emptyOutDir: true,
        lib: {
            entry: {
                core: path.resolve(__dirname, "src/package/core/index.ts"),
                injectables: path.resolve(__dirname, "src/package/injectables/index.ts"),
                "jsx-runtime": path.resolve(__dirname, "src/package/jsx/jsx-runtime.ts"),
                "jsx-dev-runtime": path.resolve(__dirname, "src/package/jsx/jsx-dev-runtime.ts"),
                structural: path.resolve(__dirname, "src/package/structural/index.ts"),
            },
            formats: ["es", "cjs"],
        },
        rollupOptions: {
            // Keep these as external — consumers supply their own DOM environment.
            external: [],
        },
    },
    resolve: {
        alias: {
            "@ubs-platform/neolit/core": path.resolve(__dirname, "src/package/core/index.ts"),
            "@ubs-platform/neolit/injectables": path.resolve(__dirname, "src/package/injectables/index.ts"),
            "@ubs-platform/neolit/jsx-runtime": path.resolve(__dirname, "src/package/jsx/jsx-runtime.ts"),
            "@ubs-platform/neolit/jsx-dev-runtime": path.resolve(__dirname, "src/package/jsx/jsx-dev-runtime.ts"),
        },
    },
});
