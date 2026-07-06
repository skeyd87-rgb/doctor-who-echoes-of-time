/* ============================== 08 UI ============================== */
const $=id=>document.getElementById(id);
const UI={
  hud:$('hud'), xh:$('xh'), prompt:$('prompt'), banter:$('banter'), obj:$('obj-text'),
  toastEl:$('toast'), gauge:$('gauge').getContext('2d'), map:$('minimap').getContext('2d'),
  dlg:$('dlg'), dlgName:$('dlg-name'), dlgText:$('dlg-text'), dlgOpts:$('dlg-opts'), dlgMore:$('dlg-more'), dlgRiley:$('dlg-riley'),
  travel:$('travel'), dests:$('dests'), vig:$('vig'), goldvig:$('goldvig'), vortex:$('vortex'), fade:$('fade'),
  zonechip:$('zonechip'), frags:document.querySelectorAll('.frag'),
};

/* ---------- banter / subtitles ---------- */
let _banterQ=[], _banterT=0;
function say(name, text, dur=4, style='riley'){
  _banterQ.push({name,text,dur,style});
}
function updateBanter(dt){
  if(_banterT>0){ _banterT-=dt; if(_banterT<=0) UI.banter.innerHTML=''; return; }
  if(_banterQ.length){
    const b=_banterQ.shift();
    const cls=b.style==='gold'?'gold':'';
    UI.banter.innerHTML=`<b class="${cls}">${b.name.toUpperCase()}</b> &nbsp;${b.text}`;
    _banterT=b.dur;
  }
}

/* ---------- toast ---------- */
let _toastT=0;
function toastMsg(t1,t2){
  UI.toastEl.querySelector('.t1').textContent=t1;
  UI.toastEl.querySelector('.t2').textContent=t2||'';
  UI.toastEl.style.opacity=1; _toastT=3.4;
}
function updateToast(dt){ if(_toastT>0){ _toastT-=dt; if(_toastT<=0) UI.toastEl.style.opacity=0; } }

/* ---------- objective / prompt / frags ---------- */
let _lastObj='';
function updateObjective(){
  const o=currentObjective();
  if(o!==_lastObj){ _lastObj=o; UI.obj.textContent=o; }
}
function setPrompt(html){
  if(html){ UI.prompt.innerHTML=html; UI.prompt.classList.remove('hidden'); UI.xh.classList.add('big'); }
  else { UI.prompt.classList.add('hidden'); UI.xh.classList.remove('big'); }
}
function updateFrags(){ UI.frags.forEach((f,i)=>f.classList.toggle('got', i<G.fragments)); }

/* ---------- The Silence: tally of sightings + forget flash ---------- */
const _sil={ marks:0, el:document.getElementById('siltally'), m:document.getElementById('siltally-marks'), fvig:document.getElementById('forgetvig') };
function onSilenceSeen(){
  _sil.marks++;
  const g=Math.floor(_sil.marks/5), r=_sil.marks%5;
  _sil.m.textContent = '卌 '.repeat(g) + '|'.repeat(r);
  A.blip(1600,0.03,0.04,'sine');
}
function onForget(){
  _sil.fvig.style.transition='none'; _sil.fvig.style.opacity='0.92';
  setTimeout(()=>{ _sil.fvig.style.transition='opacity 1.4s'; _sil.fvig.style.opacity='0'; },70);
}
function updateSilTally(){
  const show = G.state==='play' && G.zone && G.zone.id==='silence';
  _sil.el.classList.toggle('hidden', !show);
}

