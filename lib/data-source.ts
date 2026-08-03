export type DataSourceMode = "demo" | "supabase" | "auto";
export type DataSourceUsed = DataSourceMode | "demo-fallback";

export function getDataSourceMode(): DataSourceMode {
  const value = process.env.NEXT_PUBLIC_DATA_SOURCE;
  if (value === "supabase" || value === "auto" || value === "demo") return value;
  return "demo";
}

export function shouldUseDemoOnly() {
  return getDataSourceMode() === "demo";
}
