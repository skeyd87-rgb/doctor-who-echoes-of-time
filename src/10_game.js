/* ============================== 10 GAME CORE ============================== */

function saveGame(){
  try{ localStorage.setItem('dw_echoes_save', JSON.stringify({
    v:1, flags:G.flags, seen:G.seen, hp:G.hp, tardisAt:G.tardisAt, zoneId:G.zone?G.zone.id:'london',
    quality:G.quality, voice:G.voice, sound:G.sound })); }catch(e){}
}
function loadSave(){
  try{ const s=JSON.parse(localStorage.getItem('dw_echoes_save')||'null'); return s&&s.v===1?s:null; }catch(e){ return null; }
}

const ZONE_BANTER={
  london:'Right. Past. Actual past. Rule one: don\'t step on butterflies. Rule two: find out why the TARDIS dragged us HERE.',
  skaro:'Doctor... the scanner said "SKARO" and you got QUIET. You never get quiet. Talk to me.',
  moon:'Okay. Breathe normally. There\'s a dome, there are lights on — somebody\'s home. On the MOON.',
  grave:'Oh, cheery. Fog, gravestones, and it\'s nearly dark. If a statue so much as TWITCHES, I\'m back in the box.',
  tardis:'Bigger. On. The. Inside. I know I keep saying it. It keeps being TRUE.',
};

function applyZoneVisit(Z){
  if(!Z.visited){ Z.visited=true;
    if(ZONE_BANTER[Z.id]) banter('zb_'+Z.id, ZONE_BANTER[Z.id], 2.2);
  }
  toastMsg(Z.title, Z.sub);
  UI.zonechip.textContent=Z.title;
}
function switchZone(id, spawnOverride){
  const Z=G.zones[id]; if(!Z) return;
  G.zone=Z;
  renderPass.scene=Z.scene;
  const s=spawnOverride||Z.spawn;
  G.player.root.position.set(s.x, Z.groundHeight(s.x,s.z), s.z);
  G.yaw=s.yaw??0; G.pitch=-0.1; PL.vel.set(0,0,0);
  if(G.player.root.parent!==Z.scene) Z.scene.add(G.player.root);
  const cx=s.x+Math.sin((s.yaw||0)+2.4)*1.6, cz=s.z+Math.cos((s.yaw||0)+2.4)*1.6;
  G.companion.root.position.set(cx, Z.groundHeight(cx,cz), cz);
  if(G.companion.root.parent!==Z.scene) Z.scene.add(G.companion.root);
  A.zone(Z.ambience);
  applyZoneVisit(Z);
  updateObjective();
  saveGame();
}
function enterTardis(){
  G.returnZone=G.zone.id;
  fadeSwap(()=>{ switchZone('tardis'); A.doorCreak(); });
}
function exitTardis(){
  fadeSwap(()=>{
    const Z=G.zones[G.tardisAt], t=Z.tardis;
    const ex={x:t.x+Math.sin(t.yaw)*1.8, z:t.z+Math.cos(t.yaw)*1.8, yaw:t.yaw};
    switchZone(G.tardisAt, ex);
  });
}
function fadeSwap(fn){
  const f=UI.fade; f.style.opacity=1;
  setTimeout(()=>{ fn(); f.style.opacity=0; }, 450);
}
function travelSequence(destId){
  closeTravel();
  G.state='vortex'; G.travelAnim=true;
  A.demat();
  UI.vortex.classList.remove('hidden');
  requestAnimationFrame(()=>UI.vortex.style.opacity=1);
  setTimeout(()=>{
    G.tardisAt=destId;
    saveGame();
  },1200);
  setTimeout(()=>{
    UI.vortex.style.opacity=0;
    setTimeout(()=>UI.vortex.classList.add('hidden'),500);
    G.travelAnim=false; G.state='play';
    toastMsg('MATERIALISED', G.zones[destId].title+' — step outside');
  },3300);
}
function startFinale(){
  G.flags.ended=true; saveGame();
  G.state='vortex'; G.travelAnim=true;
  A.demat(); setTimeout(()=>A.bell(),1500); setTimeout(()=>A.chime(),3200);
  UI.vortex.classList.remove('hidden');
  requestAnimationFrame(()=>UI.vortex.style.opacity=1);
  setTimeout(()=>{
    UI.vortex.style.opacity=0;
    setTimeout(()=>UI.vortex.classList.add('hidden'),500);
    G.travelAnim=false;
    $('ending-text').innerHTML=
      'Four fragments. One rupture, sealed with a hum and a lever.<br><br>'+
      'An old shopkeeper sleeps soundly in 1963. A Thal counts silences that never come. '+
      'A moonbase hangs its helmets up for the night, and somewhere, a woman plants apple seeds from her brother\'s tree.<br><br>'+
      'The universe doesn\'t say thank you. It doesn\'t have to.<br>'+
      '<span style="color:#8fa5c8">Somewhere in the vortex, a blue box sings.</span>';
    $('ending').classList.remove('hidden');
    G.state='ending';
    if(document.pointerLockElement===canvas) document.exitPointerLock();
  },4200);
}
$('ending-continue').onclick=()=>{
  $('ending').classList.add('hidden');
  G.state='play';
  if(!G.debug && !G.isTouch) canvas.requestPointerLock();
  toastMsg('THE ADVENTURE CONTINUES','all of time and space');
};

