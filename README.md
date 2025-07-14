# weather-mcp

Weather MCP server using OpenWeatherMap One Call API 3.0 with OpenStreetMap geocoding.

## Features

- **Comprehensive Weather Data**: Uses OpenWeatherMap One Call API 3.0 for complete weather information
- **Automatic Geocoding**: Converts city names to coordinates using OpenStreetMap's Nominatim API
- **Multiple Endpoints**:
  - Current weather with hourly and daily forecasts
  - 48-hour hourly forecasts
  - 8-day daily forecasts  
  - Weather alerts (when available)

## Quick Start

1. Copy `.env.example` to `.env` and set your `OPENWEATHERMAP_API_KEY`.
   - **Note**: One Call API 3.0 requires a paid OpenWeatherMap subscription
   - Get your API key from: https://openweathermap.org/api
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

## API Usage

The server provides city name support through automatic geocoding:

```typescript
// Using city name (automatically geocoded)
await getCurrentWeather({ city: "London" });

// Using coordinates directly  
await getCurrentWeather({ lat: 51.5074, lon: -0.1278 });
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

