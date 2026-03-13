// ============================================================
// Module 5 — Capital Structure Visualization
// ============================================================

const CapitalStructure = (() => {
    "use strict";

    let chart = null;

    const DEFAULT_TRANCHES = [
        { A: 0.00, D: 0.03, label: "Equity" },
        { A: 0.03, D: 0.07, label: "Mezzanine" },
        { A: 0.07, D: 0.15, label: "Senior" },
        { A: 0.15, D: 0.30, label: "Super-Senior" },
        { A: 0.30, D: 1.00, label: "Remainder" }
    ];

    const COLORS = [
        "rgba(192, 57, 43, 0.80)",
        "rgba(243, 156, 18, 0.80)",
        "rgba(39, 174, 96, 0.80)",
        "rgba(41, 128, 185, 0.80)",
        "rgba(149, 165, 166, 0.80)"
    ];

    function readInputs() {
        return {
            N: parseInt(document.getElementById("cs-N").value),
            cdsSpread: parseFloat(document.getElementById("cs-cdsSpread").value) / 10000,
            recovery: parseFloat(document.getElementById("cs-recovery").value),
            T: parseInt(document.getElementById("cs-T").value),
            r: parseFloat(document.getElementById("cs-r").value),
            rho: parseFloat(document.getElementById("cs-rho").value),
            sims: parseInt(document.getElementById("cs-sims").value)
        };
    }

    function parseTranches() {
        const raw = document.getElementById("cs-tranches").value.trim();
        if (!raw) return DEFAULT_TRANCHES;
        try {
            const lines = raw.split("\n").map(l => l.trim()).filter(l => l);
            return lines.map(line => {
                const parts = line.split(",").map(s => s.trim());
                return {
                    A: parseFloat(parts[0]) / 100,
                    D: parseFloat(parts[1]) / 100,
                    label: parts[2] || `[${parts[0]}–${parts[1]}%]`
                };
            });
        } catch {
            return DEFAULT_TRANCHES;
        }
    }

    function run() {
        const params = readInputs();
        const tranches = parseTranches();
        const btn = document.getElementById("cs-run");
        btn.disabled = true;
        btn.textContent = "Running…";

        setTimeout(() => {
            const results = CDOEngine.priceMultipleTranches(params, tranches);
            renderWaterfall(results);
            renderTable(results);
            btn.disabled = false;
            btn.textContent = "Build Structure";
        }, 50);
    }

    function renderWaterfall(results) {
        const ctx = document.getElementById("cs-chart").getContext("2d");
        if (chart) chart.destroy();

        // Stacked horizontal bar: each tranche is a segment
        const datasets = results.map((r, i) => ({
            label: r.label,
            data: [r.thickness * 100],
            backgroundColor: COLORS[i % COLORS.length],
            borderColor: "#fff",
            borderWidth: 1
        }));

        chart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Capital Structure"],
                datasets
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: "CDO Tranche Capital Structure",
                        font: { family: "Georgia, serif", size: 14, weight: "normal" },
                        color: "#1a1a1a"
                    },
                    legend: {
                        position: "bottom",
                        labels: { font: { size: 11 }, color: "#333" }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                const r = results[ctx.datasetIndex];
                                return `${r.label}: ${(r.thickness * 100).toFixed(1)}% width, ${r.spreadBps.toFixed(1)} bps`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: { display: true, text: "Portfolio Loss (%)", color: "#333" },
                        ticks: { color: "#555" },
                        grid: { color: "#eee" },
                        max: 100
                    },
                    y: {
                        stacked: true,
                        display: false
                    }
                }
            }
        });
    }

    function renderTable(results) {
        let html = `<table>
            <thead><tr>
                <th>Tranche</th><th>Attachment</th><th>Detachment</th>
                <th>Width</th><th>Spread (bps)</th><th>Expected Loss</th>
            </tr></thead><tbody>`;

        results.forEach(r => {
            html += `<tr>
                <td>${r.label}</td>
                <td>${(r.A * 100).toFixed(1)}%</td>
                <td>${(r.D * 100).toFixed(1)}%</td>
                <td>${(r.thickness * 100).toFixed(1)}%</td>
                <td>${r.spreadBps.toFixed(1)}</td>
                <td>${(r.expectedLoss * 100).toFixed(4)}%</td>
            </tr>`;
        });
        html += "</tbody></table>";
        document.getElementById("cs-stats").innerHTML = html;
    }

    return { run };
})();