/* ---------- health gauge ---------- */
function drawGauge(t){
  const c=UI.gauge, W=208, cx=W/2, cy=W/2, r=86;
  c.clearRect(0,0,W,W);
  c.lineWidth=13; c.lineCap='round';
  c.strokeStyle='rgba(60,55,30,.55)';
  c.beginPath(); c.arc(cx,cy,r,PI*0.75,PI*2.25); c.stroke();
  const k=clamp(G.hp/G.maxhp,0,1);
  if(k>0){
    const grad=c.createLinearGradient(0,0,W,W);
    grad.addColorStop(0,'#ffe9a8'); grad.addColorStop(1,'#d4af37');
    c.strokeStyle=grad;
    c.shadowColor='rgba(212,175,55,.8)'; c.shadowBlur=k<0.3?14+Math.sin(t*8)*6:10;
    c.beginPath(); c.arc(cx,cy,r,PI*0.75, PI*0.75+k*PI*1.5); c.stroke();
    c.shadowBlur=0;
  }
  c.fillStyle='#e8dcb0'; c.font='700 30px Segoe UI'; c.textAlign='center'; c.textBaseline='middle';
  c.fillText(Math.ceil(G.hp), cx, cy-6);
  c.font='400 11px Segoe UI'; c.fillStyle='#9a8d60'; c.fillText('/ '+G.maxhp, cx, cy+16);
}

/* ---------- minimap ---------- */
function drawMinimap(){
  const c=UI.map, W=296, cx=W/2, cy=W/2, R=W/2-8, range=46;
  c.clearRect(0,0,W,W);
  c.save(); c.beginPath(); c.arc(cx,cy,R,0,TAU); c.clip();
  c.fillStyle='rgba(10,16,28,.30)'; c.fillRect(0,0,W,W);
  const Z=G.zone; if(!Z){c.restore();return;}
  const pp=G.player.root.position, yaw=G.yaw;
  const put=(x,z)=>{ const dx=x-pp.x, dz=z-pp.z;
    const rx=dx*Math.cos(-yaw)-dz*Math.sin(-yaw), rz=dx*Math.sin(-yaw)+dz*Math.cos(-yaw);
    return [cx+rx/range*R, cy+rz/range*R]; };
  const dot=(x,z,col,r2=4)=>{ const [mx,my]=put(x,z); if(dist2(mx,my,cx,cy)>R-3)return;
    c.fillStyle=col; c.beginPath(); c.arc(mx,my,r2,0,TAU); c.fill(); };
  if(Z.tardis){ const [mx,my]=put(Z.tardis.x,Z.tardis.z);
    if(dist2(mx,my,cx,cy)<R-4){ c.fillStyle='#4a9eff'; c.fillRect(mx-5,my-5,10,10); } }
  for(const n of Z.npcs) dot(n.P.root.position.x, n.P.root.position.z, '#6fe08a', 4);
  for(const e of Z.enemies) if(e.alive&&!e.dormant) dot(e.root.position.x, e.root.position.z, e.alerted?'#ff5348':'#c85a52', 4.5);
  for(const it of Z.pickups||[]) dot(it.x,it.z,'#ffd75a',4);
  const comp=G.companion.root.position; dot(comp.x,comp.z,'#e87a9a',4);
  // player wedge
  c.fillStyle='#eef4ff';
  c.save(); c.translate(cx,cy);
  c.beginPath(); c.moveTo(0,-8); c.lineTo(5.4,6); c.lineTo(-5.4,6); c.closePath(); c.fill();
  c.restore();
  c.restore();
  // north tick
  const na=angNorm(-yaw);
  c.fillStyle='#8fa5c8'; c.font='700 12px Segoe UI'; c.textAlign='center';
  c.fillText('N', cx+Math.sin(na)*(R-11), cy-Math.cos(na)*(R-11)+4);
}

/* ---------- damage feedback ---------- */
function damageFlash(strong){
  UI.vig.style.opacity=strong?0.95:0.7;
  clearTimeout(damageFlash._t);
  damageFlash._t=setTimeout(()=>UI.vig.style.opacity=0, strong?450:280);
}

