# Use development setup for frontend
FROM node:20-slim

WORKDIR /frontend

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose Vite's default port
EXPOSE 3000

# Start Vite dev server on all network interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

