import React, { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowDown, ArrowUp, RefreshCw, Package,
  CheckCircle, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ITEMS_PER_PAGE = 20;

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
  const [searchMaterial, setSearchMaterial] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return movements.filter(m => {
      const matchMaterial = searchMaterial === '' ||
        m.material.nome.toLowerCase().includes(searchMaterial.toLowerCase()) ||
        m.material.codigo.toLowerCase().includes(searchMaterial.toLowerCase());
      const matchTipo = filterTipo === '' || filterTipo === 'todos' || m.tipo === filterTipo;
      const matchDataInicio = filterDataInicio === '' ||
        new Date(m.created_at) >= new Date(filterDataInicio);
      const matchDataFim = filterDataFim === '' ||
        new Date(m.created_at) <= new Date(filterDataFim + 'T23:59:59');
      return matchMaterial && matchTipo && matchDataInicio && matchDataFim;
    });
  }, [movements, searchMaterial, filterTipo, filterDataInicio, filterDataFim]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
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

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por material ou código..."
            value={searchMaterial}
            onChange={e => handleFilterChange(setSearchMaterial)(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterTipo} onValueChange={handleFilterChange(setFilterTipo)}>
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="saida">Saída</SelectItem>
            <SelectItem value="ajuste">Ajuste</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filterDataInicio}
          onChange={e => handleFilterChange(setFilterDataInicio)(e.target.value)}
          className="w-full md:w-44"
        />
        <Input
          type="date"
          value={filterDataFim}
          onChange={e => handleFilterChange(setFilterDataFim)(e.target.value)}
          className="w-full md:w-44"
        />
        {(searchMaterial || filterTipo || filterDataInicio || filterDataFim) && (
          <Button variant="outline" onClick={() => {
            setSearchMaterial('');
            setFilterTipo('');
            setFilterDataInicio('');
            setFilterDataFim('');
            setCurrentPage(1);
          }}>
            Limpar
          </Button>
        )}
      </div>

      {/* Contador */}
      <div className="text-sm text-muted-foreground">
        {filtered.length} movimentação(ões) encontrada(s)
        {filtered.length !== movements.length && ` de ${movements.length} total`}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center p-10 border rounded-lg bg-muted/50">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Nenhuma Movimentação Encontrada</h3>
          <p className="text-muted-foreground">Tente ajustar os filtros de busca.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((movement) => {
                  const typeInfo = typeMap[movement.tipo];
                  const statusInfo = statusMap[movement.status];
                  const userName = movement.user?.display_name || movement.user?.nome || movement.user?.email || 'N/A';
                  const responsavelName = (movement as any).responsavel?.display_name || '—';
                  const formattedDate = format(new Date((movement as any).data_movimentacao || movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR });
                  const isSigned = movement.tipo === 'saida' && movement.assinatura_retirada;

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
                        <div className="text-sm">{responsavelName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant={statusInfo.variant} className="capitalize">
                            {statusInfo.label}
                          </Badge>
                          {isSigned && (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-500/90">
                              <CheckCircle className="h-3 w-3 mr-1" /> Assinado
                            </Badge>
                          )}
                        </div>
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

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} — {filtered.length} itens
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc: (number | string)[], p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`dots-${i}`} className="px-2 text-muted-foreground">...</span>
                    ) : (
                      <Button
                        key={p}
                        variant={currentPage === p ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setCurrentPage(p as number)}
                      >
                        {p}
                      </Button>
                    )
                  )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MovementTable;