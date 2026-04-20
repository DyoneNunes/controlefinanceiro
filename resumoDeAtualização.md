# Resumo de Atualizacoes — Controle Financeiro

Registro de todas as alteracoes realizadas desde o ultimo commit enviado ao GitHub (`54e599e`).

Organizado em duas categorias:
- **Parte 1 — Funcionalidades do Sistema**: novos recursos, endpoints, migrações e lógica de negócio
- **Parte 2 — Usabilidade e Experiência do Usuário**: melhorias visuais, interações e navegação

---

# PARTE 1 — FUNCIONALIDADES DO SISTEMA

---

## 1. Parcelamento de Contas Fixas

**Modulo:** Contas Fixas (Bills)

Implementacao da funcionalidade de parcelamento de contas, permitindo ao usuario dividir uma conta em multiplas parcelas mensais.

### O que foi feito:
- Criado componente `InstallmentModal.tsx` — modal para o usuario selecionar a quantidade de parcelas (2 a 48)
- Adicionados campos `installmentNumber`, `installmentTotal` e `installmentGroup` ao tipo `Bill`
- Implementada logica no backend para criar N registros com datas de vencimento consecutivas (mes a mes)
- Cada parcela recebe um badge visual (ex: `1/10`, `2/10`) na tabela e nos cards mobile
- Calculo inteligente de valor por parcela com correcao de centavos na ultima parcela
- Toda a criacao respeita a arquitetura de criptografia de ponta a ponta (E2EE)
- Botao "Parcelar" adicionado ao menu de acoes (aparece apenas para contas nao pagas e sem parcela existente)
- Soft-delete da conta original apos parcelamento (dentro de transacao)

### Banco de dados:
- `init-scripts/12-installments.sql` — **[NOVO]** — Adiciona colunas `installment_group`, `installment_number`, `installment_total` + indice

### Arquivos modificados:
- `src/components/InstallmentModal.tsx` — **[NOVO]**
- `src/components/BillList.tsx` — menu de acoes + badge de parcela
- `src/context/FinanceContext.tsx` — funcao `createInstallments`
- `src/types/index.ts` — campos de parcelamento no tipo `Bill`
- `server/controllers/billController.js` — endpoint `createInstallments` com transacao
- `server/routes/billRoutes.js` — rota `POST /:id/installments`

---

## 2. Status e Recebimento de Entradas

**Modulo:** Entradas (Incomes)

Implementacao completa de controle de status (Pendente/Recebido) para entradas, com funcionalidade de "Marcar como Recebido".

### O que foi feito:
- **Banco de dados:** Migracao SQL adicionando colunas `status` e `received_date` a tabela `incomes`
- **Backend:** Criado endpoint `PATCH /api/finance/incomes/:id/receive` para marcar entrada como recebida
- **Frontend — Menu de acoes:** Substituicao do botao "Apagar Entrada" por menu dropdown com 3 opcoes:
  - Marcar como Recebido — registra data/hora do recebimento
  - Editar Entrada — abre formulario de edicao
  - Cancelar Entrada — soft delete (substituiu o antigo "Apagar")
- **Badge de status:** Exibicao visual de "Pendente" (amarelo) ou "Recebido" (verde)
- **Coluna "Data de Recebimento":** Exibe a data/hora exata do recebimento

### Banco de dados:
- `init-scripts/13-income-status.sql` — **[NOVO]** — Adiciona colunas `status` e `received_date`

### Arquivos modificados:
- `src/types/index.ts` — campos `status`, `receivedDate` e `createdAt` em Income
- `server/controllers/financeController.js` — `getIncomes` (novos campos) e `markIncomeAsReceived` **[NOVO]**
- `server/routes/financeRoutes.js` — rota `PATCH /incomes/:id/receive`
- `src/context/FinanceContext.tsx` — funcoes `markIncomeAsReceived` e `updateIncome`
- `src/components/IncomeList.tsx` — menu de acoes, badges, coluna de recebimento

---

## 3. Edicao de Entradas e Gastos Variaveis

**Modulo:** Entradas (Incomes) e Gastos Variaveis (Random Expenses)

Funcionalidade de edicao inline para registros existentes, sem necessidade de deletar e recriar.

