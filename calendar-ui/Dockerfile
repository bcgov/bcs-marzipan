FROM node:24-alpine AS build
WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy all packages and UI source
COPY packages/ ./packages/
COPY calendar-ui/ ./calendar-ui/

RUN npm ci --ignore-scripts

# ARG VITE_API_BASE_URL
# ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
# Build shared packages, then the UI
RUN NODE_OPTIONS=--max-old-space-size=4096 \
    npm run build --workspace=packages/database && \
    npm run build --workspace=packages/shared && \
    npm run build --workspace=calendar-ui

FROM docker.io/library/nginx:alpine
COPY --from=build /app/calendar-ui/dist /usr/share/nginx/html
COPY --from=build /app/calendar-ui/nginx.conf /etc/nginx/conf.d/default.conf
RUN chmod -R g+rwX /var/cache/nginx /var/run /usr/share/nginx/html \
    && chgrp -R 0 /var/cache/nginx /var/run /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]