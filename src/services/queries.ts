import { requireSupabase, supabase } from "@/services/supabase";
import type { CompetitionPlayerProfileInput, Match, MatchWithStatsInput, NewMatchInput, NewPlayerInput, Organization, Player, PlayerStats, RankingPlayer, Team, TeamPlayer, TrainingDay } from "@/types/database";

const PAGE_SIZE = 20;

export const queryKeys = {
  organizations: ["organizations"] as const,
  teams: (organizationId?: string | null) => ["teams", organizationId ?? "none"] as const,
  teamPlayers: (organizationId?: string | null) => ["team-players", organizationId ?? "none"] as const,
  players: (organizationId?: string | null) => ["players", organizationId ?? "none"] as const,
  matches: (organizationId?: string | null, page = 0, day?: TrainingDay) => ["matches", organizationId ?? "none", page, day ?? "all"] as const,
  ranking: (organizationId?: string | null, day: TrainingDay | "geral" = "geral") => ["ranking", organizationId ?? "none", day] as const,
  player: (organizationId: string | null | undefined, id: string) => ["player", organizationId ?? "none", id] as const,
  highlights: (organizationId?: string | null) => ["highlights", organizationId ?? "none"] as const
};

export type PlayerEventType = "participation" | "goal" | "assist";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function fetchOrganizations(): Promise<Organization[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("organizations")
    .select("id,name,slug,logo_url,created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createOrganization(input: { name: string; logo_url?: string | null }): Promise<Organization> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("organizations")
    .insert({ name: input.name.trim(), slug: slugify(input.name) || null, logo_url: input.logo_url ?? null })
    .select("id,name,slug,logo_url,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function fetchTeams(organizationId: string): Promise<Team[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("teams")
    .select("id,organization_id,name,logo_url,color,created_at")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createTeam(organizationId: string, input: { name: string; color?: string | null; logo_url?: string | null }): Promise<Team> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("teams")
    .insert({
      organization_id: organizationId,
      name: input.name.trim(),
      color: input.color ?? null,
      logo_url: input.logo_url ?? null
    })
    .select("id,organization_id,name,logo_url,color,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function fetchTeamPlayers(organizationId: string): Promise<TeamPlayer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("team_players")
    .select("id,organization_id,team_id,player_id,created_at")
    .eq("organization_id", organizationId);

  if (error) throw error;
  return data ?? [];
}

export async function assignPlayerToTeam(organizationId: string, playerId: string, teamId: string | null) {
  const client = requireSupabase();
  if (!teamId) {
    const { error } = await client
      .from("team_players")
      .delete()
      .eq("organization_id", organizationId)
      .eq("player_id", playerId);
    if (error) throw error;
    return;
  }

  const { error } = await client
    .from("team_players")
    .upsert({ organization_id: organizationId, player_id: playerId, team_id: teamId }, { onConflict: "organization_id,player_id" });

  if (error) throw error;
}

export async function fetchPlayers(organizationId: string): Promise<Player[]> {
  if (!supabase) return [];
  const membershipResponse = await supabase
    .from("competition_players")
    .select("player_id,position,jersey_number,dominant_foot")
    .eq("organization_id", organizationId);

  if (membershipResponse.error) throw membershipResponse.error;
  const competitionProfileByPlayerId = new Map(
    (membershipResponse.data ?? []).map((item) => [item.player_id, item])
  );
  const playerIds = [...competitionProfileByPlayerId.keys()];
  if (!playerIds.length) return [];

  const { data, error } = await supabase
    .from("players")
    .select("id,organization_id,name,nickname,photo_url,position,jersey_number,dominant_foot,active,created_at")
    .in("id", playerIds)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((player) => {
    const profile = competitionProfileByPlayerId.get(player.id);
    return {
      ...player,
      position: profile?.position ?? null,
      jersey_number: profile?.jersey_number ?? null,
      dominant_foot: profile?.dominant_foot ?? null
    };
  });
}

export async function fetchAllPlayers(): Promise<Player[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("players")
    .select("id,organization_id,name,nickname,photo_url,position,jersey_number,dominant_foot,active,created_at")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addPlayerToOrganization(organizationId: string, playerId: string, profile?: CompetitionPlayerProfileInput) {
  const client = requireSupabase();
  const { error } = await client
    .from("competition_players")
    .upsert(
      {
        organization_id: organizationId,
        player_id: playerId,
        position: profile?.position?.trim() || null,
        jersey_number: profile?.jersey_number ?? null,
        dominant_foot: profile?.dominant_foot ?? null
      },
      { onConflict: "organization_id,player_id" }
    );

  if (error) throw error;
}

export async function updateCompetitionPlayerProfile(
  organizationId: string,
  playerId: string,
  profile: CompetitionPlayerProfileInput
) {
  await addPlayerToOrganization(organizationId, playerId, profile);
}

export async function fetchMatches(organizationId: string, page = 0, day?: TrainingDay): Promise<Match[]> {
  if (!supabase) return [];
  let query = supabase
    .from("matches")
    .select("id,organization_id,team_a_id,team_b_id,training_day,played_at,team_a_name,team_b_name,team_a_score,team_b_score")
    .eq("organization_id", organizationId)
    .order("played_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  if (day) query = query.eq("training_day", day);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchMatchPlayerStats(matchId: string): Promise<Record<string, { team_id: string | null; goals: number; assists: number }>> {
  if (!supabase) return {};
  const [participationsResponse, goalsResponse, assistsResponse] = await Promise.all([
    supabase.from("participations").select("player_id,team_id").eq("match_id", matchId),
    supabase.from("goals").select("player_id,quantity").eq("match_id", matchId),
    supabase.from("assists").select("player_id,quantity").eq("match_id", matchId)
  ]);

  if (participationsResponse.error) throw participationsResponse.error;
  if (goalsResponse.error) throw goalsResponse.error;
  if (assistsResponse.error) throw assistsResponse.error;

  const stats: Record<string, { team_id: string | null; goals: number; assists: number }> = {};
  for (const participation of participationsResponse.data ?? []) {
    stats[participation.player_id] = { team_id: participation.team_id, goals: 0, assists: 0 };
  }
  for (const goal of goalsResponse.data ?? []) {
    stats[goal.player_id] = stats[goal.player_id] ?? { team_id: null, goals: 0, assists: 0 };
    stats[goal.player_id].goals += goal.quantity;
  }
  for (const assist of assistsResponse.data ?? []) {
    stats[assist.player_id] = stats[assist.player_id] ?? { team_id: null, goals: 0, assists: 0 };
    stats[assist.player_id].assists += assist.quantity;
  }

  return stats;
}

export async function fetchRanking(organizationId: string, day: TrainingDay | "geral"): Promise<RankingPlayer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ranking_cache")
    .select("organization_id,player_id,name,nickname,photo_url,jersey_number,dominant_foot,training_day,matches,goals,assists,score")
    .eq("organization_id", organizationId)
    .eq("training_day", day)
    .order("score", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function fetchPlayerStats(organizationId: string, playerId: string): Promise<PlayerStats | null> {
  if (!supabase) return null;
  const [playerResponse, competitionProfileResponse, goalsResponse, assistsResponse, participationsResponse] = await Promise.all([
    supabase
      .from("players")
      .select("id,organization_id,name,nickname,photo_url,position,jersey_number,dominant_foot,active,created_at")
      .eq("id", playerId)
      .maybeSingle(),
    supabase
      .from("competition_players")
      .select("position,jersey_number,dominant_foot")
      .eq("organization_id", organizationId)
      .eq("player_id", playerId)
      .maybeSingle(),
    supabase.from("goals").select("match_id,quantity").eq("player_id", playerId),
    supabase.from("assists").select("match_id,quantity").eq("player_id", playerId),
    supabase
      .from("participations")
      .select("match_id,matches!inner(id,organization_id,team_a_id,team_b_id,training_day,played_at,team_a_name,team_b_name,team_a_score,team_b_score)")
      .eq("player_id", playerId)
      .eq("matches.organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  if (playerResponse.error) throw playerResponse.error;
  if (competitionProfileResponse.error) throw competitionProfileResponse.error;
  if (goalsResponse.error) throw goalsResponse.error;
  if (assistsResponse.error) throw assistsResponse.error;
  if (participationsResponse.error) throw participationsResponse.error;
  if (!playerResponse.data) return null;

  const participationRows = (participationsResponse.data ?? []) as unknown as Array<{ match_id: string; matches: Match | Match[] | null }>;
  const matchIds = participationRows.map((item) => item.match_id);
  const history = participationRows
    .map((item) => Array.isArray(item.matches) ? item.matches[0] : item.matches)
    .filter((match): match is Match => Boolean(match));
  const order = new Map(matchIds.map((matchId, index) => [matchId, index]));
  const organizationMatchIds = new Set(history.map((match) => match.id));
  history.sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  );

  const { data: teamAssignment, error: teamError } = await supabase
    .from("team_players")
    .select("teams(id,organization_id,name,logo_url,color,created_at)")
    .eq("organization_id", organizationId)
    .eq("player_id", playerId)
    .maybeSingle();

  if (teamError) throw teamError;
  const team = Array.isArray(teamAssignment?.teams)
    ? teamAssignment?.teams[0] ?? null
    : (teamAssignment?.teams as Team | null | undefined) ?? null;
  const competitionProfile = competitionProfileResponse.data;
  const player = {
    ...playerResponse.data,
    position: competitionProfile?.position ?? null,
    jersey_number: competitionProfile?.jersey_number ?? null,
    dominant_foot: competitionProfile?.dominant_foot ?? null
  };

  return {
    player,
    team,
    goals: (goalsResponse.data ?? []).reduce((sum, item) => organizationMatchIds.has(item.match_id) ? sum + item.quantity : sum, 0),
    assists: (assistsResponse.data ?? []).reduce((sum, item) => organizationMatchIds.has(item.match_id) ? sum + item.quantity : sum, 0),
    matches: history.length,
    history
  };
}

export async function createPlayer(organizationId: string, input: NewPlayerInput & { photo_url?: string }) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("players")
    .insert({
      organization_id: organizationId,
      name: input.name,
      nickname: input.nickname ?? null,
      position: null,
      jersey_number: null,
      dominant_foot: null,
      photo_url: input.photo_url ?? null
    })
    .select("id,organization_id,name,nickname,photo_url,position,jersey_number,dominant_foot,active,created_at")
    .single();

  if (error) throw error;
  await addPlayerToOrganization(organizationId, data.id, {
    position: input.position ?? null,
    jersey_number: input.jersey_number ?? null,
    dominant_foot: input.dominant_foot ?? null
  });
  return {
    ...data,
    position: input.position ?? null,
    jersey_number: input.jersey_number ?? null,
    dominant_foot: input.dominant_foot ?? null
  };
}

export async function updatePlayer(playerId: string, input: NewPlayerInput & { photo_url?: string | null }) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("players")
    .update({
      name: input.name,
      nickname: input.nickname?.trim() || null,
      ...(input.photo_url !== undefined ? { photo_url: input.photo_url } : {})
    })
    .eq("id", playerId)
    .select("id,organization_id,name,nickname,photo_url,position,jersey_number,dominant_foot,active,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function updatePlayerPhoto(playerId: string, photoUrl: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("players")
    .update({ photo_url: photoUrl })
    .eq("id", playerId)
    .select("id,organization_id,name,nickname,photo_url,position,jersey_number,dominant_foot,active,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function recordPlayerEvent(input: {
  organizationId: string;
  playerId: string;
  matchId: string;
  type: PlayerEventType;
  quantity?: number;
}) {
  const client = requireSupabase();
  const { data: match, error: matchError } = await client
    .from("matches")
    .select("training_day")
    .eq("organization_id", input.organizationId)
    .eq("id", input.matchId)
    .single();

  if (matchError) throw matchError;

  const { data: teamAssignment } = await client
    .from("team_players")
    .select("team_id")
    .eq("organization_id", input.organizationId)
    .eq("player_id", input.playerId)
    .maybeSingle();

  const { error: participationError } = await client
    .from("participations")
    .upsert(
      {
        match_id: input.matchId,
        player_id: input.playerId,
        team_id: teamAssignment?.team_id ?? null,
        training_day: match.training_day
      },
      { onConflict: "match_id,player_id" }
    );

  if (participationError) throw participationError;
  if (input.type === "participation") return;

  const table = input.type === "goal" ? "goals" : "assists";
  const quantity = Math.max(input.quantity ?? 1, 1);
  const { data: current, error: currentError } = await client
    .from(table)
    .select("id,quantity")
    .eq("match_id", input.matchId)
    .eq("player_id", input.playerId)
    .maybeSingle();

  if (currentError) throw currentError;

  if (current) {
    const { error } = await client
      .from(table)
      .update({ quantity: current.quantity + quantity })
      .eq("id", current.id);
    if (error) throw error;
    return;
  }

  const { error } = await client.from(table).insert({
    match_id: input.matchId,
    player_id: input.playerId,
    quantity
  });

  if (error) throw error;
}

export async function createMatch(input: NewMatchInput) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("matches")
    .insert({
      ...input,
      team_a_id: input.team_a_id ?? null,
      team_b_id: input.team_b_id ?? null
    })
    .select("id,organization_id,team_a_id,team_b_id,training_day,played_at,team_a_name,team_b_name,team_a_score,team_b_score")
    .single();

  if (error) throw error;
  return data;
}

export async function saveMatchWithStats(input: MatchWithStatsInput) {
  const client = requireSupabase();
  const payload = {
    organization_id: input.organization_id,
    team_a_id: input.team_a_id ?? null,
    team_b_id: input.team_b_id ?? null,
    training_day: input.training_day,
    played_at: input.played_at,
    team_a_name: input.team_a_name,
    team_b_name: input.team_b_name,
    team_a_score: input.team_a_score,
    team_b_score: input.team_b_score
  };

  const matchResponse = input.id
    ? await client
        .from("matches")
        .update(payload)
        .eq("id", input.id)
        .eq("organization_id", input.organization_id)
        .select("id")
        .single()
    : await client
        .from("matches")
        .insert(payload)
        .select("id")
        .single();

  if (matchResponse.error) throw matchResponse.error;
  const matchId = matchResponse.data.id;

  const [goalsDelete, assistsDelete, participationsDelete] = await Promise.all([
    client.from("goals").delete().eq("match_id", matchId),
    client.from("assists").delete().eq("match_id", matchId),
    client.from("participations").delete().eq("match_id", matchId)
  ]);

  if (goalsDelete.error) throw goalsDelete.error;
  if (assistsDelete.error) throw assistsDelete.error;
  if (participationsDelete.error) throw participationsDelete.error;

  const participations = input.players.map((player) => ({
    match_id: matchId,
    player_id: player.player_id,
    team_id: player.team_id ?? null,
    training_day: input.training_day
  }));

  if (participations.length) {
    const { error } = await client.from("participations").insert(participations);
    if (error) throw error;
  }

  return matchId;
}

export async function deleteMatch(matchId: string) {
  const client = requireSupabase();
  const { error } = await client.from("matches").delete().eq("id", matchId);
  if (error) throw error;
}
