/* ============================== 03 CHARACTERS ==============================
   Articulated humanoids: 7.5-head proportions, real faces, layered clothing.
   Convention: characters face +Z at rotation.y=0; yawTo = atan2(dx,dz).      */

function mkPerson(o={}){
  o = Object.assign({
    height:1.75, build:1, skin:0xE8B792, hair:0x3a2a1c, hairStyle:'short', eye:0x4a6b8a,
    top:0x6b7280, jacket:null, coatLen:0, shirt:null, tie:null, trousers:0x3a4150, skirt:null,
    shoes:0x2a241f, hat:null, hatColor:0x2a2a2e, glasses:false,
    gait:'normal', swingMul:1, blankFace:false, headless:false,
    skinRough:0.75, skinMetal:0, helmetGlass:false,
  }, o);
  const b=o.build;
  const skin = M(o.skin, o.skinRough, o.skinMetal);
  const hairM = M(o.hair, 0.9, 0);
  const topM = M(o.jacket??o.top, 0.85, 0.02);
  const shirtM = M(o.shirt??o.top, 0.8, 0);
  const trouserM = M(o.trousers, 0.85, 0);
  const shoeM = M(o.shoes, 0.45, 0.1);
  const lipC = new THREE.Color(o.skin).multiplyScalar(0.82).lerp(new THREE.Color(0x8a4040), 0.4).getHex();

  const root = new THREE.Group();
  const hips = new THREE.Group(); hips.position.y = 0.98; root.add(hips);
  hips.add(rbox(0.30*b,0.20,0.19,0.06, o.skirt?M(o.skirt,0.85,0):trouserM));

  /* ---- torso ---- */
  const torso = new THREE.Group(); torso.position.y = 0.06; hips.add(torso);
  const waist = rbox(0.29*b,0.22,0.19,0.07, o.jacket&&o.coatLen>0.3?topM:(o.skirt?shirtM:(o.jacket?shirtM:topM))); waist.position.y=0.13; torso.add(waist);
  const chest = rbox(0.35*b,0.32,0.225,0.09, o.jacket?M(o.jacket,0.85,0.02):topM); chest.position.y=0.345; torso.add(chest);
  if(o.jacket){ // lapels + shirt strip + optional tie
    const strip = box(0.085,0.24,0.02, shirtM); strip.position.set(0,0.35,0.112); torso.add(strip);
    for(const s of [-1,1]){ const lap = box(0.06,0.20,0.022, M(o.jacket,0.8,0.02)); lap.position.set(s*0.058,0.39,0.118); lap.rotation.z = s*0.28; torso.add(lap); }
    if(o.tie){ const tk=box(0.035,0.03,0.015,M(o.tie,0.7,0)); tk.position.set(0,0.465,0.122); torso.add(tk);
      const tb=box(0.042,0.20,0.014,M(o.tie,0.7,0)); tb.position.set(0,0.35,0.121); torso.add(tb); }
  }
  for(const s of [-1,1]){ const col = box(0.075,0.045,0.05, o.jacket?M(o.jacket,0.8,0.02):topM); col.position.set(s*0.055,0.505,0.02); col.rotation.z=s*0.35; torso.add(col); }
  // trapezius / upper-back mass — kills the "flat box" torso read
  const bodyM = o.jacket?M(o.jacket,0.85,0.02):topM;
  const trap = rbox(0.185*b,0.085,0.15,0.05, bodyM); trap.position.set(0,0.48,-0.012); torso.add(trap);
  const upperBack = sph(0.155*b, bodyM, 16,12); upperBack.scale.set(1.02,0.82,0.72); upperBack.position.set(0,0.365,-0.026); torso.add(upperBack);
  if(!o.jacket && !o.skirt){ for(const s of [-1,1]){ const pec=sph(0.10*b, topM, 14,10); pec.scale.set(1,0.72,0.6); pec.position.set(s*0.082*b,0.40,0.10); torso.add(pec); } }

  /* coat tails / skirt */
  let coatF=null, coatB=null;
  if(o.jacket && o.coatLen>0){
    const L=o.coatLen, cm=M(o.jacket,0.85,0.02);
    coatF = new THREE.Group(); coatF.position.set(0,0.03,0); torso.add(coatF);
    for(const s of [-1,1]){ const p = rbox(0.135*b,L,0.035,0.015,cm); p.position.set(s*0.095*b,-L/2,0.095); coatF.add(p); }
    coatB = new THREE.Group(); coatB.position.set(0,0.03,0); torso.add(coatB);
    const bp = rbox(0.31*b,L,0.04,0.015,cm); bp.position.set(0,-L/2,-0.093); coatB.add(bp);
  }
  if(o.skirt){ const sk = cyl(0.165*b,0.27*b,0.42,M(o.skirt,0.9,0),18); sk.position.y=-0.12; hips.add(sk); }

  /* ---- arms ---- */
  const sleeveM = o.jacket?M(o.jacket,0.85,0.02):topM;
  const mkArm = s=>{
    const sh = new THREE.Group(); sh.position.set(s*(0.185*b+0.035),0.455,0); torso.add(sh);
    const delt = sph(0.06, sleeveM, 16,12); delt.scale.set(1,0.95,1); delt.position.set(s*-0.01,-0.01,0); sh.add(delt); // rounded shoulder
    const ua = cap(0.047,0.185, sleeveM); ua.position.y=-0.15; sh.add(ua);
    const el = new THREE.Group(); el.position.y=-0.29; sh.add(el);
    const elbow = sph(0.045, sleeveM, 12,10); el.add(elbow);
    const sleeveDown = o.jacket||o.sleeves!=='short';
    const fa = cap(0.04,0.17, sleeveDown?sleeveM:skin); fa.position.y=-0.125; el.add(fa);
    if(sleeveDown){ const cuff=cap(0.043,0.02,skin); cuff.position.y=-0.235; el.add(cuff); } // wrist skin
    const hand = new THREE.Group(); hand.position.y=-0.265; el.add(hand);
    const palm = rbox(0.068,0.08,0.04,0.018, skin); palm.position.y=-0.035; hand.add(palm);
    for(let i=0;i<4;i++){ const fg=rbox(0.0155,0.062,0.03,0.007, skin); fg.position.set((i-1.5)*0.0175,-0.10,0.002); hand.add(fg); }
    const th = rbox(0.021,0.05,0.026,0.01, skin); th.position.set(s*0.038,-0.035,0.012); th.rotation.z=s*0.6; hand.add(th);
    return {sh,el,hand};
  };
  const armL = mkArm(1), armR = mkArm(-1);

  /* ---- legs ---- */
  const legM = o.skirt?skin:trouserM;
  const mkLeg = s=>{
    const hip = new THREE.Group(); hip.position.set(s*0.095*b,-0.03,0); hips.add(hip);
    const th = cap(0.07,0.30, legM); th.position.y=-0.215; hip.add(th);
    const kn = new THREE.Group(); kn.position.y=-0.43; hip.add(kn);
    const knee = sph(0.058, legM, 12,10); knee.scale.set(1,0.9,1); kn.add(knee);
    const sh2 = cap(0.05,0.32, legM); sh2.position.y=-0.21; kn.add(sh2);
    const calf = sph(0.062, legM, 12,10); calf.scale.set(0.9,1.3,0.85); calf.position.set(0,-0.16,-0.02); kn.add(calf);
    const foot = new THREE.Group(); foot.position.y=-0.45; kn.add(foot);
    const ankle = sph(0.045, o.skirt?skin:M(o.shoes,0.5,0.1), 10,8); foot.add(ankle);
    const f = rbox(0.092,0.062,0.20,0.025, shoeM); f.position.set(0,-0.06,0.05); foot.add(f);
    const toe = rbox(0.088,0.05,0.09,0.03, shoeM); toe.position.set(0,-0.062,0.155); foot.add(toe);
    return {hip,kn,foot};
  };
  const legL = mkLeg(1), legR = mkLeg(-1);

  /* ---- head ---- */
  const neck = new THREE.Group(); neck.position.y=0.505; torso.add(neck);
  const head = new THREE.Group(); head.position.y=0.095; neck.add(head);
  if(!o.headless){
    neck.add(at(cyl(0.047,0.052,0.10, skin,12), 0,0.03,0));
    const skull = sph(0.104, skin, 24, 18); skull.scale.set(0.94,1.06,0.98); skull.position.y=0.062; head.add(skull);
    const jaw = rbox(0.115,0.085,0.10,0.035, skin); jaw.position.set(0,0.005,0.012); head.add(jaw);
    for(const s of [-1,1]){ const ear=sph(0.017,skin,8,6); ear.scale.set(0.5,1,0.7); ear.position.set(s*0.100,0.055,0.002); head.add(ear); }
    if(!o.blankFace){
      const eyeW=M(0xf6f4ec,0.28,0,{emissive:0xe6e4dc, ei:0.15});   // faint self-read so eyes never go pure-black
      const browC=new THREE.Color(o.hair).lerp(new THREE.Color(o.skin),0.32).getHex();
      const browM=M(browC,0.9,0);
      for(const s of [-1,1]){
        const eg = new THREE.Group(); eg.position.set(s*0.037,0.073,0.088); head.add(eg);
        const w = sph(0.023, eyeW, 12,9); w.scale.set(1,0.86,0.62); eg.add(w);
        const ir = sph(0.0115, M(o.eye,0.28,0), 10,8); ir.scale.set(1,1,0.6); ir.position.z=0.014; eg.add(ir);
        const pu = sph(0.0055, M(0x0a0a0a,0.3,0), 8,6); pu.scale.set(1,1,0.6); pu.position.z=0.0185; eg.add(pu);
        const lid = rbox(0.052,0.014,0.032,0.006, skin); lid.position.set(s*0.037,0.089,0.086); lid.rotation.z=-s*0.07; head.add(lid); // lit eyelid softens the socket
        const cheek = rbox(0.05,0.03,0.03,0.01, skin); cheek.position.set(s*0.04,0.05,0.084); head.add(cheek);
        const br = box(0.034,0.0065,0.013, browM); br.position.set(s*0.037,0.101,0.094); br.rotation.z=-s*0.10; head.add(br);
      }
      const nb = cap(0.012,0.018, skin); nb.rotation.x=-0.4; nb.position.set(0,0.05,0.101); head.add(nb);
      const nt = sph(0.0135, skin, 8,6); nt.position.set(0,0.036,0.107); head.add(nt);
      const lip = rbox(0.044,0.012,0.014,0.005, M(lipC,0.55,0)); lip.position.set(0,0.011,0.095); head.add(lip);
    }
    /* hair */
    const hs=o.hairStyle;
    if(hs!=='bald'){
      const capm = new THREE.Mesh(new THREE.SphereGeometry(0.112,20,12,0,TAU,0,PI*0.62), hairM);
      capm.castShadow=true; capm.scale.set(0.96,1.0,0.99); capm.position.y=0.062; capm.rotation.x=-0.22; head.add(capm);
      const back = rbox(0.185,0.11,0.05,0.02, hairM); back.position.set(0,0.045,-0.078); head.add(back);
      if(hs==='messy') for(let i=0;i<6;i++){ const c=rbox(rand(0.03,0.06),rand(0.02,0.035),rand(0.03,0.06),0.008, hairM);
        c.position.set(rand(-0.07,0.07),0.145+rand(-0.02,0.02),rand(-0.06,0.05)); c.rotation.set(rand(-0.4,0.4),rand(TAU),rand(-0.4,0.4)); head.add(c); }
      if(hs==='long'){ const bk = rbox(0.20,0.30,0.07,0.03, hairM); bk.position.set(0,-0.055,-0.075); head.add(bk);
        for(const s of [-1,1]){ const st=rbox(0.045,0.22,0.06,0.02,hairM); st.position.set(s*0.095,-0.02,0.01); head.add(st); } }
      if(hs==='ponytail'){ const bn=sph(0.036,hairM,10,8); bn.position.set(0,0.055,-0.112); head.add(bn);
        const tl=cap(0.023,0.15,hairM); tl.position.set(0,-0.045,-0.135); tl.rotation.x=0.45; head.add(tl); }
      if(hs==='bun'){ const bn=sph(0.042,hairM,10,8); bn.position.set(0,0.10,-0.088); head.add(bn); }
      if(hs==='fringe'){ const fr=rbox(0.15,0.045,0.03,0.012,hairM); fr.position.set(0,0.135,0.082); fr.rotation.x=0.25; head.add(fr); }
    }
    if(o.glasses){
      const gm=M(0x1a1a1e,0.4,0.4);
      for(const s of [-1,1]){ const rim=tor(0.027,0.0038,gm,8,18); rim.position.set(s*0.038,0.072,0.099); head.add(rim);
        const arm=box(0.004,0.004,0.09,gm); arm.position.set(s*0.098,0.075,0.045); head.add(arm); }
      const bridge=box(0.026,0.004,0.004,gm); bridge.position.set(0,0.078,0.101); head.add(bridge);
    }
    if(o.hat==='fedora'){ const hm=M(o.hatColor,0.85,0);
      head.add(at(cyl(0.146,0.146,0.014,hm,20),0,0.115,0), at(cyl(0.088,0.098,0.095,hm,16),0,0.168,0), at(cyl(0.099,0.099,0.02,M(0x14100c,0.8,0),16),0,0.132,0)); }
    if(o.hat==='helmet'){ const hm=M(o.hatColor,0.6,0.05); // bobby custodian helmet
      const dome=new THREE.Mesh(new THREE.SphereGeometry(0.115,18,12,0,TAU,0,PI*0.6),hm); dome.castShadow=true; dome.scale.set(0.98,1.5,0.98); dome.position.y=0.058; head.add(dome);
      head.add(at(cyl(0.135,0.135,0.02,hm,20),0,0.095,0), at(sph(0.014,M(0xc9cdd4,0.3,0.9),8,6),0,0.245,0));
      const badge=box(0.03,0.045,0.006,M(0xc9cdd4,0.35,0.9)); badge.position.set(0,0.15,0.104); head.add(badge); }
    if(o.hat==='cloche'){ const hm=M(o.hatColor,0.9,0);
      const d=new THREE.Mesh(new THREE.SphereGeometry(0.118,18,12,0,TAU,0,PI*0.68),hm); d.castShadow=true; d.scale.set(1,1.15,1); d.position.y=0.045; head.add(d); }
    if(o.hat==='flatcap'){ const hm=M(o.hatColor,0.9,0);
      const d=new THREE.Mesh(new THREE.SphereGeometry(0.115,16,10,0,TAU,0,PI*0.5),hm); d.castShadow=true; d.scale.set(1,0.6,1.1); d.position.y=0.085; head.add(d);
      const brim=cyl(0.075,0.09,0.012,hm,12); brim.position.set(0,0.075,0.105); head.add(brim); }
    if(o.helmetGlass){ // space suit bubble
      const g=sph(0.155, M(0xbfe2ff,0.05,0.1,{transparent:true,opacity:0.22}), 20,14); g.position.y=0.06; g.castShadow=false; head.add(g);
      const ring=tor(0.105,0.014,M(0xd8dde4,0.4,0.8),8,20); ring.rotation.x=PI/2; ring.position.y=-0.045; head.add(ring);
    }
  }

  const P = {
    root, o, hips, torso, head, neck,
    shL:armL.sh, elL:armL.el, handL:armL.hand, shR:armR.sh, elR:armR.el, handR:armR.hand,
    hipL:legL.hip, knL:legL.kn, ftL:legL.foot, hipR:legR.hip, knR:legR.kn, ftR:legR.foot,
    coatF, coatB,
    speed:0, running:false, talking:false, headTarget:null, phase:rand(20), dead:false,
    baseHip:0.98,
    update(dt,t){
      if(this.dead) return;
      const sp=this.speed, norm=clamp(sp/2.4,0,1.4);
      const stiff = this.o.gait==='stiff', march = this.o.gait==='march';
      this.phase += dt*(3.0+sp*(march?1.6:2.3));
      const ph=this.phase;
      const sw=(stiff?0.32:march?0.46:0.56)*Math.min(norm,1.1)*this.o.swingMul;
      // legs
      this.hipL.rotation.x = Math.sin(ph)*sw;
      this.hipR.rotation.x = Math.sin(ph+PI)*sw;
      const kL = clamp(Math.sin(ph+2.0),0,1)*(stiff?0.35:1.0)*sw*1.25;
      const kR = clamp(Math.sin(ph+PI+2.0),0,1)*(stiff?0.35:1.0)*sw*1.25;
      this.knL.rotation.x = -kL; this.knR.rotation.x = -kR;
      this.ftL.rotation.x = clamp((this.hipL.rotation.x - kL)*-0.45, -0.35, 0.5);
      this.ftR.rotation.x = clamp((this.hipR.rotation.x - kR)*-0.45, -0.35, 0.5);
      // arms
      const asw = sw*(stiff?0.35:march?0.8:0.78);
      this.shL.rotation.x = Math.sin(ph+PI)*asw; this.shL.rotation.z = 0.075;
      this.shR.rotation.x = Math.sin(ph)*asw;    this.shR.rotation.z = -0.075;
      const eBase = stiff?0.06:0.26;
      this.elL.rotation.x = eBase + clamp(Math.sin(ph+PI),0,1)*0.32*asw;
      this.elR.rotation.x = eBase + clamp(Math.sin(ph),0,1)*0.32*asw;
      // torso & hips
      this.hips.position.y = this.baseHip - Math.abs(Math.cos(ph))*0.042*norm + Math.sin(t*1.6+this.phase*0.01)*0.006;
      this.torso.rotation.y = Math.sin(ph)*0.065*norm;
      this.torso.rotation.x = 0.045*norm + (this.running?0.09:0);
      this.torso.rotation.z = Math.sin(ph)*0.025*norm;
      if(this.coatF){ this.coatF.rotation.x = -0.10 - 0.38*norm - Math.max(0,Math.sin(ph*2))*0.05*norm; this.coatB.rotation.x = 0.06 + 0.42*norm; }
      // idle
      if(norm<0.04){
        const ib=Math.sin(t*1.55+this.phase);
        this.torso.rotation.x = ib*0.008; this.hips.rotation.z = Math.sin(t*0.4+this.phase)*0.018;
        this.shL.rotation.x *= 0.2; this.shR.rotation.x *= 0.2;
        if(this.talking){
          this.head.rotation.x = Math.sin(t*4.1)*0.035;
          const g = Math.sin(t*0.85+this.phase);
          if(g>0.55){ this.elR.rotation.x = damp(this.elR.rotation.x, 1.05, 4, dt); this.shR.rotation.x = damp(this.shR.rotation.x, -0.35, 4, dt); }
        }
      } else this.head.rotation.x = damp(this.head.rotation.x,0,6,dt);
      // head look
      if(this.headTarget){
        const p=this.root.position, dx=this.headTarget.x-p.x, dz=this.headTarget.z-p.z;
        const d=Math.sqrt(dx*dx+dz*dz)||1;
        const wantY = clamp(angNorm(Math.atan2(dx,dz)-this.root.rotation.y), -1.05, 1.05);
        const wantX = clamp(-Math.atan2(this.headTarget.y-(p.y+1.62), d)*0.8, -0.5, 0.4);
        this.head.rotation.y = angDamp(this.head.rotation.y, wantY, 7, dt);
        this.neck.rotation.x = damp(this.neck.rotation.x, wantX, 7, dt);
      } else {
        this.head.rotation.y = angDamp(this.head.rotation.y, norm<0.04?Math.sin(t*0.31+this.phase)*0.15:0, 3, dt);
        this.neck.rotation.x = damp(this.neck.rotation.x, 0, 4, dt);
      }
    }
  };
  root.scale.setScalar(o.height/1.75);
  root.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } });
  return P;
}

