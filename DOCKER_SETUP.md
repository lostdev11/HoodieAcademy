# Docker Setup for Hoodie Academy

This document describes the secure Docker containerization setup for the Hoodie Academy Next.js application.

## ✅ Fixed Issues

### 1. **Dependencies Fixed**
- ✅ Moved `autoprefixer` and `postcss` from `devDependencies` to `dependencies`
- ✅ Ensured all build dependencies are available during Docker build
- ✅ Fixed Tailwind CSS and PostCSS compilation issues

### 2. **TypeScript Path Aliases**
- ✅ `tsconfig.json` already has proper path mapping: `"@/*": ["./src/*"]`
- ✅ Docker can now resolve `@/components/...` imports correctly

### 3. **Dockerfile Best Practices**
- ✅ **Build stage**: Installs ALL dependencies (not just production) for proper Tailwind + PostCSS builds
- ✅ **Production stage**: Installs only production dependencies for runtime
- ✅ **Multi-stage build**: Optimizes image size while ensuring proper builds
- ✅ **Node.js 20**: Updated to support Solana packages and modern dependencies

### 4. **Package Management**
- ✅ **npm install**: Uses `npm install` instead of `npm ci` to handle lock file sync issues
- ✅ **--legacy-peer-deps**: Handles peer dependency conflicts
- ✅ **--omit=dev**: Properly excludes dev dependencies in production stage

## Security Features

### Container Hardening
- **Non-root user**: Application runs as `nextjs` user (UID 1001)
- **Read-only filesystem**: Container filesystem is read-only with tmpfs for writable directories
- **Dropped capabilities**: All Linux capabilities dropped except essential ones (CHOWN, SETGID, SETUID)
- **No new privileges**: Container cannot gain additional privileges
- **Resource limits**: Memory and CPU limits to prevent resource exhaustion
- **Signal handling**: Uses `dumb-init` for proper signal handling

### Multi-stage Build
- **Build stage**: Compiles the Next.js application with all dependencies
- **Production stage**: Contains only runtime dependencies and built application
- **Smaller image**: Final image is optimized and contains only necessary files

## Files

### Dockerfile
Main production Dockerfile with security hardening and multi-stage build.

### Dockerfile.secure
Enhanced version with additional security measures:
- Disabled npm audit during build
- Removed npm cache directories
- Added file permissions hardening
- Disabled Next.js telemetry

### Dockerfile.dev
Development Dockerfile for hot reloading and development work.

### .dockerignore
Excludes unnecessary files from Docker build context:
- `node_modules`, `.next`, build artifacts
- Environment files (`.env*`)
- Logs and temporary files
- Development and test files
- Git and editor files

### docker-compose.yml
Production-ready Docker Compose configuration with:
- Automatic restart policy
- Health checks
- Resource limits
- Security hardening
- Logging configuration
- Network isolation

### docker-compose.dev.yml
Development Docker Compose configuration with:
- Volume mounting for hot reloading
- Less strict security for development
- More generous resource limits
- Development environment variables

## Usage

### Production Build and Run

```bash
# Build and start the application
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Development Build and Run

```bash
# Build and start the development environment
docker-compose -f docker-compose.dev.yml up --build

# Run in detached mode
docker-compose -f docker-compose.dev.yml up -d --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop the development environment
docker-compose -f docker-compose.dev.yml down
```

### Build and Run with Docker

```bash
# Build the production image
docker build -t hoodie-academy .

# Build the development image
docker build -f Dockerfile.dev -t hoodie-academy-dev .

# Run the production container
docker run -d \
  --name hoodie-academy-app \
  -p 3000:3000 \
  --restart unless-stopped \
  --security-opt no-new-privileges \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /var/cache/nginx \
  --tmpfs /var/run \
  --tmpfs /var/tmp \
  --cap-drop ALL \
  --cap-add CHOWN \
  --cap-add SETGID \
  --cap-add SETUID \
  --memory=1g \
  --cpus=1.0 \
  hoodie-academy

# Run the development container with volume mounting
docker run -d \
  --name hoodie-academy-dev \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -v /app/.next \
  hoodie-academy-dev
