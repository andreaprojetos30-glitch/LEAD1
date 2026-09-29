-- Permite o perfil Consultor nos leads já existentes, sem recriar a tabela.
alter table public.leads drop constraint if exists leads_perfil_check;

alter table public.leads
  add constraint leads_perfil_check
  check (perfil in ('sindico', 'consultor', 'subsindico', 'conselho', 'morador', 'administradora', 'outro'));
