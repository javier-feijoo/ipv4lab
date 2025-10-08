// theme.js — manejo de tema claro/oscuro (por defecto: claro)
(function () {
  // Tema
  const themeBtn = document.getElementById('themeToggle');
  function applyTheme(t){ document.body.setAttribute('data-theme', t); if(themeBtn){ themeBtn.textContent = `Tema: ${t==='light'?'Claro':'Oscuro'}`; } }
  const savedTheme = localStorage.getItem('ipv4lab.theme') || 'light';
  applyTheme(savedTheme);
  if (themeBtn) themeBtn.addEventListener('click', ()=>{ const next = (document.body.getAttribute('data-theme')==='light')?'dark':'light'; applyTheme(next); localStorage.setItem('ipv4lab.theme', next); });

  // Modo proyector (ancho completo y bits cuadrados a escala)
  const layoutBtn = document.getElementById('layoutToggle');
  function applyLayout(m){ document.body.setAttribute('data-layout', m); if(layoutBtn){ layoutBtn.textContent = `Proyector: ${m==='projector'?'On':'Off'}`; } }
  const savedLayout = localStorage.getItem('ipv4lab.layout') || 'normal';
  applyLayout(savedLayout);
  if (layoutBtn) layoutBtn.addEventListener('click', ()=>{ const curr = document.body.getAttribute('data-layout') || 'normal'; const next = curr==='normal' ? 'projector' : 'normal'; applyLayout(next); localStorage.setItem('ipv4lab.layout', next); });
})();
