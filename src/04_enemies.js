/* ============================== 04 ENEMIES ============================== */

/* ---- transient effects (beams, flashes, floating text) ---- */
const TRANS=[];
function addTrans(fn){ TRANS.push(fn); }
function updateTrans(dt){ for(let i=TRANS.length-1;i>=0;i--) if(!TRANS[i](dt)) TRANS.splice(i,1); }

function zapBeam(scene, from, to, color=0x7CFC00, life=0.1, width=1){
  const g=new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
  const m=new THREE.LineBasicMaterial({color, transparent:true, opacity:1, blending:THREE.AdditiveBlending, depthWrite:false});
  const l=new THREE.Line(g,m); scene.add(l);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({color, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false}));
  glow.position.copy(to); glow.scale.setScalar(0.7); scene.add(glow);
  let age=0;
  addTrans(dt=>{ age+=dt; const k=1-age/life;
    if(k<=0){ scene.remove(l); scene.remove(glow); g.dispose(); m.dispose(); glow.material.dispose(); return false; }
    m.opacity=k; glow.material.opacity=k; glow.scale.setScalar(0.7+ (1-k)*0.6); return true; });
}
function arcZap(scene, from, to, color=0xbfe6ff, life=0.14){
  const pts=[]; const n=7;
  for(let i=0;i<=n;i++){ const p=from.clone().lerp(to,i/n);
    if(i>0&&i<n){ p.x+=rand(-0.14,0.14); p.y+=rand(-0.14,0.14); p.z+=rand(-0.14,0.14); } pts.push(p); }
  const g=new THREE.BufferGeometry().setFromPoints(pts);
  const m=new THREE.LineBasicMaterial({color, transparent:true, opacity:1, blending:THREE.AdditiveBlending, depthWrite:false});
  const l=new THREE.Line(g,m); scene.add(l);
  let age=0;
  addTrans(dt=>{ age+=dt; const k=1-age/life;
    if(k<=0){ scene.remove(l); g.dispose(); m.dispose(); return false; }
    m.opacity=k; return true; });
}
function floatText(scene, text, pos, color='#ff5a3c', life=1.7){
  const sp=textSprite(text,color,30); sp.position.copy(pos); scene.add(sp);
  let age=0;
  addTrans(dt=>{ age+=dt; const k=age/life;
    if(k>=1){ scene.remove(sp); sp.material.map.dispose(); sp.material.dispose(); return false; }
    sp.position.y+=dt*0.5; sp.material.opacity=1-k*k; return true; });
}

/* ---- projectiles (Auton bolts, etc.) ---- */
function spawnBolt(Z, from, dir, speed, dmg, color=0xffb35c){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(0.055,8,6),
    new THREE.MeshBasicMaterial({color, transparent:true, opacity:0.95, blending:THREE.AdditiveBlending, depthWrite:false}));
  mesh.position.copy(from); Z.scene.add(mesh);
  Z.projectiles.push({mesh, vel:dir.clone().normalize().multiplyScalar(speed), dmg, ttl:3, color});
}
function updateProjectiles(Z, dt){
  const pp=G.player.root.position;
  for(let i=Z.projectiles.length-1;i>=0;i--){
    const p=Z.projectiles[i]; p.ttl-=dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    const m=p.mesh.position;
    let kill = p.ttl<=0 || m.y < Z.groundHeight(m.x,m.z)-0.1;
    for(const b of Z.aabbs) if(m.x>b.x1&&m.x<b.x2&&m.z>b.z1&&m.z<b.z2){kill=true;break;}
    const dx=m.x-pp.x, dz=m.z-pp.z, dy=m.y-(pp.y+1.0);
    if(dx*dx+dz*dz<0.30 && Math.abs(dy)<1.05){ damagePlayer(p.dmg, m); kill=true; }
    if(kill){ sparkBurst(Z.scene, m, p.color, 10, 3, 0.4); Z.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); Z.projectiles.splice(i,1); }
  }
}

