import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, ListChecks } from 'lucide-react';
import { usePendingRequests } from '@/hooks/useMovements';
import PendingRequestsTable from '@/components/movements/PendingRequestsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Solicitacoes = () => {
  const { profile } = useAuth();
  const { data: pendingRequests = [], isLoading, error } = usePendingRequests();

  if (profile?.perfil !== 'admin') {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar a gestão de solicitações.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Aprovação de Solicitações de Retirada</h1>
      <p className="text-muted-foreground">Gerencie as solicitações de retirada de materiais pendentes.</p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold">
            Solicitações Pendentes ({pendingRequests.length})
          </CardTitle>
          <ListChecks className="h-6 w-6 text-primary" />
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Erro ao carregar solicitações</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          <PendingRequestsTable 
            requests={pendingRequests} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Solicitacoes;