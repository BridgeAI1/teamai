FROM node:18-alpine

WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install --omit=dev

# Copy application files
COPY . .
RUN mkdir -p data

# Expose port (Render uses PORT env var)
ENV PORT=3001
EXPOSE 3001

# Start application
CMD ["node", "server.js"]
