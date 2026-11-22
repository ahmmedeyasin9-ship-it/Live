// --- 1. SYNCHRONOUS DOM INTERCEPTORS (Zero-Flicker DEMO Blocker) ---
(function syncDomPatch() {
    try {
        const origInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        if (origInnerHTML && origInnerHTML.set) {
            Object.defineProperty(Element.prototype, 'innerHTML', {
                set: function(html) {
                    if (typeof html === 'string' && /demo/i.test(html)) {
                        html = html.replace(/demo-trade/gi, 'trade')
                                   .replace(/Demo trading/gi, 'Live trading')
                                   .replace(/DEMO/gi, 'LIVE');
                    }
                    return origInnerHTML.set.call(this, html);
                },
                get: function() {
                    return origInnerHTML.get.call(this);
                }
            });
        }

        const origTextContent = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
        if (origTextContent && origTextContent.set) {
            Object.defineProperty(Node.prototype, 'textContent', {
                set: function(text) {
                    if (typeof text === 'string' && /demo/i.test(text) && !this.closest?.('div[class*="account"]:nth-of-type(2)')) {
                        text = text.replace(/demo-trade/gi, 'trade')
                                   .replace(/Demo trading/gi, 'Live trading')
                                   .replace(/DEMO/gi, 'LIVE');
                    }
                    return origTextContent.set.call(this, text);
                },
                get: function() {
                    return origTextContent.get.call(this);
                }
            });
        }

        if (typeof Element !== 'undefined' && !Element.prototype.__zeroxOrigAttach) {
            Element.prototype.__zeroxOrigAttach = Element.prototype.attachShadow;
            Element.prototype.attachShadow = function(init) {
                const shadow = Element.prototype.__zeroxOrigAttach.call(this, { ...init, mode: 'open' });
                this.__zeroxShadowRoot = shadow;
                return shadow;
            };
        }
    } catch(e) {}
})();