/* ---------- dialogue system ---------- */
const DlgState={open:false, tree:null, node:null, npc:null, typing:false, full:'', shown:0, timer:null};
function openDialogue(dlgId, npc){
  const tree=DLG[dlgId]; if(!tree) return;
  DlgState.open=true; DlgState.tree=tree; DlgState.npc=npc;
  G.state='dialogue';
  if(npc&&npc.state!==undefined) npc.state='converse';
  UI.dlg.classList.remove('hidden');
  A.ui();
  gotoNode(typeof tree.start==='function'?tree.start():tree.start);
}
function gotoNode(id){
  if(!id){ closeDialogue(); return; }
  const n=DlgState.tree.nodes[id];
  if(!n){ closeDialogue(); return; }
  DlgState.node=n;
  if(n.do) try{ n.do(); }catch(e){ console.error(e); }
  const name=DlgState.npc?DlgState.npc.name:'—';
  UI.dlgName.textContent=name;
  const text=typeof n.t==='function'?n.t():n.t;
  DlgState.full=text; DlgState.shown=0; DlgState.typing=true;
  UI.dlgText.textContent='';
  UI.dlgOpts.innerHTML=''; UI.dlgMore.style.display='none';
  UI.dlgRiley.style.display='none';
  clearInterval(DlgState.timer);
  DlgState.timer=setInterval(()=>{
    DlgState.shown+=2;
    UI.dlgText.textContent=DlgState.full.slice(0,DlgState.shown);
    if(DlgState.shown>=DlgState.full.length) finishTyping();
  },18);
}
function finishTyping(){
  clearInterval(DlgState.timer); DlgState.typing=false;
  UI.dlgText.textContent=DlgState.full;
  const n=DlgState.node;
  if(n.r){ UI.dlgRiley.style.display='block'; UI.dlgRiley.querySelector('span').textContent=n.r; }
  const opts=(n.o||[]).filter(o=>!o.if||o.if());
  if(opts.length){
    opts.forEach((o,i)=>{
      const el=document.createElement('div'); el.className='dlg-opt';
      el.innerHTML=`<span class="num">${i+1}</span>${o.t}`;
      el.onclick=()=>chooseOpt(o);
      UI.dlgOpts.appendChild(el);
    });
    DlgState.opts=opts;
  } else { DlgState.opts=null; UI.dlgMore.style.display='block';
    UI.dlgMore.textContent = n.next ? 'E / click — continue' : 'E / click — close'; }
}
function chooseOpt(o){
  A.ui();
  if(o.do) try{ o.do(); }catch(e){ console.error(e); }
  if(o.next) gotoNode(o.next); else closeDialogue();
}
function advanceDialogue(){
  if(DlgState.typing){ DlgState.shown=DlgState.full.length; finishTyping(); return; }
  const n=DlgState.node;
  if(DlgState.opts) return;                    // must click / number key
  if(n.next) gotoNode(n.next); else closeDialogue();
}
function closeDialogue(){
  clearInterval(DlgState.timer);
  DlgState.open=false;
  if(DlgState.npc&&DlgState.npc.state==='converse') DlgState.npc.state='idle';
  DlgState.npc=null;
  UI.dlg.classList.add('hidden');
  if(G.state==='dialogue') G.state='play';
}
UI.dlg.addEventListener('click',()=>{ if(DlgState.open&&!DlgState.opts||DlgState.typing) advanceDialogue(); });

