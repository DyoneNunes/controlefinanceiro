# Controle Financeiro 💰

Sistema de controle financeiro pessoal e familiar, focado em gestão multi-usuário (Grupos), insights via Inteligência Artificial (Gemini) e automação de infraestrutura.

## 🚀 Funcionalidades Principais

- **Multi-Tenancy (Grupos):** Gerencie finanças pessoais, familiares ou de projetos separadamente.
- **Dashboard Inteligente:** Cálculos de Fluxo de Caixa (Realizado) vs. Competência (Pendente) e dívida global.
- **Consultor IA:** Integração com Google Gemini para análise de gastos e sugestões de investimento.
- **Gestão Completa:** Contas a Pagar, Receitas, Investimentos e Gastos Variáveis.

---

## ⚙️ Infraestrutura e CI/CD (Homelab)

Este projeto utiliza um pipeline de **CI/CD moderno para ambientes domésticos (Homelab)**, permitindo deploy automático em um servidor local (sem IP público fixo) através de túneis seguros.

### Arquitetura de Deploy
1.  **GitHub Actions:** Detecta `push` na branch `main`.
2.  **Tailscale:** Cria um túnel VPN efêmero para conectar o runner do GitHub à rede local do servidor.
3.  **SSH Action:** Conecta no servidor via SSH através do IP da VPN.
4.  **Docker Compose:** Reconstrói e reinicia os containers com a nova versão do código.

### Configuração do Servidor (Requisitos)

Para reproduzir o ambiente de deploy:

1.  **Tailscale:** Instalado e autenticado na máquina servidor.
2.  **Docker:** Usuário deve estar no grupo docker para execução sem sudo.
    ```bash
    sudo usermod -aG docker $USER
    # Requer relogin para surtir efeito
    ```
3.  **Chaves SSH:** Par de chaves RSA/Ed25519 configurado (`authorized_keys` no servidor).

### Segredos do GitHub (Secrets)

O pipeline depende das seguintes variáveis configuradas no repositório:

| Secret | Descrição |
| :--- | :--- |
| `SERVER_HOST` | IP do servidor na rede Tailscale (ex: `100.x.y.z`). |
| `SSH_PRIVATE_KEY` | Chave privada SSH para acesso ao servidor. |
| `TAILSCALE_AUTHKEY` | Chave de autenticação gerada no painel Tailscale (Reusable/Ephemeral). |

---

## 🛠️ Como Rodar Localmente

### Pré-requisitos
- Docker & Docker Compose
- Node.js 20+ (opcional, apenas para dev fora do Docker)

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/DyoneNunes/controlefinanceiro.git
    cd controlefinanceiro
    ```

2.  **Configure o ambiente:**
    Crie um arquivo `.env` na raiz (use o modelo abaixo):
    ```ini
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=postgres
    POSTGRES_DB=financedb
    JWT_SECRET=sua_chave_secreta_aqui
    GEMINI_API_KEY=sua_api_key_google_aqui
    ```

3.  **Inicie com Docker:**
    ```bash
    docker compose up -d --build
    ```

4.  **Acesse:**
    - Frontend: `http://localhost:5173`
    - Backend: `http://localhost:3000`

---

## 📚 Documentação Técnica

A documentação detalhada do projeto está na pasta `docs/`.

- [Visão Geral do Projeto](docs/project_overview.md)
- [Endpoints da API](docs/api_endpoints.md)
- [Esquema do Banco de Dados](docs/database_schema.md)
- [Componentes Frontend](docs/frontend_components.md)

---

## 📝 Manutenção

Scripts úteis localizados na raiz:
- `update_security.ts`: Sanitização de segredos no build.
- `update_frontend.js`: Configuração dinâmica de URLs da API.
