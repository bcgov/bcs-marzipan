FROM node:24-alpine AS build
WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy all packages and UI source
COPY packages/ ./packages/
COPY calendar-ui/ ./calendar-ui/

# Ensure npm skips optional dependencies (platform-specific binaries)
ENV NPM_CONFIG_OPTIONAL=false
# Add helper to remove windows-only optional entries from lockfile
COPY scripts/remove-windows-optional-lock.js ./scripts/remove-windows-optional-lock.js
RUN node ./scripts/remove-windows-optional-lock.js || true
# Install all dependencies for building (skip optional platform-specific binaries)
RUN npm ci --ignore-scripts --omit=optional

# Build shared packages, then the UI
RUN npm run build --workspace=packages/shared && \
    npm run build --workspace=calendar-ui

FROM docker.io/library/nginx:alpine
COPY --from=build /app/calendar-ui/dist /usr/share/nginx/html
COPY --from=build /app/calendar-ui/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]