alter table if exists public.profiles enable row level security;

do $$
begin
	if not exists (
		select 1 from pg_policies
		where schemaname = 'public'
			and tablename = 'profiles'
			and policyname = 'Profiles are readable by frontend'
	) then
		create policy "Profiles are readable by frontend" on public.profiles
			for select
			using (auth.role() in ('anon', 'authenticated', 'service_role'));
	end if;
end $$;

do $$
begin
	if not exists (
		select 1 from pg_policies
		where schemaname = 'public'
			and tablename = 'profiles'
			and policyname = 'Profiles can be inserted by frontend'
	) then
		create policy "Profiles can be inserted by frontend" on public.profiles
			for insert
			with check (auth.role() in ('anon', 'authenticated', 'service_role'));
	end if;
end $$;

do $$
begin
	if not exists (
		select 1 from pg_policies
		where schemaname = 'public'
			and tablename = 'profiles'
			and policyname = 'Profiles can be updated by frontend'
	) then
		create policy "Profiles can be updated by frontend" on public.profiles
			for update
			using (auth.role() in ('anon', 'authenticated', 'service_role'))
			with check (auth.role() in ('anon', 'authenticated', 'service_role'));
	end if;
end $$;
