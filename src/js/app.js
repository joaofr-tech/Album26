import { applyParsedCommands, isOwned, progressBySection, progressForAlbum, toggleOwned } from "./collection.js";
import { missingStickersShare, ownedStickersShare } from "./export.js";
import { neededStickersResultRows, matchNeededStickers } from "./match-list.js";
import { buildAlbumIndex, parseStickerCommands } from "./parser.js";
import { loadCollection, saveCollection } from "./storage.js";

const elements = {
  albumName: document.querySelector("#albumName"),
  progressSummary: document.querySelector("#progressSummary"),
  entryForm: document.querySelector("#entryForm"),
  commandInput: document.querySelector("#commandInput"),
  exportMissingButton: document.querySelector("#exportMissingButton"),
  exportOwnedButton: document.querySelector("#exportOwnedButton"),
  checkListToggleButton: document.querySelector("#checkListToggleButton"),
  checkListForm: document.querySelector("#checkListForm"),
  checkListInput: document.querySelector("#checkListInput"),
  resultPanel: document.querySelector("#resultPanel"),
  homeView: document.querySelector("#homeView"),
  selectionCards: document.querySelector("#selectionCards"),
  extrasSection: document.querySelector("#extrasSection"),
  extraCards: document.querySelector("#extraCards"),
  detailView: document.querySelector("#detailView"),
  detailBackButton: document.querySelector("#detailBackButton"),
  detailTitle: document.querySelector("#detailTitle"),
  detailProgress: document.querySelector("#detailProgress"),
  stickerGrid: document.querySelector("#stickerGrid")
};

let albumIndex;
let collection;
let selectedSectionId = null;

async function init() {
  const response = await fetch("./src/data/album.json");
  if (!response.ok) throw new Error("Nao foi possivel carregar o album.");
  albumIndex = buildAlbumIndex(await response.json());
  collection = loadCollection(albumIndex);
  elements.albumName.textContent = albumIndex.album.name;
  elements.entryForm.addEventListener("submit", handleRegister);
  elements.exportMissingButton.addEventListener("click", handleExportMissing);
  elements.exportOwnedButton.addEventListener("click", handleExportOwned);
  elements.checkListToggleButton.addEventListener("click", handleCheckListToggle);
  elements.checkListForm.addEventListener("submit", handleCheckListSubmit);
  elements.detailBackButton.addEventListener("click", showHome);
  render();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
}

function handleRegister(event) {
  event.preventDefault();
  const input = elements.commandInput.value.trim();
  if (!input) {
    renderResults([{ status: "error", message: "Dite ou digite pelo menos uma figurinha." }]);
    return;
  }
  const applied = applyParsedCommands(collection, parseStickerCommands(input, albumIndex));
  collection = applied.collection;
  if (applied.changed) {
    saveCollection(collection);
    elements.commandInput.value = "";
  }
  renderResults(applied.results);
  render();
}

function handleExportMissing() {
  const share = missingStickersShare(albumIndex, collection);
  if (share.total === 0) {
    renderResults([{ status: "manual", message: "Album completo. Nenhuma figurinha faltante para exportar." }]);
    return;
  }

  renderResults([{ status: "manual", message: `${share.total} figurinhas faltantes prontas para enviar no WhatsApp.` }]);
  window.location.href = share.url;
}

function handleExportOwned() {
  const share = ownedStickersShare(albumIndex, collection);
  if (share.total === 0) {
    renderResults([{ status: "manual", message: "Nenhuma figurinha possuida para exportar." }]);
    return;
  }

  renderResults([{ status: "manual", message: `${share.total} figurinhas possuidas prontas para enviar no WhatsApp.` }]);
  window.location.href = share.url;
}

function handleCheckListToggle() {
  elements.checkListForm.hidden = !elements.checkListForm.hidden;
  elements.checkListToggleButton.setAttribute("aria-expanded", String(!elements.checkListForm.hidden));
  if (!elements.checkListForm.hidden) elements.checkListInput.focus();
}

function handleCheckListSubmit(event) {
  event.preventDefault();
  const input = elements.checkListInput.value.trim();
  if (!input) {
    renderResults([{ status: "error", message: "Cole uma lista de figurinhas para conferir." }]);
    return;
  }

  renderResults(neededStickersResultRows(matchNeededStickers(albumIndex, collection, input)));
}

