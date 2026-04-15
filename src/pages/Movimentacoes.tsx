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
import { useProcessMovement, useMovementsHistory } from '@/hooks/useMovements';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import AdminMovementForm from '@/components/movements/AdminMovementForm';

const Movimentacoes = () => {
  const { profile } = useAuth();
  const { data: materials = [], isLoading: isLoadingMaterials } = useMaterials();
  const { data: movements = [], isLoading: isLoadingMovements } = useMovementsHistory();

  const processMovementMutation = useProcessMovement();

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
    // Envia o tipo exatamente como veio do formulário (entrada, saida ou ajuste)
    processMovementMutation.mutate({
      material_id: values.material_id,
      tipo: values.tipo,
      quantidade: values.quantidade,
      ajuste_tipo: values.ajuste_tipo,
      observacao: values.observacao,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
      },
    });
  };

  const canRegisterMovement = profile?.perfil === 'admin';
  const isPending = processMovementMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Histórico de Movimentações</h1>
        {canRegisterMovement && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Movimentação
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