/* ---------- interactions ---------- */
function updateInteract(){
  if(G.state!=='play'){ setPrompt(null); return; }
  if(G.channel) return;                        // channel writes its own prompt
  const Z=G.zone, pp=G.player.root.position;
  let best=null, bd=99;
  for(const it of Z.interactables){
    if(it.cond&&!it.cond()) continue;
    const d=dist2(pp.x,pp.z,it.x,it.z);
    if(d<it.r&&d<bd){ bd=d; best=it; }
  }
  // companion talk
  const cd=dist2(pp.x,pp.z,G.companion.root.position.x,G.companion.root.position.z);
  if(cd<2.0&&cd<bd&&!best){ best={label:()=>'Talk to <b>Riley</b>', action:()=>openDialogue('riley',{name:'Riley Vance', P:G.companion})}; }
  if(best){
    setPrompt('E — '+(typeof best.label==='function'?best.label():best.label));
    if(G.pressed.KeyE){ best.action(); }
  } else setPrompt(null);
}

/* ---------- moonbase cyber waves ---------- */
function updateMoonWaves(dt){
  const Z=G.zones.moon;
  if(G.zone!==Z||!G.flags.moonQuest||G.flags.moonDone) return;
  Z.waveT-=dt;
  if(Z.waveT<=0&&(G.flags.regsFixed||0)<3&&Z.cyberWave<3){
    Z.cyberWave++;
    Z.waveT=42;
    banter('b_wave'+Z.cyberWave,'Dust line! More of them coming out of the crater — '+(4-Z.cyberWave)+' regulators of trouble!');
    for(let i=0;i<3;i++){
      const a=rand(TAU), x=-30+Math.sin(a)*rand(4,9), z=-25+Math.cos(a)*rand(4,9);
      const c=addCyberman(Z,x,z,{dormant:false});
      c.alerted=true;
      c.onDisabled=()=>onQuestEvent('cyberDown');
    }
  }
}

/* ---------- boot ---------- */
function buildWorld(){
  G.player=mkDoctor();
  G.companion=mkRiley();
  buildLondon(); buildTardisInterior(); buildSkaro(); buildMoonbase(); buildGraveyard();
  recountFragments();
}
function startGame(fromSave){
  A.init();
  const sv=fromSave?loadSave():null;
  if(sv){ G.flags=sv.flags||{}; G.seen=sv.seen||{}; G.hp=sv.hp||100; G.tardisAt=sv.tardisAt||'london';
    G.quality=sv.quality||G.quality; G.voice=sv.voice!==false; G.sound=sv.sound!==false; }
  buildWorld();
  recountFragments(); updateFrags();
  // restore world side-effects of flags
  if(G.flags.autonsDone){ G.zones.london.autons.forEach(a=>{ if(a.alive){a.alive=false; a.root.visible=false;} }); }
  else if(G.flags.autonsActive){ G.zones.london.autons.forEach(a=>a.activate()); }
  if(G.flags.autonsDone&&!G.flags.fragLondon) G.zones.london.fragLondon.root.visible=true;
  if(G.flags.mausoleumOpen){ const Zg=G.zones.grave;
    const i=Zg.aabbs.indexOf(Zg.doorBlock); if(i>=0)Zg.aabbs.splice(i,1); Zg.mausoleum.door.rotation.y=-1.9; }
  if(G.flags.regsFixed){ G.zones.moon.regulators.slice(0,G.flags.regsFixed).forEach(r=>{ r.fixed=true; r.R.lampM.color.set(0x5affc8); r.R.lampM.emissive.set(0x2adf98); }); }
  ['fragLondon','fragSkaro','fragMoon','fragGrave'].forEach(f=>{
    if(G.flags[f]){ const zid={fragLondon:'london',fragSkaro:'skaro',fragMoon:'moon',fragGrave:'grave'}[f];
      G.zones[zid].scene.traverse(o=>{}); } });
  applyQuality();
  $('start').classList.add('hidden');
  UI.hud.classList.remove('hidden');
  switchZone(sv?(sv.zoneId||'london'):'london');
  G.state='play';
  if(!G.debug && !G.isTouch) canvas.requestPointerLock();
  if(!sv) setTimeout(()=>banter('b_hello','So this is 1963! Smells like rain and coal. Where do we start, Doctor?',2500),0);
}
$('b-start').onclick=()=>{ localStorage.removeItem('dw_echoes_save'); startGame(false); };
$('b-continue').onclick=()=>startGame(true);
$('s-quality').onchange=e=>{ G.quality=e.target.value; };
if(loadSave()) $('b-continue').classList.remove('hidden');

