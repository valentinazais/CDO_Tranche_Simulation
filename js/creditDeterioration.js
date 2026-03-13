// ============================================================
// Module 4 — Credit Deterioration Scenarios
// ============================================================

const CreditDeterioration = (() => {
    "use strict";

    let chart = null;

    const DEFAULT_TRANCHES = [
        { A: 0.00, D: 0.03, label: "Equity" },
        { A: 0.03, D: 0.07, label: "Mezzanine" },
        { A: 0.07, D: 0.15, label: "Senior" },
        { A: 0.15, D: 0.30, label: "Super-Senior" }
    ];

    const COLORS = [
        "rgba(192, 57, 43, 0.75)",
        "rgba(39, 174, 96, 0.75)",
        "rgba(41, 128, 185, 0.75)",
        "rgba(127, 140, 141, 0.75)"
    ];

    function readInputs() {
        return {
            N: parseInt(document.getElementById("cd-N").value),
            baseSpread: parseFloat(document.getElementById("cd-baseSpread").value),
            recovery: parseFloat(document.getElementById("cd-recovery").value),
            T: parseInt(document.getElementById("cd-T").value),
            r: parseFloat(document.getElementById("cd-r").value),
            rho: parseFloat(document.getElementById("cd-rho").value),
            sims: parseInt(document.getElementById("cd-sims").value),
            shocks: document.getElementById("cd-shocks").value
                .split(",")
                .map(s => parseFloat(s.trim()))
                .filter(s => !isNaN(s))
        };
    }

    function run() {
        const inp = readInputs();
        const btn = document.getElementById("cd-run");
        btn.disabled = true;
        btn.textContent = "Running…";

        setTimeout(() => {
            const scenarios = [0, ...inp.shocks]; // base + shocks
            const scenarioLabels = scenarios.map(s =>
                s === 0 ? `Base (${inp.baseSpread} bps)` : `+${s} bps`
            );

            const allResults = [];
            for (const shock of scenarios) {
                const cdsSpread = (inp.baseSpread + shock) / 10000;
                const results = CDOEngine.priceMultipleTranches(
                    { N: inp.N, cdsSpread, recovery: inp.recovery, T: inp.T, r: inp.r, rho: inp.rho, sims: inp.sims },
                    DEFAULT_TRANCHES
                );
                allResults.push(results);
            }

            renderChart(scenarioLabels, allResults);
            renderTable(scenarioLabels, allResults);
            btn.disabled = false;
            btn.textContent = "Run Scenarios";
        }, 50);
    }

    function renderChart(scenarioLabels, allResults) {
        const ctx = document.getElementById("cd-chart").getContext("2d");
        if (chart) chart.destroy();

        const datasets = DEFAULT_TRANCHES.map((tr, tIdx) => ({
            label: tr.label,
            data: allResults.map(r => r[tIdx].spreadBps),
            backgroundColor: COLORS[tIdx],
            borderColor: COLORS[tIdx].replace("0.75", "1"),
            borderWidth: 1
        }));

        chart = new Chart(ctx, {
            type: "bar",
            data: { labels: scenarioLabels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: "Tranche Spreads Under Credit Stress",
                        font: { family: "Georgia, serif", size: 14, weight: "normal" },
                        color: "#1a1a1a"
                    },
                    legend: {
                        labels: { font: { size: 11 }, color: "#333" }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: "Scenario", color: "#333" },
                        ticks: { color: "#555" },
                        grid: { display: false }
                    },
                    y: {
                        title: { display: true, text: "Spread (bps)", color: "#333" },
                        ticks: { color: "#555" },
                        grid: { color: "#eee" }
                    }
                }
            }
        });
    }

    function renderTable(scenarioLabels, allResults) {
        let html = "<table><thead><tr><th>Tranche</th>";
        scenarioLabels.forEach(l => { html += `<th>${l}</th>`; });
        html += "</tr></thead><tbody>";

        DEFAULT_TRANCHES.forEach((tr, tIdx) => {
            html += `<tr><td>${tr.label}</td>`;
            allResults.forEach((r, sIdx) => {
                const bps = r[tIdx].spreadBps.toFixed(1);
                if (sIdx === 0) {
                    html += `<td>${bps}</td>`;
                } else {
                    const delta = r[tIdx].spreadBps - allResults[0][tIdx].spreadBps;
                    const pct = allResults[0][tIdx].spreadBps > 0
                        ? ((delta / allResults[0][tIdx].spreadBps) * 100).toFixed(1)
                        : "—";
                    html += `<td>${bps} <span class="delta">(+${delta.toFixed(1)}, ${pct}%)</span></td>`;
                }
            });
            html += "</tr>";
        });
        html += "</tbody></table>";
        document.getElementById("cd-stats").innerHTML = html;
    }

    return { run };
})();
