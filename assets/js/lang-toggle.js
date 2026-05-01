(function () {
  const STORAGE_KEY = 'preferred-lang';
  const DEFAULT = 'en';

  function setLang(lang) {
    document.querySelectorAll('.lang-en').forEach(el => el.hidden = (lang !== 'en'));
    document.querySelectorAll('.lang-zh').forEach(el => el.hidden = (lang !== 'zh'));
    document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
      btn.dataset.active = lang;
      btn.textContent = lang === 'en' ? '中文' : 'EN';
    });
    localStorage.setItem(STORAGE_KEY, lang);
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
