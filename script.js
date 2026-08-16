// ============================================================
//  REI DO POD CAF — script.js  (refatorado)
// ============================================================

const CONFIG = {
  whatsapp: "5545998078084",
  csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQestH5Bew_6ivl5vs3AxAFmHi23SPcBiPt9nEEi3SKZCK67wsfUrM7qNtQUvCuk7MVbQD_5bXfFYtf/pub?output=csv",
};

// ─── Catálogo de produtos ───────────────────────────────────
//
// `id` também é a chave usada para casar com a coluna A da planilha
// (ver parseCsv) — não altere sem atualizar a planilha também.
// `color` referencia as variações de badge definidas em style.css
// (data-color); omitido = azul padrão.
// `ativo: false` tira o produto do catálogo sem apagar os dados —
// pra reativar, é só remover essa propriedade (ou trocar para true).

const PRODUTOS = [
  // ── Ignite (linha V, por número crescente) ──────────────
  { id: "v55", title: "Ignite V55", alt: "Ignite V55", img: "IGNITE_V55.png",
    puffs: "5.500 Puffs", serie: "Ignite V55",
    label: "Disponível em Estoque", loadingText: "Buscando sabores…", ativo: true },

  { id: "v80", title: "Ignite V80", alt: "Ignite V80 Black", img: "IGNITE_V80_BLACK.png",
    puffs: "8.000 Puffs", serie: "Black Series",
    label: "Menu de Sabores", loadingText: "Sincronizando…", ativo: true },

  { id: "v150", title: "Ignite V150 Pro", alt: "Ignite V150 Pro", img: "IGNITE_V150_PRO.png",
    puffs: "15.000 Puffs", color: "amber", serie: "Pro Edition",
    label: "Menu de Sabores", loadingText: "Sincronizando estoque…", ativo: true },

  { id: "v155", title: "Ignite V155", alt: "Ignite V155", img: "IGNITE_V155.png",
    puffs: "15.500 Puffs", color: "purple", serie: "V155 Series",
    label: "Disponível em Estoque", loadingText: "Buscando sabores…", ativo: true },

  { id: "v200", title: "Ignite V200", alt: "Ignite V200", img: "IGNITE_200.png",
    puffs: "12.000 Puffs", color: "emerald", serie: "Airflow Control",
    label: "Explorar Sabores", loadingText: "Buscando estoque…", ativo: true },

  { id: "v250", title: "Ignite V250", alt: "Ignite V250", img: "IGNITE_V250.png",
    puffs: "25.000 Puffs", color: "red", serie: "Long Lasting",
    label: "Sabores em Estoque", loadingText: "Verificando sabores…", ativo: true },

  { id: "v300", title: "Ignite V300", alt: "Ignite V300", img: "IGNITE_V300.png",
    puffs: "30.000 Puffs", color: "indigo", serie: "Double Tank",
    label: "Sabores Disponíveis", loadingText: "Consultando estoque…", ativo: true },

  { id: "v400", title: "Ignite V400", alt: "Ignite V400", img: "IGNITE_V400_ICE.png",
    puffs: "40.000 Puffs", color: "pink", serie: "Turbo Mode",
    label: "Menu de Sabores", loadingText: "Sincronizando estoque…", ativo: true },

  { id: "v400slim", title: "Ignite V400 Ice Slim", alt: "Ignite V400 Ice Slim", img: "IGNITE_V400_ICE_SLIM.png",
    puffs: "40.000 Puffs", color: "indigo", serie: "Slim Design",
    label: "Sabores Ice Slim", loadingText: "Resfriando estoque…", ativo: true },

  { id: "v400mix", title: "Ignite V400 Mix", alt: "Ignite V400 Mix", img: "IGNITE_V400.png",
    puffs: "40.000 Puffs", color: "orange", serie: "Mixed Edition",
    label: "Sabores Mix Disponíveis", loadingText: "Carregando combinações…", ativo: true },

  { id: "v400sweet", title: "Ignite V400 Sweet", alt: "Ignite V400 Sweet", img: "IGNITE_V400_SWEET.png",
    puffs: "40.000 Puffs", color: "cyan", serie: "Sweet Series",
    label: "Sabores Adocicados", loadingText: "Consultando cardápio…", ativo: true },

  { id: "v500", title: "Ignite V500", alt: "Ignite V500", img: "IGNITE_V500.png",
    puffs: "50.000 Puffs", color: "yellow", serie: "Flagship Edition",
    label: "Sabores Premium", loadingText: "Carregando estoque flagship…", ativo: true },

  { id: "shisha", title: "Ignite Shisha 40K", alt: "Ignite Shisha 40K", img: "IGNITE_SHISHA_40K.png",
    puffs: "40.000 Puffs", color: "amber", serie: "Shisha Blend",
    label: "Sabores de Narguilé", loadingText: "Preparando o narguilé…", ativo: true },

  { id: "v100refil", title: "Refil Ignite P100", alt: "Refil Ignite P100", img: "REFIL_IGNITE_P100.png",
    puffs: "10.000 Puffs", color: "slate", serie: "Refill System",
    label: "Sabores de Reposição", loadingText: "Atualizando estoque…", ativo: true },

  // ── Life Pod (por puffs crescente) ──────────────────────
  { id: "liferef8k", title: "Refil Life 8K", alt: "Refil Life 8K", img: "REFIL_LIFE_POD.png",
    puffs: "8.000 Puffs", color: "lime", serie: "Life Pod Refill",
    label: "Sabores Life Pod", loadingText: "Sincronizando sabores…", ativo: true },

  { id: "liferef10k", title: "Refil Life 10K", alt: "Refil Life 10K", img: "REFIL_LIFE_10K.png",
    puffs: "10.000 Puffs", color: "emerald", serie: "Life Pod 10K",
    label: "Sabores em Estoque", loadingText: "Verificando sabores…", ativo: true },

  { id: "lifepodfit", title: "Life Pod Fit 30K", alt: "Life Pod Fit 30K", img: "LIFE_POD_FIT_30k.png",
    puffs: "30.000 Puffs", color: "lightblue", serie: "Fit Design",
    label: "Sabores Fit", loadingText: "Ajustando estoque…", ativo: true },

  { id: "v400life", title: "Life Pod 40K", alt: "Life Pod 40K", img: "LIFE_POD_40.000_DESCARTÁVEL.png",
    puffs: "40.000 Puffs", color: "teal", serie: "Extreme Life",
    label: "Sabores Disponíveis", loadingText: "Consultando estoque…", ativo: true },

  { id: "lifepodsk", title: "Life Pod SK", alt: "Life Pod SK", img: "LIFE_POD_SK.png",
    serie: "Special Edition",
    label: "Sabores Premium", loadingText: "Carregando estoque elite…", ativo: true },

  // ── Elfbar (por puffs crescente) ────────────────────────
  { id: "elfbar", title: "Elfbar TE 30K", alt: "Elfbar TE 30K", img: "ELFBAR_TE_30K.png",
    puffs: "30.000 Puffs", serie: "Elfbar Official",
    label: "Menu de Sabores", loadingText: "Sincronizando sabores…", ativo: true },

  { id: "iceking", title: "Elfbar Ice King 40K", alt: "Elfbar Ice King 40K", img: "ELFBAR_ICE_KING_40K.png",
    puffs: "40.000 Puffs", color: "sky", serie: "Ice King",
    label: "Experiência Ultra-Gelada", loadingText: "Congelando estoque…", ativo: true },

  // ── Outras marcas ────────────────────────────────────────
  { id: "blacksheep40k", title: "Black Sheep 40K", alt: "Black Sheep 40K", img: "BLACK_SHEEP_40K.png",
    puffs: "40.000 Puffs", color: "white", serie: "Black Edition", serieColor: "red",
    label: "Linha de Sabores", loadingText: "Sincronizando Black Sheep…", ativo: true },

  { id: "instabar", title: "Insta Bar 15K", alt: "Insta Bar 15K", img: "INSTA_BAR_15K.png",
    puffs: "15.000 Puffs", color: "purple-light", serie: "Trending", trending: true,
    label: "Sabores do Momento", loadingText: "Carregando feed…", ativo: false },

  { id: "flonq20k", title: "Flonq 20K", alt: "Flonq 20K", img: "FLONQ_20K.png",
    puffs: "20.000 Puffs", serie: "Smart Design",
    label: "Sabores Tecnológicos", loadingText: "Iniciando sistema…", ativo: false },

  { id: "airmez40k", title: "Airmez 40K", alt: "Airmez 40K", img: "AIRMEZ_40K.png",
    puffs: "40.000 Puffs", color: "cyan", serie: "Aero Flow",
    label: "Seleção de Sabores", loadingText: "Sincronizando ar…", ativo: true },

  { id: "frosty10k", title: "Frosty 10K", alt: "Frosty 10K", img: "Frosty_10k.png",
    puffs: "10.000 Puffs", color: "lightblue", serie: "Sub-Zero",
    label: "Sabores Gelados", loadingText: "Congelando sabores…", ativo: true },

  { id: "icity12k", title: "Icity 12K", alt: "Icity 12K", img: "ICITY_12K.png",
    puffs: "12.000 Puffs", color: "indigo", serie: "Urban Style",
    label: "City Flavors Menu", loadingText: "Mapeando estoque…", ativo: true },

  { id: "adalya50k", title: "Adalya 50K", alt: "Adalya 50K", img: "ADALYA_50K.png",
    puffs: "50.000 Puffs", color: "lightblue", serie: "Sub-Zero",
    label: "Sabores Gelados", loadingText: "Congelando sabores…", ativo: true },

  { id: "vozol20k", title: "Vozol 20K", alt: "Vozol 20K", img: "VOZOL_20K.png",
    puffs: "20.000 Puffs", color: "yellow", serie: "Top de Linha ⭐",
    label: "Sabores Premium", loadingText: "Carregando estoque elite…", ativo: true },

  { id: "lostyvape10k", title: "Losty Vape 10K", alt: "Losty Vape 10K", img: "LOSTY_VAPE_10K.png",
    puffs: "10.000 Puffs", color: "emerald", serie: "Losty Vape",
    label: "Sabores Premium", loadingText: "Carregando estoque elite…", ativo: true },

  { id: "extremebar30k", title: "Extreme Bar 30K", alt: "Extreme Bar 30K", img: "EXTREME_BAR_30.png",
    puffs: "30.000 Puffs", color: "red", serie: "Extreme Mode",
    label: "Sabores Premium", loadingText: "Carregando estoque elite…", ativo: true },
];

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

