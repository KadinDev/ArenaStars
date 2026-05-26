import { requireSupabase, supabase } from "@/services/supabase";
import type { Match, MatchWithStatsInput, NewMatchInput, NewPlayerInput, Player, PlayerStats, RankingPlayer, TrainingDay } from "@/types/database";

const PAGE_SIZE = 20;

export const queryKeys = {
  players: ["players"] as const,
  matches: (page = 0, day?: TrainingDay) => ["matches", page, day ?? "all"] as const,
  ranking: (day: TrainingDay | "geral") => ["ranking", day] as const,
  player: (id: string) => ["player", id] as const,
  highlights: ["highlights"] as const
};

export type PlayerEventType = "participation" | "goal" | "assist";

export async function fetchPlayers(): Promise<Player[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("players")
    .select("id,name,nickname,photo_url,position,active,created_at")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchMatches(page = 0, day?: TrainingDay): Promise<Match[]> {
  if (!supabase) return [];
  let query = supabase
    .from("matches")
    .select("id,training_day,played_at,team_a_name,team_b_name,team_a_score,team_b_score")
    .order("played_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  if (day) query = query.eq("training_day", day);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchMatchPlayerStats(matchId: string): Promise<Record<string, { goals: number; assists: number }>> {
  if (!supabase) return {};
  const [participationsResponse, goalsResponse, assistsResponse] = await Promise.all([
    supabase.from("participations").select("player_id").eq("match_id", matchId),
    supabase.from("goals").select("player_id,quantity").eq("match_id", matchId),
    supabase.from("assists").select("player_id,quantity").eq("match_id", matchId)
  ]);

  if (participationsResponse.error) throw participationsResponse.error;
  if (goalsResponse.error) throw goalsResponse.error;
  if (assistsResponse.error) throw assistsResponse.error;

  const stats: Record<string, { goals: number; assists: number }> = {};
  for (const participation of participationsResponse.data ?? []) {
    stats[participation.player_id] = { goals: 0, assists: 0 };
  }
  for (const goal of goalsResponse.data ?? []) {
    stats[goal.player_id] = stats[goal.player_id] ?? { goals: 0, assists: 0 };
    stats[goal.player_id].goals += goal.quantity;
  }
  for (const assist of assistsResponse.data ?? []) {
    stats[assist.player_id] = stats[assist.player_id] ?? { goals: 0, assists: 0 };
    stats[assist.player_id].assists += assist.quantity;
  }

  return stats;
}

export async function fetchRanking(day: TrainingDay | "geral"): Promise<RankingPlayer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ranking_cache")
    .select("player_id,name,nickname,photo_url,training_day,matches,goals,assists,score")
    .eq("training_day", day)
    .order("score", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function fetchPlayerStats(playerId: string): Promise<PlayerStats | null> {
  if (!supabase) return null;
  const [playerResponse, goalsResponse, assistsResponse, participationsResponse] = await Promise.all([
    supabase
      .from("players")
      .select("id,name,nickname,photo_url,position,active,created_at")
      .eq("id", playerId)
      .maybeSingle(),
    supabase.from("goals").select("quantity").eq("player_id", playerId),
    supabase.from("assists").select("quantity").eq("player_id", playerId),
    supabase
      .from("participations")
      .select("match_id")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  if (playerResponse.error) throw playerResponse.error;
  if (goalsResponse.error) throw goalsResponse.error;
  if (assistsResponse.error) throw assistsResponse.error;
  if (participationsResponse.error) throw participationsResponse.error;
  if (!playerResponse.data) return null;

  const matchIds = (participationsResponse.data ?? []).map((item) => item.match_id);
  const historyResponse = matchIds.length
    ? await supabase
        .from("matches")
        .select("id,training_day,played_at,team_a_name,team_b_name,team_a_score,team_b_score")
        .in("id", matchIds)
    : { data: [], error: null };

  if (historyResponse.error) throw historyResponse.error;
  const order = new Map(matchIds.map((matchId, index) => [matchId, index]));
  const history = ((historyResponse.data ?? []) as Match[]).sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  );

  return {
    player: playerResponse.data,
    goals: (goalsResponse.data ?? []).reduce((sum, item) => sum + item.quantity, 0),
    assists: (assistsResponse.data ?? []).reduce((sum, item) => sum + item.quantity, 0),
    matches: history.length,
    history
  };
}

export async function createPlayer(input: NewPlayerInput & { photo_url?: string }) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("players")
    .insert({
      name: input.name,
      nickname: input.nickname ?? null,
      position: input.position ?? null,
      photo_url: input.photo_url ?? null
    })
    .select("id,name,nickname,photo_url,position,active,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function updatePlayer(playerId: string, input: NewPlayerInput & { photo_url?: string | null }) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("players")
    .update({
      name: input.name,
      nickname: input.nickname?.trim() || null,
      position: input.position?.trim() || null,
      ...(input.photo_url !== undefined ? { photo_url: input.photo_url } : {})
    })
    .eq("id", playerId)
    .select("id,name,nickname,photo_url,position,active,created_at")
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
    .select("id,name,nickname,photo_url,position,active,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function recordPlayerEvent(input: {
  playerId: string;
  matchId: string;
  type: PlayerEventType;
  quantity?: number;
}) {
  const client = requireSupabase();
  const { data: match, error: matchError } = await client
    .from("matches")
    .select("training_day")
    .eq("id", input.matchId)
    .single();

  if (matchError) throw matchError;

  const { error: participationError } = await client
    .from("participations")
    .upsert(
      {
        match_id: input.matchId,
        player_id: input.playerId,
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
    .insert(input)
    .select("id,training_day,played_at,team_a_name,team_b_name,team_a_score,team_b_score")
    .single();

  if (error) throw error;
  return data;
}

export async function saveMatchWithStats(input: MatchWithStatsInput) {
  const client = requireSupabase();
  const payload = {
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
