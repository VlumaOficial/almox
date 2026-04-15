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
import MaterialSearchSelect from './MaterialSearchSelect';

const userMovementSchema = z.object({
  material_id: z.string().min(1, 'O material é obrigatório.'),
  tipo: z.enum(['entrada', 'saida'], {
    required_error: 'O tipo de solicitação é obrigatório.',
  }),
  quantidade: z.coerce.number().min(1, 'A quantidade deve ser maior que zero.'),
  observacao: z.string().optional(),
});

type UserMovementFormValues = z.infer<typeof userMovementSchema>;

interface UserMovementFormProps {
  materials: Material[];
  onSubmit: (data: UserMovementFormValues) => void;
  isPending: boolean;
}

const UserMovementForm: React.FC<UserMovementFormProps> = ({ materials, onSubmit, isPending }) => {
  const form = useForm<UserMovementFormValues>({
    resolver: zodResolver(userMovementSchema),
    defaultValues: {
      material_id: '',
      tipo: 'saida',
      quantidade: 1,
      observacao: '',
    },
  });

  const handleSubmit = (values: UserMovementFormValues) => {
    onSubmit(values);
  };

  const selectedType = form.watch('tipo');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Solicitação</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="saida">Retirada (Saída de Estoque)</SelectItem>
                  <SelectItem value="entrada">Devolução/Entrada (Adicionar ao Estoque)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="material_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material</FormLabel>
              <FormControl>
                <MaterialSearchSelect
                  materials={materials}
                  value={field.value}
                  onChange={field.onChange}
                  showStock={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantidade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade Solicitada</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{selectedType === 'saida' ? 'Finalidade da Retirada' : 'Motivo da Entrada/Devolução'} (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalhes da solicitação..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando Solicitação...
            </>
          ) : (
            'Enviar Solicitação'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default UserMovementForm;