/* =============================== DALEK =============================== */
function mkDalek(colors={}){
  const cBody = colors.body ? M(colors.body,0.42,0.88) : MAT.bronze;
  const cDark = colors.dark ? M(colors.dark,0.5,0.9) : MAT.bronzeDark;
  const root=new THREE.Group();
  // fender + skirt
  root.add(at(cyl(0.60,0.63,0.09, MAT.black, 24),0,0.045,0));
  const prof=[]; for(let i=0;i<=6;i++) prof.push(new THREE.Vector2(lerp(0.545,0.315,i/6), 0.09+ i/6*0.66));
  const skirt=new THREE.Mesh(new THREE.LatheGeometry(prof,22), M(cBody.color.getHex(),0.45,0.85,{flat:true}));
  skirt.castShadow=skirt.receiveShadow=true; root.add(skirt);
  // sense globes (merged)
  const globes=[];
  for(let row=0;row<4;row++){
    const y=0.17+row*0.155, r=lerp(0.53,0.335,(y-0.09)/0.66);
    for(let i=0;i<10;i++){ const a=(i+row*0.5)/10*TAU;
      const s=new THREE.SphereGeometry(0.055,10,8); s.translate(Math.sin(a)*r, y, Math.cos(a)*r); globes.push(s); }
  }
  const gm=new THREE.Mesh(mergeGeos(globes), cDark); gm.castShadow=true; root.add(gm);
  // collar + slats
  root.add(at(cyl(0.315,0.335,0.085, cDark, 22),0,0.795,0));
  const slatG=[];
  for(let i=0;i<16;i++){ const a=i/16*TAU, b=new THREE.BoxGeometry(0.065,0.13,0.025);
    b.translate(0,0,0.322); const m4=new THREE.Matrix4().makeRotationY(a); b.applyMatrix4(m4); b.translate(0,0.90,0); slatG.push(b); }
  const slats=new THREE.Mesh(mergeGeos(slatG), cBody); slats.castShadow=true; root.add(slats);
  root.add(at(cyl(0.30,0.30,0.13, MAT.gunmetal, 22),0,0.90,0));
  root.add(at(cyl(0.28,0.315,0.05, cBody, 22),0,0.985,0));
  // arm platform (yaws with dome)
  const mid=new THREE.Group(); mid.position.y=0.885; root.add(mid);
  const mkMount=(ax)=>{ const g2=new THREE.Group(); g2.position.set(Math.sin(ax)*0.285,0,Math.cos(ax)*0.285); g2.rotation.y=ax; mid.add(g2);
    g2.add(sph(0.058, cDark, 12, 9)); return g2; };
  const gunM=mkMount(0.38), plM=mkMount(-0.38);
  const gun=new THREE.Group(); gunM.add(gun);
  gun.add(at(cyl(0.0115,0.0115,0.30, MAT.gunmetal, 8),0,0,0.15, PI/2,0,0));
  for(let i=0;i<6;i++){ const a=i/6*TAU; gun.add(at(cyl(0.0035,0.0035,0.10, MAT.gunmetal,6), Math.sin(a)*0.030,0,0.25, PI/2,0,0)); }
  const plunger=new THREE.Group(); plM.add(plunger);
  plunger.add(at(cyl(0.013,0.013,0.32, MAT.gunmetal, 8),0,0,0.16, PI/2,0,0));
  plunger.add(at(cyl(0.072,0.035,0.075, M(0x1a1a1c,0.9,0.1), 14),0,0,0.345, PI/2,0,0));
  // neck rings
  for(let i=0;i<3;i++){ root.add(at(cyl(0.295-i*0.026,0.30-i*0.026,0.032, cBody, 20),0,1.055+i*0.055,0)); }
  root.add(at(cyl(0.225,0.245,0.16, M(0x26282c,0.7,0.5), 18),0,1.10,0));
  // dome
  const dome=new THREE.Group(); dome.position.y=1.185; root.add(dome);
  const dm=hemi(0.265, cBody, 24); dm.scale.set(1,0.75,1); dome.add(dm);
  const lights=[];
  for(const s of [-1,1]){ const lg=new THREE.Group(); lg.position.set(s*0.13,0.155,0.075); lg.lookAt(lg.position.clone().multiplyScalar(3)); dome.add(lg);
    lg.add(at(cyl(0.032,0.036,0.05, cDark,10),0,0,0, PI/2,0,0));
    const bulbM=new THREE.MeshStandardMaterial({color:0xffd9a8, emissive:0xffB055, emissiveIntensity:0.12, roughness:0.4});
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(0.028,10,8), bulbM); bulb.position.z=0.032; lg.add(bulb); lights.push(bulbM); }
  const stalk=new THREE.Group(); stalk.position.set(0,0.085,0.20); dome.add(stalk);
  stalk.add(at(cyl(0.012,0.012,0.30, MAT.gunmetal, 8),0,0,0.15, PI/2,0,0));
  for(let i=0;i<3;i++) stalk.add(at(cyl(0.048-i*0.008,0.048-i*0.008,0.009, cDark,12),0,0,0.09+i*0.07, PI/2,0,0));
  const eye=sph(0.052, M(0x0c0c0e,0.3,0.4), 14,10); eye.position.set(0,0,0.315); stalk.add(eye);
  const pupilM=new THREE.MeshStandardMaterial({color:0x9fd8ff, emissive:0x54c2ff, emissiveIntensity:1.4, roughness:0.2});
  const pupil=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.008,10), pupilM); pupil.rotation.x=PI/2; pupil.position.set(0,0,0.368); stalk.add(pupil);
  root.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } });
  root.scale.setScalar(1.18);
  return {root, mid, dome, stalk, lights, gun, pupilM};
}

