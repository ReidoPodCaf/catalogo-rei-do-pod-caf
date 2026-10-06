// ============================================================
//  REI DO POD CAF — script.js  (catálogo de sabores)
//  Os produtos e sabores vêm do Supabase (cadastrados pelo painel
//  admin.html). Usa CONFIG e os utilitários de comum.js.
// ============================================================

// ─── Dados ──────────────────────────────────────────────────

/**
 * Busca os produtos ativos com seus sabores, na ordem definida no painel.
 * A leitura é pública; as regras do banco (RLS) só entregam produtos ativos.
 */
async function buscarCatalogo() {
  // "*" traz também a data de cadastro, usada no selo "Novo"
  const campos = "*,sabores(nome,disponivel,ordem)";
  const url = `${CONFIG.supabaseUrl}/rest/v1/produtos?select=${campos}` +
              "&ativo=eq.true&order=ordem.asc,nome.asc&sabores.order=ordem.asc,nome.asc";

  const resposta = await fetch(url, { headers: { apikey: CONFIG.supabaseKey } });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

/** Sabores que podem ser pedidos agora. */
function saboresDisponiveis(produto) {
  return produto.sabores.filter(s => s.disponivel).map(s => s.nome);
}

/** Produto tem alguma coisa para pedir agora? */
function temEstoque(produto) {
  return produto.sem_sabor ? produto.em_estoque : saboresDisponiveis(produto).length > 0;
}

/** Por quantos dias depois do cadastro o produto leva o selo "Novo". */
const DIAS_NOVO = 7;

/** Produto cadastrado há pouco tempo? (sem data de cadastro, nunca é novo) */
function ehNovo(produto) {
  const cadastro = Date.parse(produto.criado_em ?? produto.created_at);
  return Date.now() - cadastro < DIAS_NOVO * 24 * 60 * 60 * 1000;
}

// ─── Utilitários ────────────────────────────────────────────

/**
 * Monta o link do WhatsApp com produto e sabor.
 */
function linkWhatsApp(produto, sabor) {
  const msg = sabor
    ? `Olá! Gostaria de ${produto} sabor ${sabor}. Está disponível?`
    : `Olá! Gostaria de ${produto}. Está disponível?`;
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
}

// ─── Card de produto ────────────────────────────────────────

function criarBadge(classe, texto) {
  const span = document.createElement("span");
  span.className = classe;
  span.textContent = texto;
  return span;
}

const ICONE_COMPARTILHAR = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/>
    <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/>
  </svg>`;

/**
 * Botão que compartilha o link direto do produto (…/sabores.html#v400).
 * No celular abre o menu de compartilhar; no computador copia o link.
 */
function criarBotaoCompartilhar(produto) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-compartilhar";
  btn.setAttribute("aria-label", `Compartilhar link do ${produto.nome}`);
  btn.innerHTML = ICONE_COMPARTILHAR;

  btn.addEventListener("click", async () => {
    const url = `${location.origin}${location.pathname}#${produto.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: produto.nome, text: `${produto.nome} — REI DO POD CAF`, url }); }
      catch { /* cliente cancelou */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      btn.dataset.copiado = "";
      btn.setAttribute("aria-label", "Link copiado!");
      setTimeout(() => {
        delete btn.dataset.copiado;
        btn.setAttribute("aria-label", `Compartilhar link do ${produto.nome}`);
      }, 2000);
    } catch {
      prompt("Copie o link do produto:", url);
    }
  });
  return btn;
}

/**
 * Cria o elemento <a> de um sabor com link direto para o WhatsApp.
 * `ordem` escalona a animação de entrada; ao tocar, o sabor fica
 * dourado com ✓ por alguns segundos (resposta visual do pedido).
 */
function criarBadgeSabor(nomeProduto, sabor, ordem = 0) {
  const link = document.createElement("a");
  link.href   = linkWhatsApp(nomeProduto, sabor);
  link.target = "_blank";
  link.rel    = "noopener noreferrer";
  link.className = "sabor-badge";
  link.style.setProperty("--i", ordem);
  link.setAttribute("aria-label", sabor ? `Pedir ${nomeProduto} sabor ${sabor} via WhatsApp` : `Pedir ${nomeProduto} via WhatsApp`);

  const text = document.createElement("span");
  text.className = "sabor-badge__text";
  text.textContent = sabor || "Fazer Pedido";
  link.append(text);

  link.addEventListener("click", () => {
    link.classList.add("clicado");
    setTimeout(() => link.classList.remove("clicado"), 2500);
  });
  return link;
}

