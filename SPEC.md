# SPEC — Álbum de Figurinhas por Voz

## 1. Visão geral

Criar uma aplicação web instalável no celular, de uso individual, para permitir que o usuário registre figurinhas de um álbum usando ditado por voz.

O usuário deve conseguir falar ou digitar comandos como:

```text
Brasil 12
Argentina 8
França 20
```

A aplicação interpreta os comandos, registra as figurinhas como possuídas e atualiza automaticamente o progresso do álbum.

A aplicação substituirá o aplicativo de controle de figurinhas atualmente utilizado pelo usuário.

---

## 2. Objetivo

Reduzir ao mínimo o tempo e o esforço necessários para registrar figurinhas.

O fluxo principal deve ser:

```text
Abrir aplicação
→ tocar no campo
→ usar o microfone do teclado
→ falar várias figurinhas
→ registrar
```

A aplicação deve funcionar no celular como uma PWA instalada na tela inicial.

---

## 3. Usuário

A aplicação será utilizada por uma única pessoa.

Não haverá:

* cadastro;
* login;
* múltiplos usuários;
* permissões;
* sincronização entre contas;
* recursos sociais.

---

## 4. Plataforma

### 4.1 Tipo de aplicação

Progressive Web App, PWA, mobile-first.

### 4.2 Dispositivos prioritários

1. celular utilizado pelo usuário;
2. navegador Chrome em Android;
3. Safari em iPhone, caso necessário;
4. desktop apenas para desenvolvimento e manutenção.

### 4.3 Instalação

A aplicação deve poder ser adicionada à tela inicial do celular e aberta em modo semelhante a um aplicativo nativo.

---

## 5. Escopo do MVP

O MVP deve oferecer:

1. catálogo de um único álbum;
2. registro de figurinhas por texto ou ditado;
3. registro de várias figurinhas em um único comando;
4. visualização das figurinhas possuídas;
5. visualização das figurinhas faltantes;
6. controle de figurinhas repetidas;
7. remoção ou desfazer de registros;
8. progresso total e por seção;
9. armazenamento local;
10. exportação e importação de backup;
11. funcionamento básico sem internet após o primeiro carregamento.

---

## 6. Fora de escopo

Não implementar no MVP:

* backend;
* banco de dados remoto;
* autenticação;
* publicação na Play Store;
* publicação na App Store;
* câmera ou reconhecimento de imagem;
* leitura automática da figurinha;
* marketplace;
* chat;
* troca entre colecionadores;
* múltiplos álbuns;
* notificações;
* inteligência artificial conversacional;
* integração com o aplicativo antigo;
* sincronização automática entre dispositivos.

---

## 7. Fluxo principal

### 7.1 Registro de figurinhas

1. O usuário abre a aplicação.
2. A tela inicial exibe um campo de entrada.
3. O usuário toca no campo.
4. O usuário ativa o microfone do teclado.
5. O usuário fala uma ou várias figurinhas.
6. O texto transcrito aparece no campo.
7. O usuário toca em `Registrar`.
8. A aplicação interpreta cada comando.
9. As figurinhas válidas são registradas.
10. A aplicação exibe o resultado de cada comando.

Exemplo de entrada:

```text
Brasil 12, Argentina 8, França 20
```

Exemplo de resultado:

```text
✓ Brasil 12 adicionada
✓ Argentina 8 adicionada
✓ França 20 adicionada
```

---

## 8. Requisitos funcionais

### FR-001 — Catálogo do álbum

A aplicação deve possuir um catálogo completo do álbum.

Cada figurinha deve conter:

* identificador único;
* seção;
* número;
* título opcional;
* quantidade possuída.

Exemplo:

```json
{
  "id": "brasil-12",
  "section": "Brasil",
  "number": 12,
  "title": null
}
```

---

### FR-002 — Entrada textual

A aplicação deve possuir um campo onde o usuário possa digitar ou ditar comandos.

O campo deve aceitar:

```text
Brasil 12
```

e também:

```text
Brasil 12, Argentina 8, França 20
```

---

