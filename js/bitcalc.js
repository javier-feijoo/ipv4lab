// bitcalc.js — Calculadora interactiva por bits (pestaña Calculadora)
(function(){
  const { parseOctets, clamp, maskFromCidr, toUint32, fromUint32, octetsToStr, normalizeNetwork, broadcast } = window.IPv4;
  const bitsSimIp = document.getElementById('bits-sim-ip');
  const bitsCidr = document.getElementById('bits-cidr');
  const bitsCidrVal = document.getElementById('bits-cidrValue');
  const bitsLock = document.getElementById('bits-lock');
  const bitsGrid = document.getElementById('bits-sim-grid');
  const bitsMaskGrid = document.getElementById('bits-sim-mask');
  const ipOctetsEl = document.getElementById('bits-ip-octets');
  const maskOctetsEl = document.getElementById('bits-mask-octets');
  const bitsReset0 = document.getElementById('bits-reset0');
  const bitsReset1 = document.getElementById('bits-reset1');
  const bitsRandom = document.getElementById('bits-random');
  const bitsResIp = document.getElementById('bits-res-ip');
  const bitsResNet = document.getElementById('bits-res-net');
  const bitsResBc = document.getElementById('bits-res-bc');
  const bitsResPrefix = document.getElementById('bits-res-prefix');

  if (!bitsSimIp) return; // pestaña no presente

  let bitsHostU = 0;

  function renderOctets(el, u){
    const o = window.IPv4.fromUint32(u);
    el.innerHTML = '';
    for (let i=0;i<4;i++){
      const span = document.createElement('span'); span.className='octet'; span.textContent=String(o[i]); el.appendChild(span);
      if (i<3){ const sep=document.createElement('span'); sep.className='sep'; sep.textContent='.'; el.appendChild(sep); }
    }
  }

  function rebuildBitsGrid(netU, maskU, cidr){
    bitsGrid.innerHTML='';
    const ipU = (netU | bitsHostU)>>>0;
    for (let idx=0; idx<32; idx++){
      const bitPos = 31-idx; const on = ((ipU>>>bitPos)&1)===1; const isNetBit = idx<cidr;
      const el = document.createElement('div'); el.className = 'bit ' + (isNetBit?'locked':'editable') + (on?' on':''); el.textContent = on?'1':'0';
      if (!isNetBit || !bitsLock.checked){ el.addEventListener('click', ()=>{
        const hostMask = (~maskU)>>>0; const isHostPos = ((hostMask>>>bitPos)&1)===1; if (bitsLock.checked && !isHostPos) return; const bitFlag = 1<<bitPos; if (isHostPos){ bitsHostU = (bitsHostU ^ bitFlag) & hostMask; } else { const newIpU = ipU ^ bitFlag; bitsHostU = (newIpU & hostMask)>>>0; } updateBitsSim();
      }); }
      bitsGrid.appendChild(el);
      if (idx%8===7 && idx!==31){ const dot=document.createElement('div'); dot.className='dot'; dot.textContent='.'; bitsGrid.appendChild(dot); }
    }
  }

  function rebuildMaskGrid(cidr){
    if (!bitsMaskGrid) return;
    bitsMaskGrid.innerHTML='';
    for (let idx=0; idx<32; idx++){
      const isNetBit = idx<cidr; const el=document.createElement('div');
      el.className = 'bit editable ' + (isNetBit?'net':'host'); el.textContent = isNetBit?'1':'0';
      el.addEventListener('click', ()=>{
        // clic en un bit fija el límite: si clicas dentro de red, reduce a idx; si clicas en host, amplía a idx+1
        let newCidr = (idx < cidr) ? idx : (idx+1);
        newCidr = Math.max(0, Math.min(32, newCidr));
        bitsCidr.value = String(newCidr);
        updateBitsSim();
      });
      bitsMaskGrid.appendChild(el);
      if (idx%8===7 && idx!==31){ const dot=document.createElement('div'); dot.className='dot'; dot.textContent='.'; bitsMaskGrid.appendChild(dot); }
    }
  }

  function updateBitsSim(){
    const ipO = parseOctets(bitsSimIp.value); const cidr = clamp(Number(bitsCidr.value)|0,0,32); const maskO = maskFromCidr(cidr); const maskU = toUint32(maskO); bitsCidrVal.textContent = `/${cidr}`;
    if (!ipO){ bitsResIp.textContent=bitsResNet.textContent=bitsResBc.textContent=bitsResPrefix.textContent=''; bitsGrid.innerHTML=''; return; }
    const base = normalizeNetwork(ipO, cidr); bitsSimIp.value = octetsToStr(fromUint32(base.netU)); const hostMask=(~maskU)>>>0; bitsHostU = (bitsHostU & hostMask)>>>0; const ipU=(base.netU | bitsHostU)>>>0; const bcU = broadcast(base.netU, maskU); rebuildBitsGrid(base.netU, maskU, cidr); rebuildMaskGrid(cidr); bitsResIp.textContent=octetsToStr(fromUint32(ipU)); bitsResNet.textContent=octetsToStr(fromUint32(base.netU)); bitsResBc.textContent=octetsToStr(fromUint32(bcU)); bitsResPrefix.textContent=`/${cidr}`; renderOctets(ipOctetsEl, ipU); renderOctets(maskOctetsEl, maskU);
  }

  bitsCidr.addEventListener('input', updateBitsSim);
  bitsSimIp.addEventListener('input', ()=>{ bitsHostU=0; updateBitsSim(); });
  bitsLock.addEventListener('change', updateBitsSim);
  bitsReset0.addEventListener('click', ()=>{ bitsHostU=0; updateBitsSim(); });
  bitsReset1.addEventListener('click', ()=>{ const cidr=clamp(Number(bitsCidr.value)|0,0,32); const hostMask=(~toUint32(maskFromCidr(cidr)))>>>0; bitsHostU=hostMask; updateBitsSim(); });
  bitsRandom.addEventListener('click', ()=>{ const cidr=clamp(Number(bitsCidr.value)|0,0,32); const hostMask=(~toUint32(maskFromCidr(cidr)))>>>0; const r=(Math.floor(Math.random()*0xffffffff))>>>0; bitsHostU = r & hostMask; updateBitsSim(); });

  IPv4.attachIpSanitizer(bitsSimIp);
  bitsSimIp.value='192.168.1.0'; bitsCidr.value='24'; updateBitsSim();
})();
