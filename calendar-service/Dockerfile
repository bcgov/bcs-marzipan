FROM node:24-alpine AS build
WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy all packages and service source
COPY packages/ ./packages/
COPY calendar-service/ ./calendar-service/

# Ensure npm skips optional dependencies (platform-specific binaries)
ENV NPM_CONFIG_OPTIONAL=false \
    PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci --ignore-scripts

# Build packages first, then service
RUN npm run build --workspace=packages/database && \
    npm run build --workspace=packages/shared && \
    npm run build --workspace=calendar-service


FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    HOME=/tmp \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# System Chromium for report PDF export (puppeteer-core; fonts are inlined in HTML)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
  && if test -x /usr/bin/chromium-browser; then :; \
     elif test -x /usr/bin/chromium; then ln -sf /usr/bin/chromium /usr/bin/chromium-browser; \
     else echo "No Chromium binary under /usr/bin/chromium*" >&2; exit 1; fi \
  && test -x "${PUPPETEER_EXECUTABLE_PATH}"

# Copy workspace package files for dependency resolution
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy package.json files for all packages (for workspace resolution)
COPY --from=build /app/packages/database/package*.json ./packages/database/
COPY --from=build /app/packages/shared/package*.json ./packages/shared/
COPY --from=build /app/calendar-service/package*.json ./calendar-service/

# Copy built dist folders and shared static assets (fonts, styles, report images for PDF export)
COPY --from=build /app/packages/database/dist ./packages/database/dist/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist/
COPY --from=build /app/packages/shared/styles ./packages/shared/styles/
COPY --from=build /app/packages/shared/assets ./packages/shared/assets/
COPY --from=build /app/calendar-service/dist ./calendar-service/dist/

# Install production dependencies only for the workspace
# Skip optional packages (e.g. platform-specific rollup binaries)
RUN npm ci --production --ignore-scripts --no-optional --workspaces --workspace-root

EXPOSE 3001
WORKDIR /app/calendar-service
CMD ["node", "dist/main.js"]