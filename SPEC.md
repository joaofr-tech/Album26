# SPEC - Album de Figurinhas por Voz

## SPEC v1

### Objetivo

PWA individual, mobile-first e funcional para registrar figurinhas possuidas da FIFA World Cup 26 por ditado ou texto. Cada figurinha tem apenas dois estados: possuida ou faltante.

### Escopo

- Catalogo estatico de um album;
- Registro por texto ou ditado do teclado;
- Registro em lote e continuidade de secao;
- Cards com o progresso das selecoes;
- Grade de numeros por selecao;
- Correcao manual por toque no numero;
- Persistencia local;
- Offline apos o primeiro acesso;
- Instalacao PWA;
- Deploy estatico em Cloudflare Workers Assets.

### Fora de escopo da v1

- Repetidas, quantidades, botoes + / - e desfazer;
- Backup, importacao, exportacao ou exclusao geral;
- Pesquisa, filtros e lista longa de figurinhas;
- Backend, login, sincronizacao, notificacoes e App Store.

### Fluxo principal

1. Abrir o app.
2. Tocar no campo e usar o microfone do teclado.
3. Ditar: `Brasil 12, 15 e 18`.
4. Tocar em Registrar.
5. Consultar uma selecao pelo card e ver a grade de numeros.

### Estado da v1

- Site funcional em producao.
- URL raiz `/` deve abrir o app diretamente, sem exigir `/index.html`.
- Build copia `index.html`, `manifest.webmanifest`, `sw.js`, `assets` e `src` para `dist`.
- Deploy usa `wrangler.jsonc` com `assets.directory` apontando para `./dist`.
- A configuracao nao deve usar `html_handling: "none"`, pois isso quebra a resolucao da raiz para `index.html`.

### Requisitos da v1

#### Registro

- Aceitar `<secao> <numero>`, lotes separados por virgula, ponto, ponto e virgula, quebra de linha ou `e`.
- Aceitar continuidade apenas quando o proximo item for somente um numero.
- Normalizar maiusculas, acentos, pontuacao, numeros por extenso e palavras auxiliares.
- Informar secao desconhecida, numero ausente e figurinha inexistente sem alterar a colecao.
- Em lote misto, registrar os itens validos e informar cada erro.
- Ao repetir uma figurinha, informar que ela ja esta registrada e nao alterar o progresso.
- Registrar multiplos numeros da mesma selecao sem pontuacao, por exemplo `Egito 10 15`.
- Registrar troca de secao no mesmo lote, por exemplo `Egito 10 Argentina 5`.
- Registrar secao repetida no mesmo lote, por exemplo `Egito 10 Egito 15`.

#### Visualizacao

- Exibir cards de selecoes com `possuidas / total` e porcentagem.
- Exibir Coca-Cola, Especiais e Introducao em `Outras figurinhas`.
- Ao tocar em um card, mostrar apenas os numeros daquela secao.
- Verde com check indica possuida; cinza indica faltante.
- Tocar em um numero alterna seu estado para permitir correcao rapida.

#### Dados e PWA

- Salvar automaticamente no dispositivo.
- Migrar dados antigos: qualquer quantidade acima de zero vira possuida.
- Incluir manifesto, icones, modo standalone e service worker.
- Depois do primeiro acesso, abrir, consultar e registrar offline.
- Atualizar o `CACHE_NAME` do service worker quando arquivos cacheados mudarem.
- A PWA instalada nao deve depender de cache antigo para abrir a rota raiz.

#### Deploy

- Publicar o conteudo de `dist`.
- A rota `/` deve servir o app.
- A rota `/index.html` tambem deve abrir o app.
- Nao configurar `html_handling` como `none` para este projeto.
- Depois do deploy, validar a producao sem cache do navegador.

### Criterios de aceite da v1

- `Brasil 12` marca somente Brasil 12 como possuida.
- `Brasil 12, 15 e 18` marca os tres numeros.
- `Egito 10 15` marca Egito 10 e Egito 15.
- `Egito 10 Egito 15` marca Egito 10 e Egito 15.
- `Egito 10 Argentina 5` marca Egito 10 e Argentina 5.
- `Egito 1 Argelia 20` marca Egito 1 e Argelia 20.
- `Brasil 12, Brasul 13` nao registra Brasil 13.
- Repetir um comando nao cria repetida nem altera o progresso.
- A grade distingue visualmente possuidas e faltantes.
- Tocar em um numero corrige seu estado.
- Os dados persistem ao fechar e reabrir o app.
- A PWA instalada abre e registra em modo aviao apos o primeiro acesso.
- A URL de producao abre tanto em `/` quanto em `/index.html`.

## SPEC v2

### Objetivo

A v2 sera focada em UI e UX, sem alterar o modelo principal de colecao da v1. O objetivo funcional novo e adicionar uma forma simples de exportar as figurinhas faltantes.

### Objetivos de UX

- Adicionar um botao `Exportar faltantes`.
- Ao clicar no botao, o app deve calcular automaticamente todas as figurinhas ainda faltantes a partir da colecao local.
- A exportacao deve abrir diretamente o WhatsApp com uma mensagem pronta contendo as faltantes.
- O usuario ainda escolhe o contato/grupo e confirma o envio no WhatsApp.
- A exportacao nao deve alterar a colecao.

### Solucao de exportacao escolhida

- Usar um link do WhatsApp com texto pre-preenchido: `https://wa.me/?text=...`.
- Gerar a mensagem no navegador e aplicar `encodeURIComponent` no texto.
- Abrir o link em nova aba/janela ou navegar para ele no clique do botao.
- Nao usar backend, API oficial do WhatsApp, login, contatos ou envio automatico.
- Se o WhatsApp nao estiver instalado, o comportamento esperado e abrir o WhatsApp Web ou a pagina padrao do WhatsApp.

### Objetivos de UI

- Revisar a interface com apoio de uma skill frontend antes da implementacao visual.
- Melhorar clareza, hierarquia visual e ergonomia mobile.
- Integrar o botao de exportacao sem poluir o fluxo principal de registro.
- Nao adicionar outras funcionalidades de UI alem do necessario para exportar faltantes.

### Criterios de aceite da v2

- O app exibe um botao claro para exportar faltantes.
- Ao clicar, o WhatsApp abre com uma mensagem pronta.
- A mensagem contem somente figurinhas faltantes.
- A lista exportada e legivel para uma pessoa identificar selecao e numeros.
- Se nao houver figurinhas faltantes, o app informa que o album esta completo ou gera uma mensagem equivalente.
- O registro de figurinhas da v1 continua funcionando.
- A PWA continua funcionando instalada e offline apos primeiro acesso, exceto pela abertura do WhatsApp, que depende do ambiente externo.
