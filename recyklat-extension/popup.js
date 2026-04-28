/**
 * popup.js — Recyklat.pl Chrome Extension v1.6
 * Logika panelu popup + eksport CSV/TXT
 */

async function refreshUI() {
  const allContacts  = await ContactsDB.getAll();
  const userContacts = await ContactsDB.getUserAdded();

  document.getElementById('stat-total').textContent = allContacts.length;
  document.getElementById('stat-added').textContent = userContacts.length;

  const listEl = document.getElementById('user-contacts-list');
  if (userContacts.length === 0) {
    listEl.innerHTML = '<div class="empty-state">Brak ręcznie dodanych kontaktów</div>';
    return;
  }

  listEl.innerHTML = userContacts.map((c) => `
    <div class="user-contact-item">
      <span class="user-contact-name">${esc(c.name)}</span>
      <span class="user-contact-notes">${esc(c.notes || '')}</span>
      <button class="user-contact-del" data-name="${escAttr(c.name)}" title="Usuń">×</button>
    </div>
  `).join('');

  listEl.querySelectorAll('.user-contact-del').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await ContactsDB.remove(btn.dataset.name);
      refreshUI();
    });
  });
}

// ── Add contact ──────────────────────────────────────────────────────────────
document.getElementById('btn-add').addEventListener('click', async () => {
  const nameInput  = document.getElementById('input-name');
  const notesInput = document.getElementById('input-notes');
  const name  = nameInput.value.trim();
  const notes = notesInput.value.trim();

  if (!name) {
    nameInput.focus();
    nameInput.style.borderColor = '#ef4444';
    return;
  }

  nameInput.style.borderColor = '';
  const result = await ContactsDB.add(name, notes);

  if (result.success) {
    nameInput.value  = '';
    notesInput.value = '';
    refreshUI();
  } else {
    nameInput.style.borderColor = '#f59e0b';
    nameInput.placeholder = 'Już w bazie!';
    setTimeout(() => { nameInput.placeholder = 'Imię i nazwisko'; }, 2000);
  }
});

document.getElementById('input-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-add').click();
});

// ── Export ────────────────────────────────────────────────────────────────────

/**
 * Builds a CSV string from a list of contacts.
 * Columns: name, notes, source
 * Values are quoted and internal quotes are escaped (RFC 4180).
 */
function buildCSV(contacts) {
  const header = 'name,notes,source';
  const rows = contacts.map(c => {
    const source = c.addedByUser ? 'user' : 'hardcoded';
    return [c.name, c.notes || '', source]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
  });
  return [header, ...rows].join('\r\n');
}

/**
 * Triggers a browser download of a text file.
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Formats contacts as plain text (one per line: "Name — notes").
 */
function buildTXT(contacts) {
  return contacts
    .map(c => c.notes ? `${c.name} — ${c.notes}` : c.name)
    .join('\r\n');
}

// Export buttons
document.getElementById('btn-export-csv').addEventListener('click', async () => {
  const all = await ContactsDB.getAll();
  const csv = buildCSV(all);
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `recyklat_contacts_${date}.csv`, 'text/csv;charset=utf-8;');
});

document.getElementById('btn-export-txt').addEventListener('click', async () => {
  const userAdded = await ContactsDB.getUserAdded();
  const txt = buildTXT(userAdded);
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(txt, `recyklat_moje_kontakty_${date}.txt`, 'text/plain;charset=utf-8;');
});

// ── Utilities ─────────────────────────────────────────────────────────────────
function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(str) {
  return str.replace(/"/g, '&quot;');
}

refreshUI();
