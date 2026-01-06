import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
const userSchema = z.object({
  nome: z.string().min(1, 'O nome é obrigatório.'),
  email: z.string().email('Email inválido.'),
  // Tornando a senha obrigatória para garantir que o usuário possa fazer login imediatamente,
  // contornando problemas de configuração de email de convite do Supabase.
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
  perfil: z.enum(['admin', 'consulta', 'retirada'], {
    required_error: 'O perfil é obrigatório.',
  }),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  onSubmit: (data: UserFormValues) => void;
  isPending: boolean;
}

const roleMap: Record<UserProfile['perfil'], string> = {
  admin: 'Administrador',
  consulta: 'Consulta',
  retirada: 'Retirada',
};

const UserForm: React.FC<UserFormProps> = ({ onSubmit, isPending }) => {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nome: '',
      email: '',
      password: '',
      perfil: 'consulta',
    },
  });

  const handleSubmit = (values: UserFormValues) => {
    // A senha agora é obrigatória, então enviamos o payload completo.
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do Usuário" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@empresa.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Defina uma senha temporária" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="perfil"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Perfil de Acesso</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Perfil" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(roleMap).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando Usuário...
            </>
          ) : (
            'Criar Usuário'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default UserForm;