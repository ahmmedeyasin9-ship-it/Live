/**
 * Quotex Demo-to-Live Pro — Server Release Script (client.js)
 * Host this file on your remote server (demotoliveadmin.lovable.app) as client.js
 * Executed dynamically after license verification via AppLicense loader.
 */
(function () {
  'use strict';

  // --- 0. CLEANUP PREVIOUS INSTANCES ---
  try {
    if (window.qxLiveObserver) window.qxLiveObserver.disconnect();
    clearInterval(window.qxUrlForceInterval);
    clearInterval(window.qxBalanceInterval);
    clearInterval(window.qxProfitLine);
    clearInterval(window.qxPaymentInterval);
    window.qxProfitLine = null;
    ['qx-combined-style', 'qx-profit-line-style', 'qx-hide-orig-style', 'qx-tx-table-style'].forEach((id) => {
      document.getElementById(id)?.remove();
    });
  } catch (e) {}

  // --- 1. CUSTOM UI EXCLUSION HELPER ---
  function isCustomUiEl(node) {
    if (!node) return false;
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el || typeof el.closest !== 'function') return false;
    return !!(
      el.closest(
        '#settingsPopup, #qxTxModal, #qxAnalyticsModal, #qxNativeAlertModal, .swal2-container, .message-popup, #centeredDeveloperMessage, .qx-fake-tx-container, [data-qx-account="demo"]'
      )
    );
  }

  // --- 2. SYNCHRONOUS DOM INTERCEPTORS (Anti-Flicker Backup) ---
  (function syncDomPatch() {
    try {
      if (typeof Element !== 'undefined' && !Element.prototype.__zeroxOrigAttach) {
        Element.prototype.__zeroxOrigAttach = Element.prototype.attachShadow;
        Element.prototype.attachShadow = function (init) {
          const shadow = Element.prototype.__zeroxOrigAttach.call(this, Object.assign({}, init || {}, { mode: 'open' }));
          this.__zeroxShadowRoot = shadow;
          if (this.localName === 'qx-usermenu-trigger') {
            window.__qxUsermenuShadow = shadow;
          }
          return shadow;
        };
      }

      if (typeof Element !== 'undefined' && !Element.prototype.__qxSyncHtmlPatched) {
        Element.prototype.__qxSyncHtmlPatched = true;
        const origInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        if (origInnerHTML && origInnerHTML.set) {
          Object.defineProperty(Element.prototype, 'innerHTML', {
            configurable: true,
            set: function (html) {
              if (typeof html === 'string' && /demo/i.test(html) && !isCustomUiEl(this)) {
                if (!/Demo\s+Account/i.test(html) && !/yBslY|RDtBn/i.test(html)) {
                  html = html
                    .replace(/demo-trade/gi, 'trade')
                    .replace(/Demo trading/gi, 'Live trading')
                    .replace(/\bDEMO\b(?!\s+Account)/g, 'LIVE');
                }
              }
              return origInnerHTML.set.call(this, html);
            },
            get: function () {
              return origInnerHTML.get.call(this);
            }
          });
        }
      }

      if (typeof Node !== 'undefined' && !Node.prototype.__qxSyncTextPatched) {
        Node.prototype.__qxSyncTextPatched = true;
        const origTextContent = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
        if (origTextContent && origTextContent.set) {
          Object.defineProperty(Node.prototype, 'textContent', {
            configurable: true,
            set: function (text) {
              if (
                typeof text === 'string' &&
                /demo/i.test(text) &&
                !isCustomUiEl(this) &&
                !this.parentElement?.closest?.('li.RDtBn:nth-of-type(2), div[class*="account"]:nth-of-type(2)')
              ) {
                if (!/Demo\s+Account/i.test(text)) {
                  text = text
                    .replace(/demo-trade/gi, 'trade')
                    .replace(/Demo trading/gi, 'Live trading')
                    .replace(/\bDEMO\b(?!\s+Account)/g, 'LIVE');
                }
              }
              return origTextContent.set.call(this, text);
            },
            get: function () {
              return origTextContent.get.call(this);
            }
          });
        }
      }
    } catch (e) {}
  })();

  // --- 3. BACKGROUND DEMO WATERMARK BLOCKER (Canvas2D + WebGL) ---
  (function watermarkBlocker() {
    try {
      if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.__zeroxEarlyContextPatched) {
        HTMLCanvasElement.prototype.__zeroxEarlyContextPatched = true;
        const origGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type) {
          if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
          const ctx = origGetContext.apply(this, arguments);
          if (ctx && (type === '2d' || type === 'experimental-2d') && !ctx.__zeroxWatermarkBlocked) {
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

  // --- 4. URL & TITLE GUARDS ---
  const cleanUrl = () => {
    if (window.location.pathname.includes('demo-trade')) {
      try {
        const cleanPath = window.location.pathname.replace(/demo-trade/gi, 'trade') + window.location.search;
        window.history.replaceState(window.history.state, '', cleanPath);
      } catch (e) {}
    }
  };

  const cleanTitle = () => {
    if (document.title && document.title.toLowerCase().includes('demo')) {
      document.title = document.title.replace(/demo/gi, 'Live');
    }
  };

  if (!window.qxHistoryPatched) {
    window.qxHistoryPatched = true;
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function (state, title, url) {
      if (url && typeof url === 'string' && url.includes('demo-trade')) {
        url = url.replace(/demo-trade/gi, 'trade');
      }
      const res = originalPushState.call(this, state, title, url);
      cleanTitle();
      return res;
    };
    history.replaceState = function (state, title, url) {
      if (url && typeof url === 'string' && url.includes('demo-trade')) {
        url = url.replace(/demo-trade/gi, 'trade');
      }
      const res = originalReplaceState.call(this, state, title, url);
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
        window.history.replaceState({}, '', window.location.href.replace(/demo-trade/gi, 'trade'));
      } catch (e) {}
    }
    cleanTitle();
  }, 10);

  // --- 5. STYLES ---
  const injectStyles = () => {
    const target = document.head || document.documentElement;
    if (!target) return;

    const combinedStyle = document.createElement('style');
    combinedStyle.id = 'qx-combined-style';
    combinedStyle.textContent = `
      .v2KPX, qx-usermenu-trigger {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
      }
      .qx-level-icon {
        width: 16px !important;
        height: 16px !important;
        min-width: 16px !important;
        max-width: 16px !important;
        min-height: 16px !important;
        max-height: 16px !important;
        display: inline-block !important;
        flex: 0 0 16px !important;
        margin-left: -10px !important;
        margin-right: 8px !important;
        padding: 0 !important;
        vertical-align: middle !important;
      }
      .qx-leaderboard-flag {
        width: 18px !important;
        height: 18px !important;
        object-fit: cover !important;
        border-radius: 50% !important;
        margin-right: 6px !important;
        vertical-align: middle !important;
        display: inline-block !important;
        flex-shrink: 0 !important;
      }
      .qx-row-flag-circle {
        width: 18px !important;
        height: 18px !important;
        border-radius: 50% !important;
        object-fit: cover !important;
        display: inline-block !important;
        flex-shrink: 0 !important;
        vertical-align: middle !important;
        margin-right: 4px !important;
      }
      .qx-row-avatar-circle {
        width: 22px !important;
        height: 22px !important;
        border-radius: 50% !important;
        object-fit: cover !important;
        display: inline-block !important;
        flex-shrink: 0 !important;
        vertical-align: middle !important;
        margin-right: 6px !important;
        background: #1e293b !important;
      }
      .qx-hide-orig-el {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        opacity: 0 !important;
        position: absolute !important;
        pointer-events: none !important;
      }
      svg.icon-academic, .v2KPX svg:not(.qx-level-icon) {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
      }
      .usFyP, [class*="watermark"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
    `;
    target.appendChild(combinedStyle);

    const profitLineStyle = document.createElement('style');
    profitLineStyle.id = 'qx-profit-line-style';
    profitLineStyle.textContent = `
      .qx-profit-card { position: relative !important; }
      .qx-profit-line {
        position: absolute !important;
        height: 2px !important;
        left: 10px !important;
        top: 39px !important;
        width: 0%;
        background: #0faf59 !important;
        z-index: 9999 !important;
        pointer-events: none !important;
        transition: width .35s ease, background-color .2s ease !important;
      }
    `;
    target.appendChild(profitLineStyle);

    const txTableStyle = document.createElement('style');
    txTableStyle.id = 'qx-tx-table-style';
    txTableStyle.textContent = `
      .qx-fake-tx-container {
        width: 100%;
        margin-top: 12px;
        border-radius: 10px;
        overflow: hidden;
        background: rgba(24, 29, 44, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.08);
        font-family: inherit;
        color: #e2e8f0;
      }
      .qx-fake-tx-header, .qx-fake-tx-row {
        display: grid;
        grid-template-columns: 1.2fr 1fr 1fr 1.4fr 1.4fr;
        gap: 10px;
        align-items: center;
        padding: 12px 16px;
        font-size: 13px;
      }
      .qx-fake-tx-header {
        background: rgba(255, 255, 255, 0.04);
        color: #94a3b8;
        font-size: 12px;
        font-weight: 600;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      }
      .qx-fake-tx-row {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      .qx-fake-tx-row:last-child { border-bottom: none; }
      .qx-tx-status-ok {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #0faf59;
        font-weight: 600;
      }
      @media (max-width: 768px) {
        .qx-fake-tx-header { display: none; }
        .qx-fake-tx-row {
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding: 12px;
        }
      }
    `;
    target.appendChild(txTableStyle);
  };
  injectStyles();

  // --- 6. CONFIG & DATA HELPERS ---
  const DEFAULT_USER_AVATAR_SVG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><rect width="36" height="36" rx="18" fill="#1e293b"/><circle cx="18" cy="14" r="6" fill="#38bdf8"/><path d="M7 31c2.5-5.5 7-8 11-8s8.5 2.5 11 8" fill="#38bdf8"/></svg>'
    );

  function getSettings() {
    let cfg = {};
    try {
      const raw = localStorage.getItem('qx_0x_panel_config_v1');
      if (raw) cfg = JSON.parse(raw) || {};
    } catch (e) {}

    const demoReset = localStorage.getItem('demoBalanceReset') === '1';
    const rawDemoBal = localStorage.getItem('demoBalance');
    const customDemoBal = !demoReset && rawDemoBal !== null && rawDemoBal !== '' ? parseFloat(rawDemoBal) : NaN;

    const lbName = (localStorage.getItem('leaderboardName') || cfg.customName || window.qxCustomName || 'Trader Eyasin X').trim() || 'Trader Eyasin X';
    const lbBalRaw = localStorage.getItem('leaderboardBalance');
    const lbBalOverride = lbBalRaw !== null && lbBalRaw !== '' ? parseFloat(lbBalRaw) : NaN;
    const countryFlag = (localStorage.getItem('countryFlag') || cfg.countryFlag || 'bd').toLowerCase();
    const profilePhoto = (localStorage.getItem('profilePhotoUrl') || cfg.customAvatar || '').trim();

    return {
      lbName,
      lbBalOverride,
      countryFlag,
      profilePhoto,
      customDemoBal: Number.isFinite(customDemoBal) ? customDemoBal : null
    };
  }

  function getUserAvatarUrl() {
    const { profilePhoto } = getSettings();
    if (profilePhoto) return profilePhoto;
    try {
      const imgs = document.querySelectorAll('header img, .RyAkb img, qx-usermenu-trigger img');
      for (const img of imgs) {
        if (img.src && !img.src.includes('flag') && !img.closest('[class*="leader"]')) {
          return img.src;
        }
      }
    } catch (e) {}
    return DEFAULT_USER_AVATAR_SVG;
  }

  function formatUsd(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return '$0.00';
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getUsermenuShadow() {
    if (typeof window.__qxEnsureUsermenuShadow === 'function') {
      const s = window.__qxEnsureUsermenuShadow();
      if (s) return s;
    }
    const trig = document.querySelector('qx-usermenu-trigger');
    return trig ? trig.shadowRoot || trig.__zeroxShadowRoot || window.__qxUsermenuShadow || null : null;
  }

  function getBalance() {
    const { customDemoBal } = getSettings();
    if (customDemoBal !== null) return customDemoBal;

    const shadow = getUsermenuShadow();
    if (shadow) {
      const balEl = shadow.querySelector('.balance, .text .balance');
      if (balEl) {
        const clean = (balEl.textContent || '').replace(/,/g, '').replace('$', '').replace(/LIVE|DEMO/gi, '').trim();
        const n = parseFloat(clean);
        if (Number.isFinite(n) && n >= 0 && n < 100000000) return n;
      }
    }

    const all = document.querySelectorAll('.zt1hG, header div, header span, .v2KPX, .grOBD b.YnoT0');
    for (const el of all) {
      if (isCustomUiEl(el)) continue;
      const text = (el.textContent || '').trim();
      if (!text.includes('$')) continue;
      const clean = text.replace(/,/g, '').replace('$', '').replace(/LIVE|DEMO/gi, '').trim();
      const n = parseFloat(clean);
      if (Number.isFinite(n) && n >= 0 && n < 100000000) return n;
    }
    return null;
  }

  const initBal = getBalance();
  if (!localStorage.getItem('qxCustomStartingCapital') && initBal !== null) {
    localStorage.setItem('qxCustomStartingCapital', String(initBal));
  }

  function getStartingCapital(fallbackBal) {
    const stored = parseFloat(localStorage.getItem('qxCustomStartingCapital') || '');
    if (Number.isFinite(stored) && stored >= 0) return stored;
    if (fallbackBal !== null && Number.isFinite(fallbackBal)) {
      localStorage.setItem('qxCustomStartingCapital', String(fallbackBal));
      return fallbackBal;
    }
    return 0;
  }

  // --- 7. TIER LOGIC (<5000, >=5000 PRO +2%, >=10000 VIP +4%) ---
  function getTierInfo(balance) {
    const b = Number(balance) || 0;
    if (b >= 10000) {
      return {
        label: 'VIP:',
        profitText: '+4% profit',
        iconId: 'icon-profile-level-vip',
        color: '#f59e0b'
      };
    }
    if (b >= 5000) {
      return {
        label: 'PRO:',
        profitText: '+2% profit',
        iconId: 'icon-profile-level-pro',
        color: '#38bdf8'
      };
    }
    return {
      label: 'STANDARD:',
      profitText: '+0% profit',
      iconId: 'icon-profile-level-standart',
      color: '#0faf59'
    };
  }

  function updateDropdownTierCard(balance) {
    const tier = getTierInfo(balance);
    const href = '/profile/images/spritemap.svg#' + tier.iconId;

    document.querySelectorAll('.VgpLl').forEach((profitEl) => {
      if (isCustomUiEl(profitEl)) return;
      if (profitEl.textContent.trim() !== tier.profitText) {
        profitEl.textContent = tier.profitText;
      }
      const prev = profitEl.previousElementSibling;
      if (prev && /standard|pro|vip/i.test(prev.textContent || '')) {
        if (prev.textContent.trim().toUpperCase() !== tier.label) {
          prev.textContent = tier.label;
        }
      }
      const cardRoot = profitEl.parentElement && profitEl.parentElement.parentElement;
      if (cardRoot) {
        const svgs = cardRoot.querySelectorAll('svg');
        for (const svg of svgs) {
          if (svg.classList.contains('icon-eye') || svg.closest('.Wo6tF')) continue;
          const use = svg.querySelector('use');
          if (use) {
            if (use.getAttribute('href') !== href) use.setAttribute('href', href);
            if (use.getAttribute('xlink:href') !== href) use.setAttribute('xlink:href', href);
          }
          break;
        }
      }
    });
  }

  // --- 8. DROPDOWN ACCOUNT LABELS & BALANCE SPOOF ---
  function fixAccountLabels() {
    const { customDemoBal } = getSettings();
    const formattedCustomBal = customDemoBal !== null ? formatUsd(customDemoBal) : null;

    const shadow = getUsermenuShadow();
    if (shadow && formattedCustomBal) {
      const balEl = shadow.querySelector('.balance, .text .balance');
      if (balEl && balEl.textContent !== formattedCustomBal) {
        balEl.textContent = formattedCustomBal;
      }
    }

    const accountListItems = document.querySelectorAll('li[class*="RDtBn"], .grOBD li, div[class*="account"]');
    const validItems = [...accountListItems].filter((el) => !isCustomUiEl(el) && /(?:Live|Demo)\s+Account/i.test(el.textContent || ''));

    validItems.forEach((item, idx) => {
      const isSecondDemoRow = validItems.length >= 2 ? idx === 1 : !!item.querySelector('a[href*="demo-trade"], input[value="demo"]');
      const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT, null, false);
      let n;
      if (isSecondDemoRow) {
        item.setAttribute('data-qx-account', 'demo');
        while ((n = walker.nextNode())) {
          if (/live\s+account/i.test(n.nodeValue)) {
            n.nodeValue = n.nodeValue.replace(/live\s+account/gi, 'Demo Account');
          } else if (/\bLIVE\b/i.test(n.nodeValue) && !/demo/i.test(n.nodeValue)) {
            n.nodeValue = n.nodeValue.replace(/\bLIVE\b/gi, 'Demo');
          }
        }
        const spanRuj = item.querySelector('.RujZE');
        if (spanRuj) spanRuj.style.setProperty('display', 'none', 'important');
        const inputRadio = item.querySelector('input[type="radio"]');
        if (inputRadio) inputRadio.checked = false;
        const linkEl = item.querySelector('a');
        if (linkEl) linkEl.classList.remove('active');
      } else {
        item.removeAttribute('data-qx-account');
        while ((n = walker.nextNode())) {
          if (/demo\s+account/i.test(n.nodeValue)) {
            n.nodeValue = n.nodeValue.replace(/demo\s+account/gi, 'Live Account');
          } else if (/\bDEMO\b/i.test(n.nodeValue)) {
            n.nodeValue = n.nodeValue.replace(/\bDEMO\b/gi, 'Live');
          }
        }
        const spanRuj = item.querySelector('.RujZE');
        if (spanRuj) {
          spanRuj.style.display = 'inline-block';
          spanRuj.style.visibility = 'visible';
          spanRuj.style.opacity = '1';
        }
        const inputRadio = item.querySelector('input[type="radio"]');
        if (inputRadio) inputRadio.checked = true;
        const linkEl = item.querySelector('a');
        if (linkEl) linkEl.classList.add('active');
        if (formattedCustomBal) {
          const balNode = item.querySelector('b.YnoT0, b');
          if (balNode && balNode.textContent !== formattedCustomBal) {
            balNode.textContent = formattedCustomBal;
          }
        }
      }
    });
  }

  function fixAccountAndIcon(balance) {
    fixAccountLabels();
    updateDropdownTierCard(balance);

    document.querySelectorAll('div, section, aside').forEach((el) => {
      if (isCustomUiEl(el)) return;
      const text = el.textContent || '';
      if ((text.includes('50% bonus') || text.includes('bonus on your deposit') || text.includes('Get a 50%')) && el.offsetHeight > 0 && el.offsetHeight < 400) {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    const tier = getTierInfo(balance);
    const href = '/profile/images/spritemap.svg#' + tier.iconId;
    const live = [...document.querySelectorAll('.v2KPX')].find((e) => {
      if (isCustomUiEl(e)) return false;
      const t = e.textContent.trim().toUpperCase();
      return t.includes('DEMO') || t.includes('LIVE');
    });
    if (!live) return;

    live.querySelectorAll('svg.icon-academic, svg:not(.qx-level-icon)').forEach((el) => el.remove());
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
        use.setAttribute('xlink:href', href);
      }
    }
    live.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE && /demo/i.test(n.textContent)) {
        n.textContent = n.textContent.replace(/demo/gi, '').replace(/\s+/g, ' ');
      }
    });
  }

  function fixBalancesAndUI() {
    const curBal = getBalance();
    const formatted = curBal !== null ? formatUsd(curBal) : null;
    if (!formatted) return;

    document.querySelectorAll('div, span').forEach((el) => {
      if (isCustomUiEl(el)) return;
      if (el.textContent && el.textContent.trim() === 'The daily limit is not set') {
        const parent = el.parentElement;
        if (parent) {
          const priceTag = parent.querySelector('span, div');
          if (priceTag && priceTag.textContent.includes('$') && priceTag.textContent !== formatted) {
            priceTag.textContent = formatted;
          } else {
            const prevEl = el.previousElementSibling;
            if (prevEl && prevEl.textContent.includes('$') && prevEl.textContent !== formatted) {
              prevEl.textContent = formatted;
            }
          }
        }
      }
    });
  }

  // --- 9. LIVE GUARD & HEADER SHADOW PATCH ---
  function guardLive() {
    cleanUrl();
    cleanTitle();
    fixAccountLabels();

    if (document.body) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.parentElement || isCustomUiEl(node.parentElement)) continue;
        const txt = node.nodeValue;
        if (txt && (txt.includes('demo-trade') || (/\bDEMO\b/.test(txt) && !/Demo\s+Account/i.test(txt)))) {
          node.nodeValue = txt
            .replace(/demo-trade/gi, 'trade')
            .replace(/Demo trading/gi, 'Live trading')
            .replace(/\bDEMO\b(?!\s+Account)/g, 'LIVE');
        }
      }
    }

    const trigger = document.querySelector('qx-usermenu-trigger');
    if (trigger) {
      const shadow = getUsermenuShadow();
      const bal = getBalance() || 0;
      const tier = getTierInfo(bal);
      const iconSvgHtml = `<svg class="icon" style="width:16px;height:16px;fill:${tier.color};"><use xlink:href="/profile/images/spritemap.svg#${tier.iconId}" href="/profile/images/spritemap.svg#${tier.iconId}"></use></svg>`;

      if (shadow) {
        const currentIcon = shadow.querySelector('svg.icon, svg:first-of-type');
        if (currentIcon) {
          const useTag = currentIcon.querySelector('use');
          if (!useTag || !(useTag.getAttribute('href') || '').includes(tier.iconId)) {
            currentIcon.outerHTML = iconSvgHtml;
          }
        } else {
          const rootDiv = shadow.querySelector('.root');
          if (rootDiv && !rootDiv.querySelector('svg.icon')) {
            rootDiv.insertAdjacentHTML('afterbegin', iconSvgHtml);
          }
        }
        const nameDiv = shadow.querySelector('.name, div[class*="name"]');
        if (nameDiv) {
          if (nameDiv.textContent !== 'LIVE') nameDiv.textContent = 'LIVE';
          nameDiv.classList.remove('demo');
          nameDiv.classList.add('live');
          nameDiv.style.color = '#0faf59';
          nameDiv.style.fontWeight = '900';
        }
      }
    }

    document.querySelectorAll('qx-usermenu-trigger, .v2KPX, [class*="account"]').forEach((el) => {
      if (!isCustomUiEl(el)) el.classList.add('qx-ready');
    });
  }

  // --- 10. LEADERBOARD ENGINE (TOP CARD + MATCHING ROW SHIFT + FLAG & AVATAR + MEDAL PROTECTION) ---
  function findLeaderboardCard() {
    const candidates = [...document.querySelectorAll('div, section')].filter((el) => {
      if (isCustomUiEl(el)) return false;
      const t = (el.innerText || '').trim();
      return /your\s+position/i.test(t) && t.includes('$') && !/leader\s*board/i.test(t) && t.length < 360;
    });
    candidates.sort((a, b) => (a.innerText || '').length - (b.innerText || '').length);
    return candidates[0] || null;
  }

  function isRankValue(val) {
    return val === '-' || val === '100+' || /^\d{1,3}$/.test(val);
  }

  function findRowFlagSvg(row) {
    if (row.__qxOrigFlagSvg && row.contains(row.__qxOrigFlagSvg)) return row.__qxOrigFlagSvg;
    const explicit = row.querySelector('svg[class*="flag"], svg use[href*="flag"], svg use[xlink\\:href*="flag"]');
    if (explicit) {
      const found = explicit.closest('svg') || explicit;
      row.__qxOrigFlagSvg = found;
      return found;
    }
    const svgs = [...row.querySelectorAll('svg')];
    if (svgs.length === 0) return null;
    const chosen =
      svgs.find((s) => {
        const r = s.getBoundingClientRect();
        return r.width > 10 && r.width <= 34 && r.height > 10 && r.height <= 34;
      }) || svgs[0];
    if (chosen) row.__qxOrigFlagSvg = chosen;
    return chosen;
  }

  function isMedalOrRankImg(img, flagRefEl) {
    const cls = (img.className || '') + ' ' + (img.getAttribute('alt') || '') + ' ' + (img.getAttribute('src') || '');
    if (/medal|trophy|crown|place|rank|gold|silver|bronze/i.test(cls)) return true;
    if (flagRefEl) {
      const fr = flagRefEl.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      if (fr.width > 0 && ir.width > 0 && ir.left + ir.width / 2 <= fr.left + 2) {
        return true;
      }
    }
    return false;
  }

  function findRowAvatarImg(row, flagRefEl) {
    const imgs = [...row.querySelectorAll('img:not(.qx-row-flag-circle):not(.qx-row-avatar-circle):not(.qx-leaderboard-flag)')];
    return imgs.find((img) => !isMedalOrRankImg(img, flagRefEl)) || null;
  }

  function findLeaderboardRowElements(card) {
    const rows = [];
    const seen = new Set();
    document.querySelectorAll('div, li, tr').forEach((el) => {
      if (isCustomUiEl(el)) return;
      if (card && card.contains(el)) return;
      if (el.querySelector('div, li, tr') && [...el.children].some((c) => /^\d{1,3}\s+.*\$/.test((c.innerText || '').trim()))) {
        return;
      }
      const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
      if (!text || text.length > 180) return;
      const match = text.match(/^(\d{1,3})\s+(.+?)\s+(\$[\d,]+(?:\.\d+)?(?:\+)?)\s*$/);
      if (!match) return;
      const rank = parseInt(match[1], 10);
      if (!Number.isFinite(rank) || rank < 1 || rank > 50) return;
      if (seen.has(el)) return;
      seen.add(el);
      rows.push({
        el,
        rank,
        name: match[2].trim(),
        amountStr: match[3].trim(),
        amountNum: parseFloat(match[3].replace(/[$,+]/g, '')) || 0
      });
    });
    rows.sort((a, b) => a.rank - b.rank);
    const byRank = new Map();
    for (const r of rows) {
      if (!byRank.has(r.rank) || r.el.innerHTML.length < byRank.get(r.rank).el.innerHTML.length) {
        byRank.set(r.rank, r);
      }
    }
    return [...byRank.values()].sort((a, b) => a.rank - b.rank);
  }

  function updateRowNameAndAmount(rowEl, newName, newAmountStr, isProfitGreen) {
    const walker = document.createTreeWalker(rowEl, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) {
      const t = (n.nodeValue || '').trim();
      if (!t) continue;
      textNodes.push(n);
    }

    for (const tn of textNodes) {
      const t = tn.nodeValue.trim();
      if (t.includes('$')) {
        if (tn.nodeValue.trim() !== newAmountStr) {
          tn.nodeValue = newAmountStr;
        }
        if (tn.parentElement) {
          tn.parentElement.style.setProperty('color', isProfitGreen ? '#0faf59' : '#ef4444', 'important');
        }
      } else if (!isRankValue(t) && !/how does|position|leader/i.test(t)) {
        if (tn.nodeValue.trim() !== newName) {
          tn.nodeValue = newName;
        }
      }
    }
  }

  function applyFlagAndAvatarToRow(rowEl, flagCode, avatarUrl, origFlagSvg) {
    const flagSvg = findRowFlagSvg(rowEl);
    if (flagSvg) flagSvg.classList.add('qx-hide-orig-el');

    let customFlag = rowEl.querySelector('.qx-row-flag-circle');
    if (flagCode) {
      const flagSrc = `https://flagcdn.com/w40/${flagCode}.png`;
      if (!customFlag) {
        customFlag = document.createElement('img');
        customFlag.className = 'qx-row-flag-circle';
        if (flagSvg && flagSvg.parentNode) {
          flagSvg.parentNode.insertBefore(customFlag, flagSvg.nextSibling);
        } else {
          rowEl.appendChild(customFlag);
        }
      }
      if (customFlag.getAttribute('src') !== flagSrc) customFlag.src = flagSrc;
      customFlag.style.display = 'inline-block';
    } else if (origFlagSvg) {
      if (customFlag) customFlag.style.display = 'none';
      if (flagSvg) flagSvg.classList.remove('qx-hide-orig-el');
    }

    const nativeAvatar = findRowAvatarImg(rowEl, flagSvg || customFlag);
    let customAv = rowEl.querySelector('.qx-row-avatar-circle');
    const resolvedAv = avatarUrl || DEFAULT_USER_AVATAR_SVG;
    if (nativeAvatar) {
      if (nativeAvatar.getAttribute('src') !== resolvedAv) nativeAvatar.src = resolvedAv;
      nativeAvatar.style.display = 'inline-block';
      if (customAv) customAv.style.display = 'none';
    } else {
      if (!customAv) {
        customAv = document.createElement('img');
        customAv.className = 'qx-row-avatar-circle';
        const anchor = customFlag || flagSvg;
        if (anchor && anchor.parentNode) {
          anchor.parentNode.insertBefore(customAv, anchor.nextSibling);
        } else {
          rowEl.appendChild(customAv);
        }
      }
      if (customAv.getAttribute('src') !== resolvedAv) customAv.src = resolvedAv;
      customAv.style.display = 'inline-block';
    }
  }

  function fixLeaderboardUI() {
    const card = findLeaderboardCard();
    if (!card) return;

    const { lbName, lbBalOverride, countryFlag, profilePhoto } = getSettings();
    const currentBalance = getBalance();
    const startCap = getStartingCapital(currentBalance);
    const profitAmount =
      lbBalOverride !== null && Number.isFinite(lbBalOverride)
        ? lbBalOverride
        : currentBalance !== null
        ? currentBalance - startCap
        : 0;
    const absProfit = Math.abs(profitAmount);
    const isLoss = profitAmount < 0;
    const formattedProfit = (isLoss ? '-$' : '$') + absProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const positiveFormattedProfit = '$' + absProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const flagUrl = `https://flagcdn.com/w40/${countryFlag}.png`;
    const cardFlagSvg = findRowFlagSvg(card);
    if (cardFlagSvg) cardFlagSvg.classList.add('qx-hide-orig-el');

    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, null, false);
    let node;
    let nameUpdated = false;
    while ((node = walker.nextNode())) {
      const t = (node.nodeValue || '').trim();
      if (!t) continue;
      if (/your\s+position/i.test(t)) {
        if (node.nodeValue !== 'Your position:') node.nodeValue = 'Your position:';
      } else if (t.includes('$')) {
        if (t !== formattedProfit) node.nodeValue = formattedProfit;
        if (node.parentElement) {
          node.parentElement.style.setProperty('color', isLoss ? '#ef4444' : '#0faf59', 'important');
        }
      } else if (!isRankValue(t) && !/how does/i.test(t) && !nameUpdated) {
        if (t !== lbName) node.nodeValue = lbName;
        nameUpdated = true;
        const parentRow = node.parentElement;
        if (parentRow) {
          let existingFlag = card.querySelector('.qx-leaderboard-flag');
          if (!existingFlag) {
            existingFlag = document.createElement('img');
            existingFlag.className = 'qx-leaderboard-flag';
            parentRow.insertBefore(existingFlag, parentRow.firstChild);
          }
          if (existingFlag.getAttribute('src') !== flagUrl) existingFlag.src = flagUrl;
        }
      }
    }

    card.classList.add('qx-profit-card');
    let line = card.querySelector('.qx-profit-line');
    if (!line) {
      line = document.createElement('div');
      line.className = 'qx-profit-line';
      card.appendChild(line);
    }
    if (Math.abs(profitAmount) < 0.000001) {
      line.style.width = '0%';
    } else if (isLoss) {
      let pct = 30 - (absProfit / 15000) * 25;
      line.style.width = Math.max(5, Math.min(30, pct)) + '%';
    } else {
      let pct = 30 + (absProfit / 15000) * 50;
      line.style.width = Math.max(30, Math.min(80, pct)) + '%';
    }

    const rowItems = findLeaderboardRowElements(card);
    rowItems.forEach((item) => {
      if (!item.el.__qxOrigRowDataV6) {
        const fSvg = findRowFlagSvg(item.el);
        const avImg = findRowAvatarImg(item.el, fSvg);
        item.el.__qxOrigRowDataV6 = {
          rank: item.rank,
          name: item.name,
          amountStr: item.amountStr,
          amountNum: item.amountNum,
          origFlagSvg: fSvg,
          origAvatarSrc: (avImg && avImg.getAttribute('src')) || DEFAULT_USER_AVATAR_SVG
        };
      }
    });

    let computedRank = null;
    if (Math.abs(profitAmount) < 0.000001) {
      computedRank = '-';
    } else if (isLoss) {
      computedRank = '100+';
    } else {
      const origList = rowItems.map((r) => r.el.__qxOrigRowDataV6);
      let rankNum = null;
      for (const orig of origList) {
        if (absProfit > orig.amountNum) {
          rankNum = orig.rank;
          break;
        }
      }
      if (rankNum === null) {
        const higher = origList.filter((o) => o.amountNum > absProfit).length;
        rankNum = higher + 1;
      }
      computedRank = rankNum >= 1 && rankNum <= 20 ? String(rankNum) : '100+';
    }

    const cardTextWalker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, null, false);
    let cn;
    while ((cn = cardTextWalker.nextNode())) {
      const v = (cn.nodeValue || '').trim();
      if (!isRankValue(v)) continue;
      const pText = cn.parentElement && cn.parentElement.parentElement ? cn.parentElement.parentElement.textContent || '' : '';
      if (/position/i.test(pText) && v !== computedRank) {
        cn.nodeValue = computedRank;
        break;
      }
    }

    const targetRankNum = /^\d{1,2}$/.test(computedRank) ? parseInt(computedRank, 10) : -1;
    const origByRank = new Map();
    rowItems.forEach((r) => {
      if (r.el.__qxOrigRowDataV6) origByRank.set(r.el.__qxOrigRowDataV6.rank, r.el.__qxOrigRowDataV6);
    });

    rowItems.forEach((item) => {
      const rowRank = item.el.__qxOrigRowDataV6 ? item.el.__qxOrigRowDataV6.rank : item.rank;
      if (targetRankNum >= 1 && targetRankNum <= 20) {
        if (rowRank === targetRankNum) {
          updateRowNameAndAmount(item.el, lbName, positiveFormattedProfit, true);
          applyFlagAndAvatarToRow(item.el, countryFlag, profilePhoto || getUserAvatarUrl(), null);
        } else if (rowRank > targetRankNum) {
          const prevOrig = origByRank.get(rowRank - 1);
          if (prevOrig) {
            updateRowNameAndAmount(item.el, prevOrig.name, prevOrig.amountStr, true);
            applyFlagAndAvatarToRow(item.el, null, prevOrig.origAvatarSrc, prevOrig.origFlagSvg);
          }
        } else {
          const selfOrig = origByRank.get(rowRank);
          if (selfOrig) {
            updateRowNameAndAmount(item.el, selfOrig.name, selfOrig.amountStr, true);
            applyFlagAndAvatarToRow(item.el, null, selfOrig.origAvatarSrc, selfOrig.origFlagSvg);
          }
        }
      }
    });
  }

  // --- 11. FAKE TRANSACTIONS INJECTION (/balance, /transactions, /withdrawal) ---
  function injectFakeTransactions() {
    const path = (window.location.pathname || '').toLowerCase();
    if (!/(balance|transaction|withdrawal|deposit)/i.test(path)) return;

    let txList = [];
    try {
      const raw = localStorage.getItem('qxFakeTransactions');
      if (raw) txList = JSON.parse(raw) || [];
      else {
        const cfg = JSON.parse(localStorage.getItem('qx_0x_panel_config_v1') || '{}');
        if (Array.isArray(cfg.transactions)) txList = cfg.transactions;
      }
    } catch (e) {}
    if (!Array.isArray(txList) || txList.length === 0) {
      document.querySelector('.qx-fake-tx-container')?.remove();
      return;
    }

    const sig = JSON.stringify(txList);
    const existing = document.querySelector('.qx-fake-tx-container');
    if (existing && existing.getAttribute('data-qx-sig') === sig) return;

    const host =
      document.querySelector('[class*="transactions"], [class*="balance"] table, main, .page__content, [class*="content"]') ||
      document.body;
    if (!host) return;

    host.querySelectorAll('div, p, span').forEach((el) => {
      if (/don't have any transactions|no transactions/i.test((el.textContent || '').trim()) && el.children.length === 0) {
        if (el.parentElement) el.parentElement.style.display = 'none';
      }
    });

    const container = existing || document.createElement('div');
    container.className = 'qx-fake-tx-container';
    container.setAttribute('data-qx-sig', sig);
    container.innerHTML = `
      <div class="qx-fake-tx-header">
        <div>Transaction ID</div>
        <div>Status</div>
        <div>Type</div>
        <div>Payment Method</div>
        <div style="text-align:right;">Amount</div>
      </div>
      ${txList
        .map((tx) => {
          const isDep = tx.type === 'Deposit';
          return `
            <div class="qx-fake-tx-row">
              <div>
                <div style="font-weight:600;color:#fff;">#${tx.id || '849201442'}</div>
                <div style="font-size:11px;color:#64748b;">${tx.date || ''}</div>
              </div>
              <div class="qx-tx-status-ok">● ${tx.status || 'Successed'}</div>
              <div>${tx.type || 'Deposit'}</div>
              <div>${tx.method || 'Binance Pay'}</div>
              <div style="text-align:right;font-weight:700;color:${isDep ? '#0faf59' : '#ef4444'};">
                ${isDep ? '+' : '-'}${formatUsd(tx.amount)}
              </div>
            </div>
          `;
        })
        .join('')}
    `;
    if (!existing) {
      host.prepend(container);
    }
  }

  // --- 12. MASTER RUN LOOP ---
  function fix() {
    const balance = getBalance() || 0;
    guardLive();
    fixAccountAndIcon(balance);
    fixBalancesAndUI();
    fixLeaderboardUI();
    cleanTitle();
  }

  fix();
  injectFakeTransactions();

  let lastKnownBalance = null;
  window.qxBalanceInterval = setInterval(() => {
    const balance = getBalance();
    if (balance !== null && balance !== lastKnownBalance) {
      lastKnownBalance = balance;
      fixAccountAndIcon(balance);
      fixBalancesAndUI();
    }
    guardLive();
    fixLeaderboardUI();
    cleanTitle();
  }, 2);

  window.qxProfitLine = setInterval(fixLeaderboardUI, 100);
  window.qxPaymentInterval = setInterval(injectFakeTransactions, 500);

  let qxScheduled = false;
  if (document.body) {
    window.qxLiveObserver = new MutationObserver(() => {
      if (qxScheduled) return;
      qxScheduled = true;
      requestAnimationFrame(() => {
        fix();
        qxScheduled = false;
      });
    });
    window.qxLiveObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  window.addEventListener('qx:settings-updated', fix);
  window.addEventListener('qx:demo-balance-updated', fix);
  window.addEventListener('qx:demo-balance-reset', fix);
  window.addEventListener('qx:transactions-updated', injectFakeTransactions);

  console.log('Quotex Demo-to-Live Pro Server Engine Active!');
})();
