import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3009,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icon.svg", "icon.png"],
        manifest: {
          name: "Tiệm bánh Cúc Quy",
          short_name: "CucQuy",
          description:
            "Hệ thống quản lý đơn hàng thông minh cho Tiệm bánh Cúc Quy",
          theme_color: "#ea580c",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait-primary",
          start_url: "/",
          icons: [
            {
              src: "./icon.svg",
              sizes: "any",
              type: "image/svg+xml",
            },
          ],
        },
        workbox: {
          // Tăng giới hạn file size để precache (mặc định 2 MB)
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
          // Precache offline.html
          additionalManifestEntries: [{ url: "/offline.html", revision: null }],
          // NetworkFirst cho navigation, fallback về offline.html khi network fail
          navigateFallback: "/offline.html",
          navigateFallbackDenylist: [/^\/api/, /^\/offline\.html$/],
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
    ],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.FIREBASE_API_KEY": JSON.stringify(env.FIREBASE_API_KEY),
      "process.env.FIREBASE_AUTH_DOMAIN": JSON.stringify(
        env.FIREBASE_AUTH_DOMAIN
      ),
      "process.env.FIREBASE_PROJECT_ID": JSON.stringify(
        env.FIREBASE_PROJECT_ID
      ),
      "process.env.FIREBASE_STORAGE_BUCKET": JSON.stringify(
        env.FIREBASE_STORAGE_BUCKET
      ),
      "process.env.FIREBASE_MESSAGING_SENDER_ID": JSON.stringify(
        env.FIREBASE_MESSAGING_SENDER_ID
      ),
      "process.env.FIREBASE_APP_ID": JSON.stringify(env.FIREBASE_APP_ID),
      "process.env.FIREBASE_MEASUREMENT_ID": JSON.stringify(
        env.FIREBASE_MEASUREMENT_ID
      ),
      "process.env.FIREBASE_VAPID_KEY": JSON.stringify(env.FIREBASE_VAPID_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
