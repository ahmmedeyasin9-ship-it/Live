/**
 * 0X Premium Full Script (Zero-Flicker + Full Control Edition v2)
 * (Clean Top-5 Avatar & Plain Rank 4+ + Demo Always $1,000 + Popup Live Balance + Top Card Flag)
 */
(function () {
    'use strict';

    // --- 0. PERSISTENT CONFIG & STORAGE ---
    const STORAGE_KEY = 'qx_0x_panel_config_v2';
    const LEGACY_KEY = 'qx_0x_panel_config_v1';

    function formatNowDateTime() {
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    function generateTxId() {
        return String(Math.floor(10000000 + Math.random() * 90000000));
    }

    function loadConfig() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') return parsed;
            }
            // Migrate clean user settings from v1 (dropping old buggy cached green avatar & old demo spoof)
            const oldRaw = localStorage.getItem(LEGACY_KEY);
            if (oldRaw) {
                const oldParsed = JSON.parse(oldRaw);
                if (oldParsed && typeof oldParsed === 'object') {
                    return {
                        customName: oldParsed.customName || 'Trader Eyasin X',
                        country: oldParsed.country || 'Bangladesh',
                        startingCapital: oldParsed.startingCapital ?? null,
                        lastBalance: oldParsed.lastBalance ?? null,
                        spoofLiveBalance: oldParsed.spoofLiveBalance || '',
                        liveBalanceAnchor: oldParsed.liveBalanceAnchor ?? null,
                        spoofDemoBalance: '1000',
                        customAvatar: '',
                        gearPos: oldParsed.gearPos || { top: 8, right: 8 },
                        transactions: Array.isArray(oldParsed.transactions) ? oldParsed.transactions : undefined
                    };
                }
            }
        } catch (e) {}
        return null;
    }

    function saveConfig(cfg) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
        } catch (e) {}
    }

    const defaultConfig = {
        customName: 'Trader Eyasin X',
        country: 'Bangladesh',
        startingCapital: null,
        lastBalance: null,
        spoofLiveBalance: '',
        liveBalanceAnchor: null,
        spoofDemoBalance: '1000',
        customAvatar: '',
        gearPos: { top: 8, right: 8 },
        transactions: [
            { id: '48029950', type: 'Deposit', amount: 1000, method: 'Binance Pay', dateTime: formatNowDateTime() },
            { id: '25046931', type: 'Payout', amount: 3000, method: 'Binance Pay', dateTime: '19/11/2026, 23:28:15' },
            { id: '59438275', type: 'Deposit', amount: 300, method: 'Binance Pay', dateTime: '16/10/2026, 15:18:55' }
        ]
    };

    const panelConfig = Object.assign({}, defaultConfig, loadConfig() || {});
    if (!Array.isArray(panelConfig.transactions)) panelConfig.transactions = defaultConfig.transactions;
    if (String(panelConfig.spoofDemoBalance ?? '').trim() === '') panelConfig.spoofDemoBalance = '1000';
    saveConfig(panelConfig);

    if (window.qxCustomName === undefined) window.qxCustomName = panelConfig.customName;
    if (window.qxCustomCountry === undefined) window.qxCustomCountry = panelConfig.country;
    window.qxCustomAvatar = panelConfig.customAvatar || '';
    if (panelConfig.startingCapital !== null && panelConfig.startingCapital !== undefined) {
        window.qxCustomStartingCapital = String(panelConfig.startingCapital);
    }
    if (typeof panelConfig.lastBalance === 'number' && Number.isFinite(panelConfig.lastBalance)) {
        window.__qxLastValidBalance = panelConfig.lastBalance;
    }

    // --- 0.5 SHARED ZERO-FLICKER SANITIZER HELPERS ---
    function isProtectedNode(el, str) {
        if (typeof str === 'string' && /^\s*demo\s+account\s*$/i.test(str)) return true;
        if (!el) return false;
        const hostEl = el.nodeType === 1 ? el : el.parentElement;
        if (!hostEl || !hostEl.closest) return false;
        if (hostEl.closest('#qx-control-overlay, #qx-tx-overlay, #qx-gear-btn, #qx-toast, .qx-fake-tx-container, [data-qx-account="demo"]')) {
            return true;
        }
        const row = hostEl.closest('li[class*="RdTBn"], li, a, div[class*="account"]');
        if (row) {
            const text = row.textContent || '';
            if (/demo\s+account/i.test(text) && !/daily limit/i.test(text)) return true;
            if ((row.querySelector('svg[class*="edit"], svg[class*="pencil"], svg[class*="refresh"]') ||
                row.innerHTML?.includes('icon-pencil') ||
                row.innerHTML?.includes('icon-refresh')) && /account/i.test(text)) {
                return true;
            }
        }
        return false;
    }

    function sanitizeDemoText(str, el) {
        if (typeof str !== 'string' || !/demo/i.test(str)) return str;
        if (isProtectedNode(el, str)) return str;
        return str
            .replace(/demo-trade/gi, 'trade')
            .replace(/demo\s+trading/gi, 'Live trading')
            .replace(/demo\s+mode/gi, 'Live mode')
            .replace(/demo\s+balance/gi, 'Live balance')
            .replace(/\bdemo\b(?!\s*account)/gi, m => {
                if (m === m.toLowerCase()) return 'live';
                if (m === m.toUpperCase()) return 'LIVE';
                return 'Live';
            });
    }

    window.__zeroxShadowRoots = window.__zeroxShadowRoots || new Set();
    window.__zeroxShadowObservers = window.__zeroxShadowObservers || [];

    // --- 1. EARLY SHADOW ROOT INTERCEPTOR ---
    (function earlyShadowPatch() {
        try {
            if (typeof Element !== 'undefined' && !Element.prototype.__zeroxOrigAttach) {
                Element.prototype.__zeroxOrigAttach = Element.prototype.attachShadow;
                Element.prototype.attachShadow = function (init) {
                    const shadow = Element.prototype.__zeroxOrigAttach.call(this, { ...init, mode: 'open' });
                    this.__zeroxShadowRoot = shadow;
                    window.__zeroxShadowRoots.add(shadow);
                    if (typeof window.__zeroxAttachShadowGuard === 'function') {
                        window.__zeroxAttachShadowGuard(shadow);
                    }
                    return shadow;
                };
            }
        } catch (e) {}
    })();

    // --- 2. EARLY UNIVERSAL BACKGROUND DEMO WATERMARK INTERCEPTOR ---
    (function earlyPatch() {
        try {
            function patchCtx2d(ctx) {
                if (!ctx || ctx.__zeroxWatermarkBlocked) return;
                ctx.__zeroxWatermarkBlocked = true;

                const _s = ctx.stroke;
                ctx.stroke = function (path) {
                    if (this.globalAlpha > 0 && this.globalAlpha < 0.15) return;
                    return path ? _s.call(this, path) : _s.call(this);
                };

                const _f = ctx.fill;
                if (_f) {
                    ctx.fill = function (path) {
                        if (this.globalAlpha > 0 && this.globalAlpha < 0.15) return;
                        return path ? _f.call(this, path) : _f.call(this);
                    };
                }

                const _ft = ctx.fillText;
                if (_ft) {
                    ctx.fillText = function (text) {
                        if (typeof text === 'string' && /demo/i.test(text)) return;
                        return _ft.apply(this, arguments);
                    };
                }

                const _st = ctx.strokeText;
                if (_st) {
                    ctx.strokeText = function (text) {
                        if (typeof text === 'string' && /demo/i.test(text)) return;
                        return _st.apply(this, arguments);
                    };
                }
            }

            if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.__zeroxEarlyContextPatched) {
                HTMLCanvasElement.prototype.__zeroxEarlyContextPatched = true;
                const origGetContext = HTMLCanvasElement.prototype.getContext;
                HTMLCanvasElement.prototype.getContext = function (type) {
                    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
                        return null;
                    }
                    const ctx = origGetContext.apply(this, arguments);
                    if (ctx && (type === '2d' || type === 'experimental-2d')) {
                        patchCtx2d(ctx);
                    }
                    return ctx;
                };
            }

            if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.__zeroxProtoWatermarkBlocked) {
                CanvasRenderingContext2D.prototype.__zeroxProtoWatermarkBlocked = true;
                patchCtx2d(CanvasRenderingContext2D.prototype);
            }

            function patchGl(proto) {
                if (!proto || proto.__zeroxWebGlDrawPatched) return;
                proto.__zeroxWebGlDrawPatched = true;
                const _de = proto.drawElements;
                proto.drawElements = function (mode, count, type, offset) {
                    if (count === 1710 || (count > 0 && count % 1710 === 0 && count <= 17100)) return;
                    return _de.apply(this, arguments);
                };
            }
            if (typeof WebGLRenderingContext !== 'undefined') patchGl(WebGLRenderingContext.prototype);
            if (typeof WebGL2RenderingContext !== 'undefined') patchGl(WebGL2RenderingContext.prototype);
        } catch (e) {}
    })();

    // --- 3. UI STYLES FOR OVERLAYS / LEADERBOARD / PANEL / PAYMENTS ---
    const injectPremiumStyles = () => {
        const existing = document.getElementById('premium-styles');
        if (existing) existing.remove();
        const pStyle = document.createElement('style');
        pStyle.id = 'premium-styles';
        pStyle.innerHTML = `
            .ox-custom-flag svg[class*="flag-"] { opacity: 0 !important; pointer-events: none !important; }
            .ox-custom-flag { position: relative !important; }
            .ox-custom-flag::before {
                content: '' !important; position: absolute !important; left: 0 !important; top: 50% !important;
                transform: translateY(-50%) !important; width: 24px !important; height: 18px !important;
                background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important;
                border-radius: 2px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
            }
            .ox-custom-flag[data-ox-flag="bd"]::before { background-image: url('/profile/images/flags.svg#flag-bd') !important; }
            .ox-custom-flag[data-ox-flag="us"]::before { background-image: url('/profile/images/flags.svg#flag-us') !important; }
            .ox-custom-flag[data-ox-flag="in"]::before { background-image: url('/profile/images/flags.svg#flag-in') !important; }
            .ox-custom-avatar svg { opacity: 0.3 !important; }
            .qx-hide-orig-el {
                display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important;
                max-width: 0 !important; max-height: 0 !important; opacity: 0 !important; position: absolute !important;
                pointer-events: none !important;
            }
            .qx-row-flag-circle {
                width: 20px !important; height: 20px !important; min-width: 20px !important; border-radius: 50% !important;
                object-fit: cover !important; display: inline-block !important; vertical-align: middle !important;
                flex-shrink: 0 !important; z-index: 1 !important;
            }
            .qx-card-flag-circle {
                width: 20px !important; height: 20px !important; min-width: 20px !important; border-radius: 50% !important;
                object-fit: cover !important; display: inline-block !important; vertical-align: middle !important;
                flex-shrink: 0 !important; margin-right: 8px !important;
            }
            .qx-row-avatar-circle {
                width: 20px !important; height: 20px !important; min-width: 20px !important; border-radius: 50% !important;
                object-fit: cover !important; display: inline-block !important; vertical-align: middle !important;
                flex-shrink: 0 !important; margin-left: -6px !important; margin-right: 6px !important; z-index: 2 !important;
            }
            .qx-custom-user-row {
                background-color: rgba(255, 255, 255, 0.06) !important;
                border-radius: 6px !important;
            }
            .qx-plain-rank-badge,
            .qx-plain-rank-badge::before,
            .qx-plain-rank-badge::after {
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                border: none !important;
                box-shadow: none !important;
                color: #8c95a6 !important;
                font-weight: 500 !important;
            }
            .qx-plain-rank-badge::before,
            .qx-plain-rank-badge::after {
                content: none !important;
                display: none !important;
            }

            /* --- CONTROL PANEL & TXNS MODAL STYLES --- */
            #qx-gear-btn {
                position: fixed !important; z-index: 2147483640 !important;
                width: 30px !important; height: 30px !important; border-radius: 50% !important;
                background: rgba(30, 34, 46, 0.85) !important; border: 1px solid rgba(255,255,255,0.16) !important;
                color: #9ca3af !important; display: flex !important; align-items: center !important; justify-content: center !important;
                cursor: pointer !important; box-shadow: 0 2px 10px rgba(0,0,0,0.4) !important;
                backdrop-filter: blur(6px) !important; user-select: none !important; touch-action: none !important;
                transition: transform 0.15s ease, color 0.15s ease !important;
            }
            #qx-gear-btn:hover { color: #0faf59 !important; transform: scale(1.06) !important; }

            .qx-modal-backdrop {
                position: fixed !important; inset: 0 !important; z-index: 2147483646 !important;
                background: rgba(10, 12, 18, 0.78) !important; backdrop-filter: blur(4px) !important;
                display: none !important; align-items: center !important; justify-content: center !important;
                padding: 14px !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            }
            .qx-modal-backdrop.qx-open { display: flex !important; }
            .qx-modal-card {
                width: min(94vw, 390px) !important; max-height: 90vh !important; overflow-y: auto !important;
                background: #1c202b !important; border: 1px solid #2d3343 !important; border-radius: 14px !important;
                padding: 18px !important; color: #f3f4f6 !important; box-shadow: 0 20px 50px rgba(0,0,0,0.6) !important;
            }
            .qx-modal-header { text-align: center !important; margin-bottom: 14px !important; }
            .qx-modal-title {
                font-size: 16px !important; font-weight: 800 !important; letter-spacing: 0.5px !important;
                color: #ffffff !important; margin: 0 !important;
            }
            .qx-modal-sub { font-size: 11px !important; color: #9ca3af !important; margin-top: 3px !important; }
            .qx-bal-box {
                background: #232836 !important; border: 1px solid #30374a !important; border-radius: 10px !important;
                padding: 10px !important; text-align: center !important; margin-bottom: 14px !important;
            }
            .qx-bal-label {
                font-size: 10px !important; font-weight: 700 !important; color: #9ca3af !important;
                letter-spacing: 0.7px !important; text-transform: uppercase !important;
            }
            .qx-bal-val {
                font-size: 22px !important; font-weight: 800 !important; color: #0faf59 !important; margin-top: 2px !important;
            }
            .qx-field { margin-bottom: 12px !important; }
            .qx-field-label {
                display: block !important; font-size: 10px !important; font-weight: 700 !important;
                color: #9ca3af !important; letter-spacing: 0.6px !important; margin-bottom: 5px !important;
                text-transform: uppercase !important;
            }
            .qx-input, .qx-select {
                width: 100% !important; box-sizing: border-box !important; background: #262b38 !important;
                border: 1px solid #353c4f !important; border-radius: 8px !important; color: #ffffff !important;
                padding: 10px 12px !important; font-size: 14px !important; outline: none !important;
            }
            .qx-input:focus, .qx-select:focus { border-color: #0faf59 !important; }
            .qx-input-row { display: flex !important; gap: 8px !important; align-items: center !important; }
            .qx-reset-btn {
                width: 40px !important; height: 40px !important; flex-shrink: 0 !important;
                border-radius: 8px !important; background: #262b38 !important; border: 1px solid #353c4f !important;
                color: #60a5fa !important; font-size: 17px !important; cursor: pointer !important;
                display: flex !important; align-items: center !important; justify-content: center !important;
            }
            .qx-hint { font-size: 11px !important; color: #9ca3af !important; line-height: 1.45 !important; margin-top: 6px !important; }
            .qx-btn-primary {
                width: 100% !important; border: none !important; border-radius: 9px !important;
                background: #0faf59 !important; color: #ffffff !important; font-weight: 800 !important;
                font-size: 13px !important; padding: 12px !important; cursor: pointer !important;
                letter-spacing: 0.5px !important; margin-top: 4px !important;
            }
            .qx-btn-primary:active { transform: scale(0.99) !important; }
            .qx-btn-row { display: grid !important; grid-template-columns: 1fr 1fr 1fr !important; gap: 8px !important; margin-top: 10px !important; }
            .qx-btn-sec {
                border: 1px solid #353c4f !important; border-radius: 8px !important; background: #262b38 !important;
                color: #e5e7eb !important; font-weight: 700 !important; font-size: 11px !important;
                padding: 10px 6px !important; cursor: pointer !important; text-align: center !important;
            }
            .qx-btn-close {
                width: 100% !important; border: 1px solid #353c4f !important; border-radius: 8px !important;
                background: #262b38 !important; color: #e5e7eb !important; font-weight: 700 !important;
                font-size: 12px !important; padding: 10px !important; cursor: pointer !important; margin-top: 8px !important;
            }
            .qx-tx-list {
                max-height: 185px !important; overflow-y: auto !important; margin-bottom: 12px !important;
                display: flex !important; flex-direction: column !important; gap: 8px !important;
            }
            .qx-tx-item {
                background: #252a38 !important; border: 1px solid #333a4d !important; border-radius: 9px !important;
                padding: 9px 11px !important; display: flex !important; align-items: center !important; justify-content: space-between !important;
            }
            .qx-tx-del {
                width: 24px !important; height: 24px !important; border-radius: 6px !important; border: none !important;
                background: rgba(239, 68, 68, 0.2) !important; color: #f87171 !important; font-weight: 800 !important;
                cursor: pointer !important; flex-shrink: 0 !important; margin-left: 8px !important;
            }
            .qx-grid-2 { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
            .qx-analytics-box {
                background: #232836 !important; border: 1px solid #30374a !important; border-radius: 9px !important;
                padding: 10px 12px !important; margin-top: 10px !important; font-size: 12px !important; display: none !important;
            }
            .qx-analytics-box.qx-open { display: block !important; }
            #qx-toast {
                position: fixed !important; top: 14px !important; left: 50% !important; transform: translateX(-50%) !important;
                z-index: 2147483647 !important; background: #1e2430 !important; border: 1px solid #0faf59 !important;
                color: #ffffff !important; padding: 9px 16px !important; border-radius: 999px !important;
                font-size: 13px !important; font-weight: 700 !important; box-shadow: 0 10px 28px rgba(0,0,0,0.45) !important;
                display: none !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            }

            /* --- FAKE PAYMENTS PAGE LIST --- */
            .qx-fake-tx-container { width: 100% !important; display: flex !important; flex-direction: column !important; }
            .qx-fake-pay-row {
                display: flex !important; justify-content: space-between !important; align-items: flex-start !important;
                padding: 12px 14px !important; border-top: 1px solid rgba(255,255,255,0.06) !important;
                font-size: 13px !important; line-height: 1.45 !important;
            }
            .qx-fake-pay-left { display: flex !important; flex-direction: column !important; gap: 2px !important; }
            .qx-fake-pay-right { display: flex !important; flex-direction: column !important; align-items: flex-end !important; gap: 2px !important; }
            .qx-fake-pay-id { color: #ffffff !important; font-weight: 700 !important; font-size: 13px !important; }
            .qx-fake-pay-date { color: #8c95a6 !important; font-size: 12px !important; }
            .qx-fake-pay-status { color: #0faf59 !important; font-weight: 600 !important; font-size: 12px !important; }
            .qx-fake-pay-amt-dep { color: #0faf59 !important; font-weight: 700 !important; font-size: 13px !important; }
            .qx-fake-pay-amt-pay { color: #ef4444 !important; font-weight: 700 !important; font-size: 13px !important; }
            .qx-fake-pay-method { color: #ffffff !important; font-weight: 600 !important; font-size: 12px !important; }
            .qx-fake-pay-type { color: #8c95a6 !important; font-size: 12px !important; }
        `;
        (document.head || document.documentElement).appendChild(pStyle);
    };
    injectPremiumStyles();

    // --- 4. SYNCHRONOUS DOM INTERCEPTORS (Zero-Flicker DEMO Blocker) ---
    (function syncDomPatch() {
        try {
            if (window.__zeroxSyncDomPatched) return;
            window.__zeroxSyncDomPatched = true;

            const origInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
            if (origInnerHTML && origInnerHTML.set) {
                Object.defineProperty(Element.prototype, 'innerHTML', {
                    set: function (html) {
                        html = sanitizeDemoText(html, this);
                        return origInnerHTML.set.call(this, html);
                    },
                    get: function () {
                        return origInnerHTML.get.call(this);
                    }
                });
            }

            const origOuterHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'outerHTML');
            if (origOuterHTML && origOuterHTML.set) {
                Object.defineProperty(Element.prototype, 'outerHTML', {
                    set: function (html) {
                        html = sanitizeDemoText(html, this);
                        return origOuterHTML.set.call(this, html);
                    },
                    get: function () {
                        return origOuterHTML.get.call(this);
                    }
                });
            }

            const origInsertAdjacentHTML = Element.prototype.insertAdjacentHTML;
            if (origInsertAdjacentHTML) {
                Element.prototype.insertAdjacentHTML = function (position, html) {
                    return origInsertAdjacentHTML.call(this, position, sanitizeDemoText(html, this));
                };
            }

            const origTextContent = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
            if (origTextContent && origTextContent.set) {
                Object.defineProperty(Node.prototype, 'textContent', {
                    set: function (text) {
                        const el = this.nodeType === 1 ? this : this.parentElement;
                        text = sanitizeDemoText(text, el);
                        return origTextContent.set.call(this, text);
                    },
                    get: function () {
                        return origTextContent.get.call(this);
                    }
                });
            }

            const origNodeValue = Object.getOwnPropertyDescriptor(Node.prototype, 'nodeValue');
            if (origNodeValue && origNodeValue.set) {
                Object.defineProperty(Node.prototype, 'nodeValue', {
                    set: function (val) {
                        if (this.nodeType === 3) {
                            val = sanitizeDemoText(val, this.parentElement);
                        }
                        return origNodeValue.set.call(this, val);
                    },
                    get: function () {
                        return origNodeValue.get.call(this);
                    }
                });
            }

            if (typeof CharacterData !== 'undefined') {
                const origCharData = Object.getOwnPropertyDescriptor(CharacterData.prototype, 'data');
                if (origCharData && origCharData.set) {
                    Object.defineProperty(CharacterData.prototype, 'data', {
                        set: function (val) {
                            val = sanitizeDemoText(val, this.parentElement);
                            return origCharData.set.call(this, val);
                        },
                        get: function () {
                            return origCharData.get.call(this);
                        }
                    });
                }
            }

            const origCreateTextNode = Document.prototype.createTextNode;
            Document.prototype.createTextNode = function (data) {
                return origCreateTextNode.call(this, sanitizeDemoText(String(data ?? ''), null));
            };

            const origSetAttribute = Element.prototype.setAttribute;
            Element.prototype.setAttribute = function (name, value) {
                if ((name === 'href' || name === 'xlink:href') && typeof value === 'string' && value.includes('icon-academic')) {
                    const bal = getBalance() || 0;
                    value = value.replace('icon-academic', getLevel(bal));
                }
                return origSetAttribute.call(this, name, value);
            };

            const origTitleDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
            if (origTitleDesc && origTitleDesc.set) {
                Object.defineProperty(Document.prototype, 'title', {
                    set: function (val) {
                        if (typeof val === 'string' && /demo/i.test(val)) {
                            val = val.replace(/demo/gi, 'Live');
                        }
                        return origTitleDesc.set.call(this, val);
                    },
                    get: function () {
                        return origTitleDesc.get.call(this);
                    }
                });
            }
        } catch (e) {}
    })();

    // --- 5. CLEANUP PREVIOUS INSTANCES ---
    window.qxLiveObserver?.disconnect();
    if (Array.isArray(window.__zeroxShadowObservers)) {
        window.__zeroxShadowObservers.forEach(obs => { try { obs.disconnect(); } catch (e) {} });
        window.__zeroxShadowObservers = [];
    }
    clearInterval(window.qxUrlForceInterval);
    clearInterval(window.qxBalanceInterval);
    clearInterval(window.qxProfitLine);
    window.qxProfitLine = null;
    document.querySelectorAll('.qx-custom-user-row, .qx-card-flag-circle').forEach(el => el.remove());
    document.querySelectorAll('[data-qx-orig-rank]').forEach(el => {
        el.classList.remove('qx-hide-orig-el');
    });
    document.querySelectorAll('.qx-plain-rank-badge').forEach(el => {
        el.classList.remove('qx-plain-rank-badge');
    });
    document.getElementById('qx-combined-style')?.remove();
    document.getElementById('qx-profit-line-style')?.remove();
    document.getElementById('qx-deep-fix')?.remove();
    document.getElementById('qx-gear-btn')?.remove();
    document.getElementById('qx-control-overlay')?.remove();
    document.getElementById('qx-tx-overlay')?.remove();
    document.getElementById('qx-toast')?.remove();

    // --- 6. CONFIGURATION & URL/TITLE GUARDS ---
    const cleanUrl = () => {
        if (window.location.pathname.includes('demo-trade')) {
            const cleanPath = window.location.pathname.replace('demo-trade', 'trade');
            window.history.replaceState(window.history.state, '', cleanPath);
        }
    };

    const cleanTitle = () => {
        if (document.title.toLowerCase().includes('demo')) {
            document.title = document.title.replace(/demo/gi, 'Live');
        }
    };

    if (!window.qxHistoryPatched) {
        window.qxHistoryPatched = true;
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        history.pushState = function (state, title, url) {
            if (url && typeof url === 'string' && url.includes('demo-trade')) {
                url = url.replace('demo-trade', 'trade');
            }
            const res = originalPushState.apply(this, arguments);
            cleanTitle();
            return res;
        };
        history.replaceState = function (state, title, url) {
            if (url && typeof url === 'string' && url.includes('demo-trade')) {
                url = url.replace('demo-trade', 'trade');
            }
            const res = originalReplaceState.apply(this, arguments);
            cleanTitle();
            return res;
        };
    }

    cleanUrl();
    cleanTitle();

    window.addEventListener('popstate', () => {
        cleanUrl();
        cleanTitle();
    });

    window.qxUrlForceInterval = setInterval(() => {
        if (window.location.href.includes('demo-trade')) {
            try {
                window.history.replaceState({}, '', window.location.href.replace('demo-trade', 'trade'));
            } catch (e) {}
        }
        cleanTitle();
    }, 100);

    // --- 7. CORE BALANCE & AVATAR HELPERS (LIVE vs DEMO STRICTLY ISOLATED) ---
    function parseDollarAmount(text) {
        if (!text || !text.includes('$')) return null;
        const match = text.match(/\$\s*([\d,]+(?:\.\d+)?)/);
        if (!match) return null;
        const n = parseFloat(match[1].replace(/,/g, ''));
        return (Number.isFinite(n) && n >= 0 && n < 100000000) ? n : null;
    }

    function formatDollar(n) {
        return '$' + Number(n || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function getRawLiveBalance() {
        const trigger = document.querySelector('qx-usermenu-trigger');
        if (trigger?.shadowRoot) {
            const balEl = trigger.shadowRoot.querySelector('.balance');
            if (balEl) {
                const txt = (balEl.textContent || '').trim();
                const lastSpoof = window.__qxLastWrittenLiveStr;
                if (txt && txt !== lastSpoof) {
                    const n = parseDollarAmount(txt);
                    if (n !== null) {
                        window.__qxRawLiveBalance = n;
                    }
                }
            }
        }

        if (typeof window.__qxRawLiveBalance !== 'number') {
            const all = document.querySelectorAll('.zt1hG, .v2KPX, header .balance, header [class*="balance"]');
            for (const el of all) {
                if (el.closest('[data-qx-account="demo"], #qx-control-overlay, #qx-tx-overlay, .qx-profit-card, .qx-custom-user-row')) continue;
                const text = (el.textContent || '').trim();
                if (!text.includes('$') || text.includes('daily limit') || text === window.__qxLastWrittenLiveStr) continue;
                const n = parseDollarAmount(text);
                if (n !== null) {
                    window.__qxRawLiveBalance = n;
                    break;
                }
            }
        }

        if (typeof window.__qxRawLiveBalance === 'number' && Number.isFinite(window.__qxRawLiveBalance)) {
            window.__qxLastValidBalance = window.__qxRawLiveBalance;
            if (panelConfig.lastBalance !== window.__qxRawLiveBalance) {
                panelConfig.lastBalance = window.__qxRawLiveBalance;
                saveConfig(panelConfig);
            }
            return window.__qxRawLiveBalance;
        }

        if (typeof window.__qxLastValidBalance === 'number' && Number.isFinite(window.__qxLastValidBalance)) {
            return window.__qxLastValidBalance;
        }
        return null;
    }

    function getBalance() {
        const rawLive = getRawLiveBalance();
        const spoofStr = String(panelConfig.spoofLiveBalance ?? '').trim();
        if (spoofStr !== '') {
            const spoofNum = parseFloat(spoofStr);
            if (Number.isFinite(spoofNum) && spoofNum >= 0) {
                if (rawLive !== null && typeof panelConfig.liveBalanceAnchor === 'number' && Number.isFinite(panelConfig.liveBalanceAnchor)) {
                    const delta = rawLive - panelConfig.liveBalanceAnchor;
                    return Math.max(0, spoofNum + delta);
                }
                return spoofNum;
            }
        }
        return rawLive;
    }

    function removeBonusBanner() {
        const allDivs = document.querySelectorAll('div, section, aside');
        allDivs.forEach(el => {
            if (el.closest('#qx-control-overlay, #qx-tx-overlay')) return;
            const text = el.textContent || '';
            if (text.includes('50% bonus') || text.includes('bonus on your deposit') || text.includes('Get a 50%')) {
                if (el.offsetHeight > 0 && el.offsetHeight < 400) {
                    el.style.setProperty('display', 'none', 'important');
                }
            }
        });
    }

    const currentInitBal = getBalance();
    if (window.qxCustomStartingCapital === undefined || window.qxCustomStartingCapital === '0') {
        if (currentInitBal !== null) {
            window.qxCustomStartingCapital = currentInitBal.toString();
            panelConfig.startingCapital = window.qxCustomStartingCapital;
            saveConfig(panelConfig);
        }
    }

    const countryFlagMap = {
        'Bangladesh': 'bd',
        'India': 'in',
        'United States': 'us',
        'United Kingdom': 'gb',
        'Canada': 'ca',
        'Australia': 'au',
        'United Arab Emirates': 'ae',
        'Saudi Arabia': 'sa',
        'Pakistan': 'pk',
        'Brazil': 'br',
        'Turkey': 'tr',
        'Indonesia': 'id',
        'Malaysia': 'my',
        'Vietnam': 'vn',
        'Philippines': 'ph',
        'Nigeria': 'ng',
        'Russia': 'ru',
        'Germany': 'de',
        'Egypt': 'eg'
    };

    const DEFAULT_USER_AVATAR_SVG =
        'data:image/svg+xml;utf8,' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
        '<circle cx="12" cy="12" r="12" fill="%23ffffff"/>' +
        '<circle cx="12" cy="9" r="4" fill="%230099ff"/>' +
        '<path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" fill="%230099ff"/>' +
        '</svg>';

    function getUserAvatarUrl() {
        const customUrl = (window.qxCustomAvatar || panelConfig.customAvatar || '').trim();
        if (customUrl) {
            return customUrl;
        }
        return DEFAULT_USER_AVATAR_SVG;
    }

    // --- 8. INJECT STYLES ---
    const deepFixStyle = document.createElement('style');
    deepFixStyle.id = 'qx-deep-fix';
    deepFixStyle.textContent = `
        qx-usermenu-trigger:not(.qx-ready), .v2KPX:not(.qx-ready), [class*="account"]:not(.qx-ready), 
        div[class*="dropdown"]:not(.qx-ready), div[class*="menu"]:not(.qx-ready) {
            opacity: 0 !important;
            visibility: hidden !important;
        }
    `;
    (document.head || document.documentElement).appendChild(deepFixStyle);

    const style = document.createElement('style');
    style.id = 'qx-combined-style';
    style.textContent = `
        .v2KPX, [class*="account"], qx-usermenu-trigger {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
        }
        .qx-level-icon {
            width: 16px !important; height: 16px !important; min-width: 16px !important; max-width: 16px !important;
            min-height: 16px !important; max-height: 16px !important; display: inline-block !important;
            flex: 0 0 16px !important; margin-left: -10px !important; margin-right: 8px !important;
            padding: 0 !important; vertical-align: middle !important;
        }
        .qx-leaderboard-flag {
            width: 18px !important; height: 13px !important; object-fit: cover !important; border-radius: 2px !important;
            margin-right: 6px !important; vertical-align: middle !important; display: inline-block !important;
            flex-shrink: 0 !important;
        }
        svg.icon-academic, .v2KPX svg:not(.qx-level-icon) {
            display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important;
        }
        .usFyP, [class*="watermark"] {
            display: none !important; opacity: 0 !important; visibility: hidden !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    const profitLineStyle = document.createElement('style');
    profitLineStyle.id = 'qx-profit-line-style';
    profitLineStyle.textContent = `
        .qx-profit-card{ position:relative!important; }
        .qx-profit-line{
            position:absolute!important; height:2px!important; left:10px!important; top:39px!important;
            width:0%; background:#0faf59!important; z-index:999999!important; pointer-events:none!important;
            transition: width .35s ease, background-color .2s ease!important;
        }
    `;
    (document.head || document.documentElement).appendChild(profitLineStyle);

    // --- 9. LEADERBOARD & PROFIT LOGIC (CLEAN AVATAR + PLAIN RANK 4+ + TOP CARD FLAG) ---
    function findLeaderboardCard() {
        const candidates = [...document.querySelectorAll('div, section')].filter(el => {
            if (el.closest('#qx-control-overlay, #qx-tx-overlay, .qx-custom-user-row')) return false;
            const t = (el.innerText || '').trim();
            return (
                t.length > 0 &&
                t.length < 350 &&
                /your\s+position/i.test(t) &&
                t.includes('$') &&
                !/leader\s*board/i.test(t)
            );
        });
        if (candidates.length === 0) return null;
        candidates.sort((a, b) => (a.innerText || '').length - (b.innerText || '').length);
        return candidates[0];
    }

    function updateProfitLine() {
        const card = findLeaderboardCard();
        if (!card) return;
        if (!card.classList.contains('qx-profit-card')) {
            card.classList.add('qx-profit-card');
        }
        let line = card.querySelector('.qx-profit-line');
        if (!line) {
            line = document.createElement('div');
            line.className = 'qx-profit-line';
            card.appendChild(line);
        }
        const currentBalance = getBalance();
        if (currentBalance === null) return;
        const startCap = parseFloat((window.qxCustomStartingCapital || '').replace(/[^0-9.-]/g, '')) || 0;
        const profitAmount = currentBalance - startCap;

        let targetWidth = '0%';
        if (Math.abs(profitAmount) < 0.000001) {
            targetWidth = '0%';
        } else if (profitAmount < 0) {
            const loss = Math.abs(profitAmount);
            let percent = 30 - (loss / 15000) * 25;
            percent = Math.max(5, Math.min(30, percent));
            targetWidth = percent + '%';
        } else {
            const profit = Math.abs(profitAmount);
            let percent = 30 + (profit / 15000) * 50;
            percent = Math.max(30, Math.min(80, percent));
            targetWidth = percent + '%';
        }

        if (line.style.width !== targetWidth) {
            line.style.width = targetWidth;
        }
        line.style.background = '#0faf59';
    }

    function isRankValue(txt) {
        return /^(?:-|—|100\+|\d{1,3})$/.test((txt || '').trim());
    }

    function setLeaderboardPosition(card, positionText) {
        const leafEls = [...card.querySelectorAll('div, span')].filter(el => el.children.length === 0);
        for (const el of leafEls) {
            const val = (el.textContent || '').trim();
            if (!isRankValue(val)) continue;
            const parentText = el.parentElement ? (el.parentElement.textContent || '') : '';
            const grandText = el.parentElement?.parentElement ? (el.parentElement.parentElement.textContent || '') : '';
            if (/your\s+position/i.test(parentText) || /your\s+position/i.test(grandText)) {
                if (val !== positionText) {
                    el.textContent = positionText;
                }
                return;
            }
        }

        const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
            const val = (node.textContent || '').trim();
            if (!isRankValue(val)) continue;
            const parent = node.parentElement;
            if (!parent) continue;
            const containerText = parent.parentElement ? (parent.parentElement.textContent || '') : (parent.textContent || '');
            if (/your\s+position/i.test(containerText)) {
                if (val !== positionText) {
                    node.textContent = positionText;
                }
                return;
            }
        }
    }

    function isValidListRowElement(el, card) {
        if (!el || el.nodeType !== 1) return false;
        if (el.classList.contains('qx-custom-user-row') || el.dataset.qxCustomRow === '1') return false;
        if (el.closest('#qx-control-overlay, #qx-tx-overlay, .qx-custom-user-row')) return false;
        if (card && (card.contains(el) || el.contains(card))) return false;
        if (el.closest('header')) return false;
        const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (!t || t.length > 180 || !t.includes('$')) return false;
        if (/your\s+position|leader\s*board|how\s+does|of\s+the\s+day/i.test(t)) return false;
        return /\$\s*[\d,]+(?:\.\d+)?/.test(t);
    }

    function findLeaderboardRowElements(card) {
        const dollarNodes = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let n;
        while ((n = walker.nextNode())) {
            if (!n.nodeValue || !n.nodeValue.includes('$')) continue;
            const p = n.parentElement;
            if (!p || (card && card.contains(p)) || p.closest('header, #qx-control-overlay, #qx-tx-overlay, .qx-fake-tx-container, .qx-custom-user-row')) continue;
            if (/\$\s*[\d,]+(?:\.\d+)?/.test(n.nodeValue)) {
                dollarNodes.push(p);
            }
        }

        let bestList = [];
        const seenParents = new Set();
        for (const p of dollarNodes) {
            let cur = p;
            for (let depth = 0; depth < 6 && cur && cur.parentElement && cur.parentElement !== document.body; depth++) {
                const parent = cur.parentElement;
                if (seenParents.has(parent)) { cur = parent; continue; }
                seenParents.add(parent);
                const siblingRows = [...parent.children].filter(ch => isValidListRowElement(ch, card));
                if (siblingRows.length >= 3 && siblingRows.length > bestList.length) {
                    bestList = siblingRows;
                }
                cur = parent;
            }
        }
        return bestList;
    }

    function getUseHref(useEl) {
        if (!useEl) return '';
        return (
            useEl.getAttribute('href') ||
            useEl.getAttribute('xlink:href') ||
            useEl.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ||
            ''
        );
    }

    function isFollowingNode(refNode, targetNode) {
        if (!refNode || !targetNode) return false;
        return (refNode.compareDocumentPosition(targetNode) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    }

    function inspectRealRow(el, fallbackRank) {
        const textNodes = [];
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        let tn;
        while ((tn = tw.nextNode())) {
            if ((tn.nodeValue || '').trim().length > 0) {
                textNodes.push(tn);
            }
        }

        let rankTextNode = null;
        let profitTextNode = null;
        let nameTextNode = null;

        for (const node of textNodes) {
            const t = node.nodeValue.trim();
            if (!profitTextNode && t.includes('$') && /\$\s*[\d,]+(?:\.\d+)?/.test(t)) {
                profitTextNode = node;
            } else if (!rankTextNode && /^\d{1,3}$/.test(t)) {
                const num = parseInt(t, 10);
                if (num >= 1 && num <= 100) {
                    rankTextNode = node;
                }
            } else if (!nameTextNode) {
                nameTextNode = node;
            }
        }

        if (!profitTextNode) return null;
        const amount = parseDollarAmount(profitTextNode.nodeValue);
        if (amount === null || amount <= 0) return null;

        let origRank;
        if (el.dataset.qxOrigRank) {
            origRank = parseInt(el.dataset.qxOrigRank, 10);
        } else {
            origRank = rankTextNode ? parseInt(rankTextNode.nodeValue.trim(), 10) : fallbackRank;
            if (origRank >= 1 && origRank <= 100) {
                el.dataset.qxOrigRank = String(origRank);
            }
        }

        return {
            el,
            origRank,
            amount,
            hasPlainRankNode: Boolean(rankTextNode && origRank >= 4),
            rankTextNode
        };
    }

    function getRealLeaderboardRows(card) {
        const rowEls = findLeaderboardRowElements(card);
        const parsed = [];
        rowEls.forEach((el, idx) => {
            const info = inspectRealRow(el, idx + 1);
            if (info && info.origRank >= 1 && info.origRank <= 999) {
                parsed.push(info);
            }
        });
        parsed.sort((a, b) => a.origRank - b.origRank);
        return parsed;
    }

    function toggleRowMedalPlainMode(row, makePlain) {
        if (!row.rankTextNode) return;
        let cur = row.rankTextNode.parentElement;
        for (let i = 0; i < 3 && cur && cur !== row.el; i++) {
            const txt = (cur.textContent || '').trim();
            if (txt.includes('$') || txt.length > 6) break;
            if (makePlain) {
                cur.classList.add('qx-plain-rank-badge');
                cur.querySelectorAll('svg, img').forEach(m => m.classList.add('qx-hide-orig-el'));
            } else {
                cur.classList.remove('qx-plain-rank-badge');
                cur.querySelectorAll('svg.qx-hide-orig-el, img.qx-hide-orig-el').forEach(m => m.classList.remove('qx-hide-orig-el'));
            }
            cur = cur.parentElement;
        }
    }

    function restoreAllRealRows(rows) {
        rows.forEach(r => {
            r.el.classList.remove('qx-hide-orig-el');
            if (r.rankTextNode && r.el.dataset.qxOrigRank) {
                if (r.rankTextNode.nodeValue.trim() !== r.el.dataset.qxOrigRank) {
                    r.rankTextNode.nodeValue = r.el.dataset.qxOrigRank;
                }
            }
            toggleRowMedalPlainMode(r, false);
        });
    }

    function buildOrUpdateCustomUserRow(templateRow, container, beforeEl, rankNum, customName, formattedProfit, isLoss, countryCode) {
        let customRow = container.querySelector('.qx-custom-user-row');
        const desiredTemplateKey = rankNum <= 3 ? `medal-${rankNum}` : 'plain';

        if (customRow && customRow.dataset.qxTemplateKey !== desiredTemplateKey) {
            customRow.remove();
            customRow = null;
        }

        if (!customRow) {
            customRow = templateRow.el.cloneNode(true);
            customRow.classList.add('qx-custom-user-row');
            customRow.classList.remove('qx-hide-orig-el');
            customRow.dataset.qxCustomRow = '1';
            customRow.dataset.qxTemplateKey = desiredTemplateKey;
            delete customRow.dataset.qxOrigRank;
            // Ensure cloned template never carries plain-badge override if it is a top-3 medal row
            customRow.querySelectorAll('.qx-plain-rank-badge').forEach(b => b.classList.remove('qx-plain-rank-badge'));
        }

        if (beforeEl && customRow.nextElementSibling !== beforeEl) {
            container.insertBefore(customRow, beforeEl);
        } else if (!beforeEl && customRow.parentElement !== container) {
            container.appendChild(customRow);
        }

        const textNodes = [];
        const tw = document.createTreeWalker(customRow, NodeFilter.SHOW_TEXT, null, false);
        let tn;
        while ((tn = tw.nextNode())) {
            if ((tn.nodeValue || '').trim().length > 0) textNodes.push(tn);
        }

        let rankNode = null, profitNode = null, nameNode = null;
        for (const node of textNodes) {
            const t = node.nodeValue.trim();
            if (!profitNode && t.includes('$') && /\$\s*[\d,]+(?:\.\d+)?/.test(t)) {
                profitNode = node;
            } else if (!rankNode && /^\d{1,3}$/.test(t)) {
                rankNode = node;
            } else if (!nameNode) {
                nameNode = node;
            }
        }

        const rankStr = String(rankNum);
        if (rankNode && rankNode.nodeValue.trim() !== rankStr) {
            rankNode.nodeValue = rankStr;
        }
        if (nameNode && nameNode.nodeValue !== customName) {
            nameNode.nodeValue = customName;
        }
        if (profitNode) {
            if (profitNode.nodeValue !== formattedProfit) profitNode.nodeValue = formattedProfit;
            if (profitNode.parentElement) {
                profitNode.parentElement.style.setProperty('color', isLoss ? '#ef4444' : '#0faf59', 'important');
            }
        }

        // 1) Replace original flag SVG cleanly with circular country flag IMG
        const flagUse = [...customRow.querySelectorAll('use')].find(u => /flag-/i.test(getUseHref(u)));
        let flagSvg = flagUse ? flagUse.closest('svg') : customRow.querySelector('svg[class*="flag-"]');
        if (!flagSvg) {
            const rowRect = customRow.getBoundingClientRect();
            const nameRect = nameNode?.parentElement ? nameNode.parentElement.getBoundingClientRect() : null;
            const midSvgs = [...customRow.querySelectorAll('svg')].filter(svg => {
                const r = svg.getBoundingClientRect();
                if (r.width <= 0) return false;
                if (rowRect.width > 0 && (r.left - rowRect.left) < 34) return false;
                if (nameRect && nameRect.width > 0 && r.left >= nameRect.left + 4) return false;
                return true;
            });
            if (midSvgs.length > 0) flagSvg = midSvgs[0];
        }

        const cdnFlag = `https://flagcdn.com/w40/${countryCode}.png`;
        let flagRef = customRow.querySelector('.qx-row-flag-circle');
        if (flagSvg) {
            flagSvg.classList.add('qx-hide-orig-el');
            if (!flagRef && flagSvg.parentNode) {
                flagRef = document.createElement('img');
                flagRef.className = 'qx-row-flag-circle';
                flagRef.src = cdnFlag;
                flagSvg.parentNode.insertBefore(flagRef, flagSvg);
            } else if (flagRef && flagRef.src !== cdnFlag) {
                flagRef.src = cdnFlag;
            }
        }
        if (!flagRef) flagRef = flagSvg;

        // 2) Clean Avatar right AFTER the flag (never green icon, never overwrites medal before flag!)
        const userAvatar = getUserAvatarUrl();
        const anchorRef = flagSvg || flagRef;

        const postFlagImgs = [...customRow.querySelectorAll('img:not(.qx-row-flag-circle):not(.qx-row-avatar-circle)')].filter(img => {
            return anchorRef ? isFollowingNode(anchorRef, img) : false;
        });

        const postFlagSvgs = [...customRow.querySelectorAll('svg')].filter(svg => {
            if (svg === flagSvg) return false;
            if (!anchorRef || !isFollowingNode(anchorRef, svg)) return false;
            if (nameNode && isFollowingNode(nameNode, svg)) return false;
            return true;
        });

        if (postFlagImgs.length > 0) {
            postFlagImgs.forEach((img, idx) => {
                if (idx === 0) {
                    if (img.src !== userAvatar) img.src = userAvatar;
                    img.classList.remove('qx-hide-orig-el');
                } else {
                    img.classList.add('qx-hide-orig-el');
                }
            });
            postFlagSvgs.forEach(s => s.classList.add('qx-hide-orig-el'));
            customRow.querySelectorAll('.qx-row-avatar-circle').forEach(el => el.remove());
        } else if (postFlagSvgs.length > 0) {
            const avSvg = postFlagSvgs[0];
            avSvg.classList.add('qx-hide-orig-el');
            let customAv = customRow.querySelector('.qx-row-avatar-circle');
            if (!customAv && avSvg.parentNode) {
                customAv = document.createElement('img');
                customAv.className = 'qx-row-avatar-circle';
                customAv.src = userAvatar;
                avSvg.parentNode.insertBefore(customAv, avSvg);
            } else if (customAv && customAv.src !== userAvatar) {
                customAv.src = userAvatar;
            }
        }
    }

    function syncLeaderboardListRows(rows, actualRank, customName, formattedProfit, isLoss, countryCode) {
        document.querySelectorAll('.qx-custom-user-row').forEach(el => {
            if (!rows.length || !rows[0].el.parentElement || el.parentElement !== rows[0].el.parentElement) {
                el.remove();
            }
        });

        if (!rows || rows.length === 0) return;
        const container = rows[0].el.parentElement;
        if (!container) return;

        if (actualRank === null || actualRank < 1 || actualRank > 20) {
            container.querySelectorAll('.qx-custom-user-row').forEach(el => el.remove());
            restoreAllRealRows(rows);
            return;
        }

        let targetRow = rows.find(r => r.origRank >= actualRank) || null;
        if (!targetRow) {
            container.querySelectorAll('.qx-custom-user-row').forEach(el => el.remove());
            restoreAllRealRows(rows);
            return;
        }

        let templateRow;
        if (actualRank <= 3) {
            templateRow = rows.find(r => r.origRank === actualRank) || rows.find(r => r.hasPlainRankNode) || targetRow;
        } else {
            templateRow = rows.find(r => r.hasPlainRankNode) || targetRow;
        }

        buildOrUpdateCustomUserRow(
            templateRow,
            container,
            targetRow.el,
            actualRank,
            customName,
            formattedProfit,
            isLoss,
            countryCode
        );

        rows.forEach(r => {
            const shiftedRank = r.origRank >= actualRank ? r.origRank + 1 : r.origRank;
            if (shiftedRank > 20) {
                r.el.classList.add('qx-hide-orig-el');
            } else {
                r.el.classList.remove('qx-hide-orig-el');
                if (r.rankTextNode) {
                    const targetStr = String(shiftedRank);
                    if (r.rankTextNode.nodeValue.trim() !== targetStr) {
                        r.rankTextNode.nodeValue = targetStr;
                    }
                }
                // Any top-3 medal row shifted down to 4+ loses its gold/silver/bronze medal & turns into normal plain text
                toggleRowMedalPlainMode(r, r.origRank <= 3 && shiftedRank >= 4);
            }
        });
    }

    function fixLeaderboardPositionAndList(cardOverride, customName, formattedProfit, isLoss, countryCode) {
        const card = cardOverride || findLeaderboardCard();
        if (!card) return;
        const currentBalance = getBalance();
        if (currentBalance === null) return;
        const startCap = parseFloat(
            (window.qxCustomStartingCapital || '').replace(/[^0-9.-]/g, '')
        ) || 0;
        const profitAmount = currentBalance - startCap;

        const rows = getRealLeaderboardRows(card);

        if (Math.abs(profitAmount) < 0.000001) {
            setLeaderboardPosition(card, '-');
            syncLeaderboardListRows(rows, null, customName, formattedProfit, isLoss, countryCode);
            return;
        }
        if (profitAmount < 0) {
            setLeaderboardPosition(card, '100+');
            syncLeaderboardListRows(rows, null, customName, formattedProfit, isLoss, countryCode);
            return;
        }

        const myProfit = profitAmount;
        if (rows.length === 0) {
            setLeaderboardPosition(card, '100+');
            return;
        }

        let actualRank = null;
        for (const row of rows) {
            if (myProfit >= row.amount) {
                actualRank = row.origRank;
                break;
            }
        }

        if (actualRank === null) {
            actualRank = rows[rows.length - 1].origRank + 1;
        }

        const positionText = (actualRank >= 1 && actualRank <= 20) ? String(actualRank) : '100+';
        setLeaderboardPosition(card, positionText);
        syncLeaderboardListRows(rows, actualRank, customName, formattedProfit, isLoss, countryCode);
    }

    function updateTopCardFlag(card, nameEl, countryCode) {
        const cdnFlag = `https://flagcdn.com/w40/${countryCode}.png`;

        const allSvgs = [...card.querySelectorAll('svg')];
        let cardFlagSvg = allSvgs.find(svg => {
            const cls = svg.getAttribute('class') || '';
            if (/flag-/i.test(cls)) return true;
            const u = svg.querySelector('use');
            return u && /flag-/i.test(getUseHref(u));
        });

        if (!cardFlagSvg && allSvgs.length > 0 && nameEl) {
            cardFlagSvg = allSvgs.find(svg => !isFollowingNode(nameEl, svg));
        }

        let cardFlagImg = card.querySelector('.qx-card-flag-circle');
        if (cardFlagSvg) {
            cardFlagSvg.classList.add('qx-hide-orig-el');
            if (!cardFlagImg && cardFlagSvg.parentNode) {
                cardFlagImg = document.createElement('img');
                cardFlagImg.className = 'qx-card-flag-circle';
                cardFlagImg.src = cdnFlag;
                cardFlagSvg.parentNode.insertBefore(cardFlagImg, cardFlagSvg);
            } else if (cardFlagImg) {
                if (cardFlagImg.src !== cdnFlag) cardFlagImg.src = cdnFlag;
                cardFlagImg.classList.remove('qx-hide-orig-el');
            }
        } else if (nameEl && nameEl.parentElement) {
            if (!cardFlagImg) {
                cardFlagImg = document.createElement('img');
                cardFlagImg.className = 'qx-card-flag-circle';
                cardFlagImg.src = cdnFlag;
                nameEl.parentElement.insertBefore(cardFlagImg, nameEl);
            } else if (cardFlagImg.src !== cdnFlag) {
                cardFlagImg.src = cdnFlag;
            }
        }
    }

    function fixLeaderboardUI() {
        const currentBalance = getBalance();
        if (currentBalance === null) return;

        if (!window.qxCustomStartingCapital || window.qxCustomStartingCapital === '0') {
            window.qxCustomStartingCapital = currentBalance.toString();
            panelConfig.startingCapital = window.qxCustomStartingCapital;
            saveConfig(panelConfig);
        }

        const card = findLeaderboardCard();
        if (!card) return;

        const customName = window.qxCustomName || panelConfig.customName || 'Trader Eyasin X';
        const startCap = parseFloat(
            (window.qxCustomStartingCapital || '').replace(/[^0-9.-]/g, '')
        ) || 0;
        const profitAmount = currentBalance - startCap;
        const absProfit = Math.abs(profitAmount);
        const formattedProfit = (profitAmount < 0 ? '-$' : '$') + absProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const isLoss = profitAmount < 0;
        const activeCountry = window.qxCustomCountry || panelConfig.country || 'Bangladesh';
        const countryCode = countryFlagMap[activeCountry] || 'bd';

        const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
            if (/your\s+position/i.test(node.nodeValue || '') && node.nodeValue.trim() !== 'Your position:') {
                node.nodeValue = 'Your position:';
            }
        }

        let nameEl = null;
        const leafElements = [...card.querySelectorAll('div, span')].filter(el => el.children.length === 0);

        for (const el of leafElements) {
            const t = (el.textContent || '').trim();
            if (!t) continue;

            if (t.includes('$')) {
                if (el.textContent !== formattedProfit) {
                    el.textContent = formattedProfit;
                }
                const targetColor = isLoss ? '#ef4444' : '#0faf59';
                el.style.setProperty('color', targetColor, 'important');
            } else if (
                !nameEl &&
                !/your\s+position/i.test(t) &&
                !isRankValue(t) &&
                !t.includes('How does') &&
                !t.includes('of the Day')
            ) {
                if (el.textContent !== customName) {
                    el.textContent = customName;
                }
                nameEl = el;
            }
        }

        updateTopCardFlag(card, nameEl, countryCode);
        fixLeaderboardPositionAndList(card, customName, formattedProfit, isLoss, countryCode);
    }

    // --- 10. TIER LOGIC & STRICT LIVE/DEMO ACCOUNT SEPARATION (DEMO ALWAYS 1000 DEFAULT) ---
    function getTierInfo(balance) {
        if (balance >= 10000) {
            return { iconId: 'icon-profile-level-vip', label: 'vip:', profitText: '+4% profit' };
        }
        if (balance >= 5000) {
            return { iconId: 'icon-profile-level-pro', label: 'pro:', profitText: '+2% profit' };
        }
        return { iconId: 'icon-profile-level-standart', label: 'standard:', profitText: '+0% profit' };
    }

    function getLevel(balance) {
        return getTierInfo(balance).iconId;
    }

    function fixDropdownLevelCard(balance) {
        const tier = getTierInfo(balance);
        const profitNodes = [...document.querySelectorAll('.VgpLl')];

        if (profitNodes.length === 0) {
            document.querySelectorAll('div, span').forEach(el => {
                if (el.closest('#qx-control-overlay, #qx-tx-overlay')) return;
                if (el.children.length === 0 && /^\+\d+%\s*profit$/i.test((el.textContent || '').trim())) {
                    profitNodes.push(el);
                }
            });
        }

        profitNodes.forEach(profitEl => {
            if (profitEl.textContent.trim() !== tier.profitText) {
                profitEl.textContent = tier.profitText;
            }

            const labelEl = profitEl.previousElementSibling;
            if (labelEl && /^(standard|pro|vip)\s*:?$/i.test((labelEl.textContent || '').replace(/\s+/g, ''))) {
                if (labelEl.textContent.trim().toLowerCase() !== tier.label) {
                    labelEl.textContent = tier.label;
                }
            }

            const cardBox = profitEl.parentElement?.parentElement;
            if (cardBox) {
                const svgs = [...cardBox.querySelectorAll('svg')].filter(svg => {
                    return !svg.classList.contains('icon-eye') && !svg.closest('.Wo6tF');
                });
                const levelSvg = svgs[0];
                if (levelSvg) {
                    levelSvg.classList.remove(
                        'icon-profile-level-standart',
                        'icon-profile-level-pro',
                        'icon-profile-level-vip'
                    );
                    levelSvg.classList.add(tier.iconId);

                    const targetHref = `/profile/images/spritemap.svg#${tier.iconId}`;
                    let useEl = levelSvg.querySelector('use');
                    if (!useEl) {
                        useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                        levelSvg.appendChild(useEl);
                    }
                    if (useEl.getAttribute('href') !== targetHref) {
                        useEl.setAttribute('href', targetHref);
                    }
                    if (useEl.getAttribute('xlink:href') !== targetHref) {
                        useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', targetHref);
                    }
                }
            }
        });
    }

    function findSingleAccountRow(textNode) {
        let cur = textNode.parentElement;
        let best = null;
        while (cur && cur !== document.body) {
            const txt = cur.textContent || '';
            const hasLive = /live\s+account/i.test(txt);
            const hasDemo = /demo\s+account/i.test(txt);
            if (hasLive && hasDemo) {
                break;
            }
            best = cur;
            cur = cur.parentElement;
        }
        return best;
    }

    function fixAccountLabels() {
        const labelNodes = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
            if (node.parentElement && node.parentElement.closest('#qx-control-overlay, #qx-tx-overlay')) continue;
            const t = (node.nodeValue || '').trim();
            if (/^(live|demo)\s+account$/i.test(t) && node.parentElement) {
                labelNodes.push(node);
            }
        }

        if (labelNodes.length >= 1) {
            const rows = labelNodes.map((textNode, idx) => {
                const row = findSingleAccountRow(textNode);
                const rowText = row ? (row.textContent || '') : '';
                const hasDailyLimit = /daily limit|set limit/i.test(rowText);
                const hasEditOrRefresh = Boolean(
                    row && (
                        row.querySelector('svg[class*="edit"], svg[class*="pencil"], svg[class*="refresh"]') ||
                        row.innerHTML.includes('icon-pencil') ||
                        row.innerHTML.includes('icon-refresh')
                    )
                );
                return { textNode, row, idx, hasDailyLimit, hasEditOrRefresh, rowText };
            });

            const liveBal = getBalance();
            const hasLiveSpoof = String(panelConfig.spoofLiveBalance ?? '').trim() !== '' && liveBal !== null;
            const formattedLive = liveBal !== null ? formatDollar(liveBal) : null;

            const demoValNum = parseFloat(String(panelConfig.spoofDemoBalance ?? '1000').trim());
            const formattedDemo = formatDollar(Number.isFinite(demoValNum) && demoValNum >= 0 ? demoValNum : 1000);

            rows.forEach(item => {
                const isDemoRow = item.hasEditOrRefresh ||
                    (/demo\s+account/i.test(item.rowText) && !item.hasDailyLimit) ||
                    (!item.hasDailyLimit && item.idx >= 1);

                if (isDemoRow) {
                    if (item.textNode.nodeValue.trim() !== 'Demo Account') {
                        item.textNode.nodeValue = 'Demo Account';
                    }
                    if (item.row) {
                        if (item.row.getAttribute('data-qx-account') !== 'demo') {
                            item.row.setAttribute('data-qx-account', 'demo');
                        }
                        const spanRuj = item.row.querySelector('.RujZE');
                        if (spanRuj) spanRuj.style.setProperty('display', 'none', 'important');
                        const inputRadio = item.row.querySelector('input[type="radio"]');
                        if (inputRadio && inputRadio.checked) inputRadio.checked = false;
                        const linkEl = item.row.tagName === 'A' ? item.row : item.row.querySelector('a');
                        if (linkEl) linkEl.classList.remove('active');
                        item.row.classList.remove('active');

                        // Keep Demo Account strictly locked to $1,000.00 (or custom Demo value)
                        const tw = document.createTreeWalker(item.row, NodeFilter.SHOW_TEXT, null, false);
                        let tn;
                        while ((tn = tw.nextNode())) {
                            if (tn.nodeValue && /\$\s*[\d,]+(?:\.\d+)?/.test(tn.nodeValue)) {
                                if (tn.nodeValue.trim() !== formattedDemo) {
                                    tn.nodeValue = formattedDemo;
                                }
                                break;
                            }
                        }
                    }
                } else {
                    if (item.textNode.nodeValue.trim() !== 'Live Account') {
                        item.textNode.nodeValue = 'Live Account';
                    }
                    if (item.row) {
                        if (item.row.getAttribute('data-qx-account') !== 'live') {
                            item.row.setAttribute('data-qx-account', 'live');
                        }
                        const spanRuj = item.row.querySelector('.RujZE');
                        if (spanRuj) {
                            spanRuj.style.setProperty('display', 'inline-block', 'important');
                            spanRuj.style.setProperty('visibility', 'visible', 'important');
                            spanRuj.style.setProperty('opacity', '1', 'important');
                        }
                        const inputRadio = item.row.querySelector('input[type="radio"]');
                        if (inputRadio && !inputRadio.checked) inputRadio.checked = true;
                        const linkEl = item.row.tagName === 'A' ? item.row : item.row.querySelector('a');
                        if (linkEl) linkEl.classList.add('active');

                        if (hasLiveSpoof && formattedLive) {
                            const tw = document.createTreeWalker(item.row, NodeFilter.SHOW_TEXT, null, false);
                            let tn;
                            while ((tn = tw.nextNode())) {
                                const val = (tn.nodeValue || '').trim();
                                const pText = tn.parentElement?.parentElement?.textContent || '';
                                if (/\$\s*[\d,]+(?:\.\d+)?/.test(val) && !/daily limit/i.test(pText)) {
                                    if (val !== formattedLive) {
                                        tn.nodeValue = formattedLive;
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    function fixAccountAndIcon(balance) {
        fixAccountLabels();
        fixDropdownLevelCard(balance);
        removeBonusBanner();

        const live = [...document.querySelectorAll('.v2KPX')].find(e => {
            const t = e.textContent.trim().toUpperCase();
            return t.includes('DEMO') || t.includes('LIVE');
        });
        if (!live) return;
        live.querySelectorAll('svg.icon-academic, svg:not(.qx-level-icon)').forEach(el => el.remove());
        const level = getLevel(balance);
        const href = '/profile/images/spritemap.svg#' + level;
        let icon = live.querySelector('.qx-level-icon');
        if (!icon) {
            icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            icon.setAttribute('class', 'qx-level-icon');
            icon.setAttribute('viewBox', '0 0 24 24');
            icon.innerHTML = `<use href="${href}" xlink:href="${href}"></use>`;
            live.insertBefore(icon, live.firstChild);
        } else {
            const use = icon.querySelector('use');
            if (use && use.getAttribute('href') !== href) {
                use.setAttribute('href', href);
                use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href);
            }
        }
        const tw = document.createTreeWalker(live, NodeFilter.SHOW_TEXT, null, false);
        let n;
        while ((n = tw.nextNode())) {
            if (/demo/i.test(n.nodeValue || '')) {
                n.nodeValue = n.nodeValue.replace(/demo/gi, 'LIVE').replace(/\s+/g, ' ');
            }
        }
    }

    function fixBalancesAndUI() {
        const balNum = getBalance();
        if (balNum === null) return;
        const mainBalance = formatDollar(balNum);

        document.querySelectorAll('div, span').forEach(el => {
            if (el.closest('[data-qx-account="demo"], #qx-control-overlay, #qx-tx-overlay')) return;
            if (el.textContent && el.textContent.trim() === 'The daily limit is not set') {
                const parent = el.parentElement;
                if (parent) {
                    const priceTag = parent.querySelector('span, div');
                    if (priceTag && priceTag.textContent.includes('$')) {
                        if (priceTag.textContent !== mainBalance) priceTag.textContent = mainBalance;
                    } else {
                        const prevEl = el.previousElementSibling;
                        if (prevEl && prevEl.textContent.includes('$')) {
                            if (prevEl.textContent !== mainBalance) prevEl.textContent = mainBalance;
                        }
                    }
                }
            }
        });
    }

    // --- 11. FAKE PAYMENTS / TRANSACTIONS HISTORY INJECTOR ---
    function renderFakePaymentsHistory() {
        if (!panelConfig.transactions || panelConfig.transactions.length === 0) return;

        const headerCandidates = [...document.querySelectorAll('div, tr, thead')].filter(el => {
            if (el.closest('#qx-control-overlay, #qx-tx-overlay, .qx-fake-tx-container')) return false;
            const t = (el.innerText || '').trim();
            return t.includes('Transaction ID') && t.includes('Amount') && t.length < 100;
        });

        if (headerCandidates.length === 0) return;
        headerCandidates.sort((a, b) => (a.innerText || '').length - (b.innerText || '').length);
        const headerRow = headerCandidates[0];
        const tableContainer = headerRow.parentElement;
        if (!tableContainer) return;

        [...tableContainer.children].forEach(child => {
            if (child === headerRow || child.classList.contains('qx-fake-tx-container')) return;
            if (!child.classList.contains('qx-hide-orig-el')) {
                child.classList.add('qx-hide-orig-el');
            }
        });

        let fakeBox = tableContainer.querySelector('.qx-fake-tx-container');
        const signature = JSON.stringify(panelConfig.transactions);

        if (!fakeBox) {
            fakeBox = document.createElement('div');
            fakeBox.className = 'qx-fake-tx-container';
            headerRow.insertAdjacentElement('afterend', fakeBox);
        }

        if (fakeBox.dataset.sig === signature) return;
        fakeBox.dataset.sig = signature;

        fakeBox.innerHTML = panelConfig.transactions.map(tx => {
            const isDep = tx.type === 'Deposit';
            const amt = Number(tx.amount || 0).toFixed(2);
            const signAmt = isDep ? `+$${amt}` : `-$${amt}`;
            return `
                <div class="qx-fake-pay-row">
                    <div class="qx-fake-pay-left">
                        <div class="qx-fake-pay-id">${escapeHtml(tx.id)}</div>
                        <div class="qx-fake-pay-date">${escapeHtml(tx.dateTime)}</div>
                        <div class="qx-fake-pay-status">Successed</div>
                    </div>
                    <div class="qx-fake-pay-right">
                        <div class="${isDep ? 'qx-fake-pay-amt-dep' : 'qx-fake-pay-amt-pay'}">${signAmt}</div>
                        <div class="qx-fake-pay-method">${escapeHtml(tx.method)}</div>
                        <div class="qx-fake-pay-type">${isDep ? 'Deposit' : 'Payout'}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // --- 12. INTERACTIVE CONTROL PANEL & FAKE TRANSACTIONS MODAL UI ---
    function showToast(msg) {
        const toast = document.getElementById('qx-toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.style.setProperty('display', 'block', 'important');
        clearTimeout(toast.__t);
        toast.__t = setTimeout(() => {
            toast.style.setProperty('display', 'none', 'important');
        }, 2000);
    }

    function initControlPanelUI() {
        if (!document.body || document.getElementById('qx-gear-btn')) return;

        const toast = document.createElement('div');
        toast.id = 'qx-toast';
        document.body.appendChild(toast);

        const gearBtn = document.createElement('div');
        gearBtn.id = 'qx-gear-btn';
        gearBtn.title = 'Open Control Panel (Alt+X)';
        gearBtn.style.top = (panelConfig.gearPos?.top ?? 8) + 'px';
        gearBtn.style.right = (panelConfig.gearPos?.right ?? 8) + 'px';
        gearBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.79 1 1.44 1.07H21a2 2 0 1 1 0 4h-.09c-.65.07-1.18.47-1.51 1.07z"></path>
            </svg>
        `;
        document.body.appendChild(gearBtn);

        const controlOverlay = document.createElement('div');
        controlOverlay.id = 'qx-control-overlay';
        controlOverlay.className = 'qx-modal-backdrop';
        controlOverlay.innerHTML = `
            <div class="qx-modal-card">
                <div class="qx-modal-header">
                    <h3 class="qx-modal-title">0X CONTROL PANEL</h3>
                    <div class="qx-modal-sub">Leaderboard, Balance & Account Settings</div>
                </div>
                <div class="qx-bal-box">
                    <div class="qx-bal-label">Live Account Balance</div>
                    <div class="qx-bal-val" id="qx-cp-balance">$0.00</div>
                </div>
                <div class="qx-field">
                    <label class="qx-field-label">Set Live Account Balance ($)</label>
                    <div class="qx-input-row">
                        <input type="number" step="any" class="qx-input" id="qx-cp-live-bal" placeholder="e.g. 50000 (blank = real balance)" />
                        <button type="button" class="qx-reset-btn" id="qx-cp-live-reset" title="Reset to Real Balance">↻</button>
                    </div>
                </div>
                <div class="qx-field">
                    <label class="qx-field-label">Leaderboard Name</label>
                    <input type="text" class="qx-input" id="qx-cp-name" placeholder="Trader Eyasin X" />
                </div>
                <div class="qx-field">
                    <label class="qx-field-label">Country Flag</label>
                    <select class="qx-select" id="qx-cp-country">
                        ${Object.keys(countryFlagMap).map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div class="qx-field">
                    <label class="qx-field-label">Net Profit / Loss Display</label>
                    <div class="qx-input-row">
                        <input type="number" step="any" class="qx-input" id="qx-cp-profit" placeholder="e.g. 2281.20 or -500" />
                        <button type="button" class="qx-reset-btn" id="qx-cp-profit-reset" title="Reset Profit to $0">↻</button>
                    </div>
                    <div class="qx-hint">
                        • Positive: Shows as Profit (Green)<br/>
                        • Negative: Shows as Loss (Red)<br/>
                        • Logic: Leaderboard = Current Balance - Initial Capital
                    </div>
                </div>
                <div class="qx-field">
                    <label class="qx-field-label">Demo Balance (Default $1,000)</label>
                    <input type="number" step="any" class="qx-input" id="qx-cp-demo-bal" placeholder="1000" />
                </div>
                <div class="qx-field">
                    <label class="qx-field-label">Custom Logo / Avatar URL (Optional)</label>
                    <input type="text" class="qx-input" id="qx-cp-avatar" placeholder="Blank = default clean avatar" />
                </div>
                <button type="button" class="qx-btn-primary" id="qx-cp-apply">✓ APPLY CHANGES</button>
                <div class="qx-btn-row">
                    <button type="button" class="qx-btn-sec" id="qx-cp-analytics-btn">ANALYTICS</button>
                    <button type="button" class="qx-btn-sec" id="qx-cp-txns-btn">$ TXNS</button>
                    <button type="button" class="qx-btn-sec" id="qx-cp-close">CLOSE</button>
                </div>
                <div class="qx-analytics-box" id="qx-cp-analytics-box"></div>
            </div>
        `;
        document.body.appendChild(controlOverlay);

        const txOverlay = document.createElement('div');
        txOverlay.id = 'qx-tx-overlay';
        txOverlay.className = 'qx-modal-backdrop';
        txOverlay.innerHTML = `
            <div class="qx-modal-card">
                <div class="qx-modal-header">
                    <h3 class="qx-modal-title">FAKE TRANSACTIONS</h3>
                    <div class="qx-modal-sub">Add custom Deposit & Payout records</div>
                </div>
                <div class="qx-tx-list" id="qx-tx-list"></div>
                <div class="qx-grid-2">
                    <div class="qx-field">
                        <label class="qx-field-label">Transaction Type</label>
                        <select class="qx-select" id="qx-tx-type">
                            <option value="Deposit">Deposit (+)</option>
                            <option value="Payout">Payout (-)</option>
                        </select>
                    </div>
                    <div class="qx-field">
                        <label class="qx-field-label">Amount ($)</label>
                        <input type="number" step="any" class="qx-input" id="qx-tx-amount" placeholder="e.g. 500.00" />
                    </div>
                </div>
                <div class="qx-grid-2">
                    <div class="qx-field">
                        <label class="qx-field-label">Payment Method</label>
                        <select class="qx-select" id="qx-tx-method">
                            <option value="Binance Pay">Binance Pay</option>
                            <option value="USDT (TRC-20)">USDT (TRC-20)</option>
                            <option value="USDT (ERC-20)">USDT (ERC-20)</option>
                            <option value="USDT (BEP-20)">USDT (BEP-20)</option>
                            <option value="Bitcoin">Bitcoin</option>
                            <option value="Ethereum">Ethereum</option>
                            <option value="Litecoin">Litecoin</option>
                            <option value="Dogecoin">Dogecoin</option>
                            <option value="Tron (TRX)">Tron (TRX)</option>
                            <option value="Perfect Money">Perfect Money</option>
                            <option value="UPI">UPI</option>
                            <option value="Nagad">Nagad</option>
                            <option value="bKash">bKash</option>
                            <option value="Rocket">Rocket</option>
                            <option value="Visa / MasterCard">Visa / MasterCard</option>
                        </select>
                    </div>
                    <div class="qx-field">
                        <label class="qx-field-label">Date & Time</label>
                        <input type="text" class="qx-input" id="qx-tx-date" />
                    </div>
                </div>
                <button type="button" class="qx-btn-primary" id="qx-tx-add">+ ADD TRANSACTION</button>
                <button type="button" class="qx-btn-close" id="qx-tx-close">CLOSE</button>
            </div>
        `;
        document.body.appendChild(txOverlay);

        function refreshControlInputs() {
            const bal = getBalance() || 0;
            const startCap = parseFloat((window.qxCustomStartingCapital || '0').replace(/[^0-9.-]/g, '')) || 0;
            const curProfit = bal - startCap;
            document.getElementById('qx-cp-balance').textContent = formatDollar(bal);
            document.getElementById('qx-cp-live-bal').value = panelConfig.spoofLiveBalance ?? '';
            document.getElementById('qx-cp-name').value = window.qxCustomName || panelConfig.customName || 'Trader Eyasin X';
            document.getElementById('qx-cp-country').value = window.qxCustomCountry || panelConfig.country || 'Bangladesh';
            document.getElementById('qx-cp-profit').value = Number(curProfit.toFixed(2));
            document.getElementById('qx-cp-demo-bal').value = panelConfig.spoofDemoBalance || '1000';
            document.getElementById('qx-cp-avatar').value = window.qxCustomAvatar || panelConfig.customAvatar || '';
            document.getElementById('qx-cp-analytics-box').classList.remove('qx-open');
        }

        function refreshTxListModal() {
            const listEl = document.getElementById('qx-tx-list');
            if (!listEl) return;
            if (panelConfig.transactions.length === 0) {
                listEl.innerHTML = `<div style="text-align:center;color:#9ca3af;font-size:12px;padding:10px;">No custom transactions added</div>`;
                return;
            }
            listEl.innerHTML = panelConfig.transactions.map((tx, idx) => {
                const isDep = tx.type === 'Deposit';
                return `
                    <div class="qx-tx-item">
                        <div>
                            <div style="font-weight:700;font-size:13px;color:${isDep ? '#0faf59' : '#ef4444'};">
                                ● ${isDep ? 'Deposit' : 'Payout'} $${Number(tx.amount).toFixed(2)}
                            </div>
                            <div style="font-size:11px;color:#9ca3af;">${escapeHtml(tx.method)} • ${escapeHtml(tx.dateTime)}</div>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-size:11px;color:#9ca3af;">#${escapeHtml(tx.id)}</span>
                            <button type="button" class="qx-tx-del" data-idx="${idx}">✕</button>
                        </div>
                    </div>
                `;
            }).join('');

            listEl.querySelectorAll('.qx-tx-del').forEach(btn => {
                btn.addEventListener('click', () => {
                    const i = parseInt(btn.getAttribute('data-idx'), 10);
                    panelConfig.transactions.splice(i, 1);
                    saveConfig(panelConfig);
                    refreshTxListModal();
                    renderFakePaymentsHistory();
                });
            });
        }

        function openControlModal() {
            refreshControlInputs();
            controlOverlay.classList.add('qx-open');
        }

        let dragging = false, moved = false, startX = 0, startY = 0, startTop = 8, startRight = 8;
        gearBtn.addEventListener('pointerdown', e => {
            dragging = true;
            moved = false;
            startX = e.clientX;
            startY = e.clientY;
            startTop = parseFloat(gearBtn.style.top) || 8;
            startRight = parseFloat(gearBtn.style.right) || 8;
            gearBtn.setPointerCapture?.(e.pointerId);
        });
        gearBtn.addEventListener('pointermove', e => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
            if (!moved) return;
            const newTop = Math.max(4, Math.min(window.innerHeight - 36, startTop + dy));
            const newRight = Math.max(4, Math.min(window.innerWidth - 36, startRight - dx));
            gearBtn.style.top = newTop + 'px';
            gearBtn.style.right = newRight + 'px';
        });
        gearBtn.addEventListener('pointerup', () => {
            if (!dragging) return;
            dragging = false;
            if (moved) {
                panelConfig.gearPos = {
                    top: parseFloat(gearBtn.style.top) || 8,
                    right: parseFloat(gearBtn.style.right) || 8
                };
                saveConfig(panelConfig);
            } else {
                openControlModal();
            }
        });

        window.addEventListener('keydown', e => {
            if (e.altKey && (e.key === 'x' || e.key === 'X')) {
                if (controlOverlay.classList.contains('qx-open')) {
                    controlOverlay.classList.remove('qx-open');
                } else {
                    openControlModal();
                }
            }
        });

        document.getElementById('qx-cp-close').addEventListener('click', () => {
            controlOverlay.classList.remove('qx-open');
        });
        controlOverlay.addEventListener('click', e => {
            if (e.target === controlOverlay) controlOverlay.classList.remove('qx-open');
        });

        document.getElementById('qx-cp-live-reset').addEventListener('click', () => {
            document.getElementById('qx-cp-live-bal').value = '';
            const rawBal = getRawLiveBalance();
            if (rawBal !== null) {
                document.getElementById('qx-cp-balance').textContent = formatDollar(rawBal);
            }
        });

        document.getElementById('qx-cp-profit-reset').addEventListener('click', () => {
            document.getElementById('qx-cp-profit').value = '0';
        });

        document.getElementById('qx-cp-apply').addEventListener('click', () => {
            const newLiveBalStr = document.getElementById('qx-cp-live-bal').value.trim();
            const newName = document.getElementById('qx-cp-name').value.trim() || 'Trader Eyasin X';
            const newCountry = document.getElementById('qx-cp-country').value || 'Bangladesh';
            const desiredProfit = parseFloat(document.getElementById('qx-cp-profit').value);
            const demoBalVal = document.getElementById('qx-cp-demo-bal').value.trim() || '1000';
            const newAvatarUrl = document.getElementById('qx-cp-avatar').value.trim();

            const rawBal = getRawLiveBalance();
            if (newLiveBalStr !== '') {
                const parsedLive = parseFloat(newLiveBalStr);
                if (Number.isFinite(parsedLive) && parsedLive >= 0) {
                    panelConfig.spoofLiveBalance = String(parsedLive);
                    panelConfig.liveBalanceAnchor = rawBal !== null ? rawBal : null;
                }
            } else {
                panelConfig.spoofLiveBalance = '';
                panelConfig.liveBalanceAnchor = null;
                const trigger = document.querySelector('qx-usermenu-trigger');
                const balEl = trigger?.shadowRoot?.querySelector('.balance');
                if (balEl && rawBal !== null) {
                    window.__qxLastWrittenLiveStr = null;
                    balEl.textContent = formatDollar(rawBal);
                }
            }

            const curBal = getBalance() || 0;
            const targetProfit = Number.isFinite(desiredProfit) ? desiredProfit : 0;
            const newStartCap = (curBal - targetProfit).toFixed(2);

            window.qxCustomName = newName;
            window.qxCustomCountry = newCountry;
            window.qxCustomStartingCapital = newStartCap;
            window.qxCustomAvatar = newAvatarUrl;

            panelConfig.customName = newName;
            panelConfig.country = newCountry;
            panelConfig.startingCapital = newStartCap;
            panelConfig.spoofDemoBalance = demoBalVal;
            panelConfig.customAvatar = newAvatarUrl;
            saveConfig(panelConfig);

            fix();
            controlOverlay.classList.remove('qx-open');
            showToast('Changes Applied Successfully!');
        });

        document.getElementById('qx-cp-analytics-btn').addEventListener('click', () => {
            const box = document.getElementById('qx-cp-analytics-box');
            if (box.classList.contains('qx-open')) {
                box.classList.remove('qx-open');
                return;
            }
            const bal = getBalance() || 0;
            const startCap = parseFloat((window.qxCustomStartingCapital || '0').replace(/[^0-9.-]/g, '')) || 0;
            const net = bal - startCap;
            const tier = getTierInfo(bal);
            box.innerHTML = `
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                    <span style="color:#9ca3af;">Account Tier:</span>
                    <strong style="color:#fff;">${tier.label.replace(':', '').toUpperCase()} (${tier.profitText})</strong>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                    <span style="color:#9ca3af;">Initial Capital:</span>
                    <strong style="color:#fff;">${formatDollar(startCap)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="color:#9ca3af;">Net Profit / Loss:</span>
                    <strong style="color:${net < 0 ? '#ef4444' : '#0faf59'};">${net < 0 ? '-$' : '+$'}${Math.abs(net).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
            `;
            box.classList.add('qx-open');
        });

        document.getElementById('qx-cp-txns-btn').addEventListener('click', () => {
            controlOverlay.classList.remove('qx-open');
            document.getElementById('qx-tx-date').value = formatNowDateTime();
            document.getElementById('qx-tx-amount').value = '';
            refreshTxListModal();
            txOverlay.classList.add('qx-open');
        });

        document.getElementById('qx-tx-close').addEventListener('click', () => {
            txOverlay.classList.remove('qx-open');
        });
        txOverlay.addEventListener('click', e => {
            if (e.target === txOverlay) txOverlay.classList.remove('qx-open');
        });

        document.getElementById('qx-tx-add').addEventListener('click', () => {
            const type = document.getElementById('qx-tx-type').value;
            const amount = parseFloat(document.getElementById('qx-tx-amount').value);
            const method = document.getElementById('qx-tx-method').value;
            const dateTime = document.getElementById('qx-tx-date').value.trim() || formatNowDateTime();

            if (!Number.isFinite(amount) || amount <= 0) {
                showToast('Enter a valid amount!');
                return;
            }

            panelConfig.transactions.unshift({
                id: generateTxId(),
                type,
                amount,
                method,
                dateTime
            });
            saveConfig(panelConfig);
            document.getElementById('qx-tx-amount').value = '';
            document.getElementById('qx-tx-date').value = formatNowDateTime();
            refreshTxListModal();
            renderFakePaymentsHistory();
            showToast(`${type} $${amount.toFixed(2)} Added!`);
        });
    }

    // --- 13. ZERO-FLICKER LIVE GUARD (MAIN DOM + ALL SHADOW ROOTS) ---
    function sanitizeSubtree(rootNode) {
        if (!rootNode) return;
        if (rootNode.nodeType === Node.TEXT_NODE) {
            const updated = sanitizeDemoText(rootNode.nodeValue, rootNode.parentElement);
            if (updated !== rootNode.nodeValue) {
                rootNode.nodeValue = updated;
            }
            return;
        }
        if (rootNode.nodeType !== 1 && rootNode.nodeType !== 11) return;

        if (rootNode.nodeType === 1) {
            if (rootNode.closest('#qx-control-overlay, #qx-tx-overlay, #qx-gear-btn, #qx-toast, .qx-fake-tx-container, [data-qx-account="demo"]')) {
                return;
            }
            if (rootNode.shadowRoot) {
                attachShadowGuard(rootNode.shadowRoot);
                sanitizeSubtree(rootNode.shadowRoot);
            }
        }

        const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
            const txt = node.nodeValue;
            if (!txt || !/demo/i.test(txt)) continue;
            const updated = sanitizeDemoText(txt, node.parentElement);
            if (updated !== txt) {
                node.nodeValue = updated;
            }
        }

        if (rootNode.querySelectorAll) {
            rootNode.querySelectorAll('*').forEach(el => {
                if (el.shadowRoot) {
                    attachShadowGuard(el.shadowRoot);
                    sanitizeSubtree(el.shadowRoot);
                }
            });
        }
    }

    function syncTriggerShadow(trigger) {
        if (!trigger) return;

        const balanceNum = getBalance() || 0;
        const hasLiveSpoof = String(panelConfig.spoofLiveBalance ?? '').trim() !== '';
        const formattedLive = formatDollar(balanceNum);

        const currentIconId = getLevel(balanceNum);
        const iconSvgHtml = `
            <svg class="icon" style="width: 16px; height: 16px;">
                <use xlink:href="/profile/images/spritemap.svg#${currentIconId}" href="/profile/images/spritemap.svg#${currentIconId}"></use>
            </svg>
        `;

        if (trigger.shadowRoot) {
            attachShadowGuard(trigger.shadowRoot);
            sanitizeSubtree(trigger.shadowRoot);

            const balEl = trigger.shadowRoot.querySelector('.balance');
            if (balEl && hasLiveSpoof) {
                if (balEl.textContent.trim() !== formattedLive) {
                    window.__qxLastWrittenLiveStr = formattedLive;
                    balEl.textContent = formattedLive;
                }
            }

            const currentIcon = trigger.shadowRoot.querySelector('svg.icon, svg:first-of-type');
            if (currentIcon) {
                const useTag = currentIcon.querySelector('use');
                const curHref = useTag ? (useTag.getAttribute('href') || useTag.getAttribute('xlink:href') || '') : '';
                if (!useTag || !curHref.includes(currentIconId) || curHref.includes('icon-academic')) {
                    const targetHref = `/profile/images/spritemap.svg#${currentIconId}`;
                    if (useTag) {
                        useTag.setAttribute('href', targetHref);
                        useTag.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', targetHref);
                    } else {
                        currentIcon.outerHTML = iconSvgHtml;
                    }
                }
            } else {
                const rootDiv = trigger.shadowRoot.querySelector('.root');
                if (rootDiv && !rootDiv.querySelector('svg.icon')) {
                    rootDiv.insertAdjacentHTML('afterbegin', iconSvgHtml);
                }
            }

            const nameDiv = trigger.shadowRoot.querySelector('.name, div[class*="name"]');
            if (nameDiv) {
                if (nameDiv.textContent !== 'LIVE') nameDiv.textContent = 'LIVE';
                if (nameDiv.style.color !== 'rgb(15, 175, 89)') nameDiv.style.setProperty('color', '#0faf59', 'important');
                if (nameDiv.style.fontWeight !== '900') nameDiv.style.setProperty('font-weight', '900', 'important');
            }
        } else {
            const newTrigger = document.createElement('qx-usermenu-trigger');
            for (const attr of trigger.attributes) {
                newTrigger.setAttribute(attr.name, attr.value);
            }
            const shadow = newTrigger.attachShadow({ mode: 'open' });
            shadow.innerHTML = `
                <style>
                    :host { display: block; }
                    .root { display: flex; align-items: center; gap: 8px; cursor: pointer; }
                    .text { display: flex; align-items: center; gap: 6px; }
                    .name { color: #0faf59 !important; font-weight: 900 !important; font-size: 11px !important; text-transform: uppercase !important; }
                    .balance { color: #ffffff !important; font-size: 14px !important; font-weight: 700 !important; }
                    .icon { width: 16px; height: 16px; }
                </style>
                <div class="root">
                    ${iconSvgHtml}
                    <div class="text">
                        <div class="name">LIVE</div>
                        <div class="balance">${formattedLive}</div>
                    </div>
                    <svg class="caret" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            `;
            attachShadowGuard(shadow);
            if (trigger.parentNode) {
                trigger.parentNode.replaceChild(newTrigger, trigger);
            }
        }
    }

    function attachShadowGuard(shadow) {
        if (!shadow || shadow.__zeroxGuarded) return;
        shadow.__zeroxGuarded = true;
        window.__zeroxShadowRoots.add(shadow);

        if (!shadow.querySelector('style[data-qx-shadow-style="1"]')) {
            const s = document.createElement('style');
            s.setAttribute('data-qx-shadow-style', '1');
            s.textContent = `
                .name, div[class*="name"] { color: #0faf59 !important; font-weight: 900 !important; }
                svg.icon-academic { display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; }
            `;
            shadow.prepend(s);
        }

        let inShadowSync = false;
        const shadowObs = new MutationObserver(mutations => {
            if (inShadowSync) return;
            inShadowSync = true;
            try {
                for (const m of mutations) {
                    if (m.type === 'characterData') {
                        sanitizeSubtree(m.target);
                    } else if (m.type === 'childList') {
                        m.addedNodes.forEach(n => sanitizeSubtree(n));
                    }
                }
                const trigger = shadow.host?.tagName?.toLowerCase() === 'qx-usermenu-trigger'
                    ? shadow.host
                    : document.querySelector('qx-usermenu-trigger');
                if (trigger) syncTriggerShadow(trigger);
            } finally {
                inShadowSync = false;
            }
        });

        shadowObs.observe(shadow, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['href', 'xlink:href', 'class']
        });
        window.__zeroxShadowObservers.push(shadowObs);
    }

    window.__zeroxAttachShadowGuard = attachShadowGuard;

    function guardLive() {
        cleanUrl();
        cleanTitle();
        fixAccountLabels();

        if (document.body) {
            sanitizeSubtree(document.body);
        }

        const trigger = document.querySelector('qx-usermenu-trigger');
        if (trigger) syncTriggerShadow(trigger);

        document.querySelectorAll('qx-usermenu-trigger, .v2KPX, [class*="account"], div[class*="dropdown"], div[class*="menu"]').forEach(el => {
            if (!el.classList.contains('qx-ready')) el.classList.add('qx-ready');
        });
    }

    function fix() {
        initControlPanelUI();
        const balance = getBalance() || 0;
        guardLive();
        fixAccountAndIcon(balance);
        fixBalancesAndUI();
        fixLeaderboardUI();
        updateProfitLine();
        renderFakePaymentsHistory();
        cleanTitle();
    }

    window.__zeroxShadowRoots.forEach(sr => attachShadowGuard(sr));
    if (document.documentElement) {
        sanitizeSubtree(document.documentElement);
    }

    if (document.body) {
        fix();
    }

    let lastKnownBalance = null;
    window.qxBalanceInterval = setInterval(() => {
        if (!document.body) return;
        initControlPanelUI();
        const balance = getBalance();
        if (balance !== null && balance !== lastKnownBalance) {
            lastKnownBalance = balance;
            fixAccountAndIcon(balance);
            fixBalancesAndUI();
        } else if (balance !== null) {
            fixDropdownLevelCard(balance);
        }
        guardLive();
        fixLeaderboardUI();
        updateProfitLine();
        renderFakePaymentsHistory();
        cleanTitle();
    }, 100);

    window.qxProfitLine = setInterval(() => {
        if (document.body) updateProfitLine();
    }, 150);

    let qxHeavyScheduled = false;
    let qxInObserver = false;
    window.qxLiveObserver = new MutationObserver(mutations => {
        if (qxInObserver || !document.body) return;
        qxInObserver = true;
        try {
            for (const m of mutations) {
                if (m.type === 'characterData') {
                    sanitizeSubtree(m.target);
                } else if (m.type === 'childList') {
                    m.addedNodes.forEach(n => sanitizeSubtree(n));
                }
            }
            fixAccountLabels();
            const trigger = document.querySelector('qx-usermenu-trigger');
            if (trigger) syncTriggerShadow(trigger);
            document.querySelectorAll('qx-usermenu-trigger:not(.qx-ready), .v2KPX:not(.qx-ready), [class*="account"]:not(.qx-ready), div[class*="dropdown"]:not(.qx-ready), div[class*="menu"]:not(.qx-ready)').forEach(el => {
                el.classList.add('qx-ready');
            });
        } finally {
            qxInObserver = false;
        }

        if (!qxHeavyScheduled) {
            qxHeavyScheduled = true;
            requestAnimationFrame(() => {
                qxHeavyScheduled = false;
                const bal = getBalance() || 0;
                fixAccountAndIcon(bal);
                fixBalancesAndUI();
                fixLeaderboardUI();
                updateProfitLine();
                renderFakePaymentsHistory();
            });
        }
    });

    const observeTarget = document.documentElement || document.body;
    if (observeTarget) {
        window.qxLiveObserver.observe(observeTarget, { childList: true, subtree: true, characterData: true });
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            fix();
            window.qxLiveObserver.observe(document.documentElement || document.body, { childList: true, subtree: true, characterData: true });
        });
    }

    console.log("0X Premium Full Suite (Zero-Flicker + Full Control v2) Active!");
})();
