import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Beaker,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  MapPin,
  Menu,
  PackagePlus,
  Plus,
  QrCode,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Reagent } from '@/types';

const demoReagents: Reagent[] = [
  { id: 'demo-1', name: 'Sodium chloride', formula: 'NaCl', cas_number: '7647-14-5', category: 'Inorganic salts', location: 'Cabinet A · Shelf 02', quantity: 780, unit: 'g', minimum_quantity: 250, expiry_date: '2027-04-18', updated_by: 'AK', created_at: '', updated_at: new Date().toISOString() },
  { id: 'demo-2', name: 'Acetic acid', formula: 'CH₃COOH', cas_number: '64-19-7', category: 'Acids', location: 'Cabinet B · Shelf 01', quantity: 1.8, unit: 'L', minimum_quantity: 0.75, expiry_date: '2026-12-06', updated_by: 'MR', created_at: '', updated_at: new Date().toISOString() },
  { id: 'demo-3', name: 'Ethanol, absolute', formula: 'C₂H₅OH', cas_number: '64-17-5', category: 'Solvents', location: 'Flammable store · 03', quantity: 420, unit: 'mL', minimum_quantity: 500, expiry_date: '2026-11-28', updated_by: 'SP', created_at: '', updated_at: new Date().toISOString() },
  { id: 'demo-4', name: 'Copper sulfate pentahydrate', formula: 'CuSO₄·5H₂O', cas_number: '7758-99-8', category: 'Inorganic salts', location: 'Cabinet A · Shelf 04', quantity: 96, unit: 'g', minimum_quantity: 50, expiry_date: '2028-02-12', updated_by: 'JL', created_at: '', updated_at: new Date().toISOString() },
  { id: 'demo-5', name: 'Hydrogen peroxide', formula: 'H₂O₂', cas_number: '7722-84-1', category: 'Oxidizers', location: 'Cabinet C · Shelf 02', quantity: 320, unit: 'mL', minimum_quantity: 400, expiry_date: '2026-10-30', updated_by: 'AK', created_at: '', updated_at: new Date().toISOString() },
  { id: 'demo-6', name: 'Tris base', formula: 'C₄H₁₁NO₃', cas_number: '77-86-1', category: 'Buffers', location: 'Cabinet D · Shelf 01', quantity: 450, unit: 'g', minimum_quantity: 200, expiry_date: '2029-06-21', updated_by: 'MR', created_at: '', updated_at: new Date().toISOString() },
];

const categories = ['All reagents', 'Inorganic salts', 'Acids', 'Solvents', 'Oxidizers', 'Buffers'];

function getStatus(reagent: Reagent) {
  const daysToExpiry = reagent.expiry_date ? Math.ceil((new Date(`${reagent.expiry_date}T00:00:00`).getTime() - Date.now()) / 86400000) : 999;
  if (reagent.quantity <= reagent.minimum_quantity) return { label: 'Restock soon', tone: 'warning' as const };
  if (daysToExpiry <= 30) return { label: 'Review expiry', tone: 'danger' as const };
  return { label: 'In stock', tone: 'success' as const };
}

