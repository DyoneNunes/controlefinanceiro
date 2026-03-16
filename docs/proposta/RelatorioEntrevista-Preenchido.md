# RELATÓRIO DE ENTREVISTA / REUNIÃO

**Sistema:** Controle Financeiro – Sistema de Controle Financeiro Pessoal e Familiar

**Data:** 10/02/2026

**Hora Início:** 14:00 &emsp; **Hora Fim:** 15:30

**Local:** Reunião remota via Google Meet

**Assunto:** Levantamento de requisitos e entendimento do processo de gestão financeira pessoal e familiar

---

## Entrevistados

| Nome | Assinatura |
|------|------------|
| Dyone Andrade (Usuário/Desenvolvedor) | _________________ |
| Julia Ferreira (Usuária) | _________________ |

## Entrevistadores

| Nome | Assinatura |
|------|------------|
| (Nome do Analista 1) | _________________ |
| (Nome do Analista 2) | _________________ |

---

## Objetivos Previstos

1. Compreender como os usuários atualmente controlam suas finanças pessoais e familiares.
2. Identificar os principais problemas e dores no processo atual de gestão financeira.
3. Levantar as funcionalidades essenciais que o sistema deve oferecer.
4. Entender a necessidade de gestão colaborativa (grupos/família).
5. Avaliar o interesse em funcionalidades de inteligência artificial para análise financeira.

---

## Objetivos Atingidos

1. Foi compreendido que os usuários utilizam planilhas dispersas e anotações informais, sem integração entre os dados financeiros do casal/família.
2. Foram identificados os principais problemas: falta de centralização, dificuldade de acompanhar dívidas, ausência de visão consolidada e falta de orientação financeira.
3. Foram levantadas as funcionalidades essenciais: cadastro de contas fixas, receitas, investimentos e gastos variáveis, com dashboard consolidado.
4. Confirmou-se a necessidade de grupos financeiros com controle de permissões (admin, editor, visualizador) para gestão compartilhada.
5. Os usuários demonstraram grande interesse em um módulo de consultoria IA que analise os dados e forneça recomendações práticas.

---

## Objetivos da Próxima Entrevista

1. Validar o protótipo de interface (telas do sistema) com os usuários.
2. Detalhar os fluxos de pagamento de contas e registro de gastos variáveis.
3. Definir os critérios de cálculo de rendimento de investimentos (% CDI).
4. Discutir requisitos de segurança e controle de acesso.

---

## Descrição

A reunião foi conduzida com o objetivo de entender o processo de gestão financeira dos usuários entrevistados. O Sr. Dyone Andrade relatou que, atualmente, ele e sua companheira Julia Ferreira utilizam planilhas no Google Sheets para registrar contas a pagar, receitas mensais e gastos variáveis. Segundo ele, o principal problema é a falta de integração: cada um mantém suas próprias anotações e, no final do mês, é difícil consolidar os dados para ter uma visão real da situação financeira do casal.

A Sra. Julia Ferreira complementou dizendo que sente falta de uma ferramenta que mostre, de forma clara e visual, quanto já foi gasto, quanto ainda está pendente e qual o saldo disponível. Ela mencionou que frequentemente contas vencem sem que percebam, gerando multas e juros desnecessários.

Ambos concordaram que o sistema deveria permitir a criação de **grupos financeiros**, onde cada grupo representaria um contexto diferente (ex: "Casal", "Pessoal Dyone", "Pessoal Julia"). Dentro de cada grupo, ambos poderiam registrar movimentações, mas com níveis de permissão diferentes — por exemplo, um membro poderia ser apenas visualizador em determinado grupo.

Quanto às funcionalidades, os seguintes módulos foram definidos como essenciais:

- **Contas a Pagar (Fixas):** Registro de despesas recorrentes como aluguel, energia, internet, com controle de status (pendente, pago, vencido) e data de vencimento.
- **Receitas/Entradas:** Registro de todas as fontes de renda (salário, freelance, rendimentos diversos).
- **Investimentos:** Registro de aplicações financeiras com cálculo automático de rendimento baseado no CDI, considerando o percentual contratado e o prazo.
- **Gastos Variáveis:** Registro de despesas não recorrentes como alimentação fora, compras, lazer.
- **Dashboard:** Painel consolidado com visão mensal e anual, mostrando fluxo de caixa (realizado), regime de competência (previsto) e total de dívidas acumuladas, com gráficos de distribuição.

O Sr. Dyone sugeriu a inclusão de um módulo de **Inteligência Artificial** que, com base nos dados registrados, pudesse gerar um diagnóstico da saúde financeira e sugerir estratégias de economia e investimento. Ele mencionou a possibilidade de integração com o Google Gemini para esta funcionalidade, com cache de respostas para otimizar custos e histórico de consultas para acompanhamento.

Ao final da reunião, ficou acordado que o sistema será desenvolvido como aplicação web (React + Node.js), com banco de dados PostgreSQL, containerizado com Docker e deploy automatizado em servidor local (Homelab) via GitHub Actions e túnel Tailscale.

---

*Profa. Denise Franzotti Togneri*
