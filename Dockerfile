# Use a slim Node.js 18 image
FROM node:18-slim

# Install build tools for native modules if needed
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy the rest of the code
COPY . .

# Expose app port
EXPOSE 4000

# Start the app using ts-node
CMD ["pnpm", "ts-node", "server.ts"]
