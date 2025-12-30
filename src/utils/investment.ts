// Taxa DI anual aproximada (exemplo: 13.65% a.a)
const CDI_ANNUAL_RATE = 0.1365; 

export const calculateInvestmentReturn = (initialAmount: number, cdiPercent: number, months: number) => {
  // Convertendo taxa anual para diária (considerando 252 dias úteis)
  // Fórmula simplificada para dias corridos/mensal para UX mais amigável
  
  // Taxa mensal aproximada
  const monthlyRate = Math.pow(1 + CDI_ANNUAL_RATE, 1/12) - 1;
  
  // Taxa ajustada pelo % do CDI do investimento
  const effectiveMonthlyRate = monthlyRate * (cdiPercent / 100);
  
  // Montante final = Capital * (1 + taxa)^tempo
  const finalAmount = initialAmount * Math.pow(1 + effectiveMonthlyRate, months);
  
  return finalAmount;
};