### FR-003 — Registro individual

Ao receber um comando válido, a aplicação deve registrar a figurinha.

Entrada:

```text
Brasil 12
```

Resultado:

```text
Brasil 12
Quantidade: 1
```

---

### FR-004 — Registro em lote

A aplicação deve interpretar múltiplos comandos separados por:

* vírgula;
* ponto;
* ponto e vírgula;
* quebra de linha;
* palavra `e`, quando não gerar ambiguidade.

Entradas equivalentes:

```text
Brasil 12, Brasil 15, Brasil 18
```

```text
Brasil 12 e Brasil 15 e Brasil 18
```

```text
Brasil 12
Brasil 15
Brasil 18
```

---

### FR-005 — Figurinhas repetidas

Caso uma figurinha já possuída seja registrada novamente, sua quantidade deve aumentar.

Exemplo:

```text
Brasil 12
```

Estado anterior:

```text
Quantidade: 1
```

Estado posterior:

```text
Quantidade: 2
```

A primeira unidade representa a figurinha do álbum.

As unidades adicionais representam repetidas.

Cálculo:

```text
repetidas = max(quantidade - 1, 0)
```

---

### FR-006 — Resultado do registro

Depois de processar a entrada, a aplicação deve exibir um resultado para cada item.

Estados possíveis:

```text
✓ Adicionada
+ Repetida adicionada
⚠ Não reconhecida
⚠ Figurinha inexistente
```

Exemplos:

```text
✓ Brasil 12 adicionada
+ Brasil 15 agora possui 2 unidades
⚠ Itália 99 não existe no álbum
```

---

### FR-007 — Limpeza do campo

Após um registro bem-sucedido, o campo deve ser limpo automaticamente.

Comandos não reconhecidos devem permanecer visíveis no histórico de resultados.

---

### FR-008 — Desfazer

A aplicação deve oferecer um botão `Desfazer` após cada operação de registro.

O botão deve reverter toda a última operação.

Exemplo:

Entrada:

```text
Brasil 12, Argentina 8
```

Ao tocar em `Desfazer`, ambos os registros devem ser revertidos.

---

### FR-009 — Alteração manual

O usuário deve conseguir alterar manualmente a quantidade de uma figurinha.

Ações disponíveis:

```text
Adicionar uma unidade
Remover uma unidade
Definir quantidade
```

A quantidade nunca pode ser negativa.

---

### FR-010 — Visualização de possuídas

A aplicação deve exibir todas as figurinhas cuja quantidade seja maior que zero.

Cada item deve mostrar:

* seção;
* número;
* quantidade;
* quantidade de repetidas.

---

### FR-011 — Visualização de faltantes

A aplicação deve exibir todas as figurinhas cuja quantidade seja igual a zero.

A lista deve poder ser agrupada por seção.

---

### FR-012 — Visualização de repetidas

A aplicação deve exibir todas as figurinhas cuja quantidade seja maior que um.

Exemplo:

```text
Brasil 12 — 2 repetidas
Argentina 8 — 1 repetida
```

---

### FR-013 — Progresso

A aplicação deve mostrar:

* total de figurinhas únicas possuídas;
* total de figurinhas do álbum;
* porcentagem concluída;
* total de repetidas.

Exemplo:

```text
184 de 600
30,7% concluído
23 repetidas
```

---

### FR-014 — Progresso por seção

Cada seção deve mostrar:

```text
Brasil
18 de 20
90%
```

---

### FR-015 — Pesquisa

A aplicação deve permitir pesquisar por:

* nome da seção;
* número;
* identificador da figurinha.

---

### FR-016 — Filtros

A aplicação deve possuir os filtros:

```text
Todas
Possuídas
Faltantes
Repetidas
```

---

### FR-017 — Armazenamento local

Os dados devem ser salvos automaticamente no dispositivo.

A aplicação não deve exigir uma ação manual para salvar.

O estado deve permanecer disponível após:

* fechar a aplicação;
* reiniciar o navegador;
* reiniciar o celular;
* abrir a aplicação sem internet.

