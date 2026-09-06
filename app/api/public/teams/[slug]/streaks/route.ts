import { NextRequest, NextResponse } from "next/server";

import { hashPracticeTeamApiKey, practiceTeamApiKeyPrefix } from "@/lib/practice-teams/api-keys";
import { calculateTeamStreaks } from "@/lib/practice-teams/streaks";
import { checkNamedRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }): Promise<Response> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  const rawKey = authorization.slice("Bearer ".length).trim();
  if (!rawKey) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  const keyPrefix = practiceTeamApiKeyPrefix(rawKey);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const limited = checkNamedRateLimit("practice-team-streak-api", `${keyPrefix}:${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 60,
  });
  if (!limited.allowed) {
    return rateLimitResponse(limited.retryAfter ?? 60);
  }

  const { slug } = await params;
  const service = getServiceClient() as any;
  const { data: team } = await service
    .from("practice_teams")
    .select("id, name, slug, description, avatar_url")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const candidateHash = hashPracticeTeamApiKey(rawKey);
  const { data: apiKey } = await service
    .from("practice_team_api_keys")
    .select("id, team_id, key_prefix, revoked_at")
    .eq("team_id", team.id)
    .eq("key_hash", candidateHash)
    .maybeSingle();

  if (!apiKey) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (apiKey.revoked_at) {
    return NextResponse.json({ error: "API key revoked" }, { status: 403 });
  }

  await service.from("practice_team_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKey.id);

  const { data: activity } = await service
    .from("practice_team_activity")
    .select("activity_date, count")
    .eq("team_id", team.id)
    .order("activity_date", { ascending: true });

  const streaks = calculateTeamStreaks(
    (activity ?? []).map((row: any) => ({
      date: row.activity_date,
      count: row.count,
    })),
  );

  return NextResponse.json({
    team: {
      id: team.id,
      name: team.name,
      slug: team.slug,
      description: team.description,
      avatar_url: team.avatar_url,
    },
    streaks: {
      current: streaks.current,
      longest: streaks.longest,
    },
    calendar: streaks.calendar,
  });
}
