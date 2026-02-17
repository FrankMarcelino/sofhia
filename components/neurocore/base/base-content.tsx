'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DominiosList } from './dominios-list';
import { DocumentosList } from './documentos-list';
import { CoberturaList } from './cobertura-list';
import type { Dominio, Documento } from '@/lib/queries/neurocore';
import type { Cobertura } from '@/lib/types/cobertura';

interface BaseContentProps {
  dominios: Dominio[];
  documentos: Documento[];
  coberturas: Cobertura[];
  empresaId: string;
}

export function BaseContent({
  dominios,
  documentos: initialDocumentos,
  coberturas,
  empresaId,
}: BaseContentProps) {
  const [selectedDominioId, setSelectedDominioId] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState(initialDocumentos);

  return (
    <Tabs defaultValue="documentos" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="documentos">Documentos</TabsTrigger>
        <TabsTrigger value="cobertura">Área de Cobertura</TabsTrigger>
      </TabsList>

      <TabsContent value="documentos">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Domínios */}
          <div className="col-span-12 lg:col-span-4">
            <DominiosList
              dominios={dominios}
              documentos={documentos}
              selectedDominioId={selectedDominioId}
              onSelectDominio={setSelectedDominioId}
            />
          </div>

          {/* Right: Documentos */}
          <div className="col-span-12 lg:col-span-8">
            <DocumentosList
              documentos={documentos}
              dominios={dominios}
              empresaId={empresaId}
              selectedDominioId={selectedDominioId}
              onDocumentosChange={setDocumentos}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="cobertura">
        <CoberturaList
          coberturas={coberturas}
          empresaId={empresaId}
        />
      </TabsContent>
    </Tabs>
  );
}
