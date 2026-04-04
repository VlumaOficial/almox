-- Migration: Adicionar campo updated_at na tabela movimentacoes
-- Data: 2026-04-04
-- Motivo: Corrigir erro de assinatura que precisa do campo updated_at

-- Adicionar campo updated_at na tabela movimentacoes
ALTER TABLE movimentacoes 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar trigger para atualizar automaticamente o updated_at
CREATE OR REPLACE FUNCTION update_movimentacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que atualiza updated_at em qualquer UPDATE
CREATE TRIGGER movimentacoes_updated_at_trigger
    BEFORE UPDATE ON movimentacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_movimentacoes_updated_at();

-- Adicionar comentário sobre o campo
COMMENT ON COLUMN movimentacoes.updated_at IS 'Data da última atualização da movimentação. Atualizado automaticamente.';

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_movimentacoes_updated_at ON movimentacoes(updated_at);
