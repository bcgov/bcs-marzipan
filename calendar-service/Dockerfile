FROM node:24-alpine AS build
WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy all packages and service source
COPY packages/ ./packages/
COPY calendar-service/ ./calendar-service/

# Install all dependencies for building (skip optional platform-specific binaries)
RUN npm ci --ignore-scripts --omit=optional

# Build packages first, then service
RUN npm run build --workspace=packages/database && \
    npm run build --workspace=packages/shared && \
    npm run build --workspace=calendar-service


FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy workspace package files for dependency resolution
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy package.json files for all packages (for workspace resolution)
COPY --from=build /app/packages/database/package*.json ./packages/database/
COPY --from=build /app/packages/shared/package*.json ./packages/shared/
COPY --from=build /app/calendar-service/package*.json ./calendar-service/

# Copy only the built dist folders
COPY --from=build /app/packages/database/dist ./packages/database/dist/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist/
COPY --from=build /app/calendar-service/dist ./calendar-service/dist/

# Install production dependencies only for the workspace
# Skip optional packages (e.g. platform-specific rollup binaries)
RUN npm ci --production --ignore-scripts --no-optional --workspaces --workspace-root

EXPOSE 3001
WORKDIR /app/calendar-service
CMD ["node", "dist/main.js"]