### O que foi feito:
- **IncomeForm** atualizado para suportar modo de edicao (`income` prop opcional)
  - Titulo e botao mudam para "Editar Entrada" / "Salvar Alteracoes"
  - Seletor de carteira oculto no modo edicao (nao pode trocar de grupo)
  - Campos pre-preenchidos com dados do registro existente
- **RandomExpenseForm** atualizado para suportar modo de edicao (`expense` prop opcional)
  - Cor de destaque muda para azul no modo edicao (vs. laranja para novo)
  - Seletor de carteira oculto no modo edicao
  - Campos pre-preenchidos com dados do registro existente
- **Backend:** Funcoes `updateIncome` e `updateRandomExpense` no FinanceContext com suporte completo a E2EE

### Arquivos modificados:
- `src/components/IncomeForm.tsx` — modo edicao
- `src/components/RandomExpenseForm.tsx` — modo edicao
- `src/context/FinanceContext.tsx` — funcoes `updateIncome` e `updateRandomExpense`

---

## 4. Cancelamento de Pagamento de Gastos Variaveis

**Modulo:** Gastos Variaveis (Random Expenses)

Permite reverter o status de "Pago" para "Pendente" em gastos variaveis.

### O que foi feito:
- Opcao "Desfazer Pagamento" no menu de acoes (aparece apenas para gastos ja pagos)
- Envia `PUT` com `{ status: 'pending' }` para o backend
- Funcao `cancelRandomExpensePayment` no FinanceContext

### Arquivos modificados:
- `src/context/FinanceContext.tsx` — funcao `cancelRandomExpensePayment`
- `src/components/RandomExpenseList.tsx` — opcao no menu de acoes

---

## 5. Soft Deletes (Cancelamentos)

**Modulo:** Todos (Bills, Incomes, Investments, Random Expenses)

Transicao de hard deletes para soft deletes em todos os modulos financeiros, garantindo retencao de dados para auditoria.

### O que foi feito:
- Registros cancelados sao mantidos no banco com campo `deleted_at` preenchido
- Queries de listagem filtram `WHERE deleted_at IS NULL`
- Registros cancelados nao aparecem na UI ativa nem afetam calculos financeiros
- Botoes "Apagar/Deletar" renomeados para "Cancelar" em todas as telas
- Mensagens de confirmacao atualizadas
- Icones trocados de `Trash2` para `XCircle` em todas as telas

### Banco de dados:
- `init-scripts/10-soft-delete.sql` — **[NOVO]** — Adiciona `deleted_at` em bills, incomes, investments e random_expenses

### Arquivos modificados:
- `server/controllers/billController.js` — `deleteBill` usa `UPDATE SET deleted_at`, `getBills` filtra `deleted_at IS NULL`
- `server/controllers/financeController.js` — mesma logica para incomes, investments e random_expenses
- `src/components/BillList.tsx` — icone e texto atualizados
- `src/components/IncomeList.tsx` — icone e texto atualizados
- `src/components/InvestmentList.tsx` — icone e texto atualizados
- `src/components/RandomExpenseList.tsx` — icone e texto atualizados

---

## 6. Compatibilidade E2EE: Remocao de NOT NULL

**Modulo:** Banco de Dados / E2EE

Quando a criptografia E2EE esta ativa, os campos sensiveis (name, value) sao movidos para `encrypted_data`. Os campos em texto plano passam a receber `NULL`.

### O que foi feito:
- Removida constraint `NOT NULL` dos campos de texto plano que agora podem ser nulos com E2EE ativo

### Banco de dados:
- `init-scripts/11-drop-not-null-e2ee.sql` — **[NOVO]** — Remove NOT NULL de `bills.name`, `incomes.description`, `investments.name`, `random_expenses.name`

---

## 7. Persistencia da MEK no Session Storage (E2EE)

**Modulo:** Criptografia / E2EE

Resolve o problema de perder acesso aos dados criptografados ao dar refresh na pagina.

### O que foi feito:
- **Persistencia:** A MEK (Master Encryption Key) e exportada para `sessionStorage` em Base64 apos cada inicializacao
- **Restauracao:** Ao fazer refresh, o `AuthContext` chama `restoreCrypto()` que reimporta a MEK do `sessionStorage`
- **Seguranca:** O `sessionStorage` e limpo automaticamente ao fechar a aba/janela e e protegido pela same-origin policy
- **Logout:** MEK removida do `sessionStorage` junto com o token JWT

