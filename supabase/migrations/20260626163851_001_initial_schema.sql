/*
# StageHub - Schema Inicial v1.0

## Resumo
Este migration cria a estrutura completa do banco de dados para o StageHub,
plataforma de gestão de gigs para músicos brasileiros. Inclui tabelas de domínio,
tabelas transacionais, constraints de integridade, índices para performance,
e políticas de Row Level Security (RLS) para isolamento de dados por usuário.

## Tabelas Criadas

### Tabelas de Domínio (dados de referência)
- `locations` - Cidades brasileiras (população via API IBGE)
- `specialties` - Segmentos de atuação musical (5 registros fixos)
- `instruments` - Instrumentos musicais (15 registros fixos)

### Tabelas de Negócio (dados do usuário)
- `musicians` - Perfis de músicos (vinculados a auth.users)
- `musician_specialties` - Relacionamento N:N musicians ↔ specialties
- `gigs` - Gigs/contratações criadas por músicos
- `gig_invitations` - Convites enviados para gigs

## Segurança
- RLS habilitado em TODAS as tabelas de negócio
- Políticas owner-scoped: cada músico acessa apenas seus próprios dados
- Politics scoped via auth.uid() → musicians.user_id
- Tabelas de domínio: leitura pública (anon + authenticated)

## Notas Importantes
1. `musicians.user_id` tem DEFAULT auth.uid() para inserts diretos
2. Todas as tabelas têm created_at/updated_at para auditoria
3. FKs com comportamento ON DELETE definido (CASCADE/SET NULL/RESTRICT)
4. Índices criados para colunas de alta frequência de consulta
*/

-- ============================================================
-- SEÇÃO 1: TABELAS DE DOMÍNIO (dados de referência)
-- ============================================================

-- 1.1 Tabela de Localidades (Cidades)
-- Será populada posteriormente via API do IBGE
CREATE TABLE IF NOT EXISTS locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    state_uf text NOT NULL CHECK (length(state_uf) = 2),
    city_name text NOT NULL,
    ibge_code text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT locations_unique_city UNIQUE (state_uf, city_name)
);

-- Índice para busca por estado e cidade
CREATE INDEX IF NOT EXISTS idx_locations_state_uf ON locations(state_uf);
CREATE INDEX IF NOT EXISTS idx_locations_city_name ON locations(lower(city_name));

-- RLS: Localidades são públicas para leitura
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "locations_read_public" ON locations;
CREATE POLICY "locations_read_public" ON locations FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "locations_write_authenticated" ON locations;
CREATE POLICY "locations_write_authenticated" ON locations FOR INSERT
    TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "locations_update_authenticated" ON locations;
CREATE POLICY "locations_update_authenticated" ON locations FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