/* ---------- the Doctor ---------- */
function mkDoctor(){
  const P = mkPerson({
    height:1.83, skin:0xE8B792, hair:0x33241a, hairStyle:'messy', eye:0x5a4632,
    jacket:0x4a3728, coatLen:0.55, shirt:0xe9e5da, tie:0x6b2030, top:0x2b2622,
    trousers:0x2b2622, shoes:0x8a2a24,
  });
  // sonic screwdriver in right hand
  const sonic = new THREE.Group();
  const body = cyl(0.0095,0.011,0.115, M(0x2e3238,0.35,0.85), 10); sonic.add(body);
  const grip = cyl(0.0125,0.0125,0.03, M(0x6b5a3a,0.5,0.6), 10); grip.position.y=-0.03; sonic.add(grip);
  const tipM = new THREE.MeshStandardMaterial({color:0x9fd8ff, emissive:0x54c2ff, emissiveIntensity:0, roughness:0.3});
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.014,10,8), tipM); tip.position.y=0.066; sonic.add(tip);
  sonic.position.set(0,-0.09,0.045); sonic.rotation.x=PI/2 - 0.35;
  P.handR.add(sonic);
  const sl = new THREE.PointLight(0x54c2ff, 0, 4.5, 1.8); tip.add(sl);
  P.sonic=sonic; P.sonicTipM=tipM; P.sonicLight=sl; P.sonicTip=tip;
  return P;
}

