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

const EDGE_FUNCTION_URL = 'https://fuqlwkhucfbhpjlmxaeu.supabase.co/functions/v1/process-movement';

const getUserOrganizationId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (error || !profile?.organization_id) {
    throw new Error('Organização do usuário não encontrada.');
  }
  return profile.organization_id;
};

const fetchMovementsHistory = async (): Promise<MovementWithDetails[]> => {
  const { data, error } = await supabase
    .from('movimentacoes')
    .select(`
      *,
      material:material_id (nome, codigo, unidade_medida, quantidade_atual),
      user:user_id (nome, email, deleted_at),
      approver:aprovado_por (nome, email, deleted_at)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar histórico de movimentações:", error.message);
    throw new Error(error.message);
  }

  const processedData = data.map(movement => ({
    ...movement,
    user: movement.user ? {
      ...movement.user,
      display_name: movement.user.deleted_at
        ? `${movement.user.nome || movement.user.email} (excluído)`
        : movement.user.nome || movement.user.email
    } : null,
    approver: movement.approver ? {
      ...movement.approver,
      display_name: movement.approver.deleted_at
        ? `${movement.approver.nome || movement.approver.email} (excluído)`
        : movement.approver.nome || movement.approver.email
    } : null
  }));

  return processedData as MovementWithDetails[];
};

export const useMovementsHistory = () => {
  return useQuery({
    queryKey: MOVEMENTS_QUERY_KEY,
    queryFn: fetchMovementsHistory,
  });
};

const fetchMyPendingRequests = async (): Promise<MovementWithDetails[]> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Usuário não autenticado.');
  }

  const { data, error } = await supabase
    .from('movimentacoes')
    .select(`
      *,
      material:material_id (nome, codigo, unidade_medida, quantidade_atual),
      user:user_id (nome, email, deleted_at),
      approver:aprovado_por (nome, email, deleted_at)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar minhas solicitações:", error.message);
    throw new Error(error.message);
  }

  const processedData = data.map(movement => ({
    ...movement,
    user: movement.user ? {
      ...movement.user,
      display_name: movement.user.deleted_at
        ? `${movement.user.nome || movement.user.email} (excluído)`
        : movement.user.nome || movement.user.email
    } : null,
    approver: movement.approver ? {
      ...movement.approver,
      display_name: movement.approver.deleted_at
        ? `${movement.approver.nome || movement.approver.email} (excluído)`
        : movement.approver.nome || movement.approver.email
    } : null
  }));

  return processedData as MovementWithDetails[];
};

export const useMyPendingRequests = () => {
  return useQuery({
    queryKey: PENDING_REQUESTS_QUERY_KEY,
    queryFn: fetchMyPendingRequests,
  });
};

const fetchPendingRequests = async (): Promise<MovementWithDetails[]> => {
  const { data, error } = await supabase
    .from('movimentacoes')
    .select(`
      *,
      material:material_id (nome, codigo, unidade_medida, quantidade_atual),
      user:user_id (nome, email, deleted_at),
      approver:aprovado_por (nome, email, deleted_at)
    `)
    .eq('status', 'pendente')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Erro ao buscar todas as solicitações pendentes:", error.message);
    throw new Error(error.message);
  }

  const processedData = data.map(movement => ({
    ...movement,
    user: movement.user ? {
      ...movement.user,
      display_name: movement.user.deleted_at
        ? `${movement.user.nome || movement.user.email} (excluído)`
        : movement.user.nome || movement.user.email
    } : null,
    approver: movement.approver ? {
      ...movement.approver,
      display_name: movement.approver.deleted_at
        ? `${movement.approver.nome || movement.approver.email} (excluído)`
        : movement.approver.nome || movement.approver.email
    } : null
  }));

  return processedData as MovementWithDetails[];
};

export const usePendingRequests = () => {
  return useQuery({
    queryKey: PENDING_REQUESTS_QUERY_KEY,
    queryFn: fetchPendingRequests,
  });
};

interface UpdateStatusPayload {
  movementId: string;
  status: 'aprovada' | 'rejeitada';
}