function addDalek(Z, x, z, opts={}){
  const D = mkDalek(opts.colors||{});
  D.root.position.set(x, Z.groundHeight(x,z), z); Z.scene.add(D.root);
  const E = {
    kind:'dalek', root:D.root, alive:true, alerted:false, sonicCharge:0, sonicNeed:2.2,
    home:{x,z}, waypoints:opts.waypoints||null, wpI:0, boss:opts.boss||false,
    speed:opts.boss?2.1:1.5, fireT:rand(1,2), voiceT:0, aimT:0, phase:rand(20), state:'patrol',
    label:opts.label||'Dalek',
    update(dt,t){
      const r=this.root, pos=r.position, pp=G.player.root.position;
      if(!this.alive){ return; }
      const pd=dist2(pos.x,pos.z,pp.x,pp.z);
      pos.y = Z.groundHeight(pos.x,pos.z)+0.04+Math.sin(t*2.1+this.phase)*0.022;
      const jam = this.sonicCharge>0.15;
      // detection
      if(!this.alerted && pd<(this.boss?30:23) && !losBlocked(Z,pos.x,pos.z,pp.x,pp.z) && G.state==='play'){
        this.alerted=true; this.state='engage';
        A.dalekVoice('Exterminate! Exterminate!');
        floatText(Z.scene,'EXTERMINATE!', pos.clone().add(V3(0,2.15,0)));
        this.voiceT=rand(6,11);
        for(const l of D.lights) l.emissiveIntensity=1.8;
      }
      if(this.alerted && this.alive){
        this.voiceT-=dt;
        if(this.voiceT<=0 && pd<30){ this.voiceT=rand(7,13);
          const line=pick(['Exterminate!','You are an enemy of the Daleks!','Halt! Do not move!','The Doctor must be exterminated!']);
          A.dalekVoice(line); floatText(Z.scene, line.toUpperCase(), pos.clone().add(V3(0,2.15,0))); }
        for(const l of D.lights) l.emissiveIntensity = 0.25+Math.abs(Math.sin(t*7+this.phase))*1.7;
      }
      // movement
      let mx=0, mz=0;
      if(this.state==='patrol' && this.waypoints){
        const wp=this.waypoints[this.wpI];
        if(dist2(pos.x,pos.z,wp[0],wp[1])<1.2) this.wpI=(this.wpI+1)%this.waypoints.length;
        else { const a=Math.atan2(wp[0]-pos.x, wp[1]-pos.z); mx=Math.sin(a); mz=Math.cos(a); }
      } else if(this.state==='engage'){
        const a=Math.atan2(pp.x-pos.x, pp.z-pos.z);
        if(pd>15){ mx=Math.sin(a); mz=Math.cos(a); }
        else if(pd<7){ mx=-Math.sin(a); mz=-Math.cos(a); }
        else { const s=Math.sin(t*0.35+this.phase)>0?1:-1; mx=Math.sin(a+PI/2)*s*0.55; mz=Math.cos(a+PI/2)*s*0.55; }
      }
      if(mx||mz){
        const spd=this.speed*(jam?0.35:1);
        pos.x+=mx*spd*dt; pos.z+=mz*spd*dt; resolveStatic(Z,pos,0.75);
        r.rotation.y = angDamp(r.rotation.y, Math.atan2(mx,mz), jam?1.2:3.5, dt);
        r.rotation.x = damp(r.rotation.x, 0.045, 4, dt); r.rotation.z = damp(r.rotation.z, -mx*0.02, 4, dt);
      } else { r.rotation.x = damp(r.rotation.x, 0, 4, dt); }
      // dome/eyestalk tracking
      const wantDome = this.alerted ? angNorm(Math.atan2(pp.x-pos.x,pp.z-pos.z)-r.rotation.y) : Math.sin(t*0.5+this.phase)*0.8;
      D.dome.rotation.y = angDamp(D.dome.rotation.y, clamp(wantDome,-2.7,2.7), jam?1.3:5, dt);
      D.mid.rotation.y  = angDamp(D.mid.rotation.y, D.dome.rotation.y*0.85, 4, dt);
      const dy=(pp.y+1.2)-(pos.y+1.55);
      D.stalk.rotation.x = damp(D.stalk.rotation.x, this.alerted?clamp(-Math.atan2(dy,pd)*0.8,-0.5,0.45):0, 4, dt);
      // firing
      if(this.state==='engage' && pd<26 && G.state==='play'){
        this.fireT-=dt*(jam?0.3:1);
        if(this.fireT<=0){
          this.aimT+=dt;
          this.pupilGlow = true; D.pupilM.emissiveIntensity = 1.4+this.aimT*6;
          if(this.aimT>0.75){
            this.aimT=0; this.fireT=this.boss?rand(1.1,1.9):rand(1.7,2.9);
            D.pupilM.emissiveIntensity=1.4;
            const from = D.gun.getWorldPosition(V3()); from.add(V3(0,0,0));
            const aimErr = angNorm(D.dome.rotation.y + r.rotation.y - Math.atan2(pp.x-pos.x, pp.z-pos.z));
            const to = V3(pp.x, pp.y+1.15, pp.z);
            if(Math.abs(aimErr)>0.10 || losBlocked(Z,pos.x,pos.z,pp.x,pp.z)){
              to.x += rand(-1.6,1.6); to.y += rand(-0.5,1.2); to.z += rand(-1.6,1.6);
              zapBeam(Z.scene, from, to, 0x7CFC00, 0.11);
            } else {
              zapBeam(Z.scene, from, to, 0x7CFC00, 0.11);
              damagePlayer(this.boss?20:15, pos);
            }
            A.dalekShot();
          }
        }
      } else { D.pupilM.emissiveIntensity = damp(D.pupilM.emissiveIntensity,1.4,4,dt); }
      this.sonicCharge=Math.max(0,this.sonicCharge-dt*0.5);
    },
    sonicHit(dt){
      if(!this.alive) return false;
      if(!this.alerted){ this.alerted=true; this.state='engage'; }
      this.sonicCharge+=dt;
      if(this.sonicCharge>=this.sonicNeed){ this.disable(); return true; }
      return false;
    },
    disable(){
      this.alive=false;
      for(const l of D.lights) l.emissiveIntensity=0;
      D.pupilM.emissiveIntensity=0; D.pupilM.color.set(0x222222);
      sparkBurst(Z.scene, this.root.position.clone().add(V3(0,1.4,0)), 0xffc06a, 40, 6, 0.9);
      A.cyberZap(); A.sweep(300,60,0.6,0.2,'sawtooth');
      const r=this.root; let k=0;
      addTrans(dt=>{ k+=dt*1.4; D.stalk.rotation.x=lerp(D.stalk.rotation.x,0.85,Math.min(k,1));
        r.rotation.z=lerp(r.rotation.z,0.09,Math.min(k,1)); r.rotation.x=lerp(r.rotation.x,0.05,Math.min(k,1)); return k<1; });
      floatText(Z.scene,'SYSTEMS OVERLOADED', this.root.position.clone().add(V3(0,2.1,0)), '#9fd8ff', 1.4);
      if(this.onDisabled) this.onDisabled();
    }
  };
  Z.enemies.push(E); return E;
}

