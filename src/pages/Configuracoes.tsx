import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Settings, Trash2, AlertTriangle } from 'lucide-react';
import LogoSettings from '@/components/admin/LogoSettings';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Configuracoes = () => {
  const { profile } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [resetStep, setResetStep] = useState(1);

  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      // Aqui vamos chamar uma Edge Function para resetar o banco
      const response = await fetch('https://xleljhiyuhtvzjlxzawy.supabase.co/functions/v1/reset-database', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlLWRlbW8iLCJ0eXBlIjoic2VydmljZV9yb2xlIiwiYXVkIjoiYXV0aCIsImlhdCI6MTczMDQ0MjYwMCwiZXhwIjoyMDQ4NzgyMDAwfQ.M8Kk7h9L7QfXJnXQx5F3k2fB9m8oJ5hT6W3nF8kGc`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminEmail: 'admin@admin.com.br'
        })
      });

      if (response.ok) {
        alert('Banco de dados resetado com sucesso! A página será recarregada.');
        window.location.reload();
      } else {
        throw new Error('Erro ao resetar banco de dados');
      }
    } catch (error) {
      alert('Erro ao resetar banco de dados. Contate o suporte.');
      console.error(error);
    } finally {
      setIsResetting(false);
      setConfirmationText('');
      setResetStep(1);
    }
  };

  if (profile?.perfil !== 'admin') {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar as configurações do sistema.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
      </div>
      <p className="text-muted-foreground">Gerencie as configurações globais e administrativas do sistema de almoxarifado.</p>
      
      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <LogoSettings />
        
        {/* Reset Completo do Banco */}
        <div className="space-y-4">
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>⚠️ ZONA DE PERIGO - Reset Completo</AlertTitle>
            <AlertDescription>
              Esta opção irá <strong>EXCLUIR PERMANENTEMENTE</strong> todos os dados do sistema, 
              mantendo apenas o usuário admin@admin.com.br. Esta ação é <strong>IRREVERSÍVEL</strong>.
            </AlertDescription>
          </Alert>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" size="lg">
                <Trash2 className="h-4 w-4 mr-2" />
                Resetar Banco de Dados Completo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  CONFIRMAÇÃO DE RESET COMPLETO
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="font-semibold text-red-800 mb-2">⚠️ ATENÇÃO - AÇÃO IRREVERSÍVEL!</p>
                    <p className="text-sm text-red-700">
                      Você está prestes a <strong>APAGAR TODOS OS DADOS</strong> do sistema:
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm text-red-700 space-y-1">
                      <li>❌ Todos os usuários (exceto admin@admin.com.br)</li>
                      <li>❌ Todos os materiais e produtos</li>
                      <li>❌ Todas as movimentações e histórico</li>
                      <li>❌ Todas as configurações</li>
                    </ul>
                    <p className="text-sm text-red-700 mt-2">
                      <strong>NÃO HÁ COMO DESFAZER ESTA AÇÃO!</strong>
                    </p>
                  </div>

                  {resetStep === 1 && (
                    <div>
                      <p className="font-medium mb-2">Para continuar, digite <code className="bg-gray-100 px-2 py-1 rounded">RESETAR COMPLETO</code>:</p>
                      <Input
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder="Digite exatamente: RESETAR COMPLETO"
                        className="w-full"
                      />
                    </div>
                  )}

                  {resetStep === 2 && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="font-medium text-yellow-800 mb-2">🔔 ÚLTIMA CHANCE!</p>
                      <p className="text-sm text-yellow-700">
                        Clique em "Confirmar Reset" mais uma vez para executar a ação irreversível.
                      </p>
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel 
                  onClick={() => {
                    setConfirmationText('');
                    setResetStep(1);
                  }}
                >
                  Cancelar
                </AlertDialogCancel>
                {resetStep === 1 ? (
                  <AlertDialogAction
                    onClick={() => {
                      if (confirmationText === 'RESETAR COMPLETO') {
                        setResetStep(2);
                      }
                    }}
                    disabled={confirmationText !== 'RESETAR COMPLETO'}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Continuar
                  </AlertDialogAction>
                ) : (
                  <AlertDialogAction
                    onClick={handleResetDatabase}
                    disabled={isResetting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isResetting ? 'Resetando...' : '🔥 Confirmar Reset IRREVERSÍVEL'}
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;