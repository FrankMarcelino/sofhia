import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

// Inicializar OpenAI (adicione sua chave no .env.local)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { mensagem, agenteId } = await request.json();

    if (!mensagem || !agenteId) {
      return NextResponse.json(
        { error: 'Mensagem e agenteId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar dados do agente e base de conhecimento
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar agente
    const { data: agente, error: agenteError } = await supabase
      .from('agentes')
      .select('*, modelo:ia_modelos(*)')
      .eq('id_agente', agenteId)
      .single();

    if (agenteError || !agente) {
      return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
    }

    // Buscar documentos da base de conhecimento
    const { data: documentos } = await supabase
      .from('base_conhecimento_geral')
      .select('titulo, conteudo')
      .eq('id_empresa', agente.id_empresa)
      .limit(5); // Limitar para não exceder token limit

    // Construir contexto da base de conhecimento
    const contextoBase = documentos && documentos.length > 0
      ? documentos.map((doc: { titulo: string | null; conteudo: string }) => 
          `${doc.titulo ? `[${doc.titulo}]\n` : ''}${doc.conteudo}`
        ).join('\n\n---\n\n')
      : 'Nenhum documento na base de conhecimento ainda.';

    // Construir prompt do sistema
    const systemPrompt = `Você é ${agente.nome_agente}.

PERSONA:
${agente.persona}

TOM DE VOZ:
${agente.tom_voz}

OBJETIVO:
${agente.objetivo}

INSTRUÇÕES:
${Array.isArray(agente.instrucoes) ? agente.instrucoes.map((inst: string, idx: number) => `${idx + 1}. ${inst}`).join('\n') : 'Nenhuma instrução específica.'}

BASE DE CONHECIMENTO:
${contextoBase}

IMPORTANTE: Use as informações da base de conhecimento para responder. Se não souber algo, seja honesto e diga que não tem essa informação.`;

    // Fazer chamada para OpenAI
    const startTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: agente.id_modelo_ia || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: mensagem },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const endTime = Date.now();
    const tempoResposta = endTime - startTime;

    const resposta = completion.choices[0]?.message?.content || 'Sem resposta';
    const tokensUsados = completion.usage?.total_tokens || 0;
    const tokensInput = completion.usage?.prompt_tokens || 0;
    const tokensOutput = completion.usage?.completion_tokens || 0;

    // Calcular custo
    const custoInput = (tokensInput / 1000) * (agente.modelo?.custo_input || 0);
    const custoOutput = (tokensOutput / 1000) * (agente.modelo?.custo_output || 0);
    const custoTotal = custoInput + custoOutput;

    // Salvar uso da IA
    await supabase.from('usos_ia').insert({
      id_empresa: agente.id_empresa,
      id_agente: agenteId,
      id_modelo_ia: agente.id_modelo_ia,
      tokens_prompt: tokensInput,
      tokens_completion: tokensOutput,
      tokens_total: tokensUsados,
      custo_usd: custoTotal,
      tempo_resposta_ms: tempoResposta,
      tipo_uso: 'SIMULADOR',
    });

    return NextResponse.json({
      resposta,
      tokensUsados,
      tokensInput,
      tokensOutput,
      custoTotal,
      tempoResposta,
      modelo: agente.id_modelo_ia,
      documentosUsados: documentos?.length || 0,
    });
  } catch (error) {
    console.error('Erro na API de chat:', error);
    return NextResponse.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 }
    );
  }
}
