export function createToastController({ translate, settings, toastContainer }) {
    function formatTemplate(str, params = {}) {
        return str.replace(/\{(\w+)\}/g, (_, key) => params[key] !== undefined ? params[key] : `{${key}}`);
    }

    function translateWithParams(key, params = {}, fallback) {
        const base = translate(key) || fallback || key;
        return formatTemplate(base, params);
    }

    const mapStringToToast = (msg) => {
        const patterns = [
            { regex: /Ach.?te le Pok.?mon pr.?c.?dent/, map: () => ({ key: 'toast-buy-prev' }) },
            { regex: /Shiny trouv.? ! (.+) rejoint l.?quipe \(bonus x([\d.]+)\)/, map: (m) => ({ key: 'toast-shiny-found', params: { name: m[1], mult: m[2] } }) },
            { regex: /Pas assez de Pok.?dollars/, map: () => ({ key: 'toast-no-money' }) },
            { regex: /upgrade pr.?c.?dente/, map: () => ({ key: 'toast-upgrade-prev' }) },
            { regex: /Am.?lioration impossible/, map: () => ({ key: 'toast-upgrade-fail' }) },
            { regex: /^(.+) activ�\.$/, map: (m) => ({ key: 'toast-item-used', params: { name: m[1] } }) },
            { regex: /^(.+) activ�$/, map: (m) => ({ key: 'toast-auto-activated', params: { name: m[1] } }) },
            { regex: /auto-bot/, map: () => ({ key: 'toast-no-money-auto' }) },
            { regex: /Auto Buy Progressif ON/, map: () => ({ key: 'toast-auto-chain-on' }) },
            { regex: /Auto Buy Progressif OFF/, map: () => ({ key: 'toast-auto-chain-off' }) },
            { regex: /Pas assez pour le ticket de ligue/, map: () => ({ key: 'toast-no-league-money' }) },
            { regex: /(.*): combat lanc� \(difficult� ([0-9.]+)x\)/, map: (m) => ({ key: 'toast-league-start', params: { name: m[1], difficulty: m[2] } }) },
            { regex: /Challenge actif: (.+)/, map: (m) => ({ key: 'toast-challenge-start', params: { name: m[1] } }) },
            { regex: /Aucun exemplaire dans l'inventaire/, map: () => ({ key: 'toast-no-item' }) },
            { regex: /D�bloque les talents requis/, map: () => ({ key: 'toast-talent-req' }) },
            { regex: /Talent d�bloqu� : (.+)/, map: (m) => ({ key: 'toast-talent-unlock', params: { name: m[1] } }) },
            { regex: /Pas assez de points talent/, map: () => ({ key: 'toast-talent-no-points' }) },
            { regex: /Challenge d�sactiv�/, map: () => ({ key: 'toast-challenge-stop' }) },
        ];

        for (const pattern of patterns) {
            const match = msg.match(pattern.regex);
            if (match) return pattern.map(match);
        }
        return null;
    };

    function showToast(message, isHtml = false) {
        if (!toastContainer || settings.showToasts === false) return;

        let content = message;
        let htmlFlag = isHtml;

        if (typeof message === 'object' && message !== null && message.key) {
            content = translateWithParams(message.key, message.params, message.fallback || '');
            htmlFlag = message.html;
        } else if (typeof message === 'string') {
            const autoToast = mapStringToToast(message);
            if (autoToast) {
                content = translateWithParams(autoToast.key, autoToast.params || {});
            }
        }

        const toastEl = document.createElement('div');
        toastEl.className = 'toast';
        toastEl.innerHTML = htmlFlag ? content : `<span>${content}</span>`;
        toastContainer.appendChild(toastEl);
        setTimeout(() => toastEl.remove(), 4500);
    }

    function toast(key, params = {}, html = false) {
        showToast({ key, params, html });
    }

    return { translateWithParams, showToast, toast };
}