```

## Environment Variables

The following environment variables are set in the container:
- `NODE_ENV=production` (or `development` for dev)
- `PORT=3000`
- `NEXT_TELEMETRY_DISABLED=1` (in secure version)

For additional environment variables, you can:
1. Add them to the `docker-compose.yml` file
2. Use a `.env` file (not included in the image)
3. Pass them via command line

## Health Check

The application includes a health check endpoint at `/api/health` that returns:
- Application status
- Timestamp
- Uptime
- Environment information

Docker Compose automatically monitors this endpoint and can restart the container if it becomes unhealthy.

## Key Fixes Applied

### 1. **Dependencies Structure**
```json
{
  "dependencies": {
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "next": "^14.2.29",
    // ... other dependencies
  },
  "devDependencies": {
    "@types/node": "^20.11.19",
    "@types/react": "^18.2.57",
    "@types/react-dom": "^18.2.19",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.1.0",
    "typescript": "^5.3.3"
  }
}
```

### 2. **TypeScript Configuration**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3. **Dockerfile Build Process**
```dockerfile
# Build stage - install ALL dependencies
RUN npm install --legacy-peer-deps

# Production stage - install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps
```

### 4. **Node.js Version**
```dockerfile
# Updated to Node.js 20 for Solana package compatibility
FROM node:20-alpine AS base
FROM node:20-alpine AS production
```

## Security Considerations

### Filesystem Security
- Container runs with read-only filesystem
- Writable directories are mounted as tmpfs (in-memory)
- File permissions are set to 755 for application files

### Network Security
- Container is isolated in a custom network
- Only port 3000 is exposed
- No privileged network access

### Process Security
- Runs as non-root user
- Dropped unnecessary Linux capabilities
- No new privileges allowed
- Proper signal handling with dumb-init

### Resource Security
- Memory and CPU limits prevent resource exhaustion
- Log rotation prevents disk space issues
- Health checks ensure application availability

## Monitoring and Logging

### Logs
- JSON format logging
- Log rotation (10MB max size, 3 files)
- Access logs via `docker-compose logs -f`

### Health Monitoring
- Health check runs every 30 seconds
- 10-second timeout
- 3 retries before marking unhealthy
- 40-second start period

### Resource Monitoring
- **Production**: Memory limit: 1GB, CPU limit: 1 core
- **Development**: Memory limit: 2GB, CPU limit: 2 cores

## Troubleshooting

### Common Issues

1. **Build failures due to missing dependencies**
   - ✅ Fixed: All build dependencies now in `dependencies`
   - ✅ Fixed: Dockerfile installs all dependencies during build

2. **TypeScript path resolution errors**
   - ✅ Fixed: `tsconfig.json` has proper path mapping
   - ✅ Fixed: `@/components/...` imports work correctly

3. **Tailwind CSS not compiling**
   - ✅ Fixed: `autoprefixer` and `postcss` in dependencies
   - ✅ Fixed: All dependencies installed during build

4. **Node.js version compatibility**
   - ✅ Fixed: Updated to Node.js 20 for Solana packages
   - ✅ Fixed: Supports all modern dependencies

5. **Package-lock.json sync issues**
   - ✅ Fixed: Uses `npm install` instead of `npm ci`
   - ✅ Fixed: `--legacy-peer-deps` handles conflicts

6. **Permission denied errors**
   - Ensure the application files have correct ownership
   - Check that the non-root user has necessary permissions

7. **Health check failures**
   - Ensure the `/api/health` endpoint is accessible
   - Check application logs for errors

### Debug Commands

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs hoodie-academy

# Execute commands in container
docker-compose exec hoodie-academy sh

# Check resource usage
docker stats hoodie-academy-app

# Inspect container configuration
docker inspect hoodie-academy-app
```

## Production Deployment

For production deployment, consider:

1. **Environment Variables**: Use Docker secrets or external configuration management
2. **SSL/TLS**: Use a reverse proxy (nginx, traefik) for HTTPS
3. **Load Balancing**: Use multiple container instances behind a load balancer
4. **Monitoring**: Integrate with monitoring solutions (Prometheus, Grafana)
5. **Backup**: Implement regular backups of persistent data
6. **Updates**: Set up automated security updates and image rebuilding

## Security Best Practices

1. **Regular Updates**: Keep base images and dependencies updated
2. **Vulnerability Scanning**: Scan images for known vulnerabilities
3. **Secrets Management**: Use Docker secrets or external secret management
4. **Network Security**: Implement proper network segmentation
5. **Access Control**: Limit access to Docker daemon and containers
6. **Audit Logging**: Enable Docker audit logging
7. **Resource Limits**: Always set resource limits to prevent DoS attacks 