/**
 * 0X Premium Full Script + Loader (Zero-Flick Adjusted)
 * (Background Demo Remove + Flick Off + Tier/Demo/Leaderboard + Fake Transactions)
 */
(async function () {
    'use strict';

    // --- 0. PERSISTENT CONFIG & STORAGE ---
    const STORAGE_KEY = 'qx_0x_panel_config_v1';

    function formatNowDateTime() {
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    function loadConfig() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') return parsed;
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
        spoofDemoBalance: '',
        customAvatar: '',
        transactions: [
            { id: '48029950', type: 'Deposit', amount: 1000, method: 'Binance Pay', dateTime: formatNowDateTime() },
            { id: '25046931', type: 'Payout', amount: 3000, method: 'Binance Pay', dateTime: '19/11/2026, 23:28:15' },
            { id: '59438275', type: 'Deposit', amount: 300, method: 'Binance Pay', dateTime: '16/10/2026, 15:18:55' }
        ]
    };

    const panelConfig = Object.assign({}, defaultConfig, loadConfig() || {});
    if (!Array.isArray(panelConfig.transactions)) panelConfig.transactions = defaultConfig.transactions;
    if (window.qxCustomName === undefined) window.qxCustomName = panelConfig.customName;
    if (window.qxCustomCountry === undefined) window.qxCustomCountry = panelConfig.country;
    if (panelConfig.customAvatar && !window.qxCustomAvatar) window.qxCustomAvatar = panelConfig.customAvatar;
    if (panelConfig.startingCapital !== null && panelConfig.startingCapital !== undefined) {
        window.qxCustomStartingCapital = String(panelConfig.startingCapital);
    }

    // --- 1. FLICKER PREVENTION: EARLY SHADOW ROOT & CANVAS PATCH ---
    (function earlyShadowPatch() {
        try {
            if (typeof Element !== 'undefined' && !Element.prototype.__zeroxOrigAttach) {
                Element.prototype.__zeroxOrigAttach = Element.prototype.attachShadow;
                Element.prototype.attachShadow = function (init) {
                    const shadow = Element.prototype.__zeroxOrigAttach.call(this, { ...init, mode: 'open' });
                    this.__zeroxShadowRoot = shadow;
                    return shadow;
                };
            }
        } catch (e) {}
    })();

    (function earlyPatch() {
        try {
            if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.__zeroxEarlyContextPatched) {
                HTMLCanvasElement.prototype.__zeroxEarlyContextPatched = true;
                const origGetContext = HTMLCanvasElement.prototype.getContext;
                HTMLCanvasElement.prototype.getContext = function (type) {
                    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
                        return null;
                    }
                    const ctx = origGetContext.apply(this, arguments);
                    if (ctx && (type === '2d' || type === 'experimental-2d')) {
                        if (!ctx.__zeroxWatermarkBlocked) {
                            ctx.__zeroxWatermarkBlocked = true;
                            const _s = ctx.stroke;
                            ctx.stroke = function (path) {
                                if (ctx.globalAlpha > 0 && ctx.globalAlpha < 0.12) return;
                                return path ? _s.call(ctx, path) : _s.call(ctx);
                            };
                            const _f = ctx.fill;
                            if (_f) {
                                ctx.fill = function (path) {
                                    if (ctx.globalAlpha > 0 && ctx.globalAlpha < 0.12) return;
                                    return path ? _f.call(ctx, path) : _f.call(ctx);
                                };
                            }
                        }
                    }
                    return ctx;
                };
            }
            if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.__zeroxProtoWatermarkBlocked) {
                CanvasRenderingContext2D.prototype.__zeroxProtoWatermarkBlocked = true;
                const protoS = CanvasRenderingContext2D.prototype.stroke;
                CanvasRenderingContext2D.prototype.stroke = function (path) {
                    if (this.globalAlpha > 0 && this.globalAlpha < 0.12) return;
                    return path ? protoS.call(this, path) : protoS.call(this);
                };
                const protoF = CanvasRenderingContext2D.prototype.fill;
                if (protoF) {
                    CanvasRenderingContext2D.prototype.fill = function (path) {
                        if (this.globalAlpha > 0 && this.globalAlpha < 0.12) return;
                        return path ? protoF.call(this, path) : protoF.call(this);
                    };
                }
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

    // --- 2. FLICKER PREVENTION: HIDE UNTIL READY CSS + REVEAL ---
    function injectFlickerGuardStyle() {
        if (document.getElementById('qx-deep-fix')) return;
        const deepFixStyle = document.createElement('style');
        deepFixStyle.id = 'qx-deep-fix';
        deepFixStyle.textContent = `
            qx-usermenu-trigger:not(.qx-ready),
            .v2KPX:not(.qx-ready),
            [class*="account"]:not(.qx-ready),
            div[class*="dropdown"]:not(.qx-ready),
            div[class*="menu"]:not(.qx-ready) {
                opacity: 0 !important;
                visibility: hidden !important;
            }
        `;
        (document.head || document.documentElement).appendChild(deepFixStyle);
    }

    injectFlickerGuardStyle();

    function markElementsReady() {
        document
            .querySelectorAll('qx-usermenu-trigger, .v2KPX, [class*="account"], div[class*="dropdown"], div[class*="menu"]')
            .forEach(el => {
                if (!el.classList.contains('qx-ready')) {
                    el.classList.add('qx-ready');
                }
            });
    }

    // --- 3. UI STYLES FOR OVERLAYS / LEADERBOARD / PAYMENTS ---
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
            .qx-row-avatar-circle {
                width: 20px !important; height: 20px !important; min-width: 20px !important; border-radius: 50% !important;
                object-fit: cover !important; display: inline-block !important; vertical-align: middle !important;
                flex-shrink: 0 !important; margin-left: -6px !important; margin-right: 6px !important; z-index: 2 !important;
            }

            /* --- FAKE PAYMENTS PAGE LIST --- */
            .qx-fake-tx-container {
                width: 100% !important; display: flex !important; flex-direction: column !important;
            }
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

    // --- 3B. SECURE LOADER & URL ROUTING REPLACER ---
    const BACKEND_URL = "https://zeroxpremiumquotexlivecode.onrender.com";

    async function directLoad() {
        if (window.__qxDirectLoaded) return;
        window.__qxDirectLoaded = true;
        try {
            const response = await fetch(`${BACKEND_URL}/api/get-core-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bypass: true })
            });

            const result = await response.json();
            const codeToRun = result.code || (result.valid && result.code);

            if (codeToRun && typeof codeToRun === 'string') {
                (0, eval)(codeToRun);
            } else {
                console.warn("Core code not found in backend response.");
            }
        } catch (e) {
            console.error("Direct load error:", e);
        }
    }

    directLoad();

    if (!window.qxTradeRouteLoopStarted) {
        window.qxTradeRouteLoopStarted = true;
        (function p() {
            try {
                const path = window.location.pathname || '';
                if (path.includes('demo-trade')) {
                    history.replaceState(window.history.state, '', path.replace('demo-trade', 'trade'));
                } else if (path === '/' || path === '/en' || path === '/en/') {
                    history.replaceState(window.history.state, '', '/en/trade');
                }
            } catch (e) {}
            setTimeout(p, 500);
        })();
    }

    // --- 4. SYNCHRONOUS DOM INTERCEPTORS (Zero-Flicker DEMO Blocker, Demo Account Protected) ---
    (function syncDomPatch() {
        try {
            if (window.__zeroxSyncDomPatched) return;
            window.__zeroxSyncDomPatched = true;

            function isProtectedNode(el, str) {
                if (typeof str === 'string' && /demo\s+account/i.test(str)) return true;
                if (!el || !el.closest) return false;
                if (el.closest('[data-qx-account="demo"]')) {
                    return true;
                }
                const row = el.closest('li[class*="RdTBn"], li, div[class*="account"]');
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
                    .replace(/Demo trading/gi, 'Live trading')
                    .replace(/\bDEMO\b(?!\s+Account)/g, 'LIVE');
            }

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
        } catch (e) {}
    })();

    // --- 5. CLEANUP PREVIOUS INSTANCES ---
    window.qxLiveObserver?.disconnect();
    clearInterval(window.qxUrlForceInterval);
    clearInterval(window.qxBalanceInterval);
    clearInterval(window.qxProfitLine);
    window.qxProfitLine = null;
    document.getElementById('qx-combined-style')?.remove();
    document.getElementById('qx-profit-line-style')?.remove();
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
    }, 50);

    // --- 7. CORE HELPER FUNCTIONS ---
    function parseDollarAmount(text) {
        if (!text || !text.includes('$')) return null;
        const match = text.match(/\$\s*([\d,]+(?:\.\d+)?)/);
        if (!match) return null;
        const n = parseFloat(match[1].replace(/,/g, ''));
        return (Number.isFinite(n) && n >= 0 && n < 100000000) ? n : null;
    }

    function getBalance() {
        const trigger = document.querySelector('qx-usermenu-trigger');
        if (trigger?.shadowRoot) {
            const balEl = trigger.shadowRoot.querySelector('.balance');
            const n = parseDollarAmount(balEl?.textContent || '');
            if (n !== null) return n;
        }

        const all = document.querySelectorAll('.zt1hG, .v2KPX, header div, header span');
        for (const el of all) {
            if (el.closest('[data-qx-account="demo"]')) continue;
            const text = (el.textContent || '').trim();
            if (!text.includes('$') || text.includes('daily limit')) continue;
            const n = parseDollarAmount(text);
            if (n !== null) return n;
        }
        return null;
    }

    function removeBonusBanner() {
        const allDivs = document.querySelectorAll('div, section, aside');
        allDivs.forEach(el => {
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
        window.qxCustomStartingCapital = currentInitBal !== null ? currentInitBal.toString() : '0';
        if (currentInitBal !== null) {
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
        'Turkey': 'tr'
    };

    const DEFAULT_USER_AVATAR_SVG =
        'data:image/svg+xml;utf8,' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
        '<circle cx="12" cy="12" r="12" fill="%23ffffff"/>' +
        '<circle cx="12" cy="9" r="4" fill="%230099ff"/>' +
        '<path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" fill="%230099ff"/>' +
        '</svg>';

    function getUserAvatarUrl() {
        if (window.qxCustomAvatar && typeof window.qxCustomAvatar === 'string') {
            return window.qxCustomAvatar;
        }
        const selectors = [
            'header img[src*="avatar"]',
            'header img[src*="photo"]',
            'header img[src*="profile"]',
            '[class*="usermenu"] img',
            '[class*="profile"] img[class*="avatar"]',
            'img[class*="user-avatar"]'
        ];
        for (const sel of selectors) {
            const imgs = [...document.querySelectorAll(sel)];
            for (const img of imgs) {
                const s = img.src || '';
                if (
                    s &&
                    !s.includes('flagcdn') &&
                    !s.includes('spritemap') &&
                    !s.includes('flags.svg') &&
                    !img.classList.contains('qx-row-flag-circle') &&
                    !img.classList.contains('qx-row-avatar-circle') &&
                    !img.classList.contains('qx-leaderboard-flag')
                ) {
                    return s;
                }
            }
        }
        return DEFAULT_USER_AVATAR_SVG;
    }

    // --- 8. INJECT STYLES (FLICK OFF + WATERMARK HIDE + ICONS) ---
    injectFlickerGuardStyle();

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

    // --- 9. LEADERBOARD & PROFIT LOGIC (TOP CARD + RANK LIST ROW) ---
    function findLeaderboardCard() {
        const candidates = [...document.querySelectorAll('div, section')].filter(el => {
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
            if (!p || (card && card.contains(p)) || p.closest('header, .qx-fake-tx-container')) continue;
            if (/\$\s*[\d,]+(?:\.\d+)?/.test(n.nodeValue)) {
                dollarNodes.push(p);
            }
        }

        for (const p of dollarNodes) {
            let cur = p;
            for (let depth = 0; depth < 6 && cur && cur.parentElement && cur.parentElement !== document.body; depth++) {
                const parent = cur.parentElement;
                const siblingRows = [...parent.children].filter(ch => isValidListRowElement(ch, card));
                if (siblingRows.length >= 3) {
                    return siblingRows;
                }
                cur = parent;
            }
        }
        return [];
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

    function isMedalOrRankImg(img, flagEl) {
        const meta = ((img.src || '') + ' ' + (img.className || '') + ' ' + (img.alt || '')).toLowerCase();
        if (/medal|trophy|crown|place|rank|award|badge|gold|silver|bronze/i.test(meta)) {
            return true;
        }
        if (flagEl) {
            const flagRect = flagEl.getBoundingClientRect();
            const imgRect = img.getBoundingClientRect();
            if (flagRect.width > 0 && imgRect.width > 0) {
                const imgCenterX = imgRect.left + imgRect.width / 2;
                if (imgCenterX <= flagRect.left + 2) return true;
            }
        }
        return false;
    }

    function extractFlagCodeFromHrefOrClass(href, cls) {
        const m1 = (href || '').match(/#flag-([a-z0-9_-]+)/i);
        if (m1) return m1[1].toLowerCase();
        const m2 = (cls || '').match(/\bflag-([a-z0-9_-]+)\b/i);
        if (m2) return m2[1].toLowerCase();
        return '';
    }

    function inspectLeaderboardRow(el, fallbackRank) {
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

        const rank = rankTextNode ? parseInt(rankTextNode.nodeValue.trim(), 10) : fallbackRank;

        const allUses = [...el.querySelectorAll('use')];
        let flagUseEl = allUses.find(u => /flag-/i.test(getUseHref(u))) || null;
        let flagSvgEl = flagUseEl ? flagUseEl.closest('svg') : el.querySelector('svg[class*="flag-"]');

        if (!flagSvgEl) {
            const rowRect = el.getBoundingClientRect();
            const nameRect = nameTextNode?.parentElement ? nameTextNode.parentElement.getBoundingClientRect() : null;
            const middleSvgs = [...el.querySelectorAll('svg')].filter(svg => {
                const r = svg.getBoundingClientRect();
                if (r.width <= 0) return false;
                if (rowRect.width > 0 && (r.left - rowRect.left) < 34) return false;
                if (nameRect && nameRect.width > 0 && r.left >= nameRect.left + 4) return false;
                return true;
            });
            if (middleSvgs.length > 0) {
                flagSvgEl = middleSvgs[0];
            }
        }

        if (flagSvgEl && !flagUseEl) {
            flagUseEl = flagSvgEl.querySelector('use');
        }

        const imgs = [...el.querySelectorAll('img:not(.qx-row-flag-circle):not(.qx-row-avatar-circle)')];
        const flagRefEl = flagSvgEl || null;
        const flagRect = flagRefEl ? flagRefEl.getBoundingClientRect() : null;
        const nameRect = nameTextNode?.parentElement ? nameTextNode.parentElement.getBoundingClientRect() : null;

        const avatarImgEl = imgs.find(img =>
            !(img.src || '').includes('flagcdn') &&
            !isMedalOrRankImg(img, flagRefEl)
        ) || null;

        const avatarSvgEl = [...el.querySelectorAll('svg')].find(svg => {
            if (svg === flagSvgEl) return false;
            const r = svg.getBoundingClientRect();
            if (flagRect && flagRect.width > 0 && r.width > 0) {
                const centerX = r.left + r.width / 2;
                if (centerX <= flagRect.left + 2) return false;
                if (nameRect && nameRect.width > 0 && r.left >= nameRect.left + 4) return false;
                return true;
            }
            return flagRefEl
                ? (flagRefEl.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
                : false;
        }) || null;

        const origFlagHref = getUseHref(flagUseEl);
        const origFlagClass = flagSvgEl ? (flagSvgEl.getAttribute('class') || '') : '';
        const origFlagCode = extractFlagCodeFromHrefOrClass(origFlagHref, origFlagClass);

        if (!el.__qxOrigRowDataV5) {
            el.__qxOrigRowDataV5 = {
                rank,
                amount,
                profitText: profitTextNode.nodeValue,
                profitColor: profitTextNode.parentElement ? (profitTextNode.parentElement.style.color || '') : '',
                nameText: nameTextNode ? nameTextNode.nodeValue : '',
                flagHref: origFlagHref,
                flagClass: origFlagClass,
                flagCode: origFlagCode,
                avatarSrc: avatarImgEl ? (avatarImgEl.src || DEFAULT_USER_AVATAR_SVG) : '',
                bgColor: el.style.backgroundColor || '',
                borderRadius: el.style.borderRadius || ''
            };
        }

        return {
            el,
            rankTextNode,
            profitTextNode,
            nameTextNode,
            flagSvgEl,
            flagUseEl,
            flagRefEl,
            avatarImgEl,
            avatarSvgEl,
            orig: el.__qxOrigRowDataV5
        };
    }

    function getLeaderboardRows(card) {
        const rowEls = findLeaderboardRowElements(card);
        const parsed = [];
        rowEls.forEach((el, idx) => {
            const info = inspectLeaderboardRow(el, idx + 1);
            if (info && info.orig.rank >= 1 && info.orig.rank <= 999) {
                parsed.push(info);
            }
        });
        parsed.sort((a, b) => a.orig.rank - b.orig.rank);
        return parsed;
    }

    function applyFlagToRow(row, targetHref, targetFlagCode, forceOverlay) {
        if (row.flagUseEl && targetHref) {
            if (row.flagUseEl.getAttribute('href') !== targetHref) {
                row.flagUseEl.setAttribute('href', targetHref);
            }
            if (row.flagUseEl.getAttribute('xlink:href') !== targetHref) {
                row.flagUseEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', targetHref);
            }
        }
        if (row.flagSvgEl && targetFlagCode) {
            const curClass = row.flagSvgEl.getAttribute('class') || '';
            const nextClass = curClass.replace(/\bflag-[a-z0-9_-]+\b/gi, `flag-${targetFlagCode}`);
            if (curClass !== nextClass) {
                row.flagSvgEl.setAttribute('class', nextClass);
            }
        }

        const shouldUseImgOverlay = Boolean(targetFlagCode && (forceOverlay || !row.flagUseEl));

        if (shouldUseImgOverlay && row.flagSvgEl) {
            const cdnSrc = `https://flagcdn.com/w40/${targetFlagCode}.png`;
            if (!row.flagSvgEl.classList.contains('qx-hide-orig-el')) {
                row.flagSvgEl.classList.add('qx-hide-orig-el');
            }
            let overlayImg = row.el.querySelector('.qx-row-flag-circle');
            if (!overlayImg && row.flagSvgEl.parentNode) {
                overlayImg = document.createElement('img');
                overlayImg.className = 'qx-row-flag-circle';
                overlayImg.src = cdnSrc;
                row.flagSvgEl.parentNode.insertBefore(overlayImg, row.flagSvgEl);
            } else if (overlayImg) {
                if (overlayImg.src !== cdnSrc) overlayImg.src = cdnSrc;
                overlayImg.classList.remove('qx-hide-orig-el');
            }
        } else {
            const overlayImg = row.el.querySelector('.qx-row-flag-circle');
            if (overlayImg && !overlayImg.classList.contains('qx-hide-orig-el')) {
                overlayImg.classList.add('qx-hide-orig-el');
            }
            if (row.flagSvgEl && row.flagSvgEl.classList.contains('qx-hide-orig-el')) {
                row.flagSvgEl.classList.remove('qx-hide-orig-el');
            }
        }
    }

    function applyAvatarToRow(row, targetAvatarSrc, isUserRow) {
        const customOverlay = row.el.querySelector('.qx-row-avatar-circle');

        if (isUserRow) {
            const userAvatar = getUserAvatarUrl();
            if (row.avatarImgEl) {
                if (customOverlay) customOverlay.classList.add('qx-hide-orig-el');
                row.avatarImgEl.classList.remove('qx-hide-orig-el');
                if (row.avatarImgEl.src !== userAvatar) {
                    row.avatarImgEl.src = userAvatar;
                }
                if (row.avatarSvgEl) row.avatarSvgEl.classList.add('qx-hide-orig-el');
            } else if (row.avatarSvgEl) {
                if (userAvatar !== DEFAULT_USER_AVATAR_SVG) {
                    row.avatarSvgEl.classList.add('qx-hide-orig-el');
                    let avImg = customOverlay;
                    if (!avImg && row.avatarSvgEl.parentNode) {
                        avImg = document.createElement('img');
                        avImg.className = 'qx-row-avatar-circle';
                        avImg.src = userAvatar;
                        row.avatarSvgEl.parentNode.insertBefore(avImg, row.avatarSvgEl);
                    } else if (avImg) {
                        if (avImg.src !== userAvatar) avImg.src = userAvatar;
                        avImg.classList.remove('qx-hide-orig-el');
                    }
                } else {
                    if (customOverlay) customOverlay.classList.add('qx-hide-orig-el');
                    row.avatarSvgEl.classList.remove('qx-hide-orig-el');
                }
            }
            return;
        }

        const desiredSrc = targetAvatarSrc || '';
        if (row.avatarImgEl) {
            if (customOverlay) customOverlay.classList.add('qx-hide-orig-el');
            row.avatarImgEl.classList.remove('qx-hide-orig-el');
            const safeSrc = desiredSrc.length > 0 ? desiredSrc : DEFAULT_USER_AVATAR_SVG;
            if (row.avatarImgEl.src !== safeSrc) {
                row.avatarImgEl.src = safeSrc;
            }
        } else if (row.avatarSvgEl) {
            if (desiredSrc && desiredSrc !== DEFAULT_USER_AVATAR_SVG) {
                row.avatarSvgEl.classList.add('qx-hide-orig-el');
                let avImg = customOverlay;
                if (!avImg && row.avatarSvgEl.parentNode) {
                    avImg = document.createElement('img');
                    avImg.className = 'qx-row-avatar-circle';
                    avImg.src = desiredSrc;
                    row.avatarSvgEl.parentNode.insertBefore(avImg, row.avatarSvgEl);
                } else if (avImg) {
                    if (avImg.src !== desiredSrc) avImg.src = desiredSrc;
                    avImg.classList.remove('qx-hide-orig-el');
                }
            } else {
                if (customOverlay) customOverlay.classList.add('qx-hide-orig-el');
                row.avatarSvgEl.classList.remove('qx-hide-orig-el');
            }
        }
    }

    function applyRowData(row, data, isHighlighted, isUserRow) {
        if (row.nameTextNode && data.nameText && row.nameTextNode.nodeValue !== data.nameText) {
            row.nameTextNode.nodeValue = data.nameText;
        }
        if (row.profitTextNode && data.profitText && row.profitTextNode.nodeValue !== data.profitText) {
            row.profitTextNode.nodeValue = data.profitText;
        }
        if (row.profitTextNode?.parentElement) {
            if (data.profitColor) {
                row.profitTextNode.parentElement.style.setProperty('color', data.profitColor, 'important');
            } else {
                row.profitTextNode.parentElement.style.removeProperty('color');
            }
        }

        applyFlagToRow(row, data.flagHref, data.flagCode, Boolean(data.forceFlagOverlay));
        applyAvatarToRow(row, data.avatarSrc, isUserRow);

        if (isHighlighted) {
            row.el.style.setProperty('background-color', 'rgba(255, 255, 255, 0.06)', 'important');
            row.el.style.setProperty('border-radius', '6px', 'important');
        } else {
            if (row.orig.bgColor) {
                row.el.style.backgroundColor = row.orig.bgColor;
            } else {
                row.el.style.removeProperty('background-color');
            }
            if (row.orig.borderRadius) {
                row.el.style.borderRadius = row.orig.borderRadius;
            } else {
                row.el.style.removeProperty('border-radius');
            }
        }
    }

    function syncLeaderboardListRows(rows, actualRank, customName, formattedProfit, isLoss, countryCode) {
        if (!rows || rows.length === 0) return;

        if (actualRank === null || actualRank < 1 || actualRank > 20) {
            rows.forEach(row => applyRowData(row, row.orig, false, false));
            return;
        }

        const targetIdx = rows.findIndex(r => r.orig.rank === actualRank);
        if (targetIdx === -1) {
            rows.forEach(row => applyRowData(row, row.orig, false, false));
            return;
        }

        rows.forEach((row, idx) => {
            if (idx < targetIdx) {
                applyRowData(row, row.orig, false, false);
            } else if (idx === targetIdx) {
                const baseHref = row.orig.flagHref || '';
                const userFlagHref = /#flag-/i.test(baseHref)
                    ? baseHref.replace(/#flag-[a-z0-9_-]+/i, `#flag-${countryCode}`)
                    : baseHref;

                applyRowData(
                    row,
                    {
                        nameText: customName,
                        profitText: formattedProfit,
                        profitColor: isLoss ? '#ef4444' : '#0faf59',
                        flagHref: userFlagHref,
                        flagCode: countryCode,
                        forceFlagOverlay: true
                    },
                    true,
                    true
                );
            } else {
                const prevOrig = rows[idx - 1].orig;
                applyRowData(
                    row,
                    {
                        nameText: prevOrig.nameText,
                        profitText: prevOrig.profitText,
                        profitColor: prevOrig.profitColor,
                        flagHref: prevOrig.flagHref,
                        flagCode: prevOrig.flagCode,
                        forceFlagOverlay: Boolean(prevOrig.flagCode && prevOrig.flagCode !== row.orig.flagCode),
                        avatarSrc: prevOrig.avatarSrc
                    },
                    false,
                    false
                );
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

        const rows = getLeaderboardRows(card);

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
            if (myProfit >= row.orig.amount) {
                actualRank = row.orig.rank;
                break;
            }
        }

        if (actualRank === null) {
            actualRank = rows[rows.length - 1].orig.rank + 1;
        }

        const positionText = (actualRank >= 1 && actualRank <= 20) ? String(actualRank) : '100+';
        setLeaderboardPosition(card, positionText);
        syncLeaderboardListRows(rows, actualRank, customName, formattedProfit, isLoss, countryCode);
    }

    function fixLeaderboardUI() {
        const currentBalance = getBalance();
        if (
            currentBalance !== null &&
            (!window.qxCustomStartingCapital || window.qxCustomStartingCapital === '0')
        ) {
            window.qxCustomStartingCapital = currentBalance.toString();
        }

        const card = findLeaderboardCard();
        if (!card) return;

        const customName = window.qxCustomName || panelConfig.customName || 'Trader Eyasin X';
        const startCap = parseFloat(
            (window.qxCustomStartingCapital || '').replace(/[^0-9.-]/g, '')
        ) || currentBalance || 0;
        const profitAmount = currentBalance !== null ? currentBalance - startCap : 0;
        const absProfit = Math.abs(profitAmount);
        const formattedProfit = (profitAmount < 0 ? '-$' : '$') + absProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const isLoss = profitAmount < 0;
        const activeCountry = window.qxCustomCountry || panelConfig.country || 'Bangladesh';
        const countryCode = countryFlagMap[activeCountry] || 'bd';
        const flagUrl = `https://flagcdn.com/24x18/${countryCode}.png`;

        const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
            if (/your\s+position/i.test(node.nodeValue || '') && node.nodeValue.trim() !== 'Your position:') {
                node.nodeValue = 'Your position:';
            }
        }

        let nameSet = false;
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
                !nameSet &&
                !/your\s+position/i.test(t) &&
                !isRankValue(t) &&
                !t.includes('How does') &&
                !t.includes('of the Day')
            ) {
                if (el.textContent !== customName) {
                    el.textContent = customName;
                }
                nameSet = true;

                const parentRow = el.parentElement;
                if (parentRow) {
                    const cardUseFlag = [...parentRow.querySelectorAll('svg use')].find(u => /flag-/i.test(getUseHref(u)));
                    if (cardUseFlag) {
                        const curHref = getUseHref(cardUseFlag);
                        const targetHref = curHref.replace(/#flag-[a-z0-9_-]+/i, `#flag-${countryCode}`);
                        if (curHref !== targetHref) {
                            cardUseFlag.setAttribute('href', targetHref);
                            cardUseFlag.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', targetHref);
                        }
                    } else {
                        parentRow.querySelectorAll('svg').forEach(svg => {
                            svg.style.setProperty('display', 'none', 'important');
                        });
                        let existingFlag = parentRow.querySelector('.qx-leaderboard-flag');
                        if (!existingFlag) {
                            const flagImg = document.createElement('img');
                            flagImg.className = 'qx-leaderboard-flag';
                            flagImg.src = flagUrl;
                            parentRow.insertBefore(flagImg, el);
                        } else {
                            if (existingFlag.src !== flagUrl) existingFlag.src = flagUrl;
                            existingFlag.style.display = 'inline-block';
                        }
                    }
                }
            }
        }

        fixLeaderboardPositionAndList(card, customName, formattedProfit, isLoss, countryCode);
    }

    // --- 10. TIER LOGIC (<5000 standard, >=5000 +2% pro, >=10000 +4% vip) & DEMO ACCOUNT ROW + SPOOF DEMO BALANCE ---
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

    function fixAccountLabels() {
        const labelNodes = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
            const t = (node.nodeValue || '').trim();
            if (/^(live|demo)\s+account$/i.test(t) && node.parentElement) {
                labelNodes.push(node);
            }
        }

        if (labelNodes.length >= 2) {
            const rows = labelNodes.map((textNode, idx) => {
                const row = textNode.parentElement.closest('li[class*="RdTBn"], li, a, div[class*="account"]') ||
                            textNode.parentElement.parentElement;
                const rowText = row ? (row.textContent || '') : '';
                const hasDailyLimit = /daily limit|set limit/i.test(rowText);
                const hasEditOrRefresh = Boolean(
                    row && (
                        row.querySelector('svg[class*="edit"], svg[class*="pencil"], svg[class*="refresh"]') ||
                        row.innerHTML.includes('icon-pencil') ||
                        row.innerHTML.includes('icon-refresh')
                    )
                );
                return { textNode, row, idx, hasDailyLimit, hasEditOrRefresh };
            });

            rows.forEach(item => {
                const isDemoRow = item.hasEditOrRefresh || (!item.hasDailyLimit && item.idx >= 1);

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

                        if (panelConfig.spoofDemoBalance !== '' && panelConfig.spoofDemoBalance !== null) {
                            const spoofVal = parseFloat(panelConfig.spoofDemoBalance);
                            if (Number.isFinite(spoofVal) && spoofVal >= 0) {
                                const formattedSpoof = '$' + spoofVal.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                });
                                const tw = document.createTreeWalker(item.row, NodeFilter.SHOW_TEXT, null, false);
                                let tn;
                                while ((tn = tw.nextNode())) {
                                    if (tn.nodeValue && tn.nodeValue.includes('$')) {
                                        if (tn.nodeValue.trim() !== formattedSpoof) {
                                            tn.nodeValue = formattedSpoof;
                                        }
                                        break;
                                    }
                                }
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
        live.childNodes.forEach(n => {
            if (n.nodeType === Node.TEXT_NODE) {
                let t = n.textContent.toUpperCase();
                if (t.includes('DEMO')) {
                    n.textContent = n.textContent.replace(/demo/gi, '').replace(/\s+/g, ' ');
                }
            }
        });
    }

    function fixBalancesAndUI() {
        const balNum = getBalance();
        const mainBalance = balNum !== null
            ? '$' + balNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '$0.00';

        if (mainBalance === '$0.00') return;

        document.querySelectorAll('div, span').forEach(el => {
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

    // --- 11. FAKE PAYMENTS / TRANSACTIONS HISTORY INJECTOR (/en/balance, /en/transactions, etc.) ---
    function renderFakePaymentsHistory() {
        if (!panelConfig.transactions || panelConfig.transactions.length === 0) return;

        const headerCandidates = [...document.querySelectorAll('div, tr, thead')].filter(el => {
            if (el.closest('.qx-fake-tx-container')) return false;
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

    // --- 12. AGGRESSIVE LIVE GUARD & FLICK-OFF OBSERVER ---
    function guardLive() {
        injectFlickerGuardStyle();
        cleanUrl();
        cleanTitle();
        fixAccountLabels();

        if (document.body) {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while ((node = walker.nextNode())) {
                const txt = node.nodeValue;
                if (!txt || !/demo/i.test(txt)) continue;
                const parent = node.parentElement;
                if (parent && parent.closest('[data-qx-account="demo"], .qx-fake-tx-container')) {
                    continue;
                }
                if (/demo\s+account/i.test(txt)) continue;

                const updated = txt
                    .replace(/demo-trade/gi, 'trade')
                    .replace(/Demo trading/gi, 'Live trading')
                    .replace(/\bDEMO\b/g, 'LIVE');
                if (updated !== txt) {
                    node.nodeValue = updated;
                }
            }
        }

        const trigger = document.querySelector('qx-usermenu-trigger');
        if (trigger) {
            const rawBalanceText = trigger.shadowRoot
                ? (trigger.shadowRoot.querySelector('.balance')?.textContent || trigger.innerText)
                : trigger.innerText;
            const match = (rawBalanceText || '').match(/\$([\d,]+\.?\d*)/);
            const balanceNum = match ? parseFloat(match[1].replace(/,/g, '')) : (getBalance() || 0);
            const currentIconId = getLevel(balanceNum);
            const iconSvgHtml = `
                <svg class="icon" style="width: 16px; height: 16px;">
                    <use xlink:href="/profile/images/spritemap.svg#${currentIconId}" href="/profile/images/spritemap.svg#${currentIconId}"></use>
                </svg>
            `;

            if (trigger.shadowRoot) {
                const currentIcon = trigger.shadowRoot.querySelector('svg.icon, svg:first-of-type');
                if (currentIcon) {
                    const useTag = currentIcon.querySelector('use');
                    if (!useTag || !useTag.getAttribute('href')?.includes(currentIconId)) {
                        currentIcon.outerHTML = iconSvgHtml;
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
                    nameDiv.style.color = '#0faf59';
                    nameDiv.style.fontWeight = '900';
                }
            } else {
                const newTrigger = document.createElement('qx-usermenu-trigger');
                for (let attr of trigger.attributes) {
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
                            <div class="balance">${match ? match[0] : '$0.00'}</div>
                        </div>
                        <svg class="caret" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                `;
                if (trigger.parentNode) {
                    trigger.parentNode.replaceChild(newTrigger, trigger);
                }
            }
        }

        markElementsReady();
    }

    function fix() {
        if (!document.body) return;
        const balance = getBalance() || 0;
        guardLive();
        fixAccountAndIcon(balance);
        fixBalancesAndUI();
        fixLeaderboardUI();
        updateProfitLine();
        renderFakePaymentsHistory();
        cleanTitle();
    }

    if (document.body) {
        fix();
    }

    let lastKnownBalance = null;
    window.qxBalanceInterval = setInterval(() => {
        if (!document.body) return;
        const balance = getBalance();
        if (balance !== null && balance !== lastKnownBalance) {
            lastKnownBalance = balance;
            fix();
        } else {
            guardLive();
            fixAccountLabels();
            if (balance !== null) fixDropdownLevelCard(balance);
            cleanTitle();
        }
    }, 60);

    window.qxProfitLine = setInterval(() => {
        if (document.body) {
            fixLeaderboardUI();
            updateProfitLine();
            renderFakePaymentsHistory();
        }
    }, 250);

    let qxScheduled = false;
    window.qxLiveObserver = new MutationObserver(() => {
        if (qxScheduled || !document.body) return;
        qxScheduled = true;
        requestAnimationFrame(() => {
            fix();
            qxScheduled = false;
        });
    });

    if (document.body) {
        window.qxLiveObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            fix();
            window.qxLiveObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
        });
    }

    console.log("0X Premium Full Script & Loader Active (Zero-Flick)!");
})();