function formatDate(date: string | null) {
  if (!date) return 'No expiry date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

function App() {
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState('All reagents');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    async function loadReagents() {
      const { data, error } = await supabase.from('reagents').select('*').order('name');
      if (error || !data) {
        setReagents(demoReagents);
        setUsingDemo(true);
      } else {
        setReagents(data as Reagent[]);
      }
      setLoading(false);
    }
    void loadReagents();
  }, []);

  const filteredReagents = useMemo(() => reagents.filter((reagent) => {
    const matchesCategory = activeCategory === 'All reagents' || reagent.category === activeCategory;
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || `${reagent.name} ${reagent.formula} ${reagent.cas_number} ${reagent.location}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  }), [activeCategory, reagents, search]);

  const selected = filteredReagents.find((reagent) => reagent.id === selectedId) ?? filteredReagents[0] ?? reagents[0];
  const lowStock = reagents.filter((reagent) => reagent.quantity <= reagent.minimum_quantity);
  const expiring = reagents.filter((reagent) => getStatus(reagent).tone === 'danger');

  useEffect(() => {
    if (selected && !selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  async function addReagent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newReagent = {
      name: String(formData.get('name') || ''),
      formula: String(formData.get('formula') || ''),
      cas_number: String(formData.get('cas_number') || ''),
      category: String(formData.get('category') || 'General'),
      location: String(formData.get('location') || 'Unassigned'),
      quantity: Number(formData.get('quantity') || 0),
      unit: String(formData.get('unit') || 'g'),
      minimum_quantity: Number(formData.get('minimum_quantity') || 0),
      expiry_date: String(formData.get('expiry_date') || '') || null,
      updated_by: 'You',
    };
    const { data, error } = await supabase.from('reagents').insert(newReagent).select().maybeSingle();
    if (error || !data) {
      const localReagent: Reagent = { ...newReagent, id: `local-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      setReagents((current) => [...current, localReagent]);
      setUsingDemo(true);
    } else {
      setReagents((current) => [...current, data as Reagent]);
    }
    setShowAdd(false);
    setNotice('Reagent added to the shared inventory');
    window.setTimeout(() => setNotice(''), 3500);
  }

  async function updateQuantity(reagent: Reagent) {
    const nextQuantity = reagent.quantity + (reagent.quantity <= reagent.minimum_quantity ? Math.max(reagent.minimum_quantity, 1) : -Math.min(reagent.minimum_quantity || 1, reagent.quantity));
    const { error } = await supabase.from('reagents').update({ quantity: nextQuantity, updated_by: 'You', updated_at: new Date().toISOString() }).eq('id', reagent.id);
    setReagents((current) => current.map((item) => item.id === reagent.id ? { ...item, quantity: nextQuantity, updated_by: 'You', updated_at: new Date().toISOString() } : item));
    if (error) setUsingDemo(true);
    setNotice(nextQuantity > reagent.quantity ? `${reagent.name} marked as replenished` : `${reagent.name} quantity updated`);
    window.setTimeout(() => setNotice(''), 3500);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><FlaskConical size={21} strokeWidth={2.2} /></div>
          <div><strong>LabLedger</strong><span>Research inventory</span></div>
        </div>
        <div className="workspace-switcher"><div className="workspace-avatar">CB</div><div><small>Workspace</small><strong>Central Biology Lab</strong></div><ChevronDown size={15} /></div>
        <nav className="primary-nav" aria-label="Primary navigation">
          <a className="nav-item active" href="#inventory"><LayoutDashboard size={17} /> Overview</a>
          <a className="nav-item" href="#inventory"><ClipboardList size={17} /> Inventory <span className="nav-count">{reagents.length}</span></a>
          <a className="nav-item" href="#alerts"><Bell size={17} /> Alerts <span className="nav-count alert-count">{lowStock.length + expiring.length}</span></a>
        </nav>
        <div className="sidebar-section-label">Workspace</div>
        <nav className="primary-nav">
          <a className="nav-item" href="#locations"><MapPin size={17} /> Locations</a>
          <a className="nav-item" href="#scan"><QrCode size={17} /> Scan a label</a>
          <a className="nav-item" href="#settings"><Settings2 size={17} /> Settings</a>
        </nav>
        <div className="sidebar-footer"><div className="sync-dot" /><div><strong>Workspace synced</strong><span>Just now · all changes saved</span></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumbs"><span>Central Biology Lab</span><ChevronRight size={14} /><strong>Overview</strong></div><div className="topbar-actions"><button className="icon-button" aria-label="Notifications"><Bell size={18} /><i /></button><div className="user-avatar">AK</div></div></header>
        <div className="page-wrap">
          <section className="hero-row"><div><div className="eyebrow"><Sparkles size={14} /> Monday, November 15, 2026</div><h1><em>Chemical inventory</em></h1><p className="hero-copy">Keep your lab chemicals organized, updated, and easy to find.</p><p className="hero-detail">Track chemical quantities in real time, record every stock movement, and stay informed when reagents are running low.</p></div><button className="button button-primary" onClick={() => setShowAdd(true)}><Plus size={17} /> Add reagent</button></section>

          <section className="action-section" aria-labelledby="action-heading"><div className="action-heading"><div><div className="section-kicker">Quick actions</div><h2 id="action-heading">What would you like to do?</h2></div><span className="scan-note"><QrCode size={14} /> QR-ready workflow</span></div><div className="action-grid"><article className="action-card action-take"><div className="action-icon"><PackagePlus size={20} /></div><div><h3>Take a chemical</h3><p>Scan the QR code on a chemical container and record the quantity you are taking.</p></div><button className="action-link" onClick={() => { window.location.hash = 'inventory'; setNotice('Choose a reagent below to record a chemical taken'); }}>Take chemical <ChevronRight size={15} /></button></article><article className="action-card action-return"><div className="action-icon"><QrCode size={20} /></div><div><h3>Return a chemical</h3><p>Scan the QR code and update the inventory when you return a chemical.</p></div><button className="action-link" onClick={() => { window.location.hash = 'inventory'; setNotice('Choose a reagent below to record a chemical returned'); }}>Return chemical <ChevronRight size={15} /></button></article><article className="action-card action-view"><div className="action-icon"><ClipboardList size={20} /></div><div><h3>View inventory</h3><p>Browse and search the current chemical stock and check which reagents are running low.</p></div><a className="action-link" href="#inventory">View inventory <ChevronRight size={15} /></a></article></div><div className="workflow-note"><span>Quick & simple</span><strong>Scan <i>→</i> Update <i>→</i> Done</strong><p>All stock changes are recorded automatically to keep the inventory up to date.</p></div></section>

          {usingDemo && <div className="demo-note"><ShieldCheck size={16} /><span>Preview mode is showing your workspace starter inventory. Your next changes will still appear here.</span><button onClick={() => setUsingDemo(false)} aria-label="Dismiss notice"><X size={15} /></button></div>}
          {notice && <div className="toast"><Check size={16} /> {notice}</div>}

          <section className="stats-grid" aria-label="Inventory summary">
            <div className="stat-card stat-featured"><div className="stat-icon"><Beaker size={18} /></div><div><span>Total reagents</span><strong>{loading ? '—' : reagents.length}</strong><small><span className="positive">↑ 8%</span> from last month</small></div><div className="mini-bars"><i /><i /><i /><i /><i /><i /></div></div>
            <div className="stat-card"><div className="stat-icon amber"><AlertTriangle size={18} /></div><div><span>Needs attention</span><strong>{lowStock.length + expiring.length}</strong><small><span className="warning-text">{lowStock.length} low stock</span> · {expiring.length} expiring</small></div></div>
            <div className="stat-card"><div className="stat-icon blue"><MapPin size={18} /></div><div><span>Storage locations</span><strong>{new Set(reagents.map((item) => item.location.split(' · ')[0])).size}</strong><small><span className="positive">100%</span> locations mapped</small></div></div>
          </section>

          <section className="inventory-layout" id="inventory">
            <div className="inventory-panel panel"><div className="panel-header"><div><div className="section-kicker">Live inventory</div><h2>Reagent library</h2></div><button className="text-button">Export list <ChevronRight size={15} /></button></div>
              <div className="toolbar"><div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reagents, CAS, location..." aria-label="Search inventory" /></div><button className="filter-button"><span>Filter</span><ChevronDown size={15} /></button></div>
              <div className="category-tabs">{categories.map((category) => <button className={activeCategory === category ? 'category-tab active' : 'category-tab'} key={category} onClick={() => setActiveCategory(category)}>{category}{category === 'All reagents' && <span>{reagents.length}</span>}</button>)}</div>
              <div className="table-wrap"><table><thead><tr><th>Reagent</th><th>Location</th><th>Available</th><th>Status</th><th>Updated</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="empty-cell">Loading your inventory...</td></tr> : filteredReagents.length === 0 ? <tr><td colSpan={6} className="empty-cell">No reagents match this search.</td></tr> : filteredReagents.map((reagent) => { const status = getStatus(reagent); return <tr key={reagent.id} className={selected?.id === reagent.id ? 'selected-row' : ''} onClick={() => setSelectedId(reagent.id)}><td><div className="reagent-cell"><div className={`reagent-symbol ${status.tone}`}>{reagent.formula.slice(0, 2)}</div><div><strong>{reagent.name}</strong><span>{reagent.formula} <i>·</i> CAS {reagent.cas_number}</span></div></div></td><td><span className="location-cell"><MapPin size={13} />{reagent.location}</span></td><td><strong className={status.tone === 'warning' ? 'quantity-low' : ''}>{reagent.quantity.toLocaleString()} {reagent.unit}</strong><span className="sub-value">min. {reagent.minimum_quantity} {reagent.unit}</span></td><td><span className={`status-pill ${status.tone}`}><i />{status.label}</span></td><td><span className="updated-cell">{reagent.updated_by}<small>{reagent.updated_at ? formatDate(reagent.updated_at.slice(0, 10)) : 'Today'}</small></span></td><td><ChevronRight className="row-chevron" size={16} /></td></tr>; })}</tbody></table></div>
            </div>
            {selected && <aside className="detail-panel panel"><div className="detail-top"><span className="section-kicker">Selected reagent</span><button className="more-button" aria-label="More reagent actions">•••</button></div><div className="detail-identity"><div className={`large-symbol ${getStatus(selected).tone}`}><FlaskConical size={29} /></div><div><h2>{selected.name}</h2><p>{selected.formula} <span>·</span> {selected.category}</p></div></div><div className={`detail-status ${getStatus(selected).tone}`}><i /> {getStatus(selected).label}<span>Updated {formatDate(selected.updated_at.slice(0, 10))}</span></div><div className="quantity-block"><div><span>Current quantity</span><strong>{selected.quantity.toLocaleString()} <small>{selected.unit}</small></strong></div><div className="quantity-meter"><i style={{ width: `${Math.min(100, Math.round((selected.quantity / Math.max(selected.minimum_quantity * 2, selected.quantity)) * 100))}%` }} /></div><span className="meter-label">Restock threshold <strong>{selected.minimum_quantity} {selected.unit}</strong></span></div><div className="detail-facts"><div><span>CAS number</span><strong>{selected.cas_number}</strong></div><div><span>Expiry date</span><strong className={getStatus(selected).tone === 'danger' ? 'danger-text' : ''}>{formatDate(selected.expiry_date)}</strong></div><div><span>Storage location</span><strong><MapPin size={13} /> {selected.location}</strong></div><div><span>Last updated by</span><strong><span className="tiny-avatar">{selected.updated_by.slice(0, 2)}</span>{selected.updated_by}</strong></div></div><button className="button button-outline full-button" onClick={() => void updateQuantity(selected)}><PackagePlus size={16} /> Update quantity</button><div className="qr-card"><div className="qr-visual"><QrCode size={37} /></div><div><strong>Scan to update</strong><span>Label ID · LL-{selected.id.slice(0, 6).toUpperCase()}</span></div><ChevronRight size={16} /></div></aside>}
          </section>

          <section className="bottom-grid" id="alerts"><div className="panel alert-panel"><div className="panel-header"><div><div className="section-kicker">Needs attention</div><h2>Restock & review</h2></div><a href="#inventory">View all <ChevronRight size={15} /></a></div>{[...lowStock, ...expiring].slice(0, 3).map((reagent) => <div className="alert-item" key={`alert-${reagent.id}`}><div className={`alert-icon ${getStatus(reagent).tone}`}><AlertTriangle size={16} /></div><div><strong>{reagent.name}</strong><span>{getStatus(reagent).label} · {reagent.location}</span></div><button onClick={() => { setSelectedId(reagent.id); window.location.hash = 'inventory'; }}>Review <ChevronRight size={14} /></button></div>)}{lowStock.length + expiring.length === 0 && <div className="all-clear"><Check size={18} /> Everything is in good shape.</div>}</div><div className="panel quick-panel" id="scan"><div className="quick-art"><QrCode size={38} strokeWidth={1.3} /></div><div><div className="section-kicker">Fast entry</div><h2>Scan a container</h2><p>Use a QR label to update a reagent in seconds while you are at the bench.</p><button className="button button-dark"><QrCode size={16} /> Open scanner</button></div></div></section>
        </div>
      </main>
      {showAdd && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAdd(false); }}><form className="modal" onSubmit={addReagent}><div className="modal-heading"><div><div className="section-kicker">New inventory record</div><h2>Add a reagent</h2></div><button type="button" className="close-button" onClick={() => setShowAdd(false)} aria-label="Close"><X size={18} /></button></div><div className="form-grid"><label>Reagent name<input name="name" required placeholder="e.g. Sodium hydroxide" /></label><label>Formula<input name="formula" placeholder="e.g. NaOH" /></label><label>CAS number<input name="cas_number" required placeholder="e.g. 1310-73-2" /></label><label>Category<select name="category" defaultValue="General"><option>General</option>{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select></label><label>Quantity<input name="quantity" type="number" min="0" step="any" required placeholder="0" /></label><label>Unit<select name="unit" defaultValue="g"><option>g</option><option>mL</option><option>L</option><option>kg</option><option>units</option></select></label><label>Restock threshold<input name="minimum_quantity" type="number" min="0" step="any" required placeholder="0" /></label><label>Expiry date<input name="expiry_date" type="date" /></label><label className="wide-field">Storage location<input name="location" required placeholder="e.g. Cabinet A · Shelf 01" /></label></div><div className="modal-footer"><button type="button" className="button button-quiet" onClick={() => setShowAdd(false)}>Cancel</button><button type="submit" className="button button-primary"><Plus size={16} /> Add reagent</button></div></form></div>}
    </div>
  );
}

export default App;
