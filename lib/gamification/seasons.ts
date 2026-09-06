import { getSafeErrorMessage } from "@/lib/errorHandler";
import { getServiceClient } from "@/lib/supabase/service";

type SupabaseLike = {
  from: (table: string) => any;
};

export type Season = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
};

export async function getActiveSeason(supabase: SupabaseLike): Promise<Season | null> {
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

export async function createSeason(
  name: string,
  starts_at: string,
  ends_at: string,
): Promise<{ season: Season } | { error: string }> {
  const service = getServiceClient() as any;

  const { data: activeSeason } = await service
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();

  if (activeSeason) {
    return { error: "A season is already active. End it first." };
  }

  const { data, error } = await service
    .from("seasons")
    .insert({ name, starts_at, ends_at, is_active: true })
    .select("*")
    .single();

  if (error) return { error: getSafeErrorMessage(error, "Could not create season") };
  return { season: data };
}

export async function endSeason(): Promise<{ success: true } | { error: string }> {
  const service = getServiceClient() as any;

  const { error } = await service
    .from("seasons")
    .update({ is_active: false })
    .eq("is_active", true);

  if (error) return { error: getSafeErrorMessage(error, "Could not end season") };
  return { success: true };
}