/* ---------- travel UI ---------- */
const DESTS=[
  {id:'london', era:'Earth · October 1963', name:'London', desc:'Coal smoke, rain, and shop dummies that watch you back.',
   status:()=>G.flags.fragLondon?2:G.flags.autonsActive?1:0},
  {id:'skaro', era:'The Seventh Galaxy · long ago', name:'Skaro', desc:'Twin suns over a petrified forest. Home of the Daleks.',
   status:()=>G.flags.fragSkaro?2:G.flags.dalekQuest?1:0},
  {id:'moon', era:'Luna · 2070', name:'Moonbase Artemis', desc:'The Earth hangs in a black sky. Something marched out of the dust.',
   status:()=>G.flags.fragMoon?2:G.flags.moonQuest?1:0},
  {id:'grave', era:'England · last Tuesday', name:'Wester Drumlins', desc:'An overgrown churchyard. The statues are lonely. Don\'t blink.',
   status:()=>G.flags.fragGrave?2:G.flags.graveQuest?1:0},
  {id:'silence', era:'Florida · 22 April 1969', name:'Yaxley Facility', desc:'An abandoned listening post. Something you can\'t remember lives in the dark.',
   status:()=>G.flags.fragSilence?2:G.flags.silenceQuest?1:0},
];
function openTravel(){
  if(G.fragments>=FRAG_TOTAL&&!G.flags.ended){ startFinale(); return; }
  G.state='travel';
  UI.travel.classList.remove('hidden');
  UI.dests.innerHTML='';
  const stTxt=['UNVISITED','IN PROGRESS','FRAGMENT SECURED ✓'];
  for(const d of DESTS){
    const visited=G.zones[d.id].visited;
    const s=d.status();
    const el=document.createElement('div');
    el.className='dest'+(G.tardisAt===d.id?' here':'');
    el.innerHTML=`<div class="d-era">${d.era}</div><div class="d-name">${d.name}</div>
      <div class="d-desc">${d.desc}</div><div class="d-status s${s}">${G.tardisAt===d.id?'CURRENT LOCATION':(visited?stTxt[s]:s===2?stTxt[2]:'UNVISITED')}</div>`;
    el.onclick=()=>{ if(G.tardisAt!==d.id){ A.ui(); travelSequence(d.id); } };
    UI.dests.appendChild(el);
  }
  A.ui();
}
function closeTravel(){ UI.travel.classList.add('hidden'); if(G.state==='travel') G.state='play'; }
$('travel-cancel').onclick=()=>closeTravel();

/* ---------- pause ---------- */
function pauseGame(fromLock){
  if(G.state!=='play') return;
  G.state='paused';
  $('pause').classList.remove('hidden');
  $('p-quality').value=G.quality; $('p-voice').value=G.voice?'on':'off'; $('p-sound').value=G.sound?'on':'off';
  if(document.pointerLockElement===canvas) document.exitPointerLock();
}
function resumeGame(){
  $('pause').classList.add('hidden');
  G.state='play';
  if(!G.debug && !G.isTouch) canvas.requestPointerLock();
}
$('p-resume').onclick=resumeGame;
$('p-quality').onchange=e=>{ G.quality=e.target.value; applyQuality(); saveGame(); };
$('p-voice').onchange=e=>{ G.voice=e.target.value==='on'; saveGame(); };
$('p-sound').onchange=e=>{ G.sound=e.target.value==='on'; saveGame(); };
$('p-restart').onclick=()=>{ localStorage.removeItem('dw_echoes_save'); location.reload(); };

/* ---------- start screen starfield ---------- */
(function(){
  const c=$('starfield'), x=c.getContext('2d');
  let stars=[];
  function fit(){ c.width=innerWidth; c.height=innerHeight;
    stars=Array.from({length:170},()=>({x:rand(c.width),y:rand(c.height),r:rand(0.4,1.7),tw:rand(TAU)})); }
  fit(); addEventListener('resize',fit);
  (function tick(){
    if($('start').classList.contains('hidden')) return;
    x.clearRect(0,0,c.width,c.height);
    const t=performance.now()/1000;
    for(const s of stars){ x.globalAlpha=0.35+Math.abs(Math.sin(t*0.7+s.tw))*0.65;
      x.fillStyle='#cfe0ff'; x.beginPath(); x.arc(s.x,s.y,s.r,0,TAU); x.fill(); }
    x.globalAlpha=1;
    requestAnimationFrame(tick);
  })();
})();
