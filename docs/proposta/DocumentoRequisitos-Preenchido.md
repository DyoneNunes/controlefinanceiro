# CENTRO UNIVERSITÁRIO FAESA

## CURSO DE GRADUAÇÃO EM SISTEMAS DE INFORMAÇÃO

**DYONE ANDRADE**
**JULIA FERREIRA**
**(NOME DO ALUNO 3)**
**(NOME DO ALUNO 4)**
**(NOME DO ALUNO 5)**

---

# UM SISTEMA DE CONTROLE FINANCEIRO PESSOAL E FAMILIAR

**VITÓRIA**
**2026**

---

## Controle Financeiro – Especificação de Requisitos de Software

| Fornecedores | Clientes |
|---|---|
| Dyone Andrade | Dyone Andrade |
| Julia Ferreira | Julia Ferreira |
| (Aluno 3) | |
| (Aluno 4) | |
| (Aluno 5) | |

---

### Histórico de Revisões

| Versão | Data | Descrição das mudanças | Autor das mudanças |
|---|---|---|---|
| 01 | 10/02/2026 | Primeira versão | Dyone Andrade, Julia Ferreira |
| 02 | 15/03/2026 | Revisão com detalhamento de casos de uso e diagrama de classes | Dyone Andrade |

---

## Sumário

