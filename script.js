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
        
        // Remove mensagens de "Buscando sabores..."
        document.querySelectorAll('.loading-msg').forEach(msg => msg.remove());

        const linhas = csvText.split(/\r?\n/);
        const estoque = {};

        // Processa a planilha
        linhas.forEach((linha, index) => {
            if (index === 0 || !linha.trim()) return; 
            
            // Suporte para vírgula ou ponto e vírgula (Google Sheets Brasil)
            const colunas = linha.split(/[,;](?=(?:(?:[^"]*"){2})*[^"]*$)/);

            if (colunas.length >= 3) {
                const id = colunas[0].trim().toLowerCase();
                const sabor = colunas[1].trim();
                const status = colunas[2].trim().toLowerCase();
                
                // Filtra apenas o que está disponível (com ou sem acento)
                if (status.includes("disponív") || status.includes("disponiv")) {
                    if (!estoque[id]) estoque[id] = [];
                    estoque[id].push(sabor);
                }
            }
        });

        // Pega todos os containers de sabores que existem no seu HTML
        const todosContainers = document.querySelectorAll('[id^="sabores-"]');

        todosContainers.forEach(container => {
            const id = container.id.replace('sabores-', '').toLowerCase();
            container.innerHTML = ""; // Limpa o container antes de renderizar

            if (estoque[id] && estoque[id].length > 0) {
                // SE TEM SABORES: Cria os botões Neon
                const card = container.closest('section') || container.parentElement;
                const h2 = card ? card.querySelector('h2') : null;
                const nomeProduto = h2 ? h2.textContent.trim() : id.toUpperCase();

                estoque[id].forEach(sabor => {
                    const link = document.createElement("a");
                    link.href = criarLinkWhatsApp(nomeProduto, sabor);
                    link.target = "_blank";
                    link.className = "group relative p-[1px] m-1.5 inline-block rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 no-underline";
                    
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
            } else {
                // SE NÃO TEM NO ESTOQUE: Mostra o aviso
                const spanErro = document.createElement("span");
                spanErro.className = "text-red-500/70 text-[10px] font-bold uppercase tracking-widest italic py-2 block";
                spanErro.textContent = "❌ Falta no estoque";
                container.appendChild(spanErro);
            }
        });

    } catch (e) { 
        console.error("Erro ao carregar catálogo:", e); 
    }
}

// Inicia a carga quando o HTML estiver pronto
document.addEventListener("DOMContentLoaded", carregarEstoqueReal);