/* =============================== CYBERMAN =============================== */
function mkCyberHead(){
  const g=new THREE.Group();
  const silver=M(0xb4b9c2,0.34,0.85), dark=M(0x23262b,0.5,0.6);
  const helm=rbox(0.205,0.235,0.215,0.06, silver); helm.position.y=0.06; g.add(helm);
  const face=rbox(0.165,0.17,0.02,0.02, M(0x9ba0aa,0.4,0.8)); face.position.set(0,0.055,0.107); g.add(face);
  for(const s of [-1,1]){
    g.add(at(cyl(0.031,0.031,0.014, dark, 12), s*0.048,0.085,0.118, PI/2,0,0));
    const tear=box(0.015,0.038,0.009, dark); tear.position.set(s*0.048,0.048,0.118); g.add(tear);
    g.add(at(cyl(0.021,0.021,0.20, silver, 10), s*0.118,0.075,0, 0,0,0));
    g.add(at(cyl(0.042,0.042,0.022, dark, 10), s*0.112,0.06,0, 0,0,PI/2));
  }
  g.add(at(cyl(0.021,0.021,0.26, silver, 10), 0,0.185,0, 0,0,PI/2));
  const mouth=box(0.09,0.016,0.01, dark); mouth.position.set(0,-0.012,0.112); g.add(mouth);
  g.traverse(m=>{ if(m.isMesh){ m.castShadow=true; } });
  return g;
}
function addCyberman(Z, x, z, opts={}){
  const P = mkPerson({
    height:1.98, headless:true, skin:0xb4b9c2, skinRough:0.34, skinMetal:0.85,
    top:0xaeb3bd, jacket:null, trousers:0xa6abb5, shoes:0x8f949e,
    gait:'march', swingMul:0.85, build:1.1,
  });
  // re-material body to metal
  P.root.traverse(m=>{ if(m.isMesh){ m.material = M(0xaeb3bd,0.36,0.85); } });
  P.neck.add(at(cyl(0.05,0.055,0.10, M(0x2a2d33,0.5,0.6),10),0,0.03,0));
  const head=mkCyberHead(); P.head.add(head);
  const chest=rbox(0.18,0.14,0.075,0.02, M(0x2a2d33,0.5,0.7)); chest.position.set(0,0.36,0.145); P.torso.add(chest);
  const lampM=new THREE.MeshStandardMaterial({color:0x9fd8ff, emissive:0x66d4ff, emissiveIntensity:0.9, roughness:0.3});
  const lamp=new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,0.01,12), lampM); lamp.rotation.x=PI/2; lamp.position.set(0,0.36,0.186); P.torso.add(lamp);
  for(const [grp,len,off] of [[P.shL,0.24,0.06],[P.shR,0.24,-0.06],[P.hipL,0.30,0.075],[P.hipR,0.30,-0.075]]){
    const tube=cap(0.0135,len, M(0x30343b,0.45,0.7)); tube.position.set(off,-0.16,0.0); grp.add(tube);
  }
  P.root.position.set(x, Z.groundHeight(x,z), z); Z.scene.add(P.root);
  const E={
    kind:'cyber', root:P.root, P, alive:true, alerted:false, sonicCharge:0, sonicNeed:1.7,
    home:{x,z,yaw:opts.yaw||0}, dormant:opts.dormant??false, zapT:0, stepT:0, lampM, label:'Cyberman',
    update(dt,t){
      if(!this.alive) return;
      const r=P.root, pos=r.position, pp=G.player.root.position;
      const pd=dist2(pos.x,pos.z,pp.x,pp.z);
      if(!this.alerted){
        if(!this.dormant && pd<19 && G.state==='play' && !losBlocked(Z,pos.x,pos.z,pp.x,pp.z)){
          this.alerted=true; floatText(Z.scene,'YOU WILL BE UPGRADED', pos.clone().add(V3(0,2.35,0)), '#bfe6ff');
          A.cyberZap();
        }
        P.speed=0; P.update(dt,t);
        r.rotation.y=angDamp(r.rotation.y,this.home.yaw,2,dt);
        return;
      }
      const jam=this.sonicCharge>0.2;
      this.zapT-=dt;
      if(pd>1.6){
        const a=Math.atan2(pp.x-pos.x, pp.z-pos.z);
        const spd=(jam?0.4:1.28);
        P.speed=spd; P.running=false;
        r.rotation.y=angDamp(r.rotation.y,a,4,dt);
        pos.x+=Math.sin(r.rotation.y)*spd*dt; pos.z+=Math.cos(r.rotation.y)*spd*dt;
        pos.y=Z.groundHeight(pos.x,pos.z);
        resolveStatic(Z,pos,0.42);
        this.stepT-=dt; if(this.stepT<=0 && pd<16){ this.stepT=0.62/Math.max(spd,0.1)*1.3; A.stomp(); }
      } else {
        P.speed=0;
        if(this.zapT<=0 && G.state==='play'){
          this.zapT=1.7;
          P.shR.rotation.x=-1.5;
          arcZap(Z.scene, P.handR.getWorldPosition(V3()), V3(pp.x,pp.y+1.2,pp.z));
          A.cyberZap(); damagePlayer(13, pos);
        }
      }
      P.headTarget=pp; P.update(dt,t);
      this.sonicCharge=Math.max(0,this.sonicCharge-dt*0.5);
    },
    sonicHit(dt){
      if(!this.alive) return false;
      this.alerted=true;
      this.sonicCharge+=dt;
      if(this.sonicCharge>=this.sonicNeed){ this.disable(); return true; }
      return false;
    },
    disable(){
      this.alive=false; this.lampM.emissiveIntensity=0; this.lampM.color.set(0x333);
      sparkBurst(Z.scene, P.head.getWorldPosition(V3()), 0xbfe6ff, 34, 5, 0.8);
      A.cyberZap();
      const r=P.root; let k=0; const y0=r.rotation.y;
      addTrans(dt=>{ k+=dt*1.1; const e=Math.min(k,1); const ee=e*e;
        r.rotation.x=-ee*PI/2*0.96; r.rotation.y=y0; r.position.y=Z.groundHeight(r.position.x,r.position.z)+ee*0.12;
        if(e>=1&&!this._thud){this._thud=true;A.stomp();}
        return e<1; });
      if(this.onDisabled) this.onDisabled();
    }
  };
  Z.enemies.push(E); return E;
}

