// ============================================================
//  REI DO POD CAF — admin.js  (painel do dono)
//  Login, lista de produtos, cadastro/edição com foto e sabores,
//  mostrar/esconder no site, reordenar e remover.
//  Toda gravação passa pelas regras do banco (RLS): só um e-mail
//  cadastrado na tabela `admins` consegue alterar alguma coisa.
// ============================================================

const db = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
const BUCKET = "produtos";

const $ = id => document.getElementById(id);

let produtos = [];          // lista carregada do banco (inclui escondidos)
let emEdicao = null;        // produto sendo editado (null = novo)
let fotoNova = null;        // Blob WebP escolhido no formulário
let saboresForm = [];       // [{ nome, disponivel }]
let paraRemover = null;
let estadoInicial = "";     // formulário como estava ao abrir (para avisar antes de sair)

// ─── Telas ──────────────────────────────────────────────────

function mostrarTela(id) {
  for (const tela of ["tela-login", "tela-sem-acesso", "tela-painel"]) {
    $(tela).hidden = tela !== id;
  }
}

function avisar(texto, tipo = "ok") {
  const el = document.createElement("div");
  el.className = `aviso aviso--${tipo}`;
  el.textContent = texto;
  $("avisos").append(el);
  setTimeout(() => el.remove(), 4000);
}

// Aviso guardado antes de recarregar a página (ex.: "produto cadastrado!").
const AVISO_KEY = "reidopod:aviso";

function mostrarAvisoPendente() {
  try {
    const texto = sessionStorage.getItem(AVISO_KEY);
    sessionStorage.removeItem(AVISO_KEY);
    if (texto) avisar(texto);
  } catch { /* sem armazenamento, sem aviso */ }
}

function mostrarErro(elId, texto) {
  const el = $(elId);
  el.textContent = texto;
  el.hidden = !texto;
}

/** Mensagens do Supabase em português, para o dono entender. */
function traduzirErro(err) {
  const msg = String(err?.message ?? err ?? "");
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(msg)) return "Este e-mail ainda não foi confirmado.";
  if (/row-level security|permission denied|42501/i.test(msg)) return "Sua conta não tem permissão para isso.";
  if (/duplicate key|23505/i.test(msg)) return "Tem um sabor repetido na lista.";
  if (/payload too large|exceeded the maximum/i.test(msg)) return "A foto é grande demais.";
  if (/failed to fetch|network/i.test(msg)) return "Sem conexão com o servidor. Confira a internet e tente de novo.";
  return "Algo deu errado. Tente de novo. (" + msg + ")";
}

// ─── Login ──────────────────────────────────────────────────

async function entrar(e) {
  e.preventDefault();
  mostrarErro("login-erro", "");
  const email = $("login-email").value.trim();
  const senha = $("login-senha").value;
  if (!email || !senha) return mostrarErro("login-erro", "Preencha e-mail e senha.");

  const btn = e.submitter;
  btn.disabled = true;
  const { error } = await db.auth.signInWithPassword({ email, password: senha });
  btn.disabled = false;
  if (error) mostrarErro("login-erro", traduzirErro(error));
  // se deu certo, onAuthStateChange abre o painel
}

async function sair() {
  await db.auth.signOut();
  produtos = [];
  mostrarTela("tela-login");
}

/** Confere se a conta logada é admin (a pessoa só enxerga a própria linha). */
async function ehAdmin() {
  const { data, error } = await db.from("admins").select("email").limit(1);
  return !error && data.length > 0;
}

async function abrirPainel() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return mostrarTela("tela-login");
  if (!(await ehAdmin())) return mostrarTela("tela-sem-acesso");

  $("usuario-email").textContent = user.email;
  mostrarTela("tela-painel");
  mostrarAvisoPendente();
  carregarProdutos();
}

// ─── Lista de produtos ──────────────────────────────────────

async function carregarProdutos() {
  $("lista-carregando").hidden = false;
  const { data, error } = await db
    .from("produtos")
    .select("id,nome,marca,puffs,serie,imagem,ativo,sem_sabor,em_estoque,ordem,sabores(nome,disponivel,ordem)")
    .order("ordem").order("nome")
    .order("ordem", { referencedTable: "sabores" });
  $("lista-carregando").hidden = true;

  if (error) return avisar(traduzirErro(error), "erro");
  produtos = data;
  $("marcas-existentes").replaceChildren(
    ...[...new Set(produtos.map(p => p.marca))].map(m => Object.assign(document.createElement("option"), { value: m }))
  );
  renderizarLista();
}