/* keyboard: dialogue advance + options + pause */
addEventListener('keydown',e=>{
  if(G.state==='dialogue'){
    if(e.code==='KeyE'||e.code==='Enter'||e.code==='Space') advanceDialogue();
    if(DlgState.opts&&/^Digit[1-4]$/.test(e.code)){
      const i=+e.code.slice(5)-1;
      if(DlgState.opts[i]) chooseOpt(DlgState.opts[i]);
    }
  } else if(G.state==='travel'&&e.code==='Escape') closeTravel();
  else if(G.state==='paused'&&e.code==='Escape') resumeGame();
});

/* ---------- debug API ---------- */
Object.assign(window.DW,{
  warp:id=>switchZone(id),
  quality:q=>{ G.quality=q; applyQuality(); },
  snap:(w=880,q=0.6)=>{ updatePlayer(0.016); composer.render();
    const c2=document.createElement('canvas'); const s=w/canvas.width;
    c2.width=w; c2.height=Math.round(canvas.height*s);
    c2.getContext('2d').drawImage(canvas,0,0,c2.width,c2.height);
    window.__img=c2.toDataURL('image/jpeg',q); return window.__img.length; },
  god:()=>{G.godmode=true;},
  give:()=>{['fragLondon','fragSkaro','fragMoon','fragGrave'].forEach(f=>G.flags[f]=true); recountFragments(); updateFrags();},
  cam:(x,y,z,yaw=0,pitch=0)=>{ G.camOverride={x,y,z,yaw,pitch}; },
  play:()=>{ G.camOverride=null; },
  freeze:v=>{ G.freezeAI=v!==false; },
  start:()=>startGame(false),
  shot:(name)=>{ const S={          // camera forward = (-sin yaw, -cos yaw)
    london:['london',{x:9,y:2.2,z:2.0,yaw:-1.85,pitch:0.05}],
    tardis:['tardis',{x:4.6,y:2.6,z:4.8,yaw:0.765,pitch:-0.12}],
    skaro:['skaro',{x:7,y:3.0,z:19,yaw:0.24,pitch:0.06}],
    moon:['moon',{x:19,y:2.8,z:17,yaw:0.55,pitch:0.17}],
    grave:['grave',{x:3.5,y:2.4,z:34,yaw:0.08,pitch:0.0}],
    dalek:['skaro',{x:-12,y:1.9,z:-7.5,yaw:0.73,pitch:-0.04}],
    angel:['grave',{x:-14.5,y:1.7,z:-10.5,yaw:-2.36,pitch:0.0}],
    cyber:['moon',{x:-1,y:1.9,z:11,yaw:3.02,pitch:0.0}],
    auton:['london',{x:-33,y:1.7,z:4.5,yaw:PI,pitch:0.0}],
  }[name]; if(!S)return;
    switchZone(S[0]); G.camOverride=S[1]; },
});
if(G.debug){ setTimeout(()=>{ if(G.state==='menu') startGame(false); }, 300); }

/* ---------- main loop ---------- */
let _last=performance.now(), _slowN=0, _rafId=0;
function loop(now){
  cancelAnimationFrame(_rafId); _rafId=requestAnimationFrame(loop);
  const rawDt=(now-_last)/1000;
  const dt=Math.min(rawDt, 0.05); _last=now;
  G.time+=dt;
  // auto performance mode: high -> low -> perf floor (bloom off)
  if(G.state!=='menu' && !G.perfMin){
    if(rawDt>0.10) _slowN++; else _slowN=Math.max(0,_slowN-2);
    if(_slowN>45){ _slowN=0;
      if(G.quality==='high'){ G.quality='low'; applyQuality(); toastMsg('PERFORMANCE MODE','graphics tuned for smoothness'); }
      else { G.perfMin=true; applyQuality(); }
    }
  }
  const t=G.time;
  if(G.state!=='menu'){
    const Z=G.zone;
    if(Z){
      if(G.state==='play'||G.state==='dialogue'||G.state==='travel'||G.state==='vortex'||G.state==='ending'){
        updatePlayer(dt);
        updateCompanion(dt);
        for(const n of Z.npcs) n.update(dt,t);
        if(!G.freezeAI&&(G.state==='play')) updateEnemies(Z,dt,t);
        for(const u of Z.updaters) u(dt,t);
        updateMoonWaves(dt);
      }
      updateTrans(dt); updateBursts(dt);
      // health regen after 5s without damage
      if(G.state==='play'&&G.hp<G.maxhp&&t-G.lastHit>5) G.hp=Math.min(G.maxhp,G.hp+dt*7);
      updateInteract();
      updateBanter(dt); updateToast(dt); updateObjective(); updateFrags();
      drawGauge(t); drawMinimap();
    }
    composer.render();
  }
  G.pressed={};
}
_rafId=requestAnimationFrame(loop);
setInterval(()=>{ if(performance.now()-_last>400) loop(performance.now()); }, 300);   // keep ticking in hidden tabs