/* =============================== WEEPING ANGEL =============================== */
function mkAngel(){
  const stone=M(0xaaa79b,0.92,0,{flat:true});
  const stoneD=M(0x8a877c,0.95,0,{flat:true});
  const root=new THREE.Group();
  // fluted robe
  const rg=new THREE.CylinderGeometry(0.27,0.50,1.18,40,6,true);
  const posA=rg.attributes.position;
  for(let i=0;i<posA.count;i++){
    const x=posA.getX(i), y=posA.getY(i), z=posA.getZ(i);
    const a=Math.atan2(z,x);
    const f=1+0.055*Math.sin(a*9)+0.025*Math.sin(y*6+a*2);
    posA.setX(i,x*f); posA.setZ(i,z*f);
  }
  rg.computeVertexNormals();
  const robe=new THREE.Mesh(rg, stone); robe.position.y=0.59; robe.castShadow=robe.receiveShadow=true; root.add(robe);
  root.add(at(cyl(0.50,0.54,0.06, stoneD, 24),0,0.03,0));
  // torso
  const torso=new THREE.Group(); torso.position.y=1.16; root.add(torso);
  const chest=rbox(0.33,0.36,0.23,0.08, stone); chest.position.y=0.16; torso.add(chest);
  const drape=cyl(0.20,0.30,0.28, stone, 14); drape.position.y=0.0; torso.add(drape);
  // arms
  const mkA=s=>{ const sh=new THREE.Group(); sh.position.set(s*0.215,0.30,0); torso.add(sh);
    const ua=cap(0.052,0.20, stone); ua.position.y=-0.15; sh.add(ua);
    const el=new THREE.Group(); el.position.y=-0.30; sh.add(el);
    const fa=cap(0.045,0.18, stone); fa.position.y=-0.13; el.add(fa);
    const hand=new THREE.Group(); hand.position.y=-0.27; el.add(hand);
    hand.add(rbox(0.075,0.10,0.035,0.014, stone));
    for(let i=0;i<4;i++){ const f=rbox(0.016,0.075,0.018,0.007, stone); f.position.set((i-1.5)*0.02,-0.075,0.004); hand.add(f); }
    return {sh,el,hand}; };
  const aL=mkA(1), aR=mkA(-1);
  // head
  const headG=new THREE.Group(); headG.position.y=0.56; torso.add(headG);
  const skull=sph(0.107, stone, 20, 14); skull.scale.set(0.95,1.08,0.98); skull.position.y=0.05; headG.add(skull);
  const jaw=rbox(0.115,0.08,0.10,0.03, stone); jaw.position.set(0,-0.005,0.012); headG.add(jaw);
  // carved wavy hair
  const hairCap=new THREE.Mesh(new THREE.SphereGeometry(0.115,18,10,0,TAU,0,PI*0.6), stoneD); hairCap.position.y=0.05; hairCap.rotation.x=-0.15; hairCap.castShadow=true; headG.add(hairCap);
  for(const s of [-1,1]){ const wv=cap(0.028,0.13, stoneD); wv.position.set(s*0.095,-0.01,-0.01); wv.rotation.z=s*0.15; headG.add(wv); }
  // face: hollow eyes, brow, nose, mouth (two states)
  for(const s of [-1,1]){
    const socket=sph(0.02, M(0x2a2a28,1,0), 8,6); socket.scale.set(1,0.8,0.5); socket.position.set(s*0.038,0.065,0.088); headG.add(socket);
    const br=box(0.04,0.011,0.014, stoneD); br.position.set(s*0.037,0.095,0.09); br.rotation.z=s*0.22; headG.add(br);
  }
  headG.add(at(cap(0.012,0.018, stone),0,0.045,0.10,-0.4,0,0));
  const mouthCalm=box(0.045,0.010,0.012, stoneD); mouthCalm.position.set(0,0.002,0.094); headG.add(mouthCalm);
  const mouthOpen=new THREE.Group(); mouthOpen.position.set(0,-0.002,0.088); mouthOpen.visible=false; headG.add(mouthOpen);
  const maw=sph(0.030, M(0x141412,1,0), 10,8); maw.scale.set(1.15,1.15,0.5); mouthOpen.add(maw);
  for(let i=0;i<4;i++){ const f=cone(0.0075,0.026, M(0xb8b4a6,0.8,0), 6); f.position.set((i-1.5)*0.017, i%2?0.026:-0.026, 0.012); f.rotation.x=i%2?PI:0; mouthOpen.add(f); }
  // wings
  const wings=[];
  for(const s of [-1,1]){
    const wg=new THREE.Group(); wg.position.set(s*0.13,1.52,-0.16); wg.rotation.y=s*0.35; root.add(wg);
    for(let i=0;i<4;i++){
      const fl=rbox(0.055, 0.62-i*0.09, 0.03, 0.014, i%2?stone:stoneD);
      fl.position.set(s*(0.06+i*0.085), 0.10-i*0.03, -0.02-i*0.012);
      fl.rotation.z=s*(0.28+i*0.24);
      wg.add(fl);
    }
    wings.push(wg);
  }
  root.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } });
  return {root, torso, headG, aL, aR, mouthCalm, mouthOpen, wings};
}
function addAngel(Z, x, z, opts={}){
  const An=mkAngel();
  An.root.position.set(x, Z.groundHeight(x,z), z);
  An.root.rotation.y=opts.yaw??rand(TAU);
  Z.scene.add(An.root);
  const E={
    kind:'angel', root:An.root, alive:true, alerted:false, immuneSonic:true, sonicNeed:99,
    home:{x,z,yaw:An.root.rotation.y}, pose:'weep', wasObserved:true, label:'Weeping Angel',
    setPose(p){
      this.pose=p;
      const L=An.aL, R=An.aR;
      if(p==='weep'){
        L.sh.rotation.set(-2.05,0,0.45); R.sh.rotation.set(-2.05,0,-0.45);
        L.el.rotation.x=1.75; R.el.rotation.x=1.75;
        L.hand.position.y=-0.27; R.hand.position.y=-0.27;
        An.headG.rotation.x=0.38; An.torso.rotation.x=0.06;
        An.mouthCalm.visible=true; An.mouthOpen.visible=false;
        for(const w of An.wings){ w.scale.setScalar(0.94); }
      } else {
        L.sh.rotation.set(-1.25,0,0.55); R.sh.rotation.set(-1.25,0,-0.55);
        L.el.rotation.x=0.28; R.el.rotation.x=0.28;
        An.headG.rotation.x=-0.10; An.torso.rotation.x=-0.04;
        An.mouthCalm.visible=false; An.mouthOpen.visible=true;
        for(const w of An.wings){ w.scale.setScalar(1.06); }
      }
    },
    observed(){
      if(G.state!=='play') return false;                    // menus = eyes closed
      const pos=An.root.position, cp=camera.position;
      const d=dist2(pos.x,pos.z,cp.x,cp.z);
      if(d>48) return false;
      const to=V3(pos.x-cp.x, (pos.y+1.55)-cp.y, pos.z-cp.z).normalize();
      const fwd=V3(); camera.getWorldDirection(fwd);
      const vf=camera.fov*PI/180;
      const hf=2*Math.atan(Math.tan(vf/2)*camera.aspect);
      const lim=Math.max(vf,hf)/2*1.06;
      if(fwd.angleTo(to)>lim) return false;
      if(losBlocked(Z,cp.x,cp.z,pos.x,pos.z)) return false;
      return true;
    },
    update(dt,t){
      if(!this.alive) return;
      const pos=An.root.position, pp=G.player.root.position;
      const obs=this.observed();
      const pd=dist2(pos.x,pos.z,pp.x,pp.z);
      if(!obs){
        if(this.wasObserved && pd<40){ A.sting(); }
        // move in the dark
        if(pd>1.15 && pd<44){
          const a=Math.atan2(pp.x-pos.x,pp.z-pos.z);
          const spd=pd>10?5.4:3.4;
          pos.x+=Math.sin(a)*spd*dt; pos.z+=Math.cos(a)*spd*dt;
          for(const o of Z.enemies) if(o!==this&&o.kind==='angel'&&o.alive){
            const dd=dist2(pos.x,pos.z,o.root.position.x,o.root.position.z);
            if(dd<1.4&&dd>0.001){ const aa=Math.atan2(pos.x-o.root.position.x,pos.z-o.root.position.z);
              pos.x+=Math.sin(aa)*(1.4-dd)*0.5; pos.z+=Math.cos(aa)*(1.4-dd)*0.5; } }
          resolveStatic(Z,pos,0.55);
          pos.y=Z.groundHeight(pos.x,pos.z);
          An.root.rotation.y=Math.atan2(pp.x-pos.x,pp.z-pos.z);
          this.setPose(pd<7?'reach':this.pose==='weep'&&pd<20?'reach':this.pose);
        }
        if(pd<=1.25 && G.state==='play') this.touch();
      }
      this.wasObserved=obs;
    },
    touch(){
      const flash=document.getElementById('whiteflash');
      flash.style.transition='none'; flash.style.opacity='0.95';
      setTimeout(()=>{ flash.style.transition='opacity 1.1s'; flash.style.opacity='0'; },60);
      A.sting(); A.bell();
      damagePlayer(30, An.root.position, true);
      // hurl the player back through time (toward spawn)
      const pp=G.player.root.position, sp=G.zone.spawn;
      const a=Math.atan2(sp.x-pp.x, sp.z-pp.z);
      pp.x+=Math.sin(a)*26; pp.z+=Math.cos(a)*26;
      pp.x=clamp(pp.x,-G.zone.bound,G.zone.bound); pp.z=clamp(pp.z,-G.zone.bound,G.zone.bound);
      pp.y=G.zone.groundHeight(pp.x,pp.z);
      say('Riley','It touched you! It threw you back— are you okay?!', 3.5, 'riley');
      // angel returns home
      An.root.position.set(this.home.x, G.zone.groundHeight(this.home.x,this.home.z), this.home.z);
      An.root.rotation.y=this.home.yaw;
      this.setPose('weep');
    },
    sonicHit(){ return false; }
  };
  E.setPose('weep');
  Z.enemies.push(E); return E;
}

