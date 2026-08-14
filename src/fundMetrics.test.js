/**
 * Funções de cálculo de métricas de fundos de investimento
 * (rentabilidade, volatilidade, índice Sharpe)
 *
 * Entrada esperada: array de retornos mensais em decimal (ex: 0.012 = 1.2%)
 * ordenados do mais antigo para o mais recente.
 */

/**
 * Retorno acumulado no período, em percentual.
 * @param {number[]} monthlyReturns - retornos mensais em decimal
 * @returns {number} retorno acumulado em % (ex: 18.2)
 */
function cumulativeReturn(monthlyReturns) {
  const total = monthlyReturns.reduce((acc, r) => acc * (1 + r), 1);
  return round((total - 1) * 100, 2);
}

/**
 * Retorno anualizado (CAGR) a partir dos retornos mensais.
 * @param {number[]} monthlyReturns
 * @returns {number} retorno anualizado em % (ex: 12.4)
 */
function annualizedReturn(monthlyReturns) {
  const n = monthlyReturns.length;
  if (n === 0) return 0;
  const total = monthlyReturns.reduce((acc, r) => acc * (1 + r), 1);
  const annualized = Math.pow(total, 12 / n) - 1;
  return round(annualized * 100, 2);
}

/**
 * Volatilidade anualizada (desvio padrão dos retornos mensais × √12).
 * @param {number[]} monthlyReturns
 * @returns {number} volatilidade anualizada em % (ex: 15.1)
 */
function annualizedVolatility(monthlyReturns) {
  const n = monthlyReturns.length;
  if (n < 2) return 0;
  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / n;
  const variance =
    monthlyReturns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / (n - 1);
  const monthlyStdDev = Math.sqrt(variance);
  const annualizedStdDev = monthlyStdDev * Math.sqrt(12);
  return round(annualizedStdDev * 100, 2);
}

/**
 * Índice Sharpe anualizado.
 * Sharpe = (retorno anualizado do fundo - taxa livre de risco anualizada) / volatilidade anualizada
 *
 * @param {number[]} monthlyReturns - retornos mensais do fundo, em decimal
 * @param {number[]} riskFreeMonthlyReturns - retornos mensais do CDI (mesmo período), em decimal
 * @returns {number} índice Sharpe (ex: 1.28)
 */
function sharpeRatio(monthlyReturns, riskFreeMonthlyReturns) {
  const fundAnnualReturn = annualizedReturn(monthlyReturns) / 100;
  const riskFreeAnnualReturn = annualizedReturn(riskFreeMonthlyReturns) / 100;
  const vol = annualizedVolatility(monthlyReturns) / 100;

  if (vol === 0) return 0;

  const sharpe = (fundAnnualReturn - riskFreeAnnualReturn) / vol;
  return round(sharpe, 2);
}

/**
 * Calcula o conjunto completo de métricas de um fundo para um prazo (em meses).
 * @param {number[]} fundMonthlyReturns - retornos mensais do fundo, do mais antigo ao mais recente
 * @param {number[]} cdiMonthlyReturns - retornos mensais do CDI no mesmo período
 * @returns {{ retorno: number, retornoAnualizado: number, volatilidade: number, sharpe: number }}
 */
function computeFundMetrics(fundMonthlyReturns, cdiMonthlyReturns) {
  return {
    retorno: cumulativeReturn(fundMonthlyReturns),
    retornoAnualizado: annualizedReturn(fundMonthlyReturns),
    volatilidade: annualizedVolatility(fundMonthlyReturns),
    sharpe: sharpeRatio(fundMonthlyReturns, cdiMonthlyReturns),
  };
}

/**
 * Recorta os últimos N meses de uma série (mais recente por último).
 * @param {number[]} series
 * @param {number} months
 * @returns {number[]}
 */
function lastNMonths(series, months) {
  return series.slice(Math.max(0, series.length - months));
}

/**
 * Calcula métricas para múltiplos prazos de uma vez (1, 2, 3, 5 anos).
 * @param {number[]} fundMonthlyReturns - série completa (mín. 5 anos / 60 meses)
 * @param {number[]} cdiMonthlyReturns - série completa do CDI, mesmo comprimento
 * @param {number[]} periodsInYears - ex: [1,2,3,5]
 */
function computeMetricsForPeriods(fundMonthlyReturns, cdiMonthlyReturns, periodsInYears = [1, 2, 3, 5]) {
  const result = {};
  for (const years of periodsInYears) {
    const months = years * 12;
    const fundSlice = lastNMonths(fundMonthlyReturns, months);
    const cdiSlice = lastNMonths(cdiMonthlyReturns, months);
    result[years] = computeFundMetrics(fundSlice, cdiSlice);
  }
  return result;
}

function round(value, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

module.exports = {
  cumulativeReturn,
  annualizedReturn,
  annualizedVolatility,
  sharpeRatio,
  computeFundMetrics,
  computeMetricsForPeriods,
  lastNMonths,
};
