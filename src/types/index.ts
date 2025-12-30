export type UserProfile = {
  id: string;
  email: string;
  nome: string;
  perfil: 'admin' | 'consulta' | 'retirada';
  assinatura_digital: string | null;
  updated_at: string;
  created_at: string;
};

export type Material = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  unidade_medida: string;
  quantidade_minima: number;
  quantidade_atual: number;
  localizacao: string | null;
  foto_url: string | null;
  created_at: string;
  updated_at: string;
};

export type MovimentacaoTipo = 'entrada' | 'saida' | 'ajuste';
export type MovimentacaoStatus = 'pendente' | 'aprovada' | 'rejeitada';

export type Movimentacao = {
  id: string;
  material_id: string;
  user_id: string;
  tipo: MovimentacaoTipo;
  quantidade: number;
  quantidade_anterior: number;
  quantidade_nova: number;
  observacao: string | null;
  assinatura_retirada: string | null;
  status: MovimentacaoStatus;
  created_at: string;
  aprovado_por: string | null;
  aprovado_at: string | null;
};

// MovementWithDetails now includes all relevant material fields for display/checks
export type MovementWithDetails = Movimentacao & {
  material: Pick<Material, 'nome' | 'codigo' | 'unidade_medida' | 'quantidade_atual'>;
  user: Pick<UserProfile, 'nome' | 'email'>;
  approver: Pick<UserProfile, 'nome' | 'email'> | null;
};