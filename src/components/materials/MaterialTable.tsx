import React, { useState, useMemo } from 'react';
import { Material } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Edit, Trash2, AlertTriangle, Package,
  Search, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDeleteMaterial } from '@/hooks/useMaterials';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ITEMS_PER_PAGE = 20;

type SortField = 'codigo' | 'nome' | 'categoria' | 'quantidade_atual' | 'quantidade_minima' | 'localizacao';
type SortDir = 'asc' | 'desc';

interface MaterialTableProps {
  materials: Material[];
  isLoading: boolean;
  onEdit: (material: Material) => void;
}

const MaterialTable: React.FC<MaterialTableProps> = ({ materials, isLoading, onEdit }) => {
  const deleteMutation = useDeleteMaterial();
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [searchNome, setSearchNome] = useState('');
  const [searchCategoria, setSearchCategoria] = useState('');
  const [searchLocalizacao, setSearchLocalizacao] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const categorias = useMemo(() => {
    return materials
      .map(m => m.categoria)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort() as string[];
  }, [materials]);

  const localizacoes = useMemo(() => {
    return materials
      .map(m => m.localizacao)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort() as string[];
  }, [materials]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3 inline text-primary" />
      : <ArrowDown className="ml-1 h-3 w-3 inline text-primary" />;
  };

  const filtered = useMemo(() => {
    let result = materials.filter(m => {
      const matchNome = searchNome === '' ||
        m.nome.toLowerCase().includes(searchNome.toLowerCase()) ||
        m.codigo.toLowerCase().includes(searchNome.toLowerCase());
      const matchCategoria = searchCategoria === '' || searchCategoria === 'todas' ||
        m.categoria === searchCategoria;
      const matchLocalizacao = searchLocalizacao === '' || searchLocalizacao === 'todas' ||
        m.localizacao === searchLocalizacao;
      return matchNome && matchCategoria && matchLocalizacao;
    });

    result = [...result].sort((a, b) => {
      let valA: any = a[sortField] ?? '';
      let valB: any = b[sortField] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [materials, searchNome, searchCategoria, searchLocalizacao, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
    setMaterialToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código..."
            value={searchNome}
            onChange={e => handleFilterChange(setSearchNome)(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={searchCategoria} onValueChange={handleFilterChange(setSearchCategoria)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categorias.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={searchLocalizacao} onValueChange={handleFilterChange(setSearchLocalizacao)}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Localização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as localizações</SelectItem>
            {localizacoes.map(loc => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contador */}
      <div className="text-sm text-muted-foreground mb-2">
        {filtered.length} material(is) encontrado(s)
        {filtered.length !== materials.length && ` de ${materials.length} total`}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center p-10 border rounded-lg bg-muted/50">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Nenhum Material Encontrado</h3>
          <p className="text-muted-foreground">Tente ajustar os filtros de busca.</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none hover:text-primary"
                  onClick={() => handleSort('codigo')}
                >
                  Código <SortIcon field="codigo" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-primary"
                  onClick={() => handleSort('nome')}
                >
                  Nome <SortIcon field="nome" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-primary"
                  onClick={() => handleSort('categoria')}
                >
                  Categoria <SortIcon field="categoria" />
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer select-none hover:text-primary"
                  onClick={() => handleSort('quantidade_atual')}
                >
                  Estoque Atual <SortIcon field="quantidade_atual" />
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer select-none hover:text-primary"
                  onClick={() => handleSort('quantidade_minima')}
                >
                  Estoque Mínimo <SortIcon field="quantidade_minima" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-primary"
                  onClick={() => handleSort('localizacao')}
                >
                  Localização <SortIcon field="localizacao" />
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((material) => {
                const isCritical = material.quantidade_atual <= material.quantidade_minima;
                return (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.codigo}</TableCell>
                    <TableCell>{material.nome}</TableCell>
                    <TableCell>{material.categoria || 'N/A'}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        {material.quantidade_atual} {material.unidade_medida}
                        {isCritical && (
                          <Badge variant="destructive" className="ml-2">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Crítico
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {material.quantidade_minima} {material.unidade_medida}
                    </TableCell>
                    <TableCell>{material.localizacao || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => onEdit(material)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setMaterialToDelete(material)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

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

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!materialToDelete} onOpenChange={() => setMaterialToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Você está prestes a excluir o material:
              <span className="font-semibold ml-1">
                {materialToDelete?.nome} ({materialToDelete?.codigo})
              </span>.
              Todas as movimentações associadas a ele serão mantidas, mas o material será removido do estoque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(materialToDelete!.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MaterialTable;