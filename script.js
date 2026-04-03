// ============================================================
//  REI DO POD CAF — script.js  (refatorado)
// ============================================================
 
const CONFIG = {
  whatsapp: "5545998078084",
  csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQestH5Bew_6ivl5vs3AxAFmHi23SPcBiPt9nEEi3SKZCK67wsfUrM7qNtQUvCuk7MVbQD_5bXfFYtf/pub?output=csv",
};
 
// ─── Utilitários ────────────────────────────────────────────
 
/**
 * Monta o link do WhatsApp com produto e sabor.
 */
function linkWhatsApp(produto, sabor) {
  const msg = `Olá! Gostaria de ${produto} sabor ${sabor}. Está disponível?`;
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
}
 
/**
 * Faz o parse do CSV (suporta vírgula ou ponto-e-vírgula como separador).
 * Retorna um Map: { id → [sabor, sabor, …] }
 */
function parseCsv(text) {
  const SEP = /[,;](?=(?:(?:[^"]*"){2})*[^"]*$)/;
  const estoque = new Map();
 
  text.split(/\r?\n/).forEach((linha, i) => {
    if (i === 0 || !linha.trim()) return;
 
    const cols = linha.split(SEP);
    if (cols.length < 3) return;
 
    const id     = cols[0].trim().toLowerCase();
    const sabor  = cols[1].trim();
    const status = cols[2].trim().toLowerCase();
 
    const disponivel = status.includes("disponív") || status.includes("disponiv");
    if (!disponivel || !sabor) return;
 
    if (!estoque.has(id)) estoque.set(id, []);
    estoque.get(id).push(sabor);
  });
 
  return estoque;
}
 
// ─── Renderização ────────────────────────────────────────────
 
/**
 * Cria o elemento <a> de um sabor com link direto para o WhatsApp.
 */
function criarBadgeSabor(produto, sabor) {
  const link = document.createElement("a");
  link.href   = linkWhatsApp(produto, sabor);
  link.target = "_blank";
  link.rel    = "noopener noreferrer";
  link.className = "sabor-badge";
  link.setAttribute("aria-label", `Pedir ${produto} sabor ${sabor} via WhatsApp`);
 
  link.innerHTML = `
    <span class="sabor-badge__glow"></span>
    <span class="sabor-badge__text">${sabor}</span>
  `;
  return link;
}
 
/**
 * Cria a mensagem de "sem estoque" para um container.
 */
function criarMsgSemEstoque() {
  const el = document.createElement("p");
  el.className = "sem-estoque";
  el.textContent = "Indisponível no momento";
  return el;
}
 
/**
 * Cria a mensagem de erro genérico.
 */
function criarMsgErro() {
  const el = document.createElement("p");
  el.className = "sem-estoque sem-estoque--erro";
  el.textContent = "⚠️ Erro ao carregar — tente recarregar a página.";
  return el;
}
 
/**
 * Preenche todos os containers [id^="sabores-"] com os dados do estoque.
 */
function renderizarEstoque(estoque) {
  const containers = document.querySelectorAll("[id^='sabores-']");
 
  containers.forEach(container => {
    const id = container.id.replace("sabores-", "").toLowerCase();
 
    // Pega o nome do produto no <h2> da section pai
    const section    = container.closest("section");
    const nomeProduto = section?.querySelector("h2")?.textContent.trim() ?? id.toUpperCase();
 
    // Limpa o estado de carregamento
    container.innerHTML = "";
 
    const sabores = estoque.get(id);
    if (sabores?.length) {
      const frag = document.createDocumentFragment();
      sabores.forEach(sabor => frag.appendChild(criarBadgeSabor(nomeProduto, sabor)));
      container.appendChild(frag);
    } else {
      container.appendChild(criarMsgSemEstoque());
    }
  });
}
 
// ─── Busca / Filtro ─────────────────────────────────────────
 
/**
 * Inicializa a barra de busca global (se existir no HTML).
 * Filtra as sections pelo nome do produto ou pelos sabores visíveis.
 */
function inicializarBusca() {
  const input = document.getElementById("busca-sabor");
  if (!input) return;
 
  input.addEventListener("input", () => {
    const termo = input.value.trim().toLowerCase();
    const sections = document.querySelectorAll("section.product-card");
 
    sections.forEach(section => {
      if (!termo) {
        section.hidden = false;
        return;
      }
 
      const nomeOk = section.querySelector("h2")
        ?.textContent.toLowerCase().includes(termo);
 
      const saborOk = [...section.querySelectorAll(".sabor-badge__text")]
        .some(el => el.textContent.toLowerCase().includes(termo));
 
      section.hidden = !(nomeOk || saborOk);
    });
  });
}
 
// ─── Entrada principal ───────────────────────────────────────
 
async function carregarEstoque() {
  try {
    const url      = `${CONFIG.csvUrl}&t=${Date.now()}`;
    const response = await fetch(url);
 
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
 
    const csv     = await response.text();
    const estoque = parseCsv(csv);
 
    renderizarEstoque(estoque);
  } catch (err) {
    console.error("[REI DO POD] Falha ao sincronizar catálogo:", err);
 
    // Mostra erro em todos os containers que ainda estão carregando
    document.querySelectorAll("[id^='sabores-']").forEach(container => {
      if (container.querySelector(".loading-animation")) {
        container.innerHTML = "";
        container.appendChild(criarMsgErro());
      }
    });
  }
}
 
document.addEventListener("DOMContentLoaded", () => {
  carregarEstoque();
  inicializarBusca();
});