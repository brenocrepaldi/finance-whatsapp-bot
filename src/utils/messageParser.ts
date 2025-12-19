import { ParsedMessage } from '../types';
import { DateHelper } from './dateHelper';

/**
 * Parser inteligente de mensagens do WhatsApp
 * Interpreta comandos de entrada, saída e diário
 */
export class MessageParser {
  /**
   * Normaliza valor monetário brasileiro para número
   * Converte "87,10" ou "87.10" para 87.10
   */
  private static normalizeValue(value: string): number {
    // Remove espaços
    let normalized = value.trim();
    
    // Se tem vírgula, substitui por ponto
    normalized = normalized.replace(',', '.');
    
    // Remove pontos que são separadores de milhar (ex: 1.000,00)
    // Mantém apenas o último ponto como decimal
    const parts = normalized.split('.');
    if (parts.length > 2) {
      normalized = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
    }
    
    return parseFloat(normalized);
  }

  /**
   * Detecta o tipo de operação (entrada, saída, diário ou consulta)
   */
  private static detectType(text: string): 'entrada' | 'saida' | 'diario' | 'saldo' | 'resumo' | 'hoje' | 'semana' | 'mes' | 'performance' | 'comparar' | 'previsao' | 'ajuda' | null {
    const lower = text.toLowerCase();
    
    // Remove "sub" do texto para análise (será tratado separadamente)
    const cleanText = lower.replace(/^sub\s+/, '');
    
    // Comando de ajuda
    if (cleanText.match(/^(ajuda|help|\?)$/)) return 'ajuda';
    
    // Novos comandos especiais
    if (cleanText.match(/^(performance|desempenho)$/)) return 'performance';
    if (cleanText.match(/^(comparar|comparacao|comparação)$/)) return 'comparar';
    if (cleanText.match(/^(previsao|previsão|projecao|projeção|forecast)$/)) return 'previsao';
    
    // Comandos de consulta de saldo com data específica
    // Exemplo: "saldo 16/12" ou "saldo hoje" ou "resumo 25/12" ou "saldo ontem" ou "saldo amanha"
    if (cleanText.match(/^(saldo|resumo|extrato)\s+\d{1,2}\/\d{1,2}/)) return 'saldo';
    if (cleanText.match(/^(saldo|resumo|extrato)\s+(ontem|amanha|amanhã)$/)) return 'saldo';
    
    // Comandos de consulta (sem valor)
    if (cleanText.match(/^(saldo|resumo|extrato)\s*(hoje|hj)?$/)) return 'hoje';
    if (cleanText.match(/^(hoje|hj)$/)) return 'hoje';
    if (cleanText.match(/^(ontem)$/)) return 'saldo';
    if (cleanText.match(/^(amanha|amanhã)$/)) return 'saldo';
    if (cleanText.match(/^(saldo|resumo|extrato)?\s*(semana|semanal)$/)) return 'semana';
    if (cleanText.match(/^(saldo|resumo|extrato)?\s*(mes|mês|mensal)$/)) return 'mes';
    
    // Comandos de atualização (com valor)
    if (cleanText.includes('entrada')) return 'entrada';
    if (cleanText.includes('saida') || cleanText.includes('saída')) return 'saida';
    
    // Se tem só número, é diário
    if (/^\d+([,.]\d{1,2})?\s*(hoje|amanha|amanhã|\d{1,2}\/\d{1,2})?$/.test(cleanText)) return 'diario';
    
    // Não reconhecido
    return null;
  }

  /**
   * Detecta se o comando é de substituição (começa com "sub")
   */
  private static shouldReplace(text: string): boolean {
    return text.toLowerCase().trim().startsWith('sub ');
  }

  /**
   * Extrai data específica de comandos como "saldo 16/12", "saldo ontem", "saldo amanha"
   */
  private static extractTargetDate(text: string): Date | undefined {
    // Tenta primeiro palavras-chave (ontem, amanha)
    const keywordMatch = text.match(/\b(ontem|amanha|amanhã)\b/);
    if (keywordMatch) {
      return DateHelper.parseDate(keywordMatch[1]);
    }
    
    // Tenta formato de data dd/mm/aaaa
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
    if (dateMatch) {
      return DateHelper.parseDate(dateMatch[1]);
    }
    
    return undefined;
  }

