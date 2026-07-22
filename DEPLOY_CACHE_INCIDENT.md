# Erro de deploy e cache da PWA

## O que aconteceu

O codigo local e os testes indicavam que o parser registrava corretamente comandos em lote, como:

- `Egito 10 15`
- `Egito 10 Egito 15`
- `Egito 10 Argentina 5`
- `Egito 1 Argelia 20`

Na aplicacao instalada, porem, o comportamento parecia antigo: apenas a primeira figurinha era registrada em alguns casos. Ao limpar os dados do site, a URL raiz da producao passou a retornar `404 Not Found`, enquanto `/index.html` continuava abrindo.

Isso mostrou que o navegador/PWA estava mascarando um problema de deploy com cache antigo do service worker.

## Causa

O deploy estava configurado para nao aplicar o tratamento automatico de HTML:

```json
"html_handling": "none"
```

Com essa configuracao, a rota `/` nao era resolvida automaticamente para `/index.html`. Antes da limpeza de cache, a PWA ainda conseguia abrir porque o service worker tinha uma versao antiga do `index.html` em cache.

Na pratica, isso criou dois sintomas:

- a producao real estava quebrada na raiz `/`;
- a aplicacao instalada podia continuar executando arquivos antigos, diferentes do codigo testado localmente.

## Solucao aplicada

Remover `html_handling: "none"` do `wrangler.jsonc`, deixando o comportamento padrao da Cloudflare para assets estaticos.

Configuracao esperada:

```json
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "pwa-album-copa-sdd",
  "compatibility_date": "2026-07-22",
  "assets": {
    "directory": "./dist"
  }
}
```

Depois do novo deploy, a URL raiz deve abrir diretamente:

```text
https://pwa-album-copa-sdd.jf756061.workers.dev/
```

sem precisar de `/index.html`.

## Como evitar repetir

- Nao usar `html_handling: "none"` para este projeto, a menos que exista um motivo especifico e testado.
- Depois de cada deploy, testar a URL raiz `/`, nao apenas `/index.html`.
- Quando alterar arquivos cacheados pelo service worker, atualizar o `CACHE_NAME` em `sw.js`.
- Se a PWA instalada se comportar diferente do codigo local, suspeitar primeiro de cache/service worker/deploy antigo.
- Antes de concluir que o parser falhou, comparar:
  - parser local via testes;
  - arquivo publicado em `/src/js/parser.js`;
  - comportamento depois de limpar dados do site.
