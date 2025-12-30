import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Material, MovimentacaoTipo } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// Esquema de validação
const adminMovementSchema = z.object({
  material_id: z.string().min(1, 'O material é obrigatório.'),
  tipo: z.enum(['entrada', 'saida', 'ajuste', 'solicitacao_saida'], {
    required_error: 'O tipo de movimentação é obrigatório.',
  }),
  quantidade: z.coerce.number().min(1, 'A quantidade deve ser maior que zero.'),
  observacao: z.string().optional(),
});

type AdminMovementFormValues = z.infer<typeof adminMovementSchema>;

interface AdminMovementFormProps {
  materials: Material[];
  onSubmit: (data: AdminMovementFormValues) => void;
  isPending: boolean;
}

const AdminMovementForm: React.FC<AdminMovementFormProps> = ({ materials, onSubmit, isPending }) => {
  const form = useForm<AdminMovementFormValues>({
    resolver: zodResolver(adminMovementSchema),
    defaultValues: {
      material_id: '',
      tipo: 'entrada',
      quantidade: 1,
      observacao: '',
    },
  });

  const handleSubmit = (values: AdminMovementFormValues) => {
    onSubmit(values);
  };

  const selectedType = form.watch('tipo');
  const isDirectMovement = selectedType === 'entrada' || selectedType === 'ajuste';
  const isWithdrawalRequest = selectedType === 'solicitacao_saida';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="material_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o Material" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.nome} ({material.codigo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Ação</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de Movimentação" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada (Recebimento Direto)</SelectItem>
                    <SelectItem value="ajuste">Ajuste (Correção de Estoque Direta)</SelectItem>
                    <SelectItem value="solicitacao_saida">Solicitação de Retirada (Pendente)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observação (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Motivo da movimentação/solicitação..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            isWithdrawalRequest ? 'Criar Solicitação Pendente' : 'Registrar Movimentação Direta'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AdminMovementForm;