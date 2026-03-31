# Roteiro de Entrevista de Requisitos — Sistema de Controle Financeiro

## Identificação da Entrevista

| Campo | Informação |
|-------|-----------|
| **Entrevistada** | Ana Julia |
| **Contexto** | Ana Julia é a solicitante do sistema. Ela procurou a equipe de desenvolvimento com a necessidade de um sistema para gerenciar as finanças de sua casa, incluindo o controle de contas domésticas, receitas familiares, gastos do dia a dia e investimentos. O objetivo principal é ter visibilidade e controle sobre o dinheiro que entra e sai do lar. |
| **Tipo de uso** | Doméstico/Familiar |
| **Papel no sistema** | Administradora principal |

---

## 1. Preparação Pré-Entrevista

Antes de conduzir a entrevista com Ana Julia, o entrevistador deve reunir o seguinte material de apoio:

- Acesso funcional ao sistema para demonstração durante a conversa
- Lista das funcionalidades já implementadas (contas fixas, receitas, gastos variáveis, investimentos, Dashboard, Consultor IA, importação bancária, grupos)
- Registro dos problemas já identificados e resolvidos pelo sistema (os 8 problemas mapeados no mini-mundo)
- Anotações de feedbacks anteriores fornecidos por Ana Julia, caso existam
- Formulário ou caderno para registro das respostas (evitar gravação sem consentimento)

**Perfil da entrevistada:**
Ana Julia é a cliente que solicitou o desenvolvimento do sistema para uso doméstico. Ela é a responsável principal pela gestão financeira de sua casa e busca uma ferramenta que centralize todas as movimentações do lar — desde as contas fixas mensais (aluguel, energia, água, internet) até os gastos variáveis do cotidiano (supermercado, farmácia, manutenção da casa). Ela também deseja que outros membros da família possam acompanhar e colaborar no registro das finanças, mantendo transparência sobre a situação financeira do lar.

**Duração estimada:** 40 a 60 minutos.

---

## 2. Abertura da Entrevista (5 minutos)

O entrevistador deve iniciar com uma introdução que deixe Ana Julia confortável e reforce que o foco é a experiência dela com o sistema que solicitou para sua casa.

**Roteiro de abertura:**

> "Ana Julia, obrigado por participar desta entrevista. O objetivo aqui é entender como você está utilizando o sistema de Controle Financeiro na gestão da sua casa, o que funciona bem, o que causa dificuldade e o que você sente falta. Como você foi quem solicitou o desenvolvimento deste sistema, sua visão é essencial para garantirmos que ele atende de verdade às necessidades do seu lar. Não existem respostas certas ou erradas — o que importa é a sua experiência real. A entrevista deve durar cerca de 45 minutos. Podemos começar?"

**Dados da entrevistada a registrar:**

| Campo | Valor |
|-------|-------|
| Nome | Ana Julia |
| Há quanto tempo utiliza o sistema | (a preencher) |
| Papel no grupo | Administradora |
| Tipo de uso | Doméstico/Familiar |
| Frequência de uso | (diário/semanal/mensal) |
| Outros membros da casa que usam | (a preencher) |

---

## 3. Bloco 1 — Perfil e Contexto Financeiro (5 minutos)

O objetivo deste bloco é entender o contexto doméstico de Ana Julia para interpretar suas respostas de forma adequada.

**Perguntas:**

1. "Ana Julia, como você controlava as finanças da sua casa antes de solicitar este sistema? Usava planilha, caderno, aplicativo de banco, ou não tinha um controle estruturado?"

2. "Quantas fontes de renda entram na sua casa atualmente? E quantas contas fixas da casa você paga por mês, aproximadamente (aluguel, energia, água, internet, condomínio, etc.)?"

3. "Na sua casa, você é a única responsável pela gestão financeira ou outras pessoas da família também participam? Quem mais contribui com receitas ou realiza gastos que precisam ser registrados?"

4. "Qual era o seu maior incômodo em relação à gestão do dinheiro da casa antes de ter o sistema? E esse incômodo foi resolvido?"

