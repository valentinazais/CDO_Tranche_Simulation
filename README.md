# CDO Tranche Simulation

Gaussian Copula Monte Carlo engine for CDO tranche pricing and risk analysis.

## Modules

| Tab | Description |
|-----|-------------|
| Loss Distribution | Portfolio loss histogram with VaR statistics |
| Correlation Risk | Tranche spread sensitivity to pairwise correlation |
| Tranche Pricer | Price arbitrary [A, D] tranches |
| Credit Deterioration | Stress-test spreads under CDS widening scenarios |
| Capital Structure | Waterfall visualization of the tranche stack |

## Run Locally

```bash
cd CDO_Tranche_Simulation
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

## Deploy on GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set source to **Deploy from a branch**, select `main`, root `/`.
4. The site will be available at `https://<username>.github.io/CDO_Tranche_Simulation/`.

## Technical Notes

- All computation runs client-side in JavaScript (no server required).
- Monte Carlo engine uses Gaussian copula with a single systematic factor.
- Normal CDF: Abramowitz & Stegun rational approximation.
- Inverse normal CDF: Peter Acklam rational approximation.
- Charts rendered with [Chart.js](https://www.chartjs.org/) (loaded from CDN).
