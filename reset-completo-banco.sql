-- =====================================================
-- RESET COMPLETO DO BANCO DE DADOS - SCRIPT SEGURO
-- EXECUTAR APENAS PELO ADMINISTRADOR
-- MANTÉM APENAS admin@admin.com.br
-- =====================================================

-- INSTRUÇÕES:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Confirme cada etapa quando solicitado
-- 3. NÃO EXECUTA EM PRODUÇÃO SEM BACKUP!

-- =====================================================
-- ETAPA 1: VERIFICAÇÃO DE SEGURANÇA
-- =====================================================

-- Verificar se admin@admin.com.br existe
DO $$
DECLARE
    admin_email TEXT := 'admin@admin.com.br';
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM profiles WHERE email = admin_email;
    
    IF admin_count = 0 THEN
        RAISE EXCEPTION 'Admin % não encontrado! Verifique se o usuário existe.', admin_email;
    END IF;
    
    RAISE NOTICE '✅ Verificação de segurança aprovada para: %', admin_email;
    RAISE NOTICE '⚠️ ATENÇÃO: Você está prestes a resetar o banco de dados!';
    RAISE NOTICE '⚠️ Esta ação é IRREVERSÍVEL e apagará TODOS os dados!';
END $$;

-- =====================================================
-- ETAPA 2: BACKUP AUTOMÁTICO
-- =====================================================

-- Criar tabela de backup (se não existir)
CREATE TABLE IF NOT EXISTS backup_reset_log (
    id SERIAL PRIMARY KEY,
    reset_date TIMESTAMP DEFAULT NOW(),
    admin_email TEXT,
    usuarios_backup JSONB,
    materiais_backup JSONB,
    movimentacoes_backup JSONB,
    reset_reason TEXT DEFAULT 'Reset completo manual'
);

-- Fazer backup dos dados antes de resetar
DO $$
DECLARE
    backup_data JSONB;
    admin_email TEXT := 'admin@admin.com.br';
BEGIN
    -- Backup de usuários (exceto admin)
    backup_data := jsonb_build_object(
        'usuarios', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'email', email,
                    'nome', nome,
                    'perfil', perfil,
                    'created_at', created_at
                )
            )
            FROM profiles 
            WHERE email != admin_email
        ),
        'materiais', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'nome', nome,
                    'codigo', codigo,
                    'unidade_medida', unidade_medida,
                    'quantidade_atual', quantidade_atual,
                    'created_at', created_at
                )
            )
            FROM materiais
        ),
        'movimentacoes', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'user_id', user_id,
                    'material_id', material_id,
                    'tipo', tipo,
                    'quantidade', quantidade,
                    'status', status,
                    'created_at', created_at
                )
            )
            FROM movimentacoes
        )
    );
    
    INSERT INTO backup_reset_log (admin_email, usuarios_backup, materiais_backup, movimentacoes_backup)
    VALUES (admin_email, backup_data->'usuarios', backup_data->'materiais', backup_data->'movimentacoes');
    
    RAISE NOTICE '✅ Backup automático criado com ID: %', lastval();
END $$;

-- =====================================================
-- ETAPA 3: RESET COMPLETO (ORDEM SEGURA)
-- =====================================================

DO $$
DECLARE
    admin_id TEXT;
    admin_email TEXT := 'admin@admin.com.br';
    deleted_count INTEGER;
BEGIN
    -- Obter ID do admin
    SELECT id INTO admin_id FROM profiles WHERE email = admin_email;
    
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Admin não encontrado! Verifique o email admin@admin.com.br';
    END IF;
    
    RAISE NOTICE '🔄 Iniciando reset completo do banco...';
    
    -- 3.1 Deletar movimentações (exceto do admin)
    DELETE FROM movimentacoes WHERE user_id != admin_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Movimentações deletadas: %', deleted_count;
    
    -- 3.2 Deletar materiais
    DELETE FROM materiais;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Materiais deletados: %', deleted_count;
    
    -- 3.3 Deletar usuários (exceto admin)
    DELETE FROM profiles WHERE email != admin_email;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Usuários deletados: %', deleted_count;
    
    -- 3.4 Resetar sequências
    PERFORM setval(pg_get_serial_sequence('materiais', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('movimentacoes', 'id'), 1, false);
    RAISE NOTICE '✅ Sequências resetadas';
    
    RAISE NOTICE '🎉 Reset completo concluído com sucesso!';
END $$;

-- =====================================================
-- ETAPA 4: VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar estado final do sistema
SELECT 
    'VERIFICAÇÃO FINAL' as status,
    '' as separador
UNION ALL
SELECT 
    'Usuários restantes: ' || COUNT(*) as resultado,
    'Apenas admin deve permanecer' as info
FROM profiles
UNION ALL
SELECT 
    'Materiais restantes: ' || COUNT(*) as resultado,
    'Deve ser 0' as info
FROM materiais
UNION ALL
SELECT 
    'Movimentações restantes: ' || COUNT(*) as resultado,
    'Deve ser 0' as info
FROM movimentacoes;

-- =====================================================
-- ETAPA 5: LOG DE OPERAÇÃO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RELATÓRIO FINAL ===';
    RAISE NOTICE 'Reset completo executado em: %', NOW();
    RAISE NOTICE 'Backup disponível em: backup_reset_log';
    RAISE NOTICE 'Para restaurar, consulte o backup na tabela backup_reset_log';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ IMPORTANTE: Sistema pronto para uso com apenas o admin!';
    RAISE NOTICE '';
END $$;
