'use client';

import { useRef, useState, useCallback } from 'react';
import { ImageIcon, Upload, X, AlertCircle, Loader2, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface ImageValue {
  url: string | null;
  storagePath: string | null;
}

interface ImageUploadProps {
  value: ImageValue;
  onChange: (value: ImageValue) => void;
  disabled?: boolean;
}

type UploadState = 'idle' | 'uploading' | 'error';

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imgLoadError, setImgLoadError] = useState(false);

  const hasImage = !!value.url;

  const handleFile = useCallback(
    async (file: File) => {
      setUploadState('uploading');
      setErrorMsg('');

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload/imagem', {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();

        if (!res.ok) {
          setUploadState('error');
          setErrorMsg(json.error || 'Falha ao enviar a imagem.');
          return;
        }

        setImgLoadError(false);
        setShowUrlInput(false);
        setUrlInput('');
        onChange({ url: json.url, storagePath: json.storagePath });
        setUploadState('idle');
      } catch {
        setUploadState('error');
        setErrorMsg('Erro de conexão. Verifique sua internet e tente novamente.');
      }
    },
    [onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled || uploadState === 'uploading') return;
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [disabled, uploadState, handleFile],
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleUrlApply = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:') {
        setErrorMsg('A URL deve usar HTTPS.');
        return;
      }
    } catch {
      setErrorMsg('URL inválida.');
      return;
    }
    setImgLoadError(false);
    setErrorMsg('');
    onChange({ url: trimmed, storagePath: null });
    setShowUrlInput(false);
  };

  const handleRemove = () => {
    onChange({ url: null, storagePath: null });
    setUrlInput('');
    setShowUrlInput(false);
    setImgLoadError(false);
    setErrorMsg('');
    setUploadState('idle');
  };

  // ── MODO PREVIEW ──────────────────────────────────────────────────────────
  if (hasImage) {
    return (
      <div className="space-y-1.5">
        <div className="relative group w-full h-36 rounded-lg overflow-hidden border border-border bg-muted">
          {!imgLoadError ? (
            <img
              src={value.url!}
              alt="Imagem do documento"
              className="w-full h-full object-cover"
              onError={() => setImgLoadError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
              <ImageIcon className="h-7 w-7" />
              <span className="text-xs">Não foi possível carregar a imagem</span>
            </div>
          )}

          {/* Overlay com ações */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="gap-1.5 text-xs h-7"
            >
              <Upload className="h-3 w-3" />
              Substituir
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              disabled={disabled}
              className="gap-1.5 text-xs h-7"
            >
              <X className="h-3 w-3" />
              Remover
            </Button>
          </div>

          {/* Badge indicando origem */}
          {value.storagePath && (
            <div className="absolute top-2 right-2">
              <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                Hospedada
              </span>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled}
        />
      </div>
    );
  }

  // ── MODO UPLOAD ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      {/* Área de drop */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition-colors',
          uploadState !== 'uploading' && !disabled && 'cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/40 hover:bg-muted/30',
          (disabled || uploadState === 'uploading') && 'pointer-events-none opacity-60',
        )}
        onClick={() => uploadState !== 'uploading' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {uploadState === 'uploading' ? (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Enviando imagem...</p>
          </>
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">
                Arraste ou{' '}
                <span className="text-primary underline underline-offset-2">
                  clique para selecionar
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG ou WebP · Máx. 5 MB
              </p>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled || uploadState === 'uploading'}
        />
      </div>

      {/* Mensagem de erro */}
      {(uploadState === 'error' || errorMsg) && (
        <div className="flex items-center gap-2 text-destructive text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Fallback: URL externa */}
      {!showUrlInput ? (
        <button
          type="button"
          onClick={() => {
            setShowUrlInput(true);
            setErrorMsg('');
            setUploadState('idle');
          }}
          disabled={disabled || uploadState === 'uploading'}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Link className="h-3 w-3" />
          Usar URL externa
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <Input
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="https://exemplo.com/banner.png"
            className="h-8 text-xs"
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleUrlApply();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleUrlApply}
            disabled={disabled || !urlInput.trim()}
            className="h-8 text-xs shrink-0"
          >
            Usar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowUrlInput(false);
              setUrlInput('');
              setErrorMsg('');
            }}
            disabled={disabled}
            className="h-8 w-8 p-0 shrink-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
