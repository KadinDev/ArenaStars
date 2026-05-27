import type { CompetitionPlayer, DominantFoot, Organization, Player, Match, RankingPlayer, Team, TeamPlayer, TrainingDay } from "./database";

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: { name: string; slug?: string | null; logo_url?: string | null };
        Update: Partial<Omit<Organization, "id" | "created_at">>;
        Relationships: [];
      };
      organization_members: {
        Row: { id: string; organization_id: string; user_id: string; role: "admin" | "player" | "viewer"; created_at: string };
        Insert: { organization_id: string; user_id: string; role?: "admin" | "player" | "viewer" };
        Update: { role?: "admin" | "player" | "viewer" };
        Relationships: [];
      };
      competition_players: {
        Row: CompetitionPlayer;
        Insert: { organization_id: string; player_id: string; position?: string | null; jersey_number?: number | null; dominant_foot?: DominantFoot | null };
        Update: Partial<Pick<CompetitionPlayer, "position" | "jersey_number" | "dominant_foot">>;
        Relationships: [];
      };
      teams: {
        Row: Team;
        Insert: { organization_id: string; name: string; logo_url?: string | null; color?: string | null };
        Update: Partial<Omit<Team, "id" | "organization_id" | "created_at">>;
        Relationships: [];
      };
      team_players: {
        Row: TeamPlayer;
        Insert: { organization_id: string; team_id: string; player_id: string };
        Update: { team_id?: string };
        Relationships: [];
      };
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
        Row: { id: string; match_id: string; player_id: string; team_id: string | null; training_day: TrainingDay; created_at: string };
        Insert: { match_id: string; player_id: string; team_id?: string | null; training_day: TrainingDay };
        Update: { team_id?: string | null; training_day?: TrainingDay };
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
          p_organization_id: string;
          p_match_id?: string | null;
          p_team_a_id?: string | null;
          p_team_b_id?: string | null;
          p_training_day: TrainingDay;
          p_played_at: string;
          p_team_a_name: string;
          p_team_b_name: string;
          p_team_a_score: number;
          p_team_b_score: number;
          p_players: Array<{ player_id: string; team_id?: string | null; goals: number; assists: number }>;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
};
