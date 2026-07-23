import React, { useState, useEffect } from 'react';
import {
  Type, AlignLeft, MousePointer, Package, Minus, Image,
  ChevronUp, ChevronDown, Trash2, Send, Eye, Edit3,
  Users, Mail, Copy, Smartphone, Monitor, Zap, Share2,
  Bell, X, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api';
import './EmailCampaignTab.css';

let _uid = 0;
const uid = () => ++_uid;

// ─── Color Themes ────────────────────────────────────────────────────────────
const THEMES = {
  'noir-gold': {
    label: 'Noir Gold', swatches: ['#0d0b09', '#c9a84c'],
    outerBg: '#1a1208', cardBg: '#0d0b09', headerBg: '#0d0b09',
    border: '#2a2010', heading: '#e8dfc8', text: '#c8bfb0',
    muted: '#6b5d4f', accent: '#c9a84c', accentText: '#0d0b09', logo: '#c9a84c',
  },
  'ivory': {
    label: 'Ivory Luxe', swatches: ['#faf8f4', '#8b6914'],
    outerBg: '#ede8e0', cardBg: '#faf8f4', headerBg: '#2a1f0f',
    border: '#ddd5c8', heading: '#2a1f0f', text: '#4a3f30',
    muted: '#9a8f80', accent: '#8b6914', accentText: '#ffffff', logo: '#c9a84c',
  },
  'blush': {
    label: 'Blush Rose', swatches: ['#fff8f8', '#c06060'],
    outerBg: '#f5e8e8', cardBg: '#fff8f8', headerBg: '#2a1010',
    border: '#f0d5d5', heading: '#2a1010', text: '#4a2828',
    muted: '#9a7070', accent: '#c06060', accentText: '#ffffff', logo: '#c06060',
  },
  'midnight': {
    label: 'Midnight Teal', swatches: ['#0a1a1a', '#52b788'],
    outerBg: '#061010', cardBg: '#0a1a1a', headerBg: '#0a1a1a',
    border: '#143028', heading: '#d4f0e8', text: '#a0c8c0',
    muted: '#4a7060', accent: '#52b788', accentText: '#061010', logo: '#52b788',
  },
};

// ─── Block definitions ────────────────────────────────────────────────────────
const BLOCK_META = {
  banner:  { label: 'Banner',       color: '#e67e22', icon: Zap },
  heading: { label: 'Heading',      color: '#c9a84c', icon: AlignLeft },
  text:    { label: 'Text',         color: '#4a9fd4', icon: Type },
  button:  { label: 'Button',       color: '#52b788', icon: MousePointer },
  product: { label: 'Product Card', color: '#9b59b6', icon: Package },
  divider: { label: 'Divider',      color: '#7f8c8d', icon: Minus },
  image:   { label: 'Image',        color: '#1abc9c', icon: Image },
  social:  { label: 'Social Links', color: '#e74c3c', icon: Share2 },
};

const BLOCK_DEFAULTS = {
  banner:  { content: '', sub: '' },
  heading: { content: '' },
  text:    { content: '' },
  button:  { content: 'Shop Now', url: 'https://belshaven.com/shop' },
  product: { name: '', price: '', url: '', image: '' },
  divider: {},
  image:   { url: '' },
  social:  { instagram: '', whatsapp: '', website: 'https://belshaven.com' },
};

// ─── HTML escape ──────────────────────────────────────────────────────────────
function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Email HTML generator ─────────────────────────────────────────────────────
function generateEmailHTML(subject, blocks, themeKey) {
  const t = THEMES[themeKey] || THEMES['noir-gold'];

  const rows = blocks.map(b => {
    if (b.type === 'banner') {
      return `<tr><td style="background:${t.accent};padding:44px 40px;text-align:center;">
        <h2 style="margin:0${b.sub ? ' 0 14px' : ''};color:${t.accentText};font-size:28px;font-weight:300;letter-spacing:0.08em;font-family:Georgia,'Times New Roman',serif;">${esc(b.content)}</h2>
        ${b.sub ? `<p style="margin:0;color:${t.accentText};opacity:0.85;font-size:14px;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">${esc(b.sub)}</p>` : ''}
      </td></tr>`;
    }
    if (b.type === 'heading') {
      return `<tr><td style="padding:0 40px 24px;">
        <h2 style="margin:0;color:${t.heading};font-size:26px;font-weight:300;letter-spacing:0.05em;font-family:Georgia,'Times New Roman',serif;">${esc(b.content)}</h2>
      </td></tr>`;
    }
    if (b.type === 'text') {
      return `<tr><td style="padding:0 40px 20px;">
        <p style="margin:0;color:${t.text};font-size:15px;line-height:1.8;font-family:Georgia,'Times New Roman',serif;">${esc(b.content).replace(/\n/g,'<br>')}</p>
      </td></tr>`;
    }
    if (b.type === 'button') {
      return `<tr><td style="padding:0 40px 32px;text-align:center;">
        <a href="${esc(b.url||'#')}" style="display:inline-block;padding:16px 52px;background:${t.accent};color:${t.accentText};text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;font-weight:700;">${esc(b.content||'Shop Now')}</a>
      </td></tr>`;
    }
    if (b.type === 'product') {
      const imgCell = b.image ? `<td width="140" style="padding:0;vertical-align:top;"><img src="${esc(b.image)}" width="140" height="170" style="display:block;width:140px;height:170px;object-fit:cover;" alt=""></td>` : '';
      return `<tr><td style="padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${t.border};">
          <tr>
            ${imgCell}
            <td style="padding:20px;vertical-align:top;">
              <p style="margin:0 0 6px;color:${t.accent};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Featured</p>
              <p style="margin:0 0 10px;color:${t.heading};font-size:20px;font-weight:300;font-family:Georgia,'Times New Roman',serif;">${esc(b.name)}</p>
              ${b.price ? `<p style="margin:0 0 18px;color:${t.accent};font-size:18px;font-family:Georgia,'Times New Roman',serif;">GH&#8373; ${esc(b.price)}</p>` : ''}
              ${b.url ? `<a href="${esc(b.url)}" style="display:inline-block;padding:11px 26px;background:${t.accent};color:${t.accentText};text-decoration:none;font-size:10px;letter-spacing:0.17em;text-transform:uppercase;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Shop Now</a>` : ''}
            </td>
          </tr>
        </table>
      </td></tr>`;
    }
    if (b.type === 'divider') {
      return `<tr><td style="padding:8px 40px 24px;"><div style="height:1px;background:${t.border};"></div></td></tr>`;
    }
    if (b.type === 'image' && b.url) {
      return `<tr><td style="padding:0 40px 24px;text-align:center;"><img src="${esc(b.url)}" style="max-width:100%;display:block;margin:0 auto;" alt=""></td></tr>`;
    }
    if (b.type === 'social') {
      const links = [];
      if (b.instagram) links.push(`<a href="https://instagram.com/${esc(b.instagram)}" style="display:inline-block;margin:0 6px 8px;padding:10px 22px;border:1px solid ${t.border};color:${t.accent};text-decoration:none;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Instagram</a>`);
      if (b.whatsapp) links.push(`<a href="https://wa.me/${esc(b.whatsapp.replace(/\D/g,''))}" style="display:inline-block;margin:0 6px 8px;padding:10px 22px;border:1px solid ${t.border};color:${t.accent};text-decoration:none;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">WhatsApp</a>`);
      if (b.website) links.push(`<a href="${esc(b.website)}" style="display:inline-block;margin:0 6px 8px;padding:10px 22px;border:1px solid ${t.border};color:${t.accent};text-decoration:none;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Website</a>`);
      if (!links.length) return '';
      return `<tr><td style="padding:4px 40px 24px;text-align:center;">${links.join('')}</td></tr>`;
    }
    return '';
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${t.outerBg};">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${t.outerBg};padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${t.cardBg};">
  <tr><td style="background:${t.headerBg};padding:36px 40px 32px;text-align:center;border-bottom:1px solid ${t.border};">
    <img src="https://belshaven.com/android-chrome-192x192.png" width="72" height="72" alt="Bel's Haven" style="display:block;margin:0 auto 16px;border-radius:16px;width:72px;height:72px;">
    <h1 style="margin:0;color:${t.logo};font-size:28px;font-weight:300;letter-spacing:0.22em;font-family:Georgia,'Times New Roman',serif;">BEL'S HAVEN</h1>
    <p style="margin:8px 0 0;color:${t.logo};font-size:9px;letter-spacing:0.3em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;opacity:0.75;">curated luxury &bull; Ghana</p>
    <div style="width:36px;height:1px;background:${t.logo};margin:16px auto 0;"></div>
  </td></tr>
  <tr><td style="background:${t.cardBg};padding-top:36px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${rows || `<tr><td style="padding:0 40px 40px;color:${t.muted};font-size:14px;font-family:Georgia,serif;text-align:center;">Your email content appears here.</td></tr>`}
    </table>
  </td></tr>
  <tr><td style="background:${t.cardBg};padding:32px 40px;border-top:1px solid ${t.border};text-align:center;">
    <p style="margin:0 0 6px;color:${t.muted};font-size:12px;font-family:Arial,Helvetica,sans-serif;">Bel&apos;s Haven &bull; Ghana</p>
    <p style="margin:0;font-size:11px;font-family:Arial,Helvetica,sans-serif;"><a href="https://belshaven.com" style="color:${t.accent};text-decoration:none;">belshaven.com</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Block Card ───────────────────────────────────────────────────────────────
function BlockCard({ block, isFirst, isLast, onUpdate, onRemove, onMoveUp, onMoveDown, onDuplicate }) {
  const meta = BLOCK_META[block.type] || {};
  const Icon = meta.icon;

  return (
    <div className="ec-block" style={{ '--bc': meta.color || '#888' }}>
      <div className="ec-block__header">
        <span className="ec-block__badge">
          {Icon && <Icon size={10} />}
          {meta.label}
        </span>
        <div className="ec-block__actions">
          <button className="ec-icon-btn" onClick={onMoveUp} disabled={isFirst} title="Move up"><ChevronUp size={13} /></button>
          <button className="ec-icon-btn" onClick={onMoveDown} disabled={isLast} title="Move down"><ChevronDown size={13} /></button>
          <button className="ec-icon-btn" onClick={onDuplicate} title="Duplicate"><Copy size={12} /></button>
          <button className="ec-icon-btn ec-icon-btn--del" onClick={onRemove} title="Remove"><Trash2 size={13} /></button>
        </div>
      </div>
      <div className="ec-block__body">
        {block.type === 'banner' && (
          <div className="ec-fields">
            <input className="input-field" value={block.content} onChange={e => onUpdate({ content: e.target.value })} placeholder="Banner headline..." />
            <input className="input-field" value={block.sub || ''} onChange={e => onUpdate({ sub: e.target.value })} placeholder="Sub-text (optional)" />
          </div>
        )}
        {block.type === 'heading' && (
          <input className="input-field" value={block.content} onChange={e => onUpdate({ content: e.target.value })} placeholder="Heading text..." />
        )}
        {block.type === 'text' && (
          <textarea className="input-field ec-textarea" value={block.content} rows={4} onChange={e => onUpdate({ content: e.target.value })} placeholder="Write your message here..." />
        )}
        {block.type === 'button' && (
          <div className="ec-fields">
            <input className="input-field" value={block.content} onChange={e => onUpdate({ content: e.target.value })} placeholder="Button label" />
            <input className="input-field" value={block.url} onChange={e => onUpdate({ url: e.target.value })} placeholder="https://belshaven.com/shop" />
          </div>
        )}
        {block.type === 'product' && (
          <div className="ec-fields">
            <input className="input-field" value={block.name} onChange={e => onUpdate({ name: e.target.value })} placeholder="Product name" />
            <div className="ec-fields-row">
              <input className="input-field" value={block.price} onChange={e => onUpdate({ price: e.target.value })} placeholder="Price (e.g. 150)" />
            </div>
            <input className="input-field" value={block.url} onChange={e => onUpdate({ url: e.target.value })} placeholder="Product page URL" />
            <input className="input-field" value={block.image} onChange={e => onUpdate({ image: e.target.value })} placeholder="Product image URL (optional)" />
          </div>
        )}
        {block.type === 'image' && (
          <input className="input-field" value={block.url} onChange={e => onUpdate({ url: e.target.value })} placeholder="Image URL" />
        )}
        {block.type === 'social' && (
          <div className="ec-fields">
            <div className="ec-field-row">
              <span className="ec-field-tag" style={{ background: '#c136841a', color: '#c13684' }}>IG</span>
              <input className="input-field" value={block.instagram || ''} onChange={e => onUpdate({ instagram: e.target.value })} placeholder="Instagram handle (without @)" />
            </div>
            <div className="ec-field-row">
              <span className="ec-field-tag" style={{ background: '#25d3661a', color: '#25d366' }}>WA</span>
              <input className="input-field" value={block.whatsapp || ''} onChange={e => onUpdate({ whatsapp: e.target.value })} placeholder="WhatsApp number (with country code)" />
            </div>
            <div className="ec-field-row">
              <span className="ec-field-tag" style={{ background: '#4a9fd41a', color: '#4a9fd4' }}>🌐</span>
              <input className="input-field" value={block.website || ''} onChange={e => onUpdate({ website: e.target.value })} placeholder="Website URL" />
            </div>
          </div>
        )}
        {block.type === 'divider' && <p className="ec-hint">— Horizontal divider line —</p>}
      </div>
    </div>
  );
}

// ─── Subscriber List ─────────────────────────────────────────────────────────
function SubscriberList() {
  const [subscribers, setSubscribers] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    API.get('/subscribers/')
      .then(res => { setSubscribers(res.data.results || []); setCount(res.data.count || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = async (email) => {
    await API.delete('/subscribers/', { data: { email } });
    setSubscribers(prev => prev.filter(s => s.email !== email));
    setCount(prev => prev - 1);
    toast.success('Subscriber removed');
  };

  return (
    <div className="ec-subs">
      <div className="ec-subs__header">
        <div className="ec-subs__title">
          <Bell size={14} />
          <span>Newsletter Subscribers</span>
          <span className="ec-subs__count">{count}</span>
        </div>
        <button className="ec-icon-btn" onClick={load} title="Refresh"><RefreshCw size={13} /></button>
      </div>

      {loading ? (
        <p className="ec-subs__loading">Loading…</p>
      ) : subscribers.length === 0 ? (
        <p className="ec-subs__empty">No subscribers yet.</p>
      ) : (
        <div className="ec-subs__list">
          {subscribers.map(s => (
            <div key={s.id} className="ec-sub-row">
              <span className="ec-sub-row__email">{s.email}</span>
              <span className="ec-sub-row__date">{new Date(s.created_at).toLocaleDateString()}</span>
              <button className="ec-icon-btn ec-icon-btn--del" onClick={() => remove(s.email)} title="Remove"><X size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EmailCampaignTab() {
  const [subject, setSubject] = useState("New from Bel's Haven ✨");
  const [theme, setTheme] = useState('noir-gold');
  const [blocks, setBlocks] = useState([
    { id: uid(), type: 'banner',  content: 'New Arrivals Are Here', sub: 'Curated fashion & beauty — just for you' },
    { id: uid(), type: 'text',   content: "Hi there,\n\nWe have exciting new arrivals we know you'll love. Take a look at our latest curated collection — handpicked with care, just for you." },
    { id: uid(), type: 'button', content: 'Shop New Arrivals', url: 'https://belshaven.com/shop' },
    { id: uid(), type: 'divider' },
    { id: uid(), type: 'social', instagram: '', whatsapp: '', website: 'https://belshaven.com' },
  ]);
  const [recipientType, setRecipientType] = useState('specific');
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [activePane, setActivePane] = useState('edit');
  const [device, setDevice] = useState('desktop');

  const html = generateEmailHTML(subject, blocks, theme);

  const addBlock = (type) => setBlocks(prev => [...prev, { id: uid(), type, ...BLOCK_DEFAULTS[type] }]);

  const updateBlock = (id, changes) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b));

  const removeBlock = (id) => setBlocks(prev => prev.filter(b => b.id !== id));

  const duplicateBlock = (id) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < 0) return prev;
      const copy = { ...prev[idx], id: uid() };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const moveBlock = (id, dir) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const copyHTML = () => {
    navigator.clipboard.writeText(html).then(() => toast.success('HTML copied to clipboard'));
  };

  const send = async () => {
    if (!subject.trim()) { toast.error('Subject line is required'); return; }
    if (blocks.length === 0) { toast.error('Add at least one block'); return; }
    if (recipientType === 'specific' && !testEmail.trim()) { toast.error('Enter a recipient email'); return; }

    setSending(true);
    setResult(null);
    try {
      const res = await API.post('/send-campaign/', {
        subject,
        html,
        recipient_type: recipientType,
        email: testEmail.trim(),
      });
      const data = res.data;
      setResult(data);
      if (data.sent > 0) {
        toast.success(`Sent to ${data.sent} recipient${data.sent !== 1 ? 's' : ''}!`);
      } else {
        toast.error(data.error_detail || 'Email failed to send. Check your Brevo settings.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send email';
      toast.error(msg);
      setResult({ sent: 0, errors: 1, total: 1, error_detail: msg });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ec-tab">
      {/* Header */}
      <div className="ec-header">
        <div className="ec-header__left">
          <div className="ec-header__icon-wrap"><Mail size={18} /></div>
          <div>
            <h2>Email Campaign</h2>
            <p>Design and send beautiful branded emails to your customers</p>
          </div>
        </div>
        <div className="ec-pane-toggle">
          <button className={`ec-pane-btn ${activePane === 'edit' ? 'active' : ''}`} onClick={() => setActivePane('edit')}>
            <Edit3 size={13} /> Edit
          </button>
          <button className={`ec-pane-btn ${activePane === 'preview' ? 'active' : ''}`} onClick={() => setActivePane('preview')}>
            <Eye size={13} /> Preview
          </button>
        </div>
      </div>

      <div className="ec-layout">
        {/* ── Composer ── */}
        <div className={`ec-composer ${activePane === 'preview' ? 'ec-hidden-mobile' : ''}`}>

          <div className="ec-section">
            <label className="ec-label">Subject line</label>
            <input className="input-field" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. New arrivals just for you ✨" />
          </div>

          <div className="ec-section">
            <label className="ec-label">Color theme</label>
            <div className="ec-themes">
              {Object.entries(THEMES).map(([key, t]) => (
                <button key={key} className={`ec-theme-btn ${theme === key ? 'active' : ''}`} onClick={() => setTheme(key)} title={t.label}>
                  <span className="ec-theme-swatch" style={{ background: `linear-gradient(135deg, ${t.swatches[0]} 50%, ${t.swatches[1]} 50%)` }} />
                  <span className="ec-theme-name">{t.label}</span>
                  {theme === key && <span className="ec-theme-check">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="ec-section">
            <label className="ec-label">Email blocks</label>
            <div className="ec-blocks-list">
              {blocks.map((block, i) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  isFirst={i === 0}
                  isLast={i === blocks.length - 1}
                  onUpdate={changes => updateBlock(block.id, changes)}
                  onRemove={() => removeBlock(block.id)}
                  onMoveUp={() => moveBlock(block.id, -1)}
                  onMoveDown={() => moveBlock(block.id, 1)}
                  onDuplicate={() => duplicateBlock(block.id)}
                />
              ))}
              {blocks.length === 0 && (
                <div className="ec-empty">
                  <Mail size={26} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
                  <p>No blocks yet — add one below to get started</p>
                </div>
              )}
            </div>

            <div className="ec-add-blocks">
              <p className="ec-add-label">Add block</p>
              <div className="ec-add-grid">
                {Object.entries(BLOCK_META).map(([type, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <button key={type} className="ec-add-btn" onClick={() => addBlock(type)} style={{ '--bc': meta.color }}>
                      <Icon size={13} />
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="ec-section">
            <label className="ec-label">Send to</label>
            <div className="ec-rcpt-opts">
              <label className={`ec-rcpt-opt ${recipientType === 'specific' ? 'active' : ''}`}>
                <input type="radio" name="rcpt" value="specific" checked={recipientType === 'specific'} onChange={() => setRecipientType('specific')} />
                <Mail size={13} /> Test / Specific
              </label>
              <label className={`ec-rcpt-opt ${recipientType === 'all' ? 'active' : ''}`}>
                <input type="radio" name="rcpt" value="all" checked={recipientType === 'all'} onChange={() => setRecipientType('all')} />
                <Users size={13} /> All Customers
              </label>
              <label className={`ec-rcpt-opt ${recipientType === 'subscribers' ? 'active' : ''}`}>
                <input type="radio" name="rcpt" value="subscribers" checked={recipientType === 'subscribers'} onChange={() => setRecipientType('subscribers')} />
                <Bell size={13} /> Subscribers
              </label>
            </div>
            {recipientType === 'specific' && (
              <input className="input-field" style={{ marginTop: 10 }} type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="recipient@example.com" />
            )}
            {recipientType === 'all' && (
              <div className="ec-warning">⚠ Sends to every customer who placed an order. Test to yourself first.</div>
            )}
            {recipientType === 'subscribers' && (
              <div className="ec-warning ec-warning--info">Sends to all active newsletter subscribers.</div>
            )}
          </div>

          <button className="ec-send-btn" onClick={send} disabled={sending}>
            {sending ? <span className="ec-sending-dots">Sending<span>.</span><span>.</span><span>.</span></span> : <><Send size={14} /> Send Email</>}
          </button>

          {result && (
            <div className={`ec-result ${result.sent === 0 ? 'ec-result--fail' : result.errors > 0 ? 'ec-result--warn' : 'ec-result--ok'}`}>
              {result.sent === 0 ? '✗' : result.errors > 0 ? '⚠' : '✓'}
              {' '}
              {result.sent > 0
                ? `Sent to ${result.sent} of ${result.total} recipient${result.total !== 1 ? 's' : ''}.`
                : 'Failed to send.'}
              {result.errors > 0 && result.sent > 0 && ` ${result.errors} failed.`}
              {result.error_detail && <span className="ec-result__detail">{result.error_detail}</span>}
            </div>
          )}
        </div>

        {/* ── Preview ── */}
        <div className={`ec-preview-panel ${activePane === 'edit' ? 'ec-hidden-mobile' : ''}`}>
          <div className="ec-preview__bar">
            <div className="ec-preview__dots">
              <span style={{ background: '#ff5f57' }} />
              <span style={{ background: '#febc2e' }} />
              <span style={{ background: '#28c840' }} />
            </div>
            <span className="ec-preview__subject">{subject || '(no subject)'}</span>
            <div className="ec-preview__tools">
              <button className={`ec-tool-btn ${device === 'desktop' ? 'active' : ''}`} onClick={() => setDevice('desktop')} title="Desktop view"><Monitor size={14} /></button>
              <button className={`ec-tool-btn ${device === 'mobile' ? 'active' : ''}`} onClick={() => setDevice('mobile')} title="Mobile view"><Smartphone size={14} /></button>
              <button className="ec-tool-btn" onClick={copyHTML} title="Copy HTML"><Copy size={14} /></button>
            </div>
          </div>
          <div className={`ec-preview__viewport ${device === 'mobile' ? 'ec-preview__viewport--mobile' : ''}`}>
            <iframe className="ec-preview__frame" srcDoc={html} title="Email preview" sandbox="allow-same-origin" />
          </div>
        </div>
      </div>

      <SubscriberList />
    </div>
  );
}
