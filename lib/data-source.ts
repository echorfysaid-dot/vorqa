export type DataSourceMode = "demo" | "supabase" | "auto";
export type DataSourceUsed = DataSourceMode | "demo-fallback";

export function resolveDataSourceMode(value: string | undefined, supabaseConfigured: boolean): DataSourceMode {
  if (value === "supabase" || value === "auto" || value === "demo") return value;
  return supabaseConfigured ? "auto" : "demo";
}

export function getDataSourceMode(): DataSourceMode {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return resolveDataSourceMode(process.env.NEXT_PUBLIC_DATA_SOURCE, supabaseConfigured);
}

export function shouldUseDemoOnly() {
  return getDataSourceMode() === "demo";
}