// ─── Renderização do catálogo ───────────────────────────────

/**
 * Cria o <span> de badge (puffs ou série), com a variação de cor
 * aplicada via atributo data-color (ver style.css).
 */
function criarBadge(classe, texto, cor) {
  const span = document.createElement("span");
  span.className = classe;
  if (cor) span.dataset.color = cor;
  span.textContent = texto;
  return span;
}

/**
 * Cria o badge de série especial "Trending" (com animação de pulso),
 * usado pelo Insta Bar 15K.
 */
function criarBadgeTrending(texto) {
  const span = document.createElement("span");
  span.className = "badge-serie";
  span.style.display = "flex";
  span.style.alignItems = "center";
  span.style.gap = ".3rem";
  span.innerHTML = `
    <span class="relative flex h-2 w-2">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
    </span>
  `;
  span.append(texto);
  return span;
}

/**
 * Monta o card completo de um produto a partir dos dados em PRODUTOS.
 */
function criarCardProduto(produto) {
  const section = document.createElement("section");
  section.id = produto.id;
  section.className = "product-card";

  const badges = document.createElement("div");
  badges.className = produto.puffs ? "card-badges" : "card-badges single";
  if (produto.puffs) badges.appendChild(criarBadge("badge-puffs", produto.puffs, produto.color));
  badges.appendChild(
    produto.trending
      ? criarBadgeTrending(produto.serie)
      : criarBadge("badge-serie", produto.serie, produto.serieColor ?? produto.color)
  );

  const imgWrap = document.createElement("div");
  imgWrap.className = "img-wrap";
  imgWrap.innerHTML = `<img src="img/${produto.img}" alt="${produto.alt}" loading="lazy">`;

  const h2 = document.createElement("h2");
  h2.textContent = produto.title;

  const label = document.createElement("p");
  label.className = "sabores-label";
  label.textContent = produto.label;

  const container = document.createElement("div");
  container.id = `sabores-${produto.id}`;
  container.className = "sabores-container";
  container.innerHTML = `
    <div class="loading-wrap">
      <div class="loading-animation"></div>
      <span class="loading-txt">${produto.loadingText}</span>
    </div>
  `;

  section.append(badges, imgWrap, h2, label, container);
  return section;
}

/**
 * Renderiza todos os cards do catálogo dentro de #grid.
 */
function renderizarCatalogo() {
  const grid = document.getElementById("grid");
  if (!grid) return;

  const frag = document.createDocumentFragment();
  PRODUTOS
    .filter(produto => produto.ativo !== false)
    .forEach(produto => frag.appendChild(criarCardProduto(produto)));
  grid.appendChild(frag);
}

// ─── Renderização de estoque (sabores) ──────────────────────

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

  const glow = document.createElement("span");
  glow.className = "sabor-badge__glow";

  const text = document.createElement("span");
  text.className = "sabor-badge__text";
  text.textContent = sabor;

  link.append(glow, text);
  return link;
}

/**
 * Cria a mensagem de "sem estoque" para um container.
 */
function criarMsgSemEstoque() {
  const el = document.createElement("p");
  el.className = "sem-estoque";
  el.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 3"/>
    </svg>
    Indisponível no momento
  `;
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
  renderizarCatalogo();
  carregarEstoque();
  inicializarBusca();
});