/* ---------- Riley Vance, companion ---------- */
function mkRiley(){
  const P = mkPerson({
    height:1.68, skin:0xE2AC85, hair:0x5b3a1e, hairStyle:'ponytail', eye:0x4a7a52,
    jacket:0x992f2a, coatLen:0.16, shirt:0xe6e2dc, top:0xe6e2dc,
    trousers:0x2a3550, shoes:0xd8d4cc, build:0.92,
  });
  P.o.name='Riley';
  return P;
}

/* ---------- era NPC generator ---------- */
const SKINS=[0xF1C9A8,0xE8B792,0xDCA57E,0xC98E63,0xA96C44,0x8D5A3B,0x6B4226];
const HAIRC=[0x1d1a16,0x33241a,0x5b3a1e,0x7a5a30,0x9a8560,0xb8b2a8,0x555046,0x2e2a26];
function mkNPC(era, opt={}){
  const skin=pick(SKINS), hair=pick(HAIRC);
  let cfg;
  if(era==='1963'){
    const fem = opt.fem ?? (Math.random()<0.45);
    if(fem) cfg={ skin, hair, hairStyle:pick(['bun','cloche-hair','long','bun']), skirt:pick([0x5a4a5e,0x6e3b3b,0x3f5147,0x4a4a58]),
      jacket:pick([0x6e5a4a,0x8a6a55,0x5a5248]), coatLen:0.32, shirt:0xd8d0c2, top:0xd8d0c2, trousers:0x3a3630,
      shoes:0x2a241f, hat:Math.random()<0.5?'cloche':null, hatColor:pick([0x4a3b45,0x5e4a38,0x37424e]), build:0.9, height:rand(1.58,1.72) };
    else cfg={ skin, hair, hairStyle:pick(['short','short','combover','bald']),
      jacket:pick([0x4a453c,0x3a3f4a,0x54483c,0x2e3238]), coatLen:Math.random()<0.5?0.42:0.18, shirt:0xd8d4c8, tie:pick([0x5a2a2a,0x2a3a5a,0x3a4a3a]),
      top:0x4a453c, trousers:pick([0x3a3f48,0x2e2b28,0x4a443c]), shoes:0x201c18,
      hat:Math.random()<0.6?pick(['fedora','flatcap']):null, hatColor:pick([0x3a352e,0x2a2e38,0x4a4238]),
      glasses:Math.random()<0.25, build:rand(0.95,1.12), height:rand(1.66,1.86) };
    if(cfg.hairStyle==='cloche-hair') cfg.hairStyle='long';
  } else if(era==='moon'){
    cfg={ skin, hair, hairStyle:pick(['short','ponytail','bald','short']),
      top:pick([0xd8dde4,0xc9d2dc]), trousers:0x8a919c, shoes:0x4a4f58,
      jacket:pick([0x647084,0x5a6a7a]), coatLen:0, shirt:0xd8dde4, glasses:Math.random()<0.3,
      build:rand(0.95,1.05), height:rand(1.62,1.85) };
  } else if(era==='thal'){
    cfg={ skin:0xF1D2B0, hair:0xE8DCC0, hairStyle:'long', eye:0x7a9ab5,
      jacket:0x8a8272, coatLen:0.3, shirt:0xc9bfa8, top:0xc9bfa8, trousers:0x6e6656, shoes:0x4a4238,
      build:0.94, height:1.74 };
  } else { // modern
    cfg={ skin, hair, hairStyle:pick(['short','long','ponytail','messy']),
      jacket:pick([0x3a4a5e,0x5e4a3a,0x2e3e33,0x555]), coatLen:pick([0,0.18,0.3]), shirt:pick([0xd8d4cc,0x9aa8b8]),
      top:pick([0x6e7a8a,0x8a6e5e]), trousers:pick([0x2a3550,0x3a3f48]), shoes:pick([0x2a241f,0xd8d4cc]),
      build:rand(0.9,1.1), height:rand(1.6,1.86) };
  }
  Object.assign(cfg, opt);
  return mkPerson(cfg);
}

