FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf "server {listen 80;root /usr/share/nginx/html;index index.html;\
location / { try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