### Funcoes criadas:
- `persistMek()` — exporta CryptoKey para Base64 e salva em sessionStorage
- `loadPersistedMek()` — reimporta Base64 como CryptoKey AES-256-GCM
- `restoreCrypto()` — tenta restaurar a MEK sem necessidade da senha

### Arquivos modificados:
- `src/context/CryptoContext.tsx` — persistencia/restauracao da MEK
- `src/context/AuthContext.tsx` — chama `restoreCrypto()` na validacao de sessao

---

## 8. Atualizacao dos Calculos do Dashboard

**Modulo:** Dashboard

Re-engenharia dos calculos financeiros do dashboard para maior precisao, incluindo separacao granular entre contas fixas e variaveis.

### O que foi feito:
- **Saldo do Mes:** Receita - Ja Pago - Investimento (investimento limitado a nao tornar o saldo negativo)
- **Ja Pago:** Consolidado de contas fixas pagas + gastos variaveis pagos (com sub-breakdown visivel)
- **Total a Pagar:** Pendentes + atrasadas de contas fixas E gastos variaveis
- **Dinheiro Livre:** Receita - Todas as contas fixas (pagas + pendentes + vencidas) - Todos os gastos variaveis - Investimentos
- **Contadores:** `pendingCount`, `overdueCount` e `paidCount` agora somam fixas + variaveis
- Novos campos no stats: `billsPaidTotal`, `randomPaidTotal`, `billsPendingTotal`, `randomPendingTotal`, `billsOverdueTotal`, `randomOverdueTotal`, `investmentDeduction`

### Arquivos modificados:
- `src/components/Dashboard.tsx` — novos calculos e labels
- `src/components/DashboardCardModal.tsx` — modais separando fixas/variaveis

---

## 9. Notificacoes por E-mail Automatizadas

**Modulo:** Backend — Servico de E-mails

Implementacao de dois sistemas de notificacao por e-mail automatizados via cron jobs.

### 9.1 Lembrete de Contas Proximas do Vencimento

- **Frequencia:** Diario as 08:00 (horario de Brasilia)
- **Regra:** Busca contas pendentes ou atrasadas com vencimento nos proximos 3 dias (ou vencidas nos ultimos 3 dias)
- **Conteudo do e-mail:**
  - Tabela com descricao, valor, data de vencimento e status (Pendente/Atrasado)
  - Total consolidado de todas as contas listadas
  - Botao "Ver minhas contas" com link direto para a aplicacao
- **Filtros:** So envia para usuarios com e-mail cadastrado e que possuam contas elegiveis

### 9.2 Resumo Financeiro Mensal

- **Frequencia:** Dia 1 de cada mes as 09:00 (horario de Brasilia)
- **Regra:** Compila dados do mes anterior de todas as carteiras do usuario
- **Conteudo do e-mail:**
  - 3 cards visuais: Total de Entradas, Total de Contas, Total de Gastos Variaveis (com contagem de itens)
  - Secao "Status de Pagamentos": valores ja pagos, pendentes e atrasados
  - Botao "Ver meu dashboard" com link direto
- **Filtros:** So envia se o usuario teve pelo menos uma movimentacao no mes

### Disparo Manual (Admin)

Duas rotas administrativas para disparo manual (testes):
- `POST /api/admin/email/bill-reminder` — Dispara verificacao de contas imediatamente
- `POST /api/admin/email/monthly-summary` — Dispara resumo mensal imediatamente

### Arquivos criados:
- `server/services/schedulerService.js` — **[NOVO]** — Cron jobs com `node-cron`

### Arquivos modificados:
- `server/services/emailService.js` — 2 novos templates: `sendBillDueReminder` e `sendMonthlySummary`
- `server/routes/adminRoutes.js` — 2 rotas de disparo manual
- `server/index.js` — Inicializacao do scheduler no boot do servidor
- `server/package.json` — Dependencia `node-cron` adicionada

---

## 10. Correcao da Redefinicao de Senha

