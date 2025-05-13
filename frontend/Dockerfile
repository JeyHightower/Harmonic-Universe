FROM node:18-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Set up pnpm global bin directory
ENV PNPM_HOME=/usr/local/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN mkdir -p $PNPM_HOME

# Create .npmrc file
RUN echo "strict-peer-dependencies=false" > .npmrc

# Copy root and frontend package files
COPY package.json pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/package.json

# Install dependencies including vite
RUN pnpm install --filter frontend...

# Alternatively, install vite via npm globally since we already have npm
RUN npm install -g vite

# Add this to your frontend Dockerfile before running the app
RUN npm install --save-dev @vitejs/plugin-react

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm run build

# Expose the port
EXPOSE 5173

# Start the development server
CMD ["pnpm", "run", "dev"]