> **Nota para o entrevistador:** Estas perguntas são abertas propositalmente. Deixe Ana Julia falar livremente. As respostas aqui ajudam a contextualizar tudo que será dito nos blocos seguintes e a entender a dinâmica financeira do lar dela.

---

## 4. Bloco 2 — Avaliação das Funcionalidades Existentes (15 minutos)

Neste bloco, o entrevistador percorre cada módulo do sistema e solicita feedback direto de Ana Julia. Se necessário, abra o sistema e peça a ela que demonstre como utiliza cada funcionalidade no contexto da gestão de sua casa.

### 4.1. Cadastro e Autenticação

5. "O processo de criar sua conta e fazer login foi simples? Teve alguma dificuldade?"

6. "Você já precisou recuperar sua senha ou teve algum problema de acesso? Como foi?"

### 4.2. Contas Fixas (Bills)

7. "Ana Julia, você cadastra todas as contas fixas da casa no sistema? Por exemplo: aluguel, energia, água, internet, condomínio, plano de saúde. Alguma fica de fora? Por quê?"

8. "Quando você paga uma conta da casa, você marca como paga no sistema no mesmo momento ou deixa para depois? Por quê?"

9. "O sistema mostra o status como pendente, pago ou vencido. Esses três estados são suficientes para representar a realidade da sua casa? Existe alguma situação que não se encaixa? Por exemplo, uma conta parcelada, uma que foi paga parcialmente, ou uma que foi renegociada com a concessionária."

10. "Você sente falta de alguma informação no cadastro de contas da casa? Por exemplo: categoria da conta (moradia, serviços, saúde), forma de pagamento (Pix, débito automático, boleto), recorrência automática mês a mês?"

### 4.3. Receitas (Incomes)

11. "Ana Julia, você registra todas as receitas que entram na casa ou apenas as principais? Por exemplo, se alguém da família faz um bico ou recebe um valor esporádico, isso é registrado?"

12. "A forma como a receita é cadastrada hoje (descrição, valor e data) é suficiente para a realidade da sua casa? Você gostaria de classificar por tipo (salário do membro X, freelance, aluguel recebido, pensão, etc.)?"

13. "A renda da sua casa varia de mês a mês ou é relativamente fixa? Como você lida com essa variação no sistema? Sente falta de algo para lidar com receitas irregulares?"

### 4.4. Gastos Variáveis (Random Expenses)

14. "Ana Julia, os gastos variáveis da casa (supermercado, farmácia, manutenção, lazer) — você registra com que frequência? No momento em que gasta, no final do dia, ou acumula para o final da semana?"

15. "Qual é a maior dificuldade que você encontra para manter o registro dos gastos variáveis da casa em dia? Outros membros da família também registram ou só você?"

16. "Você gostaria de poder categorizar os gastos variáveis da casa (alimentação, transporte, lazer, saúde, manutenção do lar, etc.)? Isso ajudaria a entender para onde o dinheiro da casa está indo?"

17. "Existe algum tipo de gasto doméstico que você não sabe como registrar no sistema? Por exemplo, uma compra grande parcelada no cartão, um gasto dividido com um vizinho, um reembolso de algo devolvido, ou a mesada dos filhos?"

### 4.5. Investimentos

18. "Ana Julia, você ou alguém da sua casa possui investimentos cadastrados no sistema? Se sim, todos ou apenas alguns?"

19. "O cálculo de rendimento baseado no CDI é útil para a sua realidade? Você entende o que o percentual do CDI significa na prática ou gostaria que o sistema explicasse de forma mais simples?"

20. "A sua família possui investimentos que não se encaixam no modelo atual, como ações, fundos imobiliários, criptomoedas ou previdência privada? Gostaria que o sistema também cobrisse esses tipos?"

21. "Você acompanha os investimentos da família mais pelo sistema ou diretamente nos aplicativos dos bancos e corretoras? O que faria você centralizar tudo aqui?"

