(() => {
    const themeLink = document.getElementById('theme-stylesheet');
    const themeSelect = document.getElementById('theme-select');

    const getOption = (value) => {
        if (!themeSelect) return null;
        return Array.from(themeSelect.options).find((option) => option.value === value);
    };

    const defaultHref = themeSelect?.value || 'style.css';
    const savedHref = localStorage.getItem('satisfying-theme');
    const startingHref = getOption(savedHref) ? savedHref : defaultHref;

    const applyTheme = (href) => {
        const option = getOption(href) || getOption(defaultHref);
        const nextHref = option?.value || defaultHref;

        if (themeLink) {
            themeLink.setAttribute('href', nextHref);
        }

        document.body.dataset.theme = option?.dataset.theme || '';
        localStorage.setItem('satisfying-theme', nextHref);

        if (themeSelect && themeSelect.value !== nextHref) {
            themeSelect.value = nextHref;
        }
    };

    if (themeSelect) {
        themeSelect.addEventListener('change', (event) => {
            applyTheme(event.target.value);
        });
    }

    applyTheme(startingHref);
})();
