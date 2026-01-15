# 🤖 Finance WhatsApp Bot

Bot de WhatsApp integrado com Google Sheets para controle financeiro automatizado. Desenvolvido com Node.js, TypeScript e Baileys.

## 📋 Funcionalidades

- ✅ Integração completa com WhatsApp via Baileys
- ✅ Conexão com Google Sheets API
- ✅ **🤖 IA integrada (Google Gemini - Grátis) para respostas inteligentes**
- ✅ Parser inteligente de mensagens
- ✅ Suporte a valores em formato brasileiro (vírgula e ponto)
- ✅ Reconhecimento de datas naturais (hoje, amanhã, dd/mm)
- ✅ Atualização automática de Entrada, Saída e Diário
- ✅ Sessão persistente (não precisa escanear QR toda vez)
- ✅ Reconexão automática
- ✅ Mensagens de confirmação
- ✅ Conversas naturais com contexto (IA lembra das últimas interações)

## 📁 Estrutura do Projeto

```
finance-bot/
├── src/
│   ├── ai/
│   │   └── aiService.ts          # Serviço de IA (OpenAI)
│   ├── bot/
│   │   ├── whatsapp.ts          # Gerenciador Baileys
│   │   └── messageHandler.ts     # Processador de mensagens
│   ├── sheets/
│   │   ├── googleSheets.ts       # Cliente Google Sheets
│   │   └── sheetUpdater.ts       # Lógica de atualização
│   ├── utils/
│   │   ├── messageParser.ts      # Parser inteligente
│   │   └── dateHelper.ts         # Helpers de data
│   ├── types/
│   │   └── index.ts              # Tipos TypeScript
│   └── index.ts                  # Ponto de entrada
├── auth/                         # Sessão WhatsApp (gerado automaticamente)
├── .env                          # Variáveis de ambiente
├── .env.example                  # Modelo de configuração
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd finance-bot
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Google Sheets

#### 3.1. Criar Service Account

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **Service Account**
5. Preencha os dados e clique em **Create**
6. Em **Keys**, clique em **Add Key** > **Create new key**
7. Escolha **JSON** e baixe o arquivo

#### 3.2. Ativar Google Sheets API

1. No Google Cloud Console, vá em **APIs & Services** > **Library**
2. Procure por "Google Sheets API"
3. Clique em **Enable**

#### 3.3. Compartilhar a planilha

1. Abra sua planilha do Google Sheets
2. Clique em **Compartilhar**
3. Adicione o email da Service Account (está no arquivo JSON baixado)
4. Dê permissão de **Editor**

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com seus dados:

```env
GOOGLE_PROJECT_ID=seu-projeto-id
GOOGLE_CLIENT_EMAIL=seu-email@seu-projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"
SHEET_ID=seu-id-da-planilha-google

# Opcional: Configure a IA para respostas inteligentes (Google Gemini - Grátis)
GEMINI_API_KEY=sua-gemini-api-key-aqui
GEMINI_MODEL=gemini-1.5-pro
```

**Como obter o SHEET_ID:**
- URL da planilha: `https://docs.google.com/spreadsheets/d/ABC123XYZ/edit`
- SHEET_ID é: `ABC123XYZ`

**Nota sobre GOOGLE_PRIVATE_KEY:**
- Copie a chave privada do arquivo JSON baixado
- Mantenha as aspas duplas
- Mantenha os `\n` (quebras de linha)

### 5. (Opcional) Configure a IA

O bot suporta respostas inteligentes com **Google Gemini** (totalmente gratuito).

#### 🧠 Google Gemini - GRÁTIS

**Por que Gemini:**
- ✅ **Totalmente grátis** para uso pessoal
- 🌟 Modelo do Google (alta qualidade)
- 📊 **Tier gratuito**: 2 requisições/minuto, 50 requisições/dia
- 🧠 Gemini 1.5 Pro - mais inteligente
- ☁️ **Funciona perfeitamente no Render** (não requer recursos locais)

**Como configurar:**

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crie/faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada
5. Adicione no arquivo `.env`:
   ```env
   GEMINI_API_KEY=AIza...sua-chave-aqui...
   GEMINI_MODEL=gemini-1.5-pro
   ```

**Modelos disponíveis:**
- `gemini-1.5-pro` - **Recomendado** (mais inteligente, estável)
- `gemini-1.5-flash` - Mais rápido, menos limites

---

**💡 Nota:** Se não configurar a IA, o bot funcionará normalmente respondendo apenas aos comandos financeiros pré-programados.

### 6. Execute o bot

#### Modo desenvolvimento (com hot reload):

```bash
npm run dev
```

#### Modo produção:

```bash
npm run build
npm start
```

## 📱 Como Usar

### Primeira execução

