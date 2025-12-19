import { MessageParser } from '../utils/messageParser';
import { DateHelper } from '../utils/dateHelper';
import { SheetUpdater } from '../sheets/sheetUpdater';
import { UpdateRequest } from '../types';

/**
 * Processa mensagens recebidas e executa ações correspondentes
 */
export class MessageHandler {
  private sheetUpdater: SheetUpdater;

  constructor() {
    this.sheetUpdater = new SheetUpdater();
  }

  /**
   * Processa uma mensagem e retorna a resposta
   */
  async handleMessage(message: string): Promise<string> {
    try {
      // Faz parse da mensagem
      const parsed = MessageParser.parse(message);

      if (!parsed) {
        return this.getHelpMessage();
      }

      // Comandos especiais
      if (parsed.type === 'performance') {
        return await this.sheetUpdater.getPerformanceReport();
      }

      if (parsed.type === 'comparar') {
        return await this.sheetUpdater.getComparisonReport();
      }

      if (parsed.type === 'previsao') {
        return await this.sheetUpdater.getForecastReport();
      }

      // Comando "saldo dd/mm"
      if (parsed.type === 'saldo' && parsed.targetDate) {
        return await this.sheetUpdater.getDayReport(parsed.targetDate);
      }

      // Se é comando de consulta (saldo/resumo)
      if (['hoje', 'semana', 'mes'].includes(parsed.type)) {
        return await this.handleQueryCommand(parsed.type as 'hoje' | 'semana' | 'mes');
      }

      // Se é comando de atualização (entrada/saída/diário)
      // Extrai informações da data
      const day = DateHelper.getDay(parsed.date);
      const month = DateHelper.getMonth(parsed.date);
      const year = DateHelper.getYear(parsed.date);

      // Monta requisição de atualização
      const updateRequest: UpdateRequest = {
        type: parsed.type as 'entrada' | 'saida' | 'diario',
        value: parsed.value!,
        day,
        month,
        year,
        shouldReplace: parsed.shouldReplace || false
      };

      // Atualiza planilha
      const response = await this.sheetUpdater.updateValue(updateRequest);

      return response.message;

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      return `⚠️ Ops! Algo deu errado.

Não consegui processar sua
mensagem.

💡 Digite "ajuda" para ver
   os comandos disponíveis.`;
    }
  }

  /**
   * Processa comandos de consulta (saldo, resumo)
   */
  private async handleQueryCommand(type: 'hoje' | 'semana' | 'mes'): Promise<string> {
    try {
      switch (type) {
        case 'hoje':
          return await this.sheetUpdater.getDayReport(DateHelper.getBrasiliaTime());
        case 'semana':
          return await this.sheetUpdater.getWeekReport();
        case 'mes':
          return await this.sheetUpdater.getCompleteMonthReport();
        default:
          return '⚠️ Comando não reconhecido.';
      }
    } catch (error) {
      console.error('Erro ao processar consulta:', error);
      return `⚠️ Erro ao buscar dados.

Tente novamente em alguns
instantes ou digite "ajuda"
para ver os comandos.`;
    }
  }

  /**
   * Retorna mensagem de ajuda
   */
  private getHelpMessage(): string {
    return `
--- 💰 CONTROLE FINANCEIRO ---

--- 📝 REGISTRAR VALORES ---

🔹 ADICIONAR (soma ao existente)
   • diario 87,10
   • entrada 200 hoje
   • saida 94,90 amanha
   • 517 (diário de hoje)

🔸 SUBSTITUIR (sobrescreve)
   • sub 300 hoje
   • sub entrada 500
   • sub saida 100 16/12


------ 📊 CONSULTAS ------

🔍 Resumos Rápidos:
   • saldo → Hoje
   • saldo 16/12 → Data específica
   • saldo semana → Últimos 7 dias
   • mes → Mês completo + Performance

📈 Análises Avançadas:
   • performance → Entradas vs Saídas
   • comparar → Mês atual vs anterior
   • previsao → Projeção de fim de mês


------ 📅 FORMATO DATAS ------

   ✓ hoje
   ✓ amanha
   ✓ 25/12
   ✓ 25/12/2024


------ 💡 DICAS ------

   ⚡ Sem "sub" → SOMA valores
   ⚡ Com "sub" → SUBSTITUI valores
   ⚡ Use "mes" para relatório completo!
    `.trim();
  }

  /**
   * Valida se a mensagem é um comando
   */
  isValidCommand(message: string): boolean {
    return MessageParser.isValidCommand(message);
  }
}
