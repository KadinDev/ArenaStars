import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addPlayerToOrganization, assignPlayerToTeam, createMatch, createOrganization, createPlayer, createTeam, deleteMatch, deleteTeam, fetchAllPlayers, fetchMatches, fetchOrganizations, fetchPlayerStats, fetchPlayers, fetchRanking, fetchTeamPlayers, fetchTeams, queryKeys, recordPlayerEvent, removePlayerFromOrganization, saveMatchWithStats, setCompetitionChampion, updateCompetitionPlayerProfile, updatePlayer, updatePlayerPhoto, type PlayerEventType } from "@/services/queries";
import { useOrganizationStore } from "@/stores/organizationStore";
import type { CompetitionPlayerProfileInput, MatchWithStatsInput, NewMatchInput, NewPlayerInput, TrainingDay } from "@/types/database";

export function useOrganizations() {
  return useQuery({
    queryKey: queryKeys.organizations,
    queryFn: fetchOrganizations
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const setSelectedOrganization = useOrganizationStore((state) => state.setSelectedOrganization);
  return useMutation({
    mutationFn: (input: { name: string; logo_url?: string | null }) => createOrganization(input),
    onSuccess: (organization) => {
      setSelectedOrganization(organization);
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations });
    }
  });
}

export function useAllPlayers() {
  return useQuery({
    queryKey: ["players", "all"],
    queryFn: fetchAllPlayers
  });
}

export function useAddPlayerToOrganization() {
  const queryClient = useQueryClient();
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useMutation({
    mutationFn: (input: string | { playerId: string; profile?: CompetitionPlayerProfileInput }) => {
      const playerId = typeof input === "string" ? input : input.playerId;
      const profile = typeof input === "string" ? undefined : input.profile;
      return addPlayerToOrganization(organizationId!, playerId, profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players(organizationId) });
      queryClient.invalidateQueries({ queryKey: ["players", "all"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    },
    onMutate: () => {
      if (!organizationId) throw new Error("Selecione uma competicao antes de adicionar jogador.");
    }
  });
}

export function useTeams() {
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useQuery({
    queryKey: queryKeys.teams(organizationId),
    queryFn: () => fetchTeams(organizationId!),
    enabled: Boolean(organizationId)
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useMutation({
    mutationFn: (input: { name: string; color?: string | null; logo_url?: string | null }) => createTeam(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams(organizationId) });
    },
    onMutate: () => {
      if (!organizationId) throw new Error("Selecione uma competicao antes de cadastrar times.");
    }
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useMutation({
    mutationFn: (teamId: string) => deleteTeam(organizationId!, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams(organizationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teamPlayers(organizationId) });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["player"] });
    },
    onMutate: () => {
      if (!organizationId) throw new Error("Selecione uma competicao antes de excluir time.");
    }
  });
}

export function useSetCompetitionChampion() {
  const queryClient = useQueryClient();
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useMutation({
    mutationFn: (input: { teamId: string; title: string; count: number | null }) =>
      setCompetitionChampion({ organizationId: organizationId!, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams(organizationId) });
      queryClient.invalidateQueries({ queryKey: ["player"] });
    },
    onMutate: () => {
      if (!organizationId) throw new Error("Selecione uma competicao antes de definir campeao.");
    }
  });
}

export function useTeamPlayers() {
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useQuery({
    queryKey: queryKeys.teamPlayers(organizationId),
    queryFn: () => fetchTeamPlayers(organizationId!),
    enabled: Boolean(organizationId)
  });
}

