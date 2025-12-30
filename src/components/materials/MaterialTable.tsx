import React, { useState } from 'react';
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
import { Edit, Trash2, AlertTriangle, Package } from 'lucide-react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface MaterialTableProps {
  materials: Material[];
  isLoading: boolean;
  onEdit: (material: Material) => void;
}

const MaterialTable: React.FC<MaterialTableProps> = ({ materials, isLoading, onEdit }) => {
  const deleteMutation = useDeleteMaterial();
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

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

  if (materials.length === 0) {
    return (
      <div className="text-center p-10 border rounded-lg bg-muted/50">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">Nenhum Material Cadastrado</h3>
        <p className="text-muted-foreground">Comece adicionando seu primeiro item de estoque.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-center">Estoque Atual</TableHead>
            <TableHead className="text-center">Estoque Mínimo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((material) => {
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
                <TableCell className="text-center">{material.quantidade_minima} {material.unidade_medida}</TableCell>
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

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!materialToDelete} onOpenChange={() => setMaterialToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Você está prestes a excluir o material: 
              <span className="font-semibold ml-1">{materialToDelete?.nome} ({materialToDelete?.codigo})</span>.
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