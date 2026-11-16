const reagents = [
  { id: '10000000-0000-4000-8000-000000000001', name: 'Sodium chloride', formula: 'NaCl', cas_number: '7647-14-5', category: 'Inorganic salts', location: 'Cabinet A · Shelf 02', quantity: 780, unit: 'g', minimum_quantity: 250, expiry_date: '2027-04-18', updated_by: 'AK', created_at: '2026-11-01', updated_at: '2026-11-12' },
  { id: '10000000-0000-4000-8000-000000000002', name: 'Acetic acid', formula: 'CH₃COOH', cas_number: '64-19-7', category: 'Acids', location: 'Cabinet B · Shelf 01', quantity: 1.8, unit: 'L', minimum_quantity: 0.75, expiry_date: '2026-12-06', updated_by: 'MR', created_at: '2026-11-01', updated_at: '2026-11-10' },
  { id: '10000000-0000-4000-8000-000000000003', name: 'Ethanol, absolute', formula: 'C₂H₅OH', cas_number: '64-17-5', category: 'Solvents', location: 'Flammable store · 03', quantity: 420, unit: 'mL', minimum_quantity: 500, expiry_date: '2026-11-28', updated_by: 'SP', created_at: '2026-11-01', updated_at: '2026-11-09' },
  { id: '10000000-0000-4000-8000-000000000004', name: 'Copper sulfate pentahydrate', formula: 'CuSO₄·5H₂O', cas_number: '7758-99-8', category: 'Inorganic salts', location: 'Cabinet A · Shelf 04', quantity: 96, unit: 'g', minimum_quantity: 50, expiry_date: '2028-02-12', updated_by: 'JL', created_at: '2026-11-01', updated_at: '2026-11-08' },
  { id: '10000000-0000-4000-8000-000000000005', name: 'Hydrogen peroxide', formula: 'H₂O₂', cas_number: '7722-84-1', category: 'Oxidizers', location: 'Cabinet C · Shelf 02', quantity: 320, unit: 'mL', minimum_quantity: 400, expiry_date: '2026-10-30', updated_by: 'AK', created_at: '2026-11-01', updated_at: '2026-11-05' },
  { id: '10000000-0000-4000-8000-000000000006', name: 'Tris base', formula: 'C₄H₁₁NO₃', cas_number: '77-86-1', category: 'Buffers', location: 'Cabinet D · Shelf 01', quantity: 450, unit: 'g', minimum_quantity: 200, expiry_date: '2029-06-21', updated_by: 'MR', created_at: '2026-11-01', updated_at: '2026-11-11' },
];

const categories = ['All reagents', 'Inorganic salts', 'Acids', 'Solvents', 'Oxidizers', 'Buffers'];

let activeCategory = 'All reagents';
let searchQuery = '';
let selectedId = '';

function getStatus(reagent) {
  const daysToExpiry = reagent.expiry_date ? Math.ceil((new Date(reagent.expiry_date + 'T00:00:00').getTime() - Date.now()) / 86400000) : 999;
  if (reagent.quantity <= reagent.minimum_quantity) return { label: 'Restock soon', tone: 'warning' };
  if (daysToExpiry <= 30) return { label: 'Review expiry', tone: 'danger' };
  return { label: 'In stock', tone: 'success' };
}

function formatDate(date) {
  if (!date) return 'No expiry date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date + 'T00:00:00'));
}

function getFilteredReagents() {
  return reagents.filter((r) => {
    const matchesCategory = activeCategory === 'All reagents' || r.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || `${r.name} ${r.formula} ${r.cas_number} ${r.location}`.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  toastText.textContent = message;
  toast.hidden = false;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => { toast.hidden = true; }, 300); }, 3500);
}

function renderCategoryTabs() {
  const container = document.getElementById('category-tabs');
  container.innerHTML = categories.map((cat) => {
    const count = cat === 'All reagents' ? reagents.length : reagents.filter((r) => r.category === cat).length;
    return `<button class="category-tab ${activeCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}${cat === 'All reagents' ? ` <span>${count}</span>` : ''}</button>`;
  }).join('');
  container.querySelectorAll('.category-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeCategory = tab.dataset.category;
      renderCategoryTabs();
      renderTable();
      renderDetail();
    });
  });
}

