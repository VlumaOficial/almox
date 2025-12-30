import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Users,
  ListChecks,
  FileText,
  LogOut,
  Menu,
  X,
  ArrowLeftRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: ('admin' | 'consulta' | 'retirada')[];
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'consulta', 'retirada'] },
  { href: '/materiais', label: 'Materiais', icon: Package, roles: ['admin', 'consulta', 'retirada'] },
  { href: '/movimentacoes', label: 'Movimentações', icon: ArrowLeftRight, roles: ['admin', 'consulta'] },
  { href: '/solicitacoes', label: 'Solicitações', icon: ListChecks, roles: ['admin'] },
  { href: '/minhas-retiradas', label: 'Minhas Retiradas', icon: ListChecks, roles: ['retirada'] },
  { href: '/usuarios', label: 'Usuários', icon: Users, roles: ['admin'] },
  { href: '/relatorios', label: 'Relatórios', icon: FileText, roles: ['admin'] },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Erro ao fazer logout: " + error.message);
    }
  };

  const filteredNavItems = navItems.filter(item => profile && item.roles.includes(profile.perfil));

  return (
    <>
      {/* Overlay para Mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar transition-transform duration-300 ease-in-out border-r border-sidebar-border flex flex-col",
          isMobile && (isOpen ? "translate-x-0" : "-translate-x-full"),
          !isMobile && "translate-x-0",
        )}
      >
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <h1 className="text-xl font-bold text-sidebar-primary">Almoxarifado</h1>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5 text-sidebar-foreground" />
            </Button>
          )}
        </div>

        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => isMobile && setIsOpen(false)}
              className={cn(
                "flex items-center p-3 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;