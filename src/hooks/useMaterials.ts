import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Material } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

const MATERIALS_QUERY_KEY = ['materials'];
const MOVEMENTS_QUERY_KEY = ['movements'];
const BULK_UPDATE_FUNCTION_URL = 'https://fuqlwkhucfbhpjlmxaeu.supabase.co/functions/v1/bulk-stock-update'; // CORRIGIDO

// --- Função auxiliar para buscar organization_id do usuário logado ---
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

// --- Fetch ---
const fetchMaterials = async (): Promise<Material[]> => {
  const { data, error } = await supabase
    .from('materiais')
    .select('*')
    .order('nome', { ascending: true });

  if (error) throw new Error(error.message);
  return data as Material[];
};

export const useMaterials = () => {
  return useQuery({
    queryKey: MATERIALS_QUERY_KEY,
    queryFn: fetchMaterials,
  });
};

// --- Create/Update ---
type MaterialPayload = Omit<Material, 'id' | 'created_at' | 'updated_at' | 'quantidade_atual'> & {
  quantidade_atual?: number;
};

const createMaterial = async (material: MaterialPayload): Promise<Material> => {
  const organization_id = await getUserOrganizationId(); // INJETADO AUTOMATICAMENTE

  const { data, error } = await supabase
    .from('materiais')
    .insert({ ...material, organization_id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Material;
};

const updateMaterial = async (material: Material): Promise<Material> => {
  const organization_id = await getUserOrganizationId(); // INJETADO AUTOMATICAMENTE

  const { id, ...updates } = material;
  const { data, error } = await supabase
    .from('materiais')
    .update({ ...updates, organization_id })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Material;
};

export const useMaterialMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
      showSuccess('Material cadastrado com sucesso!');
    },
    onError: (error) => {
      showError('Erro ao cadastrar material: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
      showSuccess('Material atualizado com sucesso!');
    },
    onError: (error) => {
      showError('Erro ao atualizar material: ' + error.message);
    },
  });

  return { createMutation, updateMutation };
};

// --- Delete ---
const deleteMaterial = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('materiais')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
};

export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
      showSuccess('Material excluído com sucesso!');
    },
    onError: (error) => {
      showError('Erro ao excluir material: ' + error.message);
    },
  });
};

// --- Bulk Update ---
interface BulkItem {
  codigo: string;
  nome: string;
  unidade_medida: string;
  quantidade: number;
  descricao?: string;
  categoria?: string;
  quantidade_minima?: number;
  localizacao?: string;
}

interface BulkUpdateResponse {
  createdCount: number;
  updatedCount: number;
  errors: { item: BulkItem, message: string }[];
}

const bulkUpdateStock = async (items: BulkItem[]): Promise<BulkUpdateResponse> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) throw new Error('Usuário não autenticado.');

  const response = await fetch(BULK_UPDATE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ items }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Erro desconhecido ao processar a carga em massa.');
  }

  return result as BulkUpdateResponse;
};

export const useBulkUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkUpdateStock,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MOVEMENTS_QUERY_KEY });

      let message = `Carga em massa concluída: ${data.createdCount} novos materiais, ${data.updatedCount} estoques atualizados.`;
      if (data.errors.length > 0) {
        message += ` ${data.errors.length} itens com erro.`;
        showError(message);
      } else {
        showSuccess(message);
      }
    },
    onError: (error) => {
      showError('Falha na carga em massa: ' + error.message);
    },
  });
};