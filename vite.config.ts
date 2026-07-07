import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const siteUrl = (
    env.VITE_SITE_URL ||
    "https://admin.cucquy.site"
  ).replace(/\/$/, "");

  return {
    server: {
      port: 3009,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      {
        name: "inject-site-url-meta",
        transformIndexHtml(html) {
          return html.replaceAll("__SITE_URL__", siteUrl);
        },
      },
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "icon-v4.svg",
          "icon-v4.png",
          "og-image.jpg",
          "banner.jpg",
        ],
        manifest: {
          name: "Tiệm bánh Cúc Quy",
          short_name: "CucQuy",
          description:
            "Hệ thống quản lý đơn hàng thông minh cho Tiệm bánh Cúc Quy",
          theme_color: "#4abab9",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait-primary",
          start_url: "/",
          icons: [
            {
              src: "./icon-v4.svg",
              sizes: "any",
              type: "image/svg+xml",
            },
            {
              src: "./icon-v4.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          navigateFallbackDenylist: [
            /\.[a-zA-Z0-9]+$/,
            /^\/api\//,
          ],
        },
        devOptions: {
          // Tắt PWA Service Worker trong dev — SW cache có thể intercept request
          // mới và trả về stale HTML, làm Vite import-analysis fail. Prod vẫn build PWA.
          enabled: false,
          type: "module",
        },
      }),
    ],
    define: {
      // Secret (VISION/GEMINI/ZALO...) + Firebase đã gỡ khỏi FE — auth qua SSO RiceService.
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      // Tách vendor nặng thành chunk riêng → cache lâu + bundle chính nhẹ.
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            charts: ["recharts"],
            xlsx: ["xlsx-js-style"],
          },
        },
      },
      chunkSizeWarningLimit: 1200,
    },
  };
});