### 4.6. Dashboard

22. "Ana Julia, com que frequência você acessa o Dashboard? O que você olha primeiro quando abre o sistema — o saldo, as contas pendentes, os gráficos?"

23. "A diferença entre a visão de caixa (o que efetivamente entrou e saiu) e competência (o que você deve no mês) é clara para você? Você consegue explicar com suas palavras o que cada uma representa?"

24. "Os gráficos de pizza e barras são úteis para a gestão da sua casa? Você já tomou alguma decisão com base neles — por exemplo, cortar um gasto — ou são apenas informativos?"

25. "A navegação por mês é suficiente para o controle da casa ou você gostaria de ter visões por semana, trimestre ou ano inteiro?"

26. "Existe algum indicador ou informação que você gostaria de ver no Dashboard e que não aparece hoje? Por exemplo, quanto sobra no final do mês para lazer, ou quanto já foi gasto com supermercado?"

### 4.7. Consultor IA (AI Advisor)

27. "Ana Julia, você já utilizou o Consultor IA do sistema? Quantas vezes, aproximadamente?"

28. "As recomendações geradas foram úteis e aplicáveis à realidade da sua casa? Pode dar um exemplo de algo que achou relevante ou que não fez sentido para a sua situação?"

29. "Você confiou nas sugestões de investimento da IA? Chegou a seguir alguma recomendação na prática?"

30. "O que você mudaria na forma como o consultor apresenta as informações? É muita informação, pouca, ou na medida certa? A linguagem é acessível ou muito técnica?"

31. "Você gostaria que o consultor IA pudesse responder perguntas específicas sobre as finanças da sua casa, como em um chat? Por exemplo: 'Consigo trocar o sofá da sala este mês?' ou 'Dá para fazer uma viagem em família em julho com o orçamento atual?'"

### 4.8. Importação Bancária

32. "Ana Julia, você já utilizou a importação de extratos bancários (OFX ou PDF) para registrar as movimentações da casa? Se sim, como foi a experiência?"

33. "Se não utilizou, por quê? Não sabia que existia, não sabe como exportar o extrato do seu banco, ou achou complicado?"

34. "Quando importou, as transações foram identificadas corretamente? Houve erros de valor, data ou transações duplicadas?"

35. "Você gostaria que o sistema importasse extratos de outras fontes, como CSV ou planilhas do Excel? Ou até que se conectasse diretamente ao banco para puxar os dados automaticamente?"

### 4.9. Grupos e Compartilhamento

36. "Ana Julia, você utiliza mais de um grupo no sistema? Por exemplo, um para as finanças da casa e outro pessoal só seu? Como organiza isso?"

37. "Você já convidou outros membros da família para participar do grupo da casa? O processo de convite foi simples?"

38. "Os papéis disponíveis (administrador, editor, visualizador) atendem à dinâmica da sua casa? Por exemplo, você precisa que alguém veja os dados mas não altere, ou que todos possam registrar gastos livremente?"

39. "Algum membro da família já alterou ou apagou dados no sistema por engano? Como isso foi resolvido?"

---

## 5. Bloco 3 — Identificação de Novas Necessidades (10 minutos)

Aqui o objetivo é explorar funcionalidades que o sistema ainda não possui, mas que Ana Julia pode desejar para a gestão da sua casa.

**Perguntas:**

40. "Ana Julia, você gostaria de receber lembretes quando uma conta da casa está próxima do vencimento? Por qual canal seria mais prático para você — e-mail, WhatsApp, ou notificação no navegador?"

41. "Você sente falta de definir um orçamento mensal para a casa por categoria? Por exemplo, estipular que o limite do supermercado é R$ 1.200 por mês e receber um alerta quando estiver chegando perto desse valor?"

42. "Você gostaria de poder definir metas financeiras para a família? Por exemplo: 'Queremos juntar R$ 15.000 para reformar a cozinha até dezembro' ou 'Queremos fazer uma viagem em família no meio do ano'. O sistema acompanharia o progresso automaticamente."

