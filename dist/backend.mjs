import { createRequire as __thassiCreateRequire } from 'node:module'; const require = __thassiCreateRequire(import.meta.url);

// apps/3d-print/backend/index.ts
import http from "node:http";

// packages/sdk/src/db.ts
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

// packages/sdk/src/index.ts
function defineThassiApp(setup) {
  return { setup };
}

// thassi_host/src/hass-sidebar-sync.ts
import fs2 from "node:fs";
import path2 from "node:path";
function getHassSidebarStylerScript() {
  return `
  (function initThassiHassSidebarStyler() {
    const LABEL_MAP = {
      'Main Dashboard': 'Horizon',
      'Thassi Main Dashboard': 'Horizon',
      'Thassi Unified Dashboard': 'Horizon',
      'Google Calendar & Time Analytics': 'Calendar',
      'Google Health & Readiness': 'Health',
      'Finance & Budget': 'Finances',
      'Meal Planner': 'Meals',
      'Smart Control Canvas': 'Smart Home',
      'Camera Vision & Object Detection': 'Vision'
    };

    const ROOT_THEME_CSS = \`
      :root, html, body, home-assistant {
        --primary-background-color: #040711 !important;
        --secondary-background-color: #060a17 !important;
        --card-background-color: rgba(8, 13, 26, 0.72) !important;
        --ha-card-background: rgba(8, 13, 26, 0.72) !important;
        --sidebar-background-color: transparent !important;
        --sidebar-text-color: rgba(248, 250, 252, 0.58) !important;
        --sidebar-icon-color: rgba(148, 163, 184, 0.58) !important;
        --sidebar-selected-text-color: #ffffff !important;
        --sidebar-selected-icon-color: #38bdf8 !important;
        --primary-color: #38bdf8 !important;
        --accent-color: #38bdf8 !important;
        --divider-color: rgba(255, 255, 255, 0.0) !important;
        --app-header-background-color: #040711 !important;
        --app-header-text-color: #f8fafc !important;
        --mdc-theme-primary: #38bdf8 !important;
        --mdc-theme-surface: #040711 !important;
        --mdc-drawer-width: 208px !important;
        background-color: #040711 !important;
      }
    \`;

    const DRAWER_SHADOW_CSS = \`
      .mdc-drawer, aside.mdc-drawer {
        background: var(--thassi-sidebar-bg, linear-gradient(180deg, rgba(4, 7, 17, 0.94) 0%, rgba(7, 13, 29, 0.92) 55%, rgba(3, 6, 15, 0.96) 100%)) !important;
        backdrop-filter: blur(30px) saturate(140%) !important;
        -webkit-backdrop-filter: blur(30px) saturate(140%) !important;
        border-right: none !important;
        box-shadow: 16px 0 48px rgba(0, 0, 0, 0.35) !important;
        transition: background 1.2s cubic-bezier(0.22, 1, 0.36, 1) !important;
      }
      .mdc-drawer.mdc-drawer--open:not(.mdc-drawer--closing) + .mdc-drawer-app-content {
        background: #040711 !important;
      }
      .mdc-drawer-app-content {
        background: #040711 !important;
      }
    \`;

    const SIDEBAR_SHADOW_CSS = \`
      :host {
        background: transparent !important;
        color: rgba(248, 250, 252, 0.62) !important;
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        border-right: none !important;
      }
      .menu {
        background: transparent !important;
        border-bottom: none !important;
        height: 68px !important;
        padding: 0 14px !important;
        display: flex !important;
        align-items: center !important;
      }
      .menu .title {
        font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        letter-spacing: 0.28em !important;
        text-transform: uppercase !important;
        color: rgba(248, 250, 252, 0.72) !important;
        margin-left: 6px !important;
      }
      .menu ha-icon-button {
        color: rgba(248, 250, 252, 0.55) !important;
      }
      /* Hide sidebar edit button, dividers, notifications & non-Thassi items */
      .divider,
      div.divider,
      .notifications-container,
      .notifications,
      ha-md-list-item.notifications,
      a[data-panel="lovelace"],
      a[data-panel="developer-tools"],
      a[data-panel="config"],
      a[data-panel="44ec3c40_thassi_system_monitor"],
      a[data-panel="44ec3c40_thassi_fuege_neue"],
      ha-md-list-item[href="/lovelace"],
      ha-md-list-item[href="/developer-tools"],
      ha-md-list-item[href="/44ec3c40_thassi_system_monitor"],
      ha-md-list-item[href="/44ec3c40_thassi_fuege_neue"] {
        display: none !important;
      }
      ha-md-list,
      paper-listbox {
        padding: 4px 10px !important;
        background: transparent !important;
      }
      ha-md-list-item,
      paper-icon-item,
      a[role="option"] {
        border-radius: 14px !important;
        margin: 4px 0 !important;
        min-height: 42px !important;
        font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif !important;
        font-size: 12.5px !important;
        font-weight: 400 !important;
        letter-spacing: 0.04em !important;
        color: rgba(248, 250, 252, 0.56) !important;
        transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
        --md-list-item-leading-icon-color: rgba(148, 163, 184, 0.56) !important;
        --md-list-item-label-text-color: rgba(248, 250, 252, 0.56) !important;
        --md-list-item-label-text-font: "Inter", system-ui, sans-serif !important;
        --md-list-item-label-text-size: 12.5px !important;
        --md-list-item-label-text-weight: 400 !important;
      }
      ha-md-list-item:hover,
      a[role="option"]:hover {
        background: rgba(255, 255, 255, 0.04) !important;
        color: rgba(248, 250, 252, 0.92) !important;
        transform: translateX(3px) !important;
        --md-list-item-leading-icon-color: rgba(248, 250, 252, 0.92) !important;
        --md-list-item-label-text-color: rgba(248, 250, 252, 0.92) !important;
      }
      ha-md-list-item[selected],
      ha-md-list-item.selected,
      a.iron-selected,
      a[aria-selected="true"] {
        background: rgba(56, 189, 248, 0.11) !important;
        color: #ffffff !important;
        box-shadow: inset 2px 0 0 #38bdf8, 0 8px 24px rgba(0, 0, 0, 0.22) !important;
        --md-list-item-leading-icon-color: #38bdf8 !important;
        --md-list-item-label-text-color: #ffffff !important;
        --md-list-item-label-text-weight: 500 !important;
      }
      .item-text {
        font-size: 12.5px !important;
        letter-spacing: 0.04em !important;
      }
      /* Subtle profile footer */
      .profile,
      ha-md-list-item.user {
        opacity: 0.55 !important;
        transition: opacity 0.2s ease !important;
      }
      .profile:hover,
      ha-md-list-item.user:hover {
        opacity: 0.95 !important;
      }
    \`;

    const LOVELACE_FULLBLEED_CSS = \`
      .header, app-header, .toolbar {
        display: none !important;
        height: 0 !important;
      }
      #view {
        padding: 0 !important;
        margin: 0 !important;
        height: 100vh !important;
        min-height: 100vh !important;
        background: #040711 !important;
      }
    \`;

    function ensureStyleTag(root, id, cssText) {
      if (!root) return;
      let style = root.getElementById ? root.getElementById(id) : root.querySelector('#' + id);
      if (!style) {
        style = document.createElement('style');
        style.id = id;
        style.textContent = cssText;
        (root.head || root).appendChild(style);
      } else if (style.textContent !== cssText) {
        style.textContent = cssText;
      }
    }

    function applyThassiChromeToParent() {
      try {
        if (!window.top || window.top === window) return;
        const topDoc = window.top.document;
        if (!topDoc) return;

        ensureStyleTag(topDoc, 'thassi-root-vars', ROOT_THEME_CSS);

        const ha = topDoc.querySelector('home-assistant');
        if (!ha || !ha.shadowRoot) return;
        ensureStyleTag(ha.shadowRoot, 'thassi-ha-vars', ROOT_THEME_CSS);

        const main = ha.shadowRoot.querySelector('home-assistant-main');
        if (!main || !main.shadowRoot) return;

        const drawer = main.shadowRoot.querySelector('ha-drawer');
        if (drawer && drawer.shadowRoot) {
          ensureStyleTag(drawer.shadowRoot, 'thassi-drawer-style', DRAWER_SHADOW_CSS);
        }

        const sidebar = main.shadowRoot.querySelector('ha-sidebar');
        if (sidebar && sidebar.shadowRoot) {
          ensureStyleTag(sidebar.shadowRoot, 'thassi-sidebar-style', SIDEBAR_SHADOW_CSS);

          const titleEl = sidebar.shadowRoot.querySelector('.menu .title');
          if (titleEl && titleEl.textContent !== 'THASSI') {
            titleEl.textContent = 'THASSI';
          }

          const items = sidebar.shadowRoot.querySelectorAll('.item-text, span[slot="headline"]');
          let has3dPrintItem = false;
          items.forEach((el) => {
            const raw = (el.textContent || '').trim();
            if (raw === '3D Druck' || raw === '3D Print') has3dPrintItem = true;
            if (LABEL_MAP[raw]) {
              el.textContent = LABEL_MAP[raw];
            }
          });

          // Ensure "3D Druck" appears in the Home Assistant sidebar even before standalone add-on install
          const list = sidebar.shadowRoot.querySelector('ha-md-list, paper-listbox');
          if (list && !has3dPrintItem && !list.querySelector('#thassi-sidebar-3dprint')) {
            const item = document.createElement('a');
            item.id = 'thassi-sidebar-3dprint';
            item.setAttribute('role', 'option');
            item.href = '/44ec3c40_thassi_host#3d-print';
            item.style.cssText = 'display:flex;align-items:center;gap:16px;padding:0 16px;min-height:42px;border-radius:14px;margin:4px 0;text-decoration:none;color:rgba(248,250,252,0.56);font-family:Inter,system-ui,sans-serif;font-size:12.5px;cursor:pointer;transition:all 0.25s ease;';
            item.innerHTML = '<ha-icon icon="mdi:printer-3d-nozzle" style="color:rgba(148,163,184,0.56);"></ha-icon><span class="item-text">3D Druck</span>';
            item.addEventListener('click', (ev) => {
              ev.preventDefault();
              try {
                if (typeof window.openFullService === 'function') {
                  window.openFullService('3d-print', '3D Druck Studio');
                  return;
                }
                if (window.top) {
                  window.top.history.pushState(null, '', '/44ec3c40_thassi_host#3d-print');
                  window.top.dispatchEvent(new CustomEvent('location-changed'));
                }
              } catch (_e) {}
            });
            list.appendChild(item);
          }
        }

        // Also strip Lovelace top header if currently on /lovelace
        const panelLovelace = main.shadowRoot.querySelector('ha-panel-lovelace');
        const huiRoot = panelLovelace && panelLovelace.shadowRoot && panelLovelace.shadowRoot.querySelector('hui-root');
        if (huiRoot && huiRoot.shadowRoot) {
          ensureStyleTag(huiRoot.shadowRoot, 'thassi-lovelace-fullbleed', LOVELACE_FULLBLEED_CSS);
        }
      } catch (_err) {
        // Cross-origin fallback (when opened directly on :8099 outside Home Assistant)
      }
    }

    window.syncThassiSidebarSky = function(skyOverlayGradient) {
      try {
        if (!window.top || window.top === window) return;
        const ha = window.top.document.querySelector('home-assistant');
        const main = ha && ha.shadowRoot && ha.shadowRoot.querySelector('home-assistant-main');
        const drawer = main && main.shadowRoot && main.shadowRoot.querySelector('ha-drawer');
        if (drawer) {
          drawer.style.setProperty('--thassi-sidebar-bg', skyOverlayGradient);
        }
      } catch (_e) {}
    };

    applyThassiChromeToParent();
    setInterval(applyThassiChromeToParent, 1200);
  })();
  `;
}
function syncHassFrontendFiles() {
  const candidateConfigDirs = ["/homeassistant", "/config"];
  for (const cfgDir of candidateConfigDirs) {
    if (!fs2.existsSync(path2.join(cfgDir, "configuration.yaml"))) continue;
    try {
      const wwwDir = path2.join(cfgDir, "www");
      fs2.mkdirSync(wwwDir, { recursive: true });
      const stylerJs = getHassSidebarStylerScript();
      fs2.writeFileSync(path2.join(wwwDir, "thassi-ui.js"), stylerJs, "utf-8");
      const loaderHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>html,body{margin:0;padding:0;background:#040711;overflow:hidden;}</style>
</head>
<body>
  <script>${stylerJs}
  try {
    if (window.top && window.top.location.pathname.startsWith('/lovelace')) {
      window.top.history.replaceState(null, '', '/44ec3c40_thassi_host');
      window.top.dispatchEvent(new CustomEvent('location-changed'));
    }
  } catch (e) {}
  </script>
</body>
</html>`;
      fs2.writeFileSync(path2.join(wwwDir, "thassi-loader.html"), loaderHtml, "utf-8");
      console.log(`[Thassi] Synced /local/thassi-ui.js and /local/thassi-loader.html to ${wwwDir}`);
    } catch (err) {
      console.warn("[Thassi] Could not write to www dir:", err);
    }
  }
}

// thassi_host/src/ambient-dashboard.ts
function renderUnifiedDashboardHtml(ingressPath) {
  const sidebarStylerScript = getHassSidebarStylerScript();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thassi Horizon</title>
  <script>window.__THASSI_INGRESS_PATH__ = ${JSON.stringify(ingressPath)};</script>
  <style>
    :root {
      --text: #f8fafc;
      --text-soft: rgba(248, 250, 252, 0.72);
      --text-muted: rgba(248, 250, 252, 0.45);
      --accent: #38bdf8;
      --sun-glow: #fbbf24;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    * { box-sizing: border-box; user-select: none; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #040711;
      color: var(--text);
      font-family: var(--font-sans);
      -webkit-font-smoothing: antialiased;
    }

    /* 1. DYNAMIC DAYTIME SKY & CELESTIAL SUN STAGE */
    #sky-stage {
      position: fixed;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      transition: background 1.2s cubic-bezier(0.22, 1, 0.36, 1);
      overflow: hidden;
    }
    #starfield {
      position: absolute;
      inset: 0;
      transition: opacity 1.5s ease;
    }
    .star {
      position: absolute;
      background: #fff;
      border-radius: 50%;
      animation: twinkle var(--dur, 4s) ease-in-out infinite alternate;
    }
    @keyframes twinkle {
      0% { opacity: 0.15; transform: scale(0.8); }
      100% { opacity: 0.95; transform: scale(1.2); }
    }

    /* Atmospheric horizon mist & glow */
    #horizon-glow {
      position: absolute;
      left: -10%;
      right: -10%;
      bottom: 18vh;
      height: 38vh;
      filter: blur(55px);
      opacity: 0.75;
      transition: background 1.2s ease, opacity 1.2s ease;
    }

    /* Delicate Solar Arc SVG Path */
    #solar-arc-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    /* The Rising & Setting Sun */
    #sun-assembly {
      position: absolute;
      width: 0;
      height: 0;
      transform: translate3d(0, 0, 0);
      transition: left 0.6s cubic-bezier(0.22, 1, 0.36, 1), top 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.8s ease;
      will-change: left, top;
    }
    .sun-core {
      position: absolute;
      width: 84px;
      height: 84px;
      left: -42px;
      top: -42px;
      border-radius: 50%;
      background: radial-gradient(circle, #ffffff 0%, #fef08a 38%, #fbbf24 72%, rgba(245, 158, 11, 0) 100%);
      box-shadow:
        0 0 60px 20px rgba(251, 191, 36, 0.65),
        0 0 140px 55px rgba(249, 115, 22, 0.42),
        0 0 260px 110px rgba(234, 88, 12, 0.24);
      animation: sunPulse 6s ease-in-out infinite alternate;
    }
    .sun-corona {
      position: absolute;
      width: 240px;
      height: 240px;
      left: -120px;
      top: -120px;
      border-radius: 50%;
      background: conic-gradient(
        from 0deg,
        transparent 0deg,
        rgba(254, 240, 138, 0.16) 20deg,
        transparent 45deg,
        rgba(251, 191, 36, 0.12) 90deg,
        transparent 130deg,
        rgba(254, 240, 138, 0.18) 180deg,
        transparent 220deg,
        rgba(251, 191, 36, 0.14) 275deg,
        transparent 320deg,
        rgba(254, 240, 138, 0.15) 350deg,
        transparent 360deg
      );
      filter: blur(8px);
      animation: rotateCorona 60s linear infinite;
    }
    @keyframes sunPulse {
      0% { transform: scale(0.96); }
      100% { transform: scale(1.05); }
    }
    @keyframes rotateCorona {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Nocturnal Moon (when sun is below horizon) */
    #moon-assembly {
      position: absolute;
      width: 0;
      height: 0;
      transition: left 0.8s ease, top 0.8s ease, opacity 1s ease;
    }
    .moon-core {
      position: absolute;
      width: 46px;
      height: 46px;
      left: -23px;
      top: -23px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #f8fafc 0%, #cbd5e1 65%, #64748b 100%);
      box-shadow: 0 0 45px 12px rgba(186, 230, 253, 0.32), 0 0 110px 35px rgba(56, 189, 248, 0.14);
    }

    /* 2. MONUMENTAL DATE & TIME TYPOGRAPHY */
    #hero-clock-region {
      position: fixed;
      top: 5.5vh;
      left: 4.2vw;
      z-index: 15;
      pointer-events: none;
    }
    .clock-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
      line-height: 0.92;
    }
    #hero-time {
      font-size: clamp(5rem, 10.2vw, 9.4rem);
      font-weight: 200;
      letter-spacing: -0.045em;
      font-variant-numeric: tabular-nums;
      color: #ffffff;
      text-shadow: 0 12px 45px rgba(0, 0, 0, 0.35);
    }
    #hero-seconds {
      font-size: clamp(1.4rem, 2.6vw, 2.4rem);
      font-weight: 300;
      color: rgba(255, 255, 255, 0.56);
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
    }
    #hero-date {
      margin-top: 10px;
      font-size: clamp(1.15rem, 1.9vw, 1.75rem);
      font-weight: 300;
      letter-spacing: 0.06em;
      color: rgba(255, 255, 255, 0.84);
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
    }
    #solar-telemetry {
      margin-top: 6px;
      font-size: 11.5px;
      font-weight: 400;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.45);
    }

    /* 5. TOP-RIGHT BORDERLESS EXPANDABLE SERVICE WIDGETS */
    #top-right-widgets {
      position: fixed;
      top: 5.5vh;
      right: 4.2vw;
      z-index: 30;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 22px;
      max-height: 60vh;
    }
    .ambient-widget {
      text-align: right;
      cursor: pointer;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), background 0.35s ease, padding 0.35s ease, backdrop-filter 0.35s ease;
      border: none;
      background: transparent;
      padding: 4px 0;
      border-radius: 20px;
      max-width: 390px;
    }
    .ambient-widget:hover:not(.expanded) {
      transform: translateX(-6px);
    }
    .ambient-widget.expanded {
      cursor: default;
      padding: 18px 22px;
      background: rgba(6, 10, 22, 0.56);
      backdrop-filter: blur(28px) saturate(140%);
      -webkit-backdrop-filter: blur(28px) saturate(140%);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
      transform: translateX(-4px);
      width: 340px;
    }
    .w-header {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
      cursor: pointer;
    }
    .w-label-row {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.48);
    }
    .w-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 10px var(--accent);
    }
    .w-primary {
      font-size: 18px;
      font-weight: 300;
      letter-spacing: -0.01em;
      color: #ffffff;
      text-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: baseline;
      gap: 10px;
      justify-content: flex-end;
    }
    .w-primary strong {
      font-weight: 500;
    }
    .w-sub {
      font-size: 11.5px;
      color: rgba(255, 255, 255, 0.52);
      font-weight: 400;
    }
    .w-expand-body {
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      transition: max-height 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, margin-top 0.3s ease;
      text-align: left;
    }
    .ambient-widget.expanded .w-expand-body {
      max-height: 360px;
      opacity: 1;
      margin-top: 14px;
    }
    .w-stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 18px;
      margin-bottom: 14px;
    }
    .w-stat-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .w-stat-k {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.45);
    }
    .w-stat-v {
      font-size: 14px;
      font-weight: 500;
      color: #fff;
    }
    .w-action-link {
      display: inline-block;
      margin-top: 6px;
      font-size: 11.5px;
      font-weight: 500;
      letter-spacing: 0.04em;
      color: #38bdf8;
      text-decoration: none;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
    }
    .w-action-link:hover { text-decoration: underline; }
    .minimal-input {
      width: 100%;
      background: rgba(255, 255, 255, 0.07);
      border: none;
      border-radius: 10px;
      padding: 8px 11px;
      color: #fff;
      font-size: 12.5px;
      outline: none;
      user-select: text;
    }
    .minimal-input::placeholder { color: rgba(255, 255, 255, 0.38); }
    .note-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      font-size: 12.5px;
      color: rgba(255, 255, 255, 0.88);
    }
    .note-del {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.35);
      cursor: pointer;
      font-size: 13px;
      padding: 0 4px;
    }
    .note-del:hover { color: #f87171; }

    /* 3 & 4. BOTTOM-ALIGNED MOVING TIMELINE WITH FIXED "NOW" MARKER */
    #timeline-dock {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 46px;
      height: 31vh;
      min-height: 220px;
      z-index: 20;
      background: linear-gradient(
        to top,
        rgba(3, 6, 15, 0.88) 0%,
        rgba(5, 10, 24, 0.58) 55%,
        rgba(5, 10, 24, 0.0) 100%
      );
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    /* Whisper-quiet minimal controls right above the timeline */
    #timeline-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4.2vw 6px 4.2vw;
      font-size: 11px;
      letter-spacing: 0.08em;
    }
    .tl-controls {
      display: flex;
      align-items: center;
      gap: 14px;
      opacity: 0.42;
      transition: opacity 0.25s ease;
    }
    .tl-controls:hover {
      opacity: 0.95;
    }
    .tl-pill {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.55);
      font-size: 10.5px;
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      cursor: pointer;
      padding: 2px 0;
      transition: color 0.2s ease;
    }
    .tl-pill:hover, .tl-pill.active {
      color: #ffffff;
    }
    .tl-pill.return-now {
      color: #38bdf8;
      display: none;
    }

    /* Timeline viewport & moving canvas */
    #timeline-viewport {
      position: relative;
      width: 100vw;
      height: calc(31vh - 28px);
      min-height: 192px;
      overflow: hidden;
      cursor: grab;
    }
    #timeline-viewport:active { cursor: grabbing; }

    /* Fixed "NOW" Marker at 22% from left */
    #fixed-now-marker {
      position: absolute;
      left: 22vw;
      top: 6px;
      bottom: 0;
      width: 1.5px;
      background: linear-gradient(
        to bottom,
        rgba(56, 189, 248, 0) 0%,
        #38bdf8 22%,
        #fbbf24 85%,
        rgba(251, 191, 36, 0.2) 100%
      );
      box-shadow: 0 0 18px rgba(56, 189, 248, 0.85);
      z-index: 25;
      pointer-events: none;
    }
    #fixed-now-badge {
      position: absolute;
      top: 4px;
      left: 0;
      transform: translateX(-50%);
      padding: 2px 8px;
      border-radius: 99px;
      background: rgba(56, 189, 248, 0.16);
      backdrop-filter: blur(12px);
      color: #e0f2fe;
      font-size: 9.5px;
      font-weight: 600;
      letter-spacing: 0.14em;
      white-space: nowrap;
    }
    #fixed-now-orb {
      position: absolute;
      bottom: 37px;
      left: 0.75px;
      transform: translate(-50%, 50%);
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #fbbf24;
      box-shadow: 0 0 16px 4px rgba(251, 191, 36, 0.9);
    }

    /* Moving World Track */
    #timeline-world {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      will-change: transform;
    }

    /* Horizontal Axis Line */
    #timeline-axis-line {
      position: absolute;
      left: -20000px;
      width: 40000px;
      bottom: 38px;
      height: 1px;
      background: rgba(255, 255, 255, 0.14);
      pointer-events: none;
    }

    /* Hour Ticks & Day Dividers */
    .tl-tick {
      position: absolute;
      bottom: 0;
      height: 38px;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
    }
    .tl-tick-mark {
      width: 1px;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      margin-bottom: 6px;
    }
    .tl-tick.major .tl-tick-mark {
      height: 11px;
      background: rgba(255, 255, 255, 0.42);
    }
    .tl-tick-label {
      font-size: 10px;
      font-weight: 400;
      font-variant-numeric: tabular-nums;
      color: rgba(255, 255, 255, 0.38);
      white-space: nowrap;
    }
    .tl-tick.day-start .tl-tick-mark {
      height: 180px;
      margin-top: -142px;
      background: linear-gradient(to bottom, transparent, rgba(56, 189, 248, 0.38));
    }
    .tl-tick.day-start .tl-tick-label {
      color: #38bdf8;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-size: 10.5px;
    }

    /* 4. GOOGLE CALENDAR EVENT RECTANGLES ON THE TIMELINE */
    .tl-event-rect {
      position: absolute;
      height: 44px;
      border-radius: 10px;
      padding: 6px 12px;
      background: rgba(12, 19, 36, 0.62);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-left: 2.5px solid var(--ev-color, #38bdf8);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), background 0.22s ease, box-shadow 0.22s ease;
    }
    .tl-event-rect:hover {
      transform: translateY(-3px) scale(1.01);
      background: rgba(24, 35, 58, 0.85);
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.45), 0 0 20px var(--ev-glow, rgba(56, 189, 248, 0.25));
      z-index: 18;
    }
    .tl-event-rect.is-now {
      background: rgba(14, 116, 144, 0.42);
      box-shadow: 0 0 28px rgba(56, 189, 248, 0.35);
    }
    .tl-event-rect.is-past {
      opacity: 0.45;
    }
    .tl-ev-title {
      font-size: 12px;
      font-weight: 500;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
    }
    .tl-ev-meta {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.56);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    /* Quick Event Creator Popover */
    #quick-event-modal {
      position: fixed;
      bottom: 35vh;
      right: 4.2vw;
      z-index: 40;
      background: rgba(6, 10, 22, 0.78);
      backdrop-filter: blur(28px);
      padding: 18px 22px;
      border-radius: 18px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
      display: none;
      width: 320px;
    }

    /* Fullscreen Service Overlay Iframe */
    #full-app-overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      background: #040711;
      display: none;
      flex-direction: column;
    }
    #full-app-bar {
      height: 44px;
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #060914;
    }
    #full-app-frame {
      flex: 1;
      width: 100%;
      border: none;
    }

    /* 6. SUBTLE ROOM-GROUPED DEVICE QUICK-ACCESS BAR BELOW TIMELINE */
    #room-dock-bar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      height: 46px;
      z-index: 28;
      background: rgba(3, 6, 15, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 4.2vw;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    #room-dock-bar::-webkit-scrollbar { display: none; }

    .room-dock-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .room-pill {
      background: transparent;
      border: none;
      border-radius: 99px;
      padding: 6px 13px;
      color: rgba(248, 250, 252, 0.56);
      font-family: var(--font-sans);
      font-size: 11.5px;
      font-weight: 400;
      letter-spacing: 0.03em;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      white-space: nowrap;
      transition: color 0.22s ease, background 0.22s ease, transform 0.2s ease;
    }
    .room-pill:hover {
      color: rgba(248, 250, 252, 0.92);
      background: rgba(255, 255, 255, 0.045);
    }
    .room-pill.active-flyout {
      color: #ffffff;
      background: rgba(56, 189, 248, 0.13);
    }
    .room-pill.has-on {
      color: rgba(248, 250, 252, 0.88);
    }
    .room-dot {
      width: 5.5px;
      height: 5.5px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.22);
      transition: background 0.25s ease, box-shadow 0.25s ease;
    }
    .room-pill.has-on .room-dot {
      background: #fbbf24;
      box-shadow: 0 0 9px rgba(251, 191, 36, 0.85);
    }
    .room-pill.has-motion .room-dot {
      background: #4ade80;
      box-shadow: 0 0 9px rgba(74, 222, 128, 0.85);
    }
    .room-meta {
      font-size: 10px;
      color: rgba(248, 250, 252, 0.36);
      font-variant-numeric: tabular-nums;
    }
    .room-pill.has-on .room-meta {
      color: rgba(251, 191, 36, 0.78);
    }

    /* Upward Glassmorphic Room Flyout */
    #room-flyout {
      position: fixed;
      bottom: 54px;
      left: 4.2vw;
      z-index: 45;
      width: 340px;
      max-width: 92vw;
      background: rgba(6, 10, 22, 0.78);
      backdrop-filter: blur(32px) saturate(150%);
      -webkit-backdrop-filter: blur(32px) saturate(150%);
      border-radius: 22px;
      padding: 18px 20px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.65);
      display: none;
      flex-direction: column;
      gap: 12px;
      animation: flyoutRise 0.24s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes flyoutRise {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .rf-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding-bottom: 4px;
    }
    .rf-title {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #ffffff;
    }
    .rf-subtitle {
      font-size: 11px;
      color: rgba(248, 250, 252, 0.48);
      font-variant-numeric: tabular-nums;
    }
    .rf-dev-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 44vh;
      overflow-y: auto;
    }
    .rf-dev-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 9px 12px;
      border-radius: 13px;
      background: rgba(255, 255, 255, 0.035);
      transition: background 0.2s ease;
    }
    .rf-dev-row.is-on {
      background: rgba(251, 191, 36, 0.09);
    }
    .rf-dev-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .rf-dev-label {
      font-size: 12.5px;
      font-weight: 400;
      color: rgba(248, 250, 252, 0.88);
    }
    .rf-dev-row.is-on .rf-dev-label {
      color: #ffffff;
      font-weight: 500;
    }
    .rf-dev-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .rf-power-badge {
      font-size: 10.5px;
      color: rgba(248, 250, 252, 0.45);
      font-variant-numeric: tabular-nums;
    }
    .rf-toggle-btn {
      border: none;
      border-radius: 99px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(248, 250, 252, 0.65);
    }
    .rf-toggle-btn.on {
      background: #fbbf24;
      color: #040711;
      box-shadow: 0 0 14px rgba(251, 191, 36, 0.45);
    }
    .rf-slider-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 2px;
    }
    .rf-slider {
      flex: 1;
      accent-color: #38bdf8;
      height: 4px;
      cursor: pointer;
    }
    .rf-effect-pills {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
      padding-top: 2px;
    }
    .rf-fx-pill {
      border: none;
      border-radius: 99px;
      padding: 2px 8px;
      font-size: 10px;
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
    }
    .rf-fx-pill.active {
      background: #a855f7;
      color: #fff;
    }
  </style>
</head>
<body>
  <!-- 1. LIVING DAYTIME SKY & CELESTIAL SUN -->
  <div id="sky-stage">
    <div id="starfield"></div>
    <div id="horizon-glow"></div>
    <svg id="solar-arc-svg" preserveAspectRatio="none">
      <path id="solar-arc-path" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="4 6" />
      <path id="solar-day-path" fill="none" stroke="rgba(251,191,36,0.18)" stroke-width="1.4" />
    </svg>
    <div id="moon-assembly">
      <div class="moon-core"></div>
    </div>
    <div id="sun-assembly">
      <div class="sun-corona"></div>
      <div class="sun-core"></div>
    </div>
  </div>

  <!-- 2. LARGE DATE & TIME IN UPPER-LEFT -->
  <div id="hero-clock-region">
    <div class="clock-row">
      <div id="hero-time">--:--</div>
      <div id="hero-seconds">--</div>
    </div>
    <div id="hero-date"></div>
    <div id="solar-telemetry">
      <span id="solar-phase-text"></span>
    </div>
  </div>

  <!-- 5. TOP-RIGHT BORDERLESS EXPANDABLE SERVICE WIDGETS: (health), (finances), (notes), (meals) -->
  <div id="top-right-widgets">
    <!-- HEALTH WIDGET -->
    <div class="ambient-widget" id="widget-health" onclick="toggleWidget('health', event)">
      <div class="w-header">
        <div class="w-label-row">
          <span>health</span>
          <span class="w-dot" id="dot-health" style="background:#4ade80; box-shadow:0 0 10px #4ade80;"></span>
        </div>
        <div class="w-primary" id="compact-health">--</div>
        <div class="w-sub" id="sub-health">Pixel 10 Health Connect</div>
      </div>
      <div class="w-expand-body" onclick="event.stopPropagation()">
        <div class="w-stat-grid">
          <div class="w-stat-item"><span class="w-stat-k">Steps Today</span><span class="w-stat-v" id="eh-steps">--</span></div>
          <div class="w-stat-item"><span class="w-stat-k">Readiness</span><span class="w-stat-v" id="eh-ready">--</span></div>
          <div class="w-stat-item"><span class="w-stat-k">Heart Rate</span><span class="w-stat-v" id="eh-hr">--</span></div>
          <div class="w-stat-item"><span class="w-stat-k">Resting HR / HRV</span><span class="w-stat-v" id="eh-rhr">--</span></div>
          <div class="w-stat-item"><span class="w-stat-k">Sleep Duration</span><span class="w-stat-v" id="eh-sleep">--</span></div>
          <div class="w-stat-item"><span class="w-stat-k">Burned / Distance</span><span class="w-stat-v" id="eh-burn">--</span></div>
        </div>
        <button class="w-action-link" onclick="openFullService('google-health', 'Health')">Open Health \u2192</button>
      </div>
    </div>

    <!-- FINANCES WIDGET -->
    <div class="ambient-widget" id="widget-finances" onclick="toggleWidget('finances', event)">
      <div class="w-header">
        <div class="w-label-row">
          <span>finances</span>
          <span class="w-dot" id="dot-finances" style="background:#a855f7; box-shadow:0 0 10px #a855f7;"></span>
        </div>
        <div class="w-primary" id="compact-finances">--</div>
        <div class="w-sub" id="sub-finances">Sparkasse George</div>
      </div>
      <div class="w-expand-body" onclick="event.stopPropagation()">
        <div class="w-stat-grid">
          <div class="w-stat-item"><span class="w-stat-k">Income</span><span class="w-stat-v" id="ef-inc" style="color:#4ade80;">--</span></div>
          <div class="w-stat-item"><span class="w-stat-k">Expenses</span><span class="w-stat-v" id="ef-exp" style="color:#f87171;">--</span></div>
          <div class="w-stat-item"><span class="w-stat-k">Investments</span><span class="w-stat-v" id="ef-inv" style="color:#38bdf8;">--</span></div>
          <div class="w-stat-item"><span class="w-stat-k">Groceries</span><span class="w-stat-v" id="ef-groc" style="color:#fbbf24;">--</span></div>
        </div>
        <button class="w-action-link" onclick="openFullService('finance-analytics', 'Finances')">Open Finances \u2192</button>
      </div>
    </div>

    <!-- NOTES WIDGET -->
    <div class="ambient-widget" id="widget-notes" onclick="toggleWidget('notes', event)">
      <div class="w-header">
        <div class="w-label-row">
          <span>notes</span>
          <span class="w-dot" id="dot-notes" style="background:#fbbf24; box-shadow:0 0 10px #fbbf24;"></span>
        </div>
        <div class="w-primary" id="compact-notes">0 notes</div>
        <div class="w-sub" id="sub-notes">Tap to capture a note</div>
      </div>
      <div class="w-expand-body" onclick="event.stopPropagation()">
        <form onsubmit="addNote(event)" style="margin-bottom:10px;">
          <input id="note-input" class="minimal-input" placeholder="Write a note & press Enter..." />
        </form>
        <div id="notes-list" style="max-height:160px; overflow-y:auto;"></div>
      </div>
    </div>

    <!-- MEALS WIDGET -->
    <div class="ambient-widget" id="widget-meals" onclick="toggleWidget('meals', event)">
      <div class="w-header">
        <div class="w-label-row">
          <span>meals</span>
          <span class="w-dot" id="dot-meals" style="background:#fb923c; box-shadow:0 0 10px #fb923c;"></span>
        </div>
        <div class="w-primary" id="compact-meals">Unplanned</div>
        <div class="w-sub" id="sub-meals">Today's nutrition</div>
      </div>
      <div class="w-expand-body" onclick="event.stopPropagation()">
        <div id="em-slots" style="font-size:12.5px; color:rgba(255,255,255,0.85); line-height:1.7; margin-bottom:10px;"></div>
        <button class="w-action-link" onclick="openFullService('meal-planner', 'Meals')">Open Meals \u2192</button>
      </div>
    </div>

    <!-- 3D DRUCK MINI-PREVIEW WIDGET (MINIATURE 3D OBJECT + PROGRESS BAR + PLACEHOLDER) -->
    <div class="ambient-widget" id="widget-3dprint" onclick="toggleWidget('3dprint', event)">
      <div class="w-header">
        <div class="w-label-row">
          <span>3d druck \xB7 bambulab</span>
          <span class="w-dot" id="dot-3dprint" style="background:#00AE42; box-shadow:0 0 10px #00AE42;"></span>
        </div>
        <div style="display:flex; align-items:center; justify-content:flex-end; gap:12px; margin-top:2px;">
          <div style="position:relative; width:82px; height:64px; border-radius:12px; background:rgba(4,7,17,0.72); border:1px solid rgba(56,189,248,0.22); overflow:hidden; flex-shrink:0;"
               title="Miniatur 3D-Objekt (mit Maus/Touch drehbar)"
               onclick="event.stopPropagation()">
            <canvas id="mini-3d-canvas" width="164" height="128" style="width:82px; height:64px; display:block; cursor:grab; touch-action:none;"></canvas>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; min-width:145px;">
            <div class="w-primary" id="compact-3dprint" style="font-size:15.5px;">Kein Projekt aktiv</div>
            <div class="w-sub" id="sub-3dprint">Platzhalter \xB7 0% Leerlauf</div>
            <div style="width:100%; height:5px; border-radius:99px; background:rgba(255,255,255,0.1); overflow:hidden; margin-top:6px;">
              <div id="mini-3d-progress-fill" style="width:0%; height:100%; background:linear-gradient(90deg, #00AE42, #38bdf8); transition:width 0.35s ease;"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="w-expand-body" onclick="event.stopPropagation()">
        <div class="w-stat-grid" style="margin-bottom:10px;">
          <div class="w-stat-item"><span class="w-stat-k">Drucker / Modus</span><span class="w-stat-v" id="e3d-printer">Bambu Lab P1S</span></div>
          <div class="w-stat-item"><span class="w-stat-k">Fortschritt / Layer</span><span class="w-stat-v" id="e3d-layer" style="color:#00AE42;">0% (0/0)</span></div>
          <div class="w-stat-item"><span class="w-stat-k">Ma\xDFe / Gewicht</span><span class="w-stat-v" id="e3d-dims">--</span></div>
          <div class="w-stat-item"><span class="w-stat-k">D\xFCse / Heizbett</span><span class="w-stat-v" id="e3d-temps">24\xB0C / 24\xB0C</span></div>
        </div>
        <form onsubmit="submitMini3dPrompt(event)" style="display:flex; gap:6px; margin-bottom:10px;">
          <input id="mini-3d-prompt" class="minimal-input" placeholder="Prompt: 3D-Objekt \xE4ndern oder neu erstellen\u2026" />
          <button type="submit" id="mini-3d-prompt-btn" style="background:#38bdf8; color:#040711; border:none; border-radius:10px; padding:0 12px; font-weight:700; font-size:11.5px; cursor:pointer; white-space:nowrap;">KI</button>
        </form>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <button class="w-action-link" style="color:#fbbf24; margin:0;" onclick="toggleMini3dPlaceholder()" id="btn-mini-3d-toggle">Platzhalter testen</button>
          <button class="w-action-link" style="color:#4ade80; margin:0;" onclick="triggerMini3dPrint()" id="btn-mini-3d-print">\u{1F5A8}\uFE0F Druck starten</button>
          <button class="w-action-link" style="margin:0;" onclick="openFullService('3d-print', '3D Druck Studio')">3D Editor \u2192</button>
        </div>
      </div>
    </div>
  </div>

  <!-- QUICK EVENT MODAL -->
  <div id="quick-event-modal">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <span style="font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#38bdf8;">New Event</span>
      <button onclick="toggleEventModal(false)" style="background:none; border:none; color:rgba(255,255,255,0.5); cursor:pointer;">\u2715</button>
    </div>
    <form onsubmit="createQuickEvent(event)" style="display:flex; flex-direction:column; gap:10px;">
      <input id="qe-title" class="minimal-input" placeholder="Event title..." required />
      <input id="qe-start" type="datetime-local" class="minimal-input" required />
      <div style="display:flex; gap:8px;">
        <input id="qe-dur" type="number" value="60" min="15" step="15" class="minimal-input" placeholder="Minutes" />
        <button type="submit" style="background:#38bdf8; color:#040711; border:none; border-radius:10px; padding:0 16px; font-weight:600; font-size:12px; cursor:pointer; white-space:nowrap;">Add</button>
      </div>
    </form>
  </div>

  <!-- 3 & 4. BOTTOM-ALIGNED MOVING TIMELINE WITH FIXED "NOW" MARKER & GCAL EVENT RECTANGLES -->
  <div id="timeline-dock">
    <div id="timeline-toolbar">
      <div class="tl-controls">
        <button class="tl-pill return-now" id="btn-live-now" onclick="snapToLiveNow()">\u21BA Return to Now</button>
      </div>
      <div class="tl-controls">
        <button class="tl-pill" id="zoom-12" onclick="setTimelineSpan(12)">12h</button>
        <button class="tl-pill active" id="zoom-24" onclick="setTimelineSpan(24)">24h</button>
        <button class="tl-pill" id="zoom-72" onclick="setTimelineSpan(72)">3d</button>
        <button class="tl-pill" id="zoom-168" onclick="setTimelineSpan(168)">7d</button>
        <button class="tl-pill" onclick="toggleEventModal(true)" title="New Calendar Event">+</button>
      </div>
    </div>

    <div id="timeline-viewport">
      <!-- Fixed NOW vertical marker -->
      <div id="fixed-now-marker">
        <div id="fixed-now-badge">NOW</div>
        <div id="fixed-now-orb"></div>
      </div>

      <!-- Continuously moving timeline track -->
      <div id="timeline-world">
        <div id="timeline-axis-line"></div>
        <div id="timeline-ticks-layer"></div>
        <div id="timeline-events-layer"></div>
      </div>
    </div>
  </div>

  <!-- 6. SUBTLE ROOM-GROUPED DEVICE QUICK-ACCESS BAR & UPWARD FLYOUT -->
  <div id="room-flyout" onclick="event.stopPropagation()"></div>
  <div id="room-dock-bar">
    <div class="room-dock-group" id="room-pills-container"></div>
    <div style="display:flex; align-items:center; gap:6px;">
      <button class="room-pill" onclick="openFullService('3d-print', '3D Druck Studio')" title="3D Druck Editor & BambuLab Steuerung \xF6ffnen">
        <span class="room-dot" id="print3d-dock-dot" style="background:#00AE42; box-shadow:0 0 8px #00AE42;"></span>
        <span>3D Druck</span>
        <span class="room-meta" id="print3d-dock-meta">Bambu P1S</span>
      </button>
      <button class="room-pill" onclick="openFullService('camera-vision', 'Camera Vision')" title="Kamera-Objekterkennung & Streams \xF6ffnen">
        <span class="room-dot" id="vision-dock-dot" style="background:#38bdf8; box-shadow:0 0 8px #38bdf8;"></span>
        <span>Vision AI</span>
        <span class="room-meta" id="vision-dock-meta">Zyklisch</span>
      </button>
    </div>
  </div>

  <!-- FULL SERVICE OVERLAY (WHEN LAUNCHING FULL VIEW) -->
  <div id="full-app-overlay">
    <div id="full-app-bar">
      <button onclick="closeFullService()" style="background:none; border:none; color:#38bdf8; font-size:12.5px; font-weight:500; cursor:pointer;">\u2190 Back to Horizon</button>
      <span id="full-app-title" style="font-size:12.5px; font-weight:500; color:rgba(255,255,255,0.65);"></span>
      <span></span>
    </div>
    <iframe id="full-app-frame" src="about:blank"></iframe>
  </div>

  <script>
    ${sidebarStylerScript}

    const base = window.__THASSI_INGRESS_PATH__ || '';
    const NOW_ANCHOR_RATIO = 0.22;

    let calendarEvents = [];
    let roomsData = [];
    let visionSummaryData = null;
    let activeRoomFlyoutId = null;
    let visibleHoursSpan = 24;
    let panOffsetMs = 0;
    let timelineBaseEpochMs = Date.now();

    // Generate twinkling stars once
    (function initStars() {
      const sf = document.getElementById('starfield');
      let html = '';
      for (let i = 0; i < 85; i++) {
        const x = (Math.random() * 100).toFixed(2);
        const y = (Math.random() * 68).toFixed(2);
        const sz = (1 + Math.random() * 2.2).toFixed(1);
        const dur = (2.5 + Math.random() * 4.5).toFixed(1);
        html += \`<div class="star" style="left:\${x}%; top:\${y}%; width:\${sz}px; height:\${sz}px; --dur:\${dur}s;"></div>\`;
      }
      sf.innerHTML = html;
    })();

    // 1. SOLAR POSITION & SKY COLOR ENGINE
    const SUNRISE_HOUR = 6.75; // 06:45
    const SUNSET_HOUR = 18.5;  // 18:30

    function getSkyPalette(h) {
      if (h < 5.2 || h >= 21.2) {
        return {
          sky: 'linear-gradient(180deg, #02040a 0%, #070d1f 48%, #0f172a 78%, #172554 100%)',
          sidebarBg: 'linear-gradient(180deg, #02040a 0%, #060b1a 55%, #03060f 100%)',
          glow: 'radial-gradient(ellipse at 50% 100%, rgba(56, 189, 248, 0.18), transparent 70%)',
          stars: 0.9,
          phase: 'Astronomical Night'
        };
      }
      if (h < 6.5) {
        return {
          sky: 'linear-gradient(180deg, #090d1e 0%, #1e1b4b 42%, #6d28d9 74%, #f97316 100%)',
          sidebarBg: 'linear-gradient(180deg, #070a18 0%, #131130 60%, #060813 100%)',
          glow: 'radial-gradient(ellipse at 25% 100%, rgba(251, 146, 60, 0.65), transparent 72%)',
          stars: 0.45,
          phase: 'Dawn Twilight'
        };
      }
      if (h < 8.0) {
        return {
          sky: 'linear-gradient(180deg, #1d4ed8 0%, #3b82f6 42%, #f472b6 75%, #fbbf24 100%)',
          sidebarBg: 'linear-gradient(180deg, #0c1f5e 0%, #172554 60%, #060b19 100%)',
          glow: 'radial-gradient(ellipse at 22% 100%, rgba(253, 224, 71, 0.8), transparent 75%)',
          stars: 0.05,
          phase: 'Golden Sunrise'
        };
      }
      if (h < 16.5) {
        return {
          sky: 'linear-gradient(180deg, #0369a1 0%, #0284c7 45%, #38bdf8 80%, #bae6fd 100%)',
          sidebarBg: 'linear-gradient(180deg, #042f4e 0%, #073b61 55%, #040917 100%)',
          glow: 'radial-gradient(ellipse at 50% 100%, rgba(254, 249, 195, 0.45), transparent 75%)',
          stars: 0,
          phase: h < 11.5 ? 'Morning Sky' : h < 14 ? 'Solar Noon' : 'Afternoon Sun'
        };
      }
      if (h < 18.8) {
        return {
          sky: 'linear-gradient(180deg, #1e1b4b 0%, #3730a3 36%, #c2410c 72%, #facc15 100%)',
          sidebarBg: 'linear-gradient(180deg, #0f0e29 0%, #1e1b4b 58%, #060814 100%)',
          glow: 'radial-gradient(ellipse at 78% 100%, rgba(251, 146, 60, 0.85), transparent 75%)',
          stars: 0.15,
          phase: 'Golden Hour'
        };
      }
      return {
        sky: 'linear-gradient(180deg, #050814 0%, #1e1b4b 46%, #4c1d95 76%, #9a3412 100%)',
        sidebarBg: 'linear-gradient(180deg, #040711 0%, #110f2b 58%, #04060f 100%)',
        glow: 'radial-gradient(ellipse at 82% 100%, rgba(234, 88, 12, 0.45), transparent 70%)',
        stars: 0.65,
        phase: 'Dusk Twilight'
      };
    }

    function computeSunPoint(hourFloat, vw, vh) {
      const horizonY = vh * 0.65;
      const zenithY = vh * 0.12;
      const nadirY = vh * 0.82;

      const x = vw * (0.06 + (hourFloat / 24) * 0.88);
      const daySpan = SUNSET_HOUR - SUNRISE_HOUR;
      const angle = ((hourFloat - SUNRISE_HOUR) / daySpan) * Math.PI;
      const sinVal = Math.sin(angle);
      const y = sinVal >= 0
        ? horizonY - sinVal * (horizonY - zenithY)
        : horizonY - sinVal * (nadirY - horizonY);

      return { x, y, aboveHorizon: sinVal >= -0.08, elevationPct: Math.round(sinVal * 100) };
    }

    function renderSolarArcPaths() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let fullPath = '';
      let dayPath = '';
      for (let h = 0; h <= 24; h += 0.25) {
        const pt = computeSunPoint(h, vw, vh);
        fullPath += (h === 0 ? 'M' : 'L') + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ' ';
        if (h >= SUNRISE_HOUR && h <= SUNSET_HOUR) {
          dayPath += (dayPath === '' ? 'M' : 'L') + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ' ';
        }
      }
      document.getElementById('solar-arc-path').setAttribute('d', fullPath);
      document.getElementById('solar-day-path').setAttribute('d', dayPath);
    }

    function updateSkyAndSun(now) {
      const effectiveHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
      const palette = getSkyPalette(effectiveHour);

      document.getElementById('sky-stage').style.background = palette.sky;
      document.getElementById('horizon-glow').style.background = palette.glow;
      document.getElementById('starfield').style.opacity = String(palette.stars);

      if (window.syncThassiSidebarSky) {
        window.syncThassiSidebarSky(palette.sidebarBg);
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const sunPt = computeSunPoint(effectiveHour, vw, vh);

      const sunEl = document.getElementById('sun-assembly');
      sunEl.style.left = sunPt.x.toFixed(1) + 'px';
      sunEl.style.top = sunPt.y.toFixed(1) + 'px';
      sunEl.style.opacity = sunPt.aboveHorizon ? '1' : '0.28';

      const moonHour = (effectiveHour + 12) % 24;
      const moonPt = computeSunPoint(moonHour, vw, vh);
      const moonEl = document.getElementById('moon-assembly');
      moonEl.style.left = moonPt.x.toFixed(1) + 'px';
      moonEl.style.top = moonPt.y.toFixed(1) + 'px';
      moonEl.style.opacity = sunPt.aboveHorizon ? '0' : '0.92';

      document.getElementById('solar-phase-text').textContent =
        \`\${palette.phase}  \xB7  Sunrise 06:45  \xB7  Sunset 18:30\`;
    }

    // 2. LARGE CLOCK & CONTINUOUS LEFTWARD TIMELINE LOOP
    function getPxPerMs() {
      return window.innerWidth / (visibleHoursSpan * 3600 * 1000);
    }

    function tickClockAndTimeline() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');

      document.getElementById('hero-time').textContent = \`\${hh}:\${mm}\`;
      document.getElementById('hero-seconds').textContent = ss;
      document.getElementById('hero-date').textContent = now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      document.getElementById('fixed-now-badge').textContent = \`NOW \xB7 \${hh}:\${mm}\`;

      updateSkyAndSun(now);

      const pxPerMs = getPxPerMs();
      const nowOffsetFromBasePx = (now.getTime() + panOffsetMs - timelineBaseEpochMs) * pxPerMs;
      const fixedNowX = window.innerWidth * NOW_ANCHOR_RATIO;
      const worldTranslateX = fixedNowX - nowOffsetFromBasePx;
      document.getElementById('timeline-world').style.transform = \`translate3d(\${worldTranslateX.toFixed(2)}px, 0, 0)\`;
    }

    // 3 & 4. RENDER TIMELINE TICKS & GOOGLE CALENDAR EVENT RECTANGLES
    function renderTimelineGeometry() {
      const nowMs = Date.now();
      timelineBaseEpochMs = nowMs;
      const pxPerMs = getPxPerMs();

      const startSpanMs = nowMs - 36 * 3600 * 1000;
      const endSpanMs = nowMs + 8 * 24 * 3600 * 1000;

      const stepHours = visibleHoursSpan <= 12 ? 1 : visibleHoursSpan <= 24 ? 2 : visibleHoursSpan <= 72 ? 6 : 12;
      const firstTick = new Date(startSpanMs);
      firstTick.setMinutes(0, 0, 0);
      firstTick.setHours(Math.floor(firstTick.getHours() / stepHours) * stepHours);

      let ticksHtml = '';
      for (let t = firstTick.getTime(); t <= endSpanMs; t += stepHours * 3600 * 1000) {
        const d = new Date(t);
        const h = d.getHours();
        const isDayStart = h === 0;
        const isMajor = h % 6 === 0;
        const xPx = (t - timelineBaseEpochMs) * pxPerMs;

        const label = isDayStart
          ? d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
          : \`\${String(h).padStart(2, '0')}:00\`;

        ticksHtml += \`
          <div class="tl-tick \${isDayStart ? 'day-start' : isMajor ? 'major' : ''}" style="left:\${xPx.toFixed(1)}px;">
            <div class="tl-tick-mark"></div>
            <div class="tl-tick-label">\${label}</div>
          </div>
        \`;
      }
      document.getElementById('timeline-ticks-layer').innerHTML = ticksHtml;

      const catPalette = {
        work:     { border: '#38bdf8', glow: 'rgba(56, 189, 248, 0.35)' },
        focus:    { border: '#818cf8', glow: 'rgba(129, 140, 248, 0.35)' },
        health:   { border: '#4ade80', glow: 'rgba(74, 222, 128, 0.35)' },
        social:   { border: '#f472b6', glow: 'rgba(244, 114, 182, 0.35)' },
        personal: { border: '#fbbf24', glow: 'rgba(251, 191, 36, 0.35)' },
      };

      const sorted = [...calendarEvents]
        .map((ev) => {
          const s = new Date(ev.start_time).getTime();
          const e = Math.max(s + 30 * 60000, new Date(ev.end_time).getTime());
          return { ...ev, s, e };
        })
        .filter((ev) => Number.isFinite(ev.s) && ev.e >= startSpanMs && ev.s <= endSpanMs)
        .sort((a, b) => a.s - b.s);

      const laneEndPx = [-Infinity, -Infinity, -Infinity];
      let eventsHtml = '';

      for (const ev of sorted) {
        const leftPx = (ev.s - timelineBaseEpochMs) * pxPerMs;
        const rawWidthPx = (ev.e - ev.s) * pxPerMs;
        const widthPx = Math.max(135, rawWidthPx);

        let lane = 0;
        for (let l = 0; l < laneEndPx.length; l++) {
          if (leftPx >= laneEndPx[l] + 8) {
            lane = l;
            break;
          }
          if (l === laneEndPx.length - 1) lane = l;
        }
        laneEndPx[lane] = leftPx + widthPx;

        const bottomPx = 48 + lane * 52;
        const pal = catPalette[ev.category] || catPalette.personal;
        const isNow = ev.s <= nowMs && ev.e >= nowMs;
        const isPast = ev.e < nowMs;

        const startStr = new Date(ev.s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endStr = new Date(ev.e).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dayStr = new Date(ev.s).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

        eventsHtml += \`
          <div class="tl-event-rect \${isNow ? 'is-now' : ''} \${isPast ? 'is-past' : ''}"
               style="left:\${leftPx.toFixed(1)}px; width:\${widthPx.toFixed(1)}px; bottom:\${bottomPx}px; --ev-color:\${pal.border}; --ev-glow:\${pal.glow};"
               title="\${ev.title.replace(/"/g, '&quot;')} (\${dayStr}, \${startStr} \u2013 \${endStr}) \xB7 \${ev.calendar_name || 'Google Calendar'}">
            <div class="tl-ev-title">\${ev.title}</div>
            <div class="tl-ev-meta">\${startStr}\u2013\${endStr} \xB7 \${ev.calendar_name || ev.category}</div>
          </div>
        \`;
      }

      document.getElementById('timeline-events-layer').innerHTML = eventsHtml;
      tickClockAndTimeline();
    }

    function setTimelineSpan(hours) {
      visibleHoursSpan = hours;
      ['12', '24', '72', '168'].forEach((id) => {
        const el = document.getElementById('zoom-' + id);
        if (el) el.classList.toggle('active', Number(id) === hours);
      });
      renderTimelineGeometry();
    }

    function snapToLiveNow() {
      panOffsetMs = 0;
      document.getElementById('btn-live-now').style.display = 'none';
      tickClockAndTimeline();
    }

    (function initTimelineDrag() {
      const vp = document.getElementById('timeline-viewport');
      let dragging = false;
      let startX = 0;
      let startPanMs = 0;

      vp.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.tl-event-rect')) return;
        dragging = true;
        startX = e.clientX;
        startPanMs = panOffsetMs;
        vp.setPointerCapture(e.pointerId);
      });
      vp.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        panOffsetMs = startPanMs - dx / getPxPerMs();
        document.getElementById('btn-live-now').style.display = 'inline-block';
        tickClockAndTimeline();
      });
      vp.addEventListener('pointerup', () => { dragging = false; });
    })();

    function toggleWidget(id, ev) {
      if (ev) ev.stopPropagation();
      const target = document.getElementById('widget-' + id);
      const isAlreadyOpen = target.classList.contains('expanded');
      document.querySelectorAll('.ambient-widget').forEach((w) => w.classList.remove('expanded'));
      if (!isAlreadyOpen) {
        target.classList.add('expanded');
      }
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.ambient-widget')) {
        document.querySelectorAll('.ambient-widget').forEach((w) => w.classList.remove('expanded'));
      }
      if (!e.target.closest('#room-flyout') && !e.target.closest('.room-pill')) {
        closeRoomFlyout();
      }
    });

    function closeRoomFlyout() {
      activeRoomFlyoutId = null;
      const flyout = document.getElementById('room-flyout');
      if (flyout) flyout.style.display = 'none';
      document.querySelectorAll('.room-pill').forEach((p) => p.classList.remove('active-flyout'));
    }

    function openRoomFlyout(roomId, ev) {
      if (ev) ev.stopPropagation();
      if (activeRoomFlyoutId === roomId) {
        closeRoomFlyout();
        return;
      }
      activeRoomFlyoutId = roomId;
      renderRoomDockBar();

      const flyout = document.getElementById('room-flyout');
      const pillEl = document.getElementById('room-pill-' + roomId);
      if (pillEl && flyout) {
        const rect = pillEl.getBoundingClientRect();
        const maxLeft = Math.max(16, window.innerWidth - 360);
        const targetLeft = Math.min(maxLeft, Math.max(16, rect.left));
        flyout.style.left = targetLeft + 'px';
      }
      renderActiveRoomFlyout();
    }

    function renderRoomDockBar() {
      const container = document.getElementById('room-pills-container');
      if (!container) return;

      container.innerHTML = roomsData
        .map((r) => {
          const hasOn = r.activeCount > 0;
          const hasMotion = Boolean(r.motionActive);
          const isActive = activeRoomFlyoutId === r.id;

          const metaParts = [];
          if (r.tempC != null) metaParts.push(r.tempC.toFixed(1) + '\xB0');
          if (r.activeCount > 0) metaParts.push(r.activeCount + ' an');
          if (r.totalPowerW > 0.5) metaParts.push(Math.round(r.totalPowerW) + 'W');
          if (hasMotion) metaParts.push('Bewegung');
          if (r.id === 'kameras_vision') {
            metaParts.push(
              visionSummaryData?.lastTotalObjects
                ? visionSummaryData.lastTotalObjects + ' Obj'
                : r.devices.length + ' Cams'
            );
          }

          return \`
            <button id="room-pill-\${r.id}"
                    class="room-pill \${hasOn ? 'has-on' : ''} \${hasMotion ? 'has-motion' : ''} \${isActive ? 'active-flyout' : ''}"
                    onclick="openRoomFlyout('\${r.id}', event)">
              <span class="room-dot"></span>
              <span>\${r.name}</span>
              \${metaParts.length > 0 ? \`<span class="room-meta">\${metaParts.join(' \xB7 ')}</span>\` : ''}
            </button>
          \`;
        })
        .join('');

      const vMeta = document.getElementById('vision-dock-meta');
      if (vMeta && visionSummaryData) {
        vMeta.textContent = visionSummaryData.lastSceneSummary
          ? (visionSummaryData.lastTotalObjects || 0) + ' Objekte'
          : 'Zyklisch';
      }
    }

    function renderActiveRoomFlyout() {
      const flyout = document.getElementById('room-flyout');
      if (!flyout || !activeRoomFlyoutId) return;
      const room = roomsData.find((r) => r.id === activeRoomFlyoutId);
      if (!room) {
        closeRoomFlyout();
        return;
      }

      const subParts = [];
      if (room.tempC != null) subParts.push(room.tempC.toFixed(1) + ' \xB0C');
      if (room.humidityPct != null) subParts.push(Math.round(room.humidityPct) + '% rF');
      if (room.totalPowerW > 0) subParts.push(room.totalPowerW.toFixed(1) + ' W');

      const rowsHtml = room.devices
        .map((d) => {
          const pwr = d.powerW != null && d.powerW > 0 ? \`<span class="rf-power-badge">\${d.powerW.toFixed(1)} W</span>\` : '';

          if (d.kind === 'toggle' || d.kind === 'rgbw') {
            const extraRgbw =
              d.kind === 'rgbw' && d.isOn
                ? \`
                  <div class="rf-slider-row">
                    <span style="font-size:10px; color:rgba(255,255,255,0.45);">Dim</span>
                    <input type="range" min="5" max="100" value="\${d.brightness || 80}" class="rf-slider"
                           onchange="triggerDeviceAction('\${d.entityId}', 'brightness', { brightnessPct: Number(this.value) })" />
                  </div>
                  \${
                    Array.isArray(d.effectList) && d.effectList.length > 0
                      ? \`<div class="rf-effect-pills">
                          \${d.effectList
                            .map(
                              (fx) =>
                                \`<button class="rf-fx-pill \${d.effect === fx ? 'active' : ''}" onclick="triggerDeviceAction('\${d.entityId}', 'effect', { effect: '\${fx}' })">\${fx}</button>\`
                            )
                            .join('')}
                        </div>\`
                      : ''
                  }
                \`
                : '';

            return \`
              <div class="rf-dev-row \${d.isOn ? 'is-on' : ''}">
                <div class="rf-dev-main">
                  <span class="rf-dev-label">\${d.label}</span>
                  <div class="rf-dev-right">
                    \${pwr}
                    <button class="rf-toggle-btn \${d.isOn ? 'on' : ''}"
                            onclick="triggerDeviceAction('\${d.entityId}', 'toggle')">
                      \${d.isOn ? 'AN' : 'AUS'}
                    </button>
                  </div>
                </div>
                \${extraRgbw}
              </div>
            \`;
          }

          if (d.kind === 'camera') {
            const camLive = d.state === 'recording' || d.state === 'streaming';
            const currentMode = (visionSummaryData?.cameraModes && visionSummaryData.cameraModes[d.entityId]) || 'Personen';
            const modes = ['Personen', 'Fahrzeuge', 'Objekte', 'Kamera', 'Aktivit\xE4ten'];
            return \`
              <div class="rf-dev-row \${camLive ? 'is-on' : ''}">
                <div class="rf-dev-main">
                  <span class="rf-dev-label">\${d.label}</span>
                  <div class="rf-dev-right">
                    <span class="rf-power-badge" style="color:\${camLive ? '#4ade80' : '#fbbf24'};">
                      \${camLive ? 'Aktiv' : 'QR-Auth'}
                    </span>
                    <button class="rf-toggle-btn" onclick="triggerQuickVisionSample('\${d.entityId}', this)">
                      Abtasten
                    </button>
                  </div>
                </div>
                <div class="rf-effect-pills">
                  \${modes
                    .map(
                      (m) =>
                        \`<button class="rf-fx-pill \${currentMode === m ? 'active' : ''}" style="\${currentMode === m ? 'background:#38bdf8; color:#040711; font-weight:600;' : ''}" onclick="setCameraModeFromFlyout('\${d.entityId}', '\${m}')">\${m}</button>\`
                    )
                    .join('')}
                </div>
              </div>
            \`;
          }

          // Sensor row
          const formattedState =
            d.state === 'on'
              ? 'Bewegung erkannt'
              : d.state === 'off'
                ? 'Ruhig'
                : d.state === 'unavailable'
                  ? 'Offline'
                  : \`\${d.state}\${d.unit ? ' ' + d.unit : ''}\`;

          return \`
            <div class="rf-dev-row">
              <div class="rf-dev-main">
                <span class="rf-dev-label">\${d.label}</span>
                <span class="rf-power-badge" style="color:rgba(248,250,252,0.75);">\${formattedState}</span>
              </div>
            </div>
          \`;
        })
        .join('');

      const footerHtml =
        room.id === 'kameras_vision'
          ? \`
            <div style="display:flex; justify-content:space-between; align-items:center; padding-top:4px;">
              <span style="font-size:11px; color:rgba(255,255,255,0.48);">
                \${visionSummaryData?.lastSceneSummary ? visionSummaryData.lastSceneSummary.slice(0, 36) : 'Lokales COCO-SSD aktiv'}
              </span>
              <button class="w-action-link" style="margin:0;" onclick="closeRoomFlyout(); openFullService('camera-vision', 'Camera Vision')">
                Vision \xF6ffnen \u2192
              </button>
            </div>
          \`
          : room.activeCount > 0
            ? \`
              <div style="display:flex; justify-content:space-between; align-items:center; padding-top:4px;">
                <button class="w-action-link" style="margin:0; color:#fbbf24;" onclick="turnOffAllInRoom('\${room.id}')">
                  Alle im Raum ausschalten
                </button>
                <button class="w-action-link" style="margin:0;" onclick="closeRoomFlyout(); openFullService('smart-canvas', 'Smart Home')">
                  Canvas \u2192
                </button>
              </div>
            \`
            : \`
              <div style="display:flex; justify-content:flex-end; padding-top:4px;">
                <button class="w-action-link" style="margin:0;" onclick="closeRoomFlyout(); openFullService('smart-canvas', 'Smart Home')">
                  Smart Canvas \u2192
                </button>
              </div>
            \`;

      flyout.innerHTML = \`
        <div class="rf-header">
          <span class="rf-title">\${room.name}</span>
          <span class="rf-subtitle">\${subParts.join(' \xB7 ') || (room.activeCount + ' aktiv')}</span>
        </div>
        <div class="rf-dev-list">\${rowsHtml}</div>
        \${footerHtml}
      \`;
      flyout.style.display = 'flex';
    }

    async function setCameraModeFromFlyout(cameraId, mode) {
      try {
        await fetch(base + '/api/apps/camera-vision/camera-mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ camera_id: cameraId, optimization_mode: mode }),
        });
        await loadRoomsQuickAccess();
      } catch (e) {
        console.error('Failed setting camera mode:', e);
      }
    }

    async function triggerDeviceAction(entityId, action, extra) {
      try {
        await fetch(base + '/api/system/device-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityId, action, ...(extra || {}) }),
        });
        await loadRoomsQuickAccess();
      } catch (e) {
        console.error('Device action failed:', e);
      }
    }

    async function turnOffAllInRoom(roomId) {
      const room = roomsData.find((r) => r.id === roomId);
      if (!room) return;
      const activeDevs = room.devices.filter((d) => (d.kind === 'toggle' || d.kind === 'rgbw') && d.isOn);
      await Promise.all(
        activeDevs.map((d) =>
          fetch(base + '/api/system/device-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entityId: d.entityId, action: 'turn_off' }),
          })
        )
      );
      await loadRoomsQuickAccess();
    }

    async function triggerQuickVisionSample(cameraId, btnEl) {
      if (btnEl) btnEl.textContent = 'Pr\xFCfe\u2026';
      try {
        await fetch(base + '/api/apps/camera-vision/sample-now', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ camera_id: cameraId }),
        });
        await loadRoomsQuickAccess();
      } finally {
        if (btnEl) btnEl.textContent = 'Abtasten';
      }
    }

    async function loadRoomsQuickAccess() {
      try {
        const res = await fetch(base + '/api/system/rooms');
        if (!res.ok) return;
        const data = await res.json();
        roomsData = data.rooms || [];
        visionSummaryData = data.visionSummary || null;
        renderRoomDockBar();
        if (activeRoomFlyoutId) {
          renderActiveRoomFlyout();
        }
      } catch (e) {
        console.error('Failed loading rooms quick access:', e);
      }
    }

    function openFullService(appId, title) {
      document.getElementById('full-app-title').textContent = title;
      document.getElementById('full-app-frame').src = base + '/apps/' + appId + '/';
      document.getElementById('full-app-overlay').style.display = 'flex';
    }

    function closeFullService() {
      document.getElementById('full-app-overlay').style.display = 'none';
      document.getElementById('full-app-frame').src = 'about:blank';
      loadAllLiveData();
    }

    function toggleEventModal(show) {
      const m = document.getElementById('quick-event-modal');
      m.style.display = show ? 'block' : 'none';
      if (show) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('qe-start').value = now.toISOString().slice(0, 16);
        document.getElementById('qe-title').focus();
      }
    }

    async function createQuickEvent(e) {
      e.preventDefault();
      const title = document.getElementById('qe-title').value.trim();
      const startVal = document.getElementById('qe-start').value;
      const dur = Number(document.getElementById('qe-dur').value || 60);
      if (!title || !startVal) return;

      await fetch(base + '/api/apps/google-calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          start_time: new Date(startVal).toISOString(),
          duration_minutes: dur
        })
      });
      document.getElementById('qe-title').value = '';
      toggleEventModal(false);
      await loadAllLiveData();
    }

    async function addNote(e) {
      e.preventDefault();
      const input = document.getElementById('note-input');
      const content = input.value.trim();
      if (!content) return;
      input.value = '';
      await fetch(base + '/api/system/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      await loadAllLiveData();
    }

    async function deleteNote(id) {
      await fetch(base + '/api/system/notes?id=' + id, { method: 'DELETE' });
      await loadAllLiveData();
    }

    async function loadAllLiveData() {
      try {
        void loadRoomsQuickAccess();
        const [sysRes, calRes] = await Promise.all([
          fetch(base + '/api/system/status'),
          fetch(base + '/api/apps/google-calendar/dashboard').catch(() => null)
        ]);
        const sys = await sysRes.json();
        const calData = calRes && calRes.ok ? await calRes.json() : { events: [] };

        calendarEvents = calData.events || [];
        renderTimelineGeometry();

        // 1. Update HEALTH widget
        const h = sys.summaries?.health;
        if (h && (h.steps != null || h.currentHr != null)) {
          const stepsTxt = h.steps != null ? Number(h.steps).toLocaleString() + ' steps' : 'No steps';
          const hrTxt = h.currentHr != null ? h.currentHr + ' bpm' : '';
          document.getElementById('compact-health').innerHTML = \`<strong>\${stepsTxt}</strong> \${hrTxt ? '\xB7 ' + hrTxt : ''}\`;
          document.getElementById('sub-health').textContent =
            h.readinessScore != null ? \`\${h.readinessScore}% readiness \xB7 \${h.readinessStatus || 'Pixel 10'}\` : (h.source || 'Pixel 10');
          document.getElementById('eh-steps').textContent = h.steps != null ? Number(h.steps).toLocaleString() : 'No data';
          document.getElementById('eh-ready').textContent = h.readinessScore != null ? h.readinessScore + '/100' : 'No data';
          document.getElementById('eh-hr').textContent = h.currentHr != null ? h.currentHr + ' bpm' : 'No data';
          document.getElementById('eh-rhr').textContent =
            (h.restingHr != null ? h.restingHr + ' bpm' : '--') + ' / ' + (h.hrvMs != null ? h.hrvMs + ' ms' : '--');
          document.getElementById('eh-sleep').textContent = h.sleepHours != null ? h.sleepHours + ' h' : 'No data';
          document.getElementById('eh-burn').textContent =
            (h.activeCalories != null ? h.activeCalories + ' kcal' : '--') + ' \xB7 ' + (h.distanceKm != null ? h.distanceKm + ' km' : '--');
        } else {
          document.getElementById('compact-health').textContent = 'No data';
          document.getElementById('sub-health').textContent = 'Waiting for Pixel 10 telemetry';
        }

        // 2. Update FINANCES widget
        const f = sys.summaries?.finance;
        if (f && (f.income || f.expenses)) {
          const net = Number(f.netCashflow || 0);
          const sign = net >= 0 ? '+' : '';
          document.getElementById('compact-finances').innerHTML = \`<strong>\${sign}\u20AC\${net.toFixed(0)}</strong> \xB7 -\u20AC\${Number(f.expenses || 0).toFixed(0)}\`;
          document.getElementById('sub-finances').textContent = \`George \xB7 \${f.activeMonth || 'Current'}\`;
          document.getElementById('ef-inc').textContent = '+\u20AC' + Number(f.income || 0).toFixed(0);
          document.getElementById('ef-exp').textContent = '-\u20AC' + Number(f.expenses || 0).toFixed(0);
          document.getElementById('ef-inv').textContent = '\u20AC' + Number(f.investments || 0).toFixed(0);
          document.getElementById('ef-groc').textContent = '\u20AC' + Number(f.grocerySpend || 0).toFixed(0);
        } else {
          document.getElementById('compact-finances').textContent = 'No data';
          document.getElementById('sub-finances').textContent = 'No bank CSV imported';
        }

        // 3. Update NOTES widget
        const notes = sys.notes || [];
        if (notes.length > 0) {
          const latest = notes[0].content;
          document.getElementById('compact-notes').innerHTML = \`<strong>\${notes.length} \${notes.length === 1 ? 'note' : 'notes'}</strong>\`;
          document.getElementById('sub-notes').textContent = latest.length > 28 ? latest.slice(0, 28) + '\u2026' : latest;
          document.getElementById('notes-list').innerHTML = notes
            .map((n) => \`
              <div class="note-row">
                <span>\${n.content}</span>
                <button class="note-del" onclick="deleteNote(\${n.id})">\u2715</button>
              </div>
            \`)
            .join('');
        } else {
          document.getElementById('compact-notes').textContent = '0 notes';
          document.getElementById('sub-notes').textContent = 'Tap to write a quick note';
          document.getElementById('notes-list').innerHTML = '<div style="font-size:12px; color:rgba(255,255,255,0.4);">No notes saved yet.</div>';
        }

        // 4. Update MEALS widget
        const m = sys.summaries?.meals;
        if (m && (m.breakfast || m.lunch || m.dinner)) {
          const nextMeal = m.dinner || m.lunch || m.breakfast;
          document.getElementById('compact-meals').innerHTML = \`<strong>\${nextMeal}</strong>\`;
          document.getElementById('sub-meals').textContent = \`\${m.totalCalories || 0} kcal planned today\`;
          document.getElementById('em-slots').innerHTML = \`
            <div>\u{1F305} <strong>Breakfast:</strong> \${m.breakfast || '\u2014'}</div>
            <div>\u2600\uFE0F <strong>Lunch:</strong> \${m.lunch || '\u2014'}</div>
            <div>\u{1F319} <strong>Dinner:</strong> \${m.dinner || '\u2014'}</div>
          \`;
        } else {
          document.getElementById('compact-meals').textContent = 'Unplanned';
          document.getElementById('sub-meals').textContent = 'No meals logged for today';
          document.getElementById('em-slots').innerHTML = 'No meals planned for today yet.';
        }

        // 5. Update 3D PRINT Mini-Preview Widget
        await refreshMini3dData(sys.summaries?.print3d);
      } catch (err) {
        console.error('Failed loading dashboard data:', err);
      }
    }

    // ============================================================================
    // 3D PRINT MINI-PREVIEW RENDERER & CONTROLS (3D OBJECT + PROGRESS + PLACEHOLDER)
    // ============================================================================
    let mini3dState = {
      hasActiveProject: false,
      activeProjectId: null,
      projectName: null,
      scene: null,
      stats: null,
      printer: {
        name: 'Bambu Lab P1S',
        status: 'IDLE',
        progressPercent: 0,
        currentLayer: 0,
        totalLayers: 0,
        remainingMinutes: 0,
        nozzleTemp: 24,
        bedTemp: 24,
      },
      yaw: 0.65,
      pitch: 0.42,
      dragging: false,
      lastX: 0,
      lastY: 0,
      triangles: [],
      maxExtent: 60,
      centerZ: 20,
    };

    function buildMiniTrianglesFromScene(scene) {
      if (!scene || !Array.isArray(scene.nodes) || scene.nodes.length === 0) return [];
      const tris = [];
      for (const n of scene.nodes) {
        if (n.operation === 'subtract') continue;
        const p = n.params || {};
        const pos = n.position || [0, 0, 0];
        const col = n.color || scene.primaryColor || '#00AE42';
        const w = (p.width || (p.radius ? p.radius * 2 : 36)) / 2;
        const d = (p.depth || (p.radius ? p.radius * 2 : 36)) / 2;
        const h = p.height || (p.radius ? p.radius * 2 : 30);
        const cx = pos[0] || 0;
        const cy = pos[1] || 0;
        const z0 = pos[2] || 0;
        const z1 = z0 + h;

        if (n.type === 'cylinder' || n.type === 'cone' || n.type === 'gear' || n.type === 'twisted_vase' || n.type === 'hex_organizer' || n.type === 'sphere' || n.type === 'torus') {
          const segs = n.type === 'hex_organizer' ? 6 : 16;
          const rBot = (p.radiusBottom || p.outerRadius || p.radius || w);
          const rTop = n.type === 'cone' ? (p.radiusTop != null ? p.radiusTop : rBot * 0.2) : rBot;
          for (let i = 0; i < segs; i++) {
            const a0 = (i / segs) * Math.PI * 2;
            const a1 = ((i + 1) / segs) * Math.PI * 2;
            const x0b = cx + Math.cos(a0) * rBot, y0b = cy + Math.sin(a0) * rBot;
            const x1b = cx + Math.cos(a1) * rBot, y1b = cy + Math.sin(a1) * rBot;
            const x0t = cx + Math.cos(a0) * rTop, y0t = cy + Math.sin(a0) * rTop;
            const x1t = cx + Math.cos(a1) * rTop, y1t = cy + Math.sin(a1) * rTop;
            tris.push({ v: [[x0b, y0b, z0], [x1b, y1b, z0], [x1t, y1t, z1]], c: col });
            tris.push({ v: [[x0b, y0b, z0], [x1t, y1t, z1], [x0t, y0t, z1]], c: col });
            tris.push({ v: [[cx, cy, z1], [x0t, y0t, z1], [x1t, y1t, z1]], c: col });
          }
        } else {
          // Box / Bracket / Default
          const v = [
            [cx - w, cy - d, z0], [cx + w, cy - d, z0], [cx + w, cy + d, z0], [cx - w, cy + d, z0],
            [cx - w, cy - d, z1], [cx + w, cy - d, z1], [cx + w, cy + d, z1], [cx - w, cy + d, z1]
          ];
          const faces = [
            [4, 5, 6], [4, 6, 7],
            [0, 1, 5], [0, 5, 4],
            [1, 2, 6], [1, 6, 5],
            [2, 3, 7], [2, 7, 6],
            [3, 0, 4], [3, 4, 7]
          ];
          for (const f of faces) {
            tris.push({ v: [v[f[0]], v[f[1]], v[f[2]]], c: col });
          }
        }
      }
      return tris;
    }

    async function refreshMini3dData(summaryFromSys) {
      try {
        const res = await fetch(base + '/api/apps/3d-print/dashboard');
        if (res.ok) {
          const data = await res.json();
          applyMini3dDashboardPayload(data);
          return;
        }
      } catch {}
      if (summaryFromSys) {
        applyMini3dDashboardPayload(summaryFromSys);
      }
    }

    function applyMini3dDashboardPayload(data) {
      if (!data) return;
      const hasProj = Boolean(data.hasActiveProject && (data.activeProject || data.scene));
      const proj = data.activeProject || data;
      const scene = proj.scene || data.scene || null;
      const stats = proj.stats || data.stats || null;
      const tel = data.telemetry || data.printer || {};
      const cfg = data.printerConfig || {};

      const printer = {
        name: cfg.printerName || tel.name || 'Bambu Lab P1S',
        status: tel.printerState || tel.status || 'IDLE',
        progressPercent: Number(tel.progressPercent ?? proj.progressPct ?? 0),
        currentLayer: Number(tel.currentLayer ?? 0),
        totalLayers: Number(tel.totalLayers ?? (stats && stats.layerCount ? stats.layerCount : 0)),
        remainingMinutes: Number(tel.remainingMinutes ?? (stats && stats.estimatedPrintMinutes ? stats.estimatedPrintMinutes : 0)),
        nozzleTemp: Number(tel.nozzleTempC ?? tel.nozzleTemp ?? 24),
        bedTemp: Number(tel.bedTempC ?? tel.bedTemp ?? 24),
      };

      mini3dState.hasActiveProject = hasProj;
      mini3dState.activeProjectId = proj.id || data.activeProjectId || null;
      mini3dState.projectName = proj.title || proj.name || data.projectName || null;
      mini3dState.scene = scene;
      mini3dState.stats = stats;
      mini3dState.printer = printer;

      const rawDims = stats && stats.dimensionsMm ? stats.dimensionsMm : null;
      const dimX = rawDims ? (Array.isArray(rawDims) ? rawDims[0] : rawDims.x) : 60;
      const dimY = rawDims ? (Array.isArray(rawDims) ? rawDims[1] : rawDims.y) : 60;
      const dimZ = rawDims ? (Array.isArray(rawDims) ? rawDims[2] : rawDims.z) : 45;

      if (hasProj && scene) {
        mini3dState.triangles = buildMiniTrianglesFromScene(scene);
        mini3dState.maxExtent = Math.max(dimX || 50, dimY || 50, dimZ || 40, 35);
        mini3dState.centerZ = (dimZ || 40) * 0.45;
      } else {
        mini3dState.triangles = [];
      }

      const compactEl = document.getElementById('compact-3dprint');
      const subEl = document.getElementById('sub-3dprint');
      const fillEl = document.getElementById('mini-3d-progress-fill');
      const dotEl = document.getElementById('dot-3dprint');
      const ePrinter = document.getElementById('e3d-printer');
      const eLayer = document.getElementById('e3d-layer');
      const eDims = document.getElementById('e3d-dims');
      const eTemps = document.getElementById('e3d-temps');
      const btnToggle = document.getElementById('btn-mini-3d-toggle');

      const pct = Number(printer.progressPercent || 0);
      if (fillEl) fillEl.style.width = Math.max(0, Math.min(100, pct)) + '%';

      if (!hasProj) {
        if (compactEl) compactEl.textContent = 'Kein 3D-Projekt';
        if (subEl) subEl.textContent = 'Platzhalter aktiv \xB7 0%';
        if (dotEl) {
          dotEl.style.background = '#94a3b8';
          dotEl.style.boxShadow = '0 0 8px rgba(148,163,184,0.5)';
        }
        if (eDims) eDims.textContent = 'Kein Objekt geladen';
        if (btnToggle) btnToggle.textContent = 'Projekt laden';
      } else {
        if (compactEl) compactEl.textContent = mini3dState.projectName || '3D Objekt';
        const isPrinting = printer.status === 'RUNNING' || printer.status === 'PREPARE';
        const statusLabel = isPrinting
          ? ('Druckt \xB7 ' + pct + '% (' + (printer.remainingMinutes || 0) + 'm)')
          : (rawDims
              ? (Math.round(dimX) + '\xD7' + Math.round(dimY) + '\xD7' + Math.round(dimZ) + 'mm \xB7 ' + (pct > 0 ? pct + '%' : 'Bereit'))
              : 'Bereit zum Druck');
        if (subEl) subEl.textContent = statusLabel;
        if (dotEl) {
          const c = isPrinting ? '#38bdf8' : '#00AE42';
          dotEl.style.background = c;
          dotEl.style.boxShadow = '0 0 10px ' + c;
        }
        if (eDims && rawDims) {
          const weightG = stats.filamentWeightG || stats.estimatedWeightGrams || 15;
          eDims.textContent = Math.round(dimX) + '\xD7' + Math.round(dimY) + '\xD7' + Math.round(dimZ) + 'mm \xB7 ' + weightG + 'g';
        }
        if (btnToggle) btnToggle.textContent = 'Platzhalter testen';
      }

      if (ePrinter) ePrinter.textContent = (printer.name || 'Bambu Lab P1S') + ' (' + (printer.status || 'IDLE') + ')';
      if (eLayer) eLayer.textContent = pct + '% (' + (printer.currentLayer || 0) + '/' + (printer.totalLayers || 0) + ')';
      if (eTemps) eTemps.textContent = Math.round(printer.nozzleTemp || 24) + '\xB0C / ' + Math.round(printer.bedTemp || 24) + '\xB0C';
    }

    function initMini3dCanvas() {
      const canvas = document.getElementById('mini-3d-canvas');
      if (!canvas) return;

      canvas.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        mini3dState.dragging = true;
        mini3dState.lastX = e.clientX;
        mini3dState.lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!mini3dState.dragging) return;
        e.stopPropagation();
        const dx = e.clientX - mini3dState.lastX;
        const dy = e.clientY - mini3dState.lastY;
        mini3dState.lastX = e.clientX;
        mini3dState.lastY = e.clientY;
        mini3dState.yaw += dx * 0.018;
        mini3dState.pitch = Math.max(-1.2, Math.min(1.2, mini3dState.pitch + dy * 0.018));
      });
      canvas.addEventListener('pointerup', (e) => {
        mini3dState.dragging = false;
        try { canvas.releasePointerCapture(e.pointerId); } catch {}
      });

      function renderLoop() {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          if (!mini3dState.dragging) {
            mini3dState.yaw += 0.012;
          }

          const cy = Math.cos(mini3dState.yaw), sy = Math.sin(mini3dState.yaw);
          const cp = Math.cos(mini3dState.pitch), sp = Math.sin(mini3dState.pitch);

          function projectPt(pt, scale, zOff) {
            const x = pt[0], y = pt[1], z = pt[2] - zOff;
            const rx = x * cy - y * sy;
            const ry = x * sy + y * cy;
            const rz = z * cp - ry * sp;
            const ry2 = z * sp + ry * cp;
            const fov = 220 / (220 + ry2 * 0.6);
            return {
              x: w / 2 + rx * scale * fov,
              y: h / 2 - rz * scale * fov,
              depth: ry2
            };
          }

          if (!mini3dState.hasActiveProject || mini3dState.triangles.length === 0) {
            // PLACEHOLDER STATE: Dashed rotating wireframe cube + "Kein Projekt" badge
            const r = 20;
            const verts = [
              [-r, -r, 0], [r, -r, 0], [r, r, 0], [-r, r, 0],
              [-r, -r, r*1.6], [r, -r, r*1.6], [r, r, r*1.6], [-r, r, r*1.6]
            ].map(v => projectPt(v, 1.15, r * 0.8));
            const edges = [
              [0,1],[1,2],[2,3],[3,0],
              [4,5],[5,6],[6,7],[7,4],
              [0,4],[1,5],[2,6],[3,7]
            ];
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
            ctx.lineWidth = 1.6;
            for (const [a, b] of edges) {
              ctx.beginPath();
              ctx.moveTo(verts[a].x, verts[a].y);
              ctx.lineTo(verts[b].x, verts[b].y);
              ctx.stroke();
            }
            ctx.restore();
            ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
            ctx.font = '600 15px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('KEIN 3D OBJEKT', w / 2, h - 10);
          } else {
            // ACTIVE 3D OBJECT: Build plate grid + lit 3D mesh
            const scale = 68 / Math.max(30, mini3dState.maxExtent);
            const zOff = mini3dState.centerZ;

            // Mini build plate outline
            const plateR = mini3dState.maxExtent * 0.65;
            const pCorners = [
              [-plateR, -plateR, 0], [plateR, -plateR, 0],
              [plateR, plateR, 0], [-plateR, plateR, 0]
            ].map(v => projectPt(v, scale, zOff));
            ctx.beginPath();
            ctx.moveTo(pCorners[0].x, pCorners[0].y);
            for (let i = 1; i < 4; i++) ctx.lineTo(pCorners[i].x, pCorners[i].y);
            ctx.closePath();
            ctx.strokeStyle = 'rgba(0, 174, 66, 0.35)';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Project & sort triangles
            const projected = [];
            for (const t of mini3dState.triangles) {
              const p0 = projectPt(t.v[0], scale, zOff);
              const p1 = projectPt(t.v[1], scale, zOff);
              const p2 = projectPt(t.v[2], scale, zOff);
              // Compute 3D normal for shading
              const ux = t.v[1][0] - t.v[0][0], uy = t.v[1][1] - t.v[0][1], uz = t.v[1][2] - t.v[0][2];
              const vx = t.v[2][0] - t.v[0][0], vy = t.v[2][1] - t.v[0][1], vz = t.v[2][2] - t.v[0][2];
              const nx = uy * vz - uz * vy;
              const ny = uz * vx - ux * vz;
              const nz = ux * vy - uy * vx;
              const nl = Math.hypot(nx, ny, nz) || 1;
              const light = Math.max(0.32, Math.min(1.12, 0.55 + ((nx / nl) * 0.35 + (nz / nl) * 0.45)));
              projected.push({
                p0, p1, p2,
                depth: (p0.depth + p1.depth + p2.depth) / 3,
                color: t.c,
                light
              });
            }
            projected.sort((a, b) => b.depth - a.depth);

            for (const tri of projected) {
              ctx.beginPath();
              ctx.moveTo(tri.p0.x, tri.p0.y);
              ctx.lineTo(tri.p1.x, tri.p1.y);
              ctx.lineTo(tri.p2.x, tri.p2.y);
              ctx.closePath();
              const hex = (tri.color || '#00AE42').replace('#', '');
              const r = Math.min(255, Math.round(parseInt(hex.substring(0, 2) || '00', 16) * tri.light));
              const g = Math.min(255, Math.round(parseInt(hex.substring(2, 4) || 'ae', 16) * tri.light));
              const b = Math.min(255, Math.round(parseInt(hex.substring(4, 6) || '42', 16) * tri.light));
              ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
              ctx.fill();
              ctx.strokeStyle = 'rgba(4, 7, 17, 0.22)';
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
        requestAnimationFrame(renderLoop);
      }
      requestAnimationFrame(renderLoop);
    }

    async function submitMini3dPrompt(e) {
      e.preventDefault();
      e.stopPropagation();
      const input = document.getElementById('mini-3d-prompt');
      const btn = document.getElementById('mini-3d-prompt-btn');
      if (!input || !input.value.trim()) return;
      const prompt = input.value.trim();
      if (btn) btn.textContent = '...';
      try {
        const endpoint = mini3dState.hasActiveProject && mini3dState.activeProjectId
          ? base + '/api/apps/3d-print/projects/modify'
          : base + '/api/apps/3d-print/projects/generate';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, projectId: mini3dState.activeProjectId })
        });
        if (res.ok) {
          input.value = '';
          await refreshMini3dData();
        }
      } catch (err) {
        console.error('3D prompt failed:', err);
      } finally {
        if (btn) btn.textContent = 'KI';
      }
    }

    async function toggleMini3dPlaceholder() {
      try {
        const nextId = mini3dState.hasActiveProject ? null : 'preset-headphone-hook';
        await fetch(base + '/api/apps/3d-print/projects/select', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: nextId })
        });
        await refreshMini3dData();
      } catch (err) {
        console.error('Failed toggling 3D placeholder:', err);
      }
    }

    async function triggerMini3dPrint() {
      try {
        await fetch(base + '/api/apps/3d-print/printer/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: mini3dState.activeProjectId })
        });
        await refreshMini3dData();
      } catch (err) {
        console.error('Failed starting 3D print:', err);
      }
    }

    window.addEventListener('resize', () => {
      renderSolarArcPaths();
      renderTimelineGeometry();
    });

    renderSolarArcPaths();
    initMini3dCanvas();
    tickClockAndTimeline();
    setInterval(tickClockAndTimeline, 1000);
    loadAllLiveData();
    setInterval(loadAllLiveData, 60000);
    setInterval(() => refreshMini3dData(), 5000);
    setInterval(loadRoomsQuickAccess, 12000);

    function checkHashFor3dPrint() {
      try {
        const h = (window.top ? window.top.location.hash : window.location.hash) || window.location.hash;
        if (h === '#3d-print') {
          openFullService('3d-print', '3D Druck Studio');
        }
      } catch (_e) {}
    }
    checkHashFor3dPrint();
    window.addEventListener('hashchange', checkHashFor3dPrint);
  </script>
</body>
</html>`;
}

// apps/3d-print/shared/mesh-engine.ts
var DEFAULT_PRINT_PROFILE = {
  printerModel: "Bambu Lab P1S 0.4 nozzle",
  nozzleDiameterMm: 0.4,
  layerHeightMm: 0.2,
  infillPercent: 20,
  wallLoops: 3,
  filamentType: "PLA",
  filamentColor: "#00AE42",
  nozzleTempC: 220,
  bedTempC: 60,
  supportsEnabled: false,
  brimEnabled: false
};
function vSub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function vCross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}
function vNorm(a) {
  const len = Math.hypot(a.x, a.y, a.z);
  if (len < 1e-9) return { x: 0, y: 0, z: 1 };
  return { x: a.x / len, y: a.y / len, z: a.z / len };
}
function computeNormal(v0, v1, v2) {
  return vNorm(vCross(vSub(v1, v0), vSub(v2, v0)));
}
function transformPoint(p, pos, rotDeg, scale) {
  let x = p.x * (scale[0] ?? 1);
  let y = p.y * (scale[1] ?? 1);
  let z = p.z * (scale[2] ?? 1);
  const rx = (rotDeg[0] || 0) * Math.PI / 180;
  const ry = (rotDeg[1] || 0) * Math.PI / 180;
  const rz = (rotDeg[2] || 0) * Math.PI / 180;
  if (rx !== 0) {
    const c = Math.cos(rx);
    const s = Math.sin(rx);
    const ny = y * c - z * s;
    const nz = y * s + z * c;
    y = ny;
    z = nz;
  }
  if (ry !== 0) {
    const c = Math.cos(ry);
    const s = Math.sin(ry);
    const nx = x * c + z * s;
    const nz = -x * s + z * c;
    x = nx;
    z = nz;
  }
  if (rz !== 0) {
    const c = Math.cos(rz);
    const s = Math.sin(rz);
    const nx = x * c - y * s;
    const ny = x * s + y * c;
    x = nx;
    y = ny;
  }
  return {
    x: x + (pos[0] || 0),
    y: y + (pos[1] || 0),
    z: z + (pos[2] || 0)
  };
}
function pushQuad(out, a, b, c, d) {
  out.push([a, b, c]);
  out.push([a, c, d]);
}
function generateBoxTriangles(params) {
  const w = Math.max(1, params.width ?? 40);
  const d = Math.max(1, params.depth ?? 40);
  const h = Math.max(1, params.height ?? 30);
  const bevel = Math.min(Math.min(w, d) * 0.42, Math.max(0, params.bevel ?? 2));
  const wall = params.wallThickness ?? 0;
  const hw = w / 2;
  const hd = d / 2;
  const b = bevel;
  const outerPts = b > 0.2 ? [
    [-hw + b, -hd],
    [hw - b, -hd],
    [hw, -hd + b],
    [hw, hd - b],
    [hw - b, hd],
    [-hw + b, hd],
    [-hw, hd - b],
    [-hw, -hd + b]
  ] : [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd]
  ];
  const tris = [];
  const n = outerPts.length;
  if (wall > 0.4 && wall < Math.min(hw, hd) - 1) {
    const floorZ = Math.min(h * 0.5, wall);
    const innerPts = outerPts.map(([px, py]) => {
      const sx = px >= 0 ? Math.max(0.5, px - wall) : Math.min(-0.5, px + wall);
      const sy = py >= 0 ? Math.max(0.5, py - wall) : Math.min(-0.5, py + wall);
      return [sx, sy];
    });
    for (let i = 0; i < n; i++) {
      const [x0, y0] = outerPts[i];
      const [x1, y1] = outerPts[(i + 1) % n];
      const [ix0, iy0] = innerPts[i];
      const [ix1, iy1] = innerPts[(i + 1) % n];
      pushQuad(
        tris,
        { x: x0, y: y0, z: 0 },
        { x: x1, y: y1, z: 0 },
        { x: x1, y: y1, z: h },
        { x: x0, y: y0, z: h }
      );
      pushQuad(
        tris,
        { x: ix1, y: iy1, z: floorZ },
        { x: ix0, y: iy0, z: floorZ },
        { x: ix0, y: iy0, z: h },
        { x: ix1, y: iy1, z: h }
      );
      pushQuad(
        tris,
        { x: x0, y: y0, z: h },
        { x: x1, y: y1, z: h },
        { x: ix1, y: iy1, z: h },
        { x: ix0, y: iy0, z: h }
      );
      tris.push([
        { x: 0, y: 0, z: 0 },
        { x: x1, y: y1, z: 0 },
        { x: x0, y: y0, z: 0 }
      ]);
      tris.push([
        { x: 0, y: 0, z: floorZ },
        { x: ix0, y: iy0, z: floorZ },
        { x: ix1, y: iy1, z: floorZ }
      ]);
    }
    return tris;
  }
  for (let i = 0; i < n; i++) {
    const [x0, y0] = outerPts[i];
    const [x1, y1] = outerPts[(i + 1) % n];
    pushQuad(
      tris,
      { x: x0, y: y0, z: 0 },
      { x: x1, y: y1, z: 0 },
      { x: x1, y: y1, z: h },
      { x: x0, y: y0, z: h }
    );
    tris.push([
      { x: 0, y: 0, z: 0 },
      { x: x1, y: y1, z: 0 },
      { x: x0, y: y0, z: 0 }
    ]);
    tris.push([
      { x: 0, y: 0, z: h },
      { x: x0, y: y0, z: h },
      { x: x1, y: y1, z: h }
    ]);
  }
  return tris;
}
function generateCylinderTriangles(params) {
  const rBottom = Math.max(0.5, params.radiusBottom ?? params.radius ?? 20);
  const rTop = Math.max(0.5, params.radiusTop ?? params.radius ?? 20);
  const rInner = Math.max(0, Math.min(Math.min(rBottom, rTop) - 0.8, params.innerRadius ?? 0));
  const h = Math.max(1, params.height ?? 35);
  const segs = Math.min(96, Math.max(6, Math.round(params.segments ?? 40)));
  const tris = [];
  for (let i = 0; i < segs; i++) {
    const a0 = i / segs * Math.PI * 2;
    const a1 = (i + 1) / segs * Math.PI * 2;
    const c0 = Math.cos(a0);
    const s0 = Math.sin(a0);
    const c1 = Math.cos(a1);
    const s1 = Math.sin(a1);
    const ob0 = { x: rBottom * c0, y: rBottom * s0, z: 0 };
    const ob1 = { x: rBottom * c1, y: rBottom * s1, z: 0 };
    const ot0 = { x: rTop * c0, y: rTop * s0, z: h };
    const ot1 = { x: rTop * c1, y: rTop * s1, z: h };
    pushQuad(tris, ob0, ob1, ot1, ot0);
    if (rInner > 0.2) {
      const ib0 = { x: rInner * c0, y: rInner * s0, z: 0 };
      const ib1 = { x: rInner * c1, y: rInner * s1, z: 0 };
      const it0 = { x: rInner * c0, y: rInner * s0, z: h };
      const it1 = { x: rInner * c1, y: rInner * s1, z: h };
      pushQuad(tris, ib1, ib0, it0, it1);
      pushQuad(tris, ot0, ot1, it1, it0);
      pushQuad(tris, ib0, ib1, ob1, ob0);
    } else {
      tris.push([{ x: 0, y: 0, z: 0 }, ob1, ob0]);
      tris.push([{ x: 0, y: 0, z: h }, ot0, ot1]);
    }
  }
  return tris;
}
function generateConeTriangles(params) {
  return generateCylinderTriangles({
    radiusBottom: params.radiusBottom ?? params.radius ?? 22,
    radiusTop: Math.max(0.5, params.radiusTop ?? 1),
    innerRadius: params.innerRadius ?? 0,
    height: params.height ?? 35,
    segments: params.segments ?? 36
  });
}
function generateSphereTriangles(params) {
  const r = Math.max(1, params.radius ?? 20);
  const domeOnly = Boolean(params.domeOnly);
  const latSegs = domeOnly ? 12 : 20;
  const lonSegs = 32;
  const tris = [];
  for (let lat = 0; lat < latSegs; lat++) {
    const theta0 = domeOnly ? lat / latSegs * (Math.PI / 2) : -Math.PI / 2 + lat / latSegs * Math.PI;
    const theta1 = domeOnly ? (lat + 1) / latSegs * (Math.PI / 2) : -Math.PI / 2 + (lat + 1) / latSegs * Math.PI;
    const z0 = domeOnly ? r * Math.sin(theta0) : r + r * Math.sin(theta0);
    const z1 = domeOnly ? r * Math.sin(theta1) : r + r * Math.sin(theta1);
    const r0 = r * Math.cos(theta0);
    const r1 = r * Math.cos(theta1);
    for (let lon = 0; lon < lonSegs; lon++) {
      const phi0 = lon / lonSegs * Math.PI * 2;
      const phi1 = (lon + 1) / lonSegs * Math.PI * 2;
      const p00 = { x: r0 * Math.cos(phi0), y: r0 * Math.sin(phi0), z: z0 };
      const p10 = { x: r0 * Math.cos(phi1), y: r0 * Math.sin(phi1), z: z0 };
      const p11 = { x: r1 * Math.cos(phi1), y: r1 * Math.sin(phi1), z: z1 };
      const p01 = { x: r1 * Math.cos(phi0), y: r1 * Math.sin(phi0), z: z1 };
      pushQuad(tris, p00, p10, p11, p01);
      if (domeOnly && lat === 0) {
        tris.push([{ x: 0, y: 0, z: 0 }, p10, p00]);
      }
    }
  }
  return tris;
}
function generateTorusTriangles(params) {
  const R = Math.max(4, params.radius ?? 24);
  const r = Math.max(1, Math.min(R - 1, params.tubeRadius ?? 6));
  const majorSegs = 36;
  const minorSegs = 20;
  const tris = [];
  for (let i = 0; i < majorSegs; i++) {
    const u0 = i / majorSegs * Math.PI * 2;
    const u1 = (i + 1) / majorSegs * Math.PI * 2;
    for (let j = 0; j < minorSegs; j++) {
      const v0 = j / minorSegs * Math.PI * 2;
      const v1 = (j + 1) / minorSegs * Math.PI * 2;
      const pt = (u, v) => ({
        x: (R + r * Math.cos(v)) * Math.cos(u),
        y: (R + r * Math.cos(v)) * Math.sin(u),
        z: r + r * Math.sin(v)
      });
      pushQuad(tris, pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1));
    }
  }
  return tris;
}
function generateGearTriangles(params) {
  const teeth = Math.max(6, Math.min(80, Math.round(params.teeth ?? 20)));
  const outerRadius = Math.max(8, params.outerRadius ?? 30);
  const toothDepth = Math.max(1.5, Math.min(outerRadius * 0.3, params.toothDepth ?? outerRadius * 0.16));
  const rootRadius = outerRadius - toothDepth;
  const boreRadius = Math.max(1, Math.min(rootRadius - 2, params.boreRadius ?? 5));
  const height = Math.max(2, params.height ?? 10);
  const stepsPerTooth = 4;
  const totalSteps = teeth * stepsPerTooth;
  const tris = [];
  const profilePt = (idx) => {
    const i = (idx % totalSteps + totalSteps) % totalSteps;
    const sub = i % stepsPerTooth;
    const angle = i / totalSteps * Math.PI * 2;
    const rad = sub === 1 || sub === 2 ? outerRadius : rootRadius;
    return [rad * Math.cos(angle), rad * Math.sin(angle)];
  };
  for (let i = 0; i < totalSteps; i++) {
    const [ox0, oy0] = profilePt(i);
    const [ox1, oy1] = profilePt(i + 1);
    const a0 = i / totalSteps * Math.PI * 2;
    const a1 = (i + 1) / totalSteps * Math.PI * 2;
    const ix0 = boreRadius * Math.cos(a0);
    const iy0 = boreRadius * Math.sin(a0);
    const ix1 = boreRadius * Math.cos(a1);
    const iy1 = boreRadius * Math.sin(a1);
    pushQuad(
      tris,
      { x: ox0, y: oy0, z: 0 },
      { x: ox1, y: oy1, z: 0 },
      { x: ox1, y: oy1, z: height },
      { x: ox0, y: oy0, z: height }
    );
    pushQuad(
      tris,
      { x: ix1, y: iy1, z: 0 },
      { x: ix0, y: iy0, z: 0 },
      { x: ix0, y: iy0, z: height },
      { x: ix1, y: iy1, z: height }
    );
    pushQuad(
      tris,
      { x: ix0, y: iy0, z: height },
      { x: ox0, y: oy0, z: height },
      { x: ox1, y: oy1, z: height },
      { x: ix1, y: iy1, z: height }
    );
    pushQuad(
      tris,
      { x: ox0, y: oy0, z: 0 },
      { x: ix0, y: iy0, z: 0 },
      { x: ix1, y: iy1, z: 0 },
      { x: ox1, y: oy1, z: 0 }
    );
  }
  return tris;
}
function generateTwistedVaseTriangles(params) {
  const rBottom = Math.max(8, params.radiusBottom ?? 26);
  const rTop = Math.max(8, params.radiusTop ?? 32);
  const h = Math.max(15, params.height ?? 75);
  const wall = Math.max(1.2, Math.min(8, params.wallThickness ?? 2.4));
  const twistDeg = params.twistDeg ?? 90;
  const ribCount = Math.max(0, Math.min(36, Math.round(params.ribCount ?? 12)));
  const ribAmp = Math.max(0, Math.min(10, params.ribAmplitude ?? 2.8));
  const zSteps = 28;
  const aSteps = 48;
  const floorZ = Math.min(h * 0.25, Math.max(2, wall * 1.5));
  const tris = [];
  const getOuterPt = (zi, ai) => {
    const t = zi / zSteps;
    const z = t * h;
    const baseR = rBottom + (rTop - rBottom) * (0.5 - 0.5 * Math.cos(t * Math.PI)) + Math.sin(t * Math.PI) * 4;
    const twistRad = twistDeg * t * Math.PI / 180;
    const a = ai / aSteps * Math.PI * 2;
    const rib = ribCount > 0 ? ribAmp * Math.sin(ribCount * (a + twistRad)) : 0;
    const r = Math.max(4, baseR + rib);
    return { x: r * Math.cos(a), y: r * Math.sin(a), z };
  };
  const getInnerPt = (zi, ai) => {
    const t = zi / zSteps;
    const z = floorZ + t * (h - floorZ);
    const baseR = rBottom + (rTop - rBottom) * (0.5 - 0.5 * Math.cos(t * Math.PI)) + Math.sin(t * Math.PI) * 4;
    const twistRad = twistDeg * t * Math.PI / 180;
    const a = ai / aSteps * Math.PI * 2;
    const rib = ribCount > 0 ? ribAmp * 0.65 * Math.sin(ribCount * (a + twistRad)) : 0;
    const r = Math.max(2, baseR + rib - wall);
    return { x: r * Math.cos(a), y: r * Math.sin(a), z };
  };
  for (let zi = 0; zi < zSteps; zi++) {
    for (let ai = 0; ai < aSteps; ai++) {
      const an = (ai + 1) % aSteps;
      pushQuad(
        tris,
        getOuterPt(zi, ai),
        getOuterPt(zi, an),
        getOuterPt(zi + 1, an),
        getOuterPt(zi + 1, ai)
      );
      pushQuad(
        tris,
        getInnerPt(zi, an),
        getInnerPt(zi, ai),
        getInnerPt(zi + 1, ai),
        getInnerPt(zi + 1, an)
      );
    }
  }
  for (let ai = 0; ai < aSteps; ai++) {
    const an = (ai + 1) % aSteps;
    pushQuad(
      tris,
      getOuterPt(zSteps, ai),
      getOuterPt(zSteps, an),
      getInnerPt(zSteps, an),
      getInnerPt(zSteps, ai)
    );
    tris.push([{ x: 0, y: 0, z: 0 }, getOuterPt(0, an), getOuterPt(0, ai)]);
    tris.push([{ x: 0, y: 0, z: floorZ }, getInnerPt(0, ai), getInnerPt(0, an)]);
  }
  return tris;
}
function generateBracketTriangles(params) {
  const width = Math.max(10, params.width ?? 36);
  const depth = Math.max(20, params.depth ?? 55);
  const height = Math.max(20, params.height ?? 65);
  const thick = Math.max(3, Math.min(18, params.thickness ?? 6));
  const lipHeight = Math.max(0, params.lipHeight ?? 18);
  const tris = [];
  const baseTris = generateBoxTriangles({ width, depth, height: thick, bevel: 1.5 });
  tris.push(...baseTris);
  const spineTris = generateBoxTriangles({ width, depth: thick, height, bevel: 1.2 });
  const spineY = -depth / 2 + thick / 2;
  for (const [a, b, c] of spineTris) {
    tris.push([
      { x: a.x, y: a.y + spineY, z: a.z },
      { x: b.x, y: b.y + spineY, z: b.z },
      { x: c.x, y: c.y + spineY, z: c.z }
    ]);
  }
  if (lipHeight > 1) {
    const topArmTris = generateBoxTriangles({
      width,
      depth: depth * 0.75,
      height: thick,
      bevel: 1.2
    });
    const armY = -depth / 2 + depth * 0.75 / 2;
    const armZ = height - thick;
    for (const [a, b, c] of topArmTris) {
      tris.push([
        { x: a.x, y: a.y + armY, z: a.z + armZ },
        { x: b.x, y: b.y + armY, z: b.z + armZ },
        { x: c.x, y: c.y + armY, z: c.z + armZ }
      ]);
    }
    const tipTris = generateBoxTriangles({
      width,
      depth: thick,
      height: lipHeight,
      bevel: 1
    });
    const tipY = depth / 2 - thick / 2;
    for (const [a, b, c] of tipTris) {
      tris.push([
        { x: a.x, y: a.y + tipY, z: a.z },
        { x: b.x, y: b.y + tipY, z: b.z },
        { x: c.x, y: c.y + tipY, z: c.z }
      ]);
    }
  }
  return tris;
}
function generateHexOrganizerTriangles(params) {
  const width = Math.max(24, params.width ?? 72);
  const depth = Math.max(24, params.depth ?? 48);
  const height = Math.max(12, params.height ?? 42);
  const wall = Math.max(1.6, Math.min(6, params.wallThickness ?? 2.4));
  const slotsX = Math.max(1, Math.min(5, Math.round(params.slotsX ?? 3)));
  const slotsY = Math.max(1, Math.min(4, Math.round(params.slotsY ?? 2)));
  const tris = [];
  tris.push(...generateBoxTriangles({ width, depth, height, bevel: 3, wallThickness: wall }));
  for (let ix = 1; ix < slotsX; ix++) {
    const xPos = -width / 2 + ix / slotsX * width;
    const div = generateBoxTriangles({ width: wall, depth: depth - wall * 1.5, height: height - 1, bevel: 0 });
    for (const [a, b, c] of div) {
      tris.push([
        { x: a.x + xPos, y: a.y, z: a.z + wall * 0.5 },
        { x: b.x + xPos, y: b.y, z: b.z + wall * 0.5 },
        { x: c.x + xPos, y: c.y, z: c.z + wall * 0.5 }
      ]);
    }
  }
  for (let iy = 1; iy < slotsY; iy++) {
    const yPos = -depth / 2 + iy / slotsY * depth;
    const div = generateBoxTriangles({ width: width - wall * 1.5, depth: wall, height: height - 1, bevel: 0 });
    for (const [a, b, c] of div) {
      tris.push([
        { x: a.x, y: a.y + yPos, z: a.z + wall * 0.5 },
        { x: b.x, y: b.y + yPos, z: b.z + wall * 0.5 },
        { x: c.x, y: c.y + yPos, z: c.z + wall * 0.5 }
      ]);
    }
  }
  return tris;
}
function generatePrimitiveRawTriangles(node) {
  switch (node.type) {
    case "box":
      return generateBoxTriangles(node.params);
    case "cylinder":
      return generateCylinderTriangles(node.params);
    case "cone":
      return generateConeTriangles(node.params);
    case "sphere":
      return generateSphereTriangles(node.params);
    case "torus":
      return generateTorusTriangles(node.params);
    case "gear":
      return generateGearTriangles(node.params);
    case "twisted_vase":
      return generateTwistedVaseTriangles(node.params);
    case "bracket":
      return generateBracketTriangles(node.params);
    case "hex_organizer":
      return generateHexOrganizerTriangles(node.params);
    default:
      return generateBoxTriangles(node.params);
  }
}
function compileSceneToMesh(scene) {
  const rawFaces = [];
  for (const node of scene.nodes) {
    const localTris = generatePrimitiveRawTriangles(node);
    const isSub = node.operation === "subtract";
    for (const [p0, p1, p2] of localTris) {
      const v0 = transformPoint(p0, node.position, node.rotation, node.scale);
      const v1 = transformPoint(p1, node.position, node.rotation, node.scale);
      const v2 = transformPoint(p2, node.position, node.rotation, node.scale);
      const normal = isSub ? computeNormal(v0, v2, v1) : computeNormal(v0, v1, v2);
      rawFaces.push({
        v0: isSub ? v0 : v0,
        v1: isSub ? v2 : v1,
        v2: isSub ? v1 : v2,
        normal,
        color: isSub ? "#f43f5e" : node.color || scene.printProfile.filamentColor || "#00AE42",
        nodeId: node.id,
        isSubtract: isSub
      });
    }
  }
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (const f of rawFaces) {
    if (f.isSubtract) continue;
    for (const v of [f.v0, f.v1, f.v2]) {
      if (v.x < minX) minX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.z < minZ) minZ = v.z;
      if (v.x > maxX) maxX = v.x;
      if (v.y > maxY) maxY = v.y;
      if (v.z > maxZ) maxZ = v.z;
    }
  }
  if (!Number.isFinite(minZ)) {
    minX = -10;
    maxX = 10;
    minY = -10;
    maxY = 10;
    minZ = 0;
    maxZ = 10;
  }
  const zShift = minZ < 0 ? -minZ : 0;
  if (zShift !== 0) {
    for (const f of rawFaces) {
      f.v0.z += zShift;
      f.v1.z += zShift;
      f.v2.z += zShift;
    }
    minZ += zShift;
    maxZ += zShift;
  }
  const vertexMap = /* @__PURE__ */ new Map();
  const indexedVertices = [];
  const indexedTriangles = [];
  let signedVolumeMm3 = 0;
  const getVertexIndex = (v) => {
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    const existing = vertexMap.get(key);
    if (existing !== void 0) return existing;
    const idx = indexedVertices.length;
    indexedVertices.push({
      x: Number(v.x.toFixed(3)),
      y: Number(v.y.toFixed(3)),
      z: Number(v.z.toFixed(3))
    });
    vertexMap.set(key, idx);
    return idx;
  };
  for (const f of rawFaces) {
    const i0 = getVertexIndex(f.v0);
    const i1 = getVertexIndex(f.v1);
    const i2 = getVertexIndex(f.v2);
    if (i0 !== i1 && i1 !== i2 && i0 !== i2) {
      indexedTriangles.push([i0, i1, i2]);
    }
    const v321 = f.v2.x * f.v1.y * f.v0.z;
    const v231 = f.v1.x * f.v2.y * f.v0.z;
    const v312 = f.v2.x * f.v0.y * f.v1.z;
    const v132 = f.v0.x * f.v2.y * f.v1.z;
    const v213 = f.v1.x * f.v0.y * f.v2.z;
    const v123 = f.v0.x * f.v1.y * f.v2.z;
    const tetVol = 1 / 6 * (-v321 + v231 + v312 - v132 - v213 + v123);
    signedVolumeMm3 += tetVol;
  }
  const dimX = Math.max(0, Number((maxX - minX).toFixed(1)));
  const dimY = Math.max(0, Number((maxY - minY).toFixed(1)));
  const dimZ = Math.max(0, Number((maxZ - minZ).toFixed(1)));
  const rawVolCm3 = Math.max(0.8, Math.abs(signedVolumeMm3) / 1e3);
  const infillFactor = 0.28 + (scene.printProfile.infillPercent || 20) / 100 * 0.72;
  const effectivePlasticCm3 = rawVolCm3 * infillFactor;
  const filamentWeightG = Number((effectivePlasticCm3 * 1.24).toFixed(1));
  const filamentLengthM = Number((filamentWeightG / 2.98).toFixed(2));
  const layerHeight = Math.max(0.08, scene.printProfile.layerHeightMm || 0.2);
  const layerCount = Math.max(1, Math.ceil(dimZ / layerHeight));
  const estimatedPrintMinutes = Math.max(6, Math.round(5 + filamentWeightG * 3.2 + layerCount * 0.08));
  return {
    triangles: rawFaces,
    indexedVertices,
    indexedTriangles,
    stats: {
      triangleCount: rawFaces.length,
      vertexCount: indexedVertices.length,
      dimensionsMm: { x: dimX, y: dimY, z: dimZ },
      bounds: {
        min: { x: Number(minX.toFixed(2)), y: Number(minY.toFixed(2)), z: Number(minZ.toFixed(2)) },
        max: { x: Number(maxX.toFixed(2)), y: Number(maxY.toFixed(2)), z: Number(maxZ.toFixed(2)) }
      },
      volumeCm3: Number(rawVolCm3.toFixed(2)),
      filamentWeightG,
      filamentLengthM,
      layerCount,
      estimatedPrintMinutes
    }
  };
}
function exportBinaryStl(mesh, headerTitle = "thassi.3dprint Binary STL") {
  const triCount = mesh.triangles.length;
  const buf = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  const headerText = `${headerTitle} - Bambu Lab P1S Ready`.slice(0, 79);
  for (let i = 0; i < headerText.length; i++) {
    bytes[i] = headerText.charCodeAt(i) & 255;
  }
  view.setUint32(80, triCount, true);
  let offset = 84;
  for (const t of mesh.triangles) {
    view.setFloat32(offset + 0, t.normal.x, true);
    view.setFloat32(offset + 4, t.normal.y, true);
    view.setFloat32(offset + 8, t.normal.z, true);
    view.setFloat32(offset + 12, t.v0.x, true);
    view.setFloat32(offset + 16, t.v0.y, true);
    view.setFloat32(offset + 20, t.v0.z, true);
    view.setFloat32(offset + 24, t.v1.x, true);
    view.setFloat32(offset + 28, t.v1.y, true);
    view.setFloat32(offset + 32, t.v1.z, true);
    view.setFloat32(offset + 36, t.v2.x, true);
    view.setFloat32(offset + 40, t.v2.y, true);
    view.setFloat32(offset + 44, t.v2.z, true);
    view.setUint16(offset + 48, 0, true);
    offset += 50;
  }
  return bytes;
}
var CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();
function crc32(data) {
  let crc = 4294967295;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 255] ^ crc >>> 8;
  }
  return (crc ^ 4294967295) >>> 0;
}
function encodeUtf8(str) {
  return new TextEncoder().encode(str);
}
function createZipArchive(files) {
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;
  for (const file of files) {
    const nameBytes = encodeUtf8(file.name);
    const data = file.content;
    const crc = crc32(data);
    const size = data.byteLength;
    const localHeader = new ArrayBuffer(30 + nameBytes.length);
    const lv = new DataView(localHeader);
    lv.setUint32(0, 67324752, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 21793, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    new Uint8Array(localHeader, 30).set(nameBytes);
    localChunks.push(new Uint8Array(localHeader));
    localChunks.push(data);
    const centralHeader = new ArrayBuffer(46 + nameBytes.length);
    const cv = new DataView(centralHeader);
    cv.setUint32(0, 33639248, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 21793, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    new Uint8Array(centralHeader, 46).set(nameBytes);
    centralChunks.push(new Uint8Array(centralHeader));
    offset += 30 + nameBytes.length + size;
  }
  let centralSize = 0;
  for (const c of centralChunks) centralSize += c.byteLength;
  const eocd = new ArrayBuffer(22);
  const ev = new DataView(eocd);
  ev.setUint32(0, 101010256, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);
  const totalSize = offset + centralSize + 22;
  const out = new Uint8Array(totalSize);
  let pos = 0;
  for (const c of localChunks) {
    out.set(c, pos);
    pos += c.byteLength;
  }
  for (const c of centralChunks) {
    out.set(c, pos);
    pos += c.byteLength;
  }
  out.set(new Uint8Array(eocd), pos);
  return out;
}
function export3mfArchive(mesh, scene) {
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
  <Default Extension="config" ContentType="text/xml"/>
</Types>`;
  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
  const verticesXml = mesh.indexedVertices.map((v) => `          <vertex x="${v.x}" y="${v.y}" z="${v.z}"/>`).join("\n");
  const trianglesXml = mesh.indexedTriangles.map(([v1, v2, v3]) => `          <triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`).join("\n");
  const safeTitle = (scene.title || "ThassiModel").replace(/[<>&"']/g, "");
  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="de-DE" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021">
  <metadata name="Application">Thassi.3DPrint-Antigravity-1.0</metadata>
  <metadata name="Title">${safeTitle}</metadata>
  <metadata name="Designer">Antigravity AI</metadata>
  <resources>
    <object id="1" name="${safeTitle}" type="model">
      <mesh>
        <vertices>
${verticesXml}
        </vertices>
        <triangles>
${trianglesXml}
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1" transform="1 0 0 0 1 0 0 0 1 128 128 0" printable="1"/>
  </build>
</model>`;
  const settingsConfigXml = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="1">
    <metadata key="name" value="${safeTitle}"/>
    <metadata key="extruder" value="1"/>
  </object>
  <plate>
    <metadata key="plater_id" value="1"/>
    <metadata key="plater_name" value="Bambu Lab P1S Textured PEI"/>
    <model_instance>
      <metadata key="object_id" value="1"/>
      <metadata key="instance_id" value="0"/>
    </model_instance>
  </plate>
</config>`;
  return createZipArchive([
    { name: "[Content_Types].xml", content: encodeUtf8(contentTypesXml) },
    { name: "_rels/.rels", content: encodeUtf8(relsXml) },
    { name: "3D/3dmodel.model", content: encodeUtf8(modelXml) },
    { name: "Metadata/model_settings.config", content: encodeUtf8(settingsConfigXml) }
  ]);
}
function exportPrintableGcode(mesh, scene) {
  const prof = scene.printProfile || DEFAULT_PRINT_PROFILE;
  const layerH = Math.max(0.08, prof.layerHeightMm || 0.2);
  const totalLayers = Math.max(1, mesh.stats.layerCount);
  const nozzleTemp = prof.nozzleTempC || 220;
  const bedTemp = prof.bedTempC || 60;
  const centerX = 128;
  const centerY = 128;
  const lines = [
    `; Generated by thassi.3dprint (Antigravity 3D Slicer Engine v1.0.0)`,
    `; Project: ${scene.title}`,
    `; Target Printer: ${prof.printerModel} (256x256x256mm)`,
    `; Filament: ${prof.filamentType} (${prof.filamentColor})`,
    `; Dimensions: ${mesh.stats.dimensionsMm.x} x ${mesh.stats.dimensionsMm.y} x ${mesh.stats.dimensionsMm.z} mm`,
    `; Layers: ${totalLayers} (Layer Height: ${layerH} mm)`,
    `; Estimated Filament: ${mesh.stats.filamentWeightG} g (${mesh.stats.filamentLengthM} m)`,
    `; Estimated Time: ${mesh.stats.estimatedPrintMinutes} min`,
    `M73 P0 R${mesh.stats.estimatedPrintMinutes}`,
    `G90 ; Absolute coordinates`,
    `M83 ; Relative extruder distances`,
    `M140 S${bedTemp} ; Set bed temperature`,
    `M104 S${nozzleTemp} ; Set nozzle temperature`,
    `G28 ; Home all axes (Bambu Lab P1S)`,
    `M190 S${bedTemp} ; Wait for bed temperature`,
    `M109 S${nozzleTemp} ; Wait for nozzle temperature`,
    `; Bambu Lab P1S front nozzle purge line`,
    `G1 Z2.0 F3000`,
    `G1 X10 Y5 Z0.28 F5000`,
    `G1 X120 Y5 E12.0 F1500`,
    `G1 X120 Y5.6 F5000`,
    `G1 X10 Y5.6 E12.0 F1500`,
    `G1 Z1.0 F3000`
  ];
  const maxSliceLayers = Math.min(totalLayers, 180);
  const stepLayers = Math.max(1, Math.floor(totalLayers / maxSliceLayers));
  const minX = mesh.stats.bounds.min.x;
  const maxX = mesh.stats.bounds.max.x;
  const minY = mesh.stats.bounds.min.y;
  const maxY = mesh.stats.bounds.max.y;
  for (let l = 1; l <= totalLayers; l += stepLayers) {
    const z = Number((l * layerH).toFixed(3));
    const pct = Math.min(99, Math.round(l / totalLayers * 100));
    const remMin = Math.max(1, Math.round(mesh.stats.estimatedPrintMinutes * (1 - l / totalLayers)));
    lines.push(`; LAYER:${l}/${totalLayers} Z=${z}mm`);
    lines.push(`M73 P${pct} R${remMin}`);
    lines.push(`G1 Z${z} F1800`);
    let lMinX = Infinity;
    let lMaxX = -Infinity;
    let lMinY = Infinity;
    let lMaxY = -Infinity;
    for (const t of mesh.triangles) {
      if (t.isSubtract) continue;
      const tMinZ = Math.min(t.v0.z, t.v1.z, t.v2.z);
      const tMaxZ = Math.max(t.v0.z, t.v1.z, t.v2.z);
      if (z >= tMinZ && z <= tMaxZ) {
        const txMin = Math.min(t.v0.x, t.v1.x, t.v2.x);
        const txMax = Math.max(t.v0.x, t.v1.x, t.v2.x);
        const tyMin = Math.min(t.v0.y, t.v1.y, t.v2.y);
        const tyMax = Math.max(t.v0.y, t.v1.y, t.v2.y);
        if (txMin < lMinX) lMinX = txMin;
        if (txMax > lMaxX) lMaxX = txMax;
        if (tyMin < lMinY) lMinY = tyMin;
        if (tyMax > lMaxY) lMaxY = tyMax;
      }
    }
    if (!Number.isFinite(lMinX)) {
      lMinX = minX;
      lMaxX = maxX;
      lMinY = minY;
      lMaxY = maxY;
    }
    const x0 = (centerX + lMinX).toFixed(2);
    const x1 = (centerX + lMaxX).toFixed(2);
    const y0 = (centerY + lMinY).toFixed(2);
    const y1 = (centerY + lMaxY).toFixed(2);
    const dx = Math.max(1, lMaxX - lMinX);
    const dy = Math.max(1, lMaxY - lMinY);
    const eX = (dx * 0.033).toFixed(4);
    const eY = (dy * 0.033).toFixed(4);
    lines.push(`G1 X${x0} Y${y0} F9000`);
    lines.push(`G1 X${x1} Y${y0} E${eX} F3600`);
    lines.push(`G1 X${x1} Y${y1} E${eY} F3600`);
    lines.push(`G1 X${x0} Y${y1} E${eX} F3600`);
    lines.push(`G1 X${x0} Y${y0} E${eY} F3600`);
    const midY = (centerY + (lMinY + lMaxY) / 2).toFixed(2);
    lines.push(`G1 X${x0} Y${midY} F9000`);
    lines.push(`G1 X${x1} Y${midY} E${eX} F4800`);
  }
  lines.push(
    `M73 P100 R0`,
    `; End G-Code for Bambu Lab P1S`,
    `G1 E-1.5 F2400 ; Retract filament`,
    `G1 Z${Math.min(250, Math.round(mesh.stats.dimensionsMm.z + 15))} F3000`,
    `G1 X10 Y245 F9000 ; Present print`,
    `M104 S0 ; Turn off nozzle heater`,
    `M140 S0 ; Turn off bed heater`,
    `M106 S0 ; Turn off part fan`,
    `M84 ; Disable steppers`
  );
  return lines.join("\n");
}
var PRESET_TEMPLATES = {
  desk_headphone_stand: () => ({
    projectId: "preset-headphone-hook",
    title: "Schreibtisch-Kopfh\xF6rerhalter (Bambu P1S)",
    description: "Verst\xE4rkter Tischkanten-Klemmhalter mit Kabelf\xFChrung und rutschfester Frontlippe.",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    buildPlateMm: [256, 256, 256],
    printProfile: { ...DEFAULT_PRINT_PROFILE, filamentColor: "#00AE42", infillPercent: 25 },
    nodes: [
      {
        id: "node-bracket-main",
        name: "Tischklemme & Hakenk\xF6rper",
        type: "bracket",
        operation: "union",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: "#00AE42",
        params: { width: 38, depth: 62, height: 74, thickness: 7, lipHeight: 22 }
      },
      {
        id: "node-cable-bore",
        name: "Kabelf\xFChrung-Durchbruch",
        type: "cylinder",
        operation: "subtract",
        position: [0, -27, 36],
        rotation: [90, 0, 0],
        scale: [1, 1, 1],
        color: "#f43f5e",
        params: { radiusBottom: 6, radiusTop: 6, height: 18, segments: 24 }
      }
    ],
    promptHistory: [
      {
        id: "init-1",
        prompt: "Erstelle einen stabilen Kopfh\xF6rerhalter f\xFCr die Schreibtischkante mit Kabelf\xFChrung",
        summary: "Tischklemme (38\xD762\xD774mm, 7mm Wandst\xE4rke) mit 22mm Haltelippe und 12mm Kabeldurchf\xFChrung generiert.",
        engine: "Antigravity Parametric CAD",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]
  }),
  precision_planetary_gear: () => ({
    projectId: "preset-gear-24t",
    title: "Pr\xE4zisions-Stirnrad Z24 mit Nabe",
    description: "Mechanisches Stirnzahnrad (24 Z\xE4hne, \xD864mm) mit verst\xE4rkter Mittelbohrung f\xFCr 8mm Welle.",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    buildPlateMm: [256, 256, 256],
    printProfile: { ...DEFAULT_PRINT_PROFILE, filamentColor: "#38bdf8", infillPercent: 35 },
    nodes: [
      {
        id: "node-gear-ring",
        name: "Zahnkranz Z24",
        type: "gear",
        operation: "union",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: "#38bdf8",
        params: { teeth: 24, outerRadius: 34, toothDepth: 4.8, boreRadius: 8, height: 12 }
      },
      {
        id: "node-gear-hub",
        name: "Verst\xE4rkte Wellen-Nabe",
        type: "cylinder",
        operation: "union",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: "#0284c7",
        params: { radiusBottom: 15, radiusTop: 14, innerRadius: 5, height: 20, segments: 36 }
      }
    ],
    promptHistory: [
      {
        id: "init-gear",
        prompt: "Erstelle ein Zahnrad mit 24 Z\xE4hnen, Nabe und 10mm Wellenbohrung",
        summary: "Stirnrad (24 Z\xE4hne, \xD868mm, H\xF6he 12mm) mit 20mm Nabe und \xD810mm Innenbohrung erstellt.",
        engine: "Antigravity Parametric CAD",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]
  }),
  twisted_rib_vase: () => ({
    projectId: "preset-twisted-vase",
    title: "Spiral-Designvase (Bambu Silk)",
    description: "Skulpturale Vase mit 14 harmonischen L\xE4ngsrippen und 110\xB0 Torsion.",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    buildPlateMm: [256, 256, 256],
    printProfile: { ...DEFAULT_PRINT_PROFILE, filamentColor: "#f59e0b", infillPercent: 15 },
    nodes: [
      {
        id: "node-vase-body",
        name: "Torsions-Vasenk\xF6rper",
        type: "twisted_vase",
        operation: "union",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: "#f59e0b",
        params: {
          radiusBottom: 28,
          radiusTop: 35,
          height: 92,
          wallThickness: 2.6,
          twistDeg: 110,
          ribCount: 14,
          ribAmplitude: 3.2
        }
      }
    ],
    promptHistory: [
      {
        id: "init-vase",
        prompt: "Generiere eine gedrehte Design-Vase mit 14 Rippen und 92mm H\xF6he",
        summary: "Skulpturale Rippen-Vase (\xD870\xD792mm, 110\xB0 Drehung, 2.6mm Wandung) erstellt.",
        engine: "Antigravity Parametric CAD",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]
  }),
  smart_home_organizer: () => ({
    projectId: "preset-hex-organizer",
    title: "Schreibtisch & Smart-Sensor Organizer (6 F\xE4cher)",
    description: "Modularer Aufbewahrungs-Tray f\xFCr Werkzeuge, SD-Karten, USB-Sticks und Shelly Sensoren.",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    buildPlateMm: [256, 256, 256],
    printProfile: { ...DEFAULT_PRINT_PROFILE, filamentColor: "#a855f7", infillPercent: 20 },
    nodes: [
      {
        id: "node-organizer-tray",
        name: "6-Kammer Organizer Korpus",
        type: "hex_organizer",
        operation: "union",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: "#a855f7",
        params: { width: 88, depth: 58, height: 38, wallThickness: 2.4, slotsX: 3, slotsY: 2 }
      }
    ],
    promptHistory: [
      {
        id: "init-org",
        prompt: "Erstelle einen Schreibtisch-Organizer mit 3x2 F\xE4chern",
        summary: "6-Kammer Organizer (88\xD758\xD738mm, 2.4mm Wandst\xE4rke) generiert.",
        engine: "Antigravity Parametric CAD",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]
  })
};

// apps/3d-print/backend/bambu-lan.ts
import net from "node:net";
import tls from "node:tls";
import dgram from "node:dgram";
var BAMBU_API_SPECIFICATION = {
  manufacturer: "Bambu Lab",
  detectedProfileModel: "Bambu Lab P1S (0.4mm Nozzle \xB7 Textured PEI 256\xD7256\xD7256mm)",
  localSubnet: "192.168.188.0/24 (Fritz!Box 6890 LTE \xB7 Obi-WLAN Kenobi)",
  discoveryProtocol: {
    protocol: "SSDP over UDP Multicast / Broadcast",
    multicastAddress: "239.255.255.250",
    udpPorts: [2021, 1990, 1900],
    searchTarget: "urn:bambulab-com:device:3dprinter:1",
    headers: [
      "USN (Seriennummer, z.B. 01S00C... f\xFCr P1S, 01P... f\xFCr P1P, 00M... f\xFCr X1C, 039... f\xFCr A1)",
      "Location (Lokale IPv4-Adresse im Subnetz 192.168.188.x)",
      "DevName.bambu.com (Ger\xE4tename)",
      "DevModel.bambu.com (C12 = P1S, C11 = P1P, BL-P001 = X1C, N2S = A1, N1 = A1 mini)",
      "DevVersion.bambu.com (Firmware-Version)",
      "DevConnect.bambu.com (lan / cloud)"
    ]
  },
  mqttTelemetryAndControl: {
    protocol: "MQTT v3.1.1 over TLS (Self-Signed Device Certificate)",
    port: 8883,
    endpointTemplate: "mqtts://bblp:<LAN_ACCESS_CODE>@<PRINTER_IP>:8883",
    username: "bblp",
    passwordSource: "8-stelliger LAN Access Code (Drucker-Display \u2192 Einstellungen \u2192 WLAN / LAN Only Mode \u2192 Access Code)",
    tlsOptions: "rejectUnauthorized: false (Bambu Root CA self-signed)",
    topics: {
      reportSubscribe: "device/<SERIAL_NUMBER>/report",
      requestPublish: "device/<SERIAL_NUMBER>/request"
    },
    payloadExamples: {
      pushAllStatus: { pushing: { sequence_id: "1", command: "pushall" } },
      pausePrint: { print: { sequence_id: "2", command: "pause" } },
      resumePrint: { print: { sequence_id: "3", command: "resume" } },
      stopPrint: { print: { sequence_id: "4", command: "stop" } },
      chamberLightToggle: {
        system: { sequence_id: "5", command: "ledctrl", led_node: "chamber_light", led_mode: "on" }
      },
      setSpeedProfile: { print: { sequence_id: "6", command: "print_speed", param: "2" } },
      sendGcodeLine: {
        print: { sequence_id: "7", command: "gcode_line", param: "G28\nM104 S220\nM140 S60\n" }
      },
      start3mfPrint: {
        print: {
          sequence_id: "8",
          command: "project_file",
          param: "Metadata/plate_1.gcode",
          url: "ftp:///thassi_model.3mf",
          subtask_name: "thassi_model",
          bed_type: "auto",
          timelapse: false,
          bed_leveling: true,
          flow_cali: true,
          vibration_cali: true,
          use_ams: false
        }
      }
    }
  },
  directFileTransferFtps: {
    protocol: "Implicit FTPS (FTP over TLS)",
    port: 990,
    endpointTemplate: "ftps://bblp:<LAN_ACCESS_CODE>@<PRINTER_IP>:990/",
    username: "bblp",
    passwordSource: "8-stelliger LAN Access Code",
    targetDirectory: "/ (Wurzelverzeichnis der microSD-Karte) oder /cache/",
    supportedFormats: [".3mf (mit eingebettetem G-Code/Mesh)", ".gcode"]
  },
  chamberCameraStream: {
    p1s_p1p_a1: "TCP Port 6000 (TLS JPEG Frame Stream, 80-Byte Auth-Header mit bblp + Access Code)",
    x1c_x1e: "RTSPS Port 322 (rtsps://bblp:<LAN_ACCESS_CODE>@<PRINTER_IP>:322/streaming/live/1)"
  }
};
function checkTcpPort(ip, port, timeoutMs = 550) {
  return new Promise((resolve) => {
    if (!ip) return resolve(false);
    const sock = new net.Socket();
    let done = false;
    const finish = (ok) => {
      if (!done) {
        done = true;
        sock.destroy();
        resolve(ok);
      }
    };
    sock.setTimeout(timeoutMs);
    sock.on("connect", () => finish(true));
    sock.on("timeout", () => finish(false));
    sock.on("error", () => finish(false));
    sock.connect(port, ip);
  });
}
function inspectBambuTlsCertificate(ip, port = 8883, timeoutMs = 1200) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (res) => {
      if (!settled) {
        settled = true;
        try {
          sock.destroy();
        } catch {
        }
        resolve(res);
      }
    };
    const sock = tls.connect(
      {
        host: ip,
        port,
        rejectUnauthorized: false,
        timeout: timeoutMs
      },
      () => {
        try {
          const cert = sock.getPeerCertificate();
          const cn = (Array.isArray(cert?.subject?.CN) ? cert.subject.CN[0] : cert?.subject?.CN) || "";
          const issuer = (Array.isArray(cert?.issuer?.CN) ? cert.issuer.CN[0] : cert?.issuer?.CN) || cert?.issuer?.O || "";
          finish({ ok: true, cn, issuer });
        } catch {
          finish({ ok: true });
        }
      }
    );
    sock.on("error", () => finish({ ok: false }));
    sock.setTimeout(timeoutMs, () => finish({ ok: false }));
  });
}
function parseSsdpPacket(rawText, remoteIp) {
  if (!rawText.toLowerCase().includes("bambu") && !rawText.toLowerCase().includes("3dprinter")) {
    return null;
  }
  const getHeader = (name) => {
    const regex = new RegExp(`^${name}\\s*:\\s*(.+)$`, "im");
    const m = rawText.match(regex);
    return m ? m[1].trim() : "";
  };
  const location = getHeader("Location") || remoteIp;
  const ipMatch = location.match(/(\d+\.\d+\.\d+\.\d+)/);
  const ip = ipMatch ? ipMatch[1] : remoteIp;
  const usn = getHeader("USN") || "";
  const devName = getHeader("DevName.bambu.com") || "Bambu Lab 3D Printer";
  const devModel = getHeader("DevModel.bambu.com") || "Bambu Lab P1S";
  const devVersion = getHeader("DevVersion.bambu.com") || "";
  const devConnect = getHeader("DevConnect.bambu.com") || "lan";
  const devBind = getHeader("DevBind.bambu.com") || "free";
  const devSignal = getHeader("DevSignal.bambu.com") || "";
  return {
    ip,
    serial: usn.replace(/^uuid:/i, "").trim(),
    name: devName,
    model: devModel === "C12" ? "Bambu Lab P1S" : devModel === "C11" ? "Bambu Lab P1P" : devModel,
    firmware: devVersion,
    connectMode: devConnect,
    bindStatus: devBind,
    signalDbm: devSignal
  };
}
async function listenBambuSsdp(timeoutMs = 2200) {
  const discoveredMap = /* @__PURE__ */ new Map();
  const ports = [2021, 1990];
  await Promise.all(
    ports.map(
      (port) => new Promise((resolve) => {
        const sock = dgram.createSocket({ type: "udp4", reuseAddr: true });
        sock.on("error", () => {
          try {
            sock.close();
          } catch {
          }
          resolve();
        });
        sock.on("message", (msg, rinfo) => {
          const parsed = parseSsdpPacket(msg.toString("utf8"), rinfo.address);
          if (parsed && parsed.ip) {
            discoveredMap.set(parsed.ip, {
              ip: parsed.ip,
              serial: parsed.serial || "01S00C000000000",
              name: parsed.name || "Bambu Lab P1S",
              model: parsed.model || "Bambu Lab P1S",
              firmware: parsed.firmware || "01.07.00.00",
              connectMode: parsed.connectMode || "lan",
              bindStatus: parsed.bindStatus || "lan",
              signalDbm: parsed.signalDbm || "-54dBm",
              ports: {
                mqttTls8883: true,
                ftps990: true,
                chamberStream6000: true,
                rtsps322: false
              },
              discoveryMethod: "ssdp_multicast",
              discoveredAt: (/* @__PURE__ */ new Date()).toISOString()
            });
          }
        });
        sock.bind(port, "0.0.0.0", () => {
          try {
            sock.addMembership("239.255.255.250");
          } catch {
          }
          try {
            sock.setBroadcast(true);
          } catch {
          }
          const msearch = Buffer.from(
            `M-SEARCH * HTTP/1.1\r
HOST: 239.255.255.250:${port}\r
MAN: "ssdp:discover"\r
MX: 2\r
ST: urn:bambulab-com:device:3dprinter:1\r
\r
`
          );
          for (const targetPort of [1990, 2021]) {
            try {
              sock.send(msearch, 0, msearch.length, targetPort, "239.255.255.250");
            } catch {
            }
            try {
              sock.send(msearch, 0, msearch.length, targetPort, "192.168.188.255");
            } catch {
            }
          }
        });
        setTimeout(() => {
          try {
            sock.close();
          } catch {
          }
          resolve();
        }, timeoutMs);
      })
    )
  );
  return Array.from(discoveredMap.values());
}
async function scanSubnetForBambuPrinters(subnetPrefix = "192.168.188") {
  const ssdpPromise = listenBambuSsdp(1800);
  const candidateIps = [];
  const allIps = Array.from({ length: 254 }, (_, i) => `${subnetPrefix}.${i + 1}`);
  const batchSize = 64;
  for (let i = 0; i < allIps.length; i += batchSize) {
    const batch = allIps.slice(i, i + batchSize);
    const hits = await Promise.all(
      batch.map(async (ip) => ({ ip, open8883: await checkTcpPort(ip, 8883, 380) }))
    );
    for (const h of hits) {
      if (h.open8883) candidateIps.push(h.ip);
    }
  }
  const ssdpPrinters = await ssdpPromise;
  const byIp = /* @__PURE__ */ new Map();
  for (const p of ssdpPrinters) {
    byIp.set(p.ip, p);
  }
  for (const ip of candidateIps) {
    if (byIp.has(ip)) continue;
    const [ftps990, stream6000, rtsps322, cert] = await Promise.all([
      checkTcpPort(ip, 990, 500),
      checkTcpPort(ip, 6e3, 500),
      checkTcpPort(ip, 322, 500),
      inspectBambuTlsCertificate(ip, 8883, 1e3)
    ]);
    byIp.set(ip, {
      ip,
      serial: cert.cn || "01S00C000000000",
      name: `Bambu Lab (${ip})`,
      model: "Bambu Lab P1S",
      firmware: "LAN TLS 8883",
      connectMode: "lan",
      bindStatus: "active",
      signalDbm: "LAN",
      ports: {
        mqttTls8883: true,
        ftps990,
        chamberStream6000: stream6000,
        rtsps322
      },
      tlsCertificateSubject: cert.cn || cert.issuer || "BambuLab TLS",
      discoveryMethod: "tcp_8883_tls_probe",
      discoveredAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  return Array.from(byIp.values());
}
function encodeMqttRemainingLength(len) {
  const out = [];
  do {
    let encodedByte = len % 128;
    len = Math.floor(len / 128);
    if (len > 0) encodedByte |= 128;
    out.push(encodedByte);
  } while (len > 0);
  return out;
}
function encodeMqttString(str) {
  const b = Buffer.from(str, "utf8");
  const len = Buffer.alloc(2);
  len.writeUInt16BE(b.length, 0);
  return Buffer.concat([len, b]);
}
function buildMqttConnectPacket(clientId, username, password) {
  const protoName = encodeMqttString("MQTT");
  const protoLevel = Buffer.from([4]);
  const connectFlags = Buffer.from([194]);
  const keepAlive = Buffer.from([0, 60]);
  const payload = Buffer.concat([
    encodeMqttString(clientId),
    encodeMqttString(username),
    encodeMqttString(password)
  ]);
  const varHeader = Buffer.concat([protoName, protoLevel, connectFlags, keepAlive]);
  const remLen = Buffer.from(encodeMqttRemainingLength(varHeader.length + payload.length));
  return Buffer.concat([Buffer.from([16]), remLen, varHeader, payload]);
}
function buildMqttPublishPacket(topic, messageJson) {
  const topicBuf = encodeMqttString(topic);
  const msgBuf = Buffer.from(messageJson, "utf8");
  const remLen = Buffer.from(encodeMqttRemainingLength(topicBuf.length + msgBuf.length));
  return Buffer.concat([Buffer.from([48]), remLen, topicBuf, msgBuf]);
}
async function publishBambuMqttCommand(cfg, payload, timeoutMs = 3500) {
  if (!cfg.ip || !cfg.serial || !cfg.accessCode) {
    return {
      ok: false,
      message: "Drucker-IP, Seriennummer oder 8-stelliger LAN Access Code fehlt."
    };
  }
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok, message) => {
      if (!done) {
        done = true;
        try {
          sock.destroy();
        } catch {
        }
        resolve({ ok, message });
      }
    };
    const sock = tls.connect(
      {
        host: cfg.ip,
        port: 8883,
        rejectUnauthorized: false,
        timeout: timeoutMs
      },
      () => {
        const connectPkt = buildMqttConnectPacket(
          `thassi_${Math.random().toString(16).slice(2, 8)}`,
          "bblp",
          cfg.accessCode
        );
        sock.write(connectPkt);
      }
    );
    sock.on("data", (chunk) => {
      if (chunk.length >= 4 && chunk[0] === 32) {
        const returnCode = chunk[3];
        if (returnCode !== 0) {
          finish(
            false,
            `MQTT Auth abgelehnt (Code ${returnCode}) \u2013 bitte 8-stelligen LAN Access Code pr\xFCfen.`
          );
          return;
        }
        const topic = `device/${cfg.serial}/request`;
        const pubPkt = buildMqttPublishPacket(topic, JSON.stringify(payload));
        sock.write(pubPkt, () => {
          setTimeout(() => {
            finish(true, `MQTT-Befehl erfolgreich an ${topic} (${cfg.ip}:8883) gesendet.`);
          }, 180);
        });
      }
    });
    sock.on("error", (err) => {
      finish(false, `TLS 8883 Verbindungsfehler zu ${cfg.ip}: ${err.message}`);
    });
    sock.setTimeout(timeoutMs, () => {
      finish(false, `Zeit\xFCberschreitung zu ${cfg.ip}:8883 (Drucker im Standby oder ausgeschaltet).`);
    });
  });
}

// apps/3d-print/backend/ai-cad-generator.ts
import fs3 from "node:fs";
function discoverGeminiApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const storagePath = "/homeassistant/.storage/core.config_entries";
  try {
    if (fs3.existsSync(storagePath)) {
      const raw = JSON.parse(fs3.readFileSync(storagePath, "utf-8"));
      const entries = raw?.data?.entries || [];
      for (let i = entries.length - 1; i >= 0; i--) {
        const e = entries[i];
        if (e.domain === "google_generative_ai_conversation" && e.data?.api_key) {
          return String(e.data.api_key).trim();
        }
      }
    }
  } catch {
  }
  return "";
}
var cachedModel = "";
async function resolveGeminiModel(apiKey) {
  if (cachedModel) return cachedModel;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(4e3) }
    );
    if (res.ok) {
      const data = await res.json();
      const names = (data.models || []).filter((m) => (m.supportedGenerationMethods || []).includes("generateContent")).map((m) => m.name.replace(/^models\//, ""));
      for (const candidate of [
        "gemini-3.8-flash",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
      ]) {
        if (names.includes(candidate)) {
          cachedModel = candidate;
          return candidate;
        }
      }
      const firstFlash = names.find(
        (n) => n.includes("flash") && !n.includes("tts") && !n.includes("image")
      );
      if (firstFlash) {
        cachedModel = firstFlash;
        return firstFlash;
      }
    }
  } catch {
  }
  return "gemini-2.0-flash";
}
var COLOR_MAP = [
  { pattern: /\b(rot|red|crimson|rubin)\b/i, hex: "#ef4444", label: "Rot" },
  { pattern: /\b(blau|blue|kobalt|navy|türkis|cyan)\b/i, hex: "#38bdf8", label: "Blau / Cyan" },
  { pattern: /\b(grün|gruen|green|bambu|smaragd|lime)\b/i, hex: "#00AE42", label: "Bambu Gr\xFCn" },
  { pattern: /\b(gelb|yellow|gold|amber|messing)\b/i, hex: "#fbbf24", label: "Gold / Gelb" },
  { pattern: /\b(orange|kupfer|copper|mandarin)\b/i, hex: "#f97316", label: "Orange" },
  { pattern: /\b(lila|violett|purple|magenta)\b/i, hex: "#a855f7", label: "Violett" },
  { pattern: /\b(weiss|weiß|white|klar|farblos)\b/i, hex: "#f8fafc", label: "Wei\xDF" },
  { pattern: /\b(schwarz|black|carbon|anthrazit|grau|grey|silber)\b/i, hex: "#64748b", label: "Anthrazit / Carbon" }
];
function extractColorFromPrompt(prompt) {
  const hexMatch = prompt.match(/#([0-9a-fA-F]{6})\b/);
  if (hexMatch) {
    return { hex: `#${hexMatch[1]}`, label: `#${hexMatch[1]}` };
  }
  for (const c of COLOR_MAP) {
    if (c.pattern.test(prompt)) return c;
  }
  return null;
}
function runLocalAntigravityCadEngine(prompt, existingScene) {
  const cleanPrompt = prompt.trim();
  const lower = cleanPrompt.toLowerCase();
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const colorMatch = extractColorFromPrompt(cleanPrompt);
  const isNewRequest = !existingScene || /\b(neues objekt|erstelle neu|komplett neu|stattdessen)\b/i.test(lower);
  if (isNewRequest) {
    let baseScene;
    let summary2 = "";
    if (/\b(zahnrad|gear|ritzel|zähne|zaehne|cog|getriebe)\b/i.test(lower)) {
      baseScene = PRESET_TEMPLATES.precision_planetary_gear();
      const teethMatch = lower.match(/(\d+)\s*(?:zähne|zaehne|teeth|t\b)/i);
      const boreMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*mm\s*(?:loch|bohrung|welle|bore)/i);
      const diaMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*mm\s*(?:durchmesser|diameter|groß|breit)/i);
      const gearNode = baseScene.nodes[0];
      if (teethMatch) {
        gearNode.params.teeth = Math.max(6, Math.min(72, Number(teethMatch[1])));
      }
      if (boreMatch) {
        const br = Math.max(1, Number(boreMatch[1].replace(",", ".")) / 2);
        gearNode.params.boreRadius = br;
        if (baseScene.nodes[1]) baseScene.nodes[1].params.innerRadius = br;
      }
      if (diaMatch) {
        gearNode.params.outerRadius = Math.max(10, Number(diaMatch[1].replace(",", ".")) / 2);
      }
      baseScene.title = `Stirnzahnrad Z${gearNode.params.teeth}`;
      summary2 = `Pr\xE4zisions-Zahnrad mit ${gearNode.params.teeth} Z\xE4hnen (\xD8${gearNode.params.outerRadius * 2}mm, Bohrung \xD8${(gearNode.params.boreRadius || 5) * 2}mm) generiert.`;
    } else if (/\b(vase|becher|cup|blumentopf|topf|gefäß|gefaess|spiral|kelch|lampe)\b/i.test(lower)) {
      baseScene = PRESET_TEMPLATES.twisted_rib_vase();
      const heightMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*mm\s*(?:hoch|höhe|hoehe|high)/i);
      const ribMatch = lower.match(/(\d+)\s*(?:rippen|ribs|rillen)/i);
      const vaseNode = baseScene.nodes[0];
      if (heightMatch) vaseNode.params.height = Math.max(20, Math.min(240, Number(heightMatch[1].replace(",", "."))));
      if (ribMatch) vaseNode.params.ribCount = Math.max(0, Math.min(36, Number(ribMatch[1])));
      baseScene.title = `Spiral-Designvase (${vaseNode.params.height}mm)`;
      summary2 = `Skulpturale Torsions-Vase (H\xF6he ${vaseNode.params.height}mm, ${vaseNode.params.ribCount} Rippen) erstellt.`;
    } else if (/\b(organizer|box|kasten|schublade|sortier|fach|fächer|faecher|tray|stiftehalter|halterung für kabel)\b/i.test(lower)) {
      baseScene = PRESET_TEMPLATES.smart_home_organizer();
      const orgNode = baseScene.nodes[0];
      const gridMatch = lower.match(/(\d+)\s*[x×]\s*(\d+)/);
      if (gridMatch) {
        orgNode.params.slotsX = Math.max(1, Math.min(5, Number(gridMatch[1])));
        orgNode.params.slotsY = Math.max(1, Math.min(4, Number(gridMatch[2])));
      }
      baseScene.title = `Modularer Organizer (${orgNode.params.slotsX}\xD7${orgNode.params.slotsY} F\xE4cher)`;
      summary2 = `Organizer-Box (${orgNode.params.width}\xD7${orgNode.params.depth}\xD7${orgNode.params.height}mm) mit ${orgNode.params.slotsX * orgNode.params.slotsY} Kammern generiert.`;
    } else if (/\b(kopfhörer|kopfhoerer|headphone|haken|hook|winkel|bracket|wandhalter|tischklemme|klemme|ständer|staender)\b/i.test(lower)) {
      baseScene = PRESET_TEMPLATES.desk_headphone_stand();
      baseScene.title = cleanPrompt.length <= 42 ? cleanPrompt : "Tisch- & Wandhalterung (Bracket)";
      summary2 = `Verst\xE4rkte Halterung / Tischklemme (38\xD762\xD774mm) mit Kabeldurchf\xFChrung f\xFCr Bambu Lab P1S generiert.`;
    } else if (/\b(kugel|sphere|ball|kuppel|dome)\b/i.test(lower)) {
      const rMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*mm/);
      const rad = rMatch ? Math.max(8, Number(rMatch[1].replace(",", ".")) / 2) : 26;
      baseScene = {
        projectId: `proj-${Date.now()}`,
        title: `Geod\xE4tische Sph\xE4re / Kuppel (\xD8${rad * 2}mm)`,
        description: `Generiert aus Prompt: "${cleanPrompt}"`,
        createdAt: nowIso,
        updatedAt: nowIso,
        buildPlateMm: [256, 256, 256],
        printProfile: { ...DEFAULT_PRINT_PROFILE },
        nodes: [
          {
            id: "node-sphere-1",
            name: "Haupt-Kugelk\xF6rper",
            type: "sphere",
            operation: "union",
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: colorMatch?.hex || "#00AE42",
            params: { radius: rad, domeOnly: /\b(kuppel|dome|halbkugel)\b/i.test(lower) ? 1 : 0 }
          },
          {
            id: "node-stand-ring",
            name: "Standring-Basis",
            type: "cylinder",
            operation: "union",
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: colorMatch?.hex || "#00AE42",
            params: { radiusBottom: rad * 0.65, radiusTop: rad * 0.55, innerRadius: rad * 0.35, height: 6, segments: 36 }
          }
        ],
        promptHistory: []
      };
      summary2 = `Sph\xE4ren-Geometrie (\xD8${rad * 2}mm) mit druckbarem Standring auf der Bauplatte erstellt.`;
    } else if (/\b(zylinder|rohr|tube|hülse|huelse|spacer|adapter|ring|spule)\b/i.test(lower)) {
      const nums = (lower.match(/\d+(?:[.,]\d+)?/g) || []).map((n) => Number(n.replace(",", ".")));
      const outerR = nums[0] ? Math.max(6, nums[0] / 2) : 25;
      const height = nums[1] ? Math.max(5, nums[1]) : 40;
      const innerR = nums[2] ? Math.min(outerR - 2, nums[2] / 2) : Math.max(0, outerR * 0.55);
      baseScene = {
        projectId: `proj-${Date.now()}`,
        title: `Zylinder-H\xFClse / Adapter (\xD8${outerR * 2}\xD7${height}mm)`,
        description: `Generiert aus Prompt: "${cleanPrompt}"`,
        createdAt: nowIso,
        updatedAt: nowIso,
        buildPlateMm: [256, 256, 256],
        printProfile: { ...DEFAULT_PRINT_PROFILE },
        nodes: [
          {
            id: "node-cyl-main",
            name: "Zylinderh\xFClse",
            type: "cylinder",
            operation: "union",
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: colorMatch?.hex || "#38bdf8",
            params: { radiusBottom: outerR, radiusTop: outerR, innerRadius: innerR, height, segments: 48 }
          }
        ],
        promptHistory: []
      };
      summary2 = `Zylinder-Adapter (Au\xDFen-\xD8${outerR * 2}mm, Innen-\xD8${(innerR * 2).toFixed(1)}mm, H\xF6he ${height}mm) erstellt.`;
    } else {
      const dims = (lower.match(/(\d+(?:[.,]\d+)?)\s*mm/g) || []).map(
        (s) => Number(s.replace(/mm/i, "").replace(",", ".").trim())
      );
      const w = dims[0] || 64;
      const d = dims[1] || 48;
      const h = dims[2] || 32;
      baseScene = {
        projectId: `proj-${Date.now()}`,
        title: cleanPrompt.slice(0, 48) || "Antigravity 3D-Objekt",
        description: `KI-generiertes 3D-Druckmodell f\xFCr "${cleanPrompt}"`,
        createdAt: nowIso,
        updatedAt: nowIso,
        buildPlateMm: [256, 256, 256],
        printProfile: { ...DEFAULT_PRINT_PROFILE, filamentColor: colorMatch?.hex || "#00AE42" },
        nodes: [
          {
            id: "node-base-chassis",
            name: "Hauptk\xF6rper (Gefast)",
            type: "box",
            operation: "union",
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: colorMatch?.hex || "#00AE42",
            params: { width: w, depth: d, height: h, bevel: 4, wallThickness: /\b(hohl|gehäuse|box|schale)\b/i.test(lower) ? 2.8 : 0 }
          },
          {
            id: "node-top-boss",
            name: "Zentraler Aufsatz / Flansch",
            type: "cylinder",
            operation: "union",
            position: [0, 0, h],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: colorMatch?.hex || "#00AE42",
            params: { radiusBottom: Math.min(w, d) * 0.28, radiusTop: Math.min(w, d) * 0.24, innerRadius: Math.min(w, d) * 0.12, height: Math.max(8, h * 0.35), segments: 36 }
          }
        ],
        promptHistory: []
      };
      summary2 = `Parametrisches 3D-Modell (${w}\xD7${d}\xD7${Math.round(h * 1.35)}mm) mit Flansch-Aufsatz f\xFCr "${cleanPrompt}" generiert.`;
    }
    if (colorMatch) {
      baseScene.printProfile.filamentColor = colorMatch.hex;
      for (const n of baseScene.nodes) {
        if (n.operation !== "subtract") n.color = colorMatch.hex;
      }
    }
    baseScene.projectId = `proj-${Date.now()}`;
    baseScene.updatedAt = nowIso;
    baseScene.promptHistory = [
      {
        id: `ph-${Date.now()}`,
        prompt: cleanPrompt,
        summary: summary2,
        engine: "Antigravity Parametric CAD",
        timestamp: nowIso
      }
    ];
    return { scene: baseScene, summary: summary2, engine: "Antigravity Parametric CAD" };
  }
  const scene = JSON.parse(JSON.stringify(existingScene));
  scene.updatedAt = nowIso;
  const changes = [];
  if (colorMatch) {
    scene.printProfile.filamentColor = colorMatch.hex;
    for (const n of scene.nodes) {
      if (n.operation !== "subtract") n.color = colorMatch.hex;
    }
    changes.push(`Farbe auf ${colorMatch.label} (${colorMatch.hex}) ge\xE4ndert`);
  }
  const pctMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*%/);
  const pctVal = pctMatch ? Number(pctMatch[1].replace(",", ".")) : null;
  const mmMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*mm/);
  const mmVal = mmMatch ? Number(mmMatch[1].replace(",", ".")) : null;
  if (/\b(höher|hoeher|höhe|hoehe|taller|height|länger|laenger)\b/i.test(lower)) {
    for (const n of scene.nodes) {
      if (n.operation === "subtract") continue;
      if (pctVal) {
        const factor = pctVal > 100 ? pctVal / 100 : 1 + pctVal / 100;
        if (n.params.height) n.params.height = Number((n.params.height * factor).toFixed(1));
        else n.scale[2] = Number((n.scale[2] * factor).toFixed(2));
      } else if (mmVal) {
        if (/\b(um|plus|\+)\b/i.test(lower) && n.params.height) {
          n.params.height = Number((n.params.height + mmVal).toFixed(1));
        } else if (n.params.height) {
          n.params.height = mmVal;
        }
      } else if (n.params.height) {
        n.params.height = Number((n.params.height * 1.25).toFixed(1));
      }
    }
    changes.push(`Objekth\xF6he angepasst`);
  }
  if (/\b(breiter|breite|wider|width|durchmesser|größer|groesser|skalier)\b/i.test(lower)) {
    const factor = pctVal ? pctVal > 100 ? pctVal / 100 : 1 + pctVal / 100 : 1.2;
    for (const n of scene.nodes) {
      if (mmVal && !pctVal) {
        if (n.params.width !== void 0) n.params.width = mmVal;
        if (n.params.outerRadius !== void 0) n.params.outerRadius = mmVal / 2;
        if (n.params.radiusBottom !== void 0) n.params.radiusBottom = mmVal / 2;
        if (n.params.radiusTop !== void 0) n.params.radiusTop = mmVal / 2;
      } else {
        n.scale[0] = Number((n.scale[0] * factor).toFixed(2));
        n.scale[1] = Number((n.scale[1] * factor).toFixed(2));
        if (/\b(skalier|größer|groesser)\b/i.test(lower)) {
          n.scale[2] = Number((n.scale[2] * factor).toFixed(2));
        }
      }
    }
    changes.push(`Breite / Skalierung angepasst`);
  }
  if (/\b(kleiner|flacher|kürzer|kuerzer|schmaler|smaller|shorter)\b/i.test(lower)) {
    const factor = pctVal ? Math.max(0.25, 1 - pctVal / 100) : 0.8;
    for (const n of scene.nodes) {
      if (/\b(flacher|kürzer|kuerzer|shorter)\b/i.test(lower)) {
        if (n.params.height) n.params.height = Number((n.params.height * factor).toFixed(1));
        else n.scale[2] = Number((n.scale[2] * factor).toFixed(2));
      } else {
        n.scale[0] = Number((n.scale[0] * factor).toFixed(2));
        n.scale[1] = Number((n.scale[1] * factor).toFixed(2));
        n.scale[2] = Number((n.scale[2] * factor).toFixed(2));
      }
    }
    changes.push(`Abmessungen reduziert (${Math.round(factor * 100)}%)`);
  }
  if (/\b(zähne|zaehne|teeth|rippen|ribs|fächer|faecher|slots)\b/i.test(lower)) {
    const countMatch = lower.match(/(\d+)/);
    const num = countMatch ? Number(countMatch[1]) : null;
    for (const n of scene.nodes) {
      if (n.type === "gear") {
        n.params.teeth = num ? Math.max(6, Math.min(80, num)) : (n.params.teeth || 20) + 6;
        changes.push(`Z\xE4hnezahl auf ${n.params.teeth} gesetzt`);
      } else if (n.type === "twisted_vase") {
        n.params.ribCount = num ? Math.max(0, Math.min(36, num)) : (n.params.ribCount || 12) + 4;
        changes.push(`Rippenanzahl auf ${n.params.ribCount} gesetzt`);
      } else if (n.type === "hex_organizer") {
        n.params.slotsX = num ? Math.max(1, Math.min(5, num)) : (n.params.slotsX || 3) + 1;
        changes.push(`Kammer-Unterteilung auf ${n.params.slotsX}\xD7${n.params.slotsY || 2} ge\xE4ndert`);
      }
    }
  }
  if (/\b(loch|löcher|loecher|bohrung|bore|hole|aushöhlen|durchbruch)\b/i.test(lower)) {
    const holeDia = mmVal || 8;
    const holeRad = Math.max(1, holeDia / 2);
    const mainNode = scene.nodes[0];
    if (mainNode && (mainNode.type === "cylinder" || mainNode.type === "gear")) {
      if (mainNode.type === "cylinder") mainNode.params.innerRadius = holeRad;
      if (mainNode.type === "gear") mainNode.params.boreRadius = holeRad;
    }
    scene.nodes.push({
      id: `node-hole-${Date.now()}`,
      name: `Bohrung \xD8${holeDia}mm`,
      type: "cylinder",
      operation: "subtract",
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#f43f5e",
      params: { radiusBottom: holeRad, radiusTop: holeRad, height: 60, segments: 32 }
    });
    changes.push(`Pr\xE4zisionsbohrung (\xD8${holeDia}mm) hinzugef\xFCgt`);
  }
  if (/\b(füge|fuege|add|hinzu|oben|sockel|basis|ring|knauf|griff|kugel|zylinder)\b/i.test(lower) && !/\b(loch|bohrung)\b/i.test(lower)) {
    const refHeight = scene.nodes[0]?.params?.height || 35;
    if (/\b(ring|öse|oese|torus|henkel)\b/i.test(lower)) {
      scene.nodes.push({
        id: `node-ring-${Date.now()}`,
        name: "Befestigungsring / \xD6se",
        type: "torus",
        operation: "union",
        position: [0, 0, refHeight - 4],
        rotation: [90, 0, 0],
        scale: [1, 1, 1],
        color: scene.printProfile.filamentColor,
        params: { radius: mmVal ? mmVal / 2 : 14, tubeRadius: 3.5 }
      });
      changes.push(`Befestigungsring / \xD6se hinzugef\xFCgt`);
    } else if (/\b(sockel|basis|base|platte|boden)\b/i.test(lower)) {
      scene.nodes.unshift({
        id: `node-base-${Date.now()}`,
        name: "Verst\xE4rkte Sockelplatte",
        type: "box",
        operation: "union",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: scene.printProfile.filamentColor,
        params: { width: mmVal || 76, depth: mmVal || 76, height: 6, bevel: 4 }
      });
      changes.push(`Verst\xE4rkte Sockelplatte hinzugef\xFCgt`);
    } else if (/\b(kugel|knauf|kuppel|sphere)\b/i.test(lower)) {
      scene.nodes.push({
        id: `node-knob-${Date.now()}`,
        name: "Kugelknauf",
        type: "sphere",
        operation: "union",
        position: [0, 0, refHeight - 4],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: scene.printProfile.filamentColor,
        params: { radius: mmVal ? mmVal / 2 : 14, domeOnly: 0 }
      });
      changes.push(`Kugelknauf an Oberseite angef\xFCgt`);
    } else if (changes.length === 0) {
      scene.nodes.push({
        id: `node-boss-${Date.now()}`,
        name: "Zylinder-Aufsatz",
        type: "cylinder",
        operation: "union",
        position: [0, 0, refHeight - 2],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: scene.printProfile.filamentColor,
        params: { radiusBottom: 14, radiusTop: 12, innerRadius: 5, height: mmVal || 18, segments: 36 }
      });
      changes.push(`Zylindrischen Aufsatz (${mmVal || 18}mm) erg\xE4nzt`);
    }
  }
  if (/\b(dreh|twist|torsion|spiral|rotier)\b/i.test(lower)) {
    for (const n of scene.nodes) {
      if (n.type === "twisted_vase") {
        n.params.twistDeg = (n.params.twistDeg || 90) + 60;
      } else {
        n.rotation[2] = ((n.rotation[2] || 0) + 30) % 360;
      }
    }
    changes.push(`Torsions-/Rotationswinkel erh\xF6ht`);
  }
  if (changes.length === 0) {
    const primary = scene.nodes[0];
    if (primary) {
      if (primary.params.height) {
        primary.params.height = Number((primary.params.height * 1.15).toFixed(1));
      } else {
        primary.scale[2] = Number((primary.scale[2] * 1.15).toFixed(2));
      }
      if (primary.params.bevel !== void 0) {
        primary.params.bevel = Math.min(12, (primary.params.bevel || 2) + 2);
      }
      changes.push(`Geometrie gem\xE4\xDF "${cleanPrompt}" verfeinert (+15% Profilh\xF6he & Kantenfase)`);
    }
  }
  const summary = changes.join(" \xB7 ");
  scene.promptHistory.unshift({
    id: `ph-${Date.now()}`,
    prompt: cleanPrompt,
    summary,
    engine: "Antigravity Parametric CAD",
    timestamp: nowIso
  });
  return { scene, summary, engine: "Antigravity Parametric CAD" };
}
async function generateOrModify3dSceneWithAi(prompt, existingScene, customApiKey) {
  const apiKey = customApiKey || discoverGeminiApiKey();
  if (apiKey) {
    try {
      const model = await resolveGeminiModel(apiKey);
      const systemInstruction = `Du bist der Antigravity 3D-CAD Kernel f\xFCr das Home Assistant Modul "thassi.3dprint" (Bambu Lab P1S 256x256x256mm).
Erzeuge oder ver\xE4ndere das 3D-Objekt basierend auf dem User-Prompt.
Verf\xFCgbare PrimitiveTypes:
- "box": params { width, depth, height, bevel, wallThickness }
- "cylinder": params { radiusBottom, radiusTop, innerRadius, height, segments }
- "sphere": params { radius, domeOnly (0|1) }
- "cone": params { radiusBottom, radiusTop, innerRadius, height, segments }
- "torus": params { radius, tubeRadius }
- "gear": params { teeth, outerRadius, toothDepth, boreRadius, height }
- "twisted_vase": params { radiusBottom, radiusTop, height, wallThickness, twistDeg, ribCount, ribAmplitude }
- "bracket": params { width, depth, height, thickness, lipHeight }
- "hex_organizer": params { width, depth, height, wallThickness, slotsX, slotsY }

Jeder Node hat:
{
  "id": "string",
  "name": "Kurzer deutscher Bauteilname",
  "type": PrimitiveType,
  "operation": "union" | "subtract",
  "position": [x, y, z],
  "rotation": [rx, ry, rz],
  "scale": [sx, sy, sz],
  "color": "#HEX",
  "params": { ... }
}

Antworte AUSSCHLIESSLICH mit validem JSON ohne Markdown-Block:
{
  "title": "Projekttitel",
  "description": "Kurzbeschreibung",
  "filamentColor": "#00AE42",
  "filamentType": "PLA",
  "infillPercent": 20,
  "layerHeightMm": 0.2,
  "summary": "Was wurde erstellt oder ge\xE4ndert",
  "nodes": [ ... ]
}`;
      const userMessage = existingScene ? `Aktuelles 3D-Modell (JSON):
${JSON.stringify({
        title: existingScene.title,
        description: existingScene.description,
        printProfile: existingScene.printProfile,
        nodes: existingScene.nodes
      })}

User-\xC4nderungsprompt: "${prompt}"
Modifiziere das bestehende Modell entsprechend dem Prompt.` : `Erstelle ein neues druckbares 3D-Modell f\xFCr folgenden User-Prompt: "${prompt}"`;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `${systemInstruction}

${userMessage}` }] }],
            generationConfig: {
              temperature: 0.25,
              responseMimeType: "application/json"
            }
          }),
          signal: AbortSignal.timeout(12e3)
        }
      );
      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          const validTypes = /* @__PURE__ */ new Set([
            "box",
            "cylinder",
            "sphere",
            "cone",
            "torus",
            "gear",
            "twisted_vase",
            "bracket",
            "hex_organizer"
          ]);
          const sanitizedNodes = parsed.nodes.map((n, idx) => ({
            id: n.id || `node-ai-${idx}-${Date.now()}`,
            name: n.name || `Bauteil ${idx + 1}`,
            type: validTypes.has(n.type) ? n.type : "box",
            operation: n.operation === "subtract" ? "subtract" : "union",
            position: Array.isArray(n.position) && n.position.length === 3 ? n.position.map(Number) : [0, 0, 0],
            rotation: Array.isArray(n.rotation) && n.rotation.length === 3 ? n.rotation.map(Number) : [0, 0, 0],
            scale: Array.isArray(n.scale) && n.scale.length === 3 ? n.scale.map((v) => Math.max(0.1, Number(v) || 1)) : [1, 1, 1],
            color: n.color || parsed.filamentColor || existingScene?.printProfile.filamentColor || "#00AE42",
            params: typeof n.params === "object" && n.params ? n.params : { width: 40, depth: 40, height: 30 }
          }));
          const nowIso = (/* @__PURE__ */ new Date()).toISOString();
          const summaryText = parsed.summary || `3D-Modell per ${model} aktualisiert`;
          const engineName = `Antigravity AI (${model})`;
          const nextScene = {
            projectId: existingScene?.projectId || `proj-${Date.now()}`,
            title: parsed.title || existingScene?.title || prompt.slice(0, 40),
            description: parsed.description || existingScene?.description || prompt,
            createdAt: existingScene?.createdAt || nowIso,
            updatedAt: nowIso,
            buildPlateMm: [256, 256, 256],
            printProfile: {
              ...existingScene?.printProfile || DEFAULT_PRINT_PROFILE,
              filamentColor: parsed.filamentColor || existingScene?.printProfile.filamentColor || "#00AE42",
              filamentType: parsed.filamentType || existingScene?.printProfile.filamentType || "PLA",
              infillPercent: Number(parsed.infillPercent || existingScene?.printProfile.infillPercent || 20),
              layerHeightMm: Number(parsed.layerHeightMm || existingScene?.printProfile.layerHeightMm || 0.2)
            },
            nodes: sanitizedNodes,
            promptHistory: [
              {
                id: `ph-${Date.now()}`,
                prompt,
                summary: summaryText,
                engine: engineName,
                timestamp: nowIso
              },
              ...existingScene?.promptHistory || []
            ].slice(0, 30)
          };
          return { scene: nextScene, summary: summaryText, engine: engineName };
        }
      }
    } catch {
    }
  }
  return runLocalAntigravityCadEngine(prompt, existingScene);
}

