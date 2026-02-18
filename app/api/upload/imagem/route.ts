import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'documentos-imagens';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Valida os magic bytes do arquivo para garantir que o conteúdo
 * corresponde ao MIME type declarado pelo cliente.
 * Impede uploads de executáveis ou outros arquivos renomeados como imagem.
 */
function validateMagicBytes(bytes: Uint8Array, mime: string): boolean {
  switch (mime) {
    case 'image/jpeg':
      // JPEG: começa com FF D8 FF
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

    case 'image/png':
      // PNG: assinatura de 8 bytes: 89 50 4E 47 0D 0A 1A 0A
      return (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      );

    case 'image/webp':
      // WebP: RIFF....WEBP
      // bytes 0-3: 52 49 46 46 ("RIFF")
      // bytes 8-11: 57 45 42 50 ("WEBP")
      return (
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );

    default:
      return false;
  }
}

// =============================================================================
// POST /api/upload/imagem
// Recebe: multipart/form-data com campo "file"
// Retorna: { url: string, storagePath: string }
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 2. Buscar id_empresa do usuário autenticado
    const { data: usuario, error: userError } = await supabase
      .from('usuarios_sofhia')
      .select('id_empresa')
      .eq('id', user.id)
      .single();

    if (userError || !usuario) {
      return NextResponse.json(
        { error: 'Perfil de usuário não encontrado' },
        { status: 403 }
      );
    }

    // 3. Parse do FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado. Envie o campo "file" via multipart/form-data.' },
        { status: 400 }
      );
    }

    // 4. Validar tamanho
    if (file.size === 0) {
      return NextResponse.json({ error: 'Arquivo vazio' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      return NextResponse.json(
        { error: `Arquivo muito grande (${sizeMB}MB). Máximo permitido: 5MB.` },
        { status: 400 }
      );
    }

    // 5. Validar MIME type declarado pelo cliente
    const mime = file.type;
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    // 6. Ler buffer e validar magic bytes
    // Isso garante que o conteúdo real do arquivo corresponde ao tipo declarado.
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (!validateMagicBytes(bytes, mime)) {
      return NextResponse.json(
        { error: 'Conteúdo do arquivo não corresponde ao tipo declarado.' },
        { status: 400 }
      );
    }

    // 7. Gerar path único isolado por tenant
    // Estrutura: {id_empresa}/{uuid}.{ext}
    // O id_empresa no path é validado pelo RLS no bucket (Etapa 1).
    const ext = MIME_TO_EXT[mime];
    const uuid = crypto.randomUUID();
    const storagePath = `${usuario.id_empresa}/${uuid}.${ext}`;

    // 8. Upload para o Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: mime,
        upsert: false, // nunca sobrescrever — UUID garante unicidade
      });

    if (uploadError) {
      console.error('[upload/imagem] Erro no storage:', uploadError.message);
      return NextResponse.json(
        { error: 'Falha ao salvar a imagem. Tente novamente.' },
        { status: 500 }
      );
    }

    // 9. Obter URL pública permanente
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    return NextResponse.json({ url: publicUrl, storagePath }, { status: 201 });
  } catch (error) {
    console.error('[upload/imagem] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar o upload.' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/upload/imagem
// Recebe: { storagePath: string }
// Usado pelo frontend para limpar o arquivo quando o usuário cancela o form.
// =============================================================================
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 2. Ler body
    const body = await request.json().catch(() => null);
    const storagePath: unknown = body?.storagePath;

    if (!storagePath || typeof storagePath !== 'string' || storagePath.trim() === '') {
      return NextResponse.json(
        { error: 'O campo "storagePath" é obrigatório.' },
        { status: 400 }
      );
    }

    // 3. Buscar id_empresa para validação defense-in-depth
    const { data: usuario } = await supabase
      .from('usuarios_sofhia')
      .select('id_empresa')
      .eq('id', user.id)
      .single();

    if (!usuario) {
      return NextResponse.json(
        { error: 'Perfil de usuário não encontrado' },
        { status: 403 }
      );
    }

    // 4. Garantir que o path pertence ao tenant antes mesmo do RLS agir
    // Previne que um usuário tente deletar arquivos de outra empresa
    // mesmo que o RLS já bloqueie isso no storage.
    if (!storagePath.startsWith(`${usuario.id_empresa}/`)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // 5. Remover arquivo do storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath]);

    if (deleteError) {
      console.error('[upload/imagem] Erro ao deletar:', deleteError.message);
      return NextResponse.json(
        { error: 'Falha ao remover a imagem.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[upload/imagem] Erro inesperado no delete:', error);
    return NextResponse.json(
      { error: 'Erro interno ao remover a imagem.' },
      { status: 500 }
    );
  }
}