/* =============================== AUTON =============================== */
function addAuton(Z, x, z, opts={}){
  const P=mkPerson({
    height:1.82, skin:0xd6cec2, skinRough:0.24, skinMetal:0.12,
    blankFace:true, hairStyle:'bald',
    jacket:opts.suit??0x565b63, coatLen:0.18, shirt:0xcac4b8, tie:0x3a3f47,
    top:0x565b63, trousers:opts.suit??0x565b63, shoes:0x1e1a16,
    gait:'stiff', swingMul:0.85,
  });
  const barrel=cyl(0.0145,0.0145,0.085, M(0x2a2d33,0.4,0.7), 8);
  barrel.rotation.x=PI/2; barrel.position.set(0,-0.10,0.045); barrel.visible=false;
  P.elR.add(barrel);
  P.root.position.set(x, Z.groundHeight(x,z), z);
  P.root.rotation.y=opts.yaw||0;
  Z.scene.add(P.root);
  const E={
    kind:'auton', root:P.root, P, alive:true, alerted:false, sonicCharge:0, sonicNeed:1.25,
    dormant:opts.dormant??true, home:{x,z,yaw:opts.yaw||0}, fireT:rand(1.5,3), barrel, label:'Auton',
    activate(){
      if(this.alerted||!this.alive) return;
      this.alerted=true; this.dormant=false;
      barrel.visible=true;
      P.handR.visible=false;
      A.breakGlass();
    },
    update(dt,t){
      if(!this.alive) return;
      const r=P.root,pos=r.position,pp=G.player.root.position;
      if(this.dormant){ P.speed=0; return; } // frozen mannequin — no idle sway
      const pd=dist2(pos.x,pos.z,pp.x,pp.z);
      const jam=this.sonicCharge>0.2;
      const a=Math.atan2(pp.x-pos.x,pp.z-pos.z);
      if(pd>10){ const spd=jam?0.4:1.55; P.speed=spd;
        r.rotation.y=angDamp(r.rotation.y,a,3.5,dt);
        pos.x+=Math.sin(r.rotation.y)*spd*dt; pos.z+=Math.cos(r.rotation.y)*spd*dt;
        pos.y=Z.groundHeight(pos.x,pos.z); resolveStatic(Z,pos,0.4);
      } else {
        P.speed=0; r.rotation.y=angDamp(r.rotation.y,a,5,dt);
        P.shR.rotation.x=damp(P.shR.rotation.x,-1.45,6,dt);
        this.fireT-=dt*(jam?0.3:1);
        if(this.fireT<=0 && G.state==='play' && !losBlocked(Z,pos.x,pos.z,pp.x,pp.z)){
          this.fireT=rand(1.9,3.4);
          const from=barrel.getWorldPosition(V3());
          const dir=V3(pp.x-from.x, pp.y+1.05-from.y, pp.z-from.z);
          spawnBolt(Z, from, dir, 20, 9);
          A.autonShot();
        }
      }
      P.update(dt,t);
      this.sonicCharge=Math.max(0,this.sonicCharge-dt*0.5);
    },
    sonicHit(dt){
      if(!this.alive||this.dormant) return false;
      this.sonicCharge+=dt;
      if(this.sonicCharge>=this.sonicNeed){ this.disable(); return true; }
      return false;
    },
    disable(){
      this.alive=false;
      sparkBurst(Z.scene, P.head.getWorldPosition(V3()), 0xffd9a8, 22, 4, 0.7);
      A.sweep(600,80,0.4,0.18,'square');
      const r=P.root; let k=0; const y0=r.rotation.y;
      addTrans(dt=>{ k+=dt*1.5; const e=Math.min(k,1);
        r.rotation.x=e*e*PI/2*0.92; r.rotation.y=y0;
        return e<1; });
      if(this.onDisabled) this.onDisabled();
    }
  };
  Z.enemies.push(E); return E;
}

function updateEnemies(Z, dt, t){ for(const e of Z.enemies) e.update(dt,t); updateProjectiles(Z,dt); }
