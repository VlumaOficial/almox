-- =====================================================
-- RESET COMPLETO DO BANCO - VERSÃO SIMPLIFICADA
-- EXECUTAR NO SUPABASE SQL EDITOR
-- MANTÉM APENAS admin@admin.com.br
-- =====================================================

-- ETAPA 1: Verificação inicial
DO $$
DECLARE
    admin_count INTEGER;
    admin_email TEXT := 'admin@admin.com.br';
BEGIN
    SELECT COUNT(*) INTO admin_count FROM profiles WHERE email = admin_email;
    
    IF admin_count = 0 THEN
        RAISE EXCEPTION 'Admin % não encontrado!', admin_email;
    END IF;
    
    RAISE NOTICE '✅ Admin encontrado: %', admin_email;
    RAISE NOTICE '⚠️ ATENÇÃO: RESET COMPLETO DO BANCO!';
    RAISE NOTICE '⚠️ Esta ação é IRREVERSÍVEL!';
END $$;

-- ETAPA 2: Backup dos dados
CREATE TABLE IF NOT EXISTS backup_reset_log (
    id SERIAL PRIMARY KEY,
    reset_date TIMESTAMP DEFAULT NOW(),
    total_usuarios INTEGER,
    total_materiais INTEGER,
    total_movimentacoes INTEGER,
    reset_reason TEXT DEFAULT 'Reset completo manual'
);

DO $$
DECLARE
    usuarios_count INTEGER;
    materiais_count INTEGER;
    movimentacoes_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO usuarios_count FROM profiles WHERE email != 'admin@admin.com.br';
    SELECT COUNT(*) INTO materiais_count FROM materiais;
    SELECT COUNT(*) INTO movimentacoes_count FROM movimentacoes;
    
    INSERT INTO backup_reset_log (total_usuarios, total_materiais, total_movimentacoes)
    VALUES (usuarios_count, materiais_count, movimentacoes_count);
    
    RAISE NOTICE '✅ Backup criado - Usuários: %, Materiais: %, Movimentações: %', 
                 usuarios_count, materiais_count, movimentacoes_count;
END $$;

-- ETAPA 3: Reset completo das tabelas públicas
DO $$
DECLARE
    admin_id UUID;  -- CORRIGIDO: era TEXT, agora UUID
    deleted_count INTEGER;
BEGIN
    -- Obter ID do admin
    SELECT id INTO admin_id FROM profiles WHERE email = 'admin@admin.com.br';
    
    -- Deletar movimentações (exceto do admin)
    DELETE FROM movimentacoes WHERE user_id != admin_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Movimentações deletadas: %', deleted_count;
    
    -- Deletar materiais
    DELETE FROM materiais;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Materiais deletados: %', deleted_count;
    
    -- Deletar usuários (exceto admin)
    DELETE FROM profiles WHERE email != 'admin@admin.com.br';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Usuários deletados: %', deleted_count;
    
    -- Resetar sequências
    PERFORM setval(pg_get_serial_sequence('materiais', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('movimentacoes', 'id'), 1, false);
    RAISE NOTICE '✅ Sequências resetadas';
    
    RAISE NOTICE '🎉 Reset das tabelas públicas concluído!';
END $$;

-- ETAPA 4: Verificação intermediária
SELECT 
    'VERIFICAÇÃO INTERMEDIÁRIA' as status,
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

-- ETAPA 5: Limpeza da tabela auth.users (autenticação Supabase)
DO $$
DECLARE
    admin_auth_id UUID;
    deleted_count INTEGER;
BEGIN
    -- Pegar o ID do admin em auth.users pelo email
    SELECT id INTO admin_auth_id FROM auth.users WHERE email = 'admin@admin.com.br';

    IF admin_auth_id IS NULL THEN
        RAISE EXCEPTION 'Admin não encontrado em auth.users!';
    END IF;

    -- Deletar sessões dos outros usuários
    DELETE FROM auth.sessions WHERE user_id != admin_auth_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Sessões deletadas: %', deleted_count;

    -- Deletar refresh tokens
    DELETE FROM auth.refresh_tokens WHERE user_id != admin_auth_id::TEXT;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Refresh tokens deletados: %', deleted_count;

    -- Deletar identidades (OAuth, magic link, etc.)
    DELETE FROM auth.identities WHERE user_id != admin_auth_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Identidades deletadas: %', deleted_count;

    -- Deletar os usuários de auth (exceto o admin)
    DELETE FROM auth.users WHERE email != 'admin@admin.com.br';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Usuários de auth deletados: %', deleted_count;

    RAISE NOTICE '🎉 auth.users limpo com sucesso!';
END $$;

-- ETAPA 6: Verificação final
SELECT 
    'VERIFICAÇÃO FINAL' as status,
    '' as separador
UNION ALL
SELECT 
    'Profiles restantes: ' || COUNT(*) as resultado,
    'Apenas admin deve permanecer' as info
FROM profiles
UNION ALL
SELECT 
    'auth.users restantes: ' || COUNT(*) as resultado,
    'Apenas admin deve permanecer' as info
FROM auth.users
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

-- ETAPA 7: Log final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RESET CONCLUÍDO COM SUCESSO ===';
    RAISE NOTICE 'Backup disponível em: backup_reset_log';
    RAISE NOTICE 'Sistema pronto para uso com apenas o admin!';
    RAISE NOTICE '';
END $$;
