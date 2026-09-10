(function () {
  const STORAGE_KEY = 'preferred-lang';
  const DEFAULT = 'en';

  function setLang(lang) {
    lang = lang === 'zh' ? 'zh' : DEFAULT;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('.lang-en').forEach(el => el.hidden = (lang !== 'en'));
    document.querySelectorAll('.lang-zh').forEach(el => el.hidden = (lang !== 'zh'));
    document.querySelectorAll('[data-lang-en]').forEach(el => {
      el.textContent = lang === 'zh' ? el.dataset.langZh : el.dataset.langEn;
    });
    document.querySelectorAll('[data-aria-en]').forEach(el => {
      el.setAttribute('aria-label', lang === 'zh' ? el.dataset.ariaZh : el.dataset.ariaEn);
    });
    document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
      btn.dataset.active = lang;
      btn.textContent = lang === 'en' ? '中文' : 'EN';
      btn.setAttribute('aria-label', lang === 'en' ? 'Switch to Chinese' : '切换到英文');
    });
    localStorage.setItem(STORAGE_KEY, lang);
    window.dispatchEvent(new Event('resize'));
  }

  document.addEventListener('DOMContentLoaded', function () {
    const saved = localStorage.getItem(STORAGE_KEY) || DEFAULT;
    setLang(saved);
    document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        setLang(this.dataset.active === 'en' ? 'zh' : 'en');
      });
    });
  });
})();