-- 1.2 Tabela de Especialidades (Segmentos)
-- Populada com valores fixos
CREATE TABLE IF NOT EXISTS specialties (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS: Especialidades são públicas para leitura
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "specialties_read_public" ON specialties;
CREATE POLICY "specialties_read_public" ON specialties FOR SELECT
    TO anon, authenticated USING (true);

-- 1.3 Tabela de Instrumentos
-- Populada com valores fixos
CREATE TABLE IF NOT EXISTS instruments (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS: Instrumentos são públicos para leitura
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "instruments_read_public" ON instruments;
CREATE POLICY "instruments_read_public" ON instruments FOR SELECT
    TO anon, authenticated USING (true);

-- ============================================================
-- SEÇÃO 2: TABELAS DE NEGÓCIO (dados do usuário)
-- ============================================================

-- 2.1 Tabela de Músicos
-- Vincula ao auth.users do Supabase
CREATE TABLE IF NOT EXISTS musicians (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    stage_name text,
    whatsapp text UNIQUE,
    city_id uuid REFERENCES locations(id) ON DELETE SET NULL,
    primary_instrument_id integer REFERENCES instruments(id) ON DELETE SET NULL,
    bio_url text,
    is_available boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_musicians_user_id ON musicians(user_id);
CREATE INDEX IF NOT EXISTS idx_musicians_city_id ON musicians(city_id);
CREATE INDEX IF NOT EXISTS idx_musicians_is_available ON musicians(is_available);
CREATE INDEX IF NOT EXISTS idx_musicians_whatsapp ON musicians(whatsapp);

-- RLS: Cada músico acessa apenas seu próprio registro
ALTER TABLE musicians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "musicians_select_own" ON musicians;
CREATE POLICY "musicians_select_own" ON musicians FOR SELECT
    TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "musicians_insert_own" ON musicians;
CREATE POLICY "musicians_insert_own" ON musicians FOR INSERT
    TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "musicians_update_own" ON musicians;
CREATE POLICY "musicians_update_own" ON musicians FOR UPDATE
    TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "musicians_delete_own" ON musicians;
CREATE POLICY "musicians_delete_own" ON musicians FOR DELETE
    TO authenticated USING (auth.uid() = user_id);

-- 2.2 Tabela de Especialidades por Músico (N:N)
CREATE TABLE IF NOT EXISTS musician_specialties (
    musician_id uuid NOT NULL REFERENCES musicians(id) ON DELETE CASCADE,
    specialty_id integer NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (musician_id, specialty_id)
);

-- RLS: Acesso via ownership do músico pai
ALTER TABLE musician_specialties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "musician_specialties_select_own" ON musician_specialties;
CREATE POLICY "musician_specialties_select_own" ON musician_specialties FOR SELECT
    TO authenticated USING (
        EXISTS (SELECT 1 FROM musicians WHERE musicians.id = musician_specialties.musician_id AND musicians.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "musician_specialties_insert_own" ON musician_specialties;
CREATE POLICY "musician_specialties_insert_own" ON musician_specialties FOR INSERT
    TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM musicians WHERE musicians.id = musician_specialties.musician_id AND musicians.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "musician_specialties_delete_own" ON musician_specialties;
CREATE POLICY "musician_specialties_delete_own" ON musician_specialties FOR DELETE
    TO authenticated USING (
        EXISTS (SELECT 1 FROM musicians WHERE musicians.id = musician_specialties.musician_id AND musicians.user_id = auth.uid())
    );

-- 2.3 Tabela de Gigs
CREATE TABLE IF NOT EXISTS gigs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    owner_musician_id uuid NOT NULL REFERENCES musicians(id) ON DELETE CASCADE,
    specialty_id integer REFERENCES specialties(id) ON DELETE SET NULL,
    city_id uuid REFERENCES locations(id) ON DELETE SET NULL,
    event_date date NOT NULL,
    cache_offer numeric(10,2),
    repertoire_link text,
    status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'COMPLETED')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_gigs_owner_musician_id ON gigs(owner_musician_id);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
CREATE INDEX IF NOT EXISTS idx_gigs_event_date ON gigs(event_date);
CREATE INDEX IF NOT EXISTS idx_gigs_city_id ON gigs(city_id);

-- RLS: Acesso via ownership do músico dono
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gigs_select_own" ON gigs;
CREATE POLICY "gigs_select_own" ON gigs FOR SELECT
    TO authenticated USING (
        EXISTS (SELECT 1 FROM musicians WHERE musicians.id = gigs.owner_musician_id AND musicians.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "gigs_insert_own" ON gigs;
CREATE POLICY "gigs_insert_own" ON gigs FOR INSERT
    TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM musicians WHERE musicians.id = gigs.owner_musician_id AND musicians.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "gigs_update_own" ON gigs;
CREATE POLICY "gigs_update_own" ON gigs FOR UPDATE
    TO authenticated USING (
        EXISTS (SELECT 1 FROM musicians WHERE musicians.id = gigs.owner_musician_id AND musicians.user_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM musicians WHERE musicians.id = gigs.owner_musician_id AND musicians.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "gigs_delete_own" ON gigs;
CREATE POLICY "gigs_delete_own" ON gigs FOR DELETE
    TO authenticated USING (
        EXISTS (SELECT 1 FROM musicians WHERE musicians.id = gigs.owner_musician_id AND musicians.user_id = auth.uid())
    );

-- 2.4 Tabela de Convites para Gigs
CREATE TABLE IF NOT EXISTS gig_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id uuid NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    invited_whatsapp text NOT NULL,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT gig_invitations_unique_per_gig UNIQUE (gig_id, invited_whatsapp)
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_gig_invitations_gig_id ON gig_invitations(gig_id);
CREATE INDEX IF NOT EXISTS idx_gig_invitations_invited_whatsapp ON gig_invitations(invited_whatsapp);
CREATE INDEX IF NOT EXISTS idx_gig_invitations_status ON gig_invitations(status);

-- RLS: Acesso via ownership do gig pai
ALTER TABLE gig_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gig_invitations_select_own" ON gig_invitations;
CREATE POLICY "gig_invitations_select_own" ON gig_invitations FOR SELECT
    TO authenticated USING (
        EXISTS (
            SELECT 1 FROM gigs
            JOIN musicians ON musicians.id = gigs.owner_musician_id
            WHERE gigs.id = gig_invitations.gig_id AND musicians.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "gig_invitations_insert_own" ON gig_invitations;
CREATE POLICY "gig_invitations_insert_own" ON gig_invitations FOR INSERT
    TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM gigs
            JOIN musicians ON musicians.id = gigs.owner_musician_id
            WHERE gigs.id = gig_invitations.gig_id AND musicians.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "gig_invitations_update_own" ON gig_invitations;
CREATE POLICY "gig_invitations_update_own" ON gig_invitations FOR UPDATE
    TO authenticated USING (
        EXISTS (
            SELECT 1 FROM gigs
            JOIN musicians ON musicians.id = gigs.owner_musician_id
            WHERE gigs.id = gig_invitations.gig_id AND musicians.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM gigs
            JOIN musicians ON musicians.id = gigs.owner_musician_id
            WHERE gigs.id = gig_invitations.gig_id AND musicians.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "gig_invitations_delete_own" ON gig_invitations;
CREATE POLICY "gig_invitations_delete_own" ON gig_invitations FOR DELETE
    TO authenticated USING (
        EXISTS (
            SELECT 1 FROM gigs
            JOIN musicians ON musicians.id = gigs.owner_musician_id
            WHERE gigs.id = gig_invitations.gig_id AND musicians.user_id = auth.uid()
        )
    );

-- ============================================================
-- SEÇÃO 3: TRIGGER PARA updated_at AUTOMÁTICO
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger às tabelas relevantes
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_musicians_updated_at ON musicians;
CREATE TRIGGER update_musicians_updated_at
    BEFORE UPDATE ON musicians
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gigs_updated_at ON gigs;
CREATE TRIGGER update_gigs_updated_at
    BEFORE UPDATE ON gigs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gig_invitations_updated_at ON gig_invitations;
CREATE TRIGGER update_gig_invitations_updated_at
    BEFORE UPDATE ON gig_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEÇÃO 4: DADOS INICIAIS (SEED)
-- ============================================================

-- 4.1 Inserir Especialidades (5 segmentos)
INSERT INTO specialties (id, name) OVERRIDING SYSTEM VALUE VALUES
    (1, 'Bandas de Baile/Formatura'),
    (2, 'Música Cristã/Igrejas'),
    (3, 'Casamentos/Cerimônias'),
    (4, 'Barzinho/Pubs'),
    (5, 'Sideman (Apoio Artista Nacional)')
ON CONFLICT (id) DO NOTHING;

-- Reset da sequência
SELECT setval('specialties_id_seq', 5, true);

-- 4.2 Inserir Instrumentos (15 mais populares)
INSERT INTO instruments (name) VALUES
    ('Voz'),
    ('Violão'),
    ('Guitarra'),
    ('Baixo'),
    ('Bateria'),
    ('Teclado'),
    ('Sanfona'),
    ('Percussão'),
    ('Saxofone'),
    ('Trompete'),
    ('Trombone'),
    ('Violino'),
    ('Cavaco'),
    ('Ukulele'),
    ('Gaita')
ON CONFLICT (name) DO NOTHING;