// utils.js — Funciones comunes IPv4 y sanitización
(function (w) {
  const U = {};

  U.clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  U.parseOctets = (str) => {
    if (!str) return null;
    const parts = String(str).trim().split('.').map(s => s.trim()).filter(Boolean);
    if (parts.length !== 4) return null;
    const nums = parts.map(p => Number(p));
    if (nums.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return null;
    return nums;
  };
  U.octetsToStr = (o) => o.join('.');
  U.toUint32 = (o) => (((o[0] << 24) >>> 0) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
  U.fromUint32 = (u) => [ (u>>>24)&255, (u>>>16)&255, (u>>>8)&255, u&255 ];
  U.maskFromCidr = (c) => { c = U.clamp(Number(c)|0,0,32); const u = c===0?0: (0xffffffff << (32-c))>>>0; return U.fromUint32(u); };
  U.cidrFromMask = (m) => { const u = U.toUint32(m); if (u===0) return 0; const inv=(~u)>>>0; if (((inv+1)&inv)!==0) return -1; let c=0,x=u; while(x){c+=x&1; x>>>=1;} return c; };
  U.ipClass = (o) => o[0]<=127?'A':o[0]<=191?'B':o[0]<=223?'C':o[0]<=239?'D (Multicast)':'E (Experimental)';
  U.isPrivate = (o) => o[0]===10 || (o[0]===172 && o[1]>=16 && o[1]<=31) || (o[0]===192 && o[1]===168);
  U.network = (ipU, maskU) => (ipU & maskU) >>> 0;
  U.broadcast = (netU, maskU) => (netU | ((~maskU)>>>0)) >>> 0;
  U.firstHost = (netU, cidr) => cidr>=31?null: (netU+1)>>>0;
  U.lastHost = (bcU, cidr) => cidr>=31?null: (bcU-1)>>>0;
  U.usableHosts = (cidr) => cidr===31?2: cidr===32?1: Math.max(0, 2**(32-cidr)-2);
  U.bits32ToArray = (u) => { const a=[]; for(let i=31;i>=0;i--) a.push(((u>>>i)&1)?'1':'0'); return a; };
  U.maskToStrFromCidr = (c) => U.octetsToStr(U.maskFromCidr(c));
  U.blockSizeFromPrefix = (p) => 2 ** (32 - p);
  U.alignUp = (u, base, block) => { const off=(u-base)>>>0; const rem=off%block; return rem===0?u:(u+(block-rem))>>>0; };
  U.normalizeNetwork = (ipO, cidr) => { const ipU = U.toUint32(ipO); const maskU = U.toUint32(U.maskFromCidr(cidr)); const netU = U.network(ipU, maskU); const bcU = U.broadcast(netU, maskU); return { ipU, maskU, netU, bcU }; };

  // Sanitización
  // Sanitiza permitiendo teclear cómodamente: deja puntos finales y no clampa en input
  U.sanitizeIpString = (raw) => {
    if (!raw) return '';
    let s = String(raw).replace(/,/g, '.').replace(/[^0-9.]/g, '');
    // máximo 3 puntos
    const parts = s.split('.');
    const kept = [];
    for (let i=0;i<parts.length && kept.length<4;i++) {
      kept.push(parts[i].slice(0,3));
    }
    // Si el usuario estaba escribiendo un punto al final, mantenlo
    const endsWithDot = s.endsWith('.') && kept.length < 4;
    return kept.join('.') + (endsWithDot ? '.' : '');
  };
  U.attachIpSanitizer = (el, opts={}) => {
    if (!el) return;
    const { requireValidMask=false } = opts;
    el.addEventListener('input', () => {
      const after = U.sanitizeIpString(el.value);
      if (after !== el.value) el.value = after;
      const parsed = U.parseOctets(el.value);
      // En input, permitimos parciales (menos de 4 octetos), no marcamos error por eso
      if (!parsed && el.value.includes('.')) { el.classList.remove('invalid'); return; }
      if (!parsed) el.classList.add('invalid');
      else if (requireValidMask) el.classList.toggle('invalid', U.cidrFromMask(parsed) < 0);
      else el.classList.remove('invalid');
    });
    el.addEventListener('blur', () => { const parsed = U.parseOctets(el.value); if (!parsed) el.classList.add('invalid'); });
  };

  w.IPv4 = U;
})(window);
