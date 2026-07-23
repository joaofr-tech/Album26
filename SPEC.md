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

A v2 adiciona uma forma simples de exportar as figurinhas faltantes, sem alterar o modelo principal de colecao da v1.

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

### Criterios de aceite da v2

- O app exibe um botao claro para exportar faltantes.
- Ao clicar, o WhatsApp abre com uma mensagem pronta.
- A mensagem contem somente figurinhas faltantes.
- A lista exportada e legivel para uma pessoa identificar selecao e numeros.
- Se nao houver figurinhas faltantes, o app informa que o album esta completo ou gera uma mensagem equivalente.
- O registro de figurinhas da v1 continua funcionando.
- A PWA continua funcionando instalada e offline apos primeiro acesso, exceto pela abertura do WhatsApp, que depende do ambiente externo.

## SPEC v3

### Objetivo

A v3 adiciona uma forma simples de conferir uma lista recebida de figurinhas contra a colecao local. O usuario cola a lista e o app retorna apenas quais figurinhas daquela lista ainda estao faltando.

### Casos de uso

- Conferir uma linha usando o nome da selecao, por exemplo `Brasil 12, 14 15`.
- Conferir uma linha usando abreviacao, por exemplo `BRA [bandeira] 12, 14, 15`.
- Conferir secoes especiais por nome ou abreviacao, por exemplo `Coca-Cola 1 2`, `CC 1, 2` e `FWC 1, 2`.
- Conferir uma lista com multiplas linhas e receber faltantes agrupadas por secao.
- Conferir uma lista mista com erros e ainda receber os itens validos.

### Objetivos de UX

- Adicionar um botao secundario `Conferir lista`.
- Manter o layout atual, sem remover ou reorganizar os fluxos existentes de registro, exportacao e visualizacao.
- Ao tocar no botao, permitir colar uma lista recebida de figurinhas.
- Exibir um resultado claro com as figurinhas da lista que o usuario ainda precisa.
- Informar quando nenhuma figurinha da lista for necessaria.
- Informar entradas desconhecidas ou invalidas sem impedir o processamento das linhas validas.
- A conferencia nao deve alterar a colecao, o progresso ou os dados salvos.

### Formato da lista

- O padrao esperado por linha e: `<nome ou abreviacao da secao> <bandeira opcional> <numeros>`.
- Exemplos validos: `Brasil 12, 14 15`, `BRA [bandeira] 12, 14, 15`, `Coca-Cola 1 2`, `CC 1, 2` e `FWC 1, 2`.
- A bandeira deve ser ignorada pelo parser.
- Os numeros podem ser separados por virgula ou espaco.
- A lista pode conter multiplas secoes em linhas separadas.

### Dados e parsing

- Adicionar suporte a abreviacoes de secoes, como `BRA` para Brasil, `MOR` para Marrocos, `CC` para Coca-Cola e `FWC` para a nova secao FWC.
- A fonte das abreviacoes deve ficar no catalogo estatico do album.
- Marrocos deve usar a abreviacao `MOR`, pois esse e o padrao usado por outros sites para exportar e compartilhar figurinhas entre amigos.
- O parser da conferencia deve identificar a secao pelo nome ou abreviacao, validar os numeros e comparar cada figurinha com a colecao local.
- Figurinhas ja possuidas nao devem aparecer no resultado de faltantes da lista.
- Figurinhas inexistentes no album devem gerar aviso especifico.
- Secoes desconhecidas devem gerar aviso especifico.

### Criterios de aceite da v3

- `Brasil 12, 14 15` retorna apenas os numeros do Brasil que ainda faltam.
- `BRA [bandeira] 12, 14, 15` retorna apenas os numeros do Brasil que ainda faltam.
- `Coca-Cola 1 2` e `CC 1, 2` conferem a mesma secao.
- `FWC 1, 2` confere a nova secao FWC.
- `MOR 8` confere Marrocos 8, e `MAR 8` nao deve ser tratado como Marrocos.
- Figurinhas ja possuidas na lista nao aparecem no resultado.
- Lista com secao desconhecida mostra aviso.
- Lista com numero inexistente mostra aviso.
- Lista mista exibe resultados validos e erros separadamente.
- Se nenhuma figurinha da lista estiver faltando, o app informa que o usuario nao precisa de nenhuma figurinha daquela lista.
- Conferir lista nao altera o progresso nem a colecao salva.
- Registro por voz/texto, exportacao de faltantes e visualizacao continuam funcionando.