---

### FR-018 — Exportar backup

A aplicação deve permitir exportar os dados para um arquivo JSON.

Nome sugerido:

```text
backup-figurinhas-AAAA-MM-DD.json
```

O arquivo deve conter:

* versão do formato;
* álbum;
* data da exportação;
* quantidades registradas.

Exemplo:

```json
{
  "version": 1,
  "albumId": "album-principal",
  "exportedAt": "2026-07-21T18:00:00Z",
  "stickers": {
    "brasil-12": 1,
    "argentina-8": 2
  }
}
```

---

### FR-019 — Importar backup

A aplicação deve permitir selecionar um arquivo JSON exportado anteriormente.

Antes de substituir os dados atuais, deve solicitar confirmação.

A importação deve validar:

* formato;
* versão;
* identificador do álbum;
* quantidades;
* figurinhas existentes.

---

### FR-020 — Instalação como PWA

A aplicação deve possuir:

* manifesto;
* nome;
* ícone;
* cor de tema;
* modo standalone;
* service worker.

Nome provisório:

```text
Meu Álbum
```

---

## 9. Regras de interpretação

### 9.1 Formato principal

O formato canônico é:

```text
<seção> <número>
```

Exemplos:

```text
Brasil 12
Argentina 8
França 20
```

---

### 9.2 Normalização

Antes de interpretar, o sistema deve:

1. converter para minúsculas;
2. remover espaços duplicados;
3. remover pontuação desnecessária;
4. remover acentos para comparação;
5. converter números por extenso;
6. remover palavras auxiliares.

Exemplo:

```text
Figurinha número doze do Brasil
```

Deve ser normalizado para:

```text
brasil 12
```

---

### 9.3 Palavras ignoradas

O parser pode ignorar:

```text
figurinha
número
numero
adicionar
adiciona
tenho
possuo
do
da
de
```

---

### 9.4 Números por extenso

O sistema deve reconhecer, no mínimo:

```text
um → 1
dois → 2
três → 3
...
vinte → 20
vinte e um → 21
...
```

O limite depende da maior numeração presente no álbum.

---

### 9.5 Apelidos e erros de transcrição

Cada seção pode possuir aliases.

Exemplo:

```json
{
  "name": "Brasil",
  "aliases": [
    "brasil",
    "brazil",
    "brasília"
  ]
}
```

Aliases devem ser cadastrados apenas quando forem observados erros reais no ditado do usuário.

---

### 9.6 Continuidade de seção

A aplicação pode interpretar:

```text
Brasil 12, 15 e 18
```

como:

```text
Brasil 12
Brasil 15
Brasil 18
```

A seção anterior permanece ativa até que uma nova seção seja mencionada.

Exemplo:

```text
Brasil 12, 15, Argentina 8, 10
```

Resultado:

```text
Brasil 12
Brasil 15
Argentina 8
Argentina 10
```

---

### 9.7 Validação

Um comando é válido apenas quando:

1. a seção existe;
2. o número é reconhecido;
3. a figurinha existe naquela seção.

Comandos inválidos não podem alterar os dados.

---

## 10. Modelo de dados

### 10.1 Álbum

```typescript
type Album = {
  id: string;
  name: string;
  sections: AlbumSection[];
};
```

### 10.2 Seção

```typescript
type AlbumSection = {
  id: string;
  name: string;
  aliases: string[];
  stickers: Sticker[];
};
```

### 10.3 Figurinha

```typescript
type Sticker = {
  id: string;
  sectionId: string;
  number: number;
  title?: string;
};
```

### 10.4 Estado do usuário

```typescript
type CollectionState = {
  version: number;
  albumId: string;
  quantities: Record<string, number>;
  updatedAt: string;
};
```

### 10.5 Operação para desfazer

```typescript
type CollectionOperation = {
  id: string;
  createdAt: string;
  changes: {
    stickerId: string;
    previousQuantity: number;
    newQuantity: number;
  }[];
};
```

---

## 11. Armazenamento

### 11.1 Catálogo

