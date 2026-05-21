(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;

  function setPressed(theme) {
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }
  setPressed(root.getAttribute('data-theme') || 'light');

  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    setPressed(next);
  });

  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var listener = function (e) {
      try { if (localStorage.getItem('theme')) return; } catch (err) {}
      var t = e.matches ? 'dark' : 'light';
      root.setAttribute('data-theme', t);
      setPressed(t);
    };
    if (mq.addEventListener) mq.addEventListener('change', listener);
    else if (mq.addListener) mq.addListener(listener);
  }
})();
