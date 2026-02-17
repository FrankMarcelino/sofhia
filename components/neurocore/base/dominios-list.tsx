'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Dominio, Documento } from '@/lib/queries/neurocore';

interface DominiosListProps {
  dominios: Dominio[];
  documentos: Documento[];
  selectedDominioId: string | null;
  onSelectDominio: (dominioId: string | null) => void;
  className?: string;
}

export function DominiosList({
  dominios,
  documentos,
  selectedDominioId,
  onSelectDominio,
  className,
}: DominiosListProps) {
  const countByDominio = (dominioId: string) =>
    documentos.filter((d) => d.id_dominio === dominioId).length;

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Domínios
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Filtre documentos por categoria
          </p>
        </div>
        <Badge variant="info">{dominios.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {/* Opção "Todos" */}
          <button
            onClick={() => onSelectDominio(null)}
            className={cn(
              'w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left',
              selectedDominioId === null
                ? 'bg-primary/10 border-primary text-primary font-medium'
                : 'hover:bg-muted/50 border-border'
            )}
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="text-sm">Todos</span>
            </div>
            <Badge variant={selectedDominioId === null ? 'default' : 'secondary'} className="text-xs">
              {documentos.length}
            </Badge>
          </button>

          {dominios.map((dominio) => (
            <button
              key={dominio.id_dominio}
              onClick={() => onSelectDominio(dominio.id_dominio)}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left',
                selectedDominioId === dominio.id_dominio
                  ? 'bg-primary/10 border-primary text-primary font-medium'
                  : 'hover:bg-muted/50 border-border'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {dominio.nome}
                </p>
                {dominio.descricao && (
                  <p className="text-xs text-muted-foreground truncate">
                    {dominio.descricao}
                  </p>
                )}
              </div>
              <Badge
                variant={selectedDominioId === dominio.id_dominio ? 'default' : 'secondary'}
                className="text-xs ml-2 shrink-0"
              >
                {countByDominio(dominio.id_dominio)}
              </Badge>
            </button>
          ))}

          {dominios.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
              <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum domínio configurado.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Entre em contato com o administrador para configurar domínios.
              </p>
            </div>
          )}
        </div>

        <div className="p-3 bg-muted/30 border border-border rounded-lg">
          <p className="text-xs text-muted-foreground">
            Os domínios são configurados pelo administrador da plataforma.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
