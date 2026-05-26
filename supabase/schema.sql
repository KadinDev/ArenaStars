create extension if not exists "pgcrypto";

do $$
begin
  create type public.training_day as enum ('quinta', 'sabado');
exception
  when duplicate_object then null;
end $$;

alter type public.training_day add value if not exists 'domingo';
alter type public.training_day add value if not exists 'segunda';
alter type public.training_day add value if not exists 'terca';
alter type public.training_day add value if not exists 'quarta';
alter type public.training_day add value if not exists 'sexta';

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nickname text,
  photo_url text,
  position text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  training_day public.training_day not null,
  played_at timestamptz not null,
  team_a_name text not null default 'Time A',
  team_b_name text not null default 'Time B',
  team_a_score integer not null default 0 check (team_a_score >= 0),
  team_b_score integer not null default 0 check (team_b_score >= 0)
);

create table if not exists public.participations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  training_day public.training_day not null,
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create table if not exists public.assists (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create index if not exists players_active_name_idx on public.players (active, name);
create index if not exists matches_training_day_played_at_idx on public.matches (training_day, played_at desc);
create index if not exists matches_played_at_idx on public.matches (played_at desc);
create index if not exists participations_player_id_idx on public.participations (player_id);
create index if not exists participations_match_id_idx on public.participations (match_id);
create index if not exists participations_training_day_idx on public.participations (training_day);
create index if not exists goals_player_id_idx on public.goals (player_id);
create index if not exists goals_match_id_idx on public.goals (match_id);
create index if not exists assists_player_id_idx on public.assists (player_id);
create index if not exists assists_match_id_idx on public.assists (match_id);

create or replace view public.ranking_cache as
with days as (
  select unnest(enum_range(null::public.training_day)) as training_day
),
per_day as (
  select
    p.id as player_id,
    p.name,
    p.nickname,
    p.photo_url,
    d.training_day::text as training_day,
    count(distinct pr.match_id)::integer as matches,
    coalesce(sum(g.quantity), 0)::integer as goals,
    coalesce(sum(a.quantity), 0)::integer as assists
  from public.players p
  cross join days d
  left join public.participations pr on pr.player_id = p.id and pr.training_day = d.training_day
  left join public.goals g on g.player_id = p.id and g.match_id = pr.match_id
  left join public.assists a on a.player_id = p.id and a.match_id = pr.match_id
  where p.active = true
  group by p.id, p.name, p.nickname, p.photo_url, d.training_day
),
overall as (
  select
    player_id,
    name,
    nickname,
    photo_url,
    'geral'::text as training_day,
    sum(matches)::integer as matches,
    sum(goals)::integer as goals,
    sum(assists)::integer as assists
  from per_day
  group by player_id, name, nickname, photo_url
)
select
  player_id,
  name,
  nickname,
  photo_url,
  training_day,
  matches,
  goals,
  assists,
  ((goals * 3) + (assists * 2) + matches)::integer as score
from per_day
union all
select
  player_id,
  name,
  nickname,
  photo_url,
  training_day,
  matches,
  goals,
  assists,
  ((goals * 3) + (assists * 2) + matches)::integer as score
from overall;

create or replace function public.register_participation(p_match_id uuid, p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_training_day public.training_day;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  select training_day into v_training_day from public.matches where id = p_match_id;
  if v_training_day is null then
    raise exception 'match not found';
  end if;

  insert into public.participations (match_id, player_id, training_day)
  values (p_match_id, p_player_id, v_training_day)
  on conflict (match_id, player_id) do nothing;
end;
$$;

create or replace function public.add_player_goal(p_match_id uuid, p_player_id uuid, p_quantity integer default 1)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  perform public.register_participation(p_match_id, p_player_id);

  insert into public.goals (match_id, player_id, quantity)
  values (p_match_id, p_player_id, greatest(p_quantity, 1))
  on conflict (match_id, player_id)
  do update set quantity = public.goals.quantity + excluded.quantity;
end;
$$;

create or replace function public.add_player_assist(p_match_id uuid, p_player_id uuid, p_quantity integer default 1)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  perform public.register_participation(p_match_id, p_player_id);

  insert into public.assists (match_id, player_id, quantity)
  values (p_match_id, p_player_id, greatest(p_quantity, 1))
  on conflict (match_id, player_id)
  do update set quantity = public.assists.quantity + excluded.quantity;
end;
$$;

create or replace function public.save_match_with_stats(
  p_match_id uuid,
  p_training_day public.training_day,
  p_played_at timestamptz,
  p_team_a_name text,
  p_team_b_name text,
  p_team_a_score integer,
  p_team_b_score integer,
  p_players jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid;
  v_player jsonb;
  v_player_id uuid;
  v_goals integer;
  v_assists integer;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  if p_match_id is null then
    insert into public.matches (training_day, played_at, team_a_name, team_b_name, team_a_score, team_b_score)
    values (p_training_day, p_played_at, p_team_a_name, p_team_b_name, p_team_a_score, p_team_b_score)
    returning id into v_match_id;
  else
    update public.matches
    set training_day = p_training_day,
        played_at = p_played_at,
        team_a_name = p_team_a_name,
        team_b_name = p_team_b_name,
        team_a_score = p_team_a_score,
        team_b_score = p_team_b_score
    where id = p_match_id
    returning id into v_match_id;
  end if;

  delete from public.goals where match_id = v_match_id;
  delete from public.assists where match_id = v_match_id;
  delete from public.participations where match_id = v_match_id;

  for v_player in select * from jsonb_array_elements(coalesce(p_players, '[]'::jsonb))
  loop
    v_player_id := (v_player ->> 'player_id')::uuid;
    v_goals := greatest(coalesce((v_player ->> 'goals')::integer, 0), 0);
    v_assists := greatest(coalesce((v_player ->> 'assists')::integer, 0), 0);

    insert into public.participations (match_id, player_id, training_day)
    values (v_match_id, v_player_id, p_training_day)
    on conflict (match_id, player_id) do nothing;

    if v_goals > 0 then
      insert into public.goals (match_id, player_id, quantity)
      values (v_match_id, v_player_id, v_goals);
    end if;

    if v_assists > 0 then
      insert into public.assists (match_id, player_id, quantity)
      values (v_match_id, v_player_id, v_assists);
    end if;
  end loop;

  return v_match_id;
end;
$$;

alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.participations enable row level security;
alter table public.goals enable row level security;
alter table public.assists enable row level security;

drop policy if exists "public read players" on public.players;
create policy "public read players" on public.players
for select using (active = true);

drop policy if exists "admin write players" on public.players;
create policy "admin write players" on public.players
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read matches" on public.matches;
create policy "public read matches" on public.matches
for select using (true);

drop policy if exists "admin write matches" on public.matches;
create policy "admin write matches" on public.matches
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read participations" on public.participations;
create policy "public read participations" on public.participations
for select using (true);

drop policy if exists "admin write participations" on public.participations;
create policy "admin write participations" on public.participations
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read goals" on public.goals;
create policy "public read goals" on public.goals
for select using (true);

drop policy if exists "admin write goals" on public.goals;
create policy "admin write goals" on public.goals
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read assists" on public.assists;
create policy "public read assists" on public.assists
for select using (true);

drop policy if exists "admin write assists" on public.assists;
create policy "admin write assists" on public.assists
for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('players', 'players', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read player photos" on storage.objects;
create policy "public read player photos" on storage.objects
for select using (bucket_id = 'players');

drop policy if exists "admin upload player photos" on storage.objects;
create policy "admin upload player photos" on storage.objects
for insert with check (bucket_id = 'players' and public.is_admin());

drop policy if exists "admin update player photos" on storage.objects;
create policy "admin update player photos" on storage.objects
for update using (bucket_id = 'players' and public.is_admin()) with check (bucket_id = 'players' and public.is_admin());

drop policy if exists "admin delete player photos" on storage.objects;
create policy "admin delete player photos" on storage.objects
for delete using (bucket_id = 'players' and public.is_admin());

-- Defina admins no Supabase Auth com:
-- update auth.users
-- set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
-- where email = 'admin@seudominio.com';
