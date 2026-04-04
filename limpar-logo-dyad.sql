-- =====================================================
-- LIMPAR CONFIGURAÇÃO DE LOGO DYAD
-- EXECUTAR NO SUPABASE SQL EDITOR
-- =====================================================

-- 1. Verificar se existe configuração de logo
SELECT 
    chave,
    valor,
    created_at,
    updated_at
FROM configuracoes 
WHERE chave = 'logo_url';

-- 2. Remover configuração de logo (se existir)
DELETE FROM configuracoes 
WHERE chave = 'logo_url';

-- 3. Verificar se há arquivos no bucket de logos
SELECT 
    name,
    created_at,
    size
FROM storage.objects 
WHERE bucket_id = 'logos';

-- 4. Remover arquivos de logo do Dyad (opcional)
-- Descomente a linha abaixo se quiser remover todos os arquivos
-- DELETE FROM storage.objects WHERE bucket_id = 'logos';

RAISE NOTICE '✅ Configuração de logo removida com sucesso!';
RAISE NOTICE '✅ Sistema agora vai mostrar texto "Almoxarifado" no lugar da logo';
