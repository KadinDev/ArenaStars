export type TrainingDay = "domingo" | "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado";

export type Player = {
  id: string;
  name: string;
  nickname: string | null;
  photo_url: string | null;
  position: string | null;
  active: boolean;
  created_at: string;
};

export type Match = {
  id: string;
  training_day: TrainingDay;
  played_at: string;
  team_a_name: string;
  team_b_name: string;
  team_a_score: number;
  team_b_score: number;
};

export type RankingPlayer = {
  player_id: string;
  name: string;
  nickname: string | null;
  photo_url: string | null;
  training_day: TrainingDay | "geral";
  matches: number;
  goals: number;
  assists: number;
  score: number;
};

export type PlayerStats = {
  player: Player;
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
  photoUri?: string;
};

export type NewMatchInput = {
  training_day: TrainingDay;
  played_at: string;
  team_a_name: string;
  team_b_name: string;
  team_a_score: number;
  team_b_score: number;
};

export type PlayerMatchStatInput = {
  player_id: string;
  goals: number;
  assists: number;
};

export type MatchWithStatsInput = NewMatchInput & {
  id?: string;
  players: PlayerMatchStatInput[];
};
