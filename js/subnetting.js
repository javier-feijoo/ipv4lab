// subnetting.js — FLSM y VLSM
(function(){
  const { clamp, parseOctets, octetsToStr, fromUint32, maskFromCidr, toUint32, maskToStrFromCidr, blockSizeFromPrefix, normalizeNetwork, usableHosts, alignUp } = window.IPv4;

  const simIp = document.getElementById('sim-ip');
  const simCidr = document.getElementById('sim-cidr');
  const simCidrVal = document.getElementById('sim-cidrValue');
  const simRun = document.getElementById('sim-run');
  const simSubBits = document.getElementById('sim-sub-bits');
  const simSubnets = document.getElementById('sim-subnets');
  const simVlsmHosts = document.getElementById('sim-vlsm-hosts');
  const simRows = document.getElementById('sim-rows');
  const simAlert = document.getElementById('sim-alert');
  const simSummary = document.getElementById('sim-summary');
  const flsmControls = document.getElementById('flsm-controls');
  const vlsmControls = document.getElementById('vlsm-controls');
  const subnetGrid = document.querySelector('.subnet-grid');

  if (!simIp) return; // pestaña no presente

  function setDisabled(input, disabled) {
    if (!input) return;
    input.disabled = disabled;
    const label = input.closest('label');
    if (label) label.classList.toggle('disabled-field', disabled);
  }

  function updateModeUI(){
    const mode = document.querySelector('input[name="sim-mode"]:checked').value;
    const isFlsm = mode === 'flsm';
    if (flsmControls) flsmControls.hidden = !isFlsm;
    if (vlsmControls) vlsmControls.hidden = isFlsm;
    setDisabled(simSubBits, !isFlsm);
    setDisabled(simSubnets, !isFlsm);
    setDisabled(simVlsmHosts, isFlsm);
    if (subnetGrid) subnetGrid.dataset.mode = mode;
  }
  document.querySelectorAll('input[name="sim-mode"]').forEach(r => { r.addEventListener('change', updateModeUI); });
  updateModeUI();

  simCidr.addEventListener('input', () => { simCidrVal.textContent = `/${simCidr.value}`; syncFlsmControls('cidr'); });

  // Habilitar/Deshabilitar botón Simular según validez de IP base
  function refreshSimRunState(){
    if (!simRun) return;
    const parsed = parseOctets(simIp.value);
    const valid = !!parsed;
    simRun.disabled = !valid;
    simRun.title = valid ? '' : 'Introduce una IP base válida para simular';
  }

  function renderRows(rows){
    simRows.innerHTML=''; let idx=1;
    for (const r of rows){
      const tr=document.createElement('tr');
      const cols=[ idx++, r.name || `Subred ${idx-1}`, `/${r.prefix}`, IPv4.maskToStrFromCidr(r.prefix), octetsToStr(fromUint32(r.net)), r.first!=null?octetsToStr(fromUint32(r.first)):'—', r.last!=null?octetsToStr(fromUint32(r.last)):'—', octetsToStr(fromUint32(r.bc)), r.usable, r.req!=null?r.req:'' ];
      cols.forEach(c=>{ const td=document.createElement('td'); td.textContent=String(c); tr.appendChild(td); }); simRows.appendChild(tr);
    }
  }

  function simulateFLSM(baseIpO, basePrefix, subBits, wantSubnets){
    const maxSubBits = clamp(32-basePrefix, 0, 32);
    if (subBits==null && wantSubnets!=null){ const n=Math.max(1, Number(wantSubnets)|0); const k=Math.ceil(Math.log2(n)); subBits=k; }
    subBits = clamp(Number(subBits)|0, 0, maxSubBits);
    const newPrefix = basePrefix + subBits;
    const count = 2 ** subBits;
    const block = blockSizeFromPrefix(newPrefix);
    const { netU } = normalizeNetwork(baseIpO, basePrefix);
    const rows=[];
    for (let i=0;i<count;i++){ const net=(netU + i*block)>>>0; const bc=(net + block - 1)>>>0; const first=newPrefix>=31?null:(net+1)>>>0; const last=newPrefix>=31?null:(bc-1)>>>0; const usable=usableHosts(newPrefix); rows.push({ prefix:newPrefix, net, bc, first, last, usable }); }
    const requested = Number(simSubnets.value) || 0; const libres = Math.max(0, count - requested); const reqInfo = requested?` — Solicitadas: ${requested} — Libres: ${libres}`:'';
    simSummary.textContent = `Generadas: ${count} — Prefijo: /${newPrefix} — Hosts/subred: ${usableHosts(newPrefix)}${reqInfo}`;
    simAlert.textContent=''; simAlert.className='sim-alert'; renderRows(rows);
  }

  // Calcula el prefijo mínimo para un requisito de hosts "utilizables".
  // Siempre reserva 2 direcciones adicionales (red y broadcast).
  // Se evita devolver /31 o /32 para solicitudes de "hosts" de VLSM,
  // pues esos prefijos no tienen el par red/broadcast tradicional.
  function hostsToPrefix(h){
    h = Number(h) | 0;
    if (h <= 0) return null;
    const need = h + 2; // hosts solicitados + red + broadcast
    const p = 32 - Math.ceil(Math.log2(need));
    return clamp(p, 0, 30); // limitar a /30 como máximo cuando se dimensiona por hosts
  }

  function simulateVLSM(baseIpO, basePrefix, reqs){
    const base = normalizeNetwork(baseIpO, basePrefix); const baseSize = blockSizeFromPrefix(basePrefix); const baseEnd=(base.netU + baseSize)>>>0;
    const parsed = (reqs||'').split(/[\s,;]+/).map(s=>s.trim()).filter(Boolean).map(Number).filter(n=>Number.isFinite(n)&&n>0).sort((a,b)=>b-a);
    if (parsed.length===0){ simAlert.textContent='Ingresa una lista válida de hosts por subred.'; simAlert.className='sim-alert err'; simRows.innerHTML=''; simSummary.textContent=''; return; }
    const rows=[]; let cursor=base.netU;
    for (const req of parsed){ const p = hostsToPrefix(req); if (p==null || p<basePrefix){ simAlert.textContent=`Solicitud ${req} no válida dentro de /${basePrefix}.`; simAlert.className='sim-alert err'; simRows.innerHTML=''; simSummary.textContent=''; return; } const block = blockSizeFromPrefix(p); const net = alignUp(cursor, base.netU, block); const next=(net+block)>>>0; if (next>baseEnd){ simAlert.textContent='Las subredes solicitadas no caben dentro de la red base.'; simAlert.className='sim-alert err'; simRows.innerHTML=''; simSummary.textContent=''; return; } const bc=(next-1)>>>0; const first=p>=31?null:(net+1)>>>0; const last=p>=31?null:(bc-1)>>>0; const usable=usableHosts(p); rows.push({ prefix:p, net, bc, first, last, usable, req }); cursor=next; }
    const used = cursor - base.netU; const free = (baseEnd - base.netU) - used; const freeMsg = free>0?` — Libre: ${free} direcciones`:'';
    simSummary.textContent = `Asignadas: ${rows.length} subred(es) dentro de ${octetsToStr(fromUint32(base.netU))}/${basePrefix}${freeMsg}`;
    simAlert.textContent=''; simAlert.className='sim-alert'; renderRows(rows);
  }

  function runSimulator(){
    const baseIpO = parseOctets(simIp.value); const basePrefix = clamp(Number(simCidr.value)|0,0,32); simCidrVal.textContent = `/${basePrefix}`;
    if (!baseIpO){ simAlert.textContent='IP base inválida.'; simAlert.className='sim-alert err'; simRows.innerHTML=''; simSummary.textContent=''; return; }
    const base = normalizeNetwork(baseIpO, basePrefix); simIp.value = octetsToStr(fromUint32(base.netU));
    const mode = document.querySelector('input[name="sim-mode"]:checked').value;
    if (mode==='flsm'){ const bits = Number(simSubBits.value); const subs = Number(simSubnets.value); simulateFLSM(baseIpO, basePrefix, Number.isFinite(bits)?bits:null, Number.isFinite(subs)?subs:null); }
    else { simulateVLSM(baseIpO, basePrefix, simVlsmHosts.value||''); }
  }

  // Sincronización FLSM
  function syncFlsmControls(source){
    const basePrefix = clamp(Number(simCidr.value)|0,0,32); const maxSubBits = Math.max(0, 32-basePrefix);
    let bits = Number(simSubBits.value); let subs = Number(simSubnets.value);
    if (source==='bits'){ if (!Number.isFinite(bits)) bits=0; bits=Math.min(Math.max(Math.floor(bits),0),maxSubBits); subs = 2 ** bits; }
    else if (source==='subs'){ if (!Number.isFinite(subs)||subs<1) subs=1; bits = Math.ceil(Math.log2(subs)); bits = Math.min(Math.max(bits,0),maxSubBits); }
    else { if (!Number.isFinite(bits)) bits=0; bits=Math.min(Math.max(Math.floor(bits),0),maxSubBits); }
    if (Number(simSubBits.value)!==bits) simSubBits.value=String(bits);
    if (source==='bits' && Number(simSubnets.value)!==2**bits) simSubnets.value=String(2**bits);
  }

  // Sanitización de entradas
  IPv4.attachIpSanitizer(simIp);
  // Normaliza IP base al salir o Enter, no mientras se escribe
  simIp.addEventListener('blur', ()=>{
    const ipO = parseOctets(simIp.value);
    if (!ipO) return;
    const basePrefix = clamp(Number(simCidr.value)|0,0,32);
    const base = normalizeNetwork(ipO, basePrefix);
    simIp.value = octetsToStr(fromUint32(base.netU));
    refreshSimRunState();
  });
  simIp.addEventListener('keydown', (e)=>{
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const ipO = parseOctets(simIp.value);
    if (!ipO) return;
    const basePrefix = clamp(Number(simCidr.value)|0,0,32);
    const base = normalizeNetwork(ipO, basePrefix);
    simIp.value = octetsToStr(fromUint32(base.netU));
    refreshSimRunState();
  });
  // Mientras escribe, el botón se deshabilita si no es una IP completa
  simIp.addEventListener('input', refreshSimRunState);
  // Inicializa estado del botón al cargar
  refreshSimRunState();
  if (simVlsmHosts) simVlsmHosts.addEventListener('input', ()=>{ simVlsmHosts.value = simVlsmHosts.value.replace(/[^0-9,;\s]/g,''); });
  if (simSubBits) simSubBits.addEventListener('input', ()=>{ const basePrefix = clamp(Number(simCidr.value)|0,0,32); const maxSubBits = Math.max(0,32-basePrefix); let v=Math.floor(Number(simSubBits.value)||0); v = Math.min(Math.max(v,0),maxSubBits); simSubBits.value=String(v); });
  if (simSubnets) simSubnets.addEventListener('input', ()=>{ let v=Math.floor(Number(simSubnets.value)||1); v = Math.max(1,v); simSubnets.value=String(v); });

  simSubBits.addEventListener('input', ()=>syncFlsmControls('bits'));
  simSubnets.addEventListener('input', ()=>syncFlsmControls('subs'));
  if (simRun) simRun.addEventListener('click', runSimulator);

  // Defaults
  simIp.value='192.168.0.0'; simCidr.value='24'; simCidrVal.textContent='/24';
})();