function resumoEstoque(p) {
  if (p.sem_sabor) return p.em_estoque ? "Em estoque" : "Sem estoque";
  const disp = p.sabores.filter(s => s.disponivel).length;
  return `${disp} de ${p.sabores.length} sabores disponíveis`;
}

function renderizarLista() {
  const termo = normalizar($("busca-admin").value);
  const visiveis = produtos.filter(p => !termo || normalizar(`${p.nome} ${p.marca}`).includes(termo));
  $("contador").textContent = `(${produtos.length})`;

  const lista = $("lista-produtos");
  lista.replaceChildren(...visiveis.map((p, i) => {
    const li = document.createElement("li");
    li.className = "item-produto" + (p.ativo ? "" : " item-produto--escondido");
    li.dataset.id = p.id;
    li.innerHTML = `
      <img alt="" loading="lazy">
      <div class="item-produto__info">
        <p class="item-produto__nome"></p>
        <p class="item-produto__meta"></p>
        <p class="item-produto__estoque"></p>
      </div>
      <div class="item-produto__acoes">
        <label class="rotulo-switch" title="Mostrar no site">
          <input type="checkbox" class="switch" data-acao="ativo">
          <span>No site</span>
        </label>
        <div class="flex gap-1">
          <button type="button" class="btn-icone" data-acao="subir" aria-label="Mover para cima">↑</button>
          <button type="button" class="btn-icone" data-acao="descer" aria-label="Mover para baixo">↓</button>
          <button type="button" class="botao-secundario" data-acao="editar">Editar</button>
          <button type="button" class="btn-icone btn-icone--perigo" data-acao="remover" aria-label="Remover">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
          </button>
        </div>
      </div>`;
    li.querySelector("img").src = urlImagem(p.imagem);
    li.querySelector(".item-produto__nome").textContent = p.nome;
    li.querySelector(".item-produto__meta").textContent =
      [p.marca, p.puffs && formatarPuffs(p.puffs), p.ativo ? null : "escondido do site"].filter(Boolean).join(" · ");
    li.querySelector(".item-produto__estoque").textContent = resumoEstoque(p);
    li.querySelector('[data-acao="ativo"]').checked = p.ativo;
    li.querySelector('[data-acao="ativo"]').setAttribute("aria-label", `Mostrar ${p.nome} no site`);
    // setas só fazem sentido sem busca e fora das pontas
    li.querySelector('[data-acao="subir"]').disabled = !!termo || i === 0;
    li.querySelector('[data-acao="descer"]').disabled = !!termo || i === visiveis.length - 1;
    li.querySelector('[data-acao="remover"]').setAttribute("aria-label", `Remover ${p.nome}`);
    li.querySelector('[data-acao="editar"]').setAttribute("aria-label", `Editar ${p.nome}`);
    return li;
  }));
}

async function alternarAtivo(produto, ativo) {
  const { error } = await db.from("produtos").update({ ativo }).eq("id", produto.id);
  if (error) {
    avisar(traduzirErro(error), "erro");
    return renderizarLista();
  }
  produto.ativo = ativo;
  renderizarLista();
  avisar(ativo ? `${produto.nome} voltou para o site.` : `${produto.nome} foi escondido do site.`);
}

/** Troca a posição com o vizinho (↑/↓). */
async function mover(produto, direcao) {
  const i = produtos.indexOf(produto);
  const vizinho = produtos[i + direcao];
  if (!vizinho) return;

  // garante ordens diferentes antes de trocar
  const [a, b] = [produto.ordem, vizinho.ordem];
  const novaA = b === a ? a + direcao : b;
  const novaB = a;
  const r1 = await db.from("produtos").update({ ordem: novaA }).eq("id", produto.id);
  const r2 = await db.from("produtos").update({ ordem: novaB }).eq("id", vizinho.id);
  if (r1.error || r2.error) return avisar(traduzirErro(r1.error || r2.error), "erro");

  produto.ordem = novaA; vizinho.ordem = novaB;
  produtos.sort((x, y) => x.ordem - y.ordem || x.nome.localeCompare(y.nome));
  renderizarLista();
}

function pedirRemocao(produto) {
  paraRemover = produto;
  $("remover-nome").textContent = produto.nome;
  $("dialogo-remover").showModal();
}

