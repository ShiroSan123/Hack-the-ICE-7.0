-- Profiles table adjustments for application specific fields
alter table public.profiles
	add column if not exists full_name text,
	add column if not exists region text default 'xxxxxxxxx',
	add column if not exists category text default 'pensioner',
	add column if not exists snils text,
	add column if not exists role text default 'self',
	add column if not exists interests text[] default '{}',
	add column if not exists simple_mode_enabled boolean default true;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'profiles_auth_user_id_unique'
			and conrelid = 'public.profiles'::regclass
	) then
		begin
			alter table public.profiles
				add constraint profiles_auth_user_id_unique unique (auth_user_id);
		exception
			when duplicate_table or duplicate_object then
				null;
		end;
	end if;
end $$;

-- Benefits catalog
create table if not exists public.benefits (
	id text primary key,
	title text not null,
	description text not null,
	type text not null,
	target_groups text[] not null default '{}',
	regions text[] not null default '{}',
	valid_from date,
	valid_to date,
	requirements text[] not null default '{}',
	documents text[] not null default '{}',
	steps text[] not null default '{}',
	partner text,
	savings_per_month numeric,
	is_new boolean default false,
	created_at timestamptz not null default now()
);

-- Offers catalog
create table if not exists public.offers (
	id text primary key,
	title text not null,
	description text not null,
	partner text,
	discount numeric,
	valid_from date,
	valid_to date,
	target_groups text[] not null default '{}',
	regions text[] not null default '{}',
	category text,
	created_at timestamptz not null default now()
);

-- Medicines catalog
create table if not exists public.medicines (
	id text primary key,
	name text not null,
	dosage text,
	frequency text,
	prescribed_by text,
	prescribed_date date,
	refill_date date,
	related_benefit_ids text[] not null default '{}',
	related_offer_ids text[] not null default '{}',
	monthly_price numeric,
	discounted_price numeric,
	created_at timestamptz not null default now()
);

-- Disable RLS for shared catalog tables (they do not contain sensitive data)
alter table public.benefits disable row level security;
alter table public.offers disable row level security;
alter table public.medicines disable row level security;
-- profiles table keeps the default RLS configuration from Supabase; adjust policies as needed.
