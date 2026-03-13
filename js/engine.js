// ============================================================
// CDO Monte Carlo Engine
// Pure JavaScript port of the Python cdo_pricer foundation.
// ============================================================

const CDOEngine = (() => {
    "use strict";

    // --- Normal distribution utilities (no external library) ---

    // Standard normal CDF – rational approximation (Abramowitz & Stegun 26.2.17)
    function normCDF(x) {
        if (x === Infinity) return 1;
        if (x === -Infinity) return 0;
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        const sign = x < 0 ? -1 : 1;
        const absX = Math.abs(x);
        const t = 1.0 / (1.0 + p * absX);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX / 2);
        return 0.5 * (1.0 + sign * y);
    }

    // Inverse standard normal CDF – rational approximation (Peter Acklam)
    function normPPF(p) {
        if (p <= 0) return -Infinity;
        if (p >= 1) return Infinity;
        if (p === 0.5) return 0;

        const a = [
            -3.969683028665376e+01, 2.209460984245205e+02,
            -2.759285104469687e+02, 1.383577518672690e+02,
            -3.066479806614716e+01, 2.506628277459239e+00
        ];
        const b = [
            -5.447609879822406e+01, 1.615858368580409e+02,
            -1.556989798598866e+02, 6.680131188771972e+01,
            -1.328068155288572e+01
        ];
        const c = [
            -7.784894002430293e-03, -3.223964580411365e-01,
            -2.400758277161838e+00, -2.549732539343734e+00,
            4.374664141464968e+00, 2.938163982698783e+00
        ];
        const d = [
            7.784695709041462e-03, 3.224671290700398e-01,
            2.445134137142996e+00, 3.754408661907416e+00
        ];

        const pLow = 0.02425, pHigh = 1 - pLow;
        let q, r;

        if (p < pLow) {
            q = Math.sqrt(-2 * Math.log(p));
            return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
                ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
        } else if (p <= pHigh) {
            q = p - 0.5;
            r = q * q;
            return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
                (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
        } else {
            q = Math.sqrt(-2 * Math.log(1 - p));
            return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
                ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
        }
    }

    // Box-Muller standard normal random
    function randn() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    // --- Core simulation ---

    /**
     * Run Monte Carlo CDO simulation.
     * Returns an object with detailed results.
     *
     * @param {Object} params
     * @param {number} params.N         – number of names (default 125)
     * @param {number} params.cdsSpread – annual CDS spread (default 0.01)
     * @param {number} params.recovery  – recovery rate (default 0.4)
     * @param {number} params.T         – maturity in years (default 5)
     * @param {number} params.r         – risk-free rate (default 0.02)
     * @param {number} params.rho       – pairwise correlation (default 0.2)
     * @param {number} params.A         – attachment point (default 0.03)
     * @param {number} params.D         – detachment point (default 0.07)
     * @param {number} params.freq      – payment frequency per year (default 4)
     * @param {number} params.sims      – number of simulations (default 100000)
     */
    function simulate(params = {}) {
        const N         = params.N         ?? 125;
        const cdsSpread = params.cdsSpread ?? 0.01;
        const recovery  = params.recovery  ?? 0.4;
        const T         = params.T         ?? 5;
        const r         = params.r         ?? 0.02;
        const rho       = params.rho       ?? 0.2;
        const A         = params.A         ?? 0.03;
        const D         = params.D         ?? 0.07;
        const freq      = params.freq      ?? 4;
        const sims      = params.sims      ?? 100000;

        // Hazard rate and default probability
        const hazard = cdsSpread / (1 - recovery);
        const PD = 1 - Math.exp(-hazard * T);
        const threshold = normPPF(PD);

        const sqrtRho = Math.sqrt(rho);
        const sqrtOneMinusRho = Math.sqrt(1 - rho);

        // Monte Carlo
        const portfolioLoss = new Float64Array(sims);
        const trancheLoss = new Float64Array(sims);
        const thickness = D - A;

        for (let s = 0; s < sims; s++) {
            const M = randn(); // systematic factor
            let defaults = 0;
            for (let i = 0; i < N; i++) {
                const eps = randn();
                const X = sqrtRho * M + sqrtOneMinusRho * eps;
                if (X < threshold) defaults++;
            }
            const loss = defaults / N;
            portfolioLoss[s] = loss;
            trancheLoss[s] = Math.min(Math.max(loss - A, 0), thickness);
        }

        // Expected loss
        let sumTranche = 0;
        let sumPortfolio = 0;
        let sumPortfolioSq = 0;
        for (let s = 0; s < sims; s++) {
            sumTranche += trancheLoss[s];
            sumPortfolio += portfolioLoss[s];
            sumPortfolioSq += portfolioLoss[s] * portfolioLoss[s];
        }
        const EL = sumTranche / sims;
        const meanLoss = sumPortfolio / sims;
        const stdLoss = Math.sqrt(sumPortfolioSq / sims - meanLoss * meanLoss);

        // Premium leg (risky annuity, simplified)
        let premiumLeg = 0;
        for (let k = 1; k <= T * freq; k++) {
            const t = k / freq;
            premiumLeg += Math.exp(-r * t) * (1 / freq);
        }

        const trancheSpread = EL / premiumLeg;

        // VaR calculation
        const sorted = Array.from(portfolioLoss).sort((a, b) => a - b);
        const var95 = sorted[Math.floor(0.95 * sims)];
        const var99 = sorted[Math.floor(0.99 * sims)];

        return {
            trancheSpread,
            trancheSpreadBps: trancheSpread * 10000,
            expectedLoss: EL,
            meanPortfolioLoss: meanLoss,
            stdPortfolioLoss: stdLoss,
            var95,
            var99,
            portfolioLoss: Array.from(portfolioLoss),
            trancheLoss: Array.from(trancheLoss),
            PD,
            thickness,
            params: { N, cdsSpread, recovery, T, r, rho, A, D, freq, sims }
        };
    }

    /**
     * Price multiple tranches in one simulation run (shared factor draws).
     * @param {Object} baseParams – same as simulate(), but A and D are ignored
     * @param {Array}  tranches   – array of { A, D, label }
     */
    function priceMultipleTranches(baseParams, tranches) {
        const N         = baseParams.N         ?? 125;
        const cdsSpread = baseParams.cdsSpread ?? 0.01;
        const recovery  = baseParams.recovery  ?? 0.4;
        const T         = baseParams.T         ?? 5;
        const r         = baseParams.r         ?? 0.02;
        const rho       = baseParams.rho       ?? 0.2;
        const freq      = baseParams.freq      ?? 4;
        const sims      = baseParams.sims      ?? 100000;

        const hazard = cdsSpread / (1 - recovery);
        const PD = 1 - Math.exp(-hazard * T);
        const threshold = normPPF(PD);
        const sqrtRho = Math.sqrt(rho);
        const sqrtOneMinusRho = Math.sqrt(1 - rho);

        const nT = tranches.length;
        const trancheSums = new Float64Array(nT);

        for (let s = 0; s < sims; s++) {
            const M = randn();
            let defaults = 0;
            for (let i = 0; i < N; i++) {
                const eps = randn();
                const X = sqrtRho * M + sqrtOneMinusRho * eps;
                if (X < threshold) defaults++;
            }
            const loss = defaults / N;
            for (let t = 0; t < nT; t++) {
                const thick = tranches[t].D - tranches[t].A;
                trancheSums[t] += Math.min(Math.max(loss - tranches[t].A, 0), thick);
            }
        }

        let premiumLeg = 0;
        for (let k = 1; k <= T * freq; k++) {
            premiumLeg += Math.exp(-r * (k / freq)) * (1 / freq);
        }

        return tranches.map((tr, i) => {
            const EL = trancheSums[i] / sims;
            const spread = EL / premiumLeg;
            return {
                label: tr.label || `[${(tr.A * 100).toFixed(1)}%–${(tr.D * 100).toFixed(1)}%]`,
                A: tr.A,
                D: tr.D,
                thickness: tr.D - tr.A,
                expectedLoss: EL,
                spread,
                spreadBps: spread * 10000
            };
        });
    }

    return { simulate, priceMultipleTranches, normCDF, normPPF };
})();
