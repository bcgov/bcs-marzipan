# Docker Deployment Guide

This guide covers Docker usage for both development (docker-compose) and production deployment.

## Prerequisites

- **Docker must be running**: Start Docker Desktop (macOS) or Docker daemon (Linux)
- **Environment variables**: Ensure `.env` file exists in project root with required variables (see `.env.example`)
- **Build context**: All Docker commands must be run from the **project root directory**

## Development with Docker Compose

Docker Compose is the recommended way to run services during development. It automatically loads environment variables from `.env` and manages service dependencies.

### Building and Stopping Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build calendar-service

# Rebuild without cache (use when dependencies change)
docker-compose build --no-cache

# Build and start in one command
docker-compose up --build

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Viewing Logs

```bash
# View logs for all services
docker-compose logs

# View logs for specific service
docker-compose logs calendar-service

# Follow logs in real-time
docker-compose logs -f calendar-service

# View last N lines
docker-compose logs --tail=50 calendar-service
```

### Service Management

```bash
# Restart a service
docker-compose restart calendar-service

# Stop a service (keeps container)
docker-compose stop calendar-service

# Start a stopped service
docker-compose start calendar-service

# View running services
docker-compose ps

# Execute command in running container
docker-compose exec calendar-service sh
```

### Environment Variables

The `docker-compose.yaml` automatically loads variables from `.env` via the `env_file` directive. Required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `API_KEY` - API authentication key
- `PORT` - Service port (defaults to 3001)
- `VITE_API_BASE_URL` - Frontend API base URL (defaults to http://localhost:3001)

## Production Deployment Builds

For production deployments, build images directly using Docker. These images can be tagged and pushed to a container registry.

### Building Production Images

```bash
# Build calendar-service
docker build -f calendar-service/Dockerfile -t calendar-service:latest .

# Build calendar-ui
docker build -f calendar-ui/Dockerfile -t calendar-ui:latest .

# Build with specific tag/version
docker build -f calendar-service/Dockerfile -t calendar-service:v1.0.0 .

# Build without cache (ensures fresh build)
docker build --no-cache -f calendar-service/Dockerfile -t calendar-service:latest .
```

### Running Production Images

```bash
# Run calendar-service (requires .env file)
docker run -d \
  --name calendar-service \
  -p 3001:3001 \
  --env-file .env \
  calendar-service:latest

# Run calendar-ui
docker run -d \
  --name calendar-ui \
  -p 8080:80 \
  -e VITE_API_BASE_URL=http://localhost:3001 \
  calendar-ui:latest
```

### Image Management

```bash
# List images
docker images | grep -E "calendar-service|calendar-ui"

# Remove image
docker rmi calendar-service:latest

# Remove all unused images
docker image prune -a

# Tag for registry push
docker tag calendar-service:latest registry.example.com/calendar-service:v1.0.0
docker push registry.example.com/calendar-service:v1.0.0
```

## Service Ports

- **calendar-service**: `3001` (API)
- **calendar-ui**: `8080` (maps to container port 80)

Access services:

- API: http://localhost:3001
- UI: http://localhost:8080

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Kill process (replace PID)
kill -9 <PID>

# Or change port in docker-compose.yaml
```

### Environment Variables Not Loading

- Ensure `.env` file exists in project root
- Verify `DATABASE_URL` and other required variables are set
- Use `docker-compose config` to verify variable interpolation
- Check logs: `docker-compose logs calendar-service`

### Rebuild After Dependency Changes

```bash
# Clean rebuild (removes cache)
docker-compose build --no-cache calendar-service
docker-compose up -d calendar-service
```

### View Container Status

```bash
# Check if containers are running
docker-compose ps

# Inspect container details
docker inspect bcs-marzipan-calendar-service-1

# Check container logs
docker logs <container-name>
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove unused images, containers, networks
docker system prune -a
```

## Build Process Details

### Calendar Service Build

1. **Stage 1 (Build)**: Installs dependencies, builds workspace packages (`@corpcal/database`, `@corpcal/shared`), compiles NestJS application
2. **Stage 2 (Production)**: Copies built artifacts and production dependencies only

### Calendar UI Build

1. **Stage 1 (Build)**: Installs dependencies, builds workspace package (`@corpcal/shared`), builds Vite/React application
2. **Stage 2 (Production)**: Uses nginx to serve static build artifacts

Both builds use multi-stage Dockerfiles to minimize final image size.
