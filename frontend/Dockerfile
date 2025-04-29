FROM node:18-alpine

WORKDIR /app

# Install pnpm globally and clear npm cache
RUN npm install -g pnpm && \
    npm cache clean --force

# Create .npmrc file to handle peer dependencies
RUN echo "strict-peer-dependencies=false" > .npmrc

# Copy package files
COPY package.json ./

# Install dependencies with force flag
RUN pnpm install --force

# Copy the rest of the application code
COPY . .

# Install dependencies again after copying all files
RUN pnpm install --force

# Clear npm cache again
RUN npm cache clean --force

# Set Node.js path to Homebrew installation
ENV PATH="/opt/homebrew/bin:${PATH}"

# Expose the port that the application listens on
EXPOSE 5173

# Start the development server
CMD ["pnpm", "run", "dev"]
