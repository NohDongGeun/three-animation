import { defineConfig } from "vite";
import 'dotenv/config';

export default defineConfig({
    plugins: [],
    server: {
        https: true,
        host: '192.168.0.10',
    },
    build: {
        minify: true,
    },
});

