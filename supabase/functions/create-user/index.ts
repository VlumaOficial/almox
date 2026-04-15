import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

interface CreateUserPayload {
  email: string;
  password?: string;
  nome: string;
  perfil: 'admin' | 'consulta' | 'retirada';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Autenticação do Admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("[create-user] Unauthorized: Missing Authorization header");
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: callingUser } } = await userClient.auth.getUser();
    if (!callingUser) {
      console.error("[create-user] Unauthorized: Invalid token");
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // 2. Verificar se é Admin e buscar organization_id
    const { data: adminProfile, error: profileError } = await userClient
      .from('profiles')
      .select('perfil, organization_id')
      .eq('id', callingUser.id)
      .single();

    if (profileError || adminProfile?.perfil !== 'admin') {
      console.error("[create-user] Forbidden: Only administrators can create users.");
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can create users.' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const organization_id = adminProfile.organization_id;
    if (!organization_id) {
      console.error("[create-user] Admin sem organization_id.");
      return new Response(JSON.stringify({ error: 'Organização do administrador não encontrada.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 3. Processar Payload
    const body: CreateUserPayload = await req.json();
    const { email, password, nome, perfil } = body;

    if (!email || !nome || !perfil) {
      console.error("[create-user] Dados obrigatórios ausentes.");
      return new Response(JSON.stringify({ error: 'Dados obrigatórios (email, nome, perfil) ausentes.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 4. Criar Cliente com Service Role Key
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let newUser;
    let authError;

    if (password) {
      // Criação direta com senha
      console.log(`[create-user] Creating user directly for ${email}`);
      const result = await serviceRoleClient.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          nome: nome,
          organization_id: organization_id, // INJETADO AUTOMATICAMENTE
        },
      });
      newUser = result.data;
      authError = result.error;
    } else {
      // Convite por email
      console.log(`[create-user] Inviting user by email for ${email}`);
      const result = await serviceRoleClient.auth.admin.inviteUserByEmail(email, {
        data: {
          nome: nome,
          organization_id: organization_id, // INJETADO AUTOMATICAMENTE
        },
        redirectTo: Deno.env.get('SUPABASE_URL'),
      });
      newUser = result.data;
      authError = result.error;
    }

    if (authError) {
      console.error('[create-user] Erro ao criar/convidar usuário no Auth:', authError.message);
      return new Response(JSON.stringify({ error: 'Erro ao criar/convidar usuário: ' + authError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const userId = newUser.user.id;

    // 5. Atualizar perfil de acesso
    const { data: updatedProfile, error: profileUpdateError } = await serviceRoleClient
      .from('profiles')
      .update({ 
        perfil: perfil,
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId)
      .select()
      .single();

    if (profileUpdateError) {
      console.error('[create-user] Erro ao atualizar perfil:', profileUpdateError.message);
      return new Response(JSON.stringify({ 
        error: 'Usuário criado, mas erro ao definir perfil: ' + profileUpdateError.message 
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, user: updatedProfile }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('[create-user] Erro geral na Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor.' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});