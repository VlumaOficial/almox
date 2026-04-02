-- DEBUG: Verificar estado atual do sistema após tentativa de reset

-- 1. Verificar usuários existentes
SELECT 
    'USUÁRIOS' as tipo,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as ativos,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as excluidos
FROM profiles;

-- 2. Verificar materiais
SELECT 
    'MATERIAIS' as tipo,
    COUNT(*) as total_materiais
FROM materiais;

-- 3. Verificar movimentações
SELECT 
    'MOVIMENTAÇÕES' as tipo,
    COUNT(*) as total_movimentacoes
FROM movimentacoes;

-- 4. Verificar se admin@admin.com.br existe
SELECT 
    'ADMIN' as tipo,
    id,
    email,
    perfil,
    deleted_at
FROM profiles 
WHERE email = 'admin@admin.com.br';

-- 5. Verificar logs recentes (se houver tabela de logs)
SELECT 
    'VERIFICAÇÃO' as tipo,
    'Função reset_sequences existe?' as informacao,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reset_sequences') 
        THEN 'SIM'
        ELSE 'NÃO'
    END as status;
