# 🛡️ MaracutaIA

Sistema inteligente de monitoramento de propostas legislativas com criação automatizada de conteúdo viral para WhatsApp.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- APIs configuradas:
  - OpenAI (para geração de texto)
  - ElevenLabs (para geração de áudio)
  - Z-API (para envio no WhatsApp)

## 🚀 Instalação

### 1. Clone o projeto

```bash
git clone <seu-repositorio>
cd vox-sentinel
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Edite o arquivo `.env.local` e mantenha apenas estas variáveis (remova as duplicadas):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ypkduvukgexmdzvnzubh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# ElevenLabs
ELEVENLABS_API_KEY=sk_...

# Z-API WhatsApp
WHATSAPP_INSTANCE_ID=3EAA0EA5531411620BB16EDB289F0F12
WHATSAPP_TOKEN=C43853483F75C4AB7552805D
WHATSAPP_CLIENT_TOKEN=F4d18bdca3fba41988ccb5e9e79ae0950S
WHATSAPP_DEFAULT_PHONE=5511999999999
```

**⚠️ Remova do .env.local:**
- Todas as variáveis `POSTGRES_*` (não utilizadas)
- `SUPABASE_JWT_SECRET` (não utilizado)
- `SUPABASE_URL` duplicado (use apenas `NEXT_PUBLIC_SUPABASE_URL`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` duplicado (mantenha apenas um)

### 4. Inicie o servidor

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🎯 Funcionalidades Principais

### 1. **Monitoramento de Propostas**
- Sincronização automática com APIs da Câmara e Senado
- Análise inteligente via IA
- Sistema de alertas de risco

### 2. **Criação de Conteúdo Viral**
- Geração automática de texto otimizado
- Conversão texto-para-áudio (TTS)
- Personalização por público-alvo e tom

### 3. **Integração WhatsApp**
- ✅ Envio para **Contatos** individuais
- ✅ Envio para **Grupos** (com áudio)
- ⚠️ Envio para **Canais** (apenas texto - limitação da API)
- Listagem e criação de Canais/Grupos

## 📱 Como Usar o WhatsApp

### Enviar Mensagem Viral

1. Acesse `/viral/create`
2. Gere o script com IA
3. Gere o áudio com TTS
4. Clique em "Carregar meus grupos" ou "Carregar meus canais"
5. Selecione o destino
6. Clique em "Enviar"

### Limitações Conhecidas

- **Canais (Newsletters)**: A API do WhatsApp não suporta envio de áudio para canais. Apenas texto é enviado.
- **Grupos**: Funcionam perfeitamente com texto + áudio

## 🔧 Estrutura do Projeto

```
vox-sentinel/
├── app/
│   ├── api/              # Rotas de API
│   │   ├── viral/        # Geração de conteúdo
│   │   ├── tts/          # Text-to-Speech
│   │   ├── whatsapp/     # Integração WhatsApp
│   │   └── sync/         # Sincronização legislativa
│   ├── viral/create/     # Interface de criação
│   └── analyze/          # Análise de propostas
├── lib/
│   └── supabase/         # Cliente Supabase
└── components/           # Componentes React
```

## 🛠️ Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Compila para produção
npm run start        # Inicia servidor de produção
npm run lint         # Verifica código
```

## 📝 Notas Importantes

1. **Chaves de API**: Nunca compartilhe suas chaves em repositórios públicos
2. **Z-API**: Certifique-se de que sua instância está conectada e ativa
3. **Créditos**: OpenAI e ElevenLabs consomem créditos por uso

## 🐛 Troubleshooting

### Erro de autenticação Supabase
- Verifique se as chaves `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão corretas

### Áudio não é gerado
- Confirme que `ELEVENLABS_API_KEY` está válida
- Verifique se tem créditos disponíveis na sua conta ElevenLabs

### WhatsApp não envia
- Confirme que `WHATSAPP_INSTANCE_ID`, `WHATSAPP_TOKEN` e `WHATSAPP_CLIENT_TOKEN` estão corretos
- Verifique se sua instância Z-API está online

## 📄 Licença

Este projeto é proprietário.

---

**Desenvolvido para monitoramento legislativo inteligente** 🇧🇷