**Modulo:** Autenticacao / Backend

Melhoria de robustez na funcao de reset de senha via link enviado por e-mail.

### O que foi feito:
- **Backend:** Operacoes de `UPDATE users` e `UPDATE password_reset_tokens` agora rodam dentro de uma **transacao** (`BEGIN/COMMIT/ROLLBACK`) para garantir atomicidade
- **Backend:** Logging de erro adicionado com `console.error` para facilitar debugging
- **Backend:** Mensagem de erro mais clara para o usuario ("Erro ao redefinir senha. Tente novamente.")
- **Frontend:** `res.json()` agora usa `.catch(() => null)` para tratar respostas nao-JSON (ex: pagina 502 do Nginx)
- **Frontend:** Validacao explicita de tamanho minimo da senha (4 caracteres) antes da chamada a API

### Arquivos modificados:
- `server/controllers/authController.js` — transacao no `resetPassword`
- `src/components/ResetPassword.tsx` — tratamento de erro melhorado

---

## 11. Configuracao do Gemini (Limpeza)

**Modulo:** Backend / IA

Normalizacao de formatacao no arquivo de configuracao do Gemini.

### O que foi feito:
- Whitespace normalizado (tabs misturados com espacos removidos)
- Sem alteracao de logica

### Arquivos modificados:
- `server/config/geminiConfig.js` — limpeza de formatacao

---

# PARTE 2 — USABILIDADE E EXPERIENCIA DO USUARIO

---

## 12. Menu de Acoes com Dropdown

**Modulo:** Contas Fixas, Gastos Variaveis, Entradas

Substituicao dos botoes de acao individuais (Pagar, Excluir) por um menu dropdown contextual mais organizado.

### O que foi feito:
- Icone de tres pontos verticais (`MoreVertical`) como trigger do menu
- Menu abre como dropdown flutuante com opcoes contextuais por tipo de registro:
  - **Contas Fixas:** Marcar como Pago | Parcelar | Cancelar Conta
  - **Gastos Variaveis:** Confirmar Pagamento | Editar | Desfazer Pagamento | Cancelar Gasto
  - **Entradas:** Marcar como Recebido | Editar | Cancelar Entrada
- Menu fecha ao clicar fora (via `mousedown` listener)
- Opcoes mudam dinamicamente conforme o status do registro (ex: "Parcelar" nao aparece se a conta ja esta paga)
- Funciona tanto no desktop (tabela) quanto no mobile (cards)

### Arquivos modificados:
- `src/components/BillList.tsx`
- `src/components/RandomExpenseList.tsx`
- `src/components/IncomeList.tsx`

---

## 13. Ordenacao por Coluna (Sortable Headers)

**Modulo:** Contas Fixas, Gastos Variaveis, Entradas

Implementacao de ordenacao interativa nas colunas das tabelas. O usuario clica no cabecalho de uma coluna para ordenar os dados.

### O que foi feito:
- **Hook reutilizavel** `useSortableTable<T>` — gerencia estado de ordenacao (coluna ativa + direcao asc/desc)
  - Suporta 4 tipos de comparacao: `string` (localeCompare pt-BR), `number`, `date` (ISO parse), `status` (prioridade mapeada)
  - Aceita `getValue` customizado para resolver valores derivados (ex: groupId → nome do grupo)
- **Componente** `SortableHeader` — `<th>` clicavel com icone de seta (asc/desc)
  - Seta azul visivel apenas na coluna ativa
  - Cursor pointer e hover sutil
  - Coluna "Acoes" nao e sortavel

### Colunas sortaveis por tela:

| Tela | Colunas |
|------|---------|
| Contas Fixas | Descricao, Grupo, Vencimento, Valor, Status, Data do Pagamento |
| Gastos Variaveis | Descricao, Grupo, Data, Valor, Status, Data do Pagamento |
| Entradas | Descricao, Grupo, Data, Valor, Status, Data de Recebimento |

### Comportamento:
- **1o clique:** ordena ascendente (menor → maior / mais antigo → mais novo)
- **2o clique:** inverte para descendente
- Funciona tanto na tabela desktop quanto nos cards mobile (dados sao ordenados antes de renderizar)

