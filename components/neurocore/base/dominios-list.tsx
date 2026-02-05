'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Dominio } from '@/lib/queries/neurocore';

interface DominiosListProps {
  dominios: Dominio[];
  className?: string;
}

export function DominiosList({ dominios, className }: DominiosListProps) {
  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Domínios
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Categorias de documentos configuradas
          </p>
        </div>
        <Badge variant="info">{dominios.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Lista de domínios (somente leitura) */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {dominios.map((dominio) => (
            <div
              key={dominio.id_dominio}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-colors',
                'hover:bg-muted/50 border-border'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {dominio.nome}
                </p>
                {dominio.descricao && (
                  <p className="text-xs text-muted-foreground truncate">
                    {dominio.descricao}
                  </p>
                )}
              </div>
            </div>
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

        {/* Info */}
        <div className="p-3 bg-muted/30 border border-border rounded-lg">
          <p className="text-xs text-muted-foreground">
            Os domínios são configurados pelo administrador da plataforma.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
