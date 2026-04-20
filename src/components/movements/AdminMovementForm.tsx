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
import { useProfiles } from '@/hooks/useProfiles';

const adminMovementSchema = z.object({
  material_id: z.string().min(1, 'O material é obrigatório.'),
  tipo: z.enum(['entrada', 'saida', 'ajuste'], {
    required_error: 'O tipo de movimentação é obrigatório.',
  }),
  ajuste_tipo: z.enum(['adicionar', 'subtrair']).optional(),
  quantidade: z.coerce.number().min(1, 'A quantidade deve ser maior que zero.'),
  responsavel_id: z.string().optional(),
  observacao: z.string().optional(),
}).refine((data) => {
  // responsavel_id obrigatório para saida e ajuste
  if (data.tipo === 'saida' || data.tipo === 'ajuste') {
    return !!data.responsavel_id && data.responsavel_id !== '';
  }
  return true;
}, {
  message: 'O responsável pela retirada é obrigatório para Saída e Ajuste.',
  path: ['responsavel_id'],
});

type AdminMovementFormValues = z.infer<typeof adminMovementSchema>;

interface AdminMovementFormProps {
  materials: Material[];
  onSubmit: (data: AdminMovementFormValues) => void;
  isPending: boolean;
}

const AdminMovementForm: React.FC<AdminMovementFormProps> = ({ materials, onSubmit, isPending }) => {
  const { data: profiles = [] } = useProfiles();

  const form = useForm<AdminMovementFormValues>({
    resolver: zodResolver(adminMovementSchema),
    defaultValues: {
      material_id: '',
      tipo: 'entrada',
      ajuste_tipo: 'adicionar',
      quantidade: 1,
      responsavel_id: '',
      observacao: '',
    },
  });

  const handleSubmit = (values: AdminMovementFormValues) => {
    onSubmit(values);
  };

  const selectedTipo = form.watch('tipo');
  const showResponsavel = selectedTipo === 'saida' || selectedTipo === 'ajuste';

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
                <FormControl>
                  <MaterialSearchSelect
                    materials={materials}
                    value={field.value}
                    onChange={field.onChange}
                    showStock={false}
                  />
                </FormControl>
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
                <Select onValueChange={(val) => {
                  field.onChange(val);
                  form.setValue('ajuste_tipo', 'adicionar');
                  form.setValue('responsavel_id', '');
                }} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de Movimentação" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada (Recebimento)</SelectItem>
                    <SelectItem value="saida">Saída (Retirada Direta)</SelectItem>
                    <SelectItem value="ajuste">Ajuste (Correção de Estoque)</SelectItem>
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
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tipo de ajuste — aparece apenas quando tipo === 'ajuste' */}
        {selectedTipo === 'ajuste' && (
          <FormField
            control={form.control}
            name="ajuste_tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Ajuste</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de ajuste" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="adicionar">➕ Adicionar ao estoque</SelectItem>
                    <SelectItem value="subtrair">➖ Subtrair do estoque</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Responsável — obrigatório para saida e ajuste */}
        {showResponsavel && (
          <FormField
            control={form.control}
            name="responsavel_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Responsável pela Retirada <span className="text-destructive">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {profiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.nome || profile.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="observacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observação (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Motivo da movimentação..." {...field} />
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
            'Registrar Movimentação'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AdminMovementForm;