import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Upload, X, Package, Check, AlertCircle, Loader } from 'lucide-react';
import API from '../api';
import './AiAssistantTab.css';

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

async function uploadImage(file) {
  const fd = new FormData();
  fd.append('image', file);
  fd.append('is_primary', 'true');
  const res = await API.post('/product-images/', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.id;
}

async function createProduct(product) {
  const res = await API.post('/products/', product);
  return res.data;
}

async function updateProductBySlug(slug, changes) {
  const res = await API.patch(`/products/${slug}/`, changes);
  return res.data;
}

async function fetchCategories() {
  const res = await API.get('/categories/');
  return res.data.results || res.data || [];
}

async function fetchProducts() {
  const res = await API.get('/products/?admin=1');
  return res.data.results || res.data || [];
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildSystemPrompt(categories, products) {
  return `You are Bel's Haven AI Store Assistant. You help the store owner manage her online shop effortlessly.

The store is called "Bel's Haven" - a luxury Ghanaian e-commerce store selling fashion, beauty, accessories, and general goods. Currency is GHS (Ghana Cedis).

CURRENT STORE DATA:
Categories: ${JSON.stringify(categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })))}
Products (slugs): ${JSON.stringify(products.map((p) => ({ name: p.name, slug: p.slug, type: p.product_type, price: p.price })))}

YOUR CAPABILITIES:
You can create products, update products, and answer questions about the store.

When the owner gives you product info (with or without images), respond with a JSON action block like this:

\`\`\`json
{
  "actions": [
    {
      "type": "create_product",
      "data": {
        "name": "Product Name",
        "slug": "product-name",
        "description": "Full description here",
        "price": "150.00",
        "product_type": "available",
        "stock_quantity": 10,
        "delivery_timeframe": "3-5 business days",
        "shipping_fee": "20.00",
        "status": "active",
        "is_featured": false,
        "category": <category_id_number_or_null>,
        "image_index": 0
      }
    }
  ],
  "message": "Your friendly explanation of what you're doing"
}
\`\`\`

For preorder products use:
- "product_type": "preorder"
- "preorder_eta": "4-6 weeks"
- "preorder_shipping_fee": "30.00"
- Remove "shipping_fee" and "delivery_timeframe"

For updates use:
\`\`\`json
{
  "actions": [{ "type": "update_product", "slug": "existing-slug", "data": { "price": "200.00" } }],
  "message": "Updated price for X"
}
\`\`\`

image_index refers to which uploaded image to use (0 = first image, 1 = second, etc). If no images uploaded, omit image_index.

RULES:
- Always respond with valid JSON in the \`\`\`json block PLUS a friendly "message" field
- If no action needed (just a question), return: {"actions": [], "message": "your answer"}
- Slugs must be lowercase, hyphens only, no spaces
- Be warm, friendly and supportive - she's a small business owner!
- If something is unclear, ask for clarification in the message field with empty actions
- Infer product type from context: "preorder", "coming soon", "not yet available" = preorder
- If she pastes multiple products at once, create multiple actions`;
}

export default function AiAssistantTab() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: null,
      parsed: {
        actions: [],
        message: 'Hi! I\'m your store assistant. You can drop product images here, paste descriptions and prices, and I\'ll create everything for you automatically. You can also ask me to make changes like *"update the price of the silk dress to GHS 200"* or *"mark the ankara bag as a preorder"*. What would you like to do?',
      },
      status: null,
    }
  ]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchCategories().then(setCategories);
    fetchProducts().then(setProducts);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleFiles = (files) => {
    const newImgs = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({ file: f, preview: URL.createObjectURL(f), name: f.name }));
    setImages((prev) => [...prev, ...newImgs]);
  };

  const removeImage = (i) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const addMessage = (role, content, parsed, status, imgs = []) => {
    setMessages((prev) => [...prev, { role, content, parsed, status, images: imgs, id: Date.now() }]);
  };

  const executeActions = async (actions, uploadedImages, msgId) => {
    const results = [];

    for (const action of actions) {
      try {
        if (action.type === 'create_product') {
          const productData = { ...action.data };
          const imageIndex = productData.image_index;
          delete productData.image_index;

          if (typeof imageIndex === 'number' && uploadedImages[imageIndex]) {
            const imageId = await uploadImage(uploadedImages[imageIndex].file);
            productData.images = [imageId];
          }

          const created = await createProduct(productData);
          results.push({ action: 'created', name: created.name || productData.name, success: true });
        } else if (action.type === 'update_product') {
          const updated = await updateProductBySlug(action.slug, action.data);
          results.push({ action: 'updated', name: updated.name || action.slug, success: true });
        }
      } catch (err) {
        results.push({ action: action.type, name: action.data?.name || action.slug, success: false, error: err.message });
      }
    }

    setMessages((prev) => prev.map((m) => {
      if (m.id === msgId) return { ...m, status: 'done', results };
      return m;
    }));
  };

  const send = async () => {
    if (!input.trim() && images.length === 0) return;
    if (!GROQ_API_KEY) {
      addMessage('assistant', null, { actions: [], message: 'No Groq API key found. Please add REACT_APP_GROQ_API_KEY to your .env file and restart.' }, null);
      return;
    }

    const userText = input.trim();
    const userImages = [...images];
    setInput('');
    setImages([]);
    setLoading(true);
    addMessage('user', userText, null, null, userImages);

    try {
      const contentParts = [];

      if (userText) contentParts.push({ type: 'text', text: userText });

      for (let i = 0; i < userImages.length; i += 1) {
        const b64 = await fileToBase64(userImages[i].file);
        contentParts.push({
          type: 'image_url',
          image_url: { url: `data:${userImages[i].file.type};base64,${b64}` },
        });
        contentParts.push({ type: 'text', text: `[Image ${i}: ${userImages[i].name}]` });
      }

      if (contentParts.length === 0) return;

      const systemPrompt = buildSystemPrompt(categories, products);
      const newHistory = [...history, { role: 'user', content: contentParts }];

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...newHistory,
          ],
          temperature: 0.3,
          max_tokens: 4096,
        }),
      });

      if (!groqRes.ok) {
        const err = await groqRes.json();
        throw new Error(err.error?.message || 'Groq API error');
      }

      const groqData = await groqRes.json();
      const rawContent = groqData.choices[0].message.content;

      let parsed = { actions: [], message: rawContent };
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1]);
        } catch {
          parsed = { actions: [], message: rawContent };
        }
      }

      setHistory([...newHistory, { role: 'assistant', content: rawContent }]);

      const msgId = Date.now();
      addMessage('assistant', rawContent, parsed, 'pending');

      if (parsed.actions && parsed.actions.length > 0) {
        await executeActions(parsed.actions, userImages, msgId);
        fetchProducts().then(setProducts);
        fetchCategories().then(setCategories);
      }
    } catch (err) {
      addMessage('assistant', null, {
        actions: [],
        message: `Sorry, something went wrong: ${err.message}. Please try again.`,
      }, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="ai-tab">
      <div className="ai-tab__header">
        <div className="ai-tab__title">
          <Sparkles size={20} className="ai-tab__icon" />
          <div>
            <h2>AI Store Assistant</h2>
            <p>Dump your product images and details - I&apos;ll handle the rest</p>
          </div>
        </div>
        <div className="ai-tab__model">
          <span>Powered by Groq</span>
        </div>
      </div>

      <div className="ai-messages">
        {messages.map((msg, i) => (
          <ChatMessage key={msg.id || i} msg={msg} />
        ))}
        {loading && (
          <div className="ai-message ai-message--assistant">
            <div className="ai-bubble ai-bubble--thinking">
              <Loader size={14} className="spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {images.length > 0 && (
        <div className="ai-image-strip">
          {images.map((img, i) => (
            <div key={i} className="ai-image-chip">
              <img src={img.preview} alt={img.name} />
              <button onClick={() => removeImage(i)}><X size={10} /></button>
            </div>
          ))}
        </div>
      )}

      <div
        className="ai-input-area"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <button
          className="ai-upload-btn"
          onClick={() => fileRef.current?.click()}
          title="Upload product images"
        >
          <Upload size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <textarea
          className="ai-input"
          placeholder={images.length > 0
            ? 'Add product details: name, price, description, stock...'
            : 'Describe products, paste details, or ask me to make changes... (drag & drop images here)'
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
        <button
          className={`ai-send-btn ${(input.trim() || images.length > 0) && !loading ? 'active' : ''}`}
          onClick={send}
          disabled={loading || (!input.trim() && images.length === 0)}
        >
          <Send size={18} />
        </button>
      </div>
      <p className="ai-hint">Press Enter to send | Shift+Enter for new line | Drag & drop images directly</p>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="ai-message ai-message--user">
        <div className="ai-bubble ai-bubble--user">
          {msg.images?.length > 0 && (
            <div className="ai-bubble__images">
              {msg.images.map((img, i) => (
                <img key={i} src={img.preview} alt={img.name} />
              ))}
            </div>
          )}
          {msg.content && <p>{msg.content}</p>}
        </div>
      </div>
    );
  }

  const parsed = msg.parsed;
  const hasActions = parsed?.actions?.length > 0;

  return (
    <div className="ai-message ai-message--assistant">
      <div className="ai-avatar">
        <Sparkles size={14} />
      </div>
      <div className="ai-bubble ai-bubble--assistant">
        <p className="ai-bubble__text">{parsed?.message}</p>

        {hasActions && (
          <div className="ai-actions-list">
            {parsed.actions.map((action, i) => {
              const result = msg.results?.[i];
              return (
                <div key={i} className={`ai-action-card ${result ? (result.success ? 'success' : 'error') : 'pending'}`}>
                  <div className="ai-action-card__icon">
                    {!result && <Package size={14} />}
                    {result?.success && <Check size={14} />}
                    {result && !result.success && <AlertCircle size={14} />}
                  </div>
                  <div className="ai-action-card__info">
                    <span className="ai-action-card__type">
                      {action.type === 'create_product' ? 'Create Product' : 'Update Product'}
                    </span>
                    <span className="ai-action-card__name">
                      {action.data?.name || action.slug}
                      {action.data?.price && ` - GHS ${action.data.price}`}
                    </span>
                    {result && !result.success && (
                      <span className="ai-action-card__error">{result.error}</span>
                    )}
                  </div>
                  <div className="ai-action-card__status">
                    {!result && <span className="status-dot status-dot--pending" />}
                    {result?.success && <span className="status-text success">Done</span>}
                    {result && !result.success && <span className="status-text error">Failed</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
