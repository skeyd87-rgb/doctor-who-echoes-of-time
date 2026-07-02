/* ============================== 09 PLAYER, CAMERA, SONIC, COMPANION ============================== */
const PL={ vel:V3(), grounded:true, footT:0, beam:null, beamGeo:null, sonicOn:false, fov:62, kick:0 };

function damagePlayer(dmg, fromPos, strong=false){
  if(G.state!=='play'||G.debug&&G.godmode) return;
  G.hp=Math.max(0,G.hp-dmg); G.lastHit=G.time;
  damageFlash(strong); A.hit(); PL.kick=Math.min(PL.kick+0.35,1);
  if(G.hp<=0) startRegeneration();
  else if(G.hp<28) banter('b_lowhp','Doctor, you\'re hurt! Get behind something — please!');
}
function startRegeneration(){
  if(G.state==='dead') return;
  G.state='dead';
  UI.goldvig.style.opacity=1;
  A.demat(); A.bell();
  toastMsg('TIME ENERGY CRITICAL','...regenerating');
  G.player.sonicLight.intensity=0;
  setTimeout(()=>{
    const Z=G.zone, s=Z.spawn;
    G.player.root.position.set(s.x, Z.groundHeight(s.x,s.z), s.z);
    G.yaw=s.yaw; G.hp=G.maxhp; G.lastHit=G.time;
    for(const e of Z.enemies){ if(e.alive&&e.kind!=='angel'){ e.alerted=e.kind==='auton'?e.alerted:false; if(e.state)e.state=e.waypoints?'patrol':e.state; if(e.sonicCharge)e.sonicCharge=0; } }
    UI.goldvig.style.opacity=0;
    G.state='play';
    toastMsg('REGENERATION COMPLETE','same face — lucky');
    banter('reg'+Math.floor(G.time),'Your hands were GLOWING. Warn a girl before you do the firework thing!');
  }, 2600);
}

/* ---------- sonic screwdriver ---------- */
function updateSonic(dt){
  const P=G.player, Z=G.zone;
  const want = G.sonicHeld && G.state==='play';
  if(want&&!PL.sonicOn){ PL.sonicOn=true; A.sonicStart(); }
  if(!want&&PL.sonicOn){ PL.sonicOn=false; A.sonicStop(); }
  const tipWorld=P.sonicTip.getWorldPosition(V3());
  if(!PL.beam){
    PL.beamGeo=new THREE.BufferGeometry().setFromPoints(Array.from({length:9},()=>V3()));
    PL.beam=new THREE.Line(PL.beamGeo, new THREE.LineBasicMaterial({color:0x7fdfff, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false}));
    PL.beam.frustumCulled=false;
  }
  if(PL.beam.parent!==Z.scene){ Z.scene.add(PL.beam); }
  if(!PL.sonicOn){
    PL.beam.material.opacity=damp(PL.beam.material.opacity,0,14,dt);
    P.sonicTipM.emissiveIntensity=damp(P.sonicTipM.emissiveIntensity,0,10,dt);
    P.sonicLight.intensity=damp(P.sonicLight.intensity,0,10,dt);
    return;
  }
  // pose: raise right arm while active
  P.shR.rotation.x=damp(P.shR.rotation.x,-1.15,10,dt);
  P.elR.rotation.x=damp(P.elR.rotation.x,0.55,10,dt);
  P.sonicTipM.emissiveIntensity=damp(P.sonicTipM.emissiveIntensity,2.6,10,dt);
  P.sonicLight.intensity=damp(P.sonicLight.intensity,3.2,10,dt);
  // find target in reticle cone
  const fwd=V3(); camera.getWorldDirection(fwd);
  const camPos=camera.position;
  let best=null, bestA=0.16;
  for(const e of Z.enemies){
    if(!e.alive||e.dormant) continue;
    const ep=V3(e.root.position.x, e.root.position.y+1.25, e.root.position.z);
    const d=ep.distanceTo(camPos);
    if(d>24) continue;
    const dir=ep.clone().sub(camPos).normalize();
    const a=fwd.angleTo(dir);
    if(a<bestA){ bestA=a; best={e, point:ep}; }
  }
  let end;
  if(best){
    end=best.point;
    if(best.e.immuneSonic){
      banter('b_angelsonic','The sonic\'s doing NOTHING to it — it\'s stone, Doctor, it\'s quantum-locked! Just KEEP LOOKING at it!');
      sparkBurst(Z.scene, end, 0x9fd8ff, 2, 1.5, 0.3, 0);
    } else {
      if(best.e.sonicHit(dt)) {/* disabled this frame */}
      if(Math.random()<0.3) sparkBurst(Z.scene, end.clone().add(V3(rand(-0.2,0.2),rand(-0.2,0.2),rand(-0.2,0.2))), 0x9fd8ff, 3, 2.5, 0.35);
    }
  } else {
    end=camPos.clone().add(fwd.clone().multiplyScalar(9)); end.y=Math.max(end.y, Z.groundHeight(end.x,end.z)+0.2);
  }
  // beam points with jitter
  const pts=PL.beamGeo.attributes.position;
  for(let i=0;i<9;i++){
    const k=i/8, p=tipWorld.clone().lerp(end,k);
    if(i>0&&i<8){ const j=0.03+Math.sin(G.time*30+i)*0.02; p.x+=rand(-j,j); p.y+=rand(-j,j); p.z+=rand(-j,j); }
    pts.setXYZ(i,p.x,p.y,p.z);
  }
  pts.needsUpdate=true;
  PL.beam.material.opacity=0.75+Math.sin(G.time*26)*0.2;
}