const updateMovementStatus = async ({ movementId, status }: UpdateStatusPayload): Promise<Movimentacao> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Usuário não autenticado.');
  }

  const { data: movement, error: fetchError } = await supabase
    .from('movimentacoes')
    .select(`*, material:material_id (quantidade_atual)`)
    .eq('id', movementId)
    .single();

  if (fetchError || !movement) {
    throw new Error('Movimentação não encontrada.');
  }

  const material_id = movement.material_id;
  const quantidade_anterior = (movement.material as any).quantidade_atual;
  const quantidade = movement.quantidade;
  const tipo = movement.tipo;
  let quantidade_nova = quantidade_anterior;

  if (status === 'aprovada') {
    if (tipo === 'saida') {
      quantidade_nova = quantidade_anterior - quantidade;
      if (quantidade_nova < 0) {
        throw new Error(`Estoque insuficiente. Disponível: ${quantidade_anterior}. Solicitado: ${quantidade}.`);
      }
    } else if (tipo === 'entrada') {
      quantidade_nova = quantidade_anterior + quantidade;
    } else {
      throw new Error(`Tipo de movimentação (${tipo}) não suportado para aprovação pendente.`);
    }

    const { error: materialUpdateError } = await supabase
      .from('materiais')
      .update({ quantidade_atual: quantidade_nova, updated_at: new Date().toISOString() })
      .eq('id', material_id);

    if (materialUpdateError) {
      throw new Error('Erro ao atualizar estoque: ' + materialUpdateError.message);
    }
  }

  const { data, error } = await supabase
    .from('movimentacoes')
    .update({
      status: status,
      quantidade_anterior: quantidade_anterior,
      quantidade_nova: quantidade_nova,
      aprovado_por: user.id,
      aprovado_at: new Date().toISOString()
    })
    .eq('id', movementId)
    .select()
    .single();

  if (error) {
    throw new Error('Erro ao atualizar status: ' + error.message);
  }
  return data as Movimentacao;
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

interface UserRequestPayload {
  material_id: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  observacao?: string;
}

const createUserRequest = async (payload: UserRequestPayload): Promise<Movimentacao> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Usuário não autenticado.');
  }

  const organization_id = await getUserOrganizationId();

  const { data, error } = await supabase
    .from('movimentacoes')
    .insert({
      material_id: payload.material_id,
      user_id: user.id,
      tipo: payload.tipo as MovimentacaoTipo,
      quantidade: payload.quantidade,
      quantidade_anterior: 0,
      quantidade_nova: 0,
      observacao: payload.observacao,
      status: 'pendente',
      organization_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as Movimentacao;
};

export const useCreateUserRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUserRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_REQUESTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MOVEMENTS_QUERY_KEY });
      showSuccess('Solicitação enviada para aprovação!');
    },
    onError: (error) => {
      showError('Erro ao enviar solicitação: ' + error.message);
    },
  });
};

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
      user_id: session.user.id,
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
      queryClient.invalidateQueries({ queryKey: MOVEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
      showSuccess('Movimentação registrada com sucesso!');
    },
    onError: (error) => {
      showError('Erro ao registrar movimentação: ' + error.message);
    },
  });
};

interface AddSignaturePayload {
  movementId: string;
  signature: string;
}

const addSignatureToMovement = async ({ movementId, signature }: AddSignaturePayload): Promise<Movimentacao> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Usuário não autenticado.');
  }

  const { data, error } = await supabase
    .from('movimentacoes')
    .update({
      assinatura_retirada: signature,
      updated_at: new Date().toISOString()
    })
    .eq('id', movementId)
    .select()
    .single();

  if (error) {
    throw new Error('Erro ao registrar assinatura: ' + error.message);
  }
  return data as Movimentacao;
};

export const useAddSignatureToMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addSignatureToMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_REQUESTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MOVEMENTS_QUERY_KEY });
      showSuccess('Assinatura registrada com sucesso!');
    },
    onError: (error) => {
      showError('Falha ao registrar assinatura: ' + error.message);
    },
  });
};