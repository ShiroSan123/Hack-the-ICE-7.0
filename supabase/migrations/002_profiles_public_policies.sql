alter table if exists public.profiles enable row level security;

create policy if not exists "Profiles are readable by frontend" on public.profiles
	for select
	using (auth.role() in ('anon', 'authenticated', 'service_role'));

create policy if not exists "Profiles can be inserted by frontend" on public.profiles
	for insert
	with check (auth.role() in ('anon', 'authenticated', 'service_role'));

create policy if not exists "Profiles can be updated by frontend" on public.profiles
	for update
	using (auth.role() in ('anon', 'authenticated', 'service_role'))
	with check (auth.role() in ('anon', 'authenticated', 'service_role'));