O catálogo do álbum deve ficar em um arquivo estático:

```text
src/data/album.json
```

### 11.2 Coleção

A coleção deve ser armazenada localmente.

Opção recomendada para o MVP:

```text
localStorage
```

Chave sugerida:

```text
sticker-album-collection-v1
```

Caso o volume de dados ou a complexidade aumente, o armazenamento poderá ser migrado para IndexedDB.

---

## 12. Telas

### 12.1 Tela inicial

Deve conter:

* nome do álbum;
* progresso;
* campo para falar ou digitar;
* botão `Registrar`;
* resultado da última operação;
* botão `Desfazer`;
* atalhos para possuídas, faltantes e repetidas.

Estrutura aproximada:

```text
Meu Álbum

184 de 600
30,7% concluído

Fale ou digite as figurinhas

[ Brasil 12, Argentina 8        ]

[ Registrar ]

✓ Brasil 12 adicionada
✓ Argentina 8 adicionada

[ Desfazer ]

[ Possuídas ] [ Faltantes ] [ Repetidas ]
```

---

### 12.2 Tela da coleção

Deve conter:

* pesquisa;
* filtros;
* agrupamento por seção;
* lista de figurinhas;
* controle de quantidade.

---

### 12.3 Tela de backup

Deve conter:

```text
Exportar backup
Importar backup
Apagar todos os dados
```

A exclusão total deve exigir confirmação explícita.

---

## 13. Requisitos de interface

### UI-001

A interface deve ser otimizada para uso com uma mão.

### UI-002

O botão `Registrar` deve ser grande e facilmente acessível.

### UI-003

O campo de entrada deve receber foco ao ser tocado.

### UI-004

O teclado não deve esconder o botão principal.

### UI-005

Confirmações devem usar texto, e não depender apenas de cores.

### UI-006

Erros devem indicar exatamente o comando que falhou.

### UI-007

A aplicação deve evitar diálogos de confirmação durante o registro normal.

### UI-008

A correção deve acontecer por `Desfazer`, não por confirmação antes de cada registro.

---

## 14. Requisitos não funcionais

### NFR-001 — Velocidade

O processamento deve ocorrer imediatamente após o usuário tocar em `Registrar`.

Meta:

```text
menos de 300 ms para interpretar uma entrada comum
```

### NFR-002 — Responsividade

A interface deve funcionar corretamente em telas com largura a partir de 320 pixels.

### NFR-003 — Persistência

Nenhuma alteração confirmada pode ser perdida ao fechar a aplicação normalmente.

### NFR-004 — Offline

Depois do primeiro carregamento, as funções principais devem funcionar sem internet.

### NFR-005 — Privacidade

Nenhum dado da coleção deve ser enviado para servidores externos.

O ditado realizado pelo teclado é responsabilidade do sistema operacional ou teclado utilizado.

### NFR-006 — Manutenibilidade

O catálogo do álbum deve poder ser alterado sem modificar a lógica principal da aplicação.

### NFR-007 — Simplicidade

Não adicionar dependências ou abstrações sem necessidade direta para algum requisito desta especificação.

---

## 15. Casos de erro

### E-001 — Seção desconhecida

Entrada:

```text
Brasul 12
```

Resultado:

```text
Não foi possível identificar a seção “Brasul”.
```

---

### E-002 — Número ausente

Entrada:

```text
Brasil
```

Resultado:

```text
Nenhum número foi identificado em “Brasil”.
```

---

### E-003 — Figurinha inexistente

Entrada:

```text
Brasil 999
```

Resultado:

```text
Brasil 999 não existe neste álbum.
```

---

### E-004 — Parte válida e parte inválida

Entrada:

```text
Brasil 12, Argentina 999, França 8
```

Resultado:

```text
✓ Brasil 12 adicionada
⚠ Argentina 999 não existe
✓ França 8 adicionada
```

Os comandos válidos devem ser registrados mesmo quando outros falharem.

---

### E-005 — Backup inválido

A aplicação deve rejeitar arquivos:

