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

export type CommonArgs = z.infer<typeof commonSchema>;

export async function buildParams(args: CommonArgs, exclude?: string) {
  commonSchema.parse(args);
  const params: Record<string, string> = {
    units: args.units ?? "metric",
    appid: API_KEY!,
  };
  if (exclude) params.exclude = exclude;
  if (args.city) {
    params.q = args.city;
  } else {
    params.lat = String(args.lat);
    params.lon = String(args.lon);
  }
  return params;
}

async function callApi(endpoint: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const { body } = await request(`${endpoint}?${qs}`);
  return body.json();
}

async function getCurrentWeather(args: CommonArgs) {
  const params = await buildParams(args);
  const data = await callApi("https://api.openweathermap.org/data/2.5/weather", params);
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}

async function getForecast(args: CommonArgs) {
  const params = await buildParams(args);
  const data = await callApi("https://api.openweathermap.org/data/2.5/forecast", params);
  
  return {
    content: [
      {
        type: "text", 
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}

async function getAlerts(args: CommonArgs) {
  // For free accounts, we'll use the current weather endpoint and check for alerts in the response
  const params = await buildParams(args);
  const data = await callApi("https://api.openweathermap.org/data/2.5/weather", params) as any;
  
  // Extract relevant alert-like information from current weather
  const alertInfo = {
    location: data.name,
    country: data.sys?.country,
    conditions: data.weather?.[0]?.description,
    temperature: data.main?.temp,
    humidity: data.main?.humidity,
    pressure: data.main?.pressure,
    windSpeed: data.wind?.speed,
    visibility: data.visibility,
    timestamp: new Date(data.dt * 1000).toISOString()
  };
  
  return {
    content: [
      {
        type: "text",
        text: `Weather Alert Information for ${alertInfo.location}:\n\n${JSON.stringify(alertInfo, null, 2)}\n\nNote: This is current weather data. For actual weather alerts, a paid API subscription is required.`
      }
    ]
  };
}

server.registerTool(
  "get-current-weather",
  { description: "Current conditions for a city or lat/lon", inputSchema: commonFields },
  getCurrentWeather as any
);

server.registerTool(
  "get-forecast",
  { description: "Weather forecast for a city or lat/lon", inputSchema: commonFields },
  getForecast as any
);

server.registerTool(
  "get-alerts",
  { description: "Weather alerts for a city or lat/lon", inputSchema: commonFields },
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