/* ---------- movement & camera ---------- */
function updatePlayer(dt){
  const P=G.player, Z=G.zone, pos=P.root.position;
  const playing=G.state==='play';
  // input
  let ix=0, iz=0;
  if(playing){
    if(G.keys.KeyW||G.keys.ArrowUp)iz+=1; if(G.keys.KeyS||G.keys.ArrowDown)iz-=1;
    if(G.keys.KeyA||G.keys.ArrowLeft)ix-=1; if(G.keys.KeyD||G.keys.ArrowRight)ix+=1;
    if(G.moveVec){ ix+=G.moveVec.x; iz+=G.moveVec.z; }
  }
  const run=!!G.keys.ShiftLeft||!!G.keys.ShiftRight||G.touchRun;
  const mag=Math.hypot(ix,iz);
  let speed=0;
  if(mag>0){
    ix/=mag; iz/=mag;
    speed=(run?6.1:3.3)*(PL.sonicOn?0.55:1);
    const wx=Math.sin(G.yaw)*iz+Math.sin(G.yaw-PI/2)*ix;
    const wz=Math.cos(G.yaw)*iz+Math.cos(G.yaw-PI/2)*ix;
    pos.x+=wx*speed*dt; pos.z+=wz*speed*dt;
    const face=Math.atan2(wx,wz);
    P.root.rotation.y=angDamp(P.root.rotation.y, face, 11, dt);
  }
  // channel (repair/door) cancels on move
  if(G.channel){
    const ch=G.channel;
    if(mag>0||dist2(pos.x,pos.z,ch.x,ch.z)>3.2){ G.channel=null; A.sonicStop(); }
    else{
      ch.t+=dt;
      P.shR.rotation.x=damp(P.shR.rotation.x,-1.0,10,dt);
      P.sonicTipM.emissiveIntensity=2.6; P.sonicLight.intensity=3;
      if(!PL.sonicOn){ A.sonicStart(); PL.sonicOn=true; }
      setPrompt(`<b>${ch.label}</b> — ${Math.round(clamp(ch.t/ch.need,0,1)*100)}%`);
      if(ch.t>=ch.need){ G.channel=null; A.sonicStop(); PL.sonicOn=false; ch.onDone(); }
    }
  }
  // gravity & jump
  if(playing&&G.pressed.Space&&PL.grounded){ PL.vel.y=Z.jumpV; PL.grounded=false; A.blip(240,0.08,0.04,'sine'); }
  PL.vel.y+=Z.gravity*dt;
  pos.y+=PL.vel.y*dt;
  const gy=Z.groundHeight(pos.x,pos.z);
  if(pos.y<=gy){ pos.y=gy; PL.vel.y=0; if(!PL.grounded&&Z.id==='moon') A.footstep('moon'); PL.grounded=true; }
  resolveStatic(Z,pos,0.34);
  // footsteps
  P.speed=speed; P.running=run&&mag>0;
  if(mag>0&&PL.grounded){ PL.footT-=dt*speed; if(PL.footT<=0){ PL.footT=1.55; A.footstep(Z.surface); } }
  P.headTarget=null;
  P.update(dt,G.time);
  // camera
  const heightScale=P.o.height/1.75;
  const headY=pos.y+1.66*heightScale;
  if(G.camOverride){
    const o=G.camOverride;
    camera.position.set(o.x,o.y,o.z);
    camera.rotation.set(0,0,0,'YXZ'); camera.rotation.y=o.yaw; camera.rotation.x=o.pitch;
  } else {
    const wantFov=(PL.sonicOn?58:(P.running?66:62));
    PL.fov=damp(PL.fov,wantFov,6,dt);
    camera.fov=PL.fov; camera.updateProjectionMatrix();
    const cd=Math.cos(G.pitch), sd=Math.sin(G.pitch);
    const back=V3(-Math.sin(G.yaw)*cd, -sd, -Math.cos(G.yaw)*cd);   // direction camera→behind
    let boom=3.85;
    for(let t2=0.5;t2<=boom;t2+=0.28){
      const px=pos.x+back.x*t2, py=headY+back.y*t2+0.28, pz=pos.z+back.z*t2;
      let hitW=false;
      for(const b of Z.aabbs){ if(px>b.x1-0.2&&px<b.x2+0.2&&pz>b.z1-0.2&&pz<b.z2+0.2&&py<7){hitW=true;break;} }
      if(hitW||py<Z.groundHeight(px,pz)+0.22){ boom=Math.max(0.6,t2-0.3); break; }
    }
    PL.kick=damp(PL.kick,0,7,dt);
    const shake=(G.travelAnim?0.06:0)+PL.kick*0.05;
    const cx2=pos.x+back.x*boom+rand(-shake,shake);
    const cy2=headY+0.28+back.y*boom+rand(-shake,shake);
    const cz2=pos.z+back.z*boom+rand(-shake,shake);
    camera.position.set(cx2,cy2,cz2);
    camera.lookAt(pos.x+Math.sin(G.yaw)*1.6, headY-0.05+Math.sin(G.pitch)*2.2, pos.z+Math.cos(G.yaw)*1.6);
  }
  updateSonic(dt);
}

