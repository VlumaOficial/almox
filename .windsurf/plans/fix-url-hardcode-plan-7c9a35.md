# Plano: Corrigir URL da Edge Function sem variáveis Vercel

## Problema
A URL da Edge Function está como `undefined` porque `VITE_SUPABASE_URL` não está configurada no Vercel.

## Solução
Implementar URL hardcoded diretamente no código da página Configuracoes para evitar dependência de variáveis de ambiente.

## Etapas
1. Modificar Configuracoes.tsx para usar URL hardcoded
2. Fazer commit e push
3. Testar funcionamento em produção

## Resultado Esperado
URL correta: `https://xleljhiyuhtvzjlxzawy.supabase.co/functions/v1/reset-database`
