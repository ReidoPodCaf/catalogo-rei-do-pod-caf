// URL da sua planilha publicada como TSV
const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQestH5Bew_6ivl5vs3AxAFmHi23SPcBiPt9nEEi3SKZCK67wsfUrM7qNtQUvCuk7MVbQD_5bXfFYtf/pub?output=tsv'; // <<< SEU LINK TSV

// Função para gerar o link do WhatsApp
function criarLinkWhatsApp(produto, sabor) {
  const mensagem = `Olá, gostaria do ${produto} sabor ${sabor}`;
  return `https://wa.me/5545998078084?text=${encodeURIComponent(mensagem)}`;
}

window.addEventListener('DOMContentLoaded', () => {
  fetch(googleSheetURL)
    .then(response => response.text())
    .then(textData => {
      document.querySelectorAll('.loading-msg').forEach(msg => msg.remove());

      const linhas = textData.trim().split('\n').slice(1);
      
      // Objeto para guardar quais produtos inteiros estão em promoção
      const produtosEmPromocao = {};

      // --- PARTE 1: Identificar quais produtos inteiros estão em PROMOÇÃO ---
      // Percorre a planilha buscando as linhas de controle para promoções
      linhas.forEach(linha => {
        const [idProduto, nomeSabor, status] = linha.split('\t');
        if (idProduto && nomeSabor && nomeSabor.trim() === '_CONTROLE_') {
          const statusLimpo = status ? status.trim().toLowerCase() : '';
          if (statusLimpo === 'promoção' || statusLimpo === 'promocao') {
            produtosEmPromocao[idProduto.trim()] = true; // Marca o ID do produto como em promoção
          }
        }
      });

      // --- PARTE 2: Criar os botões de sabores ---
      linhas.forEach(linha => {
        const [idProduto, nomeSabor, status] = linha.split('\t');

        // Ignora as linhas de controle e linhas sem ID ou nome
        if (!idProduto || !nomeSabor || nomeSabor.trim() === '_CONTROLE_') return;
        
        const idLimpo = idProduto.trim();
        const nomeSaborLimpo = nomeSabor.trim();
        const listaSabores = document.getElementById(`sabores-${idLimpo}`);
        
        if (listaSabores) {
          const produtoNome = listaSabores.parentElement.querySelector('h2').textContent;
          const li = document.createElement('li');
          const statusLimpo = status ? status.trim().toLowerCase() : '';

          if (statusLimpo === 'disponível' || statusLimpo === 'disponivel') {
            const link = document.createElement('a');
            link.href = criarLinkWhatsApp(produtoNome, nomeSaborLimpo);
            link.target = '_blank';
            link.textContent = nomeSaborLimpo;
            li.appendChild(link);
          } else { // 'Esgotado' ou qualquer outro status
            const botao = document.createElement('button');
            botao.className = 'indisponivel';
            botao.disabled = true;
            botao.innerHTML = `${nomeSaborLimpo} <span style="font-size: 0.8em; opacity: 0.8;">(Esgotado)</span>`;
            li.appendChild(botao);
          }
          listaSabores.appendChild(li);
        }
      });

      // --- PARTE 3: Aplicar os destaques (imagem e subtítulo) ---
      for (const idProduto in produtosEmPromocao) {
        if (produtosEmPromocao[idProduto]) { // Se o produto está marcado como em promoção
          const secaoProduto = document.getElementById(idProduto); // A <section> inteira do produto

          if (secaoProduto) {
            const imagem = secaoProduto.querySelector('.produto-imagem'); // A imagem
            const titulo = secaoProduto.querySelector('h2'); // O título H2

            // Aplica o brilho na imagem
            if (imagem) {
              imagem.classList.add('imagem-promocao');
            }
            // Adiciona o subtítulo "EM PROMOÇÃO"
            if (titulo) {
              const subtitulo = document.createElement('span');
              subtitulo.className = 'subtitulo-promocao';
              subtitulo.textContent = '🔥 EM PROMOÇÃO 🔥';
              titulo.insertAdjacentElement('afterend', subtitulo); // Insere após o H2
            }
          }
        }
      }
    })
    .catch(error => {
      console.error('Falha na operação:', error);
      document.querySelectorAll('.loading-msg').forEach(msg => {
        msg.textContent = 'Erro ao carregar sabores. Tente novamente mais tarde.';
        msg.style.color = '#ff4d4d';
      });
    });
});