### Arquivos criados:
- `src/hooks/useSortableTable.ts` — **[NOVO]**
- `src/components/SortableHeader.tsx` — **[NOVO]**

### Arquivos modificados:
- `src/components/BillList.tsx`
- `src/components/RandomExpenseList.tsx`
- `src/components/IncomeList.tsx`

---

## 14. Agrupamento Mensal com Secoes Colapsaveis

**Modulo:** Contas Fixas, Gastos Variaveis, Entradas

Implementacao de timeline mensal que agrupa todos os registros por mes/ano. Cada mes e uma secao que pode ser aberta ou fechada.

### O que foi feito:
- **Hook reutilizavel** `useMonthlyGroups<T>` — agrupa dados por mes/ano
  - Calcula: nome do mes, quantidade de itens, total em R$, flag de mes atual
  - Ordenacao cronologica (mes atual primeiro, seguido dos proximos)
- **Componente** `MonthSection` — secao colapsavel visual
  - Header com: icone chevron, nome do mes em portugues capitalizado, badge de contagem + total em R$
  - Badge verde **"MES ATUAL"** no mes corrente
  - Animacao suave de abertura/fechamento (max-height + opacity transition)
  - Usa `ResizeObserver` para calcular altura dinamica do conteudo

### Comportamento:
- **Mes atual:** aparece primeiro na lista e abre automaticamente com tabela visivel
- **Demais meses:** aparecem em ordem cronologica e ficam fechados por padrao
- **Click no header:** alterna entre aberto e fechado
- **Ordenacao por coluna:** continua funcionando dentro de cada mes
- **Filtros de status (Contas Fixas):** continuam integrados normalmente
- **Cada secao contem:** tabela completa (desktop) ou cards (mobile) com todos os dados daquele mes

### Campos de agrupamento por tela:

| Tela | Campo de Data |
|------|---------------|
| Contas Fixas | `dueDate` (Vencimento) |
| Gastos Variaveis | `date` (Data do gasto) |
| Entradas | `date` (Data da entrada) |

### Arquivos criados:
- `src/hooks/useMonthlyGroups.ts` — **[NOVO]**
- `src/components/MonthSection.tsx` — **[NOVO]**

### Arquivos modificados:
- `src/components/BillList.tsx`
- `src/components/RandomExpenseList.tsx`
- `src/components/IncomeList.tsx`

---

## 15. Detalhamento dos Modais do Dashboard

**Modulo:** Dashboard

Modais de detalhamento do dashboard agora separam visualmente contas fixas e gastos variaveis.

### O que foi feito:
- **Modal "Saldo do Mes":** Calculo exibe "Ja Pago (Fixas + Variaveis)" e "Investimento" como deducoes separadas
- **Modal "Ja Pago":** Lista separada de contas fixas pagas e gastos variaveis pagos, cada uma com subtitulo
- **Modal "A Pagar":** Separa atrasadas e pendentes por tipo (Fixas Atrasadas, Variaveis Atrasados, Fixas Pendentes, Variaveis Pendentes)
- **Modal "Pendentes":** Lista separada por contas fixas e gastos variaveis pendentes
- **Modal "Atrasados":** Lista separada por contas fixas e gastos variaveis atrasados
- **Modal "Dinheiro Livre":** Calculo detalhado com linhas para Contas Fixas Pagas, Pendentes, Atrasadas, Gastos Variaveis e Investimentos
- **Investimento:** Card roxo no modal de saldo mostrando deducao de investimento (com nota quando total aportado > deducao)
- Labels atualizados em todos os cards do dashboard para maior clareza

### Arquivos modificados:
- `src/components/Dashboard.tsx` — labels e subValue para investimento
- `src/components/DashboardCardModal.tsx` — separacao por tipo em todos os modais

---

## 16. Coluna "Data do Pagamento" e "Data de Registro"

**Modulo:** Contas Fixas, Gastos Variaveis, Entradas

Colunas de auditoria adicionadas as tabelas para rastrear quando acoes ocorreram.

