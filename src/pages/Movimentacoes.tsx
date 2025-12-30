import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import MovementTable from '@/components/movements/MovementTable';
import { useMaterials } from '@/hooks/useMaterials';
import { useProcessMovement, useMovementsHistory, useRequestWithdrawal } from '@/hooks/useMovements';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import AdminMovementForm from '@/components/movements/AdminMovementForm';

const Movimentacoes = () => {
  const { profile } = useAuth();
  const { data: materials = [], isLoading: isLoadingMaterials } = useMaterials();
  const { data: movements = [], isLoading: isLoadingMovements } = useMovementsHistory();
  
  // Mutations
  const processMovementMutation = useProcessMovement(); // Para Entrada/Ajuste (direto)
  const requestWithdrawalMutation = useRequestWithdrawal(); // Para Solicitação de Saída (pendente)

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (profile?.perfil !== 'admin' && profile?.perfil !== 'consulta') {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar esta página.
        </AlertDescription>
      </Alert>
    );
  }

  const handleSubmit = (values: any) => {
    const { tipo, ...payload } = values;

    if (tipo === 'solicitacao_saida') {
      // Cria uma solicitação de retirada (status: pendente)
      requestWithdrawalMutation.mutate(payload, {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      });
    } else {
      // Processa movimentação direta (entrada ou ajuste)
      // Nota: O tipo 'saida' no AdminMovementForm foi substituído por 'solicitacao_saida'
      // Movimentações diretas de saída/ajuste negativo são tratadas como 'ajuste' ou 'saida' na Edge Function, mas o formulário só oferece 'entrada' e 'ajuste' para ações diretas.
      // Se o Admin precisar de uma saída direta, ele deve usar 'ajuste' com a quantidade negativa, mas o formulário só permite positivo.
      // Vamos garantir que o tipo 'saida' seja enviado para a Edge Function se for uma saída direta.
      
      // Para simplificar, vamos mapear 'ajuste' para a Edge Function, que pode ser positivo ou negativo.
      // No entanto, o AdminMovementForm só oferece 'entrada' e 'ajuste' para ações diretas.
      // Se o Admin quiser uma saída direta, ele deve usar 'ajuste' e a Edge Function deve lidar com isso.
      
      // O AdminMovementForm só oferece 'entrada' e 'ajuste' para ações diretas.
      // Se o Admin quiser uma saída direta, ele deve usar 'ajuste' e a Edge Function deve lidar com isso.
      
      // Revertendo a lógica para usar 'entrada' e 'ajuste' como tipos diretos, e 'saida' como tipo direto se for necessário.
      // O AdminMovementForm agora só oferece 'entrada', 'ajuste' e 'solicitacao_saida'.
      
      // Se for 'ajuste' ou 'entrada', usamos processMovementMutation.
      processMovementMutation.mutate({ ...payload, tipo: tipo === 'ajuste' ? 'ajuste' : 'entrada' }, {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      });
    }
  };

  // Apenas administradores podem registrar movimentações ou solicitações
  const canRegisterMovement = profile?.perfil === 'admin';
  const isPending = processMovementMutation.isPending || requestWithdrawalMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Histórico de Movimentações</h1>
        {canRegisterMovement && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Movimentação/Solicitação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Registrar Ação de Estoque</DialogTitle>
              </DialogHeader>
              {isLoadingMaterials ? (
                <div className="text-center p-4">Carregando materiais...</div>
              ) : materials.length === 0 ? (
                <Alert variant="default">
                  <AlertTitle>Nenhum Material</AlertTitle>
                  <AlertDescription>Cadastre materiais antes de registrar movimentações.</AlertDescription>
                </Alert>
              ) : (
                <AdminMovementForm
                  materials={materials}
                  onSubmit={handleSubmit}
                  isPending={isPending}
                />
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <MovementTable 
        movements={movements} 
        isLoading={isLoadingMovements} 
      />
    </div>
  );
};

export default Movimentacoes;