1. Execute o bot com `npm run dev`
2. Um QR Code aparecerá no terminal
3. Abra o WhatsApp no celular
4. Vá em **Dispositivos conectados** > **Conectar dispositivo**
5. Escaneie o QR Code
6. Pronto! A sessão ficará salva na pasta `auth/`

### 🤖 Conversando com a IA

Quando a IA está configurada, o bot responde inteligentemente a mensagens que não são comandos:

**Exemplos de conversas:**

```
Você: oi
Bot: Oi! 😊 Tudo bem? Estou aqui pra te ajudar com suas finanças ou bater um papo!

Você: gastei 432 reais hoje
Bot: Entendi que você gastou R$ 432 hoje! Para registrar isso, use:
💸 saida 432
ou
🍽️ diario 432
Depende se é uma saída específica ou gasto diário. Digite 'ajuda' pra ver todos os comandos! ✨

Você: como economizar dinheiro?
Bot: Ótima pergunta! 💰 Algumas dicas rápidas:
✓ Registre TODOS os gastos (use o comando 'diario')
✓ Confira o 'resumo mes' regularmente
✓ Use 'performance' pra ver se está economizando
```

**Contexto de conversa:**
- A IA lembra das últimas 10 mensagens de cada chat
- Contexto é mantido por 30 minutos de inatividade
- Cada usuário/grupo tem seu próprio contexto

### Comandos Financeiros

#### Adicionar no DIÁRIO

```
diario 87,10
diario 400 amanha
diario 100 07/01
517
35 amanha
10 03/02
```

#### Adicionar ENTRADA

```
entrada 352,91 01/01
entrada 200 hoje
entrada 3180 05/01
```

#### Adicionar SAÍDA

```
saida 94,90 hoje
saida 600 06/02
saida 300 amanha
```

### Formatos aceitos

**Valores:**
- Com vírgula: `87,10`
- Com ponto: `87.10`
- Inteiros: `517`

**Datas:**
- `hoje` - dia atual
- `amanha` ou `amanhã` - dia seguinte
- `04/02` - dia 4 de fevereiro (ano atual)
- `04/02/2025` - dia 4 de fevereiro de 2025

### Exemplos de respostas

```
✅ Diário de R$ 87,10 registrado para 12/12/2025
✅ Entrada de R$ 3.180,00 registrado para 05/01/2025
✅ Saída de R$ 94,90 registrado para 12/12/2025
```

## 🗂️ Estrutura da Planilha

A planilha deve ter a seguinte estrutura:

### Janeiro (colunas B-F)

| Dia | Entrada | Saída | Diário | Saldo |
|-----|---------|-------|--------|-------|
| 1   |         |       |        |       |
| 2   |         |       |        |       |
| ... |         |       |        |       |
| 31  |         |       |        |       |

- **Linhas:** 5 a 35 (dia 1 = linha 5)

### Fevereiro (colunas H-L)

| Dia | Entrada | Saída | Diário | Saldo |
|-----|---------|-------|--------|-------|
| 1   |         |       |        |       |
| 2   |         |       |        |       |
| ... |         |       |        |       |
| 28  |         |       |        |       |

- **Linhas:** 5 a 32
- **Deslocamento:** 6 colunas à direita

### Março (colunas N-R)

- **Linhas:** 5 a 35
- **Deslocamento:** 12 colunas à direita

E assim por diante...

## 🛠️ Desenvolvimento

### Scripts disponíveis

```bash
# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Executar produção
npm start

# Limpar pasta dist
npm run clean
```

### Estrutura de código

**Parser de Mensagens** (`messageParser.ts`):
- Detecta tipo de operação (entrada/saída/diário)
- Extrai valor numérico
- Normaliza formato brasileiro
- Interpreta datas naturais

**Google Sheets** (`googleSheets.ts` + `sheetUpdater.ts`):
- Autenticação via Service Account
- Leitura e escrita de células
- Cálculo automático de posições
- Suporte a múltiplos meses

**Bot WhatsApp** (`whatsapp.ts`):
- Conexão via Baileys
- Persistência de sessão
- Reconexão automática
- QR Code no terminal

## 🐛 Troubleshooting

### QR Code não aparece

- Verifique se a pasta `auth/` foi deletada
- Reinicie o bot

### Erro de autenticação Google

- Verifique se a Service Account tem acesso à planilha
- Confirme se a API do Google Sheets está ativada
- Valide o formato da PRIVATE_KEY no .env

### Bot não responde

- Verifique os logs no terminal
- Confirme se o SHEET_ID está correto
- Teste se a planilha está acessível

### Erro ao escrever na planilha

- Verifique se o mês/dia existem na planilha
- Confirme a estrutura das colunas
- Veja os logs para identificar a célula exata

## 📝 Licença

MIT

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a seção de Troubleshooting
2. Consulte os logs do terminal
3. Abra uma issue no repositório

---

Desenvolvido com ❤️ usando Node.js + TypeScript + Baileys + Google Sheets API
