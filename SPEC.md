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

A v3 adiciona uma forma simples de conferir uma lista recebida de figurinhas contra a colecao local. O usuario cola a lista e o app retorna apenas quais figurinhas daquela lista ainda estao faltando. A mesma gramatica estruturada tambem deve ser aceita pelo fluxo de registro.

### Casos de uso

- Conferir uma linha usando o nome da selecao, por exemplo `Brasil 12, 14 15`.
- Conferir uma linha usando abreviacao, por exemplo `BRA [bandeira] 12, 14, 15`.
- Conferir tokens colados, por exemplo `MEX4 MEX13 MEX18`.
- Conferir linhas de faltantes com dois-pontos, por exemplo `MEX : 1, 4`.
- Registrar os mesmos formatos aceitos por `Conferir lista`, sem perder suporte ao registro por voz/texto da v1.
- Conferir secoes especiais por nome ou abreviacao, por exemplo `Coca-Cola 1 2`, `CC 1, 2` e `FWC : 8`.
- Conferir uma lista com multiplas linhas e receber faltantes agrupadas por secao.
- Conferir uma lista mista com erros e ainda receber os itens validos.

### Objetivos de UX

- Manter o botao secundario `Conferir lista`.
- Manter o layout atual, sem remover ou reorganizar os fluxos existentes de registro, exportacao e visualizacao.
- Ao tocar no botao, permitir colar uma lista recebida de figurinhas.
- Exibir um resultado claro com as figurinhas da lista que o usuario ainda precisa.
- Informar quando nenhuma figurinha da lista for necessaria.
- Informar entradas desconhecidas ou invalidas sem impedir o processamento das linhas validas.
- A conferencia nao deve alterar a colecao, o progresso ou os dados salvos.

### Formato da lista

- O padrao esperado por linha e: `<nome ou abreviacao da secao> <bandeira opcional> <numeros>`.
- Tambem sao validos tokens colados no formato `<abreviacao><numero>`, como `BRA10`, `MEX4`, `MAR19` e `CC5`.
- Tambem sao validas linhas com dois-pontos depois da secao, como `MEX : 1, 4`.
- Cabecalhos com progresso, como `Mexico (MEX) 17/20`, devem ser ignorados como cabecalho e nao podem registrar `17` ou `20`.
- Titulo solto, como `Faltantes`, deve ser ignorado sem gerar erro.
- A bandeira deve ser ignorada pelo parser.
- Os numeros podem ser separados por virgula ou espaco.
- A lista pode conter multiplas secoes em linhas separadas.
- Dois-pontos entre numeros, como `Brasil 10:12`, nao devem ser tratados como separador numerico.

### Dados e parsing

- FWC substitui Introducao e Especiais.
- A secao FWC deve aceitar os numeros de `0` a `19`.
- Remover os cards/secoes antigos de Introducao e Especiais do catalogo visivel.
- Nao migrar dados locais antigos de `intro-*` e `especiais-*`.
- Manter Coca-Cola como secao propria, com abreviacao `CC`.
- Adicionar suporte a abreviacoes de secoes, como `BRA` para Brasil, `MOR` e `MAR` para Marrocos, `CC` para Coca-Cola e `FWC` para FWC.
- A fonte das abreviacoes deve ficar no catalogo estatico do album.
- Marrocos deve aceitar `MOR` por ser o padrao usado por outros sites para exportar e compartilhar figurinhas entre amigos, e tambem `MAR` para compatibilidade com listas compartilhadas.
- O parser da conferencia deve identificar a secao pelo nome ou abreviacao, validar os numeros e comparar cada figurinha com a colecao local.
- O registro deve usar a mesma gramatica estruturada quando a entrada parecer uma lista compartilhada.
- Figurinhas ja possuidas nao devem aparecer no resultado de faltantes da lista.
- Figurinhas inexistentes no album devem gerar aviso especifico.
- Secoes desconhecidas devem gerar aviso especifico.

### Exemplos oficiais de entrada

#### Caso 1 - Lista compartilhada com tokens colados

