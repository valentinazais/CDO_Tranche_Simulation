// ============================================================
// Module 2 — Correlation Risk Explorer
// ============================================================

const CorrelationRisk = (() => {
    "use strict";

    let chart = null;

    const TRANCHES = [
        { A: 0.00, D: 0.03, label: "Equity [0–3%]" },
        { A: 0.03, D: 0.07, label: "Mezzanine [3–7%]" },
        { A: 0.07, D: 0.15, label: "Senior [7–15%]" },
        { A: 0.15, D: 0.30, label: "Super-Senior [15–30%]" }
    ];

    const COLORS = [
        "rgb(192, 57, 43)",   // equity – red
        "rgb(39, 174, 96)",   // mezz – green
        "rgb(41, 128, 185)",  // senior – blue
        "rgb(127, 140, 141)"  // super-sr – grey
    ];

    function readInputs() {
        return {
            N: parseInt(document.getElementById("cr-N").value),
            cdsSpread: parseFloat(document.getElementById("cr-cdsSpread").value) / 10000,
            recovery: parseFloat(document.getElementById("cr-recovery").value),
            T: parseInt(document.getElementById("cr-T").value),
            r: parseFloat(document.getElementById("cr-r").value),
            sims: parseInt(document.getElementById("cr-sims").value),
            rhoMin: parseFloat(document.getElementById("cr-rhoMin").value),
            rhoMax: parseFloat(document.getElementById("cr-rhoMax").value),
            rhoSteps: parseInt(document.getElementById("cr-rhoSteps").value)
        };
    }

    function run() {
        const inp = readInputs();
        const btn = document.getElementById("cr-run");
        btn.disabled = true;
        btn.textContent = "Running…";

        setTimeout(() => {
            const step = (inp.rhoMax - inp.rhoMin) / (inp.rhoSteps - 1);
            const rhos = [];
            for (let i = 0; i < inp.rhoSteps; i++) {
                rhos.push(inp.rhoMin + i * step);
            }

            const datasets = TRANCHES.map((tr, idx) => ({
                label: tr.label,
                data: [],
                borderColor: COLORS[idx],
                backgroundColor: "transparent",
                tension: 0.3,
                pointRadius: 2,
                borderWidth: 2
            }));

            for (const rho of rhos) {
                const results = CDOEngine.priceMultipleTranches(
                    { ...inp, rho },
                    TRANCHES
                );
                results.forEach((res, idx) => {
                    datasets[idx].data.push(res.spreadBps);
                });
            }

            renderChart(rhos, datasets);
            renderTable(rhos, datasets);
            btn.disabled = false;
            btn.textContent = "Run Sweep";
        }, 50);
    }

    function renderChart(rhos, datasets) {
        const ctx = document.getElementById("cr-chart").getContext("2d");
        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: rhos.map(r => (r * 100).toFixed(0) + "%"),
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: "Tranche Spread vs. Correlation (ρ)",
                        font: { family: "Georgia, serif", size: 14, weight: "normal" },
                        color: "#1a1a1a"
                    },
                    legend: {
                        labels: { font: { size: 11 }, color: "#333" }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: "Correlation (ρ)", color: "#333" },
                        ticks: { color: "#555" },
                        grid: { display: false }
                    },
                    y: {
                        title: { display: true, text: "Tranche Spread (bps)", color: "#333" },
                        ticks: { color: "#555" },
                        grid: { color: "#eee" }
                    }
                }
            }
        });
    }

    function renderTable(rhos, datasets) {
        let html = "<table><thead><tr><th>ρ</th>";
        datasets.forEach(ds => { html += `<th>${ds.label}</th>`; });
        html += "</tr></thead><tbody>";
        rhos.forEach((rho, i) => {
            html += `<tr><td>${(rho * 100).toFixed(1)}%</td>`;
            datasets.forEach(ds => {
                html += `<td>${ds.data[i].toFixed(1)}</td>`;
            });
            html += "</tr>";
        });
        html += "</tbody></table>";
        document.getElementById("cr-stats").innerHTML = html;
    }

    return { run };
})();
