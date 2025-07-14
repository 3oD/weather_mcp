import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { request } from "undici";
import "dotenv/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const API_KEY = process.env.OPENWEATHERMAP_API_KEY;

const server = new McpServer({ name: "openweather-ts", version: "0.1.0" });

const commonFields = {
  city: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  units: z.enum(["standard", "metric", "imperial"]).optional().default("metric"),
};
const commonSchema = z
  .object(commonFields)
  .refine((d) => d.city || (d.lat !== undefined && d.lon !== undefined), {
    message: "Provide city or both lat and lon",
  });

/**
 * Geocodes a city name using OpenStreetMap's Nominatim API to get coordinates.
 * 
 * @param city - The city name to geocode
 * @returns Promise resolving to an object with lat and lon coordinates
 * @throws Will throw an error if the city is not found or the API request fails
 */
async function geocodeCity(city: string): Promise<{ lat: number; lon: number }> {
  const encodedCity = encodeURIComponent(city);
  const url = `https://nominatim.openstreetmap.org/search?q=${encodedCity}&format=json&limit=1`;
  
  try {
    const { body } = await request(url, {
      headers: {
        'User-Agent': 'weather-mcp-server/0.1.0'
      }
    });
    const data = await body.json() as any[];
    
    if (!data || data.length === 0) {
      throw new Error(`City "${city}" not found`);
    }
    
    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon)
    };
  } catch (error) {
    throw new Error(`Failed to geocode city "${city}": ${error}`);
  }
}

export type CommonArgs = z.infer<typeof commonSchema>;

/**
 * Builds query parameters for OpenWeatherMap One Call API 3.0 requests.
 * 
 * @param args - Common arguments containing location and units information
 * @param exclude - Optional parameter to exclude specific data from the API response
 * @returns A record of string key-value pairs representing the API query parameters
 * 
 * @remarks
 * The function validates the input arguments against a common schema and constructs
 * parameters including units (defaulting to "metric"), API key, and coordinates.
 * If a city is provided, it will be geocoded to get coordinates.
 */
export async function buildParams(args: CommonArgs, exclude?: string) {
  commonSchema.parse(args);
  
  let lat: number;
  let lon: number;
  
  if (args.city) {
    const coords = await geocodeCity(args.city);
    lat = coords.lat;
    lon = coords.lon;
  } else {
    lat = args.lat!;
    lon = args.lon!;
  }
  
  const params: Record<string, string> = {
    lat: String(lat),
    lon: String(lon),
    units: args.units ?? "metric",
    appid: API_KEY!,
  };
  
  if (exclude) params.exclude = exclude;
  
  return params;
}

/**
 * Makes an HTTP request to a specified API endpoint with provided parameters.
 * 
 * @param endpoint - The API endpoint URL to call
 * @param params - An object containing query parameters as key-value pairs
 * @returns A Promise that resolves to the parsed JSON response body
 * @throws Will throw an error if the request fails or if the response cannot be parsed as JSON
 */
async function callApi(endpoint: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const { body } = await request(`${endpoint}?${qs}`);
  return body.json();
}

/**
 * Retrieves comprehensive weather data using OpenWeatherMap One Call API 3.0.
 * 
 * @async
 * @param args - Common arguments used to build API request parameters
 * @returns A response object containing current weather, hourly forecast, and daily forecast
 */
async function getCurrentWeather(args: CommonArgs) {
  const params = await buildParams(args);
  const data = await callApi("https://api.openweathermap.org/data/3.0/onecall", params);
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}

/**
 * Retrieves hourly weather forecast using OpenWeatherMap One Call API 3.0.
 * 
 * @async
 * @param args - Common arguments used to build the API request parameters
 * @returns An object containing 48-hour hourly forecast data
 */
async function getForecast(args: CommonArgs) {
  const params = await buildParams(args, "minutely,daily,alerts");
  const data = await callApi("https://api.openweathermap.org/data/3.0/onecall", params);
  
  return {
    content: [
      {
        type: "text", 
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}

/**
 * Retrieves weather alerts using OpenWeatherMap One Call API 3.0.
 * 
 * @param args - Common arguments containing location parameters for the weather API request
 * @returns Promise resolving to an object containing weather alert information
 * 
 * @example
 * ```typescript
 * const alerts = await getAlerts({ city: "London" });
 * console.log(alerts.content[0].text);
 * ```
 */
async function getAlerts(args: CommonArgs) {
  const params = await buildParams(args, "minutely,hourly,daily");
  const data = await callApi("https://api.openweathermap.org/data/3.0/onecall", params) as any;
  
  if (data.alerts && data.alerts.length > 0) {
    return {
      content: [
        {
          type: "text",
          text: `Weather Alerts:\n\n${JSON.stringify(data.alerts, null, 2)}`
        }
      ]
    };
  } else {
    return {
      content: [
        {
          type: "text",
          text: `No active weather alerts for the specified location.\n\nCurrent conditions:\n${JSON.stringify({
            location: `${data.lat}, ${data.lon}`,
            current: data.current
          }, null, 2)}`
        }
      ]
    };
  }
}

/**
 * Retrieves 8-day daily weather forecast using OpenWeatherMap One Call API 3.0.
 * 
 * @async
 * @param args - Common arguments used to build the API request parameters
 * @returns An object containing 8-day daily forecast data
 */
async function getDailyForecast(args: CommonArgs) {
  const params = await buildParams(args, "minutely,hourly,alerts");
  const data = await callApi("https://api.openweathermap.org/data/3.0/onecall", params);
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}

server.registerTool(
  "get-current-weather",
  { description: "Get comprehensive current weather data including hourly and daily forecasts for a city or lat/lon using One Call API 3.0", inputSchema: commonFields },
  getCurrentWeather as any
);

server.registerTool(
  "get-hourly-forecast",
  { description: "Get 48-hour hourly weather forecast for a city or lat/lon", inputSchema: commonFields },
  getForecast as any
);

server.registerTool(
  "get-daily-forecast",
  { description: "Get 8-day daily weather forecast for a city or lat/lon", inputSchema: commonFields },
  getDailyForecast as any
);

server.registerTool(
  "get-alerts",
  { description: "Get weather alerts for a city or lat/lon", inputSchema: commonFields },
  getAlerts as any
);

if (!API_KEY) {
  console.error("Missing OPENWEATHERMAP_API_KEY in environment");
  process.exit(1);
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = path.resolve(process.argv[1]);

if (currentFile === invokedFile) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

