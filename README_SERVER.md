# Finance WhatsApp Bot - Backend API

API WebSocket para o bot de controle financeiro.

## Como executar o servidor (sem WhatsApp)

### Instalar dependências
```bash
npm install
```

### Executar o servidor em desenvolvimento
```bash
npm run dev:server
```

O servidor estará disponível em `http://localhost:3000`

### Executar em produção
```bash
npm run build
npm run start:server
```

## Variáveis de ambiente

Adicione ao seu `.env`:

```env
# Porta do servidor
PORT=3000

# URL do frontend (CORS)
FRONTEND_URL=http://localhost:5173

# Configurações existentes do Google Sheets
GOOGLE_PROJECT_ID=seu-project-id
GOOGLE_CLIENT_EMAIL=seu-client-email
GOOGLE_PRIVATE_KEY=sua-private-key
SHEET_ID=seu-sheet-id
```

## Endpoints

### REST
- `GET /health` - Verifica status do servidor

### WebSocket (Socket.IO)
- Evento: `user-message` - Envia mensagem do usuário
- Evento: `bot-message` - Recebe resposta do bot

## Comandos suportados

O bot aceita os mesmos comandos do WhatsApp:

### Adicionar valores
- `diario 87,10`
- `entrada 200 hoje`
- `saida 94,90 amanha`
- `517` (adiciona no diário de hoje)

### Substituir valores
- `sub 300 hoje`
- `sub entrada 500`
- `sub saida 100 16/12`

### Consultas
- `saldo` ou `resumo` - Saldo de hoje
- `saldo 16/12` - Saldo de data específica
- `saldo semana` - Últimos 7 dias
- `saldo mes` ou `mes` - Mês completo

### Análises
- `performance` - Performance do mês
- `comparar` - Mês atual vs anterior
- `previsao` - Projeção de fim de mês
