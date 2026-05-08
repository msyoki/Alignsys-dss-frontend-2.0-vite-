# Dockerfile for frontend
FROM node:18

WORKDIR /app

# Install dependencies
COPY package.json .
COPY package-lock.json .
RUN npm install

# Copy project files
COPY . .

# Build the React app
RUN npm run build

# Install serve to serve the build files
RUN npm install -g serve

# Serve the build files
CMD ["serve", "-s", "build"]
