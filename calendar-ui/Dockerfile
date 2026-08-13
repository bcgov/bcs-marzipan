FROM artifacts.developer.gov.bc.ca/docker-remote/node:24-alpine AS build
WORKDIR /app

ARG APP_VERSION=dev
ENV VITE_APP_VERSION=$APP_VERSION

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY calendar-ui/ ./calendar-ui/

RUN npm ci --ignore-scripts

RUN NODE_OPTIONS=--max-old-space-size=4096 \
    npm run build --workspace=packages/database && \
    npm run build --workspace=packages/shared && \
    npm run build --workspace=calendar-ui


# Runtime: OpenShift-friendly, non-root nginx
FROM artifacts.developer.gov.bc.ca/docker-remote/nginxinc/nginx-unprivileged:alpine

# Static UI build output
COPY --from=build /app/calendar-ui/dist /usr/share/nginx/html

# Full nginx config with http{} that includes /tmp/default.conf
COPY calendar-ui/nginx.main.conf /etc/nginx/nginx.conf

# Server-block template rendered at container startup
COPY --from=build /app/calendar-ui/nginx.conf /tmp/default.conf.template

EXPOSE 8080

# Render env vars into server-block, then start nginx normally
CMD ["/bin/sh", "-c", "if [ -z \"${API_PROXY_UPSTREAM}\" ]; then echo 'ERROR: API_PROXY_UPSTREAM environment variable is not set. Please configure backend API URL.' >&2; exit 1; fi; envsubst '$$API_PROXY_UPSTREAM' < /tmp/default.conf.template > /tmp/default.conf && exec nginx -g 'daemon off;'"]