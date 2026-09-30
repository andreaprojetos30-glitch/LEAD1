-- ELEVA Captação de Leads
-- Rode este arquivo no SQL Editor do Supabase (uma vez por projeto).

do $$
begin
  create extension if not exists unaccent with schema extensions;
exception
  when duplicate_object then null;
  when others then null;
end $$;

create or replace function public.eleva_norm(t text)
returns text
language plpgsql
as $$
declare
  v text := coalesce(t, '');
begin
  begin
    v := extensions.unaccent(v);
  exception
    when undefined_function then
      v := v;
  end;
  return trim(regexp_replace(lower(v), '\s+', ' ', 'g'));
end;
$$;

create table if not exists public.eventos (
  id uuid primary key,
  nome text not null check (char_length(trim(nome)) > 0),
  cidade text,
  local text,
  data_inicio date,
  data_fim date,
  status text not null default 'ativo' check (status in ('ativo', 'encerrado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key,
  evento_id uuid not null references public.eventos (id) on delete restrict,
  nome text not null check (char_length(trim(nome)) > 0),
  celular text not null,
  celular_normalizado text not null,
  perfil text not null check (perfil in ('sindico', 'subsindico', 'conselho', 'morador', 'administradora', 'outro')),
  condominio text not null check (char_length(trim(condominio)) > 0),
  condominio_normalizado text not null,
  nome_normalizado text not null,
  cep text,
  logradouro text,
  numero text,
  bairro text,
  cidade text,
  estado text,
  quantidade_unidades integer check (quantidade_unidades is null or quantidade_unidades >= 0),
  possui_academia text check (possui_academia is null or possui_academia in ('sim', 'nao', 'nao_sei')),
  interesse text check (interesse is null or interesse in ('sim', 'talvez', 'nao', 'nao_conversado')),
  observacao text,
  consultor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(celular_normalizado) between 10 and 11)
);

create index if not exists eventos_status_idx on public.eventos (status);
create index if not exists leads_evento_id_idx on public.leads (evento_id);
create index if not exists leads_celular_idx on public.leads (celular_normalizado);
create index if not exists leads_nome_condominio_idx on public.leads (nome_normalizado, condominio_normalizado);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

create or replace function public.eventos_touch()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.created_at is null then
      new.created_at := now();
    end if;
    if new.updated_at is null then
      new.updated_at := new.created_at;
    end if;
  else
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.leads_touch()
returns trigger
language plpgsql
as $$
begin
  new.celular_normalizado := regexp_replace(coalesce(new.celular, ''), '\D', '', 'g');
  new.nome_normalizado := public.eleva_norm(new.nome);
  new.condominio_normalizado := public.eleva_norm(new.condominio);
  if tg_op = 'INSERT' then
    if new.created_at is null then
      new.created_at := now();
    end if;
    if new.updated_at is null then
      new.updated_at := new.created_at;
    end if;
  else
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists eventos_touch on public.eventos;
create trigger eventos_touch
before insert or update on public.eventos
for each row execute function public.eventos_touch();

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch
before insert or update on public.leads
for each row execute function public.leads_touch();

alter table public.eventos enable row level security;
alter table public.leads enable row level security;

drop policy if exists "equipe_all_eventos" on public.eventos;
create policy "equipe_all_eventos"
on public.eventos
for all
to authenticated
using (true)
with check (true);

drop policy if exists "equipe_all_leads" on public.leads;
create policy "equipe_all_leads"
on public.leads
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.eventos to authenticated;
grant select, insert, update, delete on public.leads to authenticated;
