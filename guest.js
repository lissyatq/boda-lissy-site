// =====================================================================
// Lógica de la vista pública del invitado (index.html)
// =====================================================================

const el = (html) => {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};

function fmtDate() {
  try {
    const d = new Date(SITE_CONFIG.fecha);
    return d.toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  } catch (e) {
    return SITE_CONFIG.fechaTexto || "";
  }
}

function coverHTML() {
  if (SITE_CONFIG.imagenPortada) {
    return `
      <img class="cover-image" src="${SITE_CONFIG.imagenPortada}" alt="Invitación"
           onerror="this.outerHTML = document.getElementById('cover-placeholder-tpl').innerHTML;">
    `;
  }
  return document.getElementById("cover-placeholder-tpl").innerHTML;
}

function renderShell(bodyHtml) {
  const page = document.getElementById("page");
  page.innerHTML = `
    <template id="cover-placeholder-tpl">
      <div class="cover-placeholder">
        <div class="serif names">${SITE_CONFIG.novios}</div>
        <div class="date">${SITE_CONFIG.fechaTexto}</div>
      </div>
    </template>
    <div class="cover">
      ${coverHTML()}
      <div class="divider"></div>
      <p style="color:var(--ink-soft); font-size:14px; line-height:1.6; margin: 0 8px;">${SITE_CONFIG.mensajeBienvenida}</p>
    </div>
    ${bodyHtml}
  `;
}

function getCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("c") || "").trim().toUpperCase();
}

// ---- Vista: pedir código -------------------------------------------
function showCodeEntry(errorMsg) {
  renderShell(`
    <div class="section">
      <h2 class="serif">Confirma tu asistencia</h2>
      <p style="color:var(--ink-soft); font-size:14px;">Ingresa el código que recibiste en tu invitación.</p>
      <div class="field">
        <input type="text" id="code-input" placeholder="Ej: GARCIA24" autocapitalize="characters">
      </div>
      <div class="btn-row">
        <button class="btn" id="code-submit">Continuar</button>
      </div>
      ${errorMsg ? `<div class="msg error">${errorMsg}</div>` : ""}
    </div>
  `);
  const input = document.getElementById("code-input");
  const go = () => {
    const code = input.value.trim().toUpperCase();
    if (!code) return;
    window.location.search = "?c=" + encodeURIComponent(code);
  };
  document.getElementById("code-submit").addEventListener("click", go);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
}

// ---- Vista: detalles del evento (debajo del RSVP) -------------------
function eventDetailsHTML() {
  return `
    <div class="section">
      <h2 class="serif">Detalles</h2>
      <div class="detail-row"><span class="label">Fecha</span><span>${fmtDate()}</span></div>
      <div class="detail-row"><span class="label">Ceremonia</span><span>${SITE_CONFIG.lugarCeremonia}</span></div>
      <div class="detail-row"><span class="label">Recepción</span><span>${SITE_CONFIG.lugarRecepcion}</span></div>
      <div class="detail-row"><span class="label">Código de vestimenta</span><span>${SITE_CONFIG.dressCode}</span></div>
    </div>
  `;
}

// ---- Vista: RSVP ya respondido --------------------------------------
function showAlreadyResponded(guest, code) {
  const isConfirmed = guest.status === "confirmed";
  const companions = guest.companions || [];
  renderShell(`
    <div class="section center">
      <span class="badge ${isConfirmed ? "confirmed" : "declined"}">
        ${isConfirmed ? "Asistencia confirmada" : "No podrá asistir"}
      </span>
      <h2 class="serif" style="margin-top:14px;">Hola, ${guest.name}</h2>
      ${isConfirmed
        ? `<p style="color:var(--ink-soft); font-size:14px;">
             ${companions.length > 0
               ? "Acompañantes: " + companions.map(c => c.name).filter(Boolean).join(", ")
               : "Confirmaste tu asistencia."}
           </p>`
        : `<p style="color:var(--ink-soft); font-size:14px;">Lamentamos que no puedas acompañarnos.</p>`}
      <div class="btn-row">
        <button class="btn outline" id="edit-rsvp">Cambiar mi respuesta</button>
      </div>
    </div>
    ${eventDetailsHTML()}
  `);
  document.getElementById("edit-rsvp").addEventListener("click", () => showRsvpForm(guest, code));
}

// ---- Vista: formulario de RSVP ---------------------------------------
function companionBlockHTML(index, value) {
  return `
    <div class="companion-block" data-index="${index}">
      <button type="button" class="remove" data-remove="${index}">Quitar ✕</button>
      <label>Nombre del acompañante</label>
      <input type="text" class="comp-name" value="${value?.name || ""}">
      <label>Restricción alimentaria (opcional)</label>
      <input type="text" class="comp-diet" placeholder="Ej: vegetariano, alergia a maní" value="${value?.dietary || ""}">
    </div>
  `;
}