### O que foi feito:
- **Contas Fixas:** Coluna "Data do Pagamento" exibe data/hora em que o usuario marcou como pago (`dd/MM/yyyy HH:mm`), ou traco quando nao pago
- **Gastos Variaveis:** Coluna "Data do Pagamento" com mesma logica
- **Entradas:** Colunas "Data de Registro" (`created_at`) e "Data de Recebimento" (`received_date`)
- Todas exibidas tanto na tabela desktop quanto nos cards mobile

### Arquivos modificados:
- `src/components/BillList.tsx`
- `src/components/RandomExpenseList.tsx`
- `src/components/IncomeList.tsx`

---

## 17. Layout — Ajuste de Altura do Conteudo

**Modulo:** Layout

Correcao para que o conteudo principal ocupe toda a altura disponivel da tela.

### O que foi feito:
- Main container usa `flex flex-col min-h-screen` em vez de apenas `min-h-screen`
- Container interno usa `flex-1 flex flex-col` para expandir corretamente
- Resolve problema de secoes colapsaveis nao ocupando a altura total

### Arquivos modificados:
- `src/components/Layout.tsx`

---

## Resumo de Arquivos

### Arquivos criados (novos):
| Arquivo | Descricao |
|---------|-----------|
| `init-scripts/10-soft-delete.sql` | Migracao: colunas `deleted_at` |
| `init-scripts/11-drop-not-null-e2ee.sql` | Migracao: remove NOT NULL para E2EE |
| `init-scripts/12-installments.sql` | Migracao: colunas de parcelamento |
| `init-scripts/13-income-status.sql` | Migracao: status de entradas |
| `src/components/InstallmentModal.tsx` | Modal de parcelamento |
| `src/components/MonthSection.tsx` | Secao mensal colapsavel |
| `src/components/SortableHeader.tsx` | Cabecalho de tabela ordenavel |
| `src/hooks/useSortableTable.ts` | Hook de ordenacao |
| `src/hooks/useMonthlyGroups.ts` | Hook de agrupamento mensal |
| `server/services/schedulerService.js` | Cron jobs de e-mail |
| `CLAUDE.md` | Instrucoes para Claude Code |

### Arquivos modificados:
| Arquivo | Principais alteracoes |
|---------|----------------------|
| `src/types/index.ts` | Campos de parcelamento (Bill) e status/recebimento (Income) |
| `src/context/FinanceContext.tsx` | 6 novas funcoes: createInstallments, markIncomeAsReceived, updateIncome, updateRandomExpense, cancelRandomExpensePayment, refreshBills |
| `src/context/CryptoContext.tsx` | Persistencia da MEK via sessionStorage |
| `src/context/AuthContext.tsx` | Restauracao da MEK no refresh |
| `src/components/BillList.tsx` | Menu dropdown, badge de parcela, ordenacao, agrupamento mensal |
| `src/components/IncomeList.tsx` | Menu dropdown, badges de status, ordenacao, agrupamento mensal, edicao |
| `src/components/RandomExpenseList.tsx` | Menu dropdown, badges de status, ordenacao, agrupamento mensal, edicao |
| `src/components/IncomeForm.tsx` | Modo de edicao |
| `src/components/RandomExpenseForm.tsx` | Modo de edicao |
| `src/components/Dashboard.tsx` | Calculos revisados com separacao fixas/variaveis |
| `src/components/DashboardCardModal.tsx` | Detalhamento por tipo em todos os modais |
| `src/components/InvestmentList.tsx` | Icone e texto "Cancelar" |
| `src/components/Layout.tsx` | Flexbox para altura total |
| `src/components/ResetPassword.tsx` | Tratamento de erro melhorado |
| `server/controllers/billController.js` | Endpoint de parcelamento, soft delete, campos de parcela |
| `server/controllers/financeController.js` | Soft delete, markIncomeAsReceived, filtros deleted_at |
| `server/controllers/authController.js` | Transacao no resetPassword |
| `server/routes/billRoutes.js` | Rota de parcelamento |
| `server/routes/financeRoutes.js` | Rota de recebimento |
| `server/routes/adminRoutes.js` | Rotas de disparo de e-mail |
| `server/services/emailService.js` | Templates de lembrete e resumo mensal |
| `server/index.js` | Inicializacao do scheduler |
| `server/package.json` | Dependencia node-cron |
| `server/config/geminiConfig.js` | Limpeza de formatacao |
