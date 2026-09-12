create table if not exists public.app_state (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "Authenticated users can read app state" on public.app_state;
create policy "Authenticated users can read app state"
  on public.app_state for select to authenticated using (true);

drop policy if exists "Public can read storefront app state" on public.app_state;
create policy "Public can read storefront app state"
  on public.app_state for select to anon
  using (key in ('catalog', 'promotions', 'settings'));

drop policy if exists "Authenticated users can insert app state" on public.app_state;
create policy "Authenticated users can insert app state"
  on public.app_state for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update app state" on public.app_state;
create policy "Authenticated users can update app state"
  on public.app_state for update to authenticated using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_state'
  ) then
    alter publication supabase_realtime add table public.app_state;
  end if;
end
$$;

create table if not exists public.customer_registrations (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.customer_registrations enable row level security;

drop policy if exists "Anyone can register as customer" on public.customer_registrations;
create policy "Anyone can register as customer"
  on public.customer_registrations for insert to anon, authenticated
  with check (true);

drop policy if exists "Authenticated users can read customer registrations" on public.customer_registrations;
create policy "Authenticated users can read customer registrations"
  on public.customer_registrations for select to authenticated using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'customer_registrations'
  ) then
    alter publication supabase_realtime add table public.customer_registrations;
  end if;
end
$$;

create or replace function public.delete_customer_account(p_customer_id text, p_phone text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare deleted boolean;
begin
  delete from public.customer_registrations
  where id = p_customer_id
    and regexp_replace(data->>'phone', '\D', '', 'g') =
        regexp_replace(p_phone, '\D', '', 'g');
  deleted := found;
  if deleted then
    update public.app_state
    set data = jsonb_set(
      data, '{customers}',
      coalesce((
        select jsonb_agg(customer)
        from jsonb_array_elements(data->'customers') customer
        where customer->>'id' <> p_customer_id
      ), '[]'::jsonb), true
    ), updated_at = now()
    where key = 'customers';
  end if;
  return deleted;
end;
$$;

grant execute on function public.delete_customer_account(text, text) to anon, authenticated;

create or replace function public.find_customer_by_phone(p_phone text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare customer_data jsonb;
begin
  select data into customer_data
  from public.customer_registrations
  where regexp_replace(data->>'phone', '\D', '', 'g') =
        regexp_replace(p_phone, '\D', '', 'g')
  limit 1;
  return customer_data;
end;
$$;

grant execute on function public.find_customer_by_phone(text) to anon, authenticated;
