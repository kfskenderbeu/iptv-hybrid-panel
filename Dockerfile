# Dockerfile për IPTV Hybrid Panel

FROM node:18-alpine

# Metadata
LABEL maintainer="IPTV Hybrid Panel"
LABEL description="P2P/CDN IPTV Panel me Hidden Layer"

# Vendos working directory
WORKDIR /app

# Kopjo package files
COPY package*.json ./

# Instalo dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Kopjo kodin e aplikacionit
COPY . .

# Krijo user jo-root për siguri
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Ndryshoje ownership
RUN chown -R nodejs:nodejs /app

# Switch në non-root user
USER nodejs

# Expose porti
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/stats', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start aplikacionin
CMD ["node", "server.js"]
