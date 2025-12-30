import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, ListChecks, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    // O ProtectedRoute já lida com o estado de carregamento, mas mantemos um fallback
    return <div>Carregando dados do usuário...</div>;
  }

  if (!profile) {
    return <div>Erro ao carregar perfil.</div>;
  }

  // Conteúdo do Dashboard (será expandido nos próximos passos)
  const DashboardContent = () => {
    switch (profile.perfil) {
      case 'admin':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard Administrativo</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Materiais
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    (Funcionalidade a ser implementada)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Materiais Críticos
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Abaixo do estoque mínimo
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Solicitações Pendentes
                  </CardTitle>
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando aprovação
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Usuários Ativos
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1</div>
                  <p className="text-xs text-muted-foreground">
                    (Você é o Admin)
                  </p>
                </CardContent>
              </Card>
            </div>
            <Separator />
            <h3 className="text-xl font-semibold">Últimas Movimentações (Admin View)</h3>
            <Card className="p-4">
              <p className="text-muted-foreground">Tabela de movimentações será adicionada aqui.</p>
            </Card>
          </div>
        );
      case 'retirada':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard de Retirada</h2>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Acesso Rápido</h3>
              <p>Aqui você poderá solicitar retiradas e ver o status das suas solicitações.</p>
            </Card>
          </div>
        );
      case 'consulta':
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard de Consulta</h2>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Bem-vindo, {profile.nome || profile.email}!</h3>
              <p>Use o menu lateral para acessar a lista de materiais e o histórico de movimentações.</p>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Bem-vindo, {profile.nome || profile.email}!
      </h1>
      <p className="text-lg text-muted-foreground capitalize">
        Perfil: <span className="font-semibold text-primary">{profile.perfil}</span>
      </p>
      <Separator />
      <DashboardContent />
    </div>
  );
};

export default Index;