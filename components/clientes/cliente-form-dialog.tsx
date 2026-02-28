'use client';

import { useState, useEffect, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Bot, User, Loader2, FileText, Download, Image, File } from 'lucide-react';
import type { Pessoa } from '@/lib/queries/clientes';

interface PessoaArquivo {
  id_pessoas_arquivos: string;
  nome_arquivo: string | null;
  tipo_arquivo: string | null;
  mime_type: string | null;
  tamanho_bytes: number | null;
  created_at: string;
  storage_path: string | null;
  storage_bucket: string | null;
  dados_extraidos: Record<string, unknown> | null;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mime }: { mime: string | null }) {
  if (!mime) return <File className="h-5 w-5 text-muted-foreground" />;
  if (mime.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" aria-hidden="true" />;
  if (mime === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
  return <FileText className="h-5 w-5 text-muted-foreground" />;
}

// Chaves que já têm coluna em pessoas (tipadas/promovidas pelo trigger)
const CHAVES_TIPADAS = new Set([
  'nome_pessoa_fisica',
  'nome_pessoa_juridica',
  'email',
  'telefone',
  'cpf',
  'rg',
  'cnpj',
  'logradouro',
  'bairro',
  'cidade',
  'estado',
  'cep',
]);

interface DadoQualificacao {
  id_dado: string;
  chave: string;
  valor: string | null;
  confianca_ia: number;
  origem_dado: string;
  updated_at: string;
  agente_extracoes?: {
    informacao_para_extrair: string;
    tipo_chave_normatizada: string | null;
  } | null;
}

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  cliente?: Pessoa | null;
  onSuccess: (cliente: Pessoa) => void;
}

const EMPTY_FORM = {
  nome: '',
  telefone: '',
  email: '',
  cpf: '',
  rg: '',
  cnpj: '',
  endereco: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  observacoes: '',
};

function confiancaVariant(v: number): 'success' | 'warning' | 'error' {
  if (v >= 80) return 'success';
  if (v >= 50) return 'warning';
  return 'error';
}

function formatChave(chave: string): string {
  return chave.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ClienteFormDialog({
  open,
  onOpenChange,
  empresaId,
  cliente,
  onSuccess,
}: ClienteFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [dadosIA, setDadosIA] = useState<DadoQualificacao[]>([]);
  const [loadingIA, setLoadingIA] = useState(false);
  const [arquivos, setArquivos] = useState<PessoaArquivo[]>([]);
  const [loadingArquivos, setLoadingArquivos] = useState(false);

  const isEdit = !!cliente;

  // Preenche o formulário ao abrir
  useEffect(() => {
    if (cliente) {
      setFormData({
        nome: cliente.nome || '',
        telefone: cliente.telefone || '',
        email: cliente.email || '',
        cpf: cliente.cpf || '',
        rg: cliente.rg || '',
        cnpj: cliente.cnpj || '',
        endereco: cliente.endereco || '',
        bairro: cliente.bairro || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        cep: cliente.cep || '',
        observacoes: cliente.observacoes || '',
      });
    } else {
      setFormData(EMPTY_FORM);
      setDadosIA([]);
    }
  }, [cliente, open]);

  // Busca dados de qualificação da IA ao abrir (somente edição)
  useEffect(() => {
    if (!open || !cliente) return;

    const fetchIA = async () => {
      setLoadingIA(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('pessoas_dados_qualificacao')
          .select(`
            id_dado,
            chave,
            valor,
            confianca_ia,
            origem_dado,
            updated_at,
            agente_extracoes:id_agente_extracoes (
              informacao_para_extrair,
              tipo_chave_normatizada
            )
          `)
          .eq('id_pessoa', cliente.id_pessoa)
          .order('updated_at', { ascending: false });

        // Supabase retorna agente_extracoes como objeto único (FK → single row)
        const naoTipados = (data || []).filter((d) => {
          const ae = d.agente_extracoes as { tipo_chave_normatizada?: string | null } | null;
          const tipoNorm = ae?.tipo_chave_normatizada ?? null;
          return !tipoNorm || !CHAVES_TIPADAS.has(tipoNorm);
        });

        setDadosIA(naoTipados as unknown as DadoQualificacao[]);
      } finally {
        setLoadingIA(false);
      }
    };

    fetchIA();
  }, [open, cliente]);

  // Busca arquivos ao abrir (somente edição)
  useEffect(() => {
    if (!open || !cliente) return;

    const fetchArquivos = async () => {
      setLoadingArquivos(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('pessoas_arquivos')
          .select(`
            id_pessoas_arquivos,
            nome_arquivo,
            tipo_arquivo,
            mime_type,
            tamanho_bytes,
            created_at,
            storage_path,
            storage_bucket,
            dados_extraidos
          `)
          .eq('id_pessoa', cliente.id_pessoa)
          .order('created_at', { ascending: false });

        setArquivos((data || []) as PessoaArquivo[]);
      } finally {
        setLoadingArquivos(false);
      }
    };

    fetchArquivos();
  }, [open, cliente]);

  const handleDownload = async (arquivo: PessoaArquivo) => {
    if (!arquivo.storage_path || !arquivo.storage_bucket) return;

    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(arquivo.storage_bucket)
      .createSignedUrl(arquivo.storage_path, 60);

    if (error || !data?.signedUrl) {
      toast({ title: 'Erro ao gerar link de download.', variant: 'destructive' });
      return;
    }

    window.open(data.signedUrl, '_blank');
  };

  const field = (key: keyof typeof EMPTY_FORM) => ({
    value: formData[key],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => setFormData((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();

      const payload = {
        nome: formData.nome || null,
        telefone: formData.telefone || null,
        email: formData.email || null,
        cpf: formData.cpf || null,
        rg: formData.rg || null,
        cnpj: formData.cnpj || null,
        endereco: formData.endereco || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        cep: formData.cep || null,
        observacoes: formData.observacoes || null,
      };

      if (isEdit && cliente) {
        const { data, error } = await supabase
          .from('pessoas')
          .update(payload)
          .eq('id_pessoa', cliente.id_pessoa)
          .select()
          .single();

        if (error) throw error;

        toast({ title: 'Cliente atualizado com sucesso.' });
        onSuccess(data as Pessoa);
      } else {
        const { data, error } = await supabase
          .from('pessoas')
          .insert({ ...payload, id_empresa: empresaId })
          .select()
          .single();

        if (error) throw error;

        toast({ title: 'Cliente criado com sucesso.' });
        onSuccess(data as Pessoa);
      }

      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o cliente. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" placeholder="Nome completo" {...field('nome')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" placeholder="(00) 00000-0000" {...field('telefone')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="cliente@email.com" {...field('email')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" placeholder="000.000.000-00" {...field('cpf')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rg">RG</Label>
          <Input id="rg" placeholder="00.000.000-0" {...field('rg')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input id="cnpj" placeholder="00.000.000/0000-00" {...field('cnpj')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="endereco">Endereço</Label>
          <Input id="endereco" placeholder="Rua, número" {...field('endereco')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bairro">Bairro</Label>
          <Input id="bairro" placeholder="Bairro" {...field('bairro')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input id="cep" placeholder="00000-000" {...field('cep')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input id="cidade" placeholder="Cidade" {...field('cidade')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <Input id="estado" placeholder="UF" maxLength={2} {...field('estado')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          placeholder="Notas internas sobre este cliente..."
          rows={3}
          {...field('observacoes')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? 'Salvando...'
            : isEdit
            ? 'Salvar Alterações'
            : 'Criar Cliente'}
        </Button>
      </div>
    </form>
  );

  const qualificacaoContent = (
    <div className="space-y-2 min-h-[200px]">
      {loadingIA ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Carregando dados da IA...</span>
        </div>
      ) : dadosIA.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bot className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhum dado extra extraído pela IA para este cliente.
          </p>
        </div>
      ) : (
        dadosIA.map((dado) => (
          <div
            key={dado.id_dado}
            className="flex items-start justify-between gap-4 rounded-lg border px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                {formatChave(dado.chave)}
              </p>
              <p className="text-sm text-foreground break-words">
                {dado.valor || <span className="italic text-muted-foreground">—</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(dado.updated_at)}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge variant={confiancaVariant(dado.confianca_ia)} className="text-xs">
                {dado.confianca_ia}%
              </Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Bot className="h-3 w-3" />
                IA
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const arquivosContent = (
    <div className="space-y-2 min-h-[200px]">
      {loadingArquivos ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Carregando arquivos...</span>
        </div>
      ) : arquivos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhum arquivo enviado para este cliente.
          </p>
        </div>
      ) : (
        arquivos.map((arquivo) => (
          <div
            key={arquivo.id_pessoas_arquivos}
            className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0">
                <FileIcon mime={arquivo.mime_type} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {arquivo.nome_arquivo || 'Arquivo sem nome'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {arquivo.tipo_arquivo || arquivo.mime_type || 'Tipo desconhecido'}
                  {' · '}
                  {formatBytes(arquivo.tamanho_bytes)}
                  {' · '}
                  {formatDate(arquivo.created_at)}
                </p>
              </div>
            </div>

            {arquivo.storage_path && arquivo.storage_bucket && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleDownload(arquivo)}
                title="Baixar arquivo"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>

        {/* Sem tabs para novo cliente */}
        {!isEdit ? (
          <div className="pt-2">{formContent}</div>
        ) : (
          <Tabs defaultValue="dados" className="pt-2">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="dados" className="gap-2">
                <User className="h-3.5 w-3.5" />
                Dados
              </TabsTrigger>
              <TabsTrigger value="qualificacao" className="gap-2">
                <Bot className="h-3.5 w-3.5" />
                Qualificação IA
                {dadosIA.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5">
                    {dadosIA.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="arquivos" className="gap-2">
                <FileText className="h-3.5 w-3.5" />
                Arquivos
                {arquivos.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5">
                    {arquivos.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados">{formContent}</TabsContent>
            <TabsContent value="qualificacao">{qualificacaoContent}</TabsContent>
            <TabsContent value="arquivos">{arquivosContent}</TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
