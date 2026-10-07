import "server-only";
import { cache } from "react";
import { db, schema } from "./db";
import { DEFAULT_SETTINGS, SECRET_KEYS, type Settings } from "./defaults";

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.select().from(schema.settings);
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out as Settings;
});

export type PublicSettings = Omit<Settings, (typeof SECRET_KEYS)[number]>;
export async function getPublicSettings(): Promise<PublicSettings> {
  const s = { ...(await getSettings()) } as Record<string, unknown>;
  for (const k of SECRET_KEYS) delete s[k];
  return s as PublicSettings;
}

export async function saveSettings(patch: Partial<Settings>) {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    await db
      .insert(schema.settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value } });
  }
}
