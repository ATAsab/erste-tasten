// Übungsansicht: selten gebrauchte Einstellungen im Feld „Anpassen“ – die Kurzfassung bleibt im Knopf sichtbar.
const VIEW_SHORT = { notes: "Noten", both: "Noten + fallend", fall: "Fallend" };

function setTuneOpen(open) {
  $("#tune").hidden = !open;
  $("#tune-btn").setAttribute("aria-expanded", String(open));
}

// Sobald gespielt wird, klappt das Feld zu – dann zählen nur Noten und Klaviatur.
const closeTune = () => setTuneOpen(false);

function updateTuneSummary() {
  const helpCount = HELP_ORDER.filter((key) => helps?.[key]).length;
  $("#tune-summary").textContent = [
    VIEW_SHORT[settings.view],
    helpCount ? `${helpCount} ${helpCount === 1 ? "Hilfe" : "Hilfen"}` : "ohne Hilfen",
    settings.mode === "takt" ? `${Math.round(settings.taktTempo * 100)} %` : "",
    looping() ? (settings.loop === "inf" ? "∞" : `${settings.loop}×`) : "",
  ].filter(Boolean).join(" · ");
}

// Erklärtext: offen, bis die Lektion einmal geschafft ist – danach nur noch eine Zeile.
function showExplanation(item) {
  const done = progress[item.id]?.stars || progress[item.id]?.takt;
  $("#lesson-more").open = !done;
}

function bindTune() {
  $("#tune-btn").addEventListener("click", () => setTuneOpen($("#tune").hidden));
}
