# Analio's Burguer — Painel de Gestão

Sistema completo de gestão para a hamburgueria **Analio's Burguer**, com catálogo,
preços, promoções, fidelidade, clientes, motoboys, pedidos (PDV) e envio de
mensagens via WhatsApp. Toda a identidade visual da marca (cores, logotipo e
tipografia) foi aplicada ao painel administrativo e ao cardápio público.

Por enquanto, **todos os dados ficam salvos localmente no seu navegador**
(localStorage), sem necessidade de servidor. Quando você quiser publicar no
domínio próprio (`analiosburguer.com`) e/ou migrar para um backend real, essa
base em React facilita a transição.

## Como rodar o projeto

```powershell
npm install
npm run dev
```

Acesse `http://localhost:5173` no navegador. O painel administrativo abre na
tela inicial; o cardápio público para os clientes fica em `/cardapio`.

Para gerar a versão de produção (arquivos estáticos prontos para hospedar em
qualquer serviço, inclusive no seu domínio futuramente):

```powershell
npm run build
```

Os arquivos finais ficam na pasta `dist/`.

## Funcionalidades

- **Dashboard** — pedidos e faturamento do dia, gráfico dos últimos 7 dias, clientes e pontos ativos.
- **Pedidos (PDV)** — monta pedidos com produtos, promoções, cliente, forma de pagamento, calcula total/pontos de fidelidade automaticamente, controla status (pendente → preparando → em entrega → entregue) e atribui motoboy.
- **Catálogo** — cadastro de categorias e produtos, upload de foto, ativar/inativar, e **ajuste de preço** a qualquer momento.
- **Promoções** — descontos percentuais, fixos ou combos, com vigência de datas e aplicação a produtos específicos ou ao cardápio inteiro.
- **Fidelidade** — regras configuráveis de pontos por real gasto e resgate, ranking de clientes, ajuste manual de pontos e histórico de transações.
- **Clientes** — cadastro completo (contato, endereço, aniversário, observações), histórico de gasto e pedidos, botão de contato direto no WhatsApp.
- **Motoboys** — cadastro de entregadores, status (disponível/em entrega/offline) e contagem de entregas.
- **WhatsApp** — modelos de mensagem reutilizáveis (com variáveis `{{nome}}`, `{{pontos}}`, `{{loja}}`), envio individual ou em massa via `wa.me` (abre o WhatsApp Web/App com a mensagem pronta) e histórico de envios.
- **Configurações** — dados da loja, taxa de entrega, regras de fidelidade e **backup/restauração** de todos os dados em um arquivo `.json`.
- **Cardápio público (`/cardapio`)** — página voltada ao cliente final, com a identidade visual da marca, preços com promoções aplicadas automaticamente e finalização de pedido via WhatsApp.

## Sobre o envio de mensagens no WhatsApp

Como o projeto roda 100% no navegador (sem servidor), o envio usa links
`wa.me`: ao confirmar o envio, uma aba do WhatsApp Web/App abre já com o
número e a mensagem preenchidos, e você só confirma o envio manualmente. Isso
evita a necessidade de credenciais de API (Meta Cloud API/Twilio), que exigem
um backend seguro — algo a considerar quando o projeto migrar para o domínio
próprio com servidor.

## Identidade visual

As cores, logotipo (`src/assets/logos`) e fontes (Montserrat/Francois One)
usados no projeto seguem o manual de identidade visual oficial da marca.

## Backup dos dados

Na tela **Configurações**, use "Exportar backup" para baixar um arquivo
`.json` com todos os dados (catálogo, clientes, pedidos, motoboys, promoções
e configurações) e "Importar backup" para restaurar. Recomendado fazer isso
periodicamente, já que os dados ficam apenas no navegador atual.

## Próximos passos (quando for ao domínio próprio)

- Hospedar o build (`dist/`) em um serviço como Vercel, Netlify ou o próprio
  domínio `analiosburguer.com`.
- Migrar o armazenamento local para um backend com banco de dados real
  (ex: Supabase, Firebase ou API própria em Node.js).
- Integrar uma API oficial do WhatsApp (Meta Cloud API/Twilio) para envio
  automático de mensagens, o que requer um servidor com as chaves seguras.
