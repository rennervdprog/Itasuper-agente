-- Migration: 001_init.sql
-- Descrição: Criação das tabelas centrais do Agente ItaSuper no Supabase
-- Tabelas: agent_jobs e agent_memory (com suporte a pgvector)

-- 1. Extensão para embeddings semânticos
create extension if not exists vector;

-- 2. Jobs de execução do agente
create table if not exists agent_jobs (
  id uuid primary key default gen_random_uuid(),
  repo text not null check (repo in ('ifood-style-landing', 'itasuper-app-nativo', 'itasuper-entregador')),
  user_message text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'pr_aberto', 'concluido', 'erro')),
  result_summary text,
  pr_url text,
  branch_name text,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Memória de longo prazo com busca semântica (pgvector)
create table if not exists agent_memory (
  id uuid primary key default gen_random_uuid(),
  repo text not null,
  content text not null,
  memory_type text not null check (memory_type in ('decisao', 'convencao', 'bug_resolvido', 'preferencia', 'contexto_geral')),
  embedding vector(1536),
  created_at timestamptz default now()
);

-- 4. Índice de similaridade por cosseno para busca vetorial rápida
create index if not exists idx_agent_memory_embedding on agent_memory using ivfflat (embedding vector_cosine_ops);

-- 5. Habilitar Row Level Security (RLS)
alter table agent_jobs enable row level security;
alter table agent_memory enable row level security;

-- 6. Políticas de RLS: apenas a service_role acessa (as rotas /api/* no servidor interagem com os dados)
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'agent_jobs' and policyname = 'service_role_only_jobs'
  ) then
    create policy "service_role_only_jobs" on agent_jobs for all using (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'agent_memory' and policyname = 'service_role_only_memory'
  ) then
    create policy "service_role_only_memory" on agent_memory for all using (auth.role() = 'service_role');
  end if;
end $$;
