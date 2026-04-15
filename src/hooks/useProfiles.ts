import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

const PROFILES_QUERY_KEY = ['profiles'];
const CREATE_USER_FUNCTION_URL = 'https://fuqlwkhucfbhpjlmxaeu.supabase.co/functions/v1/create-user';
const DELETE_USER_FUNCTION_URL = 'https://fuqlwkhucfbhpjlmxaeu.supabase.co/functions/v1/delete-user';
const UPDATE_PASSWORD_FUNCTION_URL = 'https://fuqlwkhucfbhpjlmxaeu.supabase.co/functions/v1/update-user-password';

// --- Fetch All Profiles ---
const fetchProfiles = async (): Promise<UserProfile[]> => {
  // Nota: Esta query depende da política RLS 'profiles_select_all' permitir que admins leiam todos os perfis.
  // Filtramos apenas usuários não excluídos para listagem normal
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .is('deleted_at', null) // Apenas usuários não excluídos
    .order('nome', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data as UserProfile[];
};

export const useProfiles = () => {
  return useQuery({
    queryKey: PROFILES_QUERY_KEY,
    queryFn: fetchProfiles,
  });
};

// --- Update Profile Role (Used for quick role change in table) ---
type UpdateProfilePayload = {
  id: string;
  perfil: UserProfile['perfil'];
};

const updateProfileRole = async ({ id, perfil }: UpdateProfilePayload): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ perfil, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as UserProfile;
};

export const useUpdateProfileRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      showSuccess('Perfil de usuário atualizado com sucesso!');
    },
    onError: (error) => {
      showError('Erro ao atualizar perfil: ' + error.message);
    },
  });
};

// --- Update Full Profile (Name and Role) ---
type UpdateFullProfilePayload = {
  id: string;
  nome: string;
  perfil: UserProfile['perfil'];
};

const updateFullProfile = async ({ id, nome, perfil }: UpdateFullProfilePayload): Promise<UserProfile> => {
  // 1. Atualizar o perfil (nome e perfil de acesso)
  const { data, error } = await supabase
    .from('profiles')
    .update({ nome, perfil, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  
  return data as UserProfile;
};

export const useUpdateFullProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFullProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      showSuccess('Dados do usuário atualizados com sucesso!');
    },
    onError: (error) => {
      showError('Erro ao atualizar dados do usuário: ' + error.message);
    },
  });
};

// --- Update User Password (Admin only) ---
interface UpdatePasswordPayload {
  userId: string;
  password: string;
}

const updateUserPassword = async (payload: UpdatePasswordPayload): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Usuário não autenticado.');
  }

  const response = await fetch(UPDATE_PASSWORD_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ userId: payload.userId, password: payload.password }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Erro desconhecido ao atualizar senha.');
  }
};

export const useUpdateUserPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserPassword,
    onSuccess: () => {
      // Não precisa invalidar perfis, apenas notificar
      showSuccess('Senha do usuário atualizada com sucesso!');
    },
    onError: (error) => {
      showError('Erro ao atualizar senha: ' + error.message);
    },
  });
};


// --- Create New User (Admin only) ---
interface CreateUserPayload {
  email: string;
  password: string;
  nome: string;
  perfil: UserProfile['perfil'];
}

const createUser = async (payload: CreateUserPayload): Promise<UserProfile> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Usuário não autenticado.');
  }

  const response = await fetch(CREATE_USER_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Erro desconhecido ao criar usuário.');
  }

  return result.user as UserProfile;
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      showSuccess('Novo usuário criado com sucesso!');
    },
    onError: (error) => {
      showError('Erro ao criar usuário: ' + error.message);
    },
  });
};

// --- Delete User (Admin only) ---
const deleteUser = async (userId: string): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Usuário não autenticado.');
  }

  const response = await fetch(DELETE_USER_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ userId }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Erro desconhecido ao excluir usuário.');
  }
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      showSuccess('Usuário excluído com sucesso!');
    },
    onError: (error) => {
      showError('Erro ao excluir usuário: ' + error.message);
    },
  });
};