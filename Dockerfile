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
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]
