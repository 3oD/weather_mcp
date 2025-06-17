FROM node:20
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production && npm cache clean --force
COPY . .
RUN npm run build
CMD ["node", "dist/server.js"]
