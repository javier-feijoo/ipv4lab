// nav.js — pestañas
(function(){
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      document.querySelectorAll('.tab-panel').forEach(p => { p.classList.remove('active'); p.hidden = true; });
      btn.classList.add('active'); btn.setAttribute('aria-selected','true');
      const id = btn.dataset.tab; const panel = document.getElementById(id); if (panel) { panel.hidden = false; panel.classList.add('active'); }
    });
  });
})();

