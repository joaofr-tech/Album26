import { createBackup, backupFileName, backupToCollection, downloadJson, validateBackup } from "./backup.js";
import {
  allStickerRows,
  applyParsedCommands,
  createEmptyCollection,
  progressBySection,
  progressForAlbum,
  quantityOf,
  setQuantity,
  undoOperation
} from "./collection.js";
import { buildAlbumIndex, parseStickerCommands, slugify } from "./parser.js";
import { clearCollection, loadCollection, saveCollection } from "./storage.js";

const elements = {
  albumName: document.querySelector("#albumName"),
  progressSummary: document.querySelector("#progressSummary"),
  entryForm: document.querySelector("#entryForm"),
  commandInput: document.querySelector("#commandInput"),
  resultPanel: document.querySelector("#resultPanel"),
  undoButton: document.querySelector("#undoButton"),
  searchInput: document.querySelector("#searchInput"),
  sectionProgress: document.querySelector("#sectionProgress"),
  stickerList: document.querySelector("#stickerList"),
  collectionView: document.querySelector("#collectionView"),
  backupView: document.querySelector("#backupView"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  clearButton: document.querySelector("#clearButton"),
  backupStatus: document.querySelector("#backupStatus"),
  installButton: document.querySelector("#installButton")
};

let albumIndex;
let collection;
let lastOperation = null;
let currentFilter = "all";
let currentView = "collection";
let deferredInstallPrompt = null;

async function init() {
  const response = await fetch("./src/data/album.json");
  const album = await response.json();
  albumIndex = buildAlbumIndex(album);
  collection = loadCollection(albumIndex);

  elements.albumName.textContent = album.name;
  bindEvents();
  render();
  registerServiceWorker();
}

function bindEvents() {
  elements.entryForm.addEventListener("submit", handleRegister);
  elements.undoButton.addEventListener("click", handleUndo);
  elements.searchInput.addEventListener("input", renderStickerList);
  elements.exportButton.addEventListener("click", handleExport);
  elements.importInput.addEventListener("change", handleImport);
  elements.clearButton.addEventListener("click", handleClear);
  elements.installButton.addEventListener("click", handleInstall);

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      renderFilterButtons();
      renderStickerList();
    });
  });

  document.querySelectorAll("[data-filter-shortcut]").forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filterShortcut;
      currentView = "collection";
      renderView();
      renderFilterButtons();
      renderStickerList();
      document.querySelector("#collectionTitle").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      currentView = button.dataset.view;
      renderView();
    });
  });

  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => {
      currentView = button.dataset.viewTarget;
      renderView();
      document.querySelector("#collectionTitle").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    elements.installButton.hidden = false;
  });
}

function handleRegister(event) {
  event.preventDefault();
  const input = elements.commandInput.value.trim();
  if (!input) {
    renderResults([{ status: "missing-number", message: "Digite ou dite pelo menos uma figurinha." }]);
    return;
  }

  const parsed = parseStickerCommands(input, albumIndex);
  const applied = applyParsedCommands(collection, parsed);
  collection = applied.collection;
  lastOperation = applied.operation || lastOperation;

  if (applied.operation) {
    saveCollection(collection);
    elements.commandInput.value = "";
  }

  renderResults(applied.results);
  render();
}

function handleUndo() {
  if (!lastOperation) {
    return;
  }

  collection = undoOperation(collection, lastOperation);
  saveCollection(collection);
  renderResults([{ status: "undone", message: "Ultima operacao revertida." }]);
  lastOperation = null;
  render();
}

function handleManualQuantity(stickerId, nextQuantity) {
  collection = setQuantity(collection, stickerId, nextQuantity);
  saveCollection(collection);
  renderResults([{ status: "manual", message: "Quantidade atualizada." }]);
  render();
}

function handleExport() {
  const backup = createBackup(collection);
  downloadJson(backup, backupFileName());
  setBackupStatus("Backup exportado.");
}

async function handleImport(event) {
  const [file] = event.target.files;
  event.target.value = "";

  if (!file) {
    return;
  }

  try {
    const backup = JSON.parse(await file.text());
    const validation = validateBackup(backup, albumIndex);
    if (!validation.ok) {
      setBackupStatus(validation.error, true);
      return;
    }

    const confirmed = window.confirm("Importar este backup vai substituir os dados atuais. Continuar?");
    if (!confirmed) {
      setBackupStatus("Importacao cancelada.");
      return;
    }

    collection = backupToCollection(backup);
    lastOperation = null;
    saveCollection(collection);
    setBackupStatus("Backup importado.");
    render();
  } catch {
    setBackupStatus("Arquivo de backup malformado.", true);
  }
}

function handleClear() {
  const confirmed = window.confirm("Apagar todos os dados da colecao deste dispositivo?");
  if (!confirmed) {
    return;
  }

  clearCollection();
  collection = createEmptyCollection(albumIndex.album.id);
  lastOperation = null;
  setBackupStatus("Dados apagados.");
  renderResults([{ status: "manual", message: "Colecao apagada." }]);
  render();
}

