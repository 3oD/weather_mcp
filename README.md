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

Run the proxy and server together:
```bash
docker compose up -d
```
Then in Open WebUI go to **Settings ▸ Tools ▸ Add OpenAPI Server** and enter:
```
http://localhost:8080
```

