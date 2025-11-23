# MaracutaIA 🛡️

Sistema inteligente de monitoramento de propostas legislativas com criação automatizada de conteúdo viral para WhatsApp.

## 👥 Membros da Equipe

*   **Nome:** [Cauê Costa] - **Email:** [caue.costa@acutistecnologia.com]
*   **Nome:** [Fernando d'Ávila] - **Email:** [fernando.davila@acutistecnologia.com]
*   **Nome:** [Caio Costa] - **Email:** [lima@acutistecnologia.com]

---

## 🚀 Como Rodar o Projeto Localmente

Siga este passo a passo para configurar e executar o projeto em sua máquina.

### 1. Pré-requisitos

*   **Node.js** (versão 18 ou superior)
*   **npm** (gerenciador de pacotes)

### 2. Instalação

Clone o repositório e instale as dependências:

```bash
git clone <url-do-repositorio>
cd vox-sentinel
npm install
```

### 3. Configuração do Banco de Dados (Supabase)

Para que o projeto funcione corretamente, é necessário criar as tabelas no banco de dados.

1.  Acesse o painel do seu projeto no [Supabase](https://supabase.com/).
2.  Vá até a seção **SQL Editor** (ícone de terminal na barra lateral).
3.  Clique em **New Query**.
4.  Copie o conteúdo dos arquivos da pasta `scripts/` deste projeto e execute-os na seguinte ordem:
    *   `scripts/001_create_tables.sql` (Criação das tabelas base)
    *   `scripts/002_add_sync_metadata.sql` (Metadados para sincronização)
    *   `scripts/002_seed_data.sql` (Dados iniciais de teste - opcional)
5.  Clique em **Run** para executar cada script.

### 4. Configuração das Variáveis de Ambiente

Crie um arquivo chamado `.env.local` na raiz do projeto. Você precisará das seguintes chaves:

#### 🔹 Supabase (Banco de Dados e Autenticação)
1.  No painel do Supabase, vá em **Project Settings** (ícone de engrenagem) > **API**.
2.  Copie as seguintes chaves:
    *   `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_URL`
    *   `anon public` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `service_role` (secret) -> `SUPABASE_SERVICE_ROLE_KEY`

#### 🔹 OpenAI (Inteligência Artificial)
1.  Crie uma conta na [OpenAI Platform](https://platform.openai.com/).
2.  Vá em **API Keys** e crie uma nova chave secreta.
    *   Chave gerada -> `OPENAI_API_KEY`

#### 🔹 Z-API (Integração com WhatsApp)
1.  Crie uma conta e uma instância na [Z-API](https://z-api.io/).
2.  No painel da instância, copie:
    *   `ID da Instância` -> `WHATSAPP_INSTANCE_ID`
    *   `Token da Instância` -> `WHATSAPP_TOKEN`
    *   `Client Token` (em Segurança) -> `WHATSAPP_CLIENT_TOKEN`
3.  Defina um número padrão para testes (formato internacional, ex: 5511999999999) -> `WHATSAPP_DEFAULT_PHONE`

#### 📄 Exemplo do arquivo `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_chave_anon_aqui"
NEXT_PUBLIC_SUPABASE_URL="sua_url_supabase_aqui"
SUPABASE_SERVICE_ROLE_KEY="sua_chave_service_role_aqui"
SUPABASE_URL="sua_url_supabase_aqui"

# OpenAI
OPENAI_API_KEY="sk-..."

# WhatsApp (Z-API)
WHATSAPP_INSTANCE_ID="seu_instance_id"
WHATSAPP_TOKEN="seu_token"
WHATSAPP_DEFAULT_PHONE="5511999999999"
WHATSAPP_CLIENT_TOKEN="seu_client_token"
```

### 5. Construção (Build)

Para construir o projeto para produção:

```bash
npm run build
```

### 6. Execução

Para rodar o projeto em modo de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

Para rodar a versão de produção (após o build):

```bash
npm run start
```

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.
