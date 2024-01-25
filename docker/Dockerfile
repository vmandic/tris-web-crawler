# Stage 1: Build the app
FROM node:21-alpine3.18 as build

WORKDIR /usr/src/app

COPY yarn.lock ./
COPY package*.json ./

# Install only production dependencies
RUN yarn install --production

# Copy the application files
COPY . .

# Stage 2: Create a smaller image
FROM node:21-alpine3.18

WORKDIR /usr/src/app

# Copy only the necessary files from the build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/src ./src
COPY --from=build /usr/src/app/.env.example ./.env

# Expose the HTTP server port
EXPOSE 8080

# Expose the WebSocket port
EXPOSE 8082

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Run app
ENTRYPOINT ["node", "--experimental-modules", "./src/http_server.mjs", "8080"]