function showSection(sectionId) {
  selectedSectionId = sectionId;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHome() {
  selectedSectionId = null;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleSticker(stickerId) {
  const wasOwned = isOwned(collection, stickerId);
  collection = toggleOwned(collection, stickerId);
  saveCollection(collection);
  const sticker = albumIndex.stickersById.get(stickerId);
  const section = albumIndex.sections.get(sticker.sectionId);
  renderResults([{ status: "manual", message: section.name + " " + sticker.number + (wasOwned ? " marcada como faltante" : " marcada como possuida") }]);
  render();
}

function render() {
  const showingDetail = Boolean(selectedSectionId);
  elements.homeView.hidden = showingDetail;
  elements.detailView.hidden = !showingDetail;
  document.body.classList.toggle("showing-detail", showingDetail);
  renderProgress();
  renderSectionCards();
  if (showingDetail) renderDetail();
}

function renderProgress() {
  const progress = progressForAlbum(albumIndex, collection);
  elements.progressSummary.innerHTML = `
    <div class="progress-meta">
      <div class="progress-numbers">
        <span class="progress-title">Progresso Geral</span>
        <strong>${progress.owned} <small>de ${progress.total}</small></strong>
      </div>
      <span class="progress-badge">${formatPercent(progress.percent)}</span>
    </div>
    <div class="progress-track" role="progressbar" aria-valuenow="${Math.round(progress.percent)}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso do álbum">
      <div class="progress-fill" style="width: ${progress.percent}%"></div>
    </div>
  `;
}

function renderSectionCards() {
  const progress = progressBySection(albumIndex, collection);
  const teams = progress.filter(({ section }) => !isExtraSection(section));
  const extras = progress.filter(({ section }) => isExtraSection(section));
  elements.selectionCards.innerHTML = teams.map(renderSectionCard).join("");
  elements.extraCards.innerHTML = extras.map(renderSectionCard).join("");
  elements.extrasSection.hidden = extras.length === 0;
  document.querySelectorAll("[data-section-id]").forEach((button) => button.addEventListener("click", () => showSection(button.dataset.sectionId)));
}

function renderSectionCard({ section, owned, total, percent }) {
  const isComplete = owned === total && total > 0;
  return `
    <button class="section-card ${isComplete ? "is-complete" : ""}" type="button" data-section-id="${section.id}" aria-label="Abrir ${section.name}">
      <div class="card-head">
        <span class="card-title">${section.name}</span>
        ${isComplete ? '<span class="card-badge" title="Completa" aria-label="Completa">✓</span>' : ""}
      </div>
      <div class="card-stats">
        <strong>${owned} <small>/ ${total}</small></strong>
        <span class="card-percent">${formatPercent(percent)}</span>
      </div>
      <div class="card-track" aria-hidden="true">
        <div class="card-fill" style="width: ${percent}%"></div>
      </div>
    </button>
  `;
}

function renderDetail() {
  const section = albumIndex.sections.get(selectedSectionId);
  if (!section) return showHome();
  const owned = section.stickers.filter((sticker) => isOwned(collection, sticker.id)).length;
  const total = section.stickers.length;
  const percent = total > 0 ? (owned / total) * 100 : 0;
  elements.detailTitle.textContent = section.name;
  elements.detailProgress.textContent = `${owned} de ${total} possuídas (${formatPercent(percent)})`;
  elements.stickerGrid.innerHTML = section.stickers.map((sticker) => {
    const ownedSticker = isOwned(collection, sticker.id);
    const state = ownedSticker ? "owned" : "missing";
    const label = ownedSticker ? "possuída" : "faltante";
    return `<button class="sticker-number ${state}" type="button" data-sticker-id="${sticker.id}" aria-pressed="${ownedSticker}" aria-label="${section.name} ${sticker.number}, ${label}"><span class="sticker-num">${sticker.number}</span><span class="sticker-check" aria-hidden="true">${ownedSticker ? "✓" : ""}</span></button>`;
  }).join("");
  elements.stickerGrid.querySelectorAll("[data-sticker-id]").forEach((button) => button.addEventListener("click", () => toggleSticker(button.dataset.stickerId)));
}

function renderResults(results = []) {
  elements.resultPanel.innerHTML = results.map((result) => {
    const isSuccess = ["added", "already-owned", "manual"].includes(result.status);
    const tone = isSuccess ? "ok" : "warn";
    const icon = isSuccess ? "✓" : "!";
    return `<p class="${tone}"><span class="result-badge" aria-hidden="true">${icon}</span><span class="result-text">${result.message}</span></p>`;
  }).join("");
}

function isExtraSection(section) {
  return ["fwc", "coca-cola"].includes(section.id);
}

function formatPercent(value) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;
}

init().catch((error) => {
  elements.resultPanel.innerHTML = `<p class="warn">Falha ao iniciar: ${error.message}</p>`;
});