/* ---------- companion ---------- */
function updateCompanion(dt){
  const C=G.companion, Z=G.zone, pos=C.root.position, pp=G.player.root.position;
  // desired slot: behind-left of player
  const back=G.player.root.rotation.y+PI;
  let tx=pp.x+Math.sin(back+0.5)*1.7, tz=pp.z+Math.cos(back+0.5)*1.7;
  // shy away from alerted enemies
  for(const e of Z.enemies){ if(e.alive&&e.alerted&&e.kind!=='angel'){
    const d=dist2(tx,tz,e.root.position.x,e.root.position.z);
    if(d<7){ const a=Math.atan2(tx-e.root.position.x, tz-e.root.position.z);
      tx+=Math.sin(a)*(7-d)*0.6; tz+=Math.cos(a)*(7-d)*0.6; } } }
  const d=dist2(pos.x,pos.z,tx,tz);
  if(d>26){ pos.set(tx, Z.groundHeight(tx,tz), tz); C.speed=0; }
  else if(d>1.1){
    const a=Math.atan2(tx-pos.x, tz-pos.z);
    const spd=clamp((d-1.0)*2.2, 0.8, 6.3);
    C.speed=spd; C.running=spd>4;
    C.root.rotation.y=angDamp(C.root.rotation.y, a, 9, dt);
    pos.x+=Math.sin(C.root.rotation.y)*spd*dt;
    pos.z+=Math.cos(C.root.rotation.y)*spd*dt;
    resolveStatic(Z,pos,0.3);
    pos.y=Z.groundHeight(pos.x,pos.z);
  } else {
    C.speed=0;
    const facePlayer=G.state==='dialogue'||dist2(pos.x,pos.z,pp.x,pp.z)<3;
    if(facePlayer) C.root.rotation.y=angDamp(C.root.rotation.y, Math.atan2(pp.x-pos.x,pp.z-pos.z), 4, dt);
  }
  C.headTarget = G.state==='dialogue' && DlgState.npc ? DlgState.npc.P.root.position : pp;
  C.update(dt,G.time);
  // ambient warnings
  if(Z.id==='grave'&&G.state==='play'){
    for(const e of Z.enemies){ if(e.kind==='angel'&&e.alive){
      const ad=dist2(pp.x,pp.z,e.root.position.x,e.root.position.z);
      if(ad<9&&!e.observed()) { banter('b_angelnear','Behind you— statue— DON\'T BLINK, look at it LOOK AT IT!'); break; }
    } }
  }
}
