import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movimentacao, MovimentacaoTipo, MovementWithDetails } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

const MOVEMENTS_QUERY_KEY = ['movements'];
const MATERIALS_QUERY_KEY = ['materials'];
const PENDING_REQUESTS_QUERY_KEY = ['pendingRequests'];

interface ProcessMovementPayload {
  material_id: string;
  tipo: MovimentacaoTipo;
  quantidade: number;
  observacao?: string;
}

// URL da Edge Function (usando o Project ID fornecido)
const EDGE_FUNCTION_URL = 'https://xleljhiyuhtvzjlxzawy.supabase.co/functions/v1/process-movement';

// --- Fetch History ---
const fetchMovementsHistory = async (): Promise<MovementWithDetails[]> => {
  const { data, error } = await supabase
    .from('movimentacoes')
    .select(`
      *,
      material:material_id (nome, codigo, unidade_medida, quantidade_atual),
      user:user_id (nome, email),
      approver:aprovado_por (nome, email)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    // Capturando a mensagem de erro completa
    console.error("Erro ao buscar histórico de movimentações:", error.message);
    throw new Error(error.message);
  }
  return data as MovementWithDetails[];
};

export const useMovementsHistory = () => {
  return useQuery({
    queryKey: MOVEMENTS_QUERY_KEY,
    queryFn: fetchMovementsHistory,
  });
};

// --- Fetch My Pending Withdrawals (User 'retirada') ---
const fetchMyPendingWithdrawals = async (): Promise<MovementWithDetails[]> => {
  // RLS policy 'movimentacoes_select_own_pending' handles filtering by user_id and status='pendente'
  const { data, error } = await supabase
    .from('movimentacoes')
    .select(`
      *,
      material:material_id (nome, codigo, unidade_medida, quantidade_atual),
      user:user_id (nome, email),
      approver:aprovado_por (nome, email)
    `)
    .eq('status', 'pendente')
    .eq('tipo', 'saida')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar minhas solicitações pendentes:", error.message);
    throw new Error(error.message);
  }
  return data as MovementWithDetails[];
};

export const useMyPendingWithdrawals = () => {
  return useQuery({
    queryKey: PENDING_REQUESTS_QUERY_KEY,
    queryFn: fetchMyPendingWithdrawals,
  });
};

// --- Fetch All Pending Requests (Admin) ---
const fetchPendingRequests = async (): Promise<MovementWithDetails[]> => {
  // RLS policy allows admins to see all pending movements
  const { data, error } = await supabase
    .from('movimentacoes')
    .select(`
      *,
      material:material_id (nome, codigo, unidade_medida, quantidade_atual),
      user:user_id (nome, email),
      approver:aprovado_por (nome, email)
    `)
    .eq('status', 'pendente')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Erro ao buscar todas as solicitações pendentes:", error.message);
    throw new Error(error.message);
  }
  return data as MovementWithDetails[];
};

export const usePendingRequests = () => {
  return useQuery({
    queryKey: PENDING_REQUESTS_QUERY_KEY,
    queryFn: fetchPendingRequests,
  });
};

// --- Update Movement Status (Approval/Rejection) ---
interface UpdateStatusPayload {
  movementId: string;
  status: 'aprovada' | 'rejeitada';
}

const updateMovementStatus = async ({ movementId, status }: UpdateStatusPayload): Promise<Movimentacao> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuário não autenticado.');
  }

  // 1. Fetch current material quantity and movement details
  // We need to fetch the material quantity again right before the transaction to ensure it's fresh.
  const { data: movement, error: fetchError } = await supabase
    .from('movimentacoes')
    .select(`
      *,
      material:material_id (quantidade_atual)
    `)
    .eq('id', movementId)
    .single();

  if (fetchError || !movement) {
    throw new Error('Movimentação não encontrada.');
  }

  const material_id = movement.material_id;
  const quantidade_anterior = (movement.material as any).quantidade_atual; // Accessing nested property
  const quantidade = movement.quantidade;
  let quantidade_nova = quantidade_anterior;

  if (status === 'aprovada') {
    // Calculate new stock for approval
    quantidade_nova = quantidade_anterior - quantidade;
    if (quantidade_nova < 0) {
      throw new Error(`Estoque insuficiente para aprovar esta retirada. Disponível: ${quantidade_anterior}. Solicitado: ${quantidade}.`);
    }
  } else {
    // If rejected, stock remains the same
    quantidade_nova = quantidade_anterior;
  }

  // 2. Update movement and material using the stored procedure (only if approved)
  if (status === 'aprovada') {
    // Use RPC to ensure atomicity of movement insertion and material update
    const { data: movementData, error: movementError } = await supabase.rpc('process_stock_movement', {
      p_material_id: material_id,
      p_user_id: movement.user_id, // Original requester
      p_tipo: movement.tipo,
      p_quantidade: quantidade,
      p_quantidade_anterior: quantidade_anterior,
      p_quantidade_nova: quantidade_nova,
      p_observacao: movement.observacao,
      p_status: status,
      p_aprovado_por: user.id,
    });

    if (movementError) {
      throw new Error(movementError.message);
    }
    return movementData[0] as Movimentacao;

  } else {
    // 3. If rejected, just update the movement status
    const { data, error } = await supabase
      .from('movimentacoes')
      .update({ 
        status: status, 
        aprovado_por: user.id, 
        aprovado_at: new Date().toISOString() 
      })
      .eq('id', movementId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data as Movimentacao;
  }
};

export const useUpdateMovementStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMovementStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PENDING_REQUESTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MOVEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
      showSuccess(`Solicitação ${variables.status === 'aprovada' ? 'aprovada' : 'rejeitada'} com sucesso!`);
    },
    onError: (error) => {
      showError('Erro ao atualizar status: ' + error.message);
    },
  });
};


// --- Request Withdrawal (User 'retirada') ---
interface WithdrawalPayload {
  material_id: string;
  quantidade: number;
  observacao?: string;
}

const requestWithdrawal = async (payload: WithdrawalPayload): Promise<Movimentacao> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Usuário não autenticado.');
  }

  // Note: quantidade_anterior and quantidade_nova are placeholders here, 
  // as the actual stock calculation happens upon approval.
  const { data, error } = await supabase
    .from('movimentacoes')
    .insert({
      material_id: payload.material_id,
      user_id: user.id,
      tipo: 'saida' as MovimentacaoTipo,
      quantidade: payload.quantidade,
      quantidade_anterior: 0, 
      quantidade_nova: 0,     
      observacao: payload.observacao,
      status: 'pendente',
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as Movimentacao;
};

export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_REQUESTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MOVEMENTS_QUERY_KEY });
      showSuccess('Solicitação de retirada enviada para aprovação!');
    },
    onError: (error) => {
      showError('Erro ao solicitar retirada: ' + error.message);
    },
  });
};


// --- Process Movement (Admin/Edge Function) ---
const processMovement = async (payload: ProcessMovementPayload): Promise<Movimentacao> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Usuário não autenticado.');
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      ...payload,
      user_id: session.user.id, // Adiciona user_id no payload para a Edge Function
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Erro desconhecido ao processar movimentação.');
  }

  return result.movement[0] as Movimentacao;
};

export const useProcessMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: processMovement,
    onSuccess: () => {
      // Invalida queries de Movimentações e Materiais para atualizar a UI
      queryClient.invalidateQueries({ queryKey: MOVEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
      showSuccess('Movimentação de estoque registrada e material atualizado com sucesso!');
    },
    onError: (error) => {
      showError('Erro ao registrar movimentação: ' + error.message);
    },
  });
};