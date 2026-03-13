# CDO Tranche Simulation — Gaussian Copula Monte Carlo Engine

Live App: https://valentinazais.github.io/CDO_Tranche_Simulation/

## Model Formulas

### Hazard Rate & Default Probability

$$
h = \frac{s}{1 - R}
$$

$$
PD = 1 - e^{-h T}
$$

Where:

- $s$ = CDS spread  
- $R$ = recovery rate  
- $T$ = maturity

---

### Gaussian Copula & Latent Variable

The latent variable $X_i$ triggering default for entity $i$ is driven by a single systematic factor $M$ and an idiosyncratic factor $\epsilon_i$:

$$
X_i = \sqrt{\rho} M + \sqrt{1-\rho} \epsilon_i
$$

Where:

- $\rho$ = pairwise correlation  
- $M \sim N(0,1)$  
- $\epsilon_i \sim N(0,1)$  

Default occurs if $X_i < \Phi^{-1}(PD)$.

---

### Portfolio Loss

The percentage loss of a homogeneous portfolio of $N$ entities is:

$$
L = \frac{1}{N} \sum_{i=1}^{N} \mathbb{1}_{\{X_i < \Phi^{-1}(PD)\}}
$$

---

### Tranche Loss

The loss of a tranche with attachment point $A$ and detachment point $D$:

$$
L_{tranche} = \min(\max(L - A, 0), D - A)
$$

Expected Loss (EL) is computed via Monte Carlo simulation averaging $L_{tranche}$ across $S$ runs.

---

### Premium Leg (Risky Annuity)

Expected discounted value of periodic premium payments (simplified):

$$
PV_{prem} = \sum_{k=1}^{T \times f} \frac{1}{f} e^{-r t_k}
$$

Where:

- $r$ = risk‑free rate  
- $f$ = payment frequency per year  
- $t_k = \frac{k}{f}$  

---

### Fair Tranche Spread

$$
s_{tranche} = \frac{EL}{PV_{prem}}
$$

---

## Features

### Credit Parameters

- Number of Names ($N$)
- CDS Spread (bps)
- Recovery Rate ($R$)
- Risk‑Free Rate ($r$)
- Correlation ($\rho$)
- Maturity ($T$)
- Simulations ($S$)

---

### Output Analytics

- Tranche Spread (bps)
- Expected Tranche Loss
- Mean Portfolio Loss & VaR
- Default Probability (Single Name)

---

### Visualizations

**Loss Distribution**

Histogram of simulated portfolio losses via Gaussian Copula.

**Correlation Risk**

Sweeps pairwise correlation ($\rho$) to show impact on Equity, Mezzanine, Senior, and Super-Senior spreads.

**Credit Deterioration**

Stress-tests tranche spreads under deterministic CDS spread widening scenarios (+50, +100, +200 bps).

**Capital Structure**

Horizontal stacked waterfall chart comparing tranche widths and spreads.

---

## Architecture

Browser

```
index.html
    │
    ├── css/
    │       style.css (Professional white interface)
    │
    ├── js/
    │       engine.js (Monte Carlo CDO Pricer)
    │           - rational normal CDF / inverse approximations
    │           - Gaussian copula execution
    │
    │       lossDistribution.js
    │       correlationRisk.js
    │       tranchePricer.js
    │       creditDeterioration.js
    │       capitalStructure.js
    │
    └── Chart.js (CDN)
            chart rendering
```

System properties:

- Fully client-side (no Python/SciPy backend required)
- No server or API
- Approximations for $\Phi(x)$ and $\Phi^{-1}(p)$ built-in
- Deployable as a static GitHub Pages project

---

## Usage

### Pricing Results

The engine computes expectations via $S$ simulation paths to evaluate generic index tranches based on homogenous assumptions.

---

## Numerical Implementation

- Box-Muller transform for standard normal variables
- Abramowitz & Stegun rational approximation for $\Phi(x)$
- Peter Acklam rational approximation for $\Phi^{-1}(p)$
- Uniform attachment points mapped locally

---

## Technology

- Vanilla JavaScript pricing engine
- Chart.js for visualization
- HTML/CSS interface
- Static deployment via GitHub Pages

---

## Result

A browser-based CDO pricing terminal for exploring correlation risk, tranche mechanics, loss distributions, and spread dynamics without requiring external infrastructure.
