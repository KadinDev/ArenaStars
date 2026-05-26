import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMatch, createPlayer, deleteMatch, fetchMatches, fetchPlayerStats, fetchPlayers, fetchRanking, queryKeys, recordPlayerEvent, saveMatchWithStats, updatePlayer, updatePlayerPhoto, type PlayerEventType } from "@/services/queries";
import type { MatchWithStatsInput, NewMatchInput, NewPlayerInput, TrainingDay } from "@/types/database";

export function usePlayers() {
  return useQuery({
    queryKey: queryKeys.players,
    queryFn: fetchPlayers
  });
}

export function useMatches(page = 0, day?: TrainingDay) {
  return useQuery({
    queryKey: queryKeys.matches(page, day),
    queryFn: () => fetchMatches(page, day)
  });
}

export function useRanking(day: TrainingDay | "geral") {
  return useQuery({
    queryKey: queryKeys.ranking(day),
    queryFn: () => fetchRanking(day)
  });
}

export function usePlayerStats(playerId: string) {
  return useQuery({
    queryKey: queryKeys.player(playerId),
    queryFn: () => fetchPlayerStats(playerId),
    enabled: Boolean(playerId)
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewPlayerInput & { photo_url?: string }) => createPlayer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    }
  });
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { playerId: string; data: NewPlayerInput & { photo_url?: string | null } }) =>
      updatePlayer(input.playerId, input.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players });
      queryClient.invalidateQueries({ queryKey: queryKeys.player(variables.playerId) });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    }
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewMatchInput) => createMatch(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    }
  });
}

export function useSaveMatchWithStats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MatchWithStatsInput) => saveMatchWithStats(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: ["player"] });
    }
  });
}

export function useDeleteMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => deleteMatch(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: ["player"] });
    }
  });
}

export function useUpdatePlayerPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playerId, photoUrl }: { playerId: string; photoUrl: string }) => updatePlayerPhoto(playerId, photoUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    }
  });
}

export function useRecordPlayerEvent(playerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { matchId: string; type: PlayerEventType; quantity?: number }) =>
      recordPlayerEvent({ playerId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.player(playerId) });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.players });
    }
  });
}
