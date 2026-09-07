// =====================================================================
// Panel de administración (admin.html)
// =====================================================================

const page = document.getElementById("page");
let guests = [];

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function guestUrl(code) {
  const base = window.location.origin + window.location.pathname.replace(/admin\.html$/, "index.html");
  return `${base}?c=${code}`;
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

// ---------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------
function renderLogin(errorMsg) {
  page.innerHTML = `
    <div class="cover">
      <div class="cover-placeholder" style="aspect-ratio:auto; padding:40px 20px;">
        <div class="serif names" style="font-size:26px;">${SITE_CONFIG.novios}</div>
        <div class="date">Panel de administración</div>
      </div>
    </div>
    <div class="section">
      <label>Correo</label>
      <input type="email" id="login-email" placeholder="tu@correo.com">
      <label>Contraseña</label>
      <input type="password" id="login-password" placeholder="••••••••">
      <div class="btn-row">
        <button class="btn" id="login-submit">Ingresar</button>
      </div>
      ${errorMsg ? `<div class="msg error">${errorMsg}</div>` : ""}
    </div>
  `;
  const submit = async () => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const btn = document.getElementById("login-submit");
    btn.disabled = true; btn.textContent = "Ingresando...";
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      renderLogin("Correo o contraseña incorrectos.");
      return;
    }
    loadDashboard();
  };
  document.getElementById("login-submit").addEventListener("click", submit);
  document.getElementById("login-password").addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
}

// ---------------------------------------------------------------------
// DASHBOARD SHELL
// ---------------------------------------------------------------------
function renderShell() {
  page.innerHTML = `
    <div class="admin-header">
      <div>
        <div class="serif" style="font-size:20px;">${SITE_CONFIG.novios}</div>
        <div style="font-size:12px; color:var(--ink-soft);">Panel de administración</div>
      </div>
      <button class="btn outline" id="logout-btn" style="width:auto;">Cerrar sesión</button>
    </div>
    <div class="admin-body">
      <div class="stat-grid" id="stats"></div>
      <div class="toolbar">
        <button class="btn" id="add-guest-btn" style="width:auto;">+ Agregar invitado</button>
        <button class="btn outline" id="export-btn" style="width:auto;">Exportar CSV</button>
        <input type="text" id="search-input" class="search-input" placeholder="Buscar por nombre...">
      </div>
      <div class="table-scroll">
        <table class="guests">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Pases</th>
              <th>Estado</th>
              <th>Enviado</th>
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="guests-tbody"></tbody>
        </table>
      </div>
    </div>
    <div id="modal-root"></div>
  `;
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    renderLogin();
  });
  document.getElementById("add-guest-btn").addEventListener("click", () => openGuestModal());
  document.getElementById("export-btn").addEventListener("click", exportCsv);
  document.getElementById("search-input").addEventListener("input", (e) => renderTable(e.target.value));
}

function personCount(g) {
  if (g.status === "confirmed") return 1 + (g.companions || []).length;
  return 0;
}

function renderStats() {
  const totalInvitados = guests.length;
  const totalPersonas = guests.reduce((sum, g) => sum + (g.allowed_passes || 0), 0);
  const confirmados = guests.reduce((sum, g) => sum + personCount(g), 0);
  const enviados = guests.filter(g => g.sent).length;
  document.getElementById("stats").innerHTML = `
    <div class="stat-card"><div class="num">${totalInvitados}</div><div class="label">Invitados</div></div>
    <div class="stat-card"><div class="num">${totalPersonas}</div><div class="label">Pases totales</div></div>
    <div class="stat-card"><div class="num">${confirmados}</div><div class="label">Confirmados</div></div>
    <div class="stat-card"><div class="num">${enviados}/${totalInvitados}</div><div class="label">Invitaciones enviadas</div></div>
  `;
}

function statusBadge(status) {
  const map = { pending: ["pending", "Pendiente"], confirmed: ["confirmed", "Confirmado"], declined: ["declined", "Rechazado"] };
  const [cls, txt] = map[status] || map.pending;
  return `<span class="badge ${cls}">${txt}</span>`;
}