export function useAssignPlayerToTeam() {
  const queryClient = useQueryClient();
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useMutation({
    mutationFn: ({ playerId, teamId }: { playerId: string; teamId: string | null }) => assignPlayerToTeam(organizationId!, playerId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teamPlayers(organizationId) });
      queryClient.invalidateQueries({ queryKey: ["player"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    },
    onMutate: () => {
      if (!organizationId) throw new Error("Selecione uma competicao antes de vincular times.");
    }
  });
}

export function useRemovePlayerFromOrganization() {
  const queryClient = useQueryClient();
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useMutation({
    mutationFn: (playerId: string) => removePlayerFromOrganization(organizationId!, playerId),
    onSuccess: (_, playerId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players(organizationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teamPlayers(organizationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.player(organizationId, playerId) });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    },
    onMutate: () => {
      if (!organizationId) throw new Error("Selecione uma competicao antes de remover jogador.");
    }
  });
}

export function usePlayers() {
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useQuery({
    queryKey: queryKeys.players(organizationId),
    queryFn: () => fetchPlayers(organizationId!),
    enabled: Boolean(organizationId)
  });
}

export function useMatches(page = 0, day?: TrainingDay) {
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useQuery({
    queryKey: queryKeys.matches(organizationId, page, day),
    queryFn: () => fetchMatches(organizationId!, page, day),
    enabled: Boolean(organizationId)
  });
}

export function useRanking(day: TrainingDay | "geral") {
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useQuery({
    queryKey: queryKeys.ranking(organizationId, day),
    queryFn: () => fetchRanking(organizationId!, day),
    enabled: Boolean(organizationId)
  });
}

export function usePlayerStats(playerId: string) {
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useQuery({
    queryKey: queryKeys.player(organizationId, playerId),
    queryFn: () => fetchPlayerStats(organizationId!, playerId),
    enabled: Boolean(playerId && organizationId)
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useMutation({
    mutationFn: (input: NewPlayerInput & { photo_url?: string }) => createPlayer(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players(organizationId) });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    },
    onMutate: () => {
      if (!organizationId) throw new Error("Selecione uma organizacao antes de cadastrar jogadores.");
    }
  });
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useMutation({
    mutationFn: async (input: { playerId: string; data: NewPlayerInput & { photo_url?: string | null } }) => {
      const player = await updatePlayer(input.playerId, input.data);
      await updateCompetitionPlayerProfile(organizationId!, input.playerId, {
        position: input.data.position ?? null,
        jersey_number: input.data.jersey_number ?? null,
        dominant_foot: input.data.dominant_foot ?? null
      });
      return {
        ...player,
        position: input.data.position ?? null,
        jersey_number: input.data.jersey_number ?? null,
        dominant_foot: input.data.dominant_foot ?? null
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players(organizationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.player(organizationId, variables.playerId) });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    }
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useMutation({
    mutationFn: (input: Omit<NewMatchInput, "organization_id">) => createMatch({ ...input, organization_id: organizationId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    },
    onMutate: () => {
      if (!organizationId) throw new Error("Selecione uma organizacao antes de cadastrar jogos.");
    }
  });
}

export function useSaveMatchWithStats() {
  const queryClient = useQueryClient();
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useMutation({
    mutationFn: (input: Omit<MatchWithStatsInput, "organization_id">) =>
      saveMatchWithStats({ ...input, organization_id: organizationId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: ["player"] });
    },
    onMutate: () => {
      if (!organizationId) throw new Error("Selecione uma organizacao antes de cadastrar jogos.");
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
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useMutation({
    mutationFn: ({ playerId, photoUrl }: { playerId: string; photoUrl: string }) => updatePlayerPhoto(playerId, photoUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players(organizationId) });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
    }
  });
}

export function useRecordPlayerEvent(playerId: string) {
  const queryClient = useQueryClient();
  const organizationId = useOrganizationStore((state) => state.selectedOrganization?.id);
  return useMutation({
    mutationFn: (input: { matchId: string; type: PlayerEventType; quantity?: number }) =>
      recordPlayerEvent({ organizationId: organizationId!, playerId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.player(organizationId, playerId) });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.players(organizationId) });
    },
    onMutate: () => {
      if (!organizationId) throw new Error("Selecione uma organizacao antes de registrar estatisticas.");
    }
  });
}
