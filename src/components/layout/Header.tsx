import React from 'react';
import { Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface HeaderProps {
  setIsOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setIsOpen }) => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      )}
      
      <div className="flex-grow">
        {/* Espaço para título ou barra de pesquisa futura */}
      </div>

      <div className="flex items-center space-x-3">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-foreground">{profile?.nome || profile?.email}</p>
          <p className="text-xs text-muted-foreground capitalize">{profile?.perfil}</p>
        </div>
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">
            {profile?.nome ? getInitials(profile.nome) : <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};

export default Header;