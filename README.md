# 💨 REI DO POD CAF - Catálogo Online

Catálogo digital responsivo da loja Rei do Pod Caf. Mostra os produtos e os sabores em estoque e manda o pedido direto para o WhatsApp da loja.

## 🚀 Funcionalidades

- **Painel do dono (`admin.html`):** login com e-mail e senha; cadastrar produto com foto, nome, marca, puffs e sabores; marcar sabor como disponível/esgotado; esconder ou mostrar no site; mudar a ordem; remover. A foto é reduzida e convertida para WebP no próprio celular antes de enviar.
- **Dados no Supabase:** produtos, sabores e fotos ficam no projeto Supabase `rei-do-pod-caf`. O catálogo lê direto de lá; o que o dono salva aparece no site em segundos.
- **Abre na hora:** o último catálogo fica salvo no navegador. Da segunda visita em diante os produtos aparecem na hora e se atualizam em seguida. Se o banco ficar fora do ar, continua mostrando a última versão.
- **Pedido pelo WhatsApp:** cada sabor abre o WhatsApp com a mensagem pronta. Tem também um botão flutuante para dúvidas.
- **Busca e filtro:** a busca encontra por produto ou sabor sem diferenciar acento ("maca" encontra "MAÇÃ"), e há botões para filtrar por marca (criados a partir das marcas cadastradas).
- **Esgotados no fim:** os produtos sem estoque vão para o final da lista.
- **Link direto:** cada card tem um botão para compartilhar o link do produto (`sabores.html#v400`), que abre a página já no produto.
- **Prévia de link:** favicon e Open Graph (imagem e descrição ao compartilhar no WhatsApp/Instagram).

## 📁 Estrutura

- `index.html`: página inicial.
- `sabores.html` + `script.js`: catálogo (lê produtos e sabores do Supabase).
- `admin.html` + `admin.js` + `admin.css`: painel do dono.
- `comum.js`: configuração (número do WhatsApp, endereço e chave pública do Supabase), utilitários e botão flutuante.
- `style.css`: estilos do catálogo.
- `tailwind.input.css` → `tailwind.css`: cores, fontes, animações e estilos compartilhados (gerado, ver abaixo).
- `vendor/supabase.js`: biblioteca oficial do Supabase (só o painel usa).
- `fonts/`: Inter e Barlow Condensed, servidas pelo próprio site.
- `img/`: imagens em WebP (as fotos novas cadastradas pelo painel ficam no Storage do Supabase).

## 🔐 Supabase

Tabelas `produtos`, `sabores` e `admins`, e o bucket de fotos `produtos`.
As regras do banco (RLS) permitem que qualquer pessoa **leia** os produtos ativos, e que só um e-mail cadastrado em `admins` **grave**. A chave em `comum.js` é a chave publicável — feita para ficar no site.

Para dar acesso a alguém ao painel:
1. Supabase → Authentication → Users → **Add user** (e-mail e senha, com "Auto Confirm User").
2. SQL Editor: `insert into public.admins (email) values ('email@dele.com');`

Recomendado: Authentication → Sign In / Providers → desligar **Allow new users to sign up** (o painel não precisa de cadastro público). O painel não tem "Esqueci a senha": para trocar a senha de alguém, use Authentication → Users no Supabase.

## 🛠️ Desenvolvimento

O site é estático (GitHub Pages), então não tem build no deploy. O único passo gerado é o CSS do Tailwind:

```bash
npm install         # uma vez
npm run build:css   # sempre que mudar classes do Tailwind nos .html/.js
```

O `tailwind.css` gerado vai junto no commit.

Imagens novas: use WebP com no máximo 500 px (os produtos aparecem com cerca de 176 px de altura).
