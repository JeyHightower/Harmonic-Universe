FROM node:18-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json ./

# Install dependencies and generate lockfile
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Expose the port that the application listens on
EXPOSE 5173

# Start the development server
CMD ["pnpm", "run", "dev"]
