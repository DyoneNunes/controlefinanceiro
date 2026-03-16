# PROPOSTA DE TRABALHO PRÁTICO – ANÁLISE ORIENTADA A OBJETOS

## Componentes do Grupo

1. Dyone Andrade
2. Julia Ferreira
3. _________________________________
4. _________________________________
5. _________________________________

---

## Sistema Proposto

**Controle Financeiro** – Sistema de Controle Financeiro Pessoal e Familiar

---

## Organização

**Nome:** Uso Pessoal / Familiar
**Área de Negócio:** Gestão Financeira Pessoal e Colaborativa

---

## Endereço

Aplicação Web hospedada em ambiente Homelab com deploy automatizado via CI/CD (GitHub Actions + Tailscale + Docker).

---

## Usuário

**Nome:** Dyone Andrade
**Email:** (informar e-mail de contato)
**Telefone:** (informar telefone de contato)

---

## Descrição do Mini-Mundo (Escopo do Sistema)

O sistema **Controle Financeiro** é uma aplicação web desenvolvida para atender à necessidade crescente de organização e planejamento financeiro pessoal e familiar. Atualmente, muitas pessoas e famílias enfrentam dificuldades para controlar seus gastos, acompanhar receitas, gerenciar dívidas e planejar investimentos de forma integrada. A falta de uma ferramenta centralizada leva ao uso de planilhas dispersas, anotações informais e, consequentemente, à perda de controle sobre a saúde financeira.

O sistema opera sob o conceito de **multi-tenancy baseado em grupos**, onde cada grupo representa um contexto financeiro isolado — como finanças pessoais, de um casal, de uma família ou de um projeto específico. Dentro de cada grupo, os membros podem registrar **contas fixas a pagar** (aluguel, energia, internet), **receitas/entradas** (salário, freelance, rendimentos), **investimentos** (com cálculo automático de rendimento baseado no CDI) e **gastos variáveis** (alimentação, lazer, manutenção).

O **Dashboard** centraliza toda a visão financeira do grupo, apresentando o cálculo do **Fluxo de Caixa** (receitas menos despesas efetivamente pagas) versus o regime de **Competência** (contas previstas para o mês), além do valor total de dívidas acumuladas (contas vencidas e não pagas). Gráficos interativos (pizza e barras) auxiliam na visualização da distribuição de despesas e na comparação receitas vs. despesas.

Um diferencial do sistema é o módulo de **Consultor de Inteligência Artificial**, integrado com o Google Gemini, que analisa automaticamente os dados financeiros do grupo (receitas, contas, gastos e investimentos) e gera um parecer personalizado contendo: diagnóstico da saúde financeira, pontos de atenção, estratégias de ação e recomendações de investimento. O histórico de consultas ao consultor IA é armazenado para acompanhamento ao longo do tempo.

O sistema conta com **controle de acesso baseado em papéis** (Administrador, Editor, Visualizador), autenticação via JWT e infraestrutura containerizada com Docker, deploy automatizado via GitHub Actions com túnel Tailscale para servidor local (Homelab).

---

## Principais Problemas Encontrados

1. **Falta de centralização:** Famílias e indivíduos usam múltiplas planilhas e anotações para controlar finanças, resultando em informação fragmentada e desatualizada.

2. **Dificuldade de acompanhamento:** Sem uma ferramenta automatizada, é difícil saber em tempo real o saldo disponível, contas vencidas e a evolução patrimonial com investimentos.

3. **Ausência de análise inteligente:** Usuários comuns não possuem conhecimento financeiro suficiente para interpretar seus dados e tomar decisões estratégicas de economia e investimento.

4. **Gestão compartilhada:** Casais e famílias precisam de um ambiente colaborativo onde múltiplos membros possam registrar e visualizar movimentações financeiras com controle de permissões.

5. **Falta de visibilidade sobre dívidas:** Contas vencidas e não pagas se acumulam sem que o usuário tenha uma visão clara do montante total em atraso.

---

## Principais Funções

1. Realizar Login / Autenticação de Usuário
2. Gerenciar Grupos Financeiros (criar, editar, excluir, convidar membros)
3. Cadastrar Contas a Pagar (inclusão, exclusão, pagamento)
4. Cadastrar Receitas/Entradas (inclusão, exclusão)
5. Cadastrar Investimentos (inclusão, exclusão, cálculo de rendimento CDI)
6. Cadastrar Gastos Variáveis (inclusão, exclusão, pagamento)
7. Visualizar Dashboard Financeiro (fluxo de caixa, competência, dívidas, gráficos)
8. Consultar Inteligência Artificial (análise financeira com Gemini)
9. Consultar Histórico de Análises da IA
10. Gerenciar Permissões de Membros do Grupo (admin, editor, visualizador)

---

*Profa. Denise Franzotti Togneri*