function criarMsgSemEstoque() {
  const el = document.createElement("p");
  el.className = "sem-estoque";
  el.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 3"/>
    </svg>
    Indisponível no momento
  `;
  return el;
}

/**
 * Monta o card completo de um produto.
 */
function criarCardProduto(produto) {
  const section = document.createElement("section");
  section.id = produto.id;
  section.dataset.marca = produto.marca;
  section.className = "product-card";
  section.style.viewTransitionName = `card-${produto.id}`;

  const badges = document.createElement("div");
  badges.className = produto.puffs ? "card-badges" : "card-badges single";
  if (produto.puffs) badges.appendChild(criarBadge("badge-puffs", formatarPuffs(produto.puffs)));
  if (produto.serie) badges.appendChild(criarBadge("badge-serie", produto.serie));

  const imgWrap = document.createElement("div");
  imgWrap.className = "img-wrap";
  const img = document.createElement("img");
  img.src = urlImagem(produto.imagem);
  img.alt = produto.nome;
  img.loading = "lazy";
  imgWrap.append(img);
  if (ehNovo(produto)) imgWrap.append(criarBadge("badge-novo", "Novo"));

  const titulo = document.createElement("div");
  titulo.className = "card-titulo";
  const h2 = document.createElement("h2");
  h2.textContent = produto.nome;
  titulo.append(h2, criarBotaoCompartilhar(produto));

  const label = document.createElement("p");
  label.className = "sabores-label";
  label.textContent = produto.sem_sabor ? "Disponibilidade" : "Sabores disponíveis";

  const container = document.createElement("div");
  container.className = "sabores-container";

  if (!temEstoque(produto)) {
    container.appendChild(criarMsgSemEstoque());
  } else if (produto.sem_sabor) {
    container.appendChild(criarBadgeSabor(produto.nome));
  } else {
    saboresDisponiveis(produto).forEach((sabor, i) =>
      container.appendChild(criarBadgeSabor(produto.nome, sabor, i)));
  }

  section.append(badges, imgWrap, titulo, label, container);
  return section;
}

/**
 * Cards "fantasma" pulsando enquanto o catálogo carrega pela primeira vez.
 */
function mostrarEsqueleto() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  grid.setAttribute("aria-busy", "true");
  grid.innerHTML = Array.from({ length: 6 }, () => `
    <div class="product-card card-esqueleto" aria-hidden="true">
      <div class="esqueleto"><span style="width:100%;height:11rem;border-radius:1rem"></span></div>
      <div class="esqueleto" style="margin:1rem 0"><span style="width:60%;height:1.8rem"></span></div>
      <div class="esqueleto"><span style="width:5.5rem"></span><span style="width:7rem"></span><span style="width:4.5rem"></span></div>
    </div>`).join("");
}

/**
 * Desenha todos os cards: com estoque primeiro, esgotados no fim
 * (mantendo a ordem do painel dentro de cada grupo).
 */
function renderizarCatalogo(produtos) {
  const grid = document.getElementById("grid");
  if (!grid) return;

  const ordenados = [...produtos.filter(temEstoque), ...produtos.filter(p => !temEstoque(p))];
  const frag = document.createDocumentFragment();
  ordenados.forEach(produto => frag.appendChild(criarCardProduto(produto)));

  grid.replaceChildren(frag);
  grid.removeAttribute("aria-busy");
}

function mostrarErro() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  grid.removeAttribute("aria-busy");
  grid.innerHTML = `
    <p class="sem-estoque sem-estoque--erro" style="grid-column:1/-1">
      Não foi possível carregar o catálogo agora — tente recarregar a página.
    </p>`;
}

// ─── Movimento ──────────────────────────────────────────────

const REDUZIR_MOVIMENTO = matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Cards entram (sobem e aparecem) conforme chegam na tela ao rolar.
 * Cards lado a lado entram um pouco depois do outro (--ordem).
 * Sem suporte ou com "reduzir movimento" ligado, aparecem direto.
 */
function animarEntradaDosCards() {
  if (REDUZIR_MOVIMENTO || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(entradas => {
    let ordem = 0;
    entradas.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      observer.unobserve(target);
      target.style.setProperty("--ordem", ordem++);
      target.classList.add("visivel");
      // depois de entrar, volta ao normal (libera o efeito de hover)
      target.addEventListener("transitionend", () => {
        target.classList.remove("revelar", "visivel");
        target.style.removeProperty("--ordem");
      }, { once: true });
    });
  }, { rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll(".product-card").forEach(card => {
    card.classList.add("revelar");
    observer.observe(card);
  });
}

/**
 * Marca a barra de busca como "grudada" quando ela chega no topo,
 * para ganhar borda e sombra.
 */
function observarBarraFixa() {
  const barra = document.getElementById("ferramentas");
  if (!barra || !("IntersectionObserver" in window)) return;

  const marcador = document.createElement("div");
  marcador.setAttribute("aria-hidden", "true");
  barra.before(marcador);
  new IntersectionObserver(([e]) => barra.classList.toggle("grudado", !e.isIntersecting))
    .observe(marcador);
}

/**
 * Depois de filtrar, se a pessoa já tinha rolado a página, volta pro
 * começo da lista (logo abaixo da barra) para ver os resultados.
 */
function voltarAoInicioDaLista() {
  const grid  = document.getElementById("grid");
  const barra = document.getElementById("ferramentas");
  if (!grid || !barra) return;

  const topoDaLista = grid.getBoundingClientRect().top + scrollY - barra.offsetHeight - 12;
  if (scrollY > topoDaLista) scrollTo({ top: topoDaLista, behavior: REDUZIR_MOVIMENTO ? "auto" : "smooth" });
}

/**
 * Se a página foi aberta com #id de um produto (link compartilhado),
 * rola até ele e destaca o card. Roda uma vez, na primeira vez que os
 * cards aparecem.
 */
let linkDiretoTratado = false;
function focarProdutoDoLink() {
  if (linkDiretoTratado) return;
  linkDiretoTratado = true;

  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const card = document.getElementById(id);
  if (!card?.classList.contains("product-card")) return;

  card.scrollIntoView({ block: "center" });
  card.classList.add("destaque");
  setTimeout(() => card.classList.remove("destaque"), 2500);
}

// ─── Busca / Filtro ─────────────────────────────────────────

let marcaSelecionada = null; // null = todas

/**
 * Mostra só os cards da marca escolhida cujo nome ou algum sabor contém
 * o texto da busca, sem diferenciar acento ("maca" encontra "MAÇÃ").
 * Roda ao digitar, ao trocar de marca e depois de cada atualização do
 * catálogo, para o filtro continuar valendo quando os dados mudam.
 */
function aplicarFiltros() {
  const input = document.getElementById("busca-sabor");
  const termo = normalizar(input?.value ?? "");
  let visiveis = 0;

  document.querySelectorAll("section.product-card").forEach(section => {
    const marcaOk = !marcaSelecionada || section.dataset.marca === marcaSelecionada;
    const textos  = [section.querySelector("h2"), ...section.querySelectorAll(".sabor-badge__text")];
    const buscaOk = !termo || textos.some(el => normalizar(el?.textContent ?? "").includes(termo));

    section.hidden = !(marcaOk && buscaOk);
    if (!section.hidden) visiveis++;
  });

  const aviso = document.getElementById("sem-resultados");
  if (aviso) {
    aviso.hidden = visiveis > 0;
    aviso.querySelector("span").textContent =
      [input?.value.trim(), marcaSelecionada].filter(Boolean).join(" em ");
  }
}

function inicializarBusca() {
  document.getElementById("busca-sabor")?.addEventListener("input", () => {
    aplicarFiltros();
    voltarAoInicioDaLista();
  });
}

/**
 * Um botão por marca (na ordem em que aparecem no catálogo) + "Todas".
 * É refeito quando o catálogo atualiza; se a marca escolhida deixar de
 * existir, volta para "Todas".
 */
function renderizarFiltroMarcas(produtos) {
  const wrap = document.getElementById("filtro-marcas");
  if (!wrap) return;

  const marcas = [...new Set(produtos.map(p => p.marca))];
  if (!marcas.includes(marcaSelecionada)) marcaSelecionada = null;

  const botoes = [null, ...marcas].map(marca => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filtro-marca";
    btn.textContent = marca ?? "Todas";
    btn.setAttribute("aria-pressed", String(marca === marcaSelecionada));
    btn.addEventListener("click", () => {
      const trocar = () => {
        marcaSelecionada = marca;
        botoes.forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
        aplicarFiltros();
      };
      // Cards deslizam para a nova posição (Chrome/Safari recentes);
      // nos outros navegadores a troca é direta.
      if (document.startViewTransition && !REDUZIR_MOVIMENTO) document.startViewTransition(trocar);
      else trocar();
      voltarAoInicioDaLista();
    });
    return btn;
  });
  wrap.replaceChildren(...botoes);
}

// ─── Entrada principal ───────────────────────────────────────

// Último catálogo recebido, guardado no navegador do cliente: na próxima
// visita os produtos aparecem na hora, e a versão nova atualiza a tela
// assim que chegar. Se o navegador bloquear o armazenamento, só não usa.
const CACHE_KEY = "reidopod:catalogo";

function lerCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; }
}

function salvarCache(produtos) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(produtos)); } catch { /* sem cache */ }
}

let primeiraExibicao = true;
function mostrarCatalogo(produtos) {
  renderizarCatalogo(produtos);
  renderizarFiltroMarcas(produtos);
  aplicarFiltros();
  // anima a entrada só na primeira vez; na atualização silenciosa, não
  if (primeiraExibicao) animarEntradaDosCards();
  focarProdutoDoLink();
  primeiraExibicao = false;
}

async function carregarCatalogo() {
  const cache = lerCache();
  if (Array.isArray(cache) && cache.length) mostrarCatalogo(cache);
  else mostrarEsqueleto();

  try {
    const produtos = await buscarCatalogo();
    if (JSON.stringify(produtos) !== JSON.stringify(cache)) {
      mostrarCatalogo(produtos);
      salvarCache(produtos);
    }
  } catch (err) {
    console.error("[REI DO POD] Falha ao carregar o catálogo:", err);
    if (!primeiraExibicao) return; // segue mostrando a última versão conhecida
    mostrarErro();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  carregarCatalogo();
  inicializarBusca();
  observarBarraFixa();
});
