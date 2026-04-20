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
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const materialSchema = z.object({
  codigo: z.string().min(1, 'O código é obrigatório.'),
  nome: z.string().min(1, 'O nome é obrigatório.'),
  descricao: z.string().optional(),
  categoria: z.string().optional(),
  unidade_medida: z.string().min(1, 'A unidade de medida é obrigatória.'),
  quantidade_minima: z.coerce.number().min(0, 'Mínimo deve ser 0 ou mais.'),
  quantidade_atual: z.coerce.number().min(0, 'Quantidade atual deve ser 0 ou mais.').optional(),
  localizacao: z.string().optional(),
  foto_url: z.string().url('URL inválida').optional().or(z.literal('')),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

interface MaterialFormProps {
  initialData?: Material;
  onSubmit: (data: MaterialFormValues) => void;
  isPending: boolean;
}

const MaterialForm: React.FC<MaterialFormProps> = ({ initialData, onSubmit, isPending }) => {
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      codigo: initialData?.codigo || '',
      nome: initialData?.nome || '',
      descricao: initialData?.descricao || '',
      categoria: initialData?.categoria || '',
      unidade_medida: initialData?.unidade_medida || '',
      quantidade_minima: initialData?.quantidade_minima ?? 0,
      quantidade_atual: initialData?.quantidade_atual ?? 0,
      localizacao: initialData?.localizacao || '',
      foto_url: initialData?.foto_url || '',
    },
  });

  const handleSubmit = (values: MaterialFormValues) => {
    const payload = {
      ...values,
      quantidade_atual: initialData ? initialData.quantidade_atual : values.quantidade_atual,
    };
    onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

        {/* Data de cadastro — apenas na edição */}
        {initialData?.created_at && (
          <div className="rounded-md border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
            📅 Cadastrado em:{' '}
            <span className="font-medium text-foreground">
              {format(new Date(initialData.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: P-1001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Material</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Parafuso M8" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalhes do material..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="unidade_medida"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade de Medida</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: UN, KG, MT" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantidade_minima"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque Mínimo</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!initialData && (
            <FormField
              control={form.control}
              name="quantidade_atual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estoque Inicial</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Ferramentas, EPIs" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="localizacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localização</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Prateleira A1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="foto_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Foto (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            initialData ? 'Salvar Alterações' : 'Cadastrar Material'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default MaterialForm;