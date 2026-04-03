import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  // ── STATE ──
  const [activePanel, setActivePanel] = useState('health');
  const [clock, setClock] = useState('');
  const [toasts, setToasts] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState('user-' + Math.random().toString(36).slice(2, 7));
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  
  // Form states
  const [inboundForm, setInboundForm] = useState({
    item: '', qty: '', cat: '', price: '', reorder: '', email: ''
  });
  const [outboundForm, setOutboundForm] = useState({ item: '', qty: '' });
  const [ibResponse, setIbResponse] = useState(null);
  const [obResponse, setObResponse] = useState(null);
  const [hcResults, setHcResults] = useState(null);
  const [loading, setLoading] = useState({ hc: false, ib: false, ob: false });

  const chatEndRef = useRef(null);
  
  // ── UPDATED ENDPOINT ──
  const N8N_URL = 'https://codinplus30.app.n8n.cloud/webhook/warehouse';

  // ── CLOCK ──
  useEffect(() => {
    const updateClock = () => {
      setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── SCROLL TO BOTTOM CHAT ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);

  // ── TOAST SYSTEM ──
  const toast = (type, title, msg) => {
    const id = Date.now();
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    setToasts(prev => [...prev, { id, type, title, msg, icon: icons[type] || '📢' }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // ── API CALL ──
  const callN8N = async (payload) => {
    const res = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  // ── PRETTY JSON RENDERER ──
  const prettyJSON = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"([^"]+)":/g, '<span class="text-[#4d9fff]">"$1":</span>')
      .replace(/: "([^"]*)"/g, ': <span class="text-[#ffcc00]">"$1"</span>')
      .replace(/: (\d+\.?\d*)/g, ': <span class="text-[#00ff88]">$1</span>')
      .replace(/: (true|false)/g, ': <span class="text-[#ff6b35]">$1</span>');
  };

  const formatLabel = (key) =>
    key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, char => char.toUpperCase());

  const formatResponseValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (Array.isArray(value)) return value.join(', ') || 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const renderInboundResponse = () => {
    if (!ibResponse) return null;

    if (typeof ibResponse === 'string') {
      return (
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#e8e8f0]">Inbound Response</div>
          <p className="mt-3 text-[13px] leading-relaxed text-[#c7c9d3]">{ibResponse}</p>
        </div>
      );
    }

    const preferredOrder = [
      'item_name',
      'quantity',
      'category',
      'price',
      'reorder_point',
      'supplier_email',
      'current_stock',
      'new_stock',
      'stock_level',
      'total_value'
    ];

    const entries = Object.entries(ibResponse);
    const primaryEntries = preferredOrder
      .filter(key => key in ibResponse)
      .map(key => [key, ibResponse[key]]);
    const usedKeys = new Set([
      'status',
      'message',
      ...primaryEntries.map(([key]) => key)
    ]);
    const extraEntries = entries.filter(([key]) => !usedKeys.has(key));

    return (
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#666680]" style={{ fontFamily: "'Space Mono', monospace" }}>
              Inbound Response
            </div>
            <div className="mt-2 text-base font-semibold text-[#e8e8f0]">
              {ibResponse.message || 'Inventory update received'}
            </div>
          </div>
          {ibResponse.status && (
            <Badge
              type={
                ibResponse.status === 'success'
                  ? 'success'
                  : ibResponse.status === 'warning'
                    ? 'warn'
                    : ibResponse.status === 'error'
                      ? 'danger'
                      : 'info'
              }
            >
              {String(ibResponse.status).toUpperCase()}
            </Badge>
          )}
        </div>

        {primaryEntries.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {primaryEntries.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-[#2a2a3a] bg-[#1a1a24] px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#666680]" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {formatLabel(key)}
                </div>
                <div className="mt-1 text-sm font-semibold text-[#e8e8f0] break-words">
                  {formatResponseValue(value)}
                </div>
              </div>
            ))}
          </div>
        )}

        {extraEntries.length > 0 && (
          <div className="rounded-xl border border-[#2a2a3a] bg-[#1a1a24] p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#666680]" style={{ fontFamily: "'Space Mono', monospace" }}>
              Additional Details
            </div>
            <div className="mt-3 grid gap-3">
              {extraEntries.map(([key, value]) => (
                <div key={key} className="border-b border-[#2a2a3a] pb-3 last:border-b-0 last:pb-0">
                  <div className="text-[12px] font-semibold text-[#4d9fff]">{formatLabel(key)}</div>
                  <div className="mt-1 text-[13px] whitespace-pre-wrap break-words text-[#c7c9d3]">
                    {formatResponseValue(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOutboundResponse = () => {
    if (!obResponse) return null;

    if (typeof obResponse === 'string') {
      return (
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5">
          <div className="text-sm font-semibold text-[#e8e8f0]">Outbound Response</div>
          <p className="mt-3 text-[13px] leading-relaxed text-[#c7c9d3]">{obResponse}</p>
        </div>
      );
    }

    const preferredOrder = [
      'item_name',
      'quantity',
      'requested_quantity',
      'withdrawn_quantity',
      'stock_level',
      'remaining_stock',
      'reorder_point',
      'shortage',
      'category',
      'supplier_email'
    ];

    const entries = Object.entries(obResponse);
    const primaryEntries = preferredOrder
      .filter(key => key in obResponse)
      .map(key => [key, obResponse[key]]);
    const usedKeys = new Set([
      'status',
      'message',
      ...primaryEntries.map(([key]) => key)
    ]);
    const extraEntries = entries.filter(([key]) => !usedKeys.has(key));

    return (
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#666680]" style={{ fontFamily: "'Space Mono', monospace" }}>
              Outbound Response
            </div>
            <div className="mt-2 text-base font-semibold text-[#e8e8f0]">
              {obResponse.message || 'Stock withdrawal processed'}
            </div>
          </div>
          {obResponse.status && (
            <Badge
              type={
                obResponse.status === 'success'
                  ? 'success'
                  : obResponse.status === 'warning'
                    ? 'warn'
                    : obResponse.status === 'error'
                      ? 'danger'
                      : 'info'
              }
            >
              {String(obResponse.status).toUpperCase()}
            </Badge>
          )}
        </div>

        {primaryEntries.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {primaryEntries.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-[#2a2a3a] bg-[#1a1a24] px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#666680]" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {formatLabel(key)}
                </div>
                <div className="mt-1 text-sm font-semibold text-[#e8e8f0] break-words">
                  {formatResponseValue(value)}
                </div>
              </div>
            ))}
          </div>
        )}

        {extraEntries.length > 0 && (
          <div className="rounded-xl border border-[#2a2a3a] bg-[#1a1a24] p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#666680]" style={{ fontFamily: "'Space Mono', monospace" }}>
              Additional Details
            </div>
            <div className="mt-3 grid gap-3">
              {extraEntries.map(([key, value]) => (
                <div key={key} className="border-b border-[#2a2a3a] pb-3 last:border-b-0 last:pb-0">
                  <div className="text-[12px] font-semibold text-[#4d9fff]">{formatLabel(key)}</div>
                  <div className="mt-1 text-[13px] whitespace-pre-wrap break-words text-[#c7c9d3]">
                    {formatResponseValue(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── HEALTH CHECK ──
  const runHealthCheck = async () => {
    setLoading(prev => ({ ...prev, hc: true }));
    setHcResults(null);
    try {
      const data = await callN8N({ action: 'health_check' });
      const items = data.low_stock_items || data.items || data || [];
      const arr = Array.isArray(items) ? items : [];
      setHcResults(arr);
      if (arr.length === 0) {
        toast('success', 'Health Check', 'All inventory levels are healthy.');
      } else {
        toast('warning', 'Health Check', `${arr.length} item(s) need reordering.`);
      }
    } catch (e) {
      toast('error', 'Health Check Failed', e.message);
    }
    setLoading(prev => ({ ...prev, hc: false }));
  };

  // ── INBOUND ──
  const runInbound = async () => {
    const { item, qty, cat, price, reorder, email } = inboundForm;
    if (!item.trim() || !qty) {
      return toast('warning', 'Missing Fields', 'Item name and quantity are required.');
    }

    setLoading(prev => ({ ...prev, ib: true }));
    try {
      const payload = {
        action: 'inbound',
        item_name: item.trim(),
        quantity: parseFloat(qty),
        category: cat.trim() || 'Uncategorized',
        price: parseFloat(price) || 0,
        reorder_point: parseFloat(reorder) || 10,
        supplier_email: email.trim() || ''
      };
      const data = await callN8N(payload);
      setIbResponse(data);
      if (data.status === 'success' || data.message) {
        toast('success', 'Inbound Complete', data.message || `Added ${qty} × ${item}`);
      } else {
        toast('info', 'Response Received', 'Check the response block below.');
      }
    } catch (e) {
      toast('error', 'Inbound Failed', e.message);
    }
    setLoading(prev => ({ ...prev, ib: false }));
  };

  const clearInbound = () => {
    setInboundForm({ item: '', qty: '', cat: '', price: '', reorder: '', email: '' });
    setIbResponse(null);
  };

  // ── OUTBOUND ──
  const runOutbound = async (preItem, preQty) => {
    const item = preItem || outboundForm.item;
    const qty = preQty || outboundForm.qty;
    
    if (!item?.trim() || !qty) {
      return toast('warning', 'Missing Fields', 'Item name and quantity are required.');
    }

    setLoading(prev => ({ ...prev, ob: true }));
    try {
      const data = await callN8N({ action: 'outbound', item_name: item.trim(), quantity: parseFloat(qty) });
      setObResponse(data);

      if (data.status === 'success') {
        toast('success', 'Outbound Complete', data.message || `Withdrew ${qty} × ${item}`);
      } else if (data.status === 'warning') {
        toast('warning', 'Low Stock Alert', data.message || 'Stock fell below reorder point.');
      } else if (data.status === 'error') {
        toast('error', 'Outbound Blocked', data.message || 'Insufficient stock.');
      } else {
        toast('info', 'Response Received', 'Check the response block below.');
      }
    } catch (e) {
      toast('error', 'Outbound Failed', e.message);
    }
    setLoading(prev => ({ ...prev, ob: false }));
  };

  const quickOutbound = (item, qty) => {
    setOutboundForm({ item, qty: qty.toString() });
    runOutbound(item, qty);
  };

  const clearOutbound = () => {
    setOutboundForm({ item: '', qty: '' });
    setObResponse(null);
  };

  // ── CHAT ──
  const sendChat = async (suggestionMsg) => {
    const message = suggestionMsg || chatInput;
    if (!message.trim() || isChatLoading) return;

    setIsChatLoading(true);
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: message }]);
    setShowTyping(true);

    try {
      const data = await callN8N({ action: 'chat', message, session_id: chatSessionId });
      setShowTyping(false);
      const reply = data.response || data.output || data.message || data.text || (typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      setMessages(prev => [...prev, { role: 'agent', text: reply }]);
    } catch (e) {
      setShowTyping(false);
      setMessages(prev => [...prev, { role: 'agent', text: `⚠️ Error: ${e.message}` }]);
      toast('error', 'Chat Error', e.message);
    }
    setIsChatLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    setChatSessionId('user-' + Math.random().toString(36).slice(2, 7));
  };

  const handleChatKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  // ── RENDER HELPERS ──
  const NavItem = ({ id, icon, label }) => (
    <button
      onClick={() => setActivePanel(id)}
      className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-all duration-200 border-l-[3px] text-[13px] font-medium ${
        activePanel === id 
          ? 'text-[#00ff88] border-l-[#00ff88] bg-[rgba(0,255,136,0.05)]' 
          : 'text-[#666680] border-l-transparent hover:text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.03)]'
      }`}
    >
      <span className="text-[16px] w-5 text-center">{icon}</span>
      {label}
    </button>
  );

  const Badge = ({ type, children }) => {
    const styles = {
      success: 'bg-[rgba(0,255,136,0.15)] text-[#00ff88] border-[rgba(0,255,136,0.2)]',
      danger: 'bg-[rgba(255,68,85,0.15)] text-[#ff4455] border-[rgba(255,68,85,0.2)]',
      warn: 'bg-[rgba(255,204,0,0.15)] text-[#ffcc00] border-[rgba(255,204,0,0.2)]',
      info: 'bg-[rgba(77,159,255,0.15)] text-[#4d9fff] border-[rgba(77,159,255,0.2)]'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-bold tracking-wider border ${styles[type]}`}>
        {children}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] font-sans overflow-x-hidden relative" style={{ fontFamily: "'Syne', sans-serif" }}>
      {/* Grid noise overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Glow orb */}
      <div className="fixed -top-[200px] -left-[200px] w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)' }}
      />

      {/* ── HEADER ── */}
      <header className="relative z-10 flex items-center justify-between px-10 py-5 border-b border-[#2a2a3a] bg-[rgba(10,10,15,0.8)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#00ff88] animate-pulse"
            style={{ 
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              filter: 'drop-shadow(0 0 12px rgba(0,255,136,0.5))',
              animation: 'pulse-glow 3s ease-in-out infinite'
            }}
          />
          <div>
            <div className="text-[13px] font-bold tracking-[0.2em] uppercase text-[#00ff88]">GlobalLogistics</div>
            <div className="font-mono text-[10px] text-[#666680] tracking-[0.15em]" style={{ fontFamily: "'Space Mono', monospace" }}>Warehouse OS v2.0</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#666680]" style={{ fontFamily: "'Space Mono', monospace" }}>
          <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" style={{ animation: 'blink 2s ease-in-out infinite' }} />
          <span>n8n CONNECTED</span>
          <span className="mx-2 text-[#2a2a3a]">|</span>
          <span className="text-[10px]">{clock}</span>
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div className="relative z-[1] grid grid-cols-[220px_1fr_380px] h-[calc(100vh-81px)]">
        
        {/* ── SIDEBAR ── */}
        <nav className="border-r border-[#2a2a3a] py-8 flex flex-col gap-1 bg-[rgba(17,17,24,0.5)]">
          <div className="font-mono text-[9px] tracking-[0.2em] text-[#666680] uppercase px-6 pb-3" style={{ fontFamily: "'Space Mono', monospace" }}>Operations</div>
          <NavItem id="health" icon="📊" label="Health Check" />
          <NavItem id="inbound" icon="📥" label="Inbound" />
          <NavItem id="outbound" icon="📤" label="Outbound" />
          <div className="h-px bg-[#2a2a3a] my-4 mx-6" />
          <div className="font-mono text-[9px] tracking-[0.2em] text-[#666680] uppercase px-6 pb-3" style={{ fontFamily: "'Space Mono', monospace" }}>Info</div>
          <NavItem id="about" icon="ℹ️" label="Endpoints" />
        </nav>

        {/* ── MAIN CONTENT ── */}
        <main className="overflow-y-auto p-8 flex flex-col gap-6">
          
          {/* HEALTH CHECK PANEL */}
          {activePanel === 'health' && (
            <div className="flex flex-col gap-5 animate-[fadeIn_0.3s_ease]">
              <div className="flex items-center gap-3 text-[22px] font-extrabold tracking-tight">
                Health Check <span className="font-mono text-[11px] text-[#666680] font-normal tracking-wider bg-[#1a1a24] px-2.5 py-1 rounded-full border border-[#2a2a3a]" style={{ fontFamily: "'Space Mono', monospace" }}>STOCK MONITOR</span>
              </div>

              <div className="flex items-center justify-between bg-[#111118] border border-[#2a2a3a] rounded-xl p-6">
                <div>
                  <h3 className="text-base font-bold mb-1">Low Stock Scan</h3>
                  <p className="text-[13px] text-[#666680]">Identifies items where stock level falls below reorder point</p>
                </div>
                <button 
                  onClick={runHealthCheck}
                  disabled={loading.hc}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[13px] tracking-wide bg-[#00ff88] text-[#0a0a0f] hover:bg-[#00ffaa] hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading.hc && <span className="w-3.5 h-3.5 border-2 border-[rgba(0,0,0,0.2)] border-t-current rounded-full animate-spin" />}
                  {loading.hc ? 'Scanning…' : 'Run Scan'}
                </button>
              </div>

              <div>
                {hcResults && hcResults.length === 0 && (
                  <div className="text-center py-12 text-[#666680]">
                    <div className="text-[40px] mb-3">✅</div>
                    <h3 className="text-base text-[#e8e8f0] font-semibold mb-1.5">All stock levels healthy</h3>
                    <p className="text-[13px]">No items are below their reorder points.</p>
                  </div>
                )}
                
                {hcResults && hcResults.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[13px] text-[#666680]">{hcResults.length} item(s) below reorder point</div>
                      <Badge type="warn">{hcResults.length} ALERT{hcResults.length > 1 ? 'S' : ''}</Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      {hcResults.map((item, i) => (
                        <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 bg-[#111118] border border-[#2a2a3a] rounded-xl px-5 py-3.5 hover:border-[rgba(255,204,0,0.3)] transition-all animate-[slideIn_0.3s_ease_forwards]" style={{ animationDelay: `${i * 60}ms` }}>
                          <div>
                            <div className="text-sm font-semibold">{item.item_name || item.name || '—'}</div>
                            <div className="text-[11px] font-mono text-[#666680] mt-0.5" style={{ fontFamily: "'Space Mono', monospace" }}>{item.category || '—'}</div>
                          </div>
                          <div className="font-mono text-[13px] text-right" style={{ fontFamily: "'Space Mono', monospace" }}>
                            <div className="text-[#ff4455]">{item.stock_level ?? '?'} units</div>
                            <div className="text-[10px] text-[#666680]">min {item.reorder_point ?? '?'}</div>
                          </div>
                          <span className="font-mono text-xs text-[#ff4455] bg-[rgba(255,68,85,0.1)] px-2.5 py-1 rounded-full border border-[rgba(255,68,85,0.2)]" style={{ fontFamily: "'Space Mono', monospace" }}>
                            -{item.shortage ?? Math.max(0, (item.reorder_point || 0) - (item.stock_level || 0))}
                          </span>
                          <div className="font-mono text-[11px] text-[#4d9fff]" style={{ fontFamily: "'Space Mono', monospace" }}>{item.supplier_email || ''}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* INBOUND PANEL */}
          {activePanel === 'inbound' && (
            <div className="flex flex-col gap-5 animate-[fadeIn_0.3s_ease]">
              <div className="flex items-center gap-3 text-[22px] font-extrabold tracking-tight">
                Inbound <span className="font-mono text-[11px] text-[#666680] font-normal tracking-wider bg-[#1a1a24] px-2.5 py-1 rounded-full border border-[#2a2a3a]" style={{ fontFamily: "'Space Mono', monospace" }}>ADD STOCK</span>
              </div>

              <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6 hover:border-[rgba(0,255,136,0.2)] transition-colors">
                <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#666680] mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>Stock Receipt</div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-[#666680] tracking-wider uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>Item Name</label>
                    <input 
                      type="text" 
                      value={inboundForm.item}
                      onChange={e => setInboundForm({...inboundForm, item: e.target.value})}
                      placeholder="e.g. X-1000 Power Processor"
                      className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm px-3.5 py-2.5 outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all placeholder:text-[#666680]"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-[#666680] tracking-wider uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>Quantity</label>
                    <input 
                      type="number" 
                      value={inboundForm.qty}
                      onChange={e => setInboundForm({...inboundForm, qty: e.target.value})}
                      placeholder="10" 
                      min="1"
                      className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm px-3.5 py-2.5 outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all placeholder:text-[#666680]"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-[#666680] tracking-wider uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>Category</label>
                    <input 
                      type="text" 
                      value={inboundForm.cat}
                      onChange={e => setInboundForm({...inboundForm, cat: e.target.value})}
                      placeholder="Electronics"
                      className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm px-3.5 py-2.5 outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all placeholder:text-[#666680]"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-[#666680] tracking-wider uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>Price (per unit)</label>
                    <input 
                      type="number" 
                      value={inboundForm.price}
                      onChange={e => setInboundForm({...inboundForm, price: e.target.value})}
                      placeholder="0.00" 
                      step="0.01"
                      className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm px-3.5 py-2.5 outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all placeholder:text-[#666680]"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-[#666680] tracking-wider uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>Reorder Point</label>
                    <input 
                      type="number" 
                      value={inboundForm.reorder}
                      onChange={e => setInboundForm({...inboundForm, reorder: e.target.value})}
                      placeholder="10" 
                      min="0"
                      className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm px-3.5 py-2.5 outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all placeholder:text-[#666680]"
                    />
                  </div>
                  
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-[#666680] tracking-wider uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>Supplier Email</label>
                    <input 
                      type="email" 
                      value={inboundForm.email}
                      onChange={e => setInboundForm({...inboundForm, email: e.target.value})}
                      placeholder="supplier@example.com"
                      className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm px-3.5 py-2.5 outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all placeholder:text-[#666680]"
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2.5">
                  <button 
                    onClick={runInbound}
                    disabled={loading.ib}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[13px] tracking-wide bg-[#00ff88] text-[#0a0a0f] hover:bg-[#00ffaa] hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading.ib && <span className="w-3.5 h-3.5 border-2 border-[rgba(0,0,0,0.2)] border-t-current rounded-full animate-spin" />}
                    ＋ Add to Inventory
                  </button>
                  <button onClick={clearInbound} className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-[#666680] border border-[#2a2a3a] hover:text-[#e8e8f0] hover:border-[#e8e8f0] transition-all bg-transparent">Clear</button>
                </div>
              </div>

              {ibResponse && renderInboundResponse()}
            </div>
          )}

          {/* OUTBOUND PANEL */}
          {activePanel === 'outbound' && (
            <div className="flex flex-col gap-5 animate-[fadeIn_0.3s_ease]">
              <div className="flex items-center gap-3 text-[22px] font-extrabold tracking-tight">
                Outbound <span className="font-mono text-[11px] text-[#666680] font-normal tracking-wider bg-[#1a1a24] px-2.5 py-1 rounded-full border border-[#2a2a3a]" style={{ fontFamily: "'Space Mono', monospace" }}>WITHDRAW STOCK</span>
              </div>

              <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6 hover:border-[rgba(0,255,136,0.2)] transition-colors">
                <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#666680] mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>Stock Withdrawal</div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-[#666680] tracking-wider uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>Item Name</label>
                    <input 
                      type="text" 
                      value={outboundForm.item}
                      onChange={e => setOutboundForm({...outboundForm, item: e.target.value})}
                      placeholder="e.g. Cat6 Ethernet Cable 50m"
                      className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm px-3.5 py-2.5 outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all placeholder:text-[#666680]"
                    />
                  </div>
                  
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-[#666680] tracking-wider uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>Quantity to Withdraw</label>
                    <input 
                      type="number" 
                      value={outboundForm.qty}
                      onChange={e => setOutboundForm({...outboundForm, qty: e.target.value})}
                      placeholder="1" 
                      min="1"
                      className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm px-3.5 py-2.5 outline-none focus:border-[#00ff88] focus:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all placeholder:text-[#666680]"
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2.5">
                  <button 
                    onClick={() => runOutbound()}
                    disabled={loading.ob}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[13px] tracking-wide bg-[#ff6b35] text-white hover:bg-[#ff8555] hover:shadow-[0_0_20px_rgba(255,107,53,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading.ob && <span className="w-3.5 h-3.5 border-2 border-[rgba(0,0,0,0.2)] border-t-current rounded-full animate-spin" />}
                    ➖ Withdraw Stock
                  </button>
                  <button onClick={clearOutbound} className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-[#666680] border border-[#2a2a3a] hover:text-[#e8e8f0] hover:border-[#e8e8f0] transition-all bg-transparent">Clear</button>
                </div>
              </div>

              {obResponse && renderOutboundResponse()}

              <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6">
                <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#666680] mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>Quick Test — Known Items</div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => quickOutbound('Cat6 Ethernet Cable 50m', 1)} className="px-3 py-2 rounded-lg text-xs font-semibold text-[#666680] border border-[#2a2a3a] hover:text-[#e8e8f0] hover:border-[#e8e8f0] transition-all bg-transparent">Cat6 Cable ×1</button>
                  <button onClick={() => quickOutbound('Industrial Grade Sensor', 1)} className="px-3 py-2 rounded-lg text-xs font-semibold text-[#666680] border border-[#2a2a3a] hover:text-[#e8e8f0] hover:border-[#e8e8f0] transition-all bg-transparent">Sensor ×1</button>
                  <button onClick={() => quickOutbound('UPS Battery Pack', 1)} className="px-3 py-2 rounded-lg text-xs font-semibold text-[#666680] border border-[#2a2a3a] hover:text-[#e8e8f0] hover:border-[#e8e8f0] transition-all bg-transparent">UPS Pack ×1</button>
                  <button onClick={() => quickOutbound('Secure Cloud Hub', 999)} className="px-3 py-2 rounded-lg text-xs font-semibold text-[#ff4455] border border-[#ff4455] hover:bg-[rgba(255,68,85,0.1)] transition-all bg-transparent">Cloud Hub ×999 ⚠️</button>
                </div>
              </div>
            </div>
          )}

          {/* ABOUT PANEL */}
          {activePanel === 'about' && (
            <div className="flex flex-col gap-5 animate-[fadeIn_0.3s_ease]">
              <div className="flex items-center gap-3 text-[22px] font-extrabold tracking-tight">
                Endpoints <span className="font-mono text-[11px] text-[#666680] font-normal tracking-wider bg-[#1a1a24] px-2.5 py-1 rounded-full border border-[#2a2a3a]" style={{ fontFamily: "'Space Mono', monospace" }}>CONFIG</span>
              </div>

              <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6">
                <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#666680] mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>n8n Webhook</div>
                <div className="font-mono text-xs text-[#00ff88] break-all mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {N8N_URL}
                </div>
                <div className="text-[13px] text-[#666680] leading-relaxed">
                  All requests are POST with JSON body. The <code className="text-[#4d9fff] bg-[#1a1a24] px-1.5 py-0.5 rounded text-[11px]">action</code> field routes to the correct workflow branch.
                </div>
                
                <div className="mt-4 flex flex-col gap-2">
                  <div className="font-mono text-[11px] p-2.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a]" style={{ fontFamily: "'Space Mono', monospace" }}>
                    <span className="text-[#666680]">// Health Check</span><br/>
                    {'{ "action": "health_check" }'}
                  </div>
                  <div className="font-mono text-[11px] p-2.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a]" style={{ fontFamily: "'Space Mono', monospace" }}>
                    <span className="text-[#666680]">// Inbound</span><br/>
                    {'{ "action": "inbound", "item_name": "...", "quantity": 10, ... }'}
                  </div>
                  <div className="font-mono text-[11px] p-2.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a]" style={{ fontFamily: "'Space Mono', monospace" }}>
                    <span className="text-[#666680]">// Outbound</span><br/>
                    {'{ "action": "outbound", "item_name": "...", "quantity": 1 }'}
                  </div>
                  <div className="font-mono text-[11px] p-2.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a]" style={{ fontFamily: "'Space Mono', monospace" }}>
                    <span className="text-[#666680]">// Chat</span><br/>
                    {'{ "action": "chat", "message": "...", "session_id": "user-1" }'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── CHAT PANEL ── */}
        <aside className="border-l border-[#2a2a3a] flex flex-col bg-[rgba(17,17,24,0.5)] h-full">
          <div className="px-6 py-5 border-b border-[#2a2a3a] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4d9fff] to-[#00ff88] flex items-center justify-center text-sm">🤖</div>
            <div className="flex-1">
              <div className="text-sm font-bold">Warehouse AI</div>
              <div className="text-[11px] text-[#666680] font-mono" style={{ fontFamily: "'Space Mono', monospace" }}>Operations Specialist</div>
            </div>
            <button onClick={clearChat} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#666680] border border-[#2a2a3a] hover:text-[#e8e8f0] hover:border-[#e8e8f0] transition-all bg-transparent">Clear</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[#666680] text-[13px] text-center px-5 py-10">
                <div className="text-[32px] mb-2">💬</div>
                <div className="font-semibold text-[#e8e8f0] text-[15px]">Ask me anything</div>
                <div className="text-xs">I have full access to inventory, order logs, and product manuals.</div>
                <div className="flex flex-col gap-1.5 mt-3 w-full">
                  <button onClick={() => sendChat('What items are low on stock?')} className="text-left px-3 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-xs text-[#666680] hover:border-[#00ff88] hover:text-[#e8e8f0] transition-all">📉 What items are low on stock?</button>
                  <button onClick={() => sendChat('When was the last outbound operation for the G-Pro Graphics Card?')} className="text-left px-3 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-xs text-[#666680] hover:border-[#00ff88] hover:text-[#e8e8f0] transition-all">🕒 Last outbound for G-Pro Graphics Card?</button>
                  <button onClick={() => sendChat('What does the manual say about the X-1000 Power Processor warranty?')} className="text-left px-3 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-xs text-[#666680] hover:border-[#00ff88] hover:text-[#e8e8f0] transition-all">📖 X-1000 warranty details?</button>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-[fadeIn_0.3s_ease]`}>
                  <div className="font-mono text-[9px] tracking-wider text-[#666680] uppercase px-1" style={{ fontFamily: "'Space Mono', monospace" }}>
                    {msg.role === 'user' ? 'You' : 'Warehouse AI'}
                  </div>
                  <div className={`max-w-[90%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#00ff88] text-[#0a0a0f] font-medium rounded-br-sm' 
                      : 'bg-[#1a1a24] border border-[#2a2a3a] text-[#e8e8f0] rounded-bl-sm'
                  }`}>
                    {msg.text.split('\n').map((line, j) => (
                      <span key={j}>{line}<br/></span>
                    ))}
                  </div>
                </div>
              ))
            )}
            
            {showTyping && (
              <div className="flex flex-col gap-1 items-start">
                <div className="font-mono text-[9px] tracking-wider text-[#666680] uppercase px-1" style={{ fontFamily: "'Space Mono', monospace" }}>Warehouse AI</div>
                <div className="flex gap-1 items-center px-3.5 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl rounded-bl-sm w-fit">
                  <div className="w-1.5 h-1.5 bg-[#666680] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#666680] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 bg-[#666680] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-[#2a2a3a] flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleChatKey}
                placeholder="Ask about inventory, logs, or manuals…"
                rows={1}
                className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-[#e8e8f0] text-[13px] px-3.5 py-2.5 outline-none resize-none focus:border-[#00ff88] transition-all placeholder:text-[#666680] min-h-[42px] max-h-[120px]"
                style={{ height: 'auto', overflow: 'hidden' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button 
              onClick={() => sendChat()}
              disabled={isChatLoading}
              className="w-[42px] h-[42px] bg-[#00ff88] text-[#0a0a0f] rounded-xl flex items-center justify-center hover:bg-[#00ffaa] hover:shadow-[0_0_16px_rgba(0,255,136,0.3)] transition-all disabled:opacity-40"
            >
              ➤
            </button>
          </div>
        </aside>
      </div>

      {/* ── TOAST CONTAINER ── */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`flex items-start gap-3 bg-[#111118] border border-[#2a2a3a] rounded-xl p-3.5 max-w-sm text-[13px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] animate-[toastIn_0.3s_ease] border-l-[3px] pointer-events-auto ${
              t.type === 'success' ? 'border-l-[#00ff88]' :
              t.type === 'error' ? 'border-l-[#ff4455]' :
              t.type === 'warning' ? 'border-l-[#ffcc00]' :
              'border-l-[#4d9fff]'
            }`}
          >
            <span className="text-base mt-0.5 flex-shrink-0">{t.icon}</span>
            <div className="flex-1">
              <div className="font-bold mb-0.5">{t.title}</div>
              <div className="text-[#666680] leading-snug">{t.msg}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Global styles for keyframes that Tailwind doesn't include by default */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3) drop-shadow(0 0 12px #00ff88); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default App;