function showRsvpForm(guest, code) {
  const maxCompanions = Math.max(0, (guest.allowed_passes || 1) - 1);
  renderShell(`
    <div class="section center">
      <h2 class="serif">Hola, ${guest.name}</h2>
      <p style="color:var(--ink-soft); font-size:14px;">¿Nos acompañarás en este día tan especial?</p>
      <div class="btn-row">
        <button class="btn" id="btn-yes">Asistiré</button>
        <button class="btn decline" id="btn-no">No podré asistir</button>
      </div>
    </div>

    <div class="section hidden" id="yes-form">
      <h2 class="serif" style="font-size:19px;">Tus acompañantes</h2>
      <p style="color:var(--ink-soft); font-size:13px;">Tienes ${guest.allowed_passes} pase(s) en total${maxCompanions > 0 ? `, puedes agregar hasta ${maxCompanions} acompañante(s)` : ""}.</p>
      <div id="companions-list"></div>
      ${maxCompanions > 0 ? `<button type="button" class="btn outline" id="add-companion" style="margin-top:14px;">+ Agregar acompañante</button>` : ""}
      <label>Mensaje para los novios (opcional)</label>
      <textarea id="msg-yes" rows="3" placeholder="Escribe unas palabras..."></textarea>
      <div class="btn-row">
        <button class="btn" id="submit-yes">Confirmar asistencia</button>
        <button class="btn outline" id="cancel-yes">Volver</button>
      </div>
      <div id="yes-msg"></div>
    </div>

    <div class="section hidden" id="no-form">
      <label>Mensaje para los novios (opcional)</label>
      <textarea id="msg-no" rows="3" placeholder="Escribe unas palabras..."></textarea>
      <div class="btn-row">
        <button class="btn decline" id="submit-no">Confirmar que no asistiré</button>
        <button class="btn outline" id="cancel-no">Volver</button>
      </div>
      <div id="no-msg"></div>
    </div>

    ${eventDetailsHTML()}
  `);

  let companions = [];

  function renderCompanions() {
    const list = document.getElementById("companions-list");
    list.innerHTML = companions.map((c, i) => companionBlockHTML(i, c)).join("");
    list.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        companions.splice(Number(btn.dataset.remove), 1);
        renderCompanions();
      });
    });
    const addBtn = document.getElementById("add-companion");
    if (addBtn) addBtn.disabled = companions.length >= maxCompanions;
  }

  document.getElementById("btn-yes").addEventListener("click", () => {
    document.getElementById("yes-form").classList.remove("hidden");
    document.getElementById("no-form").classList.add("hidden");
    document.getElementById("yes-form").scrollIntoView({ behavior: "smooth" });
  });
  document.getElementById("btn-no").addEventListener("click", () => {
    document.getElementById("no-form").classList.remove("hidden");
    document.getElementById("yes-form").classList.add("hidden");
    document.getElementById("no-form").scrollIntoView({ behavior: "smooth" });
  });
  document.getElementById("cancel-yes").addEventListener("click", () => document.getElementById("yes-form").classList.add("hidden"));
  document.getElementById("cancel-no").addEventListener("click", () => document.getElementById("no-form").classList.add("hidden"));

  const addCompanionBtn = document.getElementById("add-companion");
  if (addCompanionBtn) {
    addCompanionBtn.addEventListener("click", () => {
      if (companions.length < maxCompanions) {
        companions.push({ name: "", dietary: "" });
        renderCompanions();
      }
    });
  }
  renderCompanions();

  document.getElementById("submit-yes").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    const list = document.getElementById("companions-list");
    const blocks = [...list.querySelectorAll(".companion-block")];
    const payload = blocks.map(b => ({
      name: b.querySelector(".comp-name").value.trim(),
      dietary: b.querySelector(".comp-diet").value.trim(),
    })).filter(c => c.name);

    btn.disabled = true; btn.textContent = "Enviando...";
    const { data, error } = await supabaseClient.rpc("submit_rsvp", {
      p_code: code,
      p_status: "confirmed",
      p_companions: payload,
      p_message: document.getElementById("msg-yes").value.trim(),
    });
    if (error || data === false) {
      document.getElementById("yes-msg").innerHTML = `<div class="msg error">No pudimos guardar tu respuesta. Intenta de nuevo.</div>`;
      btn.disabled = false; btn.textContent = "Confirmar asistencia";
      return;
    }
    guest.status = "confirmed";
    guest.companions = payload;
    showAlreadyResponded(guest, code);
  });

  document.getElementById("submit-no").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true; btn.textContent = "Enviando...";
    const { data, error } = await supabaseClient.rpc("submit_rsvp", {
      p_code: code,
      p_status: "declined",
      p_companions: [],
      p_message: document.getElementById("msg-no").value.trim(),
    });
    if (error || data === false) {
      document.getElementById("no-msg").innerHTML = `<div class="msg error">No pudimos guardar tu respuesta. Intenta de nuevo.</div>`;
      btn.disabled = false; btn.textContent = "Confirmar que no asistiré";
      return;
    }
    guest.status = "declined";
    showAlreadyResponded(guest, code);
  });
}

// ---- Arranque ---------------------------------------------------------
async function init() {
  const code = getCodeFromUrl();
  if (!code) {
    showCodeEntry();
    return;
  }
  const { data, error } = await supabaseClient.rpc("get_guest_by_code", { p_code: code });
  if (error || !data || data.length === 0) {
    showCodeEntry("No encontramos una invitación con ese código. Verifica e intenta de nuevo.");
    return;
  }
  const guest = data[0];
  if (guest.status === "pending") {
    showRsvpForm(guest, code);
  } else {
    showAlreadyResponded(guest, code);
  }
}

init();
