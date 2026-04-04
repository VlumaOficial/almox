-- =====================================================
-- RECUPERAR LOGO DA EMPRESA E REMOVER DYAD
-- EXECUTAR NO SUPABASE SQL EDITOR
-- =====================================================

-- 1. Verificar arquivos no bucket de logos (sua logo pode estar lá)
SELECT 
    name,
    created_at,
    size,
    metadata
FROM storage.objects 
WHERE bucket_id = 'logos'
ORDER BY created_at DESC;

-- 2. Verificar se há configuração de logo atual
SELECT 
    chave,
    valor,
    created_at,
    updated_at
FROM configuracoes 
WHERE chave = 'logo_url';

-- 3. Verificar logs de backup (se existirem)
SELECT 
    reset_date,
    admin_email,
    usuarios_backup,
    materiais_backup,
    movimentacoes_backup,
    reset_reason
FROM backup_reset_log 
ORDER BY reset_date DESC 
LIMIT 5;

-- 4. Se sua logo estiver no bucket, vamos restaurar a configuração
-- Substitua 'sua-logo-aqui.jpg' pelo nome real da sua logo
-- Descomente e execute se encontrar sua logo:

-- INSERT INTO configuracoes (chave, valor, created_at, updated_at)
-- VALUES ('logo_url', 'sua-logo-aqui.jpg', NOW(), NOW())
-- ON CONFLICT (chave) DO UPDATE SET 
--   valor = EXCLUDED.valor,
--   updated_at = NOW();

-- 5. Remover qualquer arquivo que contenha "dyad" no nome
DELETE FROM storage.objects 
WHERE bucket_id = 'logos' 
AND (name ILIKE '%dyad%' OR name ILIKE '%Dyad%');

-- 6. Confirmação
DO $$
BEGIN
    RAISE NOTICE '✅ Análise concluída!';
    RAISE NOTICE '✅ Arquivos Dyad removidos com sucesso!';
    RAISE NOTICE '✅ Verifique os resultados acima para identificar sua logo';
    RAISE NOTICE '✅ Se encontrou sua logo, descomente a linha 4 para restaurar';
END $$;
