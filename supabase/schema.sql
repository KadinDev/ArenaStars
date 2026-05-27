create extension if not exists "pgcrypto";

do $$
begin
  create type public.training_day as enum ('domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado');
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

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'player' check (role in ('admin', 'player', 'viewer')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create or replace function public.is_org_admin(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.organization_members om
      where om.organization_id = p_organization_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
    );
$$;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  nickname text,
  photo_url text,
  position text,
  jersey_number integer check (jersey_number is null or jersey_number > 0),
  dominant_foot text check (dominant_foot is null or dominant_foot in ('direito', 'esquerdo', 'ambos')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  training_day public.training_day not null,
  played_at timestamptz not null,
  team_a_name text not null default 'Time A',
  team_b_name text not null default 'Time B',
  team_a_score integer not null default 0 check (team_a_score >= 0),
  team_b_score integer not null default 0 check (team_b_score >= 0)
);

create table if not exists public.competition_players (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  position text,
  jersey_number integer check (jersey_number is null or jersey_number > 0),
  dominant_foot text check (dominant_foot is null or dominant_foot in ('direito', 'esquerdo', 'ambos')),
  created_at timestamptz not null default now(),
  unique (organization_id, player_id)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  logo_url text,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.team_players (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (organization_id, player_id)
);

alter table public.matches add column if not exists team_a_id uuid references public.teams(id) on delete set null;
alter table public.matches add column if not exists team_b_id uuid references public.teams(id) on delete set null;
insert into public.organizations (name, slug)
values ('Nossa Pelada', 'nossa-pelada')
on conflict (slug) do nothing;

alter table public.players add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.players add column if not exists jersey_number integer check (jersey_number is null or jersey_number > 0);
alter table public.players add column if not exists dominant_foot text check (dominant_foot is null or dominant_foot in ('direito', 'esquerdo', 'ambos'));
alter table public.competition_players add column if not exists position text;
alter table public.competition_players add column if not exists jersey_number integer check (jersey_number is null or jersey_number > 0);
alter table public.competition_players add column if not exists dominant_foot text check (dominant_foot is null or dominant_foot in ('direito', 'esquerdo', 'ambos'));
alter table public.matches add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

update public.players
set organization_id = (select id from public.organizations where slug = 'nossa-pelada')
where organization_id is null;

update public.matches
set organization_id = (select id from public.organizations where slug = 'nossa-pelada')
where organization_id is null;

insert into public.competition_players (organization_id, player_id, position, jersey_number, dominant_foot)
select organization_id, id, position, jersey_number, dominant_foot
from public.players
where organization_id is not null
on conflict (organization_id, player_id) do nothing;

update public.competition_players cp
set position = coalesce(cp.position, p.position),
    jersey_number = coalesce(cp.jersey_number, p.jersey_number),
    dominant_foot = coalesce(cp.dominant_foot, p.dominant_foot)
from public.players p
where p.id = cp.player_id;

alter table public.players alter column organization_id set not null;
alter table public.matches alter column organization_id set not null;

create table if not exists public.participations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  training_day public.training_day not null,
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

alter table public.participations add column if not exists team_id uuid references public.teams(id) on delete set null;

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

create index if not exists organizations_slug_idx on public.organizations (slug);
create index if not exists organization_members_user_id_idx on public.organization_members (user_id);
create index if not exists organization_members_organization_id_idx on public.organization_members (organization_id);
create index if not exists competition_players_organization_id_idx on public.competition_players (organization_id);
create index if not exists competition_players_player_id_idx on public.competition_players (player_id);
create index if not exists teams_organization_name_idx on public.teams (organization_id, name);
create index if not exists team_players_organization_id_idx on public.team_players (organization_id);
create index if not exists team_players_team_id_idx on public.team_players (team_id);
create index if not exists team_players_player_id_idx on public.team_players (player_id);
create index if not exists players_organization_active_name_idx on public.players (organization_id, active, name);
create index if not exists matches_organization_training_day_played_at_idx on public.matches (organization_id, training_day, played_at desc);
create index if not exists matches_organization_played_at_idx on public.matches (organization_id, played_at desc);
create index if not exists participations_player_id_idx on public.participations (player_id);
create index if not exists participations_match_id_idx on public.participations (match_id);
create index if not exists participations_training_day_idx on public.participations (training_day);
create index if not exists goals_player_id_idx on public.goals (player_id);
create index if not exists goals_match_id_idx on public.goals (match_id);
create index if not exists assists_player_id_idx on public.assists (player_id);
create index if not exists assists_match_id_idx on public.assists (match_id);

drop view if exists public.ranking_cache;

create view public.ranking_cache as
with days as (
  select *
  from (values
    ('domingo'),
    ('segunda'),
    ('terca'),
    ('quarta'),
    ('quinta'),
    ('sexta'),
    ('sabado')
  ) as d(training_day)
),
per_day as (
  select
    cp.organization_id,
    p.id as player_id,
    p.name,
    p.nickname,
    p.photo_url,
    cp.jersey_number,
    cp.dominant_foot,
    d.training_day::text as training_day,
    count(distinct m.id)::integer as matches,
    coalesce(sum(case when m.id is not null then g.quantity else 0 end), 0)::integer as goals,
    coalesce(sum(case when m.id is not null then a.quantity else 0 end), 0)::integer as assists
  from public.competition_players cp
  join public.players p on p.id = cp.player_id
  cross join days d
  left join public.participations pr on pr.player_id = p.id and pr.training_day::text = d.training_day
  left join public.matches m on m.id = pr.match_id and m.organization_id = cp.organization_id
  left join public.goals g on g.player_id = p.id and g.match_id = pr.match_id
  left join public.assists a on a.player_id = p.id and a.match_id = pr.match_id
  where p.active = true
  group by cp.organization_id, p.id, p.name, p.nickname, p.photo_url, cp.jersey_number, cp.dominant_foot, d.training_day
),
overall as (
  select
    organization_id,
    player_id,
    name,
    nickname,
    photo_url,
    jersey_number,
    dominant_foot,
    'geral'::text as training_day,
    sum(matches)::integer as matches,
    sum(goals)::integer as goals,
    sum(assists)::integer as assists
  from per_day
  group by organization_id, player_id, name, nickname, photo_url, jersey_number, dominant_foot
)
select
  organization_id,
  player_id,
  name,
  nickname,
  photo_url,
  jersey_number,
  dominant_foot,
  training_day,
  matches,
  goals,
  assists,
  ((goals * 3) + (assists * 2) + matches)::integer as score
from per_day
union all
select
  organization_id,
  player_id,
  name,
  nickname,
  photo_url,
  jersey_number,
  dominant_foot,
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

drop function if exists public.save_match_with_stats(uuid, public.training_day, timestamptz, text, text, integer, integer, jsonb);

create or replace function public.save_match_with_stats(
  p_organization_id uuid,
  p_match_id uuid,
  p_team_a_id uuid,
  p_team_b_id uuid,
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
  v_team_id uuid;
  v_goals integer;
  v_assists integer;
begin
  if not public.is_org_admin(p_organization_id) then
    raise exception 'admin only';
  end if;

  if p_match_id is null then
    insert into public.matches (organization_id, team_a_id, team_b_id, training_day, played_at, team_a_name, team_b_name, team_a_score, team_b_score)
    values (p_organization_id, p_team_a_id, p_team_b_id, p_training_day, p_played_at, p_team_a_name, p_team_b_name, p_team_a_score, p_team_b_score)
    returning id into v_match_id;
  else
    update public.matches
    set organization_id = p_organization_id,
        team_a_id = p_team_a_id,
        team_b_id = p_team_b_id,
        training_day = p_training_day,
        played_at = p_played_at,
        team_a_name = p_team_a_name,
        team_b_name = p_team_b_name,
        team_a_score = p_team_a_score,
        team_b_score = p_team_b_score
    where id = p_match_id and organization_id = p_organization_id
    returning id into v_match_id;
  end if;

  delete from public.goals where match_id = v_match_id;
  delete from public.assists where match_id = v_match_id;
  delete from public.participations where match_id = v_match_id;

  for v_player in select * from jsonb_array_elements(coalesce(p_players, '[]'::jsonb))
  loop
    v_player_id := (v_player ->> 'player_id')::uuid;
    v_team_id := nullif(v_player ->> 'team_id', '')::uuid;
    v_goals := greatest(coalesce((v_player ->> 'goals')::integer, 0), 0);
    v_assists := greatest(coalesce((v_player ->> 'assists')::integer, 0), 0);

    insert into public.participations (match_id, player_id, team_id, training_day)
    values (v_match_id, v_player_id, v_team_id, p_training_day)
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

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.competition_players enable row level security;
alter table public.teams enable row level security;
alter table public.team_players enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.participations enable row level security;
alter table public.goals enable row level security;
alter table public.assists enable row level security;

drop policy if exists "public read organizations" on public.organizations;
create policy "public read organizations" on public.organizations
for select using (true);

drop policy if exists "admin write organizations" on public.organizations;
create policy "admin write organizations" on public.organizations
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "members read organization members" on public.organization_members;
create policy "members read organization members" on public.organization_members
for select using (public.is_admin() or user_id = auth.uid());

drop policy if exists "admin write organization members" on public.organization_members;
create policy "admin write organization members" on public.organization_members
for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

drop policy if exists "public read competition players" on public.competition_players;
create policy "public read competition players" on public.competition_players
for select using (true);

drop policy if exists "admin write competition players" on public.competition_players;
create policy "admin write competition players" on public.competition_players
for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

drop policy if exists "public read teams" on public.teams;
create policy "public read teams" on public.teams
for select using (true);

drop policy if exists "admin write teams" on public.teams;
create policy "admin write teams" on public.teams
for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

drop policy if exists "public read team players" on public.team_players;
create policy "public read team players" on public.team_players
for select using (true);

drop policy if exists "admin write team players" on public.team_players;
create policy "admin write team players" on public.team_players
for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

drop policy if exists "public read players" on public.players;
create policy "public read players" on public.players
for select using (active = true);

drop policy if exists "admin write players" on public.players;
create policy "admin write players" on public.players
for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

drop policy if exists "public read matches" on public.matches;
create policy "public read matches" on public.matches
for select using (true);

drop policy if exists "admin write matches" on public.matches;
create policy "admin write matches" on public.matches
for all using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));

drop policy if exists "public read participations" on public.participations;
create policy "public read participations" on public.participations
for select using (true);

drop policy if exists "admin write participations" on public.participations;
create policy "admin write participations" on public.participations
for all using (
  exists (select 1 from public.matches m where m.id = match_id and public.is_org_admin(m.organization_id))
) with check (
  exists (select 1 from public.matches m where m.id = match_id and public.is_org_admin(m.organization_id))
);

drop policy if exists "public read goals" on public.goals;
create policy "public read goals" on public.goals
for select using (true);

drop policy if exists "admin write goals" on public.goals;
create policy "admin write goals" on public.goals
for all using (
  exists (select 1 from public.matches m where m.id = match_id and public.is_org_admin(m.organization_id))
) with check (
  exists (select 1 from public.matches m where m.id = match_id and public.is_org_admin(m.organization_id))
);

drop policy if exists "public read assists" on public.assists;
create policy "public read assists" on public.assists
for select using (true);

drop policy if exists "admin write assists" on public.assists;
create policy "admin write assists" on public.assists
for all using (
  exists (select 1 from public.matches m where m.id = match_id and public.is_org_admin(m.organization_id))
) with check (
  exists (select 1 from public.matches m where m.id = match_id and public.is_org_admin(m.organization_id))
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('players', 'players', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('competition-logos', 'competition-logos', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
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

drop policy if exists "public read competition logos" on storage.objects;
create policy "public read competition logos" on storage.objects
for select using (bucket_id = 'competition-logos');

drop policy if exists "admin upload competition logos" on storage.objects;
create policy "admin upload competition logos" on storage.objects
for insert with check (bucket_id = 'competition-logos' and public.is_admin());

drop policy if exists "admin update competition logos" on storage.objects;
create policy "admin update competition logos" on storage.objects
for update using (bucket_id = 'competition-logos' and public.is_admin()) with check (bucket_id = 'competition-logos' and public.is_admin());

-- Defina admins no Supabase Auth com:
-- update auth.users
-- set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
-- where email = 'admin@seudominio.com';
