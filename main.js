(function () {
  const PROFIT_SELECTOR = ".VgpLl";
  const BADGE_ID = "custom-tier-badge";
  const DEFAULT_TEXT = "+0% profit";

  function queryAllDeep(selector, root = document) {
    const results = [];
    const stack = [root];
    const visited = new Set();

    while (stack.length) {
      const current = stack.pop();
      if (!current || visited.has(current)) continue;
      visited.add(current);

      if (typeof current.querySelectorAll === "function") {
        try {
          current.querySelectorAll(selector).forEach((el) => results.push(el));
        } catch (e) {}
      }

      const allNodes = current.querySelectorAll ? Array.from(current.querySelectorAll("*")) : [];
      for (const node of allNodes) {
        if (node.shadowRoot && !visited.has(node.shadowRoot)) {
          stack.push(node.shadowRoot);
        }
        if (node.tagName === "IFRAME") {
          try {
            const doc = node.contentDocument || node.contentWindow?.document;
            if (doc && !visited.has(doc)) stack.push(doc);
          } catch (e) {}
        }
      }
    }

    return results;
  }

  function getAllRoots() {
    const roots = [document];
    const frames = Array.from(document.querySelectorAll("iframe"));
    for (const f of frames) {
      try {
        const doc = f.contentDocument || f.contentWindow?.document;
        if (doc) roots.push(doc);
      } catch (e) {}
    }
    return roots;
  }

  function parseNum(str) {
    if (!str) return null;
    const cleaned = String(str).replace(/[^0-9.,]/g, "").replace(/,/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  }

  function isShown(el) {
    if (!el) return false;
    const win = el.ownerDocument?.defaultView || window;
    const st = win.getComputedStyle(el);
    if (st.display === "none" || st.visibility === "hidden" || parseFloat(st.opacity) === 0) {
      return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function findActiveAccountBalance() {
    const roots = getAllRoots();

    for (const root of roots) {
      const topItems = Array.from(root.querySelectorAll("button, div, span, a"));
      for (const item of topItems) {
        if (!isShown(item)) continue;
        const txt = (item.innerText || "").replace(/\s+/g, " ").trim();
        if (!txt || txt.length > 60) continue;

        if (/\b(live|demo)\b/i.test(txt)) {
          const m = txt.match(/\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/);
          if (m) {
            const val = parseNum(m[1]);
            if (val !== null) return val;
          }
        }
      }
    }

    for (const root of roots) {
      const bodyText = root.body?.innerText || "";
      const m = bodyText.match(/(?:live|demo)[^\d$]{0,20}\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/i);
      if (m) {
        const val = parseNum(m[1]);
        if (val !== null) return val;
      }
    }

    return null;
  }

  function applyStateToElement(el, balance) {
    const doc = el.ownerDocument || document;
    const existingBadge = doc.getElementById(BADGE_ID);

    if (balance === null || balance < 5000) {
      if (el.textContent !== DEFAULT_TEXT) {
        el.textContent = DEFAULT_TEXT;
      }
      if (existingBadge) existingBadge.remove();
      return;
    }

    let profitText = "+2% profit";
    let badgeText = "PRO";
    let color = "#00FF88";
    let bg = "rgba(0, 255, 136, 0.16)";

    if (balance >= 10000) {
      profitText = "+4% profit";
      badgeText = "VIP";
      color = "#00E5FF";
      bg = "rgba(0, 229, 255, 0.16)";
    }

    if (el.textContent !== profitText) {
      el.textContent = profitText;
    }

    let badge = existingBadge;
    if (!badge) {
      badge = doc.createElement("span");
      badge.id = BADGE_ID;
      badge.style.marginLeft = "8px";
      badge.style.padding = "2px 7px";
      badge.style.borderRadius = "4px";
      badge.style.fontSize = "11px";
      badge.style.fontWeight = "700";
      badge.style.letterSpacing = "0.6px";
      badge.style.display = "inline-block";
      badge.style.verticalAlign = "middle";
      badge.style.lineHeight = "1.2";
      el.insertAdjacentElement("afterend", badge);
    }

    if (badge.textContent !== badgeText) {
      badge.textContent = badgeText;
    }
    badge.style.color = color;
    badge.style.backgroundColor = bg;
    badge.style.border = `1px solid ${color}`;
  }

  function runSync() {
    const balance = findActiveAccountBalance();
    const targets = queryAllDeep(PROFIT_SELECTOR);

    for (const el of targets) {
      applyStateToElement(el, balance);
    }
  }

  runSync();

  const observer = new MutationObserver(() => {
    runSync();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  setInterval(runSync, 400);
})();