async function remover() {
  const produto = paraRemover;
  $("dialogo-remover").close();
  if (!produto) return;

  const { error } = await db.from("produtos").delete().eq("id", produto.id);
  if (error) return avisar(traduzirErro(error), "erro");
  await apagarFotoDoStorage(produto.imagem);

  produtos = produtos.filter(p => p !== produto);
  renderizarLista();
  avisar(`${produto.nome} foi removido.`);
}

// ─── Formulário ─────────────────────────────────────────────

function abrirFormulario(produto = null) {
  emEdicao = produto;
  fotoNova = null;
  saboresForm = produto ? produto.sabores.map(s => ({ nome: s.nome, disponivel: s.disponivel })) : [];

  $("form-titulo").textContent = produto ? "Editar produto" : "Novo produto";
  $("campo-nome").value = produto?.nome ?? "";
  $("campo-marca").value = produto?.marca ?? "";
  $("campo-puffs").value = produto?.puffs ?? "";
  $("campo-serie").value = produto?.serie ?? "";
  $("campo-ativo").checked = produto?.ativo ?? true;
  $("campo-sem-sabor").checked = produto?.sem_sabor ?? false;
  $("campo-em-estoque").checked = produto?.em_estoque ?? true;
  $("campo-foto").value = "";
  $("campo-novo-sabor").value = "";
  mostrarPrevia(produto ? urlImagem(produto.imagem) : null);
  mostrarErro("form-erro", "");
  limparInvalidos();
  atualizarModoSabor();
  renderizarSabores();
  estadoInicial = estadoFormulario();
  $("dialogo-produto").showModal();
}

/** Tudo o que o dono pode ter mexido no formulário, para comparar com o estado ao abrir. */
function estadoFormulario() {
  return JSON.stringify([
    $("campo-nome").value, $("campo-marca").value, $("campo-puffs").value, $("campo-serie").value,
    $("campo-ativo").checked, $("campo-sem-sabor").checked, $("campo-em-estoque").checked,
    $("campo-novo-sabor").value, !!fotoNova, saboresForm,
  ]);
}

/** Cancelar, X ou Esc: se mexeu em algo, pergunta antes de jogar fora. */
function tentarFechar() {
  if (estadoFormulario() === estadoInicial) return $("dialogo-produto").close();
  $("dialogo-descartar").showModal();
}

function limparInvalidos() {
  document.querySelectorAll('#form-produto [aria-invalid]').forEach(el => el.removeAttribute("aria-invalid"));
  $("caixa-foto").classList.remove("foto-previa--erro");
}

/** Mostra o erro, pinta o campo de vermelho e leva o foco até ele. */
function campoInvalido(id, texto) {
  mostrarErro("form-erro", texto);
  if (id === "campo-foto") $("caixa-foto").classList.add("foto-previa--erro");
  else $(id).setAttribute("aria-invalid", "true");
  $(id).focus();
}

/** Nomes iguais sem contar maiúsculas, acentos e espaços a mais. */
function chaveNome(nome) {
  return normalizar(nome).replace(/\s+/g, " ");
}

function mostrarPrevia(src) {
  $("foto-previa").hidden = !src;
  $("foto-vazia").hidden = !!src;
  if (src) $("foto-previa").src = src;
}

function atualizarModoSabor() {
  const semSabor = $("campo-sem-sabor").checked;
  $("bloco-sabores").hidden = semSabor;
  $("linha-em-estoque").hidden = !semSabor;
}

/**
 * Reduz a foto no próprio navegador (máx. 600 px) e converte para WebP,
 * para o upload ser rápido e o site continuar leve.
 */
async function prepararFoto(arquivo) {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, 600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return new Promise((ok, falha) =>
    canvas.toBlob(b => (b ? ok(b) : falha(new Error("Não foi possível ler a foto."))), "image/webp", 0.85));
}

async function escolherFoto() {
  const arquivo = $("campo-foto").files[0];
  if (!arquivo) return;
  if (!arquivo.type.startsWith("image/")) return mostrarErro("form-erro", "Escolha um arquivo de imagem.");
  try {
    fotoNova = await prepararFoto(arquivo);
    mostrarPrevia(URL.createObjectURL(fotoNova));
    $("caixa-foto").classList.remove("foto-previa--erro");
    mostrarErro("form-erro", "");
  } catch (err) {
    mostrarErro("form-erro", "Não consegui abrir essa foto. Tente outra (JPG, PNG ou WebP).");
  }
}

// ── Sabores ──

