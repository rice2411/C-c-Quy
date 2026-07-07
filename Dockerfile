# ── Build (Vite) ──
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Env inline lúc build (Vite). Ghi vào .env.production.local để loadEnv chắc chắn đọc được.
ARG VITE_API_URL=
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_RICE_AUTH_URL=
RUN if [ -n "$VITE_API_URL" ]; then echo "VITE_API_URL=$VITE_API_URL" >> .env.production.local; fi
RUN if [ -n "$VITE_GOOGLE_CLIENT_ID" ]; then echo "VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID" >> .env.production.local; fi
RUN if [ -n "$VITE_RICE_AUTH_URL" ]; then echo "VITE_RICE_AUTH_URL=$VITE_RICE_AUTH_URL" >> .env.production.local; fi
RUN npm run build

# ── Serve (nginx) ──
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
