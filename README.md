# 💨 REI DO POD CAF - Catálogo Online

Catálogo digital dinâmico e responsivo desenvolvido para a loja Rei do Pod Caf. O sistema exibe produtos de forma automatizada e direciona os pedidos diretamente para o WhatsApp da loja.

## 🚀 Funcionalidades

- **Sincronização em Tempo Real:** Os sabores e a disponibilidade (estoque) dos produtos são lidos dinamicamente de uma planilha do Google Sheets exportada em CSV.
- **Integração com WhatsApp:** Cada clique em um sabor gera uma mensagem automatizada pronta para o cliente enviar o pedido, facilitando a conversão.
- **Busca Inteligente:** Barra de pesquisa global que filtra instantaneamente os produtos pelo nome do modelo ou pelo sabor.
- **Design Premium:** Interface moderna com tema escuro (Dark Mode), efeitos de *Glassmorphism* (fundo de vidro translúcido) e luzes neon.
- **Mobile-First:** Layout totalmente responsivo, otimizado para a melhor experiência em celulares, tablets e desktops.

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Estruturação semântica e acessível.
- **CSS3 & Tailwind CSS:** Estilização avançada, animações CSS puras (como o *loading* e o *glow*) e sistema de grid.
- **Vanilla JavaScript (ES6+):** Lógica de programação assíncrona (`fetch`), tratamento de dados (Regex para parse de CSV) e manipulação dinâmica do DOM (sem uso de frameworks).

## 📁 Estrutura do Projeto

O projeto foi refatorado utilizando o padrão de Separação de Conceitos:
- `index.html`: Landing Page principal focada em reter a atenção do usuário.
- `sabores.html`: Interface do catálogo com os cards de produtos.
- `style.css`: Variáveis de tema e estilos customizados isolados.
- `script.js`: Toda a lógica de integração com a planilha e geração de links.
