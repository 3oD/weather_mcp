# weather-mcp

Simple MCP server wrapping OpenWeatherMap.

## Quick Start

1. Copy `.env.example` to `.env` and set your `OPENWEATHERMAP_API_KEY`.
2. Install dependencies with `npm install`.
3. Run in development mode:
   ```bash
   npm run dev
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Start the MCP server:
   ```bash
   npm start
   ```

## Open WebUI

Run the proxy and server together using Docker Compose
(from the `docker` directory). Compose will build the
container from the included `Dockerfile`:
```bash
cd docker
docker compose up -d
```
Then in Open WebUI go to **Settings ▸ Tools ▸ Add OpenAPI Server** and enter:
```
http://localhost:8080
```

## Docker

Build the container image locally (this image now includes the `mcpo` proxy):
```bash
docker build -t weather-mcp .
```
Run the server via Docker:
```bash
docker run -p 8080:8080 --env-file .env weather-mcp
```
The Dockerfile performs a multi-stage build to install development dependencies
only during the build phase while keeping the final runtime image lightweight.

