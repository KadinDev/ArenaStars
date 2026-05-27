export type TrainingDay = "domingo" | "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado";

export type DominantFoot = "direito" | "esquerdo" | "ambos";

export type Organization = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  created_at: string;
};

export type Team = {
  id: string;
  organization_id: string;
  name: string;
  logo_url: string | null;
  color: string | null;
  is_champion: boolean;
  champion_title: string | null;
  champion_count: number | null;
  created_at: string;
};

export type TeamPlayer = {
  id: string;
  organization_id: string;
  team_id: string;
  player_id: string;
  created_at: string;
};

export type CompetitionPlayer = {
  id: string;
  organization_id: string;
  player_id: string;
  position: string | null;
  jersey_number: number | null;
  dominant_foot: DominantFoot | null;
  created_at: string;
};

export type Player = {
  id: string;
  organization_id: string;
  name: string;
  nickname: string | null;
  photo_url: string | null;
  position: string | null;
  jersey_number: number | null;
  dominant_foot: DominantFoot | null;
  active: boolean;
  created_at: string;
};

export type Match = {
  id: string;
  organization_id: string;
  team_a_id: string | null;
  team_b_id: string | null;
  training_day: TrainingDay;
  played_at: string;
  team_a_name: string;
  team_b_name: string;
  team_a_score: number;
  team_b_score: number;
};

export type RankingPlayer = {
  organization_id: string;
  player_id: string;
  name: string;
  nickname: string | null;
  photo_url: string | null;
  jersey_number: number | null;
  dominant_foot: DominantFoot | null;
  training_day: TrainingDay | "geral";
  matches: number;
  goals: number;
  assists: number;
  score: number;
};

export type PlayerStats = {
  player: Player;
  team: Team | null;
  matches: number;
  goals: number;
  assists: number;
  history: Match[];
};

export type Highlight = {
  label: string;
  value: string;
  player_name?: string;
};

export type AdminSession = {
  userId: string;
  email: string | null;
  isAdmin: boolean;
};

export type NewPlayerInput = {
  name: string;
  nickname?: string;
  position?: string;
  jersey_number?: number | null;
  dominant_foot?: DominantFoot | null;
  photoUri?: string;
};

export type CompetitionPlayerProfileInput = {
  position?: string | null;
  jersey_number?: number | null;
  dominant_foot?: DominantFoot | null;
};

export type NewMatchInput = {
  organization_id: string;
  team_a_id?: string | null;
  team_b_id?: string | null;
  training_day: TrainingDay;
  played_at: string;
  team_a_name: string;
  team_b_name: string;
  team_a_score: number;
  team_b_score: number;
};

export type PlayerMatchStatInput = {
  player_id: string;
  team_id?: string | null;
  goals: number;
  assists: number;
};

export type MatchWithStatsInput = NewMatchInput & {
  id?: string;
  players: PlayerMatchStatInput[];
};
