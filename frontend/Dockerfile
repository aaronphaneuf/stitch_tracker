# frontend/Dockerfile
# Build
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
# VITE will read VITE_* from build-time env if you pass them; for runtime config use a /config.json pattern
RUN npm run build

# Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Optional: inject a simple default nginx config (gzip, try_files, etc.)
# COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

