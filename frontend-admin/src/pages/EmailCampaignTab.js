import React, { useState } from 'react';
import { Type, AlignLeft, MousePointer, Package, Minus, Image, ChevronUp, ChevronDown, Trash2, Send, Eye, Edit3, Users, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api';
import './EmailCampaignTab.css';

let _uid = 0;
const uid = () => ++_uid;

const BLOCK_LABELS = {
  heading: 'Heading',
  text: 'Text',
  button: 'Button',
  product: 'Product Card',
  divider: 'Divider',
  image: 'Image',
};

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateEmailHTML(subject, blocks) {
  const rows = blocks.map(b => {
    if (b.type === 'heading') {
      return `<tr><td style="padding:0 40px 24px;">
        <h2 style="margin:0;color:#e8dfc8;font-size:26px;font-weight:300;letter-spacing:0.05em;font-family:Georgia,'Times New Roman',serif;">${esc(b.content)}</h2>
      </td></tr>`;
    }
    if (b.type === 'text') {
      return `<tr><td style="padding:0 40px 20px;">
        <p style="margin:0;color:#c8bfb0;font-size:15px;line-height:1.8;font-family:Georgia,'Times New Roman',serif;">${esc(b.content).replace(/\n/g, '<br>')}</p>
      </td></tr>`;
    }
    if (b.type === 'button') {
      return `<tr><td style="padding:0 40px 32px;text-align:center;">
        <a href="${esc(b.url || '#')}" style="display:inline-block;padding:15px 44px;background:#c9a84c;color:#0d0b09;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;">${esc(b.content || 'Shop Now')}</a>
      </td></tr>`;
    }
    if (b.type === 'product') {
      const imgCell = b.image
        ? `<td width="140" style="padding:0;vertical-align:top;"><img src="${esc(b.image)}" width="140" height="170" style="display:block;width:140px;height:170px;object-fit:cover;" alt=""></td>`
        : '';
      return `<tr><td style="padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #2a2010;">
          <tr>
            ${imgCell}
            <td style="padding:20px;vertical-align:top;">
              <p style="margin:0 0 6px;color:#c9a84c;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Featured</p>
              <p style="margin:0 0 10px;color:#e8dfc8;font-size:20px;font-weight:300;font-family:Georgia,'Times New Roman',serif;">${esc(b.name)}</p>
              ${b.price ? `<p style="margin:0 0 18px;color:#c9a84c;font-size:17px;font-family:Georgia,'Times New Roman',serif;">GH&#8373; ${esc(b.price)}</p>` : ''}
              ${b.url ? `<a href="${esc(b.url)}" style="display:inline-block;padding:11px 24px;background:#c9a84c;color:#0d0b09;text-decoration:none;font-size:10px;letter-spacing:0.17em;text-transform:uppercase;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Shop Now</a>` : ''}
            </td>
          </tr>
        </table>
      </td></tr>`;
    }
    if (b.type === 'divider') {
      return `<tr><td style="padding:8px 40px 24px;"><div style="height:1px;background:#2a2010;"></div></td></tr>`;
    }
    if (b.type === 'image' && b.url) {
      return `<tr><td style="padding:0 40px 24px;text-align:center;">
        <img src="${esc(b.url)}" style="max-width:100%;display:block;margin:0 auto;" alt="">
      </td></tr>`;
    }
    return '';
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#1a1208;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1208;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#0d0b09;">
  <tr><td style="padding:40px;text-align:center;border-bottom:1px solid #2a2010;">
    <p style="margin:0 0 8px;color:#c9a84c;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">est. Ghana</p>
    <h1 style="margin:0;color:#c9a84c;font-size:30px;font-weight:300;letter-spacing:0.22em;font-family:Georgia,'Times New Roman',serif;">BEL'S HAVEN</h1>
    <div style="width:36px;height:1px;background:#c9a84c;margin:18px auto 0;"></div>
  </td></tr>
  <tr><td style="padding-top:36px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${rows || '<tr><td style="padding:0 40px 32px;color:#6b5d4f;font-size:14px;font-family:Georgia,serif;text-align:center;">Your email content will appear here.</td></tr>'}
    </table>
  </td></tr>
  <tr><td style="padding:32px 40px;border-top:1px solid #2a2010;text-align:center;">
    <p style="margin:0 0 6px;color:#6b5d4f;font-size:12px;font-family:Arial,Helvetica,sans-serif;">Bel&apos;s Haven &bull; Ghana</p>
    <p style="margin:0;font-size:11px;font-family:Arial,Helvetica,sans-serif;"><a href="https://belshaven.com" style="color:#c9a84c;text-decoration:none;">belshaven.com</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

const BLOCK_DEFAULTS = {
  heading: { content: '' },
  text: { content: '' },
  button: { content: 'Shop Now', url: 'https://belshaven.com/shop' },
  product: { name: '', price: '', url: '', image: '' },
  divider: {},
  image: { url: '' },
};

function BlockCard({ block, isFirst, isLast, onUpdate, onRemove, onMoveUp, onMoveDown }) {
  return (
    <div className="ec-block">
      <div className="ec-block__header">
        <span className="ec-block__type">{BLOCK_LABELS[block.type]}</span>
        <div className="ec-block__actions">
          <button className="ec-icon-btn" onClick={onMoveUp} disabled={isFirst} title="Move up"><ChevronUp size={13} /></button>
          <button className="ec-icon-btn" onClick={onMoveDown} disabled={isLast} title="Move down"><ChevronDown size={13} /></button>
          <button className="ec-icon-btn ec-icon-btn--del" onClick={onRemove} title="Remove"><Trash2 size={13} /></button>
        </div>
      </div>
      <div className="ec-block__body">
        {block.type === 'heading' && (
          <input className="input-field" value={block.content} onChange={e => onUpdate({ content: e.target.value })} placeholder="Heading text..." />
        )}
        {block.type === 'text' && (
          <textarea className="input-field ec-textarea" value={block.content} rows={4} onChange={e => onUpdate({ content: e.target.value })} placeholder="Write your message..." />
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
            <input className="input-field" value={block.price} onChange={e => onUpdate({ price: e.target.value })} placeholder="Price (e.g. 150)" />
            <input className="input-field" value={block.url} onChange={e => onUpdate({ url: e.target.value })} placeholder="Product page link" />
            <input className="input-field" value={block.image} onChange={e => onUpdate({ image: e.target.value })} placeholder="Image URL (optional)" />
          </div>
        )}
        {block.type === 'image' && (
          <input className="input-field" value={block.url} onChange={e => onUpdate({ url: e.target.value })} placeholder="Image URL" />
        )}
        {block.type === 'divider' && (
          <p className="ec-hint">Horizontal divider line</p>
        )}
      </div>
    </div>
  );
}

export default function EmailCampaignTab() {
  const [subject, setSubject] = useState("New from Bel's Haven ✨");
  const [blocks, setBlocks] = useState([
    { id: uid(), type: 'heading', content: 'Something special for you' },
    { id: uid(), type: 'text', content: "Hi there,\n\nWe have exciting new arrivals — curated with care just for you. Take a look at our latest collection." },
    { id: uid(), type: 'button', content: 'Shop New Arrivals', url: 'https://belshaven.com/shop' },
  ]);
  const [recipientType, setRecipientType] = useState('specific');
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [activePane, setActivePane] = useState('edit');

  const html = generateEmailHTML(subject, blocks);

  const addBlock = (type) => {
    setBlocks(prev => [...prev, { id: uid(), type, ...BLOCK_DEFAULTS[type] }]);
  };

  const updateBlock = (id, changes) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b));
  };

  const removeBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
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
      setResult(res.data);
      toast.success(`Sent to ${res.data.sent} recipient${res.data.sent !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ec-tab">
      <div className="ec-header">
        <div className="ec-header__left">
          <Mail size={20} className="ec-header__icon" />
          <div>
            <h2>Email Campaign</h2>
            <p>Design and send branded emails to your customers</p>
          </div>
        </div>
        <div className="ec-header__toggle">
          <button className={`ec-pane-btn ${activePane === 'edit' ? 'active' : ''}`} onClick={() => setActivePane('edit')}>
            <Edit3 size={14} /> Edit
          </button>
          <button className={`ec-pane-btn ${activePane === 'preview' ? 'active' : ''}`} onClick={() => setActivePane('preview')}>
            <Eye size={14} /> Preview
          </button>
        </div>
      </div>

      <div className="ec-layout">
        {/* ── Composer ── */}
        <div className={`ec-composer ${activePane === 'preview' ? 'ec-composer--hidden' : ''}`}>

          <div className="ec-section">
            <label className="ec-label">Subject line</label>
            <input className="input-field" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. New arrivals just for you ✨" />
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
                />
              ))}
              {blocks.length === 0 && <p className="ec-empty">No blocks yet. Add one below.</p>}
            </div>

            <div className="ec-add-blocks">
              <p className="ec-add-label">Add block</p>
              <div className="ec-add-grid">
                {[
                  { type: 'heading', icon: AlignLeft, label: 'Heading' },
                  { type: 'text', icon: Type, label: 'Text' },
                  { type: 'button', icon: MousePointer, label: 'Button' },
                  { type: 'product', icon: Package, label: 'Product' },
                  { type: 'divider', icon: Minus, label: 'Divider' },
                  { type: 'image', icon: Image, label: 'Image' },
                ].map(({ type, icon: Icon, label }) => (
                  <button key={type} className="ec-add-btn" onClick={() => addBlock(type)}>
                    <Icon size={13} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="ec-section">
            <label className="ec-label">Recipients</label>
            <div className="ec-rcpt-opts">
              <label className={`ec-rcpt-opt ${recipientType === 'specific' ? 'active' : ''}`}>
                <input type="radio" name="rcpt" value="specific" checked={recipientType === 'specific'} onChange={() => setRecipientType('specific')} />
                <Mail size={13} /> Specific email
              </label>
              <label className={`ec-rcpt-opt ${recipientType === 'all' ? 'active' : ''}`}>
                <input type="radio" name="rcpt" value="all" checked={recipientType === 'all'} onChange={() => setRecipientType('all')} />
                <Users size={13} /> All customers
              </label>
            </div>
            {recipientType === 'specific' && (
              <input className="input-field" style={{ marginTop: 10 }} type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="recipient@example.com" />
            )}
            {recipientType === 'all' && (
              <p className="ec-warning">This will send to every customer who has placed an order. Use "Specific email" to test first.</p>
            )}
          </div>

          <button className="btn-primary ec-send-btn" onClick={send} disabled={sending}>
            {sending ? 'Sending…' : <><Send size={14} /> Send Email</>}
          </button>

          {result && (
            <div className={`ec-result ${result.errors > 0 ? 'ec-result--warn' : ''}`}>
              ✓ Sent to {result.sent} of {result.total} recipient{result.total !== 1 ? 's' : ''}.
              {result.errors > 0 && ` ${result.errors} failed.`}
            </div>
          )}
        </div>

        {/* ── Preview ── */}
        <div className={`ec-preview ${activePane === 'edit' ? 'ec-preview--hidden' : ''}`}>
          <div className="ec-preview__bar">
            <span className="ec-preview__label">Preview</span>
            <span className="ec-preview__subject">{subject || '(no subject)'}</span>
          </div>
          <iframe
            className="ec-preview__frame"
            srcDoc={html}
            title="Email preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