function renderTable() {
  const tbody = document.getElementById('reagent-table-body');
  const filtered = getFilteredReagents();
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">No reagents match this search.</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map((r) => {
    const status = getStatus(r);
    return `<tr class="${selectedId === r.id ? 'selected-row' : ''}" data-id="${r.id}">
      <td><div class="reagent-cell"><div class="reagent-symbol ${status.tone}">${r.formula.slice(0, 2)}</div><div><strong>${r.name}</strong><span>${r.formula} <i>·</i> CAS ${r.cas_number}</span></div></div></td>
      <td><span class="location-cell"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>${r.location}</span></td>
      <td><strong class="${status.tone === 'warning' ? 'quantity-low' : ''}">${r.quantity.toLocaleString()} ${r.unit}</strong><span class="sub-value">min. ${r.minimum_quantity} ${r.unit}</span></td>
      <td><span class="status-pill ${status.tone}"><i></i>${status.label}</span></td>
      <td><span class="updated-cell">${r.updated_by}<small>${formatDate(r.updated_at.slice(0, 10))}</small></span></td>
      <td><svg class="row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('tr').forEach((row) => {
    row.addEventListener('click', () => {
      selectedId = row.dataset.id;
      renderTable();
      renderDetail();
    });
  });
}

function renderDetail() {
  const panel = document.getElementById('detail-panel');
  const filtered = getFilteredReagents();
  const selected = filtered.find((r) => r.id === selectedId) || filtered[0];
  if (!selected) { panel.innerHTML = ''; return; }
  const status = getStatus(selected);
  const meterWidth = Math.min(100, Math.round((selected.quantity / Math.max(selected.minimum_quantity * 2, selected.quantity)) * 100));
  panel.innerHTML = `
    <div class="detail-top"><span class="section-kicker">Selected reagent</span><button class="more-button" aria-label="More reagent actions">•••</button></div>
    <div class="detail-identity"><div class="large-symbol ${status.tone}"><svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/></svg></div><div><h2>${selected.name}</h2><p>${selected.formula} <span>·</span> ${selected.category}</p></div></div>
    <div class="detail-status ${status.tone}"><i></i> ${status.label}<span>Updated ${formatDate(selected.updated_at.slice(0, 10))}</span></div>
    <div class="quantity-block"><div><span>Current quantity</span><strong>${selected.quantity.toLocaleString()} <small>${selected.unit}</small></strong></div><div class="quantity-meter"><i style="width:${meterWidth}%"></i></div><span class="meter-label">Restock threshold <strong>${selected.minimum_quantity} ${selected.unit}</strong></span></div>
    <div class="detail-facts">
      <div><span>CAS number</span><strong>${selected.cas_number}</strong></div>
      <div><span>Expiry date</span><strong class="${status.tone === 'danger' ? 'danger-text' : ''}">${formatDate(selected.expiry_date)}</strong></div>
      <div><span>Storage location</span><strong><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${selected.location}</strong></div>
      <div><span>Last updated by</span><strong><span class="tiny-avatar">${selected.updated_by.slice(0, 2)}</span>${selected.updated_by}</strong></div>
    </div>
    <button class="button button-outline full-button" id="update-qty-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 8 3 11l2.5 3"/><path d="M18.5 8 21 11l-2.5 3"/><path d="M12 4v16"/><path d="M12 4 8 8"/><path d="M12 4l4 4"/></svg> Update quantity</button>
    <div class="qr-card"><div class="qr-visual"><svg width="37" height="37" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/></svg></div><div><strong>Scan to update</strong><span>Label ID · LL-${selected.id.slice(0, 6).toUpperCase()}</span></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></div>
  `;
  document.getElementById('update-qty-btn').addEventListener('click', () => {
    const r = reagents.find((item) => item.id === selected.id);
    if (!r) return;
    const nextQuantity = r.quantity <= r.minimum_quantity ? Math.max(r.minimum_quantity, 1) : Math.max(0, r.quantity - Math.min(r.minimum_quantity || 1, r.quantity));
    r.quantity = nextQuantity;
    r.updated_by = 'You';
    r.updated_at = new Date().toISOString();
    renderAll();
    showToast(nextQuantity > r.quantity ? `${r.name} marked as replenished` : `${r.name} quantity updated`);
  });
}

function renderAlerts() {
  const container = document.getElementById('alert-list');
  const lowStock = reagents.filter((r) => r.quantity <= r.minimum_quantity);
  const expiring = reagents.filter((r) => getStatus(r).tone === 'danger');
  const alerts = [...lowStock, ...expiring].slice(0, 3);
  if (alerts.length === 0) {
    container.innerHTML = '<div class="all-clear"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg> Everything is in good shape.</div>';
    return;
  }
  container.innerHTML = alerts.map((r) => {
    const status = getStatus(r);
    return `<div class="alert-item"><div class="alert-icon ${status.tone}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div><div><strong>${r.name}</strong><span>${status.label} · ${r.location}</span></div><button data-id="${r.id}">Review <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button></div>`;
  }).join('');
  container.querySelectorAll('.alert-item button').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedId = btn.dataset.id;
      renderTable();
      renderDetail();
      document.getElementById('inventory').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function renderStats() {
  const lowStock = reagents.filter((r) => r.quantity <= r.minimum_quantity);
  const expiring = reagents.filter((r) => getStatus(r).tone === 'danger');
  const locations = new Set(reagents.map((r) => r.location.split(' · ')[0]));
  document.getElementById('stat-total').textContent = reagents.length;
  document.getElementById('stat-attention').textContent = lowStock.length + expiring.length;
  document.getElementById('stat-low').textContent = `${lowStock.length} low stock`;
  document.getElementById('stat-expiring').textContent = `${expiring.length} expiring`;
  document.getElementById('stat-locations').textContent = locations.size;
  document.getElementById('nav-inventory-count').textContent = reagents.length;
  document.getElementById('nav-alert-count').textContent = lowStock.length + expiring.length;
}

