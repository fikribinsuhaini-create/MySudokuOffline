// telegram.js - Telegram Mini App integration (safe no-op outside Telegram)

(function () {
    function setCssVar(name, value) {
        if (!value) return;
        document.documentElement.style.setProperty(name, value);
    }

    function parseColor(value) {
        if (typeof value !== 'string') return null;
        const v = value.trim();
        if (!v) return null;
        return v;
    }

    function applyTelegramTheme(tg) {
        const p = tg?.themeParams || {};
        const bg = parseColor(p.bg_color);
        const secondaryBg = parseColor(p.secondary_bg_color);
        const text = parseColor(p.text_color);
        const hint = parseColor(p.hint_color);
        const button = parseColor(p.button_color);

        // Map Telegram theme params into existing design vars
        setCssVar('--tg-bg', bg);
        setCssVar('--tg-secondary-bg', secondaryBg);
        setCssVar('--tg-text', text);
        setCssVar('--tg-hint', hint);
        setCssVar('--tg-button', button);

        // Prefer Telegram theme when available (fallback stays as-is)
        if (bg) setCssVar('--bg-primary', bg);
        if (secondaryBg) setCssVar('--bg-secondary', secondaryBg);
        if (text) {
            setCssVar('--text-primary', text);
            // If Telegram provides text color, keep secondary/hint readable
            if (hint) setCssVar('--text-secondary', hint);
        }

        // Use Telegram button color as accent if provided
        if (button) setCssVar('--accent-primary', button);
    }

    function setAppHeightVar() {
        // Fix 100vh issues in mobile webviews
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    }

    function init() {
        setAppHeightVar();
        window.addEventListener('resize', setAppHeightVar);

        const tg = window.Telegram?.WebApp;
        if (!tg) return;

        document.documentElement.classList.add('in-telegram');

        try { tg.ready(); } catch (_) {}
        try { tg.expand(); } catch (_) {}
        try { tg.disableVerticalSwipes?.(); } catch (_) {}

        try { applyTelegramTheme(tg); } catch (_) {}

        try {
            tg.onEvent?.('themeChanged', () => {
                try { applyTelegramTheme(tg); } catch (_) {}
            });
        } catch (_) {}

        // Keep app palette consistent with Telegram chrome if supported
        try { tg.setHeaderColor?.('bg_color'); } catch (_) {}
        try { tg.setBackgroundColor?.(tg.themeParams?.bg_color || '#0a0e27'); } catch (_) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

