FROM node:20 AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
# Install all dependencies including dev packages for building
RUN npm ci
COPY . .
RUN npm run build

FROM node:20 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force \
    && apt-get update && apt-get install -y --no-install-recommends python3 python3-pip \
    && pip3 install --no-cache-dir --break-system-packages mcpo \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/dist ./dist
ENTRYPOINT ["mcpo"]
CMD ["--port", "8080", "--", "node", "dist/server.js"]
