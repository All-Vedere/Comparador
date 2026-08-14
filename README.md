# Comparador de fundos — Mundial Investimentos

100% GitHub: sem backend próprio. Um workflow do GitHub Actions busca os dados
da CVM/BCB uma vez por dia, gera um JSON estático, e o GitHub Pages serve tudo
(front-end + dados) direto do repositório.

## Estrutura
- `src/fundMetrics.js` — cálculo de rentabilidade, volatilidade e Sharpe por prazo
- `src/fundMetrics.test.js` — teste rápido com dados fictícios (`node src/fundMetrics.test.js`)
- `scripts/fetchFundData.js` — busca CVM/BCB e gera `public/data/funds.json`
- `.github/workflows/update-and-deploy.yml` — roda o script todo dia às 06h (Brasília) e publica no Pages
- `public/` — front-end estático (index.html, etc.) + `data/funds.json` gerado

## Colocando no GitHub

1. Criar o repositório:
   ```bash
   cd mundial-fundos
   git init
   git add .
   git commit -m "Comparador de fundos - versão inicial"
   ```
   No GitHub: **New repository** → nome (ex: `mundial-comparador-fundos`) → criar.
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/mundial-comparador-fundos.git
   git branch -M main
   git push -u origin main
   ```

2. Ativar o GitHub Pages via Actions:
   - No repositório: **Settings → Pages → Source** → selecionar **GitHub Actions**

3. Completar a busca real de cotas do fundo em `scripts/fetchFundData.js`
   (função `fetchFundMonthlyReturns`) — reaproveitar a mesma integração CVM
   que você já usa no comparador do Mundial. Preencher os CNPJs reais no
   array `FUNDS`.

4. Rodar manualmente pela primeira vez: aba **Actions** do repositório →
   selecionar o workflow **Atualizar dados e publicar** → **Run workflow**.
   Depois disso ele roda sozinho todo dia, e também a cada push na `main`.

## Sobre a atualização de dados
Como não há servidor rodando, os dados não são "ao vivo" — atualizam uma vez
por dia via cron do Actions. Isso é mais que suficiente pra fundos de
investimento, já que a própria CVM não publica cotas em tempo real.

## Próximo passo
Ligar o front-end (`public/index.html`) ao `public/data/funds.json` gerado,
e implementar `fetchFundMonthlyReturns` com a integração CVM real.
