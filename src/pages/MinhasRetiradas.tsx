import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListChecks, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useMaterials } from '@/hooks/useMaterials';
import { useRequestWithdrawal, useMyPendingWithdrawals } from '@/hooks/useMovements';
import WithdrawalForm from '@/components/movements/WithdrawalForm';
import MovementTable from '@/components/movements/MovementTable';
import { Separator } from '@/components/ui/separator';

const MinhasRetiradas = () => {
  const { profile } = useAuth();
  const { data: materials = [], isLoading: isLoadingMaterials } = useMaterials();
  const { data: pendingRequests = [], isLoading: isLoadingPending } = useMyPendingWithdrawals();
  const requestWithdrawalMutation = useRequestWithdrawal();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (profile?.perfil !== 'retirada') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar esta página.
        </AlertDescription>
      </Alert>
    );
  }

  const handleSubmit = (values: any) => {
    requestWithdrawalMutation.mutate(values, {
      onSuccess: () => {
        setIsDialogOpen(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Minhas Solicitações de Retirada</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Solicitar Retirada de Material</DialogTitle>
            </DialogHeader>
            {isLoadingMaterials ? (
              <div className="text-center p-4">Carregando materiais...</div>
            ) : materials.length === 0 ? (
              <Alert variant="default">
                <AlertTitle>Nenhum Material</AlertTitle>
                <AlertDescription>Nenhum material disponível para retirada.</AlertDescription>
              </Alert>
            ) : (
              <WithdrawalForm
                materials={materials}
                onSubmit={handleSubmit}
                isPending={requestWithdrawalMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold">
            Solicitações Pendentes ({pendingRequests.length})
          </CardTitle>
          <ListChecks className="h-6 w-6 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Acompanhe o status das suas solicitações que aguardam aprovação.
          </p>
          <MovementTable 
            movements={pendingRequests} 
            isLoading={isLoadingPending} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MinhasRetiradas;