/* ---------- NPC wrapper with wander/converse/flee logic ---------- */
function addNPC(Z, P, name, dlgId, x, z, yaw=0, opts={}){
  P.root.position.set(x, Z.groundHeight(x,z), z);
  P.root.rotation.y = yaw;
  Z.scene.add(P.root);
  const N = {
    P, name, dlg:dlgId, home:{x,z,yaw}, wanderR:opts.wanderR??0, state:'idle',
    tx:x, tz:z, waitT:rand(2,6), fearless:opts.fearless??false, pinned:opts.pinned??false,
    update(dt,t){
      const r=P.root, pos=r.position;
      // fear check
      let danger=null;
      if(!this.fearless) for(const e of Z.enemies){ if(e.alive && e.alerted && dist2(pos.x,pos.z,e.root.position.x,e.root.position.z)<14){ danger=e; break; } }
      if(this.state==='converse'){
        P.speed=0; P.talking=true; P.headTarget=G.player.root.position;
        r.rotation.y = angDamp(r.rotation.y, Math.atan2(G.player.root.position.x-pos.x, G.player.root.position.z-pos.z), 6, dt);
        P.update(dt,t); return;
      }
      P.talking=false;
      if(danger){
        this.state='flee';
        const away=Math.atan2(pos.x-danger.root.position.x, pos.z-danger.root.position.z);
        this.tx=pos.x+Math.sin(away)*10; this.tz=pos.z+Math.cos(away)*10;
      } else if(this.state==='flee') { this.state='idle'; this.waitT=rand(1,3); this.tx=this.home.x; this.tz=this.home.z; }
      // player proximity → face them
      const pd=dist2(pos.x,pos.z,G.player.root.position.x,G.player.root.position.z);
      P.headTarget = pd<6 ? G.player.root.position : null;
      if(this.state==='idle'){
        P.speed=0;
        if(!this.pinned && this.wanderR>0){ this.waitT-=dt;
          if(this.waitT<=0){ this.state='walk';
            const a=rand(TAU), rr=rand(this.wanderR*0.3,this.wanderR);
            this.tx=this.home.x+Math.sin(a)*rr; this.tz=this.home.z+Math.cos(a)*rr; } }
        if(pd<3.4 && !this.pinned) r.rotation.y = angDamp(r.rotation.y, Math.atan2(G.player.root.position.x-pos.x, G.player.root.position.z-pos.z), 4, dt);
        else if(this.pinned) r.rotation.y = angDamp(r.rotation.y, this.home.yaw, 3, dt);
      }
      if(this.state==='walk'||this.state==='flee'){
        const dx=this.tx-pos.x, dz=this.tz-pos.z, d=Math.sqrt(dx*dx+dz*dz);
        if(d<0.5){ this.state='idle'; this.waitT=rand(3,9); P.speed=0; }
        else{
          const spd=this.state==='flee'?4.6:1.25;
          P.speed=spd; P.running=this.state==='flee';
          r.rotation.y = angDamp(r.rotation.y, Math.atan2(dx,dz), 8, dt);
          pos.x += Math.sin(r.rotation.y)*spd*dt; pos.z += Math.cos(r.rotation.y)*spd*dt;
          pos.y = Z.groundHeight(pos.x,pos.z);
          resolveStatic(Z,pos,0.3);
        }
      }
      P.update(dt,t);
    }
  };
  Z.npcs.push(N);
  addInteract(Z, { get x(){return P.root.position.x;}, get z(){return P.root.position.z;}, r:2.3,
    label:()=>`Talk to <b>${name}</b>`, cond:()=>!G.flags.combatLock,
    action:()=>{ openDialogue(dlgId, N); } });
  return N;
}

/* push a point out of zone static colliders */
function resolveStatic(Z, pos, r){
  for(const c of Z.circles){
    const dx=pos.x-c.x, dz=pos.z-c.z, d=Math.sqrt(dx*dx+dz*dz), min=c.r+r;
    if(d<min && d>0.0001){ pos.x=c.x+dx/d*min; pos.z=c.z+dz/d*min; }
  }
  for(const b of Z.aabbs){
    if(pos.x>b.x1-r && pos.x<b.x2+r && pos.z>b.z1-r && pos.z<b.z2+r){
      const dl=pos.x-(b.x1-r), dr=(b.x2+r)-pos.x, dn=pos.z-(b.z1-r), df=(b.z2+r)-pos.z;
      const m=Math.min(dl,dr,dn,df);
      if(m===dl)pos.x=b.x1-r; else if(m===dr)pos.x=b.x2+r; else if(m===dn)pos.z=b.z1-r; else pos.z=b.z2+r;
    }
  }
  const d0=Math.sqrt(pos.x*pos.x+pos.z*pos.z);
  if(d0>Z.bound){ pos.x*=Z.bound/d0; pos.z*=Z.bound/d0; }
}
