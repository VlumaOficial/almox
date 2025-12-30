import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Material } from '@/types';
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
const withdrawalSchema = z.object({
  material_id: z.string().min(1, 'O material é obrigatório.'),
  quantidade: z.coerce.number().min(1, 'A quantidade deve ser maior que zero.'),
  observacao: z.string().optional(),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

interface WithdrawalFormProps {
  materials: Material[];
  onSubmit: (data: WithdrawalFormValues) => void;
  isPending: boolean;
}

const WithdrawalForm: React.FC<WithdrawalFormProps> = ({ materials, onSubmit, isPending }) => {
  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      material_id: '',
      quantidade: 1,
      observacao: '',
    },
  });

  const handleSubmit = (values: WithdrawalFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                      {material.nome} ({material.codigo}) - Estoque: {material.quantidade_atual} {material.unidade_medida}
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
          name="quantidade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade Solicitada</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
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
              <FormLabel>Finalidade da Retirada (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Projeto, setor ou motivo da retirada..." {...field} />
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
            'Solicitar Retirada'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default WithdrawalForm;