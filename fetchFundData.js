/**
 * Script rodado pelo GitHub Actions (cron) para atualizar os dados
 * de fundos e CDI, salvando como JSON estático em /public/data.
 *
 * Uso: node scripts/fetchFundData.js
 */

const fs = require('fs');
const path = require('path');
const { computeMetricsForPeriods } = require('../src/fundMetrics');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

// CNPJs dos fundos acompanhados (preencher com os fundos reais)
const FUNDS = [
  { cnpj: '00000000000000', name: 'Mundial FIA Ações' },
  { cnpj: '00000000000001', name: 'Mundial Multimercado' },
];

// Série Temporal do Banco Central para o CDI (série 12 = CDI diário)
const BCB_CDI_URL =
  'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json';

async function fetchCdiMonthlyReturns() {
  const res = await fetch(BCB_CDI_URL);
  if (!res.ok) throw new Error(`Falha ao buscar CDI: ${res.status}`);
  const dailyRates = await res.json(); // [{ data: 'dd/mm/yyyy', valor: '0.05' }, ...]
  return dailyToMonthlyReturns(dailyRates);
}

// Converte taxas diárias do CDI (%) em retornos mensais decimais
function dailyToMonthlyReturns(dailyRates) {
  const byMonth = {};
  for (const { data, valor } of dailyRates) {
    const [, mm, yyyy] = data.split('/');
    const key = `${yyyy}-${mm}`;
    const dailyDecimal = parseFloat(valor) / 100;
    byMonth[key] = (byMonth[key] || 1) * (1 + dailyDecimal);
  }
  return Object.keys(byMonth)
    .sort()
    .map((key) => byMonth[key] - 1);
}

// Busca a série histórica de cotas de um fundo via dados públicos da CVM
// (informe diário de fundos - CDA/extrato). Ajustar conforme o dataset exato
// já usado no comparador do Mundial.
async function fetchFundMonthlyReturns(cnpj) {
  // Placeholder: substituir pela chamada real que já existe no comparador
  // de fundos do Mundial Investimentos (mesma fonte CVM já integrada lá).
  throw new Error(
    `Implementar busca real de cotas para CNPJ ${cnpj} (reaproveitar integração CVM existente)`
  );
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const cdiMonthlyReturns = await fetchCdiMonthlyReturns();

  const results = [];
  for (const fund of FUNDS) {
    const fundMonthlyReturns = await fetchFundMonthlyReturns(fund.cnpj);
    const metricsByPeriod = computeMetricsForPeriods(
      fundMonthlyReturns,
      cdiMonthlyReturns,
      [1, 2, 3, 5]
    );
    results.push({
      cnpj: fund.cnpj,
      name: fund.name,
      metrics: metricsByPeriod,
    });
  }

  const output = {
    updatedAt: new Date().toISOString(),
    cdi: {
      metrics: computeMetricsForPeriods(cdiMonthlyReturns, cdiMonthlyReturns, [1, 2, 3, 5]),
    },
    funds: results,
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'funds.json'),
    JSON.stringify(output, null, 2)
  );

  console.log(`Dados atualizados em ${OUTPUT_DIR}/funds.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