1. [Introdução](#1---introdução)
   - 1.1 [Visão geral do novo sistema proposto](#11---visão-geral-do-novo-sistema-proposto)
   - 1.2 [Descrição do Mini-Mundo](#12---descrição-do-mini-mundo)
   - 1.3 [Glossário](#13---glossário)
2. [Requisitos dos Usuários – Diagrama de Casos de Uso](#2---requisitos-dos-usuários--diagrama-de-casos-de-uso)
   - 2.1 [Descrições dos Casos de Uso](#21--descrições-dos-casos-de-uso)
3. [Projeto da Interface Humana do Sistema](#3--projeto-da-interface-humana-do-sistema)
4. [Diagrama de Classes](#4---diagrama-de-classes)
   - 4.1 [Dicionário de Dados](#41--dicionário-de-dados)
5. [Diagramas de Estado](#5---diagramas-de-estado)
6. [Requisitos Não Funcionais do Sistema](#6---requisitos-não-funcionais-do-sistema)
7. [Anexos](#7---anexos)

---

## 1 - Introdução

Este documento tem como objetivo definir e especificar os requisitos dos usuários e do Sistema **Controle Financeiro** que será desenvolvido para uso pessoal e familiar, visando centralizar e automatizar a gestão financeira de indivíduos e grupos (casais, famílias, projetos).

### 1.1 - Visão geral do novo sistema proposto

O sistema **Controle Financeiro** pretende resolver os seguintes problemas:

- **Fragmentação da informação financeira:** Atualmente, os usuários controlam suas finanças em planilhas e anotações dispersas, sem integração entre os dados de diferentes membros da família.
- **Falta de visibilidade sobre dívidas:** Contas vencidas se acumulam sem uma visão clara do montante total em atraso, levando a multas e juros desnecessários.
- **Ausência de orientação financeira:** Usuários comuns não possuem conhecimento suficiente para interpretar seus dados financeiros e tomar decisões estratégicas.
- **Gestão compartilhada ineficiente:** Casais e famílias não possuem ferramenta colaborativa com controle de permissões para registrar e visualizar movimentações.

**Objetivos do sistema:**
- Centralizar o registro de todas as movimentações financeiras (contas, receitas, investimentos, gastos) em uma única plataforma web.
- Fornecer dashboards inteligentes com cálculos automáticos de fluxo de caixa, regime de competência e dívidas acumuladas.
- Oferecer análise financeira automatizada via Inteligência Artificial (Google Gemini), com diagnóstico, alertas e recomendações de investimento.
- Permitir gestão multi-grupo com controle de acesso baseado em papéis (Administrador, Editor, Visualizador).

O sistema contribuirá para a organização financeira dos usuários ao automatizar cálculos, alertar sobre contas vencidas, consolidar informações de múltiplos membros e oferecer recomendações personalizadas baseadas em IA.

### 1.2 - Descrição do Mini-Mundo

O sistema de Controle Financeiro atende à área de gestão financeira pessoal e familiar. O processo de negócio funciona da seguinte forma:

Cada **usuário** do sistema possui credenciais de acesso (nome de usuário e senha). Após autenticação, o usuário acessa seus **grupos financeiros**. Um grupo financeiro é uma unidade isolada de controle que pode representar finanças pessoais, finanças de um casal, de uma família ou de um projeto específico. Cada grupo possui membros com diferentes papéis: o **Administrador** pode gerenciar o grupo (criar, editar, excluir, convidar membros); o **Editor** pode registrar e visualizar movimentações financeiras; o **Visualizador** pode apenas consultar os dados.

Dentro de cada grupo, os membros registram quatro tipos de movimentações financeiras:

1. **Contas a Pagar (Fixas):** Despesas recorrentes ou planejadas com nome, valor e data de vencimento. Cada conta possui um status que pode ser *pendente*, *pago* ou *vencido*. Quando uma conta é marcada como paga, a data de pagamento é registrada. Se a data de vencimento passa sem pagamento, o status muda automaticamente para *vencido*.

2. **Receitas/Entradas:** Todas as fontes de renda do grupo, registradas com descrição, valor e data de recebimento. Incluem salários, freelances, rendimentos e quaisquer outras entradas financeiras.

3. **Investimentos:** Aplicações financeiras registradas com nome, valor principal investido, percentual do CDI contratado, data de início e duração em meses. O sistema calcula automaticamente o rendimento esperado utilizando juros compostos baseados na taxa CDI anual de referência (13,65%).

4. **Gastos Variáveis:** Despesas não recorrentes ou eventuais, como alimentação fora de casa, compras, lazer e manutenção. São registrados com nome, valor e data, possuindo também controle de status (pendente/pago).

O **Dashboard** consolida todas essas informações em uma visão mensal e anual, calculando: o **Fluxo de Caixa** (receitas menos despesas efetivamente pagas no período), o regime de **Competência** (contas previstas para o mês, independente de pagamento) e o total de **Dívidas Acumuladas** (soma de todas as contas vencidas e não pagas). Gráficos interativos apresentam a distribuição de despesas por categoria (pizza) e a comparação receitas vs. despesas ao longo do tempo (barras).

O módulo de **Consultor IA** agrega todos os dados financeiros do grupo e os envia ao Google Gemini, que retorna uma análise estruturada contendo: diagnóstico da saúde financeira, pontos de atenção, estratégia de ação e recomendações de investimento. As consultas são armazenadas em cache (Redis, 24h) para otimizar custos e em banco de dados para histórico.

### 1.3 - Glossário

| Termo | Definição |
|---|---|
| **CDI** | Certificado de Depósito Interbancário — taxa de referência para investimentos de renda fixa no Brasil |
| **Fluxo de Caixa** | Regime de caixa: considera apenas as receitas recebidas e despesas efetivamente pagas no período |
| **Competência** | Regime de competência: considera as despesas previstas (devidas) no período, independente do pagamento |
| **Grupo Financeiro** | Unidade isolada de controle financeiro que agrupa membros com diferentes permissões |
| **Multi-tenancy** | Arquitetura que permite que múltiplos grupos utilizem o mesmo sistema com isolamento total de dados |
| **Dashboard** | Painel de controle consolidado com visão geral das finanças do grupo |

---

## 2 - Requisitos dos Usuários – Diagrama de Casos de Uso

### Atores do Sistema

O sistema Controle Financeiro possui os seguintes atores:

- **Usuário (Autenticado):** Qualquer pessoa com credenciais válidas no sistema. Pode realizar login e acessar os grupos dos quais é membro.
- **Administrador do Grupo:** Membro de um grupo com papel de administrador. Pode criar, editar e excluir o grupo, além de convidar novos membros. Possui todas as permissões de Editor.
- **Editor do Grupo:** Membro de um grupo com papel de editor. Pode cadastrar, visualizar e excluir contas, receitas, investimentos e gastos variáveis. Pode consultar o dashboard e o consultor IA.
- **Visualizador do Grupo:** Membro de um grupo com papel de visualizador. Pode apenas consultar os dados financeiros, dashboard e histórico de IA.

### Diagrama de Casos de Uso – Principal

```
+------------------------------------------------------------------+
|                     Sistema Controle Financeiro                   |
|                                                                   |
|  +------------------------+    +---------------------------+      |
|  | Subsistema Autenticação|    | Subsistema Grupos         |      |
|  +------------------------+    +---------------------------+      |
|                                                                   |
|  +------------------------+    +---------------------------+      |
|  | Subsistema Financeiro  |    | Subsistema Inteligência   |      |
|  +------------------------+    +---------------------------+      |
|                                                                   |
+------------------------------------------------------------------+
        |              |                |              |
    Usuário     Administrador       Editor       Visualizador
```

**Descrição de Caso de Uso**

| Campo | Valor |
|---|---|
| **Projeto** | Controle Financeiro |
| **Sub-Sistema** | — |
| **Nome do Caso de Uso** | Principal |
| **Analista** | Dyone Andrade |
| **Data** | 15/03/2026 |
| **Descrição** | Diagrama principal que organiza o sistema em quatro subsistemas: Autenticação, Grupos, Financeiro e Inteligência Artificial. |

---

### Diagrama de Casos de Uso – Subsistema Autenticação

```
+------------------------------------------+
|        Subsistema Autenticação            |
|                                           |
|    (Realizar Login)                       |
|    (Validar Sessão)                       |
|                                           |
+------------------------------------------+
         |
      Usuário
```

| Campo | Valor |
|---|---|
| **Projeto** | Controle Financeiro |
| **Sub-Sistema** | Principal |
| **Nome do Caso de Uso** | Subsistema Autenticação |
| **Analista** | Dyone Andrade |
| **Data** | 15/03/2026 |
| **Descrição** | Gerencia o processo de autenticação do usuário, incluindo login com credenciais e validação de sessão via token JWT. |

---

### Diagrama de Casos de Uso – Subsistema Grupos

```
+------------------------------------------+
|         Subsistema Grupos                 |
|                                           |
|    (Criar Grupo)                          |
|    (Editar Grupo)                         |
|    (Excluir Grupo)                        |
|    (Convidar Membro)                      |
|    (Listar Grupos)                        |
|    (Selecionar Grupo Ativo)               |
|                                           |
+------------------------------------------+
     |                    |
  Administrador        Editor/Visualizador
  (todos os casos)     (Listar e Selecionar)
```

| Campo | Valor |
|---|---|
| **Projeto** | Controle Financeiro |
| **Sub-Sistema** | Principal |
| **Nome do Caso de Uso** | Subsistema Grupos |
| **Analista** | Dyone Andrade |
| **Data** | 15/03/2026 |
| **Descrição** | Gerencia os grupos financeiros, incluindo criação, edição, exclusão, convite de membros e seleção do grupo ativo. |

---

### Diagrama de Casos de Uso – Subsistema Financeiro

```
+------------------------------------------+
|        Subsistema Financeiro              |
|                                           |
|    (Cadastrar Conta a Pagar)              |
|    (Cadastrar Receita)                    |
|    (Cadastrar Investimento)               |
|    (Cadastrar Gasto Variável)             |
|    (Visualizar Dashboard)                 |
|                                           |
+------------------------------------------+
     |                    |
   Editor            Visualizador
   (todos)           (Visualizar Dashboard)
```

| Campo | Valor |
|---|---|
| **Projeto** | Controle Financeiro |
| **Sub-Sistema** | Principal |
| **Nome do Caso de Uso** | Subsistema Financeiro |
| **Analista** | Dyone Andrade |
| **Data** | 15/03/2026 |
| **Descrição** | Gerencia todas as movimentações financeiras do grupo: contas a pagar, receitas, investimentos e gastos variáveis, além do dashboard consolidado. |

---

### Diagrama de Casos de Uso – Subsistema Inteligência Artificial

```
+------------------------------------------+
|     Subsistema Inteligência Artificial    |
|                                           |
|    (Consultar IA)                         |
|    (Consultar Histórico IA)               |
|                                           |
+------------------------------------------+
         |
    Editor / Visualizador
```

| Campo | Valor |
|---|---|
| **Projeto** | Controle Financeiro |
| **Sub-Sistema** | Principal |
| **Nome do Caso de Uso** | Subsistema Inteligência Artificial |
| **Analista** | Dyone Andrade |
| **Data** | 15/03/2026 |
| **Descrição** | Permite que os membros do grupo consultem o consultor de IA para análise financeira e acessem o histórico de consultas anteriores. |

---

## 2.1 – Descrições dos Casos de Uso

### Caso de Uso CRUD Completo: Cadastrar Conta a Pagar

---

**Descrição de Caso de Uso**

| Campo | Valor |
|---|---|
| **Projeto** | Controle Financeiro |
| **Sub-Sistema** | Subsistema Financeiro |
| **Nome do Caso de Uso** | Cadastrar Conta a Pagar |
| **Analista** | Dyone Andrade |
| **Data** | 15/03/2026 |
| **Descrição** | Permite ao editor do grupo incluir, consultar, alterar status (pagar) e excluir contas a pagar fixas. |

---

#### Caso de uso: Incluir Conta a Pagar

**Atores:** Editor do Grupo

**Pré-condições:**
- O usuário deve estar autenticado no sistema.
- O usuário deve ter selecionado um grupo financeiro ativo.
- O usuário deve possuir papel de Editor ou Administrador no grupo.

**Pós-condições:**
- Uma nova conta a pagar é registrada no banco de dados, associada ao grupo e ao usuário.
- A conta é criada com status "pendente".
- A lista de contas a pagar é atualizada automaticamente.

**Fluxo Principal:**
1. O usuário acessa o menu "Contas" na barra lateral do sistema.
2. O sistema exibe a lista de contas a pagar do grupo no mês/ano selecionado.
3. O usuário clica no botão "Nova Conta".
4. O sistema exibe o formulário de inclusão com os campos: Nome da Conta, Valor (R$) e Data de Vencimento.
5. O usuário preenche todos os campos obrigatórios.
6. O usuário clica no botão "Adicionar".
7. O sistema valida os dados informados (nome não vazio, valor positivo e finito, data válida).
8. O sistema registra a conta no banco de dados com status "pendente".
9. O sistema redireciona o usuário para a lista de contas, exibindo a nova conta incluída.

**Fluxos Alternativos:**

- **FA1 – Campos obrigatórios não preenchidos:** No passo 7, se algum campo obrigatório estiver vazio, o sistema exibe uma mensagem de erro indicando quais campos devem ser preenchidos. O usuário retorna ao passo 5.
- **FA2 – Valor inválido:** No passo 7, se o valor informado não for um número positivo e finito, o sistema exibe mensagem de erro "Valor deve ser um número positivo". O usuário retorna ao passo 5.
- **FA3 – Erro de comunicação:** No passo 8, se houver falha na comunicação com o servidor, o sistema exibe mensagem de erro e o usuário pode tentar novamente.

---

#### Caso de uso: Consultar Conta a Pagar

**Atores:** Editor do Grupo, Visualizador do Grupo

**Pré-condições:**
- O usuário deve estar autenticado no sistema.
- O usuário deve ter selecionado um grupo financeiro ativo.
- O usuário deve possuir papel de Editor, Administrador ou Visualizador no grupo.

**Pós-condições:**
- O sistema exibe a lista de contas a pagar do grupo no período selecionado.

**Fluxo Principal:**
1. O usuário acessa o menu "Contas" na barra lateral do sistema.
2. O sistema carrega automaticamente as contas a pagar do grupo ativo, filtradas pelo mês e ano atuais.
3. O sistema exibe uma lista com as colunas: Nome, Valor (formatado em R$), Vencimento, Status (pendente/pago/vencido).
4. Contas com status "vencido" são exibidas com destaque visual em vermelho.
5. As contas são ordenadas por data de vencimento (crescente).
6. O usuário pode navegar entre meses utilizando os botões de navegação (mês anterior / próximo mês).

**Fluxos Alternativos:**

- **FA1 – Nenhuma conta encontrada:** No passo 2, se não houver contas cadastradas para o período selecionado, o sistema exibe a mensagem "Nenhuma conta encontrada para este período".
- **FA2 – Erro ao carregar dados:** No passo 2, se houver falha de comunicação, o sistema exibe mensagem de erro e o usuário pode tentar recarregar a página.

---

#### Caso de uso: Alterar Conta a Pagar (Pagar Conta)

**Atores:** Editor do Grupo

**Pré-condições:**
- O usuário deve estar autenticado no sistema.
- O usuário deve ter selecionado um grupo financeiro ativo.
- O usuário deve possuir papel de Editor ou Administrador no grupo.
- A conta a pagar deve existir e ter status "pendente" ou "vencido".

**Pós-condições:**
- O status da conta é alterado para "pago".
- A data de pagamento é registrada com a data/hora atual.
- A lista de contas e o dashboard são atualizados automaticamente.

**Fluxo Principal:**
1. O usuário acessa o menu "Contas" na barra lateral do sistema.
2. O sistema exibe a lista de contas a pagar do grupo.
3. O usuário identifica a conta que deseja pagar.
4. O usuário clica no botão "Pagar" (ícone de check) ao lado da conta desejada.
5. O sistema envia a requisição de pagamento ao servidor, registrando a data de pagamento.
6. O sistema atualiza o status da conta para "pago" na lista.
7. O dashboard do grupo é recalculado automaticamente com os novos valores.

**Fluxos Alternativos:**

- **FA1 – Conta já paga:** No passo 4, se a conta já possuir status "pago", o botão "Pagar" não é exibido. Nenhuma ação é possível.
- **FA2 – Erro ao registrar pagamento:** No passo 5, se houver falha na comunicação, o sistema exibe mensagem de erro e mantém o status anterior da conta.

---

#### Caso de uso: Excluir Conta a Pagar

**Atores:** Editor do Grupo

**Pré-condições:**
- O usuário deve estar autenticado no sistema.
- O usuário deve ter selecionado um grupo financeiro ativo.
- O usuário deve possuir papel de Editor ou Administrador no grupo.
- A conta a pagar deve existir no grupo.

**Pós-condições:**
- A conta é removida permanentemente do banco de dados.
- A lista de contas e o dashboard são atualizados automaticamente.

**Fluxo Principal:**
1. O usuário acessa o menu "Contas" na barra lateral do sistema.
2. O sistema exibe a lista de contas a pagar do grupo.
3. O usuário identifica a conta que deseja excluir.
4. O usuário clica no botão "Excluir" (ícone de lixeira) ao lado da conta desejada.
5. O sistema envia a requisição de exclusão ao servidor.
6. O sistema remove a conta da lista exibida.
7. O dashboard do grupo é recalculado automaticamente.

**Fluxos Alternativos:**

- **FA1 – Erro ao excluir:** No passo 5, se houver falha na comunicação, o sistema exibe mensagem de erro e mantém a conta na lista.
- **FA2 – Conta não encontrada:** No passo 5, se a conta não existir mais no banco (excluída por outro membro), o sistema retorna erro 404 e atualiza a lista.

---

### Caso de Uso de Negócio (Somente Inclusão): Consultar Inteligência Artificial

---

**Descrição de Caso de Uso**

| Campo | Valor |
|---|---|
| **Projeto** | Controle Financeiro |
| **Sub-Sistema** | Subsistema Inteligência Artificial |
| **Nome do Caso de Uso** | Consultar Inteligência Artificial |
| **Analista** | Dyone Andrade |
| **Data** | 15/03/2026 |
| **Descrição** | Permite ao membro do grupo solicitar uma análise financeira automatizada via Google Gemini, que gera diagnóstico, alertas, estratégia e recomendações de investimento com base nos dados financeiros do grupo. |

---

#### Caso de uso: Incluir Consulta IA (Gerar Análise Financeira)

**Atores:** Editor do Grupo, Visualizador do Grupo

**Pré-condições:**
- O usuário deve estar autenticado no sistema.
- O usuário deve ter selecionado um grupo financeiro ativo.
- O grupo deve possuir ao menos algum dado financeiro cadastrado (contas, receitas, investimentos ou gastos).

**Pós-condições:**
- Uma análise financeira é gerada pelo Google Gemini contendo: diagnóstico, pontos de atenção, estratégia de ação e recomendações de investimento.
- A análise é armazenada em cache (Redis, TTL de 24 horas) para evitar consultas duplicadas.
- A análise é registrada no histórico de consultas IA do grupo (tabela `ai_advisor_history`).
- O resultado é exibido ao usuário em formato estruturado com markdown.

**Fluxo Principal:**
1. O usuário acessa o menu "Consultor IA" na barra lateral do sistema.
2. O sistema exibe a página do consultor IA com o botão "Gerar Nova Análise".
3. O usuário clica no botão "Gerar Nova Análise".
4. O sistema agrega automaticamente os dados financeiros do grupo: total de receitas mensais, lista de contas a pagar (com valores e status), gastos variáveis do mês e portfólio de investimentos.
5. O sistema gera um hash MD5 dos dados agregados para verificar se existe cache válido.
6. **[Se cache válido]:** O sistema recupera a análise do Redis e pula para o passo 9.
7. **[Se cache inválido/inexistente]:** O sistema envia os dados ao Google Gemini com prompt estruturado solicitando análise em formato JSON.
8. O Gemini retorna a análise contendo quatro seções: `diagnostico`, `pontos_atencao`, `estrategia` e `recomendacao_investimentos`.
9. O sistema armazena a análise no Redis (TTL 24h) e no banco de dados (tabela `ai_advisor_history`).
10. O sistema exibe a análise ao usuário em cards organizados por seção, com formatação markdown.

**Fluxos Alternativos:**

- **FA1 – Sem dados financeiros:** No passo 4, se o grupo não possuir nenhum dado financeiro cadastrado, o consultor gera uma análise genérica informando que não há dados suficientes para uma análise personalizada.
- **FA2 – Falha na API do Gemini:** No passo 7, se a API do Google Gemini estiver indisponível ou retornar erro, o sistema exibe mensagem de erro "Não foi possível gerar a análise. Tente novamente mais tarde."
- **FA3 – Falha no Redis:** No passo 5/9, se o Redis estiver indisponível, o sistema ignora o cache e consulta diretamente a API, registrando apenas no banco de dados.
- **FA4 – Análise em cache:** No passo 6, se existir análise em cache válida (menos de 24h e dados inalterados), o sistema exibe os dados do cache sem consultar a API novamente, otimizando custos.

---

## 3 – Projeto da Interface Humana do Sistema

### 3.1 – Tela de Login

```
+----------------------------------------------------------+
|                                                           |
|              CONTROLE FINANCEIRO                          |
|                                                           |
|         +--------------------------------+                |
|         |  Usuário                       |                |
|         |  [________________________]    |                |
|         |                                |                |
|         |  Senha                         |                |
|         |  [________________________]    |                |
|         |                                |                |
|         |  [       ENTRAR           ]    |                |
|         +--------------------------------+                |
|                                                           |
+----------------------------------------------------------+
```

### 3.2 – Página Principal (Dashboard) com Menu

```
+------+---------------------------------------------------+
| MENU |              DASHBOARD FINANCEIRO                  |
|------|---------------------------------------------------|
|      |  Grupo: [Família Andrade ▼]     Mar/2026 [<] [>]  |
| 🏠   |---------------------------------------------------|
| Dash |  +----------+ +----------+ +----------+ +-------+ |
|      |  | Receitas | | Fl.Caixa | | Competên | | Dívi- | |
| 📋   |  | R$ 8.500 | | R$ 3.200 | | R$ 5.300 | | R$ 0  | |
| Contas|  +----------+ +----------+ +----------+ +-------+ |
|      |                                                    |
| 💰   |  +-------------------+  +--------------------+    |
| Entr.|  | 🥧 Distribuição   |  | 📊 Receitas x Desp |    |
|      |  | de Despesas       |  |                    |    |
| 📈   |  |                   |  |                    |    |
| Inv. |  |  [gráfico pizza]  |  |  [gráfico barras]  |    |
|      |  |                   |  |                    |    |
| 🛒   |  +-------------------+  +--------------------+    |
| Gast.|                                                    |
|      |                                                    |
| 🤖   |                                                    |
| IA   |                                                    |
|      |                                                    |
| 👤   |                                                    |
| User |                                                    |
+------+---------------------------------------------------+
```

### 3.3 – Tela de Listar Contas a Pagar

```
+------+---------------------------------------------------+
| MENU |           CONTAS A PAGAR                           |
|------|---------------------------------------------------|
|      |  Mar/2026  [< Anterior]  [Próximo >]              |
|      |                                                    |
|      |  [+ Nova Conta]                                   |
|      |                                                    |
|      |  +----------------------------------------------+ |
|      |  | Nome        | Valor     | Vencimento | Status| |
|      |  |-------------|-----------|------------|-------| |
|      |  | Aluguel     | R$ 1.500  | 05/03/2026 | Pago  | |
|      |  | Energia     | R$ 280,00 | 10/03/2026 | Pend. | |
|      |  | Internet    | R$ 120,00 | 15/03/2026 | Pend. | |
|      |  | Cartão      | R$ 2.400  | 20/03/2026 | Pend. | |
|      |  +----------------------------------------------+ |
|      |                                                    |
|      |  Cada linha possui botões: [✓ Pagar] [🗑 Excluir] |
+------+---------------------------------------------------+
```

### 3.4 – Tela de Incluir Conta a Pagar

```
+------+---------------------------------------------------+
| MENU |           NOVA CONTA A PAGAR                       |
|------|---------------------------------------------------|
|      |                                                    |
|      |  Nome da Conta                                    |
|      |  [_________________________________________]      |
|      |                                                    |
|      |  Valor (R$)                                       |
|      |  [_________________________________________]      |
|      |                                                    |
|      |  Data de Vencimento                               |
|      |  [_________________________________________]      |
|      |                                                    |
|      |  [    ADICIONAR    ]     [  CANCELAR  ]           |
|      |                                                    |
+------+---------------------------------------------------+
```

### 3.5 – Tela de Consultar IA (Caso de uso de negócio principal – Inclusão)

```
+------+---------------------------------------------------+
| MENU |           CONSULTOR FINANCEIRO IA                  |
|------|---------------------------------------------------|
|      |                                                    |
|      |  [🔄 Gerar Nova Análise]   [📋 Ver Histórico]     |
|      |                                                    |
|      |  +----------------------------------------------+ |
|      |  | 📊 DIAGNÓSTICO                               | |
|      |  | Sua saúde financeira está equilibrada...      | |
|      |  +----------------------------------------------+ |
|      |                                                    |
|      |  +----------------------------------------------+ |
|      |  | ⚠️ PONTOS DE ATENÇÃO                          | |
|      |  | - Gastos com alimentação acima da média...    | |
|      |  | - Conta de cartão representa 45% das desp... | |
|      |  +----------------------------------------------+ |
|      |                                                    |
|      |  +----------------------------------------------+ |
|      |  | 🎯 ESTRATÉGIA                                 | |
|      |  | 1. Reduzir gastos variáveis em 15%...         | |
|      |  | 2. Renegociar plano de internet...            | |
|      |  +----------------------------------------------+ |
|      |                                                    |
|      |  +----------------------------------------------+ |
|      |  | 💰 RECOMENDAÇÕES DE INVESTIMENTO               | |
|      |  | - Alocar 20% do saldo em CDB 110% CDI...     | |
|      |  | - Manter reserva de emergência de 6 meses... | |
|      |  +----------------------------------------------+ |
|      |                                                    |
+------+---------------------------------------------------+
```

---

## 4 - Diagrama de Classes

```
+------------------+       1     *  +-------------------+
|     Usuario      |───────────────|   MembroGrupo      |
+------------------+               +-------------------+
| - id: UUID       |               | - id: UUID        |
| - username: str  |               | - papel: str      |
| - passwordHash:  |               | - dataEntrada: dt |
|   str            |               +-------------------+
| - criadoEm: dt   |                    |  *
+------------------+                    |
                                        | 1
+------------------+       1     *  +-------------------+
|  GrupoFinanceiro |───────────────|   MembroGrupo      |
+------------------+               +-------------------+
| - id: UUID       |
| - nome: str      |
| - criadoEm: dt   |
+------------------+
      | 1
      |
      |     *
+------------------+
|  ContaPagar      |
+------------------+       +-------------------+
| - id: UUID       |       |    Receita        |
| - nome: str      |       +-------------------+
| - valor: decimal |       | - id: UUID        |
| - dataVenc: date |       | - descricao: str  |
| - status: str    |       | - valor: decimal  |
| - dataPgto: dt   |       | - data: date      |
| - userId: UUID   |       | - userId: UUID    |
| - groupId: UUID  |       | - groupId: UUID   |
+------------------+       +-------------------+
                                    | *
      | *                          |
      |                      1 |
+------------------+    +-------------------+
|  GastoVariavel   |    | GrupoFinanceiro   |
+------------------+    +-------------------+
| - id: UUID       |           | 1
| - nome: str      |           |
| - valor: decimal |           |     *
| - data: date     |    +-------------------+
| - status: str    |    |  Investimento     |
| - dataPgto: dt   |    +-------------------+
| - userId: UUID   |    | - id: UUID        |
| - groupId: UUID  |    | - nome: str       |
+------------------+    | - valorInicial:   |
                         |   decimal         |
      | *               | - cdiPercent:     |
      |                  |   decimal         |
 1 |                | - dataInicio: date|
+------------------+    | - duracaoMeses:   |
| GrupoFinanceiro  |    |   int             |
+------------------+    | - userId: UUID    |
                         | - groupId: UUID   |
                         +-------------------+

+-------------------+
| HistoricoIA       |
+-------------------+        * |
| - id: UUID        |          |
| - geradoEm: dt    |     1 |
| - resumoInput: str|    +-------------------+
| - saídaAdvice:    |    | GrupoFinanceiro   |
|   JSON            |    +-------------------+
| - userId: UUID    |
| - groupId: UUID   |
+-------------------+
```

### Associações e Cardinalidades

- **Usuario** 1 --- * **MembroGrupo**: Um usuário pode ser membro de vários grupos.
- **GrupoFinanceiro** 1 --- * **MembroGrupo**: Um grupo pode ter vários membros.
- **GrupoFinanceiro** 1 --- * **ContaPagar**: Um grupo possui várias contas a pagar.
- **GrupoFinanceiro** 1 --- * **Receita**: Um grupo possui várias receitas.
- **GrupoFinanceiro** 1 --- * **Investimento**: Um grupo possui vários investimentos.
- **GrupoFinanceiro** 1 --- * **GastoVariavel**: Um grupo possui vários gastos variáveis.
- **GrupoFinanceiro** 1 --- * **HistoricoIA**: Um grupo possui várias consultas ao histórico de IA.
- **Usuario** 1 --- * **ContaPagar**: Um usuário registra várias contas (dentro do contexto do grupo).
- **Usuario** 1 --- * **Receita**: Um usuário registra várias receitas.
- **Usuario** 1 --- * **Investimento**: Um usuário registra vários investimentos.
- **Usuario** 1 --- * **GastoVariavel**: Um usuário registra vários gastos variáveis.
- **Usuario** 1 --- * **HistoricoIA**: Um usuário realiza várias consultas IA.

---

## 4.1 – Dicionário de Dados

### Classe: Usuario

| Atributo | Obrigatoriedade (S/N) | Descrição | Valores Possíveis |
|---|---|---|---|
| id | S | Identificador único do usuário (UUID gerado automaticamente) | — |
| username | S | Nome de usuário para login, deve ser único no sistema | — |
| passwordHash | S | Hash bcrypt da senha do usuário (10 salt rounds) | — |
| criadoEm | S | Data e hora de criação do registro (gerado automaticamente) | — |

### Classe: GrupoFinanceiro

| Atributo | Obrigatoriedade (S/N) | Descrição | Valores Possíveis |
|---|---|---|---|
| id | S | Identificador único do grupo (UUID) | — |
| nome | S | Nome do grupo financeiro | — |
| criadoEm | S | Data e hora de criação do grupo | — |

### Classe: MembroGrupo

| Atributo | Obrigatoriedade (S/N) | Descrição | Valores Possíveis |
|---|---|---|---|
| id | S | Identificador único da associação membro-grupo (UUID) | — |
| papel | S | Papel/permissão do membro dentro do grupo | admin, editor, viewer |
| dataEntrada | S | Data e hora em que o membro ingressou no grupo | — |

### Classe: ContaPagar

| Atributo | Obrigatoriedade (S/N) | Descrição | Valores Possíveis |
|---|---|---|---|
| id | S | Identificador único da conta (UUID) | — |
| nome | S | Nome/descrição da conta a pagar | — |
| valor | S | Valor monetário da conta em Reais (deve ser positivo e finito) | — |
| dataVencimento | S | Data de vencimento da conta | — |
| status | S | Situação atual da conta | pending, paid, overdue |
| dataPagamento | N | Data e hora em que a conta foi paga (preenchido ao pagar) | — |
| userId | S | Referência ao usuário que registrou a conta | — |
| groupId | S | Referência ao grupo financeiro ao qual a conta pertence | — |

### Classe: Receita

| Atributo | Obrigatoriedade (S/N) | Descrição | Valores Possíveis |
|---|---|---|---|
| id | S | Identificador único da receita (UUID) | — |
| descricao | S | Descrição da fonte de receita (ex: salário, freelance) | — |
| valor | S | Valor monetário da receita em Reais | — |
| data | S | Data de recebimento da receita | — |
| userId | S | Referência ao usuário que registrou a receita | — |
| groupId | S | Referência ao grupo financeiro | — |

### Classe: Investimento

| Atributo | Obrigatoriedade (S/N) | Descrição | Valores Possíveis |
|---|---|---|---|
| id | S | Identificador único do investimento (UUID) | — |
| nome | S | Nome/descrição do investimento | — |
| valorInicial | S | Valor principal investido em Reais | — |
| cdiPercent | S | Percentual do CDI contratado (ex: 110 para 110% do CDI) | — |
| dataInicio | S | Data de início da aplicação | — |
| duracaoMeses | S | Duração do investimento em meses | — |
| userId | S | Referência ao usuário que registrou o investimento | — |
| groupId | S | Referência ao grupo financeiro | — |

### Classe: GastoVariavel

| Atributo | Obrigatoriedade (S/N) | Descrição | Valores Possíveis |
|---|---|---|---|
| id | S | Identificador único do gasto (UUID) | — |
| nome | S | Nome/descrição do gasto variável | — |
| valor | S | Valor monetário do gasto em Reais | — |
| data | S | Data do gasto | — |
| status | S | Situação atual do gasto | pending, paid, overdue |
| dataPagamento | N | Data e hora em que o gasto foi pago | — |
| userId | S | Referência ao usuário que registrou o gasto | — |
| groupId | S | Referência ao grupo financeiro | — |

### Classe: HistoricoIA

| Atributo | Obrigatoriedade (S/N) | Descrição | Valores Possíveis |
|---|---|---|---|
| id | S | Identificador único da consulta IA (UUID) | — |
| geradoEm | S | Data e hora em que a análise foi gerada | — |
| resumoInput | S | Resumo dos dados financeiros enviados para análise | — |
| saidaAdvice | S | Resultado da análise em formato JSON (diagnóstico, pontos de atenção, estratégia, recomendações) | — |
| userId | S | Referência ao usuário que solicitou a análise | — |
| groupId | S | Referência ao grupo financeiro analisado | — |

---

## 5 - Diagramas de Estado

### Diagrama de Estado: Conta a Pagar

A classe **ContaPagar** possui comportamento dependente no tempo, pois seu status muda com base na data de vencimento e na ação do usuário.

```
                    +------------------+
                    |                  |
          Criar     v                  |
  [*] ──────────> PENDENTE             |
                    |                  |
                    |                  |
          +---------+---------+        |
          |                   |        |
  vencimento < hoje    Usuário paga    |
  (automático)         (ação manual)   |
          |                   |        |
          v                   v        |
      VENCIDO              PAGO        |
          |                 [*]        |
          |                            |
    Usuário paga                       |
    (ação manual)                      |
          |                            |
          v                            |
        PAGO                           |
         [*]                           |
```

**Estados:**

| Estado | Descrição | Transição |
|---|---|---|
| **Pendente** | Conta criada, aguardando pagamento antes do vencimento | Estado inicial ao criar uma conta |
| **Vencido** | Data de vencimento passou sem que a conta tenha sido paga | Transição automática quando `dataVencimento < dataAtual` e conta não paga |
| **Pago** | Conta foi paga pelo usuário | Transição manual quando o usuário marca como paga (a partir de Pendente ou Vencido) |

**Regra de determinação de status (calculada em tempo real):**
```
Se dataPagamento existe → status = "pago"
Se dataVencimento < hoje E dataPagamento não existe → status = "vencido"
Caso contrário → status = "pendente"
```

### Diagrama de Estado: Gasto Variável

```
          Criar
  [*] ──────────> PAGO (status padrão)
                    [*]

          Criar (com status pendente)
  [*] ──────────> PENDENTE
                    |
              Usuário paga
                    |
                    v
                  PAGO
                   [*]
```

**Estados:**

| Estado | Descrição | Transição |
|---|---|---|
| **Pago** | Gasto variável já pago (estado padrão na criação) | Estado inicial padrão |
| **Pendente** | Gasto registrado mas ainda não pago | Estado inicial alternativo |

---

## 6 - Requisitos Não Funcionais do Sistema

### 6.1 - Requisitos de Interfaces Externas

#### 6.1.1 - Interface com o Usuário

6.1.1.1 - O sistema deve apresentar interface gráfica responsiva, desenvolvida em React com Tailwind CSS, adaptável a dispositivos desktop e mobile.

6.1.1.2 - O sistema deve exibir mensagens de erro claras para condições de falha (autenticação inválida, campos obrigatórios, erros de comunicação).

6.1.1.3 - O sistema deve apresentar valores monetários formatados no padrão brasileiro (R$ X.XXX,XX).

6.1.1.4 - O sistema deve utilizar cores e ícones intuitivos para indicar status de contas (vermelho para vencido, verde para pago).

#### 6.1.2 - Interface com outros Sistemas

6.1.2.1 - O sistema deve integrar-se com a API do Google Gemini (modelo Flash) para geração de análises financeiras via inteligência artificial.

6.1.2.2 - O sistema deve integrar-se com o Redis para cache de respostas da IA, com TTL de 24 horas.

#### 6.1.3 - Interfaces de Comunicação

6.1.3.1 - O sistema deve suportar comunicação via protocolo HTTPS na Internet.

6.1.3.2 - A API REST do backend deve utilizar formato JSON para troca de dados.

6.1.3.3 - O sistema deve utilizar o header `X-Group-ID` para identificação do grupo financeiro ativo em todas as requisições de dados financeiros.

### 6.2 - Restrições de Projeto

#### 6.2.1 - Limitações de Hardware

6.2.1.1 - O sistema será executado em ambiente containerizado (Docker), podendo ser hospedado em qualquer servidor com suporte a Docker (mínimo 2GB RAM, 10GB disco).

#### 6.2.2 - Limitações de Software

6.2.2.1 - **Frontend:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS 3.
6.2.2.2 - **Backend:** Node.js 20+, Express.js.
6.2.2.3 - **Banco de Dados:** PostgreSQL 16.
6.2.2.4 - **Cache:** Redis.
6.2.2.5 - **Containerização:** Docker e Docker Compose.

### 6.3 - Requisitos de Desempenho

6.3.1 - O sistema deve responder às requisições da API em no máximo 3 segundos para operações CRUD.

6.3.2 - O sistema deve retornar análises de IA em cache em menos de 1 segundo.

6.3.3 - O sistema deve suportar consultas simultâneas de múltiplos membros do mesmo grupo sem degradação perceptível de desempenho.

### 6.4 - Requisitos de Segurança

6.4.1 - O sistema deve autenticar usuários via token JWT com expiração de 8 horas.

6.4.2 - As senhas dos usuários devem ser armazenadas como hash bcrypt com 10 salt rounds, nunca em texto plano.

6.4.3 - O sistema deve validar que o usuário é membro do grupo em todas as operações financeiras, garantindo isolamento total de dados entre grupos.

6.4.4 - O sistema deve utilizar Helmet.js para configuração de headers de segurança (CSP, HSTS, etc.).

6.4.5 - O sistema deve validar UUIDs e valores numéricos em todas as entradas para prevenir injeção de dados maliciosos.

### 6.5 - Requisitos de Manutenibilidade

6.5.1 - O sistema deve ser codificado em TypeScript (frontend) e JavaScript (backend), linguagens de alto nível que facilitam a manutenção.

6.5.2 - O sistema deve utilizar Docker Compose para facilitar a reprodução do ambiente de desenvolvimento e produção.

6.5.3 - O sistema deve possuir pipeline de CI/CD automatizado via GitHub Actions para deploy contínuo.

---

## 7 - Anexos

### Anexo A – Relatório de Entrevista

Ver documento: [RelatorioEntrevista-Preenchido.md](RelatorioEntrevista-Preenchido.md)

### Anexo B – Tecnologias Utilizadas

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | React | 19.2 |
| Frontend | TypeScript | 5.9 |
| Frontend | Tailwind CSS | 3.4 |
| Frontend | Recharts | 3.6 |
| Frontend | React Router DOM | 6.30 |
| Backend | Node.js | 20+ |
| Backend | Express.js | — |
| Banco de Dados | PostgreSQL | 16 |
| Cache | Redis | — |
| IA | Google Gemini Flash | — |
| Infra | Docker / Docker Compose | — |
| CI/CD | GitHub Actions | — |
| VPN | Tailscale | — |

---

*Profa. Denise Franzotti Togneri*
