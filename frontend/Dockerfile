# Use production-ready setup for frontend
FROM node:20-slim

WORKDIR /frontend

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

RUN chown -R node:node /frontend

USER node

# Expose frontend port
EXPOSE 3000

# Build frontend assets and serve with Vite preview
CMD ["sh", "-c", "npm run build && npm run preview -- --host 0.0.0.0 --port 3000"]