function adicionarSabores() {
  const campo = $("campo-novo-sabor");
  const novos = campo.value.split(/[;\n]/).map(s => s.trim().replace(/\s+/g, " ")).filter(Boolean);
  let repetidos = 0;
  for (const nome of novos) {
    if (saboresForm.some(s => normalizar(s.nome) === normalizar(nome))) { repetidos++; continue; }
    saboresForm.push({ nome: nome.toUpperCase(), disponivel: true });
  }
  campo.value = "";
  campo.removeAttribute("aria-invalid");
  campo.focus();
  if (repetidos) avisar(repetidos === 1 ? "Esse sabor já está na lista." : `${repetidos} sabores já estavam na lista.`, "erro");
  renderizarSabores();
}

function renderizarSabores() {
  const disp = saboresForm.filter(s => s.disponivel).length;
  $("resumo-sabores").textContent = saboresForm.length ? `— ${disp} de ${saboresForm.length} disponíveis` : "";

  $("lista-sabores").replaceChildren(...saboresForm.map((sabor, i) => {
    const li = document.createElement("li");
    li.className = "item-sabor" + (sabor.disponivel ? "" : " item-sabor--esgotado");
    li.innerHTML = `
      <span class="item-sabor__nome"></span>
      <label class="rotulo-switch">
        <input type="checkbox" class="switch">
        <span></span>
      </label>
      <button type="button" class="btn-icone btn-icone--perigo" aria-label="">×</button>`;
    li.querySelector(".item-sabor__nome").textContent = sabor.nome;
    const chk = li.querySelector("input");
    chk.checked = sabor.disponivel;
    chk.setAttribute("aria-label", `${sabor.nome} disponível`);
    li.querySelector(".rotulo-switch span").textContent = sabor.disponivel ? "Disponível" : "Esgotado";
    chk.addEventListener("change", () => { sabor.disponivel = chk.checked; renderizarSabores(); });
    const btn = li.querySelector("button");
    btn.setAttribute("aria-label", `Tirar ${sabor.nome} da lista`);
    btn.addEventListener("click", () => { saboresForm.splice(i, 1); renderizarSabores(); });
    return li;
  }));
}

// ── Salvar ──

/** "Ignite V500 Ice" → "ignite-v500-ice" (usado no link direto do produto). */
function gerarId(nome) {
  const base = normalizar(nome).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "produto";
  let id = base, n = 2;
  while (produtos.some(p => p.id === id)) id = `${base}-${n++}`;
  return id;
}

async function enviarFoto(id, blob) {
  const caminho = `${id}-${Date.now()}.webp`;
  const { error } = await db.storage.from(BUCKET).upload(caminho, blob, {
    contentType: "image/webp",
    cacheControl: "31536000",
  });
  if (error) throw error;
  return db.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
}

/** Apaga do Storage uma foto enviada pelo painel (as do site, img/…, ficam). */
async function apagarFotoDoStorage(url) {
  const prefixo = `${CONFIG.supabaseUrl}/storage/v1/object/public/${BUCKET}/`;
  if (!url?.startsWith(prefixo)) return;
  await db.storage.from(BUCKET).remove([decodeURIComponent(url.slice(prefixo.length))]);
}

