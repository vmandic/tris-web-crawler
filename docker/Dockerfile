# Stage 1: Build the app
FROM node:21-alpine3.18 as build

WORKDIR /usr/src/app

COPY yarn.lock ./
COPY package*.json ./

# Install only production dependencies
RUN yarn install --production

# Stage 2: Create a an app builder image with typescript
FROM node:21-alpine3.18 as appbuild

WORKDIR /usr/src/app

# Copy only the necessary files from the build stage
COPY --from=build /usr/src/app/yarn.lock ./
COPY --from=build /usr/src/app/package.json .
COPY --from=build /usr/src/app/node_modules ./node_modules

# Install typescript here and do not copy it to final image
RUN yarn add typescript@5.3.3 --dev

# Copy and build the application files
COPY . .
RUN yarn build:production

# Stage 3: Create a smaller image without typescript
FROM node:21-alpine3.18

WORKDIR /usr/src/app

# Required so that getRootDir() works, lol
COPY --from=build /usr/src/app/package.json .

# Copy only the necessary files from the build stage, no --dev deps
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=appbuild /usr/src/app/dist ./dist
COPY --from=appbuild /usr/src/app/.env.example ./.env

# Expose the HTTP server port
EXPOSE 8080

ENV NODE_ENV=production

# Run app
ENTRYPOINT ["node", "./dist/http_server.js", "8080"]
