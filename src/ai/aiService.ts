import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Mensagem no histórico de conversa
 */
interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

/**
 * Contexto de conversa por usuário/chat
 */
interface ConversationContext {
	chatId: string;
	messages: ChatMessage[];
	lastActivity: Date;
}

/**
 * Serviço de integração com IA (Google Gemini)
 * Gerencia conversas inteligentes quando comandos não são reconhecidos
 */
export class AIService {
	private gemini: GoogleGenerativeAI | null = null;
	private isEnabled: boolean = false;
	private conversations: Map<string, ConversationContext> = new Map();
	private readonly maxHistorySize = 10; // Mantém últimas 10 mensagens
	private readonly contextTimeout = 30 * 60 * 1000; // 30 minutos

	constructor() {
		this.initialize();
	}

	/**
	 * Inicializa o serviço de IA
	 */
	private initialize() {
		console.log('🤖 Inicializando Google Gemini...');
		this.initializeGemini();
	}

	/**
	 * Inicializa Google Gemini (GRATUITO!)
	 */
	private initializeGemini() {
		const apiKey = process.env.GEMINI_API_KEY;

		if (!apiKey || apiKey === '') {
			console.log('⚠️  Gemini desabilitado: GEMINI_API_KEY não configurada');
			console.log('💡 Obtenha uma chave GRATUITA em: https://makersuite.google.com/app/apikey');
			this.isEnabled = false;
			return;
		}

		try {
			this.gemini = new GoogleGenerativeAI(apiKey);
			this.isEnabled = true;
			console.log('✅ Google Gemini inicializado com sucesso (GRATUITO!)');
		} catch (error) {
			console.error('❌ Erro ao inicializar Gemini:', error);
			this.isEnabled = false;
		}
	}



	/**
	 * Verifica se o serviço de IA está habilitado
	 */
	public isActive(): boolean {
		return this.isEnabled;
	}

	/**
	 * Retorna o prompt de sistema que define o comportamento da IA
	 */
	private getSystemPrompt(): string {
		return `Você é um assistente virtual integrado a um bot de controle financeiro no WhatsApp.

**SEU PAPEL:**
- Você conversa naturalmente com o usuário quando ele NÃO está usando comandos financeiros
- Seja amigável, prestativo e conciso nas respostas
- Use emojis quando apropriado para deixar a conversa mais leve
- Mantenha respostas curtas (máx. 3-4 linhas no WhatsApp)

**CONTEXTO DO BOT:**
O bot principal registra transações financeiras em uma planilha Google Sheets com comandos como:
- "entrada 200" - Registra uma entrada
- "saida 50" - Registra uma saída
- "diario 87,10" - Registra gasto diário
- "saldo" - Mostra resumo do dia
- "mes" - Mostra resumo do mês
- "ajuda" - Lista comandos disponíveis

**QUANDO O USUÁRIO FALAR COM VOCÊ:**
- Se ele perguntar sobre finanças ou quiser registrar algo, explique gentilmente como usar os comandos
- Se for apenas conversa casual ("oi", "como vai"), responda naturalmente
- Se pedir ajuda financeira, dê dicas gerais mas sugira usar os comandos do bot
- NUNCA tente executar comandos financeiros - você apenas conversa

**TOM DE VOZ:**
Amigável, informal mas respeitoso. Pense como um assistente prestativo do WhatsApp.

**EXEMPLOS:**
Usuário: "oi"
Você: "Oi! 😊 Tudo bem? Estou aqui pra te ajudar com suas finanças ou bater um papo! Como posso ajudar?"

Usuário: "gastei 432 reais hoje"
Você: "Entendi que você gastou R$ 432 hoje! Para registrar isso, use: \n\n💸 saida 432\n\nou\n\n🍽️ diario 432\n\nDepende se é uma saída específica ou gasto diário. Digite 'ajuda' pra ver todos os comandos! ✨"

Usuário: "como economizar dinheiro?"
Você: "Ótima pergunta! 💰 Algumas dicas rápidas:\n\n✓ Registre TODOS os gastos (use o comando 'diario')\n✓ Confira o 'resumo mes' regularmente\n✓ Use 'performance' pra ver se está economizando\n\nQuer saber como usar esses comandos? Digite 'ajuda'!"`;
	}

	/**
	 * Obtém ou cria contexto de conversa para um chat
	 */
	private getConversationContext(chatId: string): ConversationContext {
		let context = this.conversations.get(chatId);

		// Se não existe ou expirou, cria novo
		if (!context || Date.now() - context.lastActivity.getTime() > this.contextTimeout) {
			context = {
				chatId,
				messages: [
					{
						role: 'system',
						content: this.getSystemPrompt(),
					},
				],
				lastActivity: new Date(),
			};
			this.conversations.set(chatId, context);
		}

		return context;
	}

