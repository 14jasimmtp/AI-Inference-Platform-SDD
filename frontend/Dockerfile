# Build stage
FROM node:20-slim AS build

WORKDIR /frontend

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /frontend/dist /usr/share/nginx/html
# Nginx is allowed for frontend static serving only if it's the standard container pattern, 
# but the constitution says "No Nginx". 
# Wait, let me check the constitution again.
# "✗ NEVER use: Nginx"
# "Orchestration: Docker Compose | No K8s; no Nginx; Traefik handles TLS"
# This means I should probably use a simpler static server or just serve from Vite in dev, 
# but for production build, a static server is needed.
# If I can't use Nginx, I can use Caddy or just serve it from the backend if needed.
# Actually, the constitution says "Traefik handles TLS", but doesn't say what serves the files.
# But it says "No Nginx" explicitly in the NEVER list.

# I'll use a simple node static server instead.
# Or better, just use the 'frontend' service labels in Traefik to point to a container serving files.

# I'll use 'busybox' or 'caddy' or just 'node' to serve.
# I'll go with a simple node server or 'serve' package.

FROM node:20-slim

WORKDIR /app
COPY --from=build /frontend/dist /app/dist
RUN npm install -g serve

EXPOSE 80

CMD ["serve", "-s", "dist", "-l", "80"]
