import { WhatsAppBot } from './bot/whatsapp';
import { MessageHandler } from './bot/messageHandler';
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

/**
 * Intercepta e filtra erros conhecidos do console
 */
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
	const message = args.join(' ');
	
	// Suprime erros conhecidos de criptografia do WhatsApp
	if (
		message.includes('Bad MAC') ||
		message.includes('Failed to decrypt') ||
		message.includes('Session error') ||
		message.includes('Closing session') ||
		message.includes('verifyMAC') ||
		message.includes('doDecryptWhisperMessage') ||
		message.includes('SessionCipher') ||
		message.includes('libsignal')
	) {
		return; // Não imprime
	}
	
	// Outros erros são impressos normalmente
	originalConsoleError.apply(console, args);
};

// Intercepta stderr para suprimir erros da biblioteca
const originalStderrWrite = process.stderr.write.bind(process.stderr);
(process.stderr.write as any) = (chunk: any, encoding?: any, callback?: any) => {
	const message = chunk.toString();
	
	// Suprime erros conhecidos
	if (
		message.includes('Bad MAC') ||
		message.includes('Failed to decrypt') ||
		message.includes('Session error') ||
		message.includes('Closing session') ||
		message.includes('verifyMAC') ||
		message.includes('doDecryptWhisperMessage') ||
		message.includes('SessionCipher') ||
		message.includes('libsignal')
	) {
		return true;
	}
	
	return originalStderrWrite(chunk, encoding, callback);
};

/**
 * Ponto de entrada da aplicação
 */
async function main() {
	console.log('🚀 Iniciando Finance WhatsApp Bot...\n');

	// Valida variáveis de ambiente
	const requiredEnvVars = [
		'GOOGLE_PROJECT_ID',
		'GOOGLE_CLIENT_EMAIL',
		'GOOGLE_PRIVATE_KEY',
		'SHEET_ID',
		'BOT_PHONE_NUMBER',
		'ALLOWED_CHATS',
	];

	// Verifica filtro de grupos
	const allowedChats =
		process.env.ALLOWED_CHATS?.split(',')
			.map((c) => c.trim())
			.filter((c) => c) || [];
	if (allowedChats.length > 0) {
		console.log('⚠️  Bot só responderá em chats autorizados:');
		console.log('═══════════════════════════════════════════════════');
		allowedChats.forEach((chat) => {
			const label = chat.endsWith('@g.us') ? '📱 Grupo' : '👤 Contato';
			console.log(`   ${label}: ${chat}`);
		});
	} else {
		console.log(
			'⚠️  ATENÇÃO: Nenhum chat configurado. Configure algum chat para o BOT funcionar corretamente.'
		);
		throw new Error('Nenhum chat autorizado configurado em ALLOWED_CHATS');
	}

	const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

	if (missingVars.length > 0) {
		console.error('❌ Variáveis de ambiente faltando:');
		missingVars.forEach((varName) => console.error(`   - ${varName}`));
		console.error('\nCrie um arquivo .env baseado no .env.example');
		process.exit(1);
	}

	try {
		// Cria instâncias
		const bot = new WhatsAppBot();
		const messageHandler = new MessageHandler();

		// Define handler de mensagens
		const onMessage = async (from: string, message: string) => {
			console.log(`\n📨 Processando mensagem de ${from}`);

			// Processa mensagem
			const response = await messageHandler.handleMessage(message);

			// Envia resposta
			await bot.sendMessage(from, response);

			console.log(`✅ Resposta enviada: ${response.substring(0, 50)}...`);
		};

		// Conecta o bot
		await bot.connect(onMessage);

		console.log('\n✨ Bot iniciado com sucesso!');
		console.log('📱 Aguardando QR Code...\n');
	} catch (error) {
		console.error('❌ Erro ao iniciar bot:', error);
		process.exit(1);
	}
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (error: unknown) => {
	// Ignora erros conhecidos de descriptografia do WhatsApp
	const errorMsg = error instanceof Error ? error.message : String(error);
	if (errorMsg.includes('Bad MAC') || 
	    errorMsg.includes('decrypt') ||
	    errorMsg.includes('Session error')) {
		return; // Suprime silenciosamente
	}
	console.error('❌ Erro não tratado:', error);
});

process.on('uncaughtException', (error: Error) => {
	// Ignora erros conhecidos de descriptografia do WhatsApp
	if (error.message.includes('Bad MAC') || 
	    error.message.includes('decrypt') ||
	    error.message.includes('Session error')) {
		return; // Suprime silenciosamente
	}
	console.error('❌ Exceção não capturada:', error);
	process.exit(1);
});

// Inicia aplicação
main();
