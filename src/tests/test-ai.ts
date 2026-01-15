import { AIService } from '../ai/aiService';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Script de teste para o serviço de IA
 */
async function testAIService() {
	console.log('🧪 Testando AIService...\n');

	const aiService = new AIService();

	// Testa se está ativo
	console.log('1️⃣ Status da IA:', aiService.isActive() ? '✅ Ativa' : '❌ Inativa');

	if (!aiService.isActive()) {
		console.log('\n⚠️  Configure OPENAI_API_KEY no .env para testar a IA');
		return;
	}

	// Estatísticas
	const stats = aiService.getStats();
	console.log('📊 Estatísticas:', stats);

	// Testa conversas
	console.log('\n2️⃣ Testando conversas...\n');

	const testMessages = [
		'oi',
		'gastei 50 reais hoje',
		'como economizar dinheiro?',
		'obrigado pela ajuda',
	];

	for (const message of testMessages) {
		console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
		console.log(`👤 Usuário: ${message}`);

		try {
			const response = await aiService.generateResponse(message, 'test-chat');
			console.log(`🤖 Bot: ${response}`);
		} catch (error) {
			console.error('❌ Erro:', error);
		}

		// Pequena pausa entre mensagens
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	// Estatísticas finais
	console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	console.log('📊 Estatísticas finais:', aiService.getStats());

	console.log('\n✅ Teste concluído!');
}

// Executa teste
testAIService().catch((error) => {
	console.error('❌ Erro no teste:', error);
	process.exit(1);
});
