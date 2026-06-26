/*
# Adicionar Colunas de Consentimento LGPD

## Resumo
Adiciona colunas obrigatórias para rastreabilidade de consentimento LGPD
na tabela de músicos, permitindo auditoria legal dos termos aceitos.

## Tabelas Modificadas
- `musicians`
  - `consent_accepted_at` (timestamptz): Data/hora em que o usuário aceitou os termos
  - `consent_version` (text): Versão dos termos aceitos (ex: "1.0")

## Notas
1. As colunas são nullable para não afetar registros existentes
2. Frontend DEVERÁ preencher estes campos no momento do signup
3. Recomenda-se versionar os termos e atualizar consent_version a cada alteração
*/

ALTER TABLE musicians 
ADD COLUMN IF NOT EXISTS consent_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS consent_version text;