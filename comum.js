// ============================================================
//  REI DO POD CAF — comum.js  (home, catálogo e painel admin)
// ============================================================

const CONFIG = {
  whatsapp: "5545998078084",
  // Projeto Supabase onde ficam produtos, sabores e fotos.
  // A chave publicável é feita para ficar no site: ela só permite o que
  // as regras do banco (RLS) deixam — ler o catálogo. Gravar exige
  // login de um e-mail cadastrado na tabela `admins`.
  supabaseUrl: "https://aygczfagchyyyngqbfwe.supabase.co",
  supabaseKey: "sb_publishable_W-D-gZRPaXe7Mq0jnr3lkQ_9Wisjujq",
};

// ─── Utilitários ────────────────────────────────────────────

/**
 * Minúsculas, sem acento e sem espaços nas pontas — para comparar textos
 * digitados de jeitos diferentes ("Maçã " == "maca").
 */
function normalizar(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

/** Foto enviada pelo painel (URL completa) ou das que vieram com o site (img/…). */
function urlImagem(caminho) {
  return /^https?:\/\//.test(caminho) ? caminho : caminho.replace(/^\/+/, "");
}

/** 40000 → "40.000 Puffs" */
function formatarPuffs(puffs) {
  return `${Number(puffs).toLocaleString("pt-BR")} Puffs`;
}

// O painel admin não tem botão de WhatsApp.
const EH_PAINEL = () => document.body.dataset.pagina === "admin";

// ─── Botão flutuante do WhatsApp ────────────────────────────
// Para quem quer tirar dúvida sem escolher um sabor específico.

function criarBotaoWhatsApp() {
  if (EH_PAINEL()) return;
  const msg  = "Olá! Vim pelo site e queria tirar uma dúvida.";
  const link = document.createElement("a");
  link.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "whatsapp-flutuante";
  link.setAttribute("aria-label", "Falar com a loja no WhatsApp");
  link.innerHTML = `
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-2.1 0-4.2-.6-6-1.7l-.4-.3-3.8 1.2 1.2-3.7-.3-.4a10.4 10.4 0 0 1-1.7-5.7C5 10 9.9 5.3 16 5.3S27 10 27 15.8s-4.9 10.6-11 10.6zm6-7.9c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.8.2l-1 1.3c-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.7-1.7-1-.9-1.7-2-1.9-2.3-.2-.3 0-.5.1-.7l.5-.6.4-.6c.1-.2 0-.4 0-.6l-1-2.5c-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.8 5 .8.4 1.4.6 1.9.7.8.3 1.6.2 2.2.1.7-.1 2-.8 2.3-1.6.3-.8.3-1.5.2-1.6-.1-.2-.3-.3-.6-.4z"/>
    </svg>`;
  document.body.appendChild(link);
}

document.addEventListener("DOMContentLoaded", () => {
  criarBotaoWhatsApp();
});
