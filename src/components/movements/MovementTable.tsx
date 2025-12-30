import React from 'react';
import { MovementWithDetails, MovimentacaoTipo, MovimentacaoStatus } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDown, ArrowUp, RefreshCw, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MovementTableProps {
  movements: MovementWithDetails[];
  isLoading: boolean;
}

const typeMap: Record<MovimentacaoTipo, { label: string; icon: React.ElementType; color: string }> = {
  entrada: { label: 'Entrada', icon: ArrowUp, color: 'bg-green-100 text-green-800' },
  saida: { label: 'Saída', icon: ArrowDown, color: 'bg-red-100 text-red-800' },
  ajuste: { label: 'Ajuste', icon: RefreshCw, color: 'bg-blue-100 text-blue-800' },
};

const statusMap: Record<MovimentacaoStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  aprovada: { label: 'Aprovada', variant: 'default' },
  pendente: { label: 'Pendente', variant: 'secondary' },
  rejeitada: { label: 'Rejeitada', variant: 'destructive' },
};

const MovementTable: React.FC<MovementTableProps> = ({ movements, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="text-center p-10 border rounded-lg bg-muted/50">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">Nenhuma Movimentação Encontrada</h3>
        <p className="text-muted-foreground">O histórico de estoque está vazio.</p>
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
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Qtd</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Observação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => {
            const typeInfo = typeMap[movement.tipo];
            const statusInfo = statusMap[movement.status];
            const userName = movement.user?.nome || movement.user?.email || 'Usuário Desconhecido';
            const formattedDate = format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR });

            return (
              <TableRow key={movement.id}>
                <TableCell className="text-xs text-muted-foreground">{formattedDate}</TableCell>
                <TableCell>
                  <div className="font-medium">{movement.material.nome}</div>
                  <div className="text-xs text-muted-foreground">{movement.material.codigo}</div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", typeInfo.color)}>
                    <typeInfo.icon className="h-3 w-3 mr-1" />
                    {typeInfo.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {movement.quantidade} {movement.material.unidade_medida}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{userName}</div>
                  {movement.aprovado_por && (
                    <div className="text-xs text-muted-foreground">
                      Aprovado por: {movement.approver?.nome || movement.approver?.email || 'N/A'}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusInfo.variant} className="capitalize">
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                  {movement.observacao || 'N/A'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default MovementTable;