function renderTable(filter) {
  const tbody = document.getElementById("guests-tbody");
  const f = (filter || "").trim().toLowerCase();
  const rows = guests.filter(g => !f || g.name.toLowerCase().includes(f));
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--ink-soft); padding:30px;">Sin invitados todavía</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(g => `
    <tr>
      <td>${escapeHtml(g.name)}</td>
      <td>${g.allowed_passes}</td>
      <td>${statusBadge(g.status)}</td>
      <td>
        <button class="icon-btn" data-toggle-sent="${g.id}" title="Marcar como enviado/no enviado">
          ${g.sent ? "✅" : "⬜️"}
        </button>
      </td>
      <td>${escapeHtml(g.phone || "—")}</td>
      <td>
        <button class="icon-btn" data-copy="${g.code}" title="Copiar link">🔗</button>
        <button class="icon-btn" data-whatsapp="${g.code}" data-name="${escapeHtml(g.name)}" title="Compartir por WhatsApp">💬</button>
        <button class="icon-btn" data-edit="${g.id}" title="Editar">✏️</button>
        <button class="icon-btn" data-delete="${g.id}" title="Eliminar">🗑️</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-toggle-sent]").forEach(btn => {
    btn.addEventListener("click", () => toggleSent(btn.dataset.toggleSent));
  });
  tbody.querySelectorAll("[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(guestUrl(btn.dataset.copy));
      btn.textContent = "✔️";
      setTimeout(() => (btn.textContent = "🔗"), 1200);
    });
  });
  tbody.querySelectorAll("[data-whatsapp]").forEach(btn => {
    btn.addEventListener("click", () => {
      const url = guestUrl(btn.dataset.whatsapp);
      const text = encodeURIComponent(`¡Hola ${btn.dataset.name}! Con mucho cariño te invitamos a nuestra boda. Confirma tu asistencia aquí: ${url}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    });
  });
  tbody.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openGuestModal(guests.find(g => g.id === btn.dataset.edit)));
  });
  tbody.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => deleteGuest(btn.dataset.delete));
  });
}

async function toggleSent(id) {
  const guest = guests.find(g => g.id === id);
  const { error } = await supabaseClient.from("guests").update({ sent: !guest.sent }).eq("id", id);
  if (!error) { guest.sent = !guest.sent; renderStats(); renderTable(document.getElementById("search-input").value); }
}

async function deleteGuest(id) {
  if (!confirm("¿Eliminar este invitado? Esta acción no se puede deshacer.")) return;
  const { error } = await supabaseClient.from("guests").delete().eq("id", id);
  if (!error) {
    guests = guests.filter(g => g.id !== id);
    renderStats(); renderTable(document.getElementById("search-input").value);
  }
}

// ---------------------------------------------------------------------
// MODAL: agregar / editar invitado
// ---------------------------------------------------------------------
function openGuestModal(guest) {
  const isEdit = !!guest;
  const root = document.getElementById("modal-root");
  root.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal">
        <h2 class="serif" style="margin-top:0;">${isEdit ? "Editar invitado" : "Agregar invitado"}</h2>
        <label>Nombre (o "Familia ...")</label>
        <input type="text" id="m-name" value="${isEdit ? escapeHtml(guest.name) : ""}">
        <label>Teléfono (opcional)</label>
        <input type="tel" id="m-phone" value="${isEdit ? escapeHtml(guest.phone) : ""}">
        <label>Pases asignados</label>
        <input type="number" id="m-passes" min="1" value="${isEdit ? guest.allowed_passes : 1}">
        ${isEdit ? `
        <label>Estado</label>
        <select id="m-status">
          <option value="pending" ${guest.status === "pending" ? "selected" : ""}>Pendiente</option>
          <option value="confirmed" ${guest.status === "confirmed" ? "selected" : ""}>Confirmado</option>
          <option value="declined" ${guest.status === "declined" ? "selected" : ""}>Rechazado</option>
        </select>
        <label>Código del link</label>
        <input type="text" id="m-code" value="${escapeHtml(guest.code)}">
        ` : ""}
        <div id="modal-msg"></div>
        <div class="btn-row">
          <button class="btn" id="modal-save">${isEdit ? "Guardar cambios" : "Crear invitado"}</button>
          <button class="btn outline" id="modal-cancel">Cancelar</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById("modal-cancel").addEventListener("click", () => (root.innerHTML = ""));
  document.getElementById("modal-overlay").addEventListener("click", (e) => { if (e.target.id === "modal-overlay") root.innerHTML = ""; });

  document.getElementById("modal-save").addEventListener("click", async () => {
    const name = document.getElementById("m-name").value.trim();
    const phone = document.getElementById("m-phone").value.trim();
    const passes = Math.max(1, parseInt(document.getElementById("m-passes").value, 10) || 1);
    if (!name) {
      document.getElementById("modal-msg").innerHTML = `<div class="msg error">El nombre es obligatorio.</div>`;
      return;
    }
    const saveBtn = document.getElementById("modal-save");
    saveBtn.disabled = true; saveBtn.textContent = "Guardando...";

    if (isEdit) {
      const status = document.getElementById("m-status").value;
      const code = document.getElementById("m-code").value.trim().toUpperCase();
      const { error } = await supabaseClient.from("guests")
        .update({ name, phone, allowed_passes: passes, status, code })
        .eq("id", guest.id);
      if (error) {
        document.getElementById("modal-msg").innerHTML = `<div class="msg error">${error.message.includes("duplicate") ? "Ese código ya está en uso." : "No se pudo guardar."}</div>`;
        saveBtn.disabled = false; saveBtn.textContent = "Guardar cambios";
        return;
      }
    } else {
      const code = generateCode();
      const { error } = await supabaseClient.from("guests").insert({ name, phone, allowed_passes: passes, code });
      if (error) {
        document.getElementById("modal-msg").innerHTML = `<div class="msg error">No se pudo crear el invitado.</div>`;
        saveBtn.disabled = false; saveBtn.textContent = "Crear invitado";
        return;
      }
    }
    root.innerHTML = "";
    await refreshGuests();
  });
}

// ---------------------------------------------------------------------
// EXPORT CSV
// ---------------------------------------------------------------------
function exportCsv() {
  const header = ["Nombre", "Telefono", "Pases", "Estado", "Enviado", "Acompanantes", "Restricciones", "Mensaje", "Codigo"];
  const rows = guests.map(g => [
    g.name,
    g.phone || "",
    g.allowed_passes,
    g.status,
    g.sent ? "Si" : "No",
    (g.companions || []).map(c => c.name).filter(Boolean).join("; "),
    (g.companions || []).map(c => c.dietary).filter(Boolean).join("; "),
    (g.message || "").replace(/\n/g, " "),
    g.code,
  ]);
  const csv = [header, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "invitados.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------
async function refreshGuests() {
  const { data, error } = await supabaseClient.from("guests").select("*").order("created_at", { ascending: true });
  if (!error) guests = data;
  renderStats();
  renderTable(document.getElementById("search-input")?.value);
}

async function loadDashboard() {
  renderShell();
  await refreshGuests();
}

// ---------------------------------------------------------------------
// ARRANQUE
// ---------------------------------------------------------------------
async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    loadDashboard();
  } else {
    renderLogin();
  }
}

init();