	/**
	 * Adiciona mensagem ao histórico
	 */
	private addToHistory(chatId: string, role: 'user' | 'assistant', content: string) {
		const context = this.getConversationContext(chatId);

		// Adiciona mensagem
		context.messages.push({ role, content });
		context.lastActivity = new Date();

		// Mantém apenas últimas N mensagens (além do system prompt)
		if (context.messages.length > this.maxHistorySize + 1) {
			// +1 por causa do system prompt
			context.messages = [
				context.messages[0], // Mantém system prompt
				...context.messages.slice(-(this.maxHistorySize)),
			];
		}

		this.conversations.set(chatId, context);
	}

	/**
	 * Limpa histórico de conversa de um chat
	 */
	public clearHistory(chatId: string) {
		this.conversations.delete(chatId);
	}

	/**
	 * Limpa históricos antigos (mais de 30 minutos inativos)
	 */
	private cleanupOldConversations() {
		const now = Date.now();
		for (const [chatId, context] of this.conversations.entries()) {
			if (now - context.lastActivity.getTime() > this.contextTimeout) {
				this.conversations.delete(chatId);
			}
		}
	}

	/**
	 * Gera resposta usando a IA
	 */
	async generateResponse(message: string, chatId: string = 'default'): Promise<string> {
		// Se IA não está habilitada, retorna mensagem padrão
		if (!this.isActive()) {
			return `⚠️ Comando não reconhecido.

💡 Digite "ajuda" para ver os
   comandos disponíveis.`;
		}

		try {
			// Limpa conversas antigas periodicamente
			this.cleanupOldConversations();

			// Obtém contexto da conversa
			const context = this.getConversationContext(chatId);

			// Adiciona mensagem do usuário ao histórico
			this.addToHistory(chatId, 'user', message);

			// Chama o Gemini
			const aiResponse = await this.callGemini(context.messages);

			// Adiciona resposta da IA ao histórico
			this.addToHistory(chatId, 'assistant', aiResponse);

			return aiResponse;
		} catch (error: any) {
			console.error('❌ Erro ao gerar resposta da IA:', error);

			// Erros específicos
			if (error?.status === 401) {
				return `⚠️ Erro de autenticação da IA.

Verifique a OPENAI_API_KEY.

💡 Digite "ajuda" para ver
   comandos disponíveis.`;
			}

			if (error?.status === 429) {
				return `⚠️ Limite de uso da IA atingido.

Tente novamente em alguns
instantes.

💡 Digite "ajuda" para ver
   comandos disponíveis.`;
			}

			// Erro genérico
			return `⚠️ Comando não reconhecido.

💡 Digite "ajuda" para ver os
   comandos disponíveis.`;
		}
	}

	/**
	 * Chama Google Gemini API (GRATUITO!)
	 */
	private async callGemini(messages: ChatMessage[]): Promise<string> {
		if (!this.gemini) throw new Error('Gemini não inicializado');

		const model = this.gemini.getGenerativeModel({
			model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
		});

		// Gemini não usa system prompt da mesma forma
		// Vamos adicionar o system prompt como primeira mensagem do usuário
		const systemPrompt = messages.find((m) => m.role === 'system')?.content || '';
		const userMessages = messages.filter((m) => m.role !== 'system');

		// Monta histórico para Gemini
		const history = userMessages.slice(0, -1).map((msg) => ({
			role: msg.role === 'user' ? 'user' : 'model',
			parts: [{ text: msg.content }],
		}));

		// Última mensagem
		const lastMessage = userMessages[userMessages.length - 1]?.content || '';

		// Inicia chat
		const chat = model.startChat({
			history: [
				{ role: 'user', parts: [{ text: systemPrompt }] },
				{ role: 'model', parts: [{ text: 'Entendido! Estou pronto para ajudar.' }] },
				...history,
			],
		});

		const result = await chat.sendMessage(lastMessage);
		return result.response.text() || 'Desculpe, não consegui gerar uma resposta.';
	}



	/**
	 * Reseta todas as conversas (útil para testes)
	 */
	public resetAllConversations() {
		this.conversations.clear();
	}

	/**
	 * Retorna estatísticas de uso
	 */
	public getStats() {
		return {
			isEnabled: this.isEnabled,
			provider: 'gemini',
			activeConversations: this.conversations.size,
			model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
		};
	}
}