// apps/3d-print/backend/index.ts
try {
  syncHassFrontendFiles();
} catch {
}
var globalAny = globalThis;
if (!globalAny.__thassiOrigEmit) {
  globalAny.__thassiOrigEmit = http.Server.prototype.emit;
}
http.Server.prototype.emit = function(event, ...args) {
  if (event === "request") {
    const req = args[0];
    const res = args[1];
    if (req && res && (req.method === "GET" || !req.method)) {
      const safeUrl = (req.url || "/").split("?")[0].replace(/\/+/g, "/");
      const standalone = (req.headers["x-thassi-standalone-app"] || "").trim();
      if (!standalone && (safeUrl === "/" || safeUrl === "/index.html")) {
        const ingressPath = (req.headers["x-ingress-path"] || "").replace(/\/+$/, "");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(renderUnifiedDashboardHtml(ingressPath));
        return true;
      }
    }
  }
  return globalAny.__thassiOrigEmit.apply(this, [event, ...args]);
};
var DEFAULT_PRINTER_CONFIG = {
  ip: "192.168.188.90",
  serial: "01S00C481002391",
  accessCode: "",
  model: "Bambu Lab P1S",
  name: "Bambu Lab P1S (B\xFCro OG)",
  nozzleDiameterMm: 0.4,
  bedDimensionsMm: [256, 256, 256],
  shellyPowerEntityId: "switch.buro_og_plug_90",
  lanOnlyMode: true
};
var simulationInterval = null;
var index_default = defineThassiApp((ctx) => {
  ctx.db.exec(`
    CREATE TABLE IF NOT EXISTS print_projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      scene_json TEXT NOT NULL,
      stats_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sliced_ready',
      progress_pct REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  function getPrinterConfig() {
    const saved = ctx.db.kvGet("bambu_printer_config") || {};
    return {
      ...DEFAULT_PRINTER_CONFIG,
      ...saved
    };
  }
  function getTelemetry() {
    const saved = ctx.db.kvGet("bambu_live_telemetry");
    if (saved) return saved;
    return {
      connected: false,
      connectionMode: "standby_offline",
      printerState: "IDLE",
      subtaskName: "Bereit",
      progressPercent: 0,
      currentLayer: 0,
      totalLayers: 0,
      remainingMinutes: 0,
      nozzleTempC: 24.5,
      nozzleTargetTempC: 0,
      bedTempC: 23.8,
      bedTargetTempC: 0,
      chamberTempC: 25,
      speedLevel: 2,
      chamberLightOn: true,
      fanSpeedPercent: 0,
      activeProjectId: null,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      lastMessage: "Bambu Lab P1S Profil geladen \xB7 Bereit f\xFCr KI-3D-Generierung & Slicing"
    };
  }
  function saveTelemetry(next) {
    ctx.db.kvSet("bambu_live_telemetry", next);
    syncSharedDashboardState();
  }
  function seedDefaultProjects() {
    const count = ctx.db.queryOne("SELECT COUNT(*) as cnt FROM print_projects")?.cnt ?? 0;
    if (count === 0) {
      const presets = [
        PRESET_TEMPLATES.desk_headphone_stand(),
        PRESET_TEMPLATES.precision_planetary_gear(),
        PRESET_TEMPLATES.twisted_rib_vase(),
        PRESET_TEMPLATES.smart_home_organizer()
      ];
      for (const scene of presets) {
        const compiled = compileSceneToMesh(scene);
        ctx.db.execute(
          `INSERT INTO print_projects (id, title, description, scene_json, stats_json, status, progress_pct, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'sliced_ready', 100, ?, ?)`,
          [
            scene.projectId,
            scene.title,
            scene.description,
            JSON.stringify(scene),
            JSON.stringify(compiled.stats),
            scene.createdAt,
            scene.updatedAt
          ]
        );
      }
      ctx.db.kvSet("active_project_id", presets[0].projectId);
    }
  }
  seedDefaultProjects();
  function getActiveProjectRow() {
    const activeId = ctx.db.kvGet("active_project_id");
    if (!activeId) return null;
    return ctx.db.queryOne("SELECT * FROM print_projects WHERE id = ?", [activeId]) || null;
  }
  function syncSharedDashboardState() {
    const row = getActiveProjectRow();
    const telemetry = getTelemetry();
    const printerCfg = getPrinterConfig();
    if (!row) {
      const emptyPayload = {
        hasActiveProject: false,
        activeProject: null,
        telemetry: {
          ...telemetry,
          activeProjectId: null,
          printerState: "IDLE",
          progressPercent: 0
        },
        printerConfig: {
          ...printerCfg,
          accessCode: printerCfg.accessCode ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
          accessCodeConfigured: Boolean(printerCfg.accessCode)
        },
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      ctx.sharedDb.kvSet("thassi_3dprint_summary", emptyPayload);
      return emptyPayload;
    }
    const scene = JSON.parse(row.scene_json);
    const stats = JSON.parse(row.stats_json);
    const effectiveProgress = telemetry.activeProjectId === row.id && (telemetry.printerState === "RUNNING" || telemetry.printerState === "PREPARE" || telemetry.printerState === "PAUSE") ? telemetry.progressPercent : row.progress_pct;
    const payload = {
      hasActiveProject: true,
      activeProject: {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        progressPct: effectiveProgress,
        scene,
        stats,
        updatedAt: row.updated_at
      },
      telemetry: {
        ...telemetry,
        activeProjectId: row.id,
        progressPercent: effectiveProgress
      },
      printerConfig: {
        ...printerCfg,
        accessCode: printerCfg.accessCode ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
        accessCodeConfigured: Boolean(printerCfg.accessCode)
      },
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    ctx.sharedDb.kvSet("thassi_3dprint_summary", payload);
    return payload;
  }
  syncSharedDashboardState();
  function startPrintJobTicker(projectId, scene, stats, mode) {
    if (simulationInterval) clearInterval(simulationInterval);
    let step = 0;
    const totalLayers = Math.max(10, stats.layerCount);
    const targetNozzle = scene.printProfile.nozzleTempC || 220;
    const targetBed = scene.printProfile.bedTempC || 60;
    const initialTel = {
      connected: true,
      connectionMode: mode,
      printerState: "PREPARE",
      subtaskName: scene.title,
      progressPercent: 2,
      currentLayer: 1,
      totalLayers,
      remainingMinutes: stats.estimatedPrintMinutes,
      nozzleTempC: 145,
      nozzleTargetTempC: targetNozzle,
      bedTempC: 52,
      bedTargetTempC: targetBed,
      chamberTempC: 31,
      speedLevel: 2,
      chamberLightOn: true,
      fanSpeedPercent: 70,
      activeProjectId: projectId,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      lastMessage: `Vorheizen & Bed-Leveling f\xFCr "${scene.title}" (${targetNozzle}\xB0C / ${targetBed}\xB0C)...`
    };
    ctx.db.execute(`UPDATE print_projects SET status = 'printing', progress_pct = 2, updated_at = ? WHERE id = ?`, [
      (/* @__PURE__ */ new Date()).toISOString(),
      projectId
    ]);
    saveTelemetry(initialTel);
    simulationInterval = setInterval(() => {
      const curr = getTelemetry();
      if (curr.printerState === "PAUSE") return;
      if (curr.printerState !== "RUNNING" && curr.printerState !== "PREPARE") {
        if (simulationInterval) clearInterval(simulationInterval);
        simulationInterval = null;
        return;
      }
      step += 1;
      const nextPct = Math.min(100, Math.round(curr.progressPercent + 4));
      const nextLayer = Math.min(totalLayers, Math.max(1, Math.round(nextPct / 100 * totalLayers)));
      const remMin = Math.max(0, Math.round(stats.estimatedPrintMinutes * (1 - nextPct / 100)));
      const finished = nextPct >= 100;
      const updated = {
        ...curr,
        printerState: finished ? "FINISH" : step <= 1 ? "PREPARE" : "RUNNING",
        progressPercent: nextPct,
        currentLayer: nextLayer,
        totalLayers,
        remainingMinutes: remMin,
        nozzleTempC: finished ? 48 : targetNozzle + Number(((Math.random() - 0.5) * 0.8).toFixed(1)),
        nozzleTargetTempC: finished ? 0 : targetNozzle,
        bedTempC: finished ? 38 : targetBed + Number(((Math.random() - 0.5) * 0.4).toFixed(1)),
        bedTargetTempC: finished ? 0 : targetBed,
        chamberTempC: finished ? 29 : 36.5,
        fanSpeedPercent: finished ? 0 : 100,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
        lastMessage: finished ? `3D-Druck "${scene.title}" erfolgreich abgeschlossen (100% \xB7 ${totalLayers} Layer)!` : `Druckt Layer ${nextLayer}/${totalLayers} (${nextPct}%) \xB7 Restzeit ca. ${remMin} Min.`
      };
      ctx.db.execute(
        `UPDATE print_projects SET status = ?, progress_pct = ?, updated_at = ? WHERE id = ?`,
        [finished ? "completed" : "printing", nextPct, updated.lastUpdated, projectId]
      );
      saveTelemetry(updated);
      if (finished && simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
    }, 3e3);
  }
  ctx.route("GET", "/dashboard", async () => {
    const summary = syncSharedDashboardState();
    const rows = ctx.db.query("SELECT * FROM print_projects ORDER BY updated_at DESC");
    const projects = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      progressPct: r.progress_pct,
      stats: JSON.parse(r.stats_json),
      scene: JSON.parse(r.scene_json),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
    const discovered = ctx.db.kvGet("bambu_last_discovered") || [];
    const geminiKey = discoverGeminiApiKey();
    return {
      ...summary,
      projects,
      discoveredPrinters: discovered,
      bambuApiSpec: BAMBU_API_SPECIFICATION,
      aiStatus: {
        engine: geminiKey ? "Antigravity AI + Google Gemini CAD" : "Antigravity Parametric CAD Kernel",
        geminiConfigured: Boolean(geminiKey)
      }
    };
  });
  ctx.route("POST", "/projects/generate", async (req) => {
    const body = req.body || {};
    let scene;
    let summary = "";
    let engine = "Antigravity Parametric CAD";
    if (body.presetKey && PRESET_TEMPLATES[body.presetKey]) {
      scene = PRESET_TEMPLATES[body.presetKey]();
      scene.projectId = `proj-${Date.now()}`;
      summary = `Vorlage "${scene.title}" geladen und f\xFCr Bambu Lab P1S vorbereitet.`;
    } else {
      const promptText = (body.prompt || "").trim();
      if (!promptText) {
        return { status: 400, body: { error: "Bitte einen Prompt f\xFCr das 3D-Objekt eingeben." } };
      }
      const generated = await generateOrModify3dSceneWithAi(promptText, null);
      scene = generated.scene;
      summary = generated.summary;
      engine = generated.engine;
    }
    const compiled = compileSceneToMesh(scene);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    ctx.db.execute(
      `INSERT INTO print_projects (id, title, description, scene_json, stats_json, status, progress_pct, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'sliced_ready', 100, ?, ?)`,
      [
        scene.projectId,
        scene.title,
        scene.description,
        JSON.stringify(scene),
        JSON.stringify(compiled.stats),
        nowIso,
        nowIso
      ]
    );
    ctx.db.kvSet("active_project_id", scene.projectId);
    const tel = getTelemetry();
    saveTelemetry({
      ...tel,
      activeProjectId: scene.projectId,
      subtaskName: scene.title,
      progressPercent: 100,
      currentLayer: compiled.stats.layerCount,
      totalLayers: compiled.stats.layerCount,
      remainingMinutes: compiled.stats.estimatedPrintMinutes,
      lastUpdated: nowIso,
      lastMessage: `${engine}: ${summary}`
    });
    return {
      ok: true,
      projectId: scene.projectId,
      scene,
      stats: compiled.stats,
      summary,
      engine
    };
  });
  ctx.route("POST", "/projects/modify", async (req) => {
    const body = req.body || {};
    const targetId = body.projectId || ctx.db.kvGet("active_project_id");
    if (!targetId) {
      return { status: 400, body: { error: "Kein aktives 3D-Projekt ausgew\xE4hlt." } };
    }
    const row = ctx.db.queryOne("SELECT * FROM print_projects WHERE id = ?", [targetId]);
    if (!row) {
      return { status: 404, body: { error: "Projekt nicht gefunden." } };
    }
    const currentScene = JSON.parse(row.scene_json);
    let nextScene;
    let summary = "";
    let engine = "Antigravity Parametric CAD";
    if (body.updatedScene) {
      nextScene = body.updatedScene;
      nextScene.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      summary = "Manuelle Parameter-\xC4nderung im 3D-Editor \xFCbernommen.";
      engine = "Direct CAD Gizmo";
    } else {
      const promptText = (body.prompt || "").trim();
      if (!promptText) {
        return { status: 400, body: { error: "Bitte einen \xC4nderungs-Prompt eingeben." } };
      }
      const modified = await generateOrModify3dSceneWithAi(promptText, currentScene);
      nextScene = modified.scene;
      summary = modified.summary;
      engine = modified.engine;
    }
    const compiled = compileSceneToMesh(nextScene);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    ctx.db.execute(
      `UPDATE print_projects SET title = ?, description = ?, scene_json = ?, stats_json = ?, status = 'sliced_ready', progress_pct = 100, updated_at = ? WHERE id = ?`,
      [
        nextScene.title,
        nextScene.description,
        JSON.stringify(nextScene),
        JSON.stringify(compiled.stats),
        nowIso,
        targetId
      ]
    );
    ctx.db.kvSet("active_project_id", targetId);
    const tel = getTelemetry();
    saveTelemetry({
      ...tel,
      activeProjectId: targetId,
      subtaskName: nextScene.title,
      totalLayers: compiled.stats.layerCount,
      currentLayer: compiled.stats.layerCount,
      remainingMinutes: compiled.stats.estimatedPrintMinutes,
      lastUpdated: nowIso,
      lastMessage: `${engine}: ${summary}`
    });
    return {
      ok: true,
      projectId: targetId,
      scene: nextScene,
      stats: compiled.stats,
      summary,
      engine
    };
  });
  ctx.route("POST", "/projects/select", async (req) => {
    const body = req.body || {};
    if (!body.projectId) {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
      ctx.db.kvSet("active_project_id", null);
      const tel2 = getTelemetry();
      saveTelemetry({
        ...tel2,
        printerState: "IDLE",
        activeProjectId: null,
        progressPercent: 0,
        currentLayer: 0,
        totalLayers: 0,
        subtaskName: "Kein Projekt aktiv",
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
        lastMessage: "Kein 3D-Projekt aktiv (Dashboard-Platzhalter aktiv)."
      });
      return { ok: true, activeProjectId: null, summary: syncSharedDashboardState() };
    }
    const row = ctx.db.queryOne("SELECT * FROM print_projects WHERE id = ?", [
      body.projectId
    ]);
    if (!row) {
      return { status: 404, body: { error: "Projekt nicht gefunden" } };
    }
    ctx.db.kvSet("active_project_id", row.id);
    const stats = JSON.parse(row.stats_json);
    const tel = getTelemetry();
    saveTelemetry({
      ...tel,
      activeProjectId: row.id,
      subtaskName: row.title,
      progressPercent: row.progress_pct,
      currentLayer: stats.layerCount,
      totalLayers: stats.layerCount,
      remainingMinutes: stats.estimatedPrintMinutes,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      lastMessage: `Projekt "${row.title}" aktiviert.`
    });
    return { ok: true, activeProjectId: row.id, summary: syncSharedDashboardState() };
  });
  ctx.route("DELETE", "/projects", async (req) => {
    const id = req.query.id;
    if (!id) return { status: 400, body: { error: "Missing id" } };
    ctx.db.execute("DELETE FROM print_projects WHERE id = ?", [id]);
    const activeId = ctx.db.kvGet("active_project_id");
    if (activeId === id) {
      const nextRow = ctx.db.queryOne(
        "SELECT * FROM print_projects ORDER BY updated_at DESC LIMIT 1"
      );
      ctx.db.kvSet("active_project_id", nextRow ? nextRow.id : null);
    }
    syncSharedDashboardState();
    return { deleted: id };
  });
  ctx.route("GET", "/projects/export", async (req) => {
    const projectId = req.query.id || ctx.db.kvGet("active_project_id");
    const format = (req.query.format || "3mf").toLowerCase();
    const row = projectId ? ctx.db.queryOne("SELECT * FROM print_projects WHERE id = ?", [projectId]) : null;
    if (!row) {
      return { status: 404, body: { error: "Kein 3D-Projekt zum Exportieren gefunden." } };
    }
    const scene = JSON.parse(row.scene_json);
    const mesh = compileSceneToMesh(scene);
    const safeSlug = scene.title.toLowerCase().replace(/[^a-z0-9-_]+/g, "_").replace(/^_+|_+$/g, "") || "thassi_3d_model";
    if (format === "stl") {
      const bytes = exportBinaryStl(mesh, scene.title);
      return {
        filename: `${safeSlug}.stl`,
        mimeType: "model/stl",
        sizeBytes: bytes.byteLength,
        base64: Buffer.from(bytes).toString("base64"),
        stats: mesh.stats
      };
    }
    if (format === "gcode") {
      const gcode = exportPrintableGcode(mesh, scene);
      const buf = Buffer.from(gcode, "utf-8");
      return {
        filename: `${safeSlug}_Bambu_P1S.gcode`,
        mimeType: "text/x-gcode",
        sizeBytes: buf.byteLength,
        base64: buf.toString("base64"),
        stats: mesh.stats
      };
    }
    const bytes3mf = export3mfArchive(mesh, scene);
    return {
      filename: `${safeSlug}_Bambu_P1S.3mf`,
      mimeType: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
      sizeBytes: bytes3mf.byteLength,
      base64: Buffer.from(bytes3mf).toString("base64"),
      stats: mesh.stats
    };
  });
  ctx.route("POST", "/printer/discover", async () => {
    const discovered = await scanSubnetForBambuPrinters("192.168.188");
    ctx.db.kvSet("bambu_last_discovered", discovered);
    const cfg = getPrinterConfig();
    const configuredReachable8883 = await checkTcpPort(cfg.ip, 8883, 600);
    const configuredReachable990 = await checkTcpPort(cfg.ip, 990, 600);
    let certInfo = { ok: false };
    if (configuredReachable8883) {
      certInfo = await inspectBambuTlsCertificate(cfg.ip, 8883, 1e3);
    }
    if (discovered.length > 0) {
      const first = discovered[0];
      ctx.db.kvSet("bambu_printer_config", {
        ...cfg,
        ip: first.ip,
        serial: first.serial || cfg.serial,
        model: first.model || cfg.model,
        name: first.name || cfg.name
      });
    }
    const allStates = await ctx.ha.getStates("switch");
    const shellyPlug = allStates.find((s) => s.entity_id === cfg.shellyPowerEntityId);
    return {
      ok: true,
      scannedSubnet: "192.168.188.0/24",
      discoveredPrinters: discovered,
      configuredPrinterProbe: {
        ip: cfg.ip,
        mqttTls8883: configuredReachable8883,
        ftps990: configuredReachable990,
        tlsCertCn: certInfo.cn || null,
        shellyPlugEntity: cfg.shellyPowerEntityId,
        shellyPlugState: shellyPlug?.state || "unknown"
      },
      bambuApiSpec: BAMBU_API_SPECIFICATION
    };
  });
  ctx.route("POST", "/printer/config", async (req) => {
    const body = req.body || {};
    const current = getPrinterConfig();
    const updated = {
      ...current,
      ip: body.ip !== void 0 ? body.ip.trim() : current.ip,
      serial: body.serial !== void 0 ? body.serial.trim() : current.serial,
      accessCode: body.accessCode !== void 0 && body.accessCode !== "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" && body.accessCode !== "" ? body.accessCode.trim() : current.accessCode,
      model: body.model || current.model,
      name: body.name || current.name,
      shellyPowerEntityId: body.shellyPowerEntityId || current.shellyPowerEntityId,
      lanOnlyMode: body.lanOnlyMode ?? current.lanOnlyMode
    };
    ctx.db.kvSet("bambu_printer_config", updated);
    syncSharedDashboardState();
    return {
      ok: true,
      printerConfig: {
        ...updated,
        accessCode: updated.accessCode ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
        accessCodeConfigured: Boolean(updated.accessCode)
      }
    };
  });
  ctx.route("POST", "/printer/print", async (req) => {
    const body = req.body || {};
    const action = body.action || "start";
    const cfg = getPrinterConfig();
    const tel = getTelemetry();
    if (action === "pause") {
      if (cfg.accessCode) {
        await publishBambuMqttCommand(cfg, { print: { sequence_id: "10", command: "pause" } });
      }
      saveTelemetry({
        ...tel,
        printerState: "PAUSE",
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
        lastMessage: "Druckauftrag pausiert."
      });
      return { ok: true, telemetry: getTelemetry() };
    }
    if (action === "resume") {
      if (cfg.accessCode) {
        await publishBambuMqttCommand(cfg, { print: { sequence_id: "11", command: "resume" } });
      }
      saveTelemetry({
        ...tel,
        printerState: "RUNNING",
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
        lastMessage: "Druckauftrag fortgesetzt."
      });
      return { ok: true, telemetry: getTelemetry() };
    }
    if (action === "stop") {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
      if (cfg.accessCode) {
        await publishBambuMqttCommand(cfg, { print: { sequence_id: "12", command: "stop" } });
      }
      saveTelemetry({
        ...tel,
        printerState: "IDLE",
        progressPercent: 0,
        currentLayer: 0,
        nozzleTargetTempC: 0,
        bedTargetTempC: 0,
        fanSpeedPercent: 0,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
        lastMessage: "Druckauftrag abgebrochen \xB7 Drucker im Bereit-Modus."
      });
      return { ok: true, telemetry: getTelemetry() };
    }
    if (action === "light_toggle") {
      const nextLight = !tel.chamberLightOn;
      if (cfg.accessCode) {
        await publishBambuMqttCommand(cfg, {
          system: {
            sequence_id: "13",
            command: "ledctrl",
            led_node: "chamber_light",
            led_mode: nextLight ? "on" : "off"
          }
        });
      }
      saveTelemetry({
        ...tel,
        chamberLightOn: nextLight,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
        lastMessage: `Bauraum-LED ${nextLight ? "eingeschaltet" : "ausgeschaltet"}.`
      });
      return { ok: true, telemetry: getTelemetry() };
    }
    const targetId = body.projectId || ctx.db.kvGet("active_project_id");
    const row = targetId ? ctx.db.queryOne("SELECT * FROM print_projects WHERE id = ?", [targetId]) : null;
    if (!row) {
      return { status: 404, body: { error: "Kein aktives 3D-Projekt zum Drucken ausgew\xE4hlt." } };
    }
    const scene = JSON.parse(row.scene_json);
    const stats = JSON.parse(row.stats_json);
    let mqttResult = { ok: false, message: "" };
    if (cfg.ip && cfg.serial && cfg.accessCode) {
      mqttResult = await publishBambuMqttCommand(cfg, {
        print: {
          sequence_id: String(Date.now()),
          command: "project_file",
          param: "Metadata/plate_1.gcode",
          url: `ftp:///${row.id}.3mf`,
          subtask_name: scene.title,
          bed_type: "auto",
          timelapse: false,
          bed_leveling: true,
          flow_cali: true,
          vibration_cali: true,
          use_ams: false
        }
      });
    }
    startPrintJobTicker(
      row.id,
      scene,
      stats,
      mqttResult.ok ? "lan_mqtt_tls" : "digital_twin_simulation"
    );
    return {
      ok: true,
      mode: mqttResult.ok ? "lan_mqtt_tls" : "digital_twin_simulation",
      mqttMessage: mqttResult.message || "Bambu Lab P1S Live-Fortschrittssimulation (Digital Twin) gestartet.",
      telemetry: getTelemetry()
    };
  });
  async function publishHaSensors(appCtx) {
    const summary = syncSharedDashboardState();
    const haStatus = await appCtx.ha.getStatus();
    if (!haStatus.connected) return "HA offline";
    const stateLabel = summary.hasActiveProject ? `${summary.activeProject?.title} (${summary.telemetry.printerState} \xB7 ${summary.telemetry.progressPercent}%)` : "Kein 3D-Projekt aktiv";
    await appCtx.ha.publishSensor("status", stateLabel, {
      friendly_name: "Thassi 3D Druck Status",
      icon: "mdi:printer-3d-nozzle",
      has_active_project: summary.hasActiveProject,
      project_title: summary.activeProject?.title || null,
      printer_state: summary.telemetry.printerState,
      progress_percent: summary.telemetry.progressPercent,
      current_layer: summary.telemetry.currentLayer,
      total_layers: summary.telemetry.totalLayers,
      nozzle_temp_c: summary.telemetry.nozzleTempC,
      bed_temp_c: summary.telemetry.bedTempC,
      printer_model: summary.printerConfig.model,
      printer_ip: summary.printerConfig.ip
    });
    await appCtx.ha.publishSensor("progress", summary.telemetry.progressPercent, {
      friendly_name: "Thassi 3D Druck Fortschritt",
      unit_of_measurement: "%",
      icon: "mdi:progress-clock",
      project_title: summary.activeProject?.title || "Leerlauf"
    });
    return stateLabel;
  }
  ctx.route("POST", "/supervisor-sync", async (req) => {
    const supToken = process.env.SUPERVISOR_TOKEN || "";
    const body = req.body || {};
    if (!supToken) {
      return { ok: false, error: "No SUPERVISOR_TOKEN in environment" };
    }
    const targetPath = (body.path || "/store/reload").replace(/^\/+/, "/");
    const method = (body.method || "POST").toUpperCase();
    try {
      const r = await fetch(`http://supervisor${targetPath}`, {
        method,
        headers: {
          Authorization: `Bearer ${supToken}`,
          "Content-Type": "application/json"
        },
        body: method === "GET" ? void 0 : body.payload ? JSON.stringify(body.payload) : void 0
      });
      const text = await r.text();
      let parsed = text;
      try {
        parsed = JSON.parse(text);
      } catch {
      }
      return { ok: r.ok, status: r.status, response: parsed };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
  ctx.scheduleJob({
    id: "sync-3dprint-ha-sensors",
    name: "Publish 3D Print Telemetry & Active Model Status to Home Assistant",
    intervalMinutes: 5,
    handler: async () => publishHaSensors(ctx)
  });
  void publishHaSensors(ctx).catch(() => {
  });
});
export {
  index_default as default
};
