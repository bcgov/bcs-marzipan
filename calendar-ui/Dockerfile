
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY calendar-ui/ ./calendar-ui/

RUN npm ci --ignore-scripts

RUN NODE_OPTIONS=--max-old-space-size=4096 \
    npm run build --workspace=packages/database && \
    npm run build --workspace=packages/shared && \
    npm run build --workspace=calendar-ui


# --- Runtime: unprivileged nginx
FROM nginxinc/nginx-unprivileged:alpine

# Static files
COPY --from=build /app/calendar-ui/dist /usr/share/nginx/html

# Put your template somewhere writable/readable
COPY --from=build /app/calendar-ui/nginx.conf /tmp/default.conf.template

# Render template into /tmp and start nginx with that config
# (nginxinc/unprivileged already uses a non-root user and listens on 8080 by default)
EXPOSE 8080
CMD ["/bin/sh", "-c", "envsubst '$$API_PROXY_UPSTREAM' < /tmp/default.conf.template > /tmp/default.conf && exec nginx -g 'daemon off;' -c /tmp/default.conf"]
