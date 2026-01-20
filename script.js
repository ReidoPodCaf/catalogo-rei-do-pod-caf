const LINK_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQestH5Bew_6ivl5vs3AxAFmHi23SPcBiPt9nEEi3SKZCK67wsfUrM7qNtQUvCuk7MVbQD_5bXfFYtf/pub?output=csv";

function criarLinkWhatsApp(produto, sabor) {
    const numero = "5545998078084"; //
    const mensagem = `Olá! Gostaria do ${produto} sabor ${sabor}. Está disponível?`;
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

async function carregarEstoqueReal() {
    try {
        const response = await fetch(`${LINK_CSV}&t=${new Date().getTime()}`);
        const csvText = await response.text();
        
        // Remove as mensagens de carregamento do HTML
        document.querySelectorAll('.loading-animation, .animate-pulse').forEach(msg => {
            const parent = msg.parentElement;
            if (parent && parent.classList.contains('flex-col')) parent.remove();
        });

        const linhas = csvText.split(/\r?\n/);
        const estoque = {};

        // Processamento da Planilha (Suporta vírgula ou ponto e vírgula)
        linhas.forEach((linha, index) => {
            if (index === 0 || !linha.trim()) return; 
            const colunas = linha.split(/[,;](?=(?:(?:[^"]*"){2})*[^"]*$)/);

            if (colunas.length >= 3) {
                const id = colunas[0].trim().toLowerCase();
                const sabor = colunas[1].trim();
                const status = colunas[2].trim().toLowerCase();
                
                // Filtro para produtos disponíveis
                if (status.includes("disponív") || status.includes("disponiv")) {
                    if (!estoque[id]) estoque[id] = [];
                    estoque[id].push(sabor);
                }
            }
        });

        // Seleciona todos os containers de sabores do seu HTML
        const todosContainers = document.querySelectorAll('[id^="sabores-"]');

        todosContainers.forEach(container => {
            const id = container.id.replace('sabores-', '').toLowerCase();
            container.innerHTML = ""; 

            if (estoque[id] && estoque[id].length > 0) {
                const card = container.closest('section') || container.parentElement;
                const h2 = card ? card.querySelector('h2') : null;
                const nomeProduto = h2 ? h2.textContent.trim() : id.toUpperCase();

                estoque[id].forEach(sabor => {
                    const link = document.createElement("a");
                    link.href = criarLinkWhatsApp(nomeProduto, sabor);
                    link.target = "_blank";
                    
                    // --- DESIGN DESTAQUE MÁXIMO (Estilo LED Neon) ---
                    link.className = `
                        group relative p-[2px] m-1.5 inline-block
                        rounded-xl overflow-hidden transition-all duration-500
                        hover:scale-110 active:scale-95 no-underline
                        shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]
                    `;
                    
                    link.innerHTML = `
                        <div class="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#10b981_50%,#3b82f6_100%)] opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div class="relative flex items-center justify-center px-6 py-3 bg-slate-900 rounded-[10px] text-white border border-white/10">
                            <span class="text-[11px] font-black uppercase tracking-[0.12em] group-hover:text-blue-300 transition-colors drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                                ${sabor}
                            </span>
                        </div>
                    `;
                    container.appendChild(link);
                });
            } else {
                // Feedback visual para falta de estoque
                const spanErro = document.createElement("span");
                spanErro.className = "text-red-500/80 text-[10px] font-bold uppercase tracking-widest animate-pulse py-4 block text-center w-full border border-red-500/10 rounded-xl bg-red-500/5";
                spanErro.innerHTML = `<span class="opacity-60 italic">Indisponível no momento</span>`;
                container.appendChild(spanErro);
            }
        });

    } catch (e) { 
        console.error("Falha ao sincronizar catálogo:", e); 
    }
}

document.addEventListener("DOMContentLoaded", carregarEstoqueReal);