function renderAll() {
  renderCategoryTabs();
  renderTable();
  renderDetail();
  renderAlerts();
  renderStats();
}

function setupModal() {
  const backdrop = document.getElementById('modal-backdrop');
  const form = document.getElementById('add-form');
  const closeBtn = document.getElementById('close-modal');
  const cancelBtn = document.getElementById('cancel-modal');
  const addBtn = document.getElementById('add-reagent-btn');

  function openModal() { backdrop.hidden = false; }
  function closeModal() { backdrop.hidden = true; form.reset(); }

  addBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) closeModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const newReagent = {
      id: 'local-' + Date.now(),
      name: formData.get('name'),
      formula: formData.get('formula') || '',
      cas_number: formData.get('cas_number'),
      category: formData.get('category') || 'General',
      location: formData.get('location') || 'Unassigned',
      quantity: Number(formData.get('quantity')) || 0,
      unit: formData.get('unit') || 'g',
      minimum_quantity: Number(formData.get('minimum_quantity')) || 0,
      expiry_date: formData.get('expiry_date') || null,
      updated_by: 'You',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    reagents.push(newReagent);
    if (!categories.includes(newReagent.category)) categories.push(newReagent.category);
    closeModal();
    renderAll();
    showToast('Reagent added to the shared inventory');
  });
}

function setupSearch() {
  document.getElementById('search').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTable();
    renderDetail();
  });
}

function setupActionButtons() {
  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      showToast(action === 'take' ? 'Choose a reagent below to record a chemical taken' : 'Choose a reagent below to record a chemical returned');
      document.getElementById('inventory').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function setTodayDate() {
  const today = new Date();
  const opts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  document.getElementById('today-date').textContent = today.toLocaleDateString('en-US', opts);
}

document.addEventListener('DOMContentLoaded', () => {
  setTodayDate();
  renderAll();
  setupModal();
  setupSearch();
  setupActionButtons();
});
