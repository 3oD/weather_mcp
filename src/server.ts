import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { request } from "undici";
import "dotenv/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
if (!API_KEY) {
  console.error("Missing OPENWEATHERMAP_API_KEY in environment");
  process.exit(1);
}

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

type CommonArgs = z.infer<typeof commonSchema>;

async function buildParams(args: CommonArgs, exclude?: string) {
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
  return callApi("https://api.openweathermap.org/data/3.0/weather", params);
}

async function getForecast(args: CommonArgs) {
  const params = await buildParams(args, "current,minutely,alerts");
  return callApi("https://api.openweathermap.org/data/3.0/onecall", params);
}

async function getAlerts(args: CommonArgs) {
  const params = await buildParams(args, "current,minutely,hourly,daily");
  return callApi("https://api.openweathermap.org/data/3.0/onecall", params);
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

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = path.resolve(process.argv[1]);
if (currentFile === invokedFile) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

