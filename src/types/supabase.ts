import type { Player, Match, RankingPlayer, TrainingDay } from "./database";

export type Database = {
  public: {
    Tables: {
      players: {
        Row: Player;
        Insert: Omit<Player, "id" | "created_at" | "active"> & { active?: boolean };
        Update: Partial<Omit<Player, "id" | "created_at">>;
        Relationships: [];
      };
      matches: {
        Row: Match;
        Insert: Omit<Match, "id">;
        Update: Partial<Omit<Match, "id">>;
        Relationships: [];
      };
      goals: {
        Row: { id: string; match_id: string; player_id: string; quantity: number; created_at: string };
        Insert: { match_id: string; player_id: string; quantity?: number };
        Update: { quantity?: number };
        Relationships: [];
      };
      assists: {
        Row: { id: string; match_id: string; player_id: string; quantity: number; created_at: string };
        Insert: { match_id: string; player_id: string; quantity?: number };
        Update: { quantity?: number };
        Relationships: [];
      };
      participations: {
        Row: { id: string; match_id: string; player_id: string; training_day: TrainingDay; created_at: string };
        Insert: { match_id: string; player_id: string; training_day: TrainingDay };
        Update: { training_day?: TrainingDay };
        Relationships: [];
      };
    };
    Views: {
      ranking_cache: {
        Row: RankingPlayer;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      register_participation: {
        Args: { p_match_id: string; p_player_id: string };
        Returns: void;
      };
      add_player_goal: {
        Args: { p_match_id: string; p_player_id: string; p_quantity?: number };
        Returns: void;
      };
      add_player_assist: {
        Args: { p_match_id: string; p_player_id: string; p_quantity?: number };
        Returns: void;
      };
      save_match_with_stats: {
        Args: {
          p_match_id?: string | null;
          p_training_day: TrainingDay;
          p_played_at: string;
          p_team_a_name: string;
          p_team_b_name: string;
          p_team_a_score: number;
          p_team_b_score: number;
          p_players: Array<{ player_id: string; goals: number; assists: number }>;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
};
