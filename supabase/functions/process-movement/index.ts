import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

interface MovementPayload {
  material_id: string;
  user_id: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  ajuste_tipo?: 'adicionar' | 'subtrair'; // novo campo para ajuste
  observacao?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let supabaseClient;
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const body: MovementPayload = await req.json();
    const { material_id, tipo, quantidade, ajuste_tipo, observacao } = body;
    const user_id = user.id;

    if (!material_id || !tipo || typeof quantidade !== 'number' || quantidade <= 0) {
      return new Response(JSON.stringify({ error: 'Dados de movimentação inválidos.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Buscar quantidade atual do material
    const { data: material, error: fetchError } = await supabaseClient
      .from('materiais')
      .select('quantidade_atual')
      .eq('id', material_id)
      .single();

    if (fetchError || !material) {
      return new Response(JSON.stringify({ error: 'Material não encontrado.' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    const quantidade_anterior = material.quantidade_atual;
    let quantidade_nova = quantidade_anterior;
    const status = 'aprovada';

    // Calcular nova quantidade baseado no tipo
    if (tipo === 'entrada') {
      // Entrada sempre soma
      quantidade_nova = quantidade_anterior + quantidade;

    } else if (tipo === 'saida') {
      // Saída sempre subtrai
      quantidade_nova = quantidade_anterior - quantidade;
      if (quantidade_nova < 0) {
        return new Response(JSON.stringify({ 
          error: `Estoque insuficiente. Disponível: ${quantidade_anterior}. Solicitado: ${quantidade}.` 
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

    } else if (tipo === 'ajuste') {
      // Ajuste pode adicionar ou subtrair baseado em ajuste_tipo
      if (ajuste_tipo === 'subtrair') {
        quantidade_nova = quantidade_anterior - quantidade;
        if (quantidade_nova < 0) {
          return new Response(JSON.stringify({ 
            error: `Estoque insuficiente para ajuste. Disponível: ${quantidade_anterior}. Subtração: ${quantidade}.` 
          }), {
            status: 400,
            headers: corsHeaders,
          });
        }
      } else {
        // adicionar (default)
        quantidade_nova = quantidade_anterior + quantidade;
      }

    } else {
      return new Response(JSON.stringify({ error: 'Tipo de movimentação inválido.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Executar transação via RPC
    const { data: movementData, error: movementError } = await supabaseClient.rpc('process_stock_movement', {
      p_material_id: material_id,
      p_user_id: user_id,
      p_tipo: tipo,
      p_quantidade: quantidade,
      p_quantidade_anterior: quantidade_anterior,
      p_quantidade_nova: quantidade_nova,
      p_observacao: observacao,
      p_status: status,
      p_aprovado_por: user_id,
    });

    if (movementError) {
      console.error('Erro na transação:', movementError.message);
      return new Response(JSON.stringify({ error: 'Erro ao processar a movimentação.' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, movement: movementData }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Erro geral na Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor.' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});