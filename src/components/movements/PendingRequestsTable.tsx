import React from 'react';
import { MovementWithDetails } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, Package, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUpdateMovementStatus } from '@/hooks/useMovements';
import { Badge } from '@/components/ui/badge';
import { showError } from '@/utils/toast';

interface PendingRequestsTableProps {
  requests: MovementWithDetails[];
  isLoading: boolean;
}

const PendingRequestsTable: React.FC<PendingRequestsTableProps> = ({ requests, isLoading }) => {
  const updateStatusMutation = useUpdateMovementStatus();

  const handleApprove = (request: MovementWithDetails) => {
    const currentStock = request.material.quantidade_atual;
    if (currentStock < request.quantidade) {
      showError(`Estoque insuficiente para aprovar. Disponível: ${currentStock}. Solicitado: ${request.quantidade}.`);
      return;
    }
    updateStatusMutation.mutate({ movementId: request.id, status: 'aprovada' });
  };

  const handleReject = (requestId: string) => {
    updateStatusMutation.mutate({ movementId: requestId, status: 'rejeitada' });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center p-10 border rounded-lg bg-muted/50">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">Nenhuma Solicitação Pendente</h3>
        <p className="text-muted-foreground">Todas as retiradas foram processadas.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Solicitante</TableHead>
            <TableHead className="text-right">Qtd</TableHead>
            <TableHead>Observação</TableHead>
            <TableHead className="text-center w-[150px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const isProcessing = updateStatusMutation.isPending && updateStatusMutation.variables?.movementId === request.id;
            const currentStock = request.material.quantidade_atual;
            const isStockSufficient = currentStock >= request.quantidade;

            return (
              <TableRow key={request.id} className={!isStockSufficient ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{request.material.nome}</div>
                  <div className="text-xs text-muted-foreground">Cód: {request.material.codigo}</div>
                  {!isStockSufficient && (
                    <Badge variant="destructive" className="mt-1">
                      <Package className="h-3 w-3 mr-1" /> Estoque Baixo ({currentStock})
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{request.user?.nome || request.user?.email}</div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {request.quantidade} {request.material.unidade_medida}
                </TableCell>
                <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                  {request.observacao || 'N/A'}
                </TableCell>
                <TableCell className="text-center space-x-2">
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => handleApprove(request)}
                    disabled={isProcessing || !isStockSufficient}
                    title={!isStockSufficient ? "Estoque insuficiente" : "Aprovar Retirada"}
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleReject(request.id)}
                    disabled={isProcessing}
                    title="Rejeitar Retirada"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default PendingRequestsTable;