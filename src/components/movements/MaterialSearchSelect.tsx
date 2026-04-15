import React, { useState } from 'react';
import { Material } from '@/types';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface MaterialSearchSelectProps {
  materials: Material[];
  value: string;
  onChange: (value: string) => void;
  showStock?: boolean;
}

const MaterialSearchSelect: React.FC<MaterialSearchSelectProps> = ({
  materials,
  value,
  onChange,
  showStock = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = materials.find((m) => m.id === value);

  const filtered = materials.filter((m) =>
    search === '' ||
    m.nome.toLowerCase().includes(search.toLowerCase()) ||
    m.codigo.toLowerCase().includes(search.toLowerCase()) ||
    (m.categoria || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected
            ? `${selected.nome} (${selected.codigo})`
            : 'Selecione o Material'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ minWidth: '320px' }}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nome ou código..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Nenhum material encontrado.</CommandEmpty>
            <CommandGroup>
              {filtered.map((material) => (
                <CommandItem
                  key={material.id}
                  value={material.id}
                  onSelect={(val) => {
                    onChange(val === value ? '' : val);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === material.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{material.nome} ({material.codigo})</span>
                    {material.categoria && (
                      <span className="text-xs text-muted-foreground">{material.categoria}</span>
                    )}
                    {showStock && (
                      <span className="text-xs text-muted-foreground">
                        Estoque: {material.quantidade_atual} {material.unidade_medida}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MaterialSearchSelect;