```text
México (MEX)   17/20
MEX4  MEX13  MEX18

 África do Sul (RSA)   19/20
RSA9

 Coreia do Sul (KOR)   17/20
KOR11  KOR15  KOR16

República Tcheca (CZE)   16/20
CZE2  CZE3  CZE12  CZE19

 Canadá (CAN)   19/20
CAN13

Bósnia e Herzegovina (BIH)   19/20
BIH9

 Catar (QAT)   18/20
QAT10  QAT19

 Suíça (SUI)   19/20
SUI20

 Brasil (BRA)   16/20
BRA1  BRA10  BRA14  BRA19

 Marrocos (MAR)   19/20
MAR19

 Haiti (HAI)   15/20
HAI3  HAI5  HAI7  HAI8  HAI13

 EUA (USA)   19/20
USA3

 Austrália (AUS)   17/20
AUS7  AUS8  AUS14

 Alemanha (GER)   17/20
GER1  GER6  GER19

 Curaçao (CUW)   18/20
CUW13  CUW20

 Costa do Marfim (CIV)   19/20
CIV5

 Equador (ECU)   18/20
ECU7  ECU17

 Holanda (NED)   17/20
NED1  NED2  NED3

Suécia (SWE)   19/20
SWE1

 Bélgica (BEL)   18/20
BEL3  BEL20

 Egito (EGY)   17/20
EGY5  EGY8  EGY12

 Irã (IRN)   15/20
IRN4  IRN8  IRN10  IRN16  IRN18

 Nova Zelândia (NZL)   19/20
NZL17

 Espanha (ESP)   17/20
ESP2  ESP6  ESP14

 Arábia Saudita (KSA)   11/20
KSA1  KSA4  KSA5  KSA8  KSA11  KSA15  KSA16  KSA19  KSA20

 Uruguai (URU)   18/20
URU2  URU6

 França (FRA)   19/20
FRA15

 Iraque (IRQ)   14/20
IRQ4  IRQ6  IRQ9  IRQ12  IRQ14  IRQ16

 Noruega (NOR)   17/20
NOR7  NOR8  NOR12

 Argentina (ARG)   17/20
ARG5  ARG18  ARG19

 Argélia (ALG)   18/20
ALG7  ALG14

 Portugal (POR)   14/20
POR1  POR8  POR9  POR12  POR14  POR17

 RD Congo (COD)   13/20
COD1  COD4  COD6  COD7  COD12  COD13  COD17

 Uzbequistão (UZB)   18/20
UZB1  UZB5

 Colômbia (COL)   17/20
COL3  COL16  COL20

 Inglaterra (ENG)   19/20
ENG19

 Gana (GHA)   19/20
GHA9

 Panamá (PAN)   14/20
PAN4  PAN6  PAN8  PAN12  PAN17  PAN19Coleção Coca-Cola (CC)   12/14
CC5  CC8
```

#### Caso 2 - Lista de faltantes com dois-pontos

```text
Faltantes
FWC : 8
MEX : 1, 4
RSA : 17
KOR : 14, 16, 20
CZE : 2, 12, 13, 17
CAN : 9, 13, 14, 20
BIH : 2, 4
QAT : 1, 19
SUI : 1, 18
BRA : 5, 16
HAI : 11, 15, 16, 19
SCO : 15, 16, 17
USA : 5
PAR : 20
AUS : 4
TUR : 8, 19, 20
GER : 13, 14
CUW : 9, 10, 13, 20
CIV : 10, 14
ECU : 7, 8
NED : 6, 7, 17
JPN : 4
SWE : 1, 13, 16
TUN : 4, 5
BEL : 4, 8, 9, 16, 20
EGY : 5, 8, 10, 11, 12, 19
IRN : 2, 8, 11, 18
NZL : 17
ESP : 2, 4, 6, 7, 9, 10, 11, 12, 13, 16, 18, 20
CPV : 2
KSA : 4
URU : 2, 4, 9, 10
FRA : 3, 11, 13
SEN : 11
IRQ : 1, 4, 6, 8, 12, 13, 14, 18
NOR : 4, 7, 8, 12, 17
ARG : 5, 9, 15, 19
ALG : 20
AUT : 9
JOR : 10, 11, 15, 20
POR : 1, 8
COD : 6, 11, 12, 15, 20
UZB : 5, 14, 15, 16
COL : 7, 11, 14, 16
ENG : 12, 19
CRO : 1
GHA : 5, 7, 16
PAN : 2, 4, 7, 8, 11, 16, 19
```

### Criterios de aceite da v3

- `Brasil 12, 14 15` retorna apenas os numeros do Brasil que ainda faltam.
- `BRA [bandeira] 12, 14, 15` retorna apenas os numeros do Brasil que ainda faltam.
- `Coca-Cola 1 2` e `CC 1, 2` conferem a mesma secao.
- `FWC : 8` confere FWC 8.
- `FWC 0` e `FWC19` existem; `FWC20` nao existe.
- `MOR 8`, `MAR 19` e `MAR19` conferem Marrocos.
- Os dois exemplos oficiais devem ser aceitos por `Conferir lista`.
- Os dois exemplos oficiais devem ser aceitos por `Registrar`.
- Figurinhas ja possuidas na lista nao aparecem no resultado.
- Lista com secao desconhecida mostra aviso.
- Lista com numero inexistente mostra aviso.
- Lista mista exibe resultados validos e erros separadamente.
- Se nenhuma figurinha da lista estiver faltando, o app informa que o usuario nao precisa de nenhuma figurinha daquela lista.
- Conferir lista nao altera o progresso nem a colecao salva.
- Registro por voz/texto, exportacao de faltantes e visualizacao continuam funcionando.