async function handleInstall() {
  if (!deferredInstallPrompt) {
    return;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  elements.installButton.hidden = true;
}

function render() {
  renderProgress();
  renderSectionProgress();
  renderFilterButtons();
  renderView();
  renderStickerList();
  elements.undoButton.disabled = !lastOperation;
}

function renderProgress() {
  const progress = progressForAlbum(albumIndex, collection);
  elements.progressSummary.innerHTML = `
    <div>
      <strong>${progress.owned} de ${progress.total}</strong>
      <span>${formatPercent(progress.percent)} concluido</span>
    </div>
    <div>
      <strong>${progress.duplicates}</strong>
      <span>repetidas</span>
    </div>
  `;
}

function renderSectionProgress() {
  elements.sectionProgress.innerHTML = progressBySection(albumIndex, collection)
    .map(
      ({ section, owned, total, percent }) => `
        <article class="section-meter">
          <div>
            <strong>${section.name}</strong>
            <span>${owned} de ${total}</span>
          </div>
          <meter min="0" max="100" value="${percent}">${formatPercent(percent)}</meter>
          <span>${formatPercent(percent)}</span>
        </article>
      `
    )
    .join("");
}

function renderStickerList() {
  const rows = filteredRows();
  const groups = groupBySection(rows);

  if (rows.length === 0) {
    elements.stickerList.innerHTML = `<p class="empty-state">Nenhuma figurinha encontrada.</p>`;
    return;
  }

  elements.stickerList.innerHTML = [...groups.entries()]
    .map(
      ([sectionName, sectionRows]) => `
        <section class="sticker-group" aria-label="${sectionName}">
          <h3>${sectionName}</h3>
          ${sectionRows.map(renderStickerRow).join("")}
        </section>
      `
    )
    .join("");

  elements.stickerList.querySelectorAll("[data-quantity-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const stickerId = button.dataset.stickerId;
      const current = quantityOf(collection, stickerId);
      const action = button.dataset.quantityAction;
      if (action === "increment") {
        handleManualQuantity(stickerId, current + 1);
      }
      if (action === "decrement") {
        handleManualQuantity(stickerId, current - 1);
      }
    });
  });

  elements.stickerList.querySelectorAll("[data-quantity-input]").forEach((input) => {
    input.addEventListener("change", () => {
      handleManualQuantity(input.dataset.stickerId, Number(input.value));
    });
  });
}

function renderStickerRow(row) {
  const title = row.sticker.title ? `<span class="sticker-title">${row.sticker.title}</span>` : "";

  return `
    <article class="sticker-row">
      <div class="sticker-id">
        <strong>${row.section.name} ${row.sticker.number}</strong>
        ${title}
        <span>${row.quantity} unidade${row.quantity === 1 ? "" : "s"} · ${row.duplicates} repetida${row.duplicates === 1 ? "" : "s"}</span>
      </div>
      <div class="quantity-control" aria-label="Quantidade de ${row.section.name} ${row.sticker.number}">
        <button type="button" data-quantity-action="decrement" data-sticker-id="${row.sticker.id}" aria-label="Remover uma unidade">-</button>
        <input
          type="number"
          min="0"
          inputmode="numeric"
          data-quantity-input
          data-sticker-id="${row.sticker.id}"
          value="${row.quantity}"
          aria-label="Definir quantidade"
        />
        <button type="button" data-quantity-action="increment" data-sticker-id="${row.sticker.id}" aria-label="Adicionar uma unidade">+</button>
      </div>
    </article>
  `;
}

function renderResults(results = []) {
  if (!results.length) {
    elements.resultPanel.innerHTML = "";
    return;
  }

  elements.resultPanel.innerHTML = results
    .map((result) => {
      const tone = ["added", "duplicate-added", "undone", "manual"].includes(result.status) ? "ok" : "warn";
      const prefix = result.status === "duplicate-added" ? "+" : tone === "ok" ? "OK" : "Atencao";
      return `<p class="${tone}"><strong>${prefix}</strong> ${result.message}</p>`;
    })
    .join("");
}

function renderFilterButtons() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === currentFilter));
  });
}

function renderView() {
  const isCollection = currentView === "collection";
  elements.collectionView.hidden = !isCollection;
  elements.backupView.hidden = isCollection;
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.setAttribute("aria-selected", String(button.dataset.view === currentView));
  });
}

function filteredRows() {
  const query = slugify(elements.searchInput.value);

  return allStickerRows(albumIndex, collection)
    .filter((row) => {
      if (currentFilter === "owned") {
        return row.quantity > 0;
      }
      if (currentFilter === "missing") {
        return row.quantity === 0;
      }
      if (currentFilter === "duplicates") {
        return row.quantity > 1;
      }
      return true;
    })
    .filter((row) => {
      if (!query) {
        return true;
      }

      const searchable = [
        row.section.name,
        row.section.id,
        String(row.sticker.number),
        row.sticker.id,
        row.sticker.title || ""
      ]
        .map(slugify)
        .join(" ");

      return searchable.includes(query);
    });
}

function groupBySection(rows) {
  return rows.reduce((groups, row) => {
    if (!groups.has(row.section.name)) {
      groups.set(row.section.name, []);
    }
    groups.get(row.section.name).push(row);
    return groups;
  }, new Map());
}

function setBackupStatus(message, isError = false) {
  elements.backupStatus.textContent = message;
  elements.backupStatus.className = `backup-status ${isError ? "error" : "success"}`;
}

function formatPercent(value) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js");
  }
}

init().catch((error) => {
  elements.resultPanel.innerHTML = `<p class="warn"><strong>Atencao</strong> Falha ao iniciar: ${error.message}</p>`;
});
