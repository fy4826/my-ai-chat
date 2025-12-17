import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Docs: https://rsbuild.rs/config/
export default defineConfig({
    html: {
        title: "AI Chat",
    },
    plugins: [pluginReact()],
    server: {
        port: 3001,
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
            },
        },
    },
});
