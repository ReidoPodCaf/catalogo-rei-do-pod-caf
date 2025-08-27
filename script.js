// URL da sua planilha publicada como TSV (separada por TAB)
const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQestH5Bew_6ivl5vs3AxAFmHi23SPcBiPt9nEEi3SKZCK67wsfUrM7qNtQUvCuk7MVbQD_5bXfFYtf/pub?output=tsv';

// Função para gerar o link do WhatsApp
function criarLinkWhatsApp(produto, sabor) {
  const mensagem = `Olá, gostaria do ${produto} sabor ${sabor}`;
  return `https://wa.me/5545998078084?text=${encodeURIComponent(mensagem)}`;
}

// Quando a página carregar, busca os dados da planilha
window.addEventListener('DOMContentLoaded', () => {
  fetch(googleSheetURL)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao carregar os dados da planilha.');
      }
      return response.text();
    })
    .then(textData => {
      document.querySelectorAll('.loading-msg').forEach(msg => msg.remove());

      const linhas = textData.trim().split('\n').slice(1);
      
      linhas.forEach(linha => {
        // Agora separa por TAB (\t), muito mais seguro que vírgula
        const [idProduto, nomeSabor, status] = linha.split('\t');

        if (!idProduto || !nomeSabor) return;
        
        const idLimpo = idProduto.trim();
        const nomeSaborLimpo = nomeSabor.trim();
        const listaSabores = document.getElementById(`sabores-${idLimpo}`);
        
        if (listaSabores) {
          const produtoNome = listaSabores.parentElement.querySelector('h2').textContent;
          const li = document.createElement('li');
          
          // Lógica de status invertida e mais flexível
          const statusLimpo = status ? status.trim().toLowerCase() : '';
          const palavrasIndisponivel = ['esgotado', 'falta', 'indisponível', 'nao', 'não', '0'];

          if (statusLimpo && palavrasIndisponivel.includes(statusLimpo)) {
            // Se o status EXISTE e está na "lista negra", fica indisponível
            const botao = document.createElement('button');
            botao.className = 'indisponivel';
            botao.disabled = true;
            botao.innerHTML = `${nomeSaborLimpo} <span style="font-size: 0.8em; opacity: 0.8;">(Esgotado)</span>`;
            li.appendChild(botao);
          } else {
            // Para todos os outros casos (incluindo status vazio), fica disponível
            const link = document.createElement('a');
            link.href = criarLinkWhatsApp(produtoNome, nomeSaborLimpo);
            link.target = '_blank';
            link.textContent = nomeSaborLimpo;
            li.appendChild(link);
          }
          
          listaSabores.appendChild(li);
        } else if (idLimpo !== '') {
          // Avisa no console se um ID da planilha não for encontrado no HTML
          console.warn(`Aviso: O ID de produto '${idLimpo}' foi encontrado na planilha, mas não existe uma seção correspondente no HTML. Verifique se há erros de digitação.`);
        }
      });
    })
    .catch(error => {
      console.error('Falha na operação:', error);
      document.querySelectorAll('.loading-msg').forEach(msg => {
        msg.textContent = 'Erro ao carregar sabores. Tente novamente mais tarde.';
        msg.style.color = '#ff4d4d';
      });
    });
});