const LINK_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQestH5Bew_6ivl5vs3AxAFmHi23SPcBiPt9nEEi3SKZCK67wsfUrM7qNtQUvCuk7MVbQD_5bXfFYtf/pub?output=csv";

function criarLinkWhatsApp(produto, sabor) {
    const numero = "5545998078084";
    const mensagem = `Olá! Gostaria do ${produto} sabor ${sabor}. Está disponível?`;
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

async function carregarEstoqueReal() {
    try {
        const response = await fetch(`${LINK_CSV}&t=${new Date().getTime()}`);
        const csvText = await response.text();
        const linhas = csvText.split(/\r?\n/);
        const estoque = {};

        linhas.forEach((linha, index) => {
            if (index === 0 || !linha.trim()) return; 
            const colunas = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (colunas.length >= 3) {
                const id = colunas[0].trim().toLowerCase();
                const sabor = colunas[1].trim();
                const status = colunas[2].trim().toLowerCase();
                if (status.includes("disponível")) {
                    if (!estoque[id]) estoque[id] = [];
                    estoque[id].push(sabor);
                }
            }
        });

        Object.keys(estoque).forEach(id => {
            const container = document.getElementById(`sabores-${id}`);
            if (container) {
                const card = container.closest('section');
                const nomeProduto = card ? card.querySelector('h2').textContent : id.toUpperCase();
                container.innerHTML = ""; 

                estoque[id].forEach(sabor => {
                    const link = document.createElement("a");
                    link.href = criarLinkWhatsApp(nomeProduto, sabor);
                    link.target = "_blank"; 
                    
                    // --- DESIGN "ULTRA GLOW NEON" ---
                    link.className = `
                        group relative p-[1px] m-1.5 inline-block
                        rounded-lg overflow-hidden transition-all duration-300
                        hover:scale-105 active:scale-95 no-underline
                    `;
                    
                    // Estrutura interna para criar a borda brilhante e o fundo escuro
                    link.innerHTML = `
                        <div class="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#10b981_50%,#3b82f6_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div class="relative flex items-center justify-center px-4 py-2 bg-slate-900 rounded-[7px] text-white/90">
                            <span class="text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">
                                ${sabor}
                            </span>
                        </div>
                    `;
                    
                    container.appendChild(link);
                });
            }
        });
    } catch (e) { console.error(e); }
}

document.addEventListener("DOMContentLoaded", carregarEstoqueReal);