# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/homey-mcp

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (adjust if needed)
EXPOSE 3000

# Generate the .env file and then start the app
CMD ["/bin/sh", "-c", "npm run mcp-http"]