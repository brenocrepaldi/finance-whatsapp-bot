/**
 * Funções auxiliares para trabalhar com datas
 */

export class DateHelper {
  /**
   * Retorna a data/hora atual no horário de Brasília (GMT-3)
   */
  static getBrasiliaTime(): Date {
    const now = new Date();
    // Converte para horário de Brasília (UTC-3)
    const brasiliaOffset = -3 * 60; // -3 horas em minutos
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brasiliaTime = new Date(utcTime + (brasiliaOffset * 60000));
    return brasiliaTime;
  }

  /**
   * Interpreta texto de data e retorna um objeto Date
   * Aceita: "hoje", "ontem", "amanha", "dd/mm", "dd/mm/aaaa"
   * Usa horário de Brasília
   */
  static parseDate(dateText: string): Date {
    const now = this.getBrasiliaTime();
    const normalized = dateText.toLowerCase().trim();

    // Caso: "hoje"
    if (normalized === 'hoje') {
      return now;
    }

    // Caso: "ontem"
    if (normalized === 'ontem') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }

    // Caso: "amanha" ou "amanhã"
    if (normalized === 'amanha' || normalized === 'amanhã') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    // Caso: formato dd/mm ou dd/mm/aaaa
    const dateMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]);
      let year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();

      // Se ano com 2 dígitos, assumir 20XX
      if (year < 100) {
        year += 2000;
      }

      return new Date(year, month - 1, day);
    }

    // Caso padrão: retorna hoje
    return now;
  }

  /**
   * Formata data para exibição (dd/mm/aaaa)
   */
  static formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Retorna o mês (1-12) de uma data
   */
  static getMonth(date: Date): number {
    return date.getMonth() + 1;
  }

  /**
   * Retorna o dia do mês (1-31)
   */
  static getDay(date: Date): number {
    return date.getDate();
  }

  /**
   * Retorna o ano
   */
  static getYear(date: Date): number {
    return date.getFullYear();
  }
}
