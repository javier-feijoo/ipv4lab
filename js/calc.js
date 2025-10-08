// calc.js — sección Explorar (calculadora IPv4 básica)
(function(){
  const { parseOctets, maskFromCidr, cidrFromMask, clamp, toUint32, fromUint32, octetsToStr, network, broadcast, firstHost, lastHost, usableHosts, bits32ToArray, ipClass, isPrivate } = window.IPv4;

  const ipInput = document.querySelector('#ip');
  const maskInput = document.querySelector('#mask');
  const cidrRange = document.querySelector('#cidr');
  const cidrOut = document.querySelector('#cidrValue');

  const bitsIp = document.querySelector('#bits-ip');
  const bitsMask = document.querySelector('#bits-mask');
  const bitsNet = document.querySelector('#bits-net');
  const bitsBc = document.querySelector('#bits-bc');

  const outNet = document.querySelector('#net');
  const outBc = document.querySelector('#bc');
  const outFirst = document.querySelector('#first');
  const outLast = document.querySelector('#last');
  const outHosts = document.querySelector('#hosts');
  const outPrefix = document.querySelector('#prefix');
  const outClass = document.querySelector('#class');
  const outPrivate = document.querySelector('#private');
  const explain = document.querySelector('#explain');

  function renderBits(container, u, cidr, kind){
    container.innerHTML='';
    container.classList.remove('row-ip','row-mask','row-net','row-bc'); if (kind) container.classList.add(`row-${kind}`);
    const bits = bits32ToArray(u);
    bits.forEach((b, idx)=>{
      const span=document.createElement('div'); span.textContent=b; span.className='bit ' + (idx<cidr?'net':'host'); container.appendChild(span);
      if (idx%8===7 && idx!==31){ const dot=document.createElement('div'); dot.textContent='.'; dot.className='dot'; container.appendChild(dot); }
    });
  }

  let maskSource='cidr';
  function updateAll(){
    const ipO = parseOctets(ipInput.value);
    let cidr = Number(cidrRange.value)|0;
    if (maskSource==='mask'){
      const mO = parseOctets(maskInput.value); if (mO){ const c = cidrFromMask(mO); if (c>=0) cidr = c; }
    }
    cidr = clamp(cidr,0,32); cidrOut.textContent = `/${cidr}`;
    const maskO = maskFromCidr(cidr);
    if (maskSource==='cidr') maskInput.value = octetsToStr(maskO);
    const maskU = toUint32(maskO);
    renderBits(bitsMask, maskU, cidr, 'mask');
    if (!ipO){ bitsIp.innerHTML = bitsNet.innerHTML = bitsBc.innerHTML = ''; outNet.textContent=outBc.textContent=outFirst.textContent=outLast.textContent=''; outHosts.textContent=outPrefix.textContent=outClass.textContent=outPrivate.textContent=''; explain.textContent='Introduce una IP válida.'; return; }
    const ipU = toUint32(ipO); const netU = network(ipU, maskU); const bcU = broadcast(netU, maskU);
    const fU = firstHost(netU, cidr); const lU = lastHost(bcU, cidr);
    renderBits(bitsIp, ipU, cidr, 'ip'); renderBits(bitsNet, netU, cidr, 'net'); renderBits(bitsBc, bcU, cidr, 'bc');
    outNet.textContent = octetsToStr(fromUint32(netU));
    outBc.textContent = octetsToStr(fromUint32(bcU));
    outFirst.textContent = fU==null? '—' : octetsToStr(fromUint32(fU));
    outLast.textContent  = lU==null? '—' : octetsToStr(fromUint32(lU));
    outHosts.textContent = String(usableHosts(cidr)); outPrefix.textContent = `/${cidr}`;
    outClass.textContent = ipClass(ipO); outPrivate.textContent = isPrivate(ipO)?'Sí':'No';
    explain.innerHTML = [
      `Red = <code>${octetsToStr(ipO)}</code> AND <code>${octetsToStr(maskO)}</code> = <code>${octetsToStr(fromUint32(netU))}</code>`,
      `Broadcast = <code>${octetsToStr(fromUint32(netU))}</code> OR <code>${octetsToStr(fromUint32((~maskU)>>>0))}</code> = <code>${octetsToStr(fromUint32(bcU))}</code>`,
      cidr>=31? 'Para /31 y /32 no hay rango tradicional de hosts.' : `Hosts utilizables = 2^(32 - ${cidr}) - 2 = ${usableHosts(cidr)}`
    ].join('<br>');
  }

  // Eventos
  ipInput.addEventListener('input', updateAll);
  maskInput.addEventListener('input', ()=>{ maskSource='mask'; updateAll(); });
  cidrRange.addEventListener('input', ()=>{ maskSource='cidr'; cidrOut.textContent = `/${cidrRange.value}`; updateAll(); });

  // Sanitización
  IPv4.attachIpSanitizer(ipInput);
  IPv4.attachIpSanitizer(maskInput, { requireValidMask: true });

  // Defaults
  ipInput.value='192.168.1.10'; cidrRange.value='24'; maskSource='cidr'; updateAll();
})();

