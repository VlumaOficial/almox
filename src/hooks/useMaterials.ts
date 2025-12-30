import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Material } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

const MATERIALS_QUERY_KEY = ['materials'];

// --- Fetch ---
const fetchMaterials = async (): Promise<Material[]> => {
  const { data, error } = await supabase
    .from('materiais')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
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
  const { data, error } = await supabase
    .from('materiais')
    .insert(material)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as Material;
};

const updateMaterial = async (material: Material): Promise<Material> => {
  const { id, ...updates } = material;
  const { data, error } = await supabase
    .from('materiais')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
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

  if (error) {
    throw new Error(error.message);
  }
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