async function salvar(e) {
  e.preventDefault();
  mostrarErro("form-erro", "");

  const nome  = $("campo-nome").value.trim().replace(/\s+/g, " ");
  const marca = $("campo-marca").value.trim().replace(/\s+/g, " ");
  const puffs = $("campo-puffs").value.trim();
  const semSabor = $("campo-sem-sabor").checked;

  limparInvalidos();
  // sabor digitado mas ainda não adicionado com “+” entra na lista
  if (!semSabor && $("campo-novo-sabor").value.trim()) adicionarSabores();

  if (!nome)  return campoInvalido("campo-nome", "Preencha o nome do produto.");
  if (produtos.some(p => p.id !== emEdicao?.id && chaveNome(p.nome) === chaveNome(nome)))
    return campoInvalido("campo-nome", `Já existe um produto chamado “${nome}”. Use outro nome.`);
  if (!marca) return campoInvalido("campo-marca", "Preencha a marca.");
  if (puffs && !(Number.isInteger(+puffs) && +puffs > 0)) return campoInvalido("campo-puffs", "Puffs precisa ser um número inteiro, ex: 40000.");
  if (!fotoNova && !emEdicao?.imagem) return campoInvalido("campo-foto", "Escolha uma foto para o produto.");
  if (!semSabor && saboresForm.length === 0)
    return campoInvalido("campo-novo-sabor", "Adicione pelo menos um sabor. Se o produto não tem sabor, ligue “Produto sem sabor”.");

  const btn = $("btn-salvar");
  btn.disabled = true;
  btn.textContent = "Salvando…";

  const id = emEdicao?.id ?? gerarId(nome);
  const fotoAntiga = emEdicao?.imagem;
  let imagem = fotoAntiga;

  try {
    if (fotoNova) imagem = await enviarFoto(id, fotoNova);

    const { error } = await db.rpc("salvar_produto", {
      dados: {
        id, nome, marca, imagem,
        puffs: puffs || null,
        serie: $("campo-serie").value.trim(),
        ativo: $("campo-ativo").checked,
        sem_sabor: semSabor,
        em_estoque: $("campo-em-estoque").checked,
        sabores: semSabor ? [] : saboresForm,
      },
    });
    if (error) {
      if (fotoNova) await apagarFotoDoStorage(imagem); // não deixa foto órfã
      throw error;
    }
    if (fotoNova && fotoAntiga !== imagem) await apagarFotoDoStorage(fotoAntiga);

    $("dialogo-produto").close();
    // recarrega a página; o aviso de sucesso aparece depois de recarregar
    const aviso = emEdicao ? `${nome} atualizado!` : `${nome} cadastrado! Já está no site.`;
    try { sessionStorage.setItem(AVISO_KEY, aviso); } catch { /* recarrega sem aviso */ }
    location.reload();
  } catch (err) {
    mostrarErro("form-erro", traduzirErro(err));
  } finally {
    btn.disabled = false;
    btn.textContent = "Salvar";
  }
}

// ─── Eventos ────────────────────────────────────────────────

$("form-login").addEventListener("submit", entrar);
document.querySelectorAll(".btn-sair").forEach(b => b.addEventListener("click", sair));

$("btn-novo").addEventListener("click", () => abrirFormulario());
$("busca-admin").addEventListener("input", renderizarLista);

$("lista-produtos").addEventListener("click", e => {
  const acao = e.target.closest("[data-acao]")?.dataset.acao;
  const produto = produtos.find(p => p.id === e.target.closest("li")?.dataset.id);
  if (!acao || !produto || acao === "ativo") return;
  if (acao === "editar") abrirFormulario(produto);
  if (acao === "remover") pedirRemocao(produto);
  if (acao === "subir") mover(produto, -1);
  if (acao === "descer") mover(produto, +1);
});
$("lista-produtos").addEventListener("change", e => {
  if (e.target.dataset.acao !== "ativo") return;
  const produto = produtos.find(p => p.id === e.target.closest("li").dataset.id);
  alternarAtivo(produto, e.target.checked);
});

$("form-produto").addEventListener("submit", salvar);
document.querySelectorAll("#dialogo-produto .btn-fechar").forEach(b =>
  b.addEventListener("click", tentarFechar));
$("dialogo-produto").addEventListener("cancel", e => { e.preventDefault(); tentarFechar(); }); // Esc
$("btn-continuar-editando").addEventListener("click", () => $("dialogo-descartar").close());
$("btn-descartar").addEventListener("click", () => {
  $("dialogo-descartar").close();
  $("dialogo-produto").close();
});
$("form-produto").addEventListener("input", e => e.target.removeAttribute("aria-invalid"));
$("campo-foto").addEventListener("change", escolherFoto);
$("campo-sem-sabor").addEventListener("change", atualizarModoSabor);
$("btn-add-sabor").addEventListener("click", adicionarSabores);
$("campo-novo-sabor").addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); adicionarSabores(); }
});
$("campo-novo-sabor").addEventListener("paste", () => setTimeout(() => {
  if (/[;\n]/.test($("campo-novo-sabor").value)) adicionarSabores();
}));

$("btn-cancelar-remover").addEventListener("click", () => $("dialogo-remover").close());
$("btn-confirmar-remover").addEventListener("click", remover);

// Login e logout
db.auth.onAuthStateChange((evento, sessao) => {
  if (evento === "SIGNED_OUT" || !sessao) return mostrarTela("tela-login");
  if (evento === "INITIAL_SESSION" || evento === "SIGNED_IN") {
    // fora do callback: o supabase-js pede para não chamar a API aqui dentro
    setTimeout(abrirPainel);
  }
});