  /**
   * Extrai o valor numérico da mensagem
   */
  private static extractValue(text: string): number | null {
    // Remove palavras-chave
    let cleanText = text
      .toLowerCase()
      .replace(/entrada|saida|saída|diario|diário|hoje|amanha|amanhã/gi, '')
      .trim();

    // Remove datas no formato dd/mm ou dd/mm/aaaa
    cleanText = cleanText.replace(/\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/g, '').trim();

    // Procura por número (pode ter vírgula ou ponto)
    const match = cleanText.match(/[\d]+[,.]?[\d]*/);
    
    if (match) {
      return this.normalizeValue(match[0]);
    }

    return null;
  }

  /**
   * Extrai a data da mensagem
   */
  private static extractDate(text: string): Date {
    const lower = text.toLowerCase();

    // Procura por "hoje"
    if (lower.includes('hoje')) {
      return DateHelper.parseDate('hoje');
    }

    // Procura por "ontem"
    if (lower.includes('ontem')) {
      return DateHelper.parseDate('ontem');
    }

    // Procura por "amanha" ou "amanhã"
    if (lower.includes('amanha') || lower.includes('amanhã')) {
      return DateHelper.parseDate('amanha');
    }

    // Procura por formato dd/mm ou dd/mm/aaaa
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
    if (dateMatch) {
      return DateHelper.parseDate(dateMatch[1]);
    }

    // Padrão: hoje
    return DateHelper.getBrasiliaTime();
  }

  /**
   * Faz o parse completo da mensagem
   * 
   * Exemplos de atualização (soma):
   * - "diario 87,10" → type: diario, value: 87.10, date: hoje, shouldReplace: false
   * - "300 amanha" → type: diario, value: 300, date: amanhã, shouldReplace: false
   * - "entrada 352,91 01/01" → type: entrada, value: 352.91, date: 01/01, shouldReplace: false
   * 
   * Exemplos de substituição:
   * - "sub 300 hoje" → type: diario, value: 300, date: hoje, shouldReplace: true
   * - "sub entrada 500" → type: entrada, value: 500, date: hoje, shouldReplace: true
   * 
   * Exemplos de consulta:
   * - "saldo" ou "resumo" → type: hoje, value: undefined, date: hoje
   * - "saldo semana" → type: semana, value: undefined
   * - "resumo mes" → type: mes, value: undefined
   */
  static parse(message: string): ParsedMessage | null {
    const trimmed = message.trim();
    
    if (!trimmed) {
      return null;
    }

    // Detecta se é comando de substituição
    const shouldReplace = this.shouldReplace(trimmed);

    // Remove "sub" do texto para processar o resto
    const cleanMessage = shouldReplace ? trimmed.replace(/^sub\s+/i, '') : trimmed;

    // Detecta o tipo
    const type = this.detectType(cleanMessage);

    // Se não reconheceu o comando, retorna null
    if (type === null) {
      return null;
    }

    // Se é comando de ajuda
    if (type === 'ajuda') {
      return {
        type: 'ajuda',
        date: DateHelper.getBrasiliaTime(),
        rawText: trimmed
      };
    }

    // Se é comando de consulta especial (performance, comparar, previsão)
    if (['performance', 'comparar', 'previsao'].includes(type)) {
      return {
        type: type as 'performance' | 'comparar' | 'previsao',
        date: DateHelper.getBrasiliaTime(),
        rawText: trimmed
      };
    }

    // Se é comando "saldo dd/mm" (consulta de saldo em data específica)
    if (type === 'saldo') {
      const targetDate = this.extractTargetDate(cleanMessage);
      if (targetDate) {
        return {
          type: 'saldo',
          date: DateHelper.getBrasiliaTime(),
          rawText: trimmed,
          targetDate
        };
      }
    }

    // Se é comando de consulta básica (hoje, semana, mes)
    if (['hoje', 'semana', 'mes'].includes(type)) {
      return {
        type: type as 'hoje' | 'semana' | 'mes',
        date: DateHelper.getBrasiliaTime(),
        rawText: trimmed
      };
    }

    // Para comandos de atualização, extrai o valor
    const value = this.extractValue(cleanMessage);
    if (value === null || isNaN(value)) {
      return null;
    }

    // Extrai a data
    const date = this.extractDate(cleanMessage);

    return {
      type: type as 'entrada' | 'saida' | 'diario',
      value,
      date,
      rawText: trimmed,
      shouldReplace
    };
  }

  /**
   * Valida se a mensagem é um comando válido
   */
  static isValidCommand(message: string): boolean {
    return this.parse(message) !== null;
  }
}
