# ⚽ Album26

> PWA individual, mobile-first e offline para controle da coleção de figurinhas da **FIFA World Cup 2026**, com registro por voz, conferência inteligente de listas e exportação para WhatsApp.

🔗 **Acesse o app online:** [pwa-album-copa-sdd.jf756061.workers.dev](https://pwa-album-copa-sdd.jf756061.workers.dev/)

---

## ✨ Principais Funcionalidades

* 🎙️ **Registro por Voz e Ditado Natural**: Abra o teclado no celular, acione o microfone e dite naturalmente (*"Brasil 12, 14 e 18"*). O parser inteligente aceita números por extenso, continuidade de seleção e múltiplos formatos.
* 🔍 **Conferência Instantânea de Listas ("Conferir lista")**: Recebeu uma lista de faltantes ou repetidas de um amigo no WhatsApp? Basta colar a lista e o app compara na hora com o seu álbum, mostrando apenas o que você precisa daquela lista — sem alterar seus dados.
* 📲 **Exportação Rápida para WhatsApp**: Exporte suas figurinhas **faltantes** ou **possuídas** em um formato padronizado e compacto (`BRA : 1, 4, 12`), abrindo diretamente a mensagem no WhatsApp.
* ⚡ **Offline-First & Instalável (PWA)**: Funciona 100% offline após o primeiro acesso via Service Worker. Instale como app nativo na tela inicial do seu celular (iOS/Android) e use na banca de jornal sem depender de sinal de internet.
* 🔒 **Zero Fricção & Privacidade Total**: Sem cadastro, sem login e sem backend. Todas as suas figurinhas ficam salvas localmente no navegador (`localStorage`).
* 📊 **Catálogo Completo da Copa 2026**:
  * 48 seleções participantes;
  * Seção especial **FWC** (0 a 19);
  * Seção especial **Coca-Cola** (1 a 14).
* 🎯 **Grade Visual e Correção Rápida**: Veja a porcentagem e total de cada seleção. Toque em qualquer número na grade para alternar instantaneamente entre possuída e faltante.

---

## 🗣️ Formatos Suportados pelo Parser

O app aceita digitação ou ditado flexível no campo de registro e na conferência de listas:

| Formato | Exemplo de Entrada |
|---|---|
| Ditado com pontuação | `Brasil 12, Argentina 8, França 20` |
| Ditado por extenso | `Brasil oito, doze e dezesseis` |
| Continuidade / múltiplos números | `Egito 10 15 18` |
| Troca de seleção no mesmo lote | `Egito 10 Argentina 5` |
| Formato de listas do WhatsApp | `MEX : 1, 4` ou `FWC : 8` |
| Tokens colados (código + número) | `BRA10 BRA14 MEX4 MEX13 CC5` |
| Abreviaturas de seleções | `BRA`, `ARG`, `MAR`/`MOR`, `CC`, `FWC`, etc. |

---

## 🛠️ Tecnologias Utilizadas

* **Frontend**: HTML5 Semântico, CSS3 Moderno (Mobile-first, paleta esportiva), Vanilla JavaScript (ES Modules, sem frameworks).
* **PWA & Cache**: Service Worker com estratégia de cache offline e Web App Manifest.
* **Testes Automatizados**: Node.js Test Runner nativo (`node --test`) com 150 testes cobrindo gramática, parsing e lógica de coleção.
* **Hospedagem & Deploy**: Cloudflare Workers (Static Assets) gerenciado via Wrangler.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* Node.js 18+ (ou versão recente com suporte a `node --test` e ES Modules)
* Python 3 (opcional, para rodar o servidor HTTP local)

### Instalação e Execução
1. Clone o repositório:
   ```bash
   git clone https://github.com/joaofr-tech/Album26.git
   cd Album26
   ```

2. Execute os testes automatizados:
   ```bash
   npm test
   ```

3. Inicie o servidor local:
   ```bash
   npm run serve
   # ou use qualquer servidor estático de sua preferência (ex: npx serve .)
   ```
   Acesse no navegador: `http://localhost:4173`

4. Gerar build de produção:
   ```bash
   npm run build
   ```
   Os arquivos finais serão copiados para a pasta `dist/`.

---

## 📦 Estrutura de Pastas

```text
├── assets/             # Ícones do PWA e favicons
├── dist/               # Arquivos gerados para deploy
├── scripts/            # Scripts utilitários de build (build.mjs)
├── src/
│   ├── data/           # Catálogo estático do álbum (album.json)
│   ├── js/             # Módulos JS (app, collection, parser, storage, export, etc.)
│   └── styles.css      # Estilos globais e componentes da UI
├── tests/              # Suíte de testes unitários (Node test runner)
├── index.html          # Ponto de entrada da aplicação
├── manifest.webmanifest# Manifesto PWA
├── sw.js               # Service Worker para funcionamento offline
└── wrangler.jsonc      # Configuração de deploy no Cloudflare Workers
```

---

## 📄 Licença

Este projeto é de uso pessoal e educacional. Todos os direitos sobre as marcas, seleções e nomes da competição pertencem aos seus respectivos proprietários.
