# SPEC - Album de Figurinhas por Voz

## Objetivo

PWA individual e mobile-first para registrar figurinhas possuidas da FIFA World Cup 26 por ditado ou texto. Cada figurinha tem apenas dois estados: possuida ou faltante.

## Escopo

- Catalogo estatico de um album;
- Registro por texto ou ditado do teclado;
- Registro em lote e continuidade de secao;
- Cards com o progresso das selecoes;
- Grade de numeros por selecao;
- Correcao manual por toque no numero;
- Persistencia local, offline apos o primeiro acesso e instalacao PWA.

## Fora de escopo

- Repetidas, quantidades, botoes + / - e desfazer;
- Backup, importacao, exportacao ou exclusao geral;
- Pesquisa, filtros e lista longa de figurinhas;
- Backend, login, sincronizacao, notificacoes e App Store.

## Fluxo principal

1. Abrir o app.
2. Tocar no campo e usar o microfone do teclado.
3. Ditar: `Brasil 12, 15 e 18`.
4. Tocar em Registrar.
5. Consultar uma selecao pelo card e ver a grade de numeros.

## Requisitos

### Registro

- Aceitar `<secao> <numero>`, lotes separados por virgula, ponto, ponto e virgula, quebra de linha ou `e`.
- Aceitar continuidade apenas quando o proximo item for somente um numero.
- Normalizar maiusculas, acentos, pontuacao, numeros por extenso e palavras auxiliares.
- Informar secao desconhecida, numero ausente e figurinha inexistente sem alterar a colecao.
- Em lote misto, registrar os itens validos e informar cada erro.
- Ao repetir uma figurinha, informar que ela ja esta registrada e nao alterar o progresso.

### Visualizacao

- Exibir cards de selecoes com `possuidas / total` e porcentagem.
- Exibir Coca-Cola, Especiais e Introducao em `Outras figurinhas`.
- Ao tocar em um card, mostrar apenas os numeros daquela secao.
- Verde com check indica possuida; cinza indica faltante.
- Tocar em um numero alterna seu estado para permitir correcao rapida.

### Dados e PWA

- Salvar automaticamente no dispositivo.
- Migrar dados antigos: qualquer quantidade acima de zero vira possuida.
- Incluir manifesto, icones, modo standalone e service worker.
- Depois do primeiro acesso, abrir, consultar e registrar offline.

## Criterios de aceite

- `Brasil 12` marca somente Brasil 12 como possuida.
- `Brasil 12, 15 e 18` marca os tres numeros.
- `Brasil 12, Brasul 13` nao registra Brasil 13.
- Repetir um comando nao cria repetida nem altera o progresso.
- A grade distingue visualmente possuidas e faltantes.
- Tocar em um numero corrige seu estado.
- Os dados persistem ao fechar e reabrir o app.
- A PWA instalada abre e registra em modo aviao apos o primeiro acesso.