* malformados;
* incompatíveis;
* de outro álbum;
* com quantidades negativas;
* com identificadores desconhecidos.

Nenhum dado atual deve ser alterado em caso de falha.

---

## 16. Critérios de aceite

### AC-001

Dado que a coleção está vazia, quando o usuário registra:

```text
Brasil 12
```

então a quantidade de `Brasil 12` deve ser igual a 1.

---

### AC-002

Dado que `Brasil 12` possui quantidade 1, quando o usuário registra novamente:

```text
Brasil 12
```

então sua quantidade deve ser igual a 2 e deve existir uma repetida.

---

### AC-003

Quando o usuário registra:

```text
Brasil 12, Argentina 8, França 20
```

então as três figurinhas devem ser processadas separadamente.

---

### AC-004

Quando o usuário registra:

```text
Brasil 12, 15 e 18
```

então devem ser registradas:

```text
Brasil 12
Brasil 15
Brasil 18
```

---

### AC-005

Quando o usuário fecha e abre novamente a aplicação, a coleção deve permanecer inalterada.

---

### AC-006

Quando o usuário toca em `Desfazer`, a última operação completa deve ser revertida.

---

### AC-007

Quando o usuário abre a lista de faltantes, nenhuma figurinha com quantidade maior que zero deve aparecer.

---

### AC-008

Quando o usuário abre a lista de repetidas, somente figurinhas com quantidade maior que um devem aparecer.

---

### AC-009

Quando o usuário exporta e importa um backup válido, o estado restaurado deve ser idêntico ao estado exportado.

---

### AC-010

Quando o dispositivo está sem internet, o usuário deve conseguir:

* abrir a aplicação;
* consultar a coleção;
* registrar figurinhas;
* remover figurinhas;
* exportar backup.

---

## 17. Estratégia de implementação

### Fase 1 — Catálogo e registro textual

Implementar:

* catálogo JSON;
* campo de texto;
* parser;
* registro individual;
* registro em lote;
* armazenamento local;
* feedback de sucesso e erro.

### Fase 2 — Gestão da coleção

Implementar:

* possuídas;
* faltantes;
* repetidas;
* pesquisa;
* filtros;
* alteração manual;
* progresso.

### Fase 3 — Segurança dos dados

Implementar:

* exportação;
* importação;
* validação;
* exclusão total;
* desfazer.

### Fase 4 — PWA

Implementar:

* manifesto;
* ícones;
* service worker;
* funcionamento offline;
* instalação na tela inicial.

### Fase 5 — Ajustes para a voz real

Testar com o usuário e registrar:

* erros frequentes de transcrição;
* aliases necessários;
* formatos de comando mais naturais;
* dificuldades de interação.

Modificar o parser apenas com base em erros observados.

---

## 18. Definição de pronto

O MVP será considerado pronto quando:

```text
[ ] O catálogo completo estiver cadastrado.
[ ] O usuário conseguir instalar a aplicação no celular.
[ ] O usuário conseguir falar três figurinhas em sequência.
[ ] As três forem registradas corretamente.
[ ] Repetidas forem contabilizadas.
[ ] Possuídas e faltantes forem exibidas corretamente.
[ ] Os dados persistirem após fechar a aplicação.
[ ] O backup puder ser exportado e restaurado.
[ ] A aplicação funcionar sem internet.
[ ] O usuário conseguir corrigir um erro sem editar dados manualmente.
```

---

## 19. Métrica principal

Comparar o tempo necessário para registrar dez figurinhas:

```text
Aplicativo atual: tempo manual
Nova aplicação: tempo usando ditado
```

A solução será considerada útil quando o registro por ditado for perceptivelmente mais rápido e exigir menos interações com a tela.

---

## 20. Princípio de decisão

Sempre que houver dúvida entre duas implementações, escolher a que:

1. reduza o número de toques;
2. reduza o tempo de registro;
3. seja mais simples de manter;
4. funcione sem backend;
5. seja suficiente para o uso individual.

A aplicação não deve evoluir para um produto genérico enquanto o objetivo continuar sendo resolver o problema específico do usuário.
