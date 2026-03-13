// ============================================================
// Module 3 — Arbitrary Tranche Pricer
// ============================================================

const TranchePricer = (() => {
    "use strict";

    function readInputs() {
        return {
            N: parseInt(document.getElementById("tp-N").value),
            cdsSpread: parseFloat(document.getElementById("tp-cdsSpread").value) / 10000,
            recovery: parseFloat(document.getElementById("tp-recovery").value),
            T: parseInt(document.getElementById("tp-T").value),
            r: parseFloat(document.getElementById("tp-r").value),
            rho: parseFloat(document.getElementById("tp-rho").value),
            A: parseFloat(document.getElementById("tp-A").value) / 100,
            D: parseFloat(document.getElementById("tp-D").value) / 100,
            freq: parseInt(document.getElementById("tp-freq").value),
            sims: parseInt(document.getElementById("tp-sims").value)
        };
    }

    function run() {
        const params = readInputs();
        const btn = document.getElementById("tp-run");
        btn.disabled = true;
        btn.textContent = "Pricing…";

        setTimeout(() => {
            const result = CDOEngine.simulate(params);
            renderResult(result, params);
            btn.disabled = false;
            btn.textContent = "Price Tranche";
        }, 50);
    }

    function renderResult(result, params) {
        const el = document.getElementById("tp-stats");
        el.innerHTML = `
            <table>
                <tr><td>Attachment Point</td><td>${(params.A * 100).toFixed(2)}%</td></tr>
                <tr><td>Detachment Point</td><td>${(params.D * 100).toFixed(2)}%</td></tr>
                <tr><td>Tranche Thickness</td><td>${((params.D - params.A) * 100).toFixed(2)}%</td></tr>
                <tr class="highlight"><td>Tranche Spread</td><td>${result.trancheSpreadBps.toFixed(2)} bps</td></tr>
                <tr><td>Expected Tranche Loss</td><td>${(result.expectedLoss * 100).toFixed(4)}%</td></tr>
                <tr><td>Mean Portfolio Loss</td><td>${(result.meanPortfolioLoss * 100).toFixed(4)}%</td></tr>
                <tr><td>Single-Name PD</td><td>${(result.PD * 100).toFixed(4)}%</td></tr>
            </table>
        `;
    }

    return { run };
})();
