FROM node:22-alpine3.21 AS build
WORKDIR /app/calendar-ui
#Copy only this service's package files
COPY calendar-ui/package*.json ./
RUN npm install

# Copy service source code
COPY calendar-ui/ ./
RUN npm run build

FROM docker.io/library/nginx:alpine
COPY --from=build /app/calendar-ui/dist /usr/share/nginx/html
# Add nginx config if needed to proxy /api to backend
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]