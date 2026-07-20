FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production || npm install --omit=dev

# Copy project files into container
COPY . .

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port configured in Fly.io
EXPOSE 8080

# Start Node server
CMD ["node", "server.js"]
