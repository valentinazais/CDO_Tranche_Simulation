// ============================================================
// Module 1 — Portfolio Loss Distribution
// ============================================================

const LossDistribution = (() => {
    "use strict";

    let chart = null;

    function readInputs() {
        return {
            N: parseInt(document.getElementById("ld-N").value),
            cdsSpread: parseFloat(document.getElementById("ld-cdsSpread").value) / 10000,
            recovery: parseFloat(document.getElementById("ld-recovery").value),
            T: parseInt(document.getElementById("ld-T").value),
            r: parseFloat(document.getElementById("ld-r").value),
            rho: parseFloat(document.getElementById("ld-rho").value),
            sims: parseInt(document.getElementById("ld-sims").value),
            A: 0, D: 1 // full portfolio
        };
    }

    function run() {
        const params = readInputs();
        const btn = document.getElementById("ld-run");
        btn.disabled = true;
        btn.textContent = "Running…";

        setTimeout(() => {
            const result = CDOEngine.simulate(params);
            renderHistogram(result.portfolioLoss, params);
            renderStats(result);
            btn.disabled = false;
            btn.textContent = "Run Simulation";
        }, 50);
    }

    function renderHistogram(losses, params) {
        const nBins = 50;
        const maxLoss = Math.max(...losses);
        const binWidth = maxLoss / nBins || 0.001;
        const bins = new Array(nBins).fill(0);
        const labels = [];

        for (let i = 0; i < nBins; i++) {
            labels.push(((i * binWidth) * 100).toFixed(2) + "%");
        }
        for (const l of losses) {
            const idx = Math.min(Math.floor(l / binWidth), nBins - 1);
            bins[idx]++;
        }
        // Normalize to density
        const total = losses.length;
        const density = bins.map(b => b / total);

        const ctx = document.getElementById("ld-chart").getContext("2d");
        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Portfolio Loss Density",
                    data: density,
                    backgroundColor: "rgba(44, 62, 80, 0.65)",
                    borderColor: "rgba(44, 62, 80, 1)",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: `Portfolio Loss Distribution (N=${params.N}, ρ=${params.rho}, ${params.sims.toLocaleString()} sims)`,
                        font: { family: "Georgia, serif", size: 14, weight: "normal" },
                        color: "#1a1a1a"
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: "Portfolio Loss (%)", color: "#333" },
                        ticks: { maxTicksLimit: 12, color: "#555" },
                        grid: { display: false }
                    },
                    y: {
                        title: { display: true, text: "Density", color: "#333" },
                        ticks: { color: "#555" },
                        grid: { color: "#eee" }
                    }
                }
            }
        });
    }

    function renderStats(result) {
        const el = document.getElementById("ld-stats");
        el.innerHTML = `
            <table>
                <tr><td>Mean Portfolio Loss</td><td>${(result.meanPortfolioLoss * 100).toFixed(4)}%</td></tr>
                <tr><td>Std Dev</td><td>${(result.stdPortfolioLoss * 100).toFixed(4)}%</td></tr>
                <tr><td>VaR 95%</td><td>${(result.var95 * 100).toFixed(4)}%</td></tr>
                <tr><td>VaR 99%</td><td>${(result.var99 * 100).toFixed(4)}%</td></tr>
                <tr><td>Default Probability (single name)</td><td>${(result.PD * 100).toFixed(4)}%</td></tr>
            </table>
        `;
    }

    return { run };
})();