43. "Você precisa gerar relatórios das finanças da casa para alguma finalidade? Por exemplo, para prestar contas a outro membro da família, para declaração de imposto de renda, ou simplesmente para imprimir e guardar como registro?"

44. "Existe alguma situação no dia a dia financeiro da sua casa que o sistema não cobre de jeito nenhum? Algo que você precisa resolver fora do sistema, em planilha ou no papel?"

45. "Ana Julia, se você pudesse adicionar uma única funcionalidade ao sistema para facilitar a gestão financeira da sua casa, qual seria?"

---

## 6. Bloco 4 — Usabilidade e Experiência Geral (5 minutos)

46. "Ana Julia, de 1 a 10, qual nota você daria para a facilidade de uso do sistema? Por quê?"

47. "Existe alguma tela ou funcionalidade que você acha confusa ou difícil de usar? Algum momento em que você não soube o que fazer?"

48. "Você acessa o sistema mais pelo computador ou pelo celular? Quando está no supermercado ou na rua e precisa registrar um gasto, consegue fazer pelo celular de forma prática?"

49. "O sistema é rápido o suficiente para o uso da sua casa? Existe alguma tela que demora para carregar ou trava?"

50. "Visualmente, o sistema é agradável para você? Tem algo na aparência ou nas cores que mudaria?"

---

## 7. Bloco 5 — Priorização e Encerramento (5 minutos)

51. "Ana Julia, dentre tudo que conversamos, quais são as três melhorias que fariam mais diferença no dia a dia da gestão financeira da sua casa?"

52. "Existe algo que eu não perguntei mas que você gostaria de comentar sobre o sistema? Alguma frustração, elogio ou ideia?"

53. "Você recomendaria o sistema para uma amiga ou familiar que também quer organizar as finanças de casa? Se não, o que precisaria mudar para que recomendasse?"

**Roteiro de encerramento:**

> "Ana Julia, agradeço muito pela sua participação. Como você é a pessoa que solicitou este sistema para a gestão da sua casa, suas respostas são especialmente valiosas para garantirmos que o sistema atende exatamente ao que você precisa. Vamos analisar tudo que foi conversado e priorizar as melhorias. Se surgir alguma ideia depois da entrevista, fique à vontade para nos procurar a qualquer momento."

---

## 8. Pós-Entrevista: Consolidação dos Resultados

Após a entrevista com Ana Julia, o entrevistador deve:

1. **Transcrever as respostas** organizadas por bloco temático
2. **Comparar com os requisitos originais** — como Ana Julia é a solicitante do sistema, verificar se as expectativas iniciais dela foram atendidas e quais evoluíram
3. **Classificar os achados** em três categorias:
   - **Problemas de usabilidade** — dificuldades com o que já existe (correções)
   - **Melhorias funcionais** — aprimoramentos em funcionalidades existentes (evolução)
   - **Novas funcionalidades** — capacidades que o sistema não possui (expansão)
4. **Priorizar** com base no impacto no dia a dia doméstico de Ana Julia e viabilidade técnica
5. **Documentar requisitos** derivados da entrevista em formato estruturado para alimentar o backlog de desenvolvimento

### Registro da entrevista com Ana Julia:

| Campo | Valor |
|-------|-------|
| Entrevistada | Ana Julia |
| Data | (dd/mm/aaaa) |
| Contexto | Solicitante do sistema para gestão financeira de sua casa |
| Tempo de uso do sistema | (a preencher) |
| Papel no grupo | Administradora |
| Tipo de uso | Doméstico/Familiar |
| Outros membros da casa no sistema | (a preencher) |
| Frequência de uso | (diário/semanal/mensal) |
| Nota de satisfação (1-10) | (a preencher) |
| Top 3 melhorias solicitadas | 1. ... 2. ... 3. ... |
| Problemas críticos relatados | ... |
| Novas funcionalidades desejadas | ... |
| Expectativas iniciais atendidas? | (sim/parcialmente/não — detalhar) |
