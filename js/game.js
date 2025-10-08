// game.js — juego tipo quiz con efectos, saltos y rachas
(function(){
  const startBtn = document.getElementById('startGame');
  if (!startBtn) return;
  const stopBtn = document.getElementById('stopGame');
  const skipBtn = document.getElementById('skipGame');
  const questionEl = document.getElementById('question');
  const answerEl = document.getElementById('answer');
  const feedbackEl = document.getElementById('feedback');
  const timeLeftEl = document.getElementById('timeLeft');
  const scoreEl = document.getElementById('score');
  const bestScoreEl = document.getElementById('bestScore');
  const streakEl = document.getElementById('streak');
  const bestStreakEl = document.getElementById('bestStreak');
  const gameCard = document.querySelector('.card.game');
  const timeFill = document.getElementById('timeFill');
  const timeBig = document.getElementById('timeBig');
  const durationSel = document.getElementById('gameDuration'); // opcional (legacy)
  const durationChips = document.getElementById('durationChips');
  function getSelectedMinutes(){
    const activeChip = durationChips ? durationChips.querySelector('.chip-duration.active') : null;
    if (activeChip) return Number(activeChip.dataset.minutes)||5;
    return Number(durationSel ? durationSel.value : 5) || 5;
  }
  const downloadBtn = document.getElementById('downloadLog');

  const { toUint32, maskFromCidr, network, broadcast, octetsToStr,
          firstHost, lastHost, usableHosts, maskToStrFromCidr, fromUint32,
          ipClass, isPrivate } = window.IPv4;

  let timerId = null, uiTimerId = null, timeLeft = 60, totalTime = 60, score = 0, current = null;
  let streak = 0, bestStreak = Number(localStorage.getItem('ipv4lab.bestStreak')||'0');
  let correctCount = 0, wrongCount = 0, skipCount = 0;
  if (bestStreakEl) bestStreakEl.textContent = String(bestStreak);
  if (bestScoreEl) bestScoreEl.textContent = localStorage.getItem('ipv4lab.best') || '0';
  let sessionLog = [];

  const randInt = (min,max)=> Math.floor(Math.random()*(max-min+1))+min;
  const randomIp = ()=> [randInt(1,223), randInt(0,255), randInt(0,255), randInt(0,255)];
  const norm = (s)=> s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  function nextQuestion(){
    const ipO = randomIp();
    const cidr = [8, 16, 24, randInt(20, 30)][randInt(0, 3)];
    const ipU = toUint32(ipO);
    const maskU = toUint32(maskFromCidr(cidr));
    const netU = network(ipU, maskU);
    const bcU = broadcast(netU, maskU);

    const types = [
      'net','bc','hosts','first','last',
      'maskFromPrefix','prefixFromMask','class','private',
      'wildcard','isNet','isBc','sameNet','blockSize',
      'validHost','subnetsFromBorrow'
    ];
    const type = types[randInt(0, types.length - 1)];
    let prompt = '', correct = '';

    if (type === 'net') { prompt = `IP ${octetsToStr(ipO)}/${cidr} → ¿Dirección de red?`; correct = octetsToStr(fromUint32(netU)); }
    else if (type === 'bc') { prompt = `IP ${octetsToStr(ipO)}/${cidr} → ¿Broadcast?`; correct = octetsToStr(fromUint32(bcU)); }
    else if (type === 'hosts') { prompt = `Prefijo /${cidr} → ¿Hosts utilizables?`; correct = String(usableHosts(cidr)); }
    else if (type === 'first') { prompt = `IP ${octetsToStr(ipO)}/${cidr} → ¿Primer host?`; const f = firstHost(netU, cidr); correct = f==null? '—' : octetsToStr(fromUint32(f)); }
    else if (type === 'last') { prompt = `IP ${octetsToStr(ipO)}/${cidr} → ¿Último host?`; const l = lastHost(bcU, cidr); correct = l==null? '—' : octetsToStr(fromUint32(l)); }
    else if (type === 'maskFromPrefix') { prompt = `Prefijo /${cidr} → ¿Máscara decimal?`; correct = maskToStrFromCidr(cidr); }
    else if (type === 'prefixFromMask') { const pc = [8,9,10,11,12,13,14,15,16,20,21,22,23,24,25,26,27,28,29,30][randInt(0,19)]; const maskStr = maskToStrFromCidr(pc); prompt = `Máscara ${maskStr} → ¿Prefijo CIDR?`; correct = String(pc); }
    else if (type === 'class') { prompt = `IP ${octetsToStr(ipO)} → ¿Clase (A/B/C/D/E)?`; correct = ipClass(ipO).charAt(0); }
    else if (type === 'private') { prompt = `IP ${octetsToStr(ipO)} → ¿Es privada? (sí/no)`; correct = isPrivate(ipO) ? 'si' : 'no'; }
    else if (type === 'wildcard') { prompt = `Prefijo /${cidr} → ¿Wildcard (máscara comodín)?`; const wcU = (~toUint32(maskFromCidr(cidr))) >>> 0; correct = octetsToStr(fromUint32(wcU)); }
    else if (type === 'isNet') { const ipStr = octetsToStr(ipO); prompt = `IP ${ipStr}/${cidr} → ¿Es dirección de red? (sí/no)`; correct = (toUint32(ipO) === netU) ? 'si' : 'no'; }
    else if (type === 'isBc') { const ipStr = octetsToStr(ipO); prompt = `IP ${ipStr}/${cidr} → ¿Es broadcast? (sí/no)`; correct = (toUint32(ipO) === bcU) ? 'si' : 'no'; }
    else if (type === 'sameNet') { const ip2 = randomIp(); const inSame = (toUint32(ip2) & toUint32(maskFromCidr(cidr))) === netU; prompt = `¿Misma subred con /${cidr}? ${octetsToStr(ipO)} y ${octetsToStr(ip2)} (sí/no)`; correct = inSame ? 'si' : 'no'; }
    else if (type === 'blockSize') { prompt = `Prefijo /${cidr} → ¿Tamaño de bloque (direcciones)?`; correct = String(2 ** (32 - cidr)); }
    else if (type === 'validHost') { const ipStr = octetsToStr(ipO); prompt = `IP ${ipStr}/${cidr} → ¿Es host utilizable? (sí/no)`; let ok; if (cidr <= 30) ok = toUint32(ipO) !== netU && toUint32(ipO) !== bcU; else if (cidr === 31) ok = true; else ok = true; correct = ok ? 'si' : 'no'; }
    else if (type === 'subnetsFromBorrow') { const maxBorrow = Math.max(0, 32 - cidr); const k = Math.max(1, Math.min(8, randInt(1, Math.max(1, maxBorrow)))); prompt = `Desde /${cidr}, con ${k} bit(s) prestados → ¿Subredes?`; correct = String(2 ** k); }

    current = { prompt, type, correct };
    questionEl.textContent = prompt;
    answerEl.value = '';
    feedbackEl.textContent = '';
    answerEl.focus();
  }

  function isCorrect(val, current){
    const v = norm(val);
    if (current.type === 'prefixFromMask') { const digits = v.replace(/[^0-9]/g, ''); return digits === current.correct; }
    if (current.type === 'private') { const sv = v.replace(/\s/g,''); return (sv==='si'||sv==='s'||sv==='yes'||sv==='true') ? current.correct==='si' : (sv==='no'||sv==='n'||sv==='false') ? current.correct==='no' : false; }
    if (current.type === 'class') { return v.charAt(0) === current.correct.toLowerCase(); }
    if (current.type === 'isNet' || current.type === 'isBc' || current.type === 'sameNet' || current.type === 'validHost') { const sv = v.replace(/\s/g,''); const yn = (sv==='si'||sv==='s'||sv==='yes'||sv==='true') ? 'si' : (sv==='no'||sv==='n'||sv==='false') ? 'no' : 'other'; return yn!=='other' && yn===current.correct; }
    return val.trim() === current.correct;
  }

  function startGame(){
    const minutes = getSelectedMinutes();
    totalTime = Math.max(60, Math.min(600, minutes*60));
    score=0; timeLeft=totalTime; streak=0; correctCount=0; wrongCount=0; skipCount=0; sessionLog = [];
    scoreEl.textContent='0'; timeLeftEl.textContent=String(timeLeft); if (streakEl) streakEl.textContent='0';
    startBtn.disabled=true; stopBtn.disabled=false; answerEl.disabled=false; if (skipBtn) skipBtn.disabled=false;
    if (downloadBtn) downloadBtn.disabled = true;
    if (timeFill) { timeFill.style.width = '100%'; if (timeFill.parentElement) timeFill.parentElement.classList.remove('low'); }
    nextQuestion();
    timerId=setInterval(()=>{ timeLeft--; timeLeftEl.textContent=String(timeLeft); if(timeLeft<=0) stopGame(); },1000);
    if (!uiTimerId) uiTimerId = setInterval(()=>{
      if (!timeFill) return; const pct = Math.max(0, Math.min(100, (timeLeft/60)*100)); timeFill.style.width = pct + '%';
      const bar = timeFill.parentElement; if (bar) { if (timeLeft<=10) bar.classList.add('low'); else bar.classList.remove('low'); }
      if (timeBig) timeBig.textContent = formatTime(timeLeft);
    }, 200);
  }
  function stopGame(){
    if(timerId) clearInterval(timerId); timerId=null; startBtn.disabled=false; stopBtn.disabled=true; answerEl.disabled=true; if (skipBtn) skipBtn.disabled=true;
    questionEl.textContent='Juego detenido.';
    feedbackEl.innerHTML = `Aciertos: <strong>${correctCount}</strong> — Fallos: <strong>${wrongCount}</strong> — Saltos: <strong>${skipCount}</strong> — Racha máx: <strong>${bestStreak}</strong>`;
    // Mejor puntuación por nivel (minutos)
    const minutes = Math.round(totalTime/60);
    const bestKey = `ipv4lab.best.${minutes}`;
    const prevBest = Number(localStorage.getItem(bestKey) || '0');
    if (score > prevBest) localStorage.setItem(bestKey, String(score));
    if (bestScoreEl) bestScoreEl.textContent = localStorage.getItem(bestKey) || '0';
    if (timeFill) timeFill.style.width = '0%'; if (uiTimerId) { clearInterval(uiTimerId); uiTimerId=null; }
    // Habilita descarga del log
    if (downloadBtn) {
      const txt = buildSessionText();
      const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      downloadBtn.dataset.url = url;
      downloadBtn.disabled = false;
      downloadBtn.onclick = () => { const a = document.createElement('a'); a.href = url; const ts = new Date().toISOString().replace(/[:.]/g,'-'); a.download = `ipv4lab-sesion-${minutes}min-${ts}.txt`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 1000); };
    }
    renderLeaderboard();
  }

  answerEl.addEventListener('keydown',(e)=>{
    if(e.key==='Escape' && !answerEl.disabled){ feedbackEl.textContent=''; answerEl.value=''; streak=0; if(streakEl) streakEl.textContent='0'; nextQuestion(); return; }
    if(e.key==='Enter' && !answerEl.disabled && current){
      const val=answerEl.value.trim(); if(!val) return;
      const ok = isCorrect(val,current);
      const tstamp = new Date().toISOString();
      if(ok){
        score+=1; correctCount+=1; streak+=1; if (streakEl) streakEl.textContent=String(streak);
        if (streak>bestStreak){ bestStreak=streak; localStorage.setItem('ipv4lab.bestStreak', String(bestStreak)); if(bestStreakEl) bestStreakEl.textContent=String(bestStreak); }
        scoreEl.textContent=String(score); feedbackEl.textContent='¡Correcto!'; feedbackEl.className='feedback ok';
        if (gameCard) { gameCard.classList.remove('effect-err'); gameCard.classList.add('effect-ok'); setTimeout(()=>gameCard.classList.remove('effect-ok'), 600); }
        answerEl.classList.remove('answer-err'); answerEl.classList.add('answer-ok'); setTimeout(()=>answerEl.classList.remove('answer-ok'), 600);
        sessionLog.push({t:tstamp, prompt: current.prompt, correct: current.correct, answer: val, result:'OK'});
      } else {
        wrongCount+=1; streak=0; if (streakEl) streakEl.textContent='0';
        feedbackEl.textContent=`Incorrecto. Correcto: ${current.correct}`; feedbackEl.className='feedback err';
        if (gameCard) { gameCard.classList.remove('effect-ok'); gameCard.classList.add('effect-err'); setTimeout(()=>gameCard.classList.remove('effect-err'), 450); }
        answerEl.classList.remove('answer-ok'); answerEl.classList.add('answer-err'); setTimeout(()=>answerEl.classList.remove('answer-err'), 600);
        sessionLog.push({t:tstamp, prompt: current.prompt, correct: current.correct, answer: val, result:'X'});
      }
      nextQuestion();
    }
  });
  if (skipBtn) skipBtn.addEventListener('click', ()=>{ skipCount+=1; streak=0; if(streakEl) streakEl.textContent='0'; feedbackEl.textContent=''; if (current) sessionLog.push({t:new Date().toISOString(), prompt: current.prompt, correct: current.correct, answer: '', result:'-' }); answerEl.value=''; nextQuestion(); });
  startBtn.addEventListener('click', startGame); stopBtn.addEventListener('click', stopGame);
  function refreshBest(){ const minutes = getSelectedMinutes(); const bestKey = `ipv4lab.best.${minutes}`; if (bestScoreEl) bestScoreEl.textContent = localStorage.getItem(bestKey) || '0'; }
  if (durationSel) durationSel.addEventListener('change', refreshBest);
  if (durationChips) durationChips.addEventListener('click', (e)=>{ const btn = e.target.closest('.chip-duration'); if (!btn) return; durationChips.querySelectorAll('.chip-duration').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); refreshBest(); if (timeBig) timeBig.textContent = formatTime((Number(btn.dataset.minutes)||5)*60); });
  refreshBest();

  function buildSessionText(){
    const minutes = Math.round(totalTime/60);
    const lines = [];
    lines.push(`IPv4 Lab — Sesión de ${minutes} minuto(s)`);
    lines.push(`Fecha: ${new Date().toLocaleString()}`);
    lines.push(`Duración: ${minutes} min  |  Puntos: ${score}  |  Aciertos: ${correctCount}  |  Fallos: ${wrongCount}  |  Saltos: ${skipCount}  |  Racha máx: ${bestStreak}`);
    lines.push('');
    lines.push('Detalle (t = hora, R=OK/X/-):');
    sessionLog.forEach((e,i)=>{ lines.push(`${String(i+1).padStart(2,'0')}. [${e.result}] ${e.t}  Q: ${e.prompt}  |  Resp: ${e.answer || '(salto)'}  |  Correcta: ${e.correct}`); });
    return lines.join('\n');
  }

  function formatTime(sec){ sec = Math.max(0, sec|0); const m = Math.floor(sec/60); const s = sec%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }

  // Leaderboard simple por duraciones comunes
  const leaderboardEl = document.getElementById('leaderboardList');
  function renderLeaderboard(){ if (!leaderboardEl) return; const durations=[1,3,5,10]; const items=[]; durations.forEach(d=>{ const v = localStorage.getItem(`ipv4lab.best.${d}`)||'0'; items.push(`<li><span>${d} min</span>: <strong>${v}</strong></li>`); }); const bestStk = localStorage.getItem('ipv4lab.bestStreak')||'0'; items.push(`<li><span>Mejor racha</span>: <strong>${bestStk}</strong></li>`); leaderboardEl.innerHTML = items.join(''); }
  renderLeaderboard();
})();
