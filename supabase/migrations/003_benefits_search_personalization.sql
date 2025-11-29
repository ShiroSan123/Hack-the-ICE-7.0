-- Enable search extensions
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Categories and tags for benefits taxonomy
create table if not exists public.benefit_categories (
  id text primary key,
  name text not null,
  description text
);

create table if not exists public.benefit_tags (
  id text primary key,
  name text not null
);

-- Link tables for tags/regions/target groups
create table if not exists public.benefit_tags_map (
  benefit_id text references public.benefits(id) on delete cascade,
  tag_id text references public.benefit_tags(id) on delete cascade,
  primary key (benefit_id, tag_id)
);

create table if not exists public.benefit_regions_map (
  benefit_id text references public.benefits(id) on delete cascade,
  region text not null,
  primary key (benefit_id, region)
);

create table if not exists public.benefit_target_groups_map (
  benefit_id text references public.benefits(id) on delete cascade,
  target_group text not null,
  primary key (benefit_id, target_group)
);

-- Enrich benefits with category/tags and merchant/location metadata
alter table public.benefits
  add column if not exists category_id text references public.benefit_categories(id),
  add column if not exists tags text[] default '{}'::text[],
  add column if not exists merchant_name text,
  add column if not exists merchant_url text,
  add column if not exists locations jsonb default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'eligibility_op'
  ) then
    create type public.eligibility_op as enum ('eq','neq','gte','lte','in','nin','exists');
  end if;
end $$;

create table if not exists public.benefit_eligibility (
  id bigint generated always as identity primary key,
  benefit_id text references public.benefits(id) on delete cascade,
  rule_key text not null,
  op public.eligibility_op not null,
  rule_value text,
  priority int default 0
);

-- Personalization tables
create table if not exists public.user_favorites (
  user_id uuid references auth.users(id) on delete cascade,
  benefit_id text references public.benefits(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, benefit_id)
);

create table if not exists public.user_views (
  user_id uuid references auth.users(id) on delete cascade,
  benefit_id text references public.benefits(id) on delete cascade,
  last_viewed timestamptz default now(),
  views int default 1,
  primary key (user_id, benefit_id)
);

create table if not exists public.user_dismissed (
  user_id uuid references auth.users(id) on delete cascade,
  benefit_id text references public.benefits(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, benefit_id)
);

-- Profile enrichment for better matching
alter table public.profiles
  add column if not exists birth_year int,
  add column if not exists employment_status text,
  add column if not exists student boolean,
  add column if not exists pensioner boolean,
  add column if not exists veteran boolean,
  add column if not exists has_children boolean,
  add column if not exists disability_group text,
  add column if not exists income_band text,
  add column if not exists city text;

-- Search indexes
-- unaccent is marked STABLE; wrap it in an IMMUTABLE helper for index usage
create or replace function public.immutable_unaccent(text) returns text
language sql
immutable
parallel safe
as $$
  select unaccent($1)::text;
$$;

create index if not exists benefits_search_idx on public.benefits using gin (
  to_tsvector('russian', public.immutable_unaccent(coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(type,'')))
);
create index if not exists benefits_target_groups_gin on public.benefits using gin (target_groups);
create index if not exists benefits_regions_gin on public.benefits using gin (regions);
create index if not exists benefits_tags_gin on public.benefits using gin (tags);

-- Fast RPC for search/filtering
create or replace function public.match_benefits(
  p_search text default null,
  p_region text default null,
  p_target_group text default null,
  p_tags text[] default null,
  p_only_new boolean default false,
  p_type text default null,
  p_limit int default 20,
  p_offset int default 0
) returns setof public.benefits
language sql stable as $$
  select b.*
  from public.benefits b
  left join public.benefit_tags_map tm on tm.benefit_id = b.id
  where (p_search is null or to_tsvector('russian', unaccent(b.title || ' ' || b.description || ' ' || b.type)) @@ plainto_tsquery('russian', unaccent(p_search)))
    and (p_region is null or b.regions @> array[p_region] or exists (select 1 from public.benefit_regions_map br where br.benefit_id = b.id and br.region = p_region) or b.regions @> array['all'])
    and (p_target_group is null or b.target_groups @> array[p_target_group] or exists (select 1 from public.benefit_target_groups_map bt where bt.benefit_id = b.id and bt.target_group = p_target_group))
    and (p_tags is null or b.tags && p_tags or exists (select 1 from public.benefit_tags_map tm2 where tm2.benefit_id = b.id and tm2.tag_id = any(p_tags)))
    and (not p_only_new or coalesce(b.is_new,false) = true)
    and (p_type is null or p_type = 'all' or b.type = p_type)
  group by b.id
  order by coalesce(b.is_new,false) desc, b.created_at desc
  limit p_limit offset p_offset;
$$;

-- RLS for user-specific tables
alter table public.user_favorites enable row level security;
alter table public.user_views enable row level security;
alter table public.user_dismissed enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_favorites'
      and policyname = 'favorites select own'
  ) then
    create policy "favorites select own" on public.user_favorites
      for select using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_favorites'
      and policyname = 'favorites upsert own'
  ) then
    create policy "favorites upsert own" on public.user_favorites
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_favorites'
      and policyname = 'favorites delete own'
  ) then
    create policy "favorites delete own" on public.user_favorites
      for delete using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_views'
      and policyname = 'views select own'
  ) then
    create policy "views select own" on public.user_views
      for select using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_views'
      and policyname = 'views upsert own'
  ) then
    create policy "views upsert own" on public.user_views
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_views'
      and policyname = 'views update own'
  ) then
    create policy "views update own" on public.user_views
      for update using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_dismissed'
      and policyname = 'dismissed select own'
  ) then
    create policy "dismissed select own" on public.user_dismissed
      for select using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_dismissed'
      and policyname = 'dismissed upsert own'
  ) then
    create policy "dismissed upsert own" on public.user_dismissed
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_dismissed'
      and policyname = 'dismissed delete own'
  ) then
    create policy "dismissed delete own" on public.user_dismissed
      for delete using (auth.uid() = user_id);
  end if;
end $$;
