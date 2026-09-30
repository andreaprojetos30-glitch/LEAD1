-- Tira Consultor da lista de perfil e cria o campo de texto, sem apagar leads.
alter table public.leads add column if not exists consultor text;

update public.leads
set perfil = 'outro'
where perfil = 'consultor';

alter table public.leads drop constraint if exists leads_perfil_check;

alter table public.leads
  add constraint leads_perfil_check
  check (perfil in ('sindico', 'subsindico', 'conselho', 'morador', 'administradora', 'outro'));
