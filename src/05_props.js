/* ============================== 05 PROPS & ARCHITECTURE ============================== */

/* ---------- TARDIS exterior ---------- */
function mkTardisExterior(){
  const root=new THREE.Group();
  const blue=MAT.tardisBlue, dark=MAT.tardisDark;
  root.add(at(box(1.52,0.13,1.52, M(0x0a2646,0.7,0)),0,0.065,0));
  for(const sx of [-1,1]) for(const sz of [-1,1]) root.add(at(box(0.17,2.44,0.17, blue), sx*0.62,1.35,sz*0.62));
  for(let side=0;side<4;side++){
    const g=new THREE.Group(); g.rotation.y=side*PI/2; root.add(g);
    g.add(at(box(1.10,2.44,0.07, blue),0,1.35,0.575));
    for(let cx=0;cx<2;cx++) for(let ry=0;ry<4;ry++){
      const px=(cx-0.5)*0.52, py=0.43+ry*0.492;
      if(ry===3){
        const win=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.36),
          new THREE.MeshStandardMaterial({color:0xfdf6da,emissive:0xffedb8,emissiveIntensity:0.75,roughness:0.4}));
        win.position.set(px,py+0.72,0.615); g.add(win);
        const f1=box(0.46,0.40,0.025, dark); f1.position.set(px,py+0.72,0.605); g.add(f1);
        for(const fx of [-0.07,0.07]) g.add(at(box(0.012,0.36,0.03, dark),px+fx,py+0.72,0.62));
        g.add(at(box(0.42,0.012,0.03, dark),px,py+0.72,0.62));
        g.add(at(box(0.42,0.012,0.03, dark),px,py+0.60,0.62));
        g.add(at(box(0.42,0.012,0.03, dark),px,py+0.84,0.62));
      } else {
        const pan=box(0.44,0.44,0.045, dark); pan.position.set(px,py+0.62,0.60); g.add(pan);
      }
    }
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.30,0.235),
      new THREE.MeshStandardMaterial({map:TEX.policeSign, emissive:0xcfe0f2, emissiveMap:TEX.policeSign, emissiveIntensity:0.38, roughness:0.6}));
    sign.position.set(0,2.72,0.63); g.add(sign);
    g.add(at(box(1.38,0.30,0.09, blue),0,2.72,0.575));
    if(side===0){
      const note=new THREE.Mesh(new THREE.PlaneGeometry(0.30,0.38),
        new THREE.MeshStandardMaterial({map:TEX.tardisNote, roughness:0.85}));
      note.position.set(-0.26,1.72,0.617); g.add(note);
      g.add(at(sph(0.022, M(0xd8d4c8,0.4,0.6),8,6), 0.13,1.30,0.625));
    }
  }
  root.add(at(box(1.46,0.10,1.46, blue),0,2.92,0));
  root.add(at(box(1.18,0.13,1.18, blue),0,3.02,0));
  root.add(at(box(0.85,0.10,0.85, blue),0,3.12,0));
  root.add(at(cyl(0.085,0.10,0.09, dark, 10),0,3.22,0));
  const lampM=new THREE.MeshStandardMaterial({color:0xfdf3d0,emissive:0xffe9a8,emissiveIntensity:1.1,roughness:0.3});
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(0.075,12,9), lampM); lamp.position.y=3.32; root.add(lamp);
  root.add(at(cyl(0.10,0.02,0.05, dark, 10),0,3.40,0));
  const lampLight=new THREE.PointLight(0xffe0a0, 12, 9, 1.9); lampLight.position.y=3.35; root.add(lampLight);
  root.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } });
  return {root, lampM, lampLight};
}
/* places tardis in a zone + registers collider & door interaction */
function placeTardis(Z){
  if(!Z.tardis) return null;
  const T=mkTardisExterior();
  const {x,z,yaw}=Z.tardis;
  T.root.position.set(x, Z.groundHeight(x,z), z); T.root.rotation.y=yaw;
  Z.scene.add(T.root); markStatic(T.root);
  circ(Z, x, z, 1.05);
  Z.tardisObj=T;
  const dx=Math.sin(yaw), dz=Math.cos(yaw);
  addInteract(Z, {x:x+dx*1.35, z:z+dz*1.35, r:1.6,
    label:()=>'Enter the <b>TARDIS</b>',
    action:()=>enterTardis() });
  return T;
}

/* ---------- TARDIS console room pieces ---------- */
function mkConsole(){
  const root=new THREE.Group();
  const brass=M(0x6e5a38,0.5,0.7), darkm=M(0x232830,0.6,0.4);
  root.add(at(cyl(1.05,1.18,0.55,darkm,6),0,0.275,0));
  root.add(at(cyl(0.55,0.75,0.55,brass,6),0,0.82,0));
  const blinkers=[], levers=[];
  for(let i=0;i<6;i++){
    const pg=new THREE.Group(); pg.rotation.y=i*PI/3+PI/6; root.add(pg);
    const panel=box(1.16,0.055,0.78, M(0x3a4048,0.45,0.55));
    panel.position.set(0,1.02,1.02); panel.rotation.x=-0.42; pg.add(panel);
    for(let k=0;k<9;k++){
      const lx=rand(-0.48,0.48), lz=rand(-0.28,0.30), kind=Math.random();
      const local=new THREE.Group(); local.position.set(lx,0.045,lz); panel.add(local);
      if(kind<0.42){
        const c=pick([0xff5a4a,0x5ad2ff,0xffd05a,0x7aff8a,0xffffff]);
        const bm=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:rand(0.3,1.2),roughness:0.35});
        const b=new THREE.Mesh(new THREE.CylinderGeometry(rand(0.02,0.037),rand(0.025,0.042),0.035,10),bm);
        local.add(b); if(Math.random()<0.6) blinkers.push(bm);
      } else if(kind<0.7){
        local.add(at(cyl(0.014,0.02,0.028,brass,8),0,0,0));
        const rod=cyl(0.008,0.008,0.11,MAT.silver,6); rod.position.y=0.05; rod.rotation.x=rand(-0.5,0.5); local.add(rod);
        const kn=sph(0.02,M(pick([0x9a1c1c,0x1a1a1e,0xd8d4c8]),0.4,0.2),8,6); kn.position.set(0,0.105*Math.cos(rod.rotation.x),0.105*Math.sin(rod.rotation.x)); local.add(kn);
      } else if(kind<0.88){
        local.add(at(sph(rand(0.02,0.035),M(pick([0x8a8f98,0x6e5a38]),0.4,0.7),10,8),0,0.008,0));
      } else {
        const scr=new THREE.Mesh(new THREE.PlaneGeometry(0.16,0.10),
          new THREE.MeshStandardMaterial({color:0x0a1a1c,emissive:0x2affd8,emissiveIntensity:0.5,roughness:0.4}));
        scr.rotation.x=-PI/2+0.2; scr.position.y=0.02; local.add(scr);
      }
    }
  }
  // main travel lever (front panel)
  const lg=new THREE.Group(); lg.position.set(0,1.13,0.92); root.add(lg);
  lg.add(at(box(0.09,0.05,0.16,brass),0,0,0));
  const leverArm=new THREE.Group(); lg.add(leverArm);
  const lr=cyl(0.014,0.014,0.24,MAT.silver,8); lr.position.y=0.12; leverArm.add(lr);
  const lk=sph(0.035,M(0x9a1c1c,0.35,0.3),10,8); lk.position.y=0.25; leverArm.add(lk);
  leverArm.rotation.x=0.55;
  // time rotor
  const rotor=new THREE.Group(); rotor.position.y=1.30; root.add(rotor);
  const glass=new THREE.Mesh(new THREE.CylinderGeometry(0.40,0.40,1.5,18,1,true),
    new THREE.MeshStandardMaterial({color:0xbfeaff,transparent:true,opacity:0.16,roughness:0.08,metalness:0.1,side:THREE.DoubleSide}));
  glass.position.y=0.75; rotor.add(glass);
  rotor.add(at(cyl(0.46,0.42,0.10,brass,18),0,0.03,0));
  rotor.add(at(cyl(0.42,0.46,0.10,brass,18),0,1.5,0));
  const rotorCols=[];
  for(let i=0;i<3;i++){
    const a=i/3*TAU;
    const colM=new THREE.MeshStandardMaterial({color:0xbfffff,emissive:0x5ad2ff,emissiveIntensity:1.5,roughness:0.3,transparent:true,opacity:0.92});
    const col=new THREE.Mesh(new THREE.CapsuleGeometry(0.085,0.42,4,10), colM);
    col.position.set(Math.sin(a)*0.20,0.75,Math.cos(a)*0.20);
    rotor.add(col); rotorCols.push(col);
  }
  rotor.add(at(cyl(0.05,0.05,1.4,brass,8),0,0.75,0));
  const rotorLight=new THREE.PointLight(0x66d9ff, 26, 16, 1.6); rotorLight.position.y=2.1; root.add(rotorLight);
  // monitor arm
  const mon=new THREE.Group(); mon.position.set(0.95,1.45,0.45); mon.rotation.y=-0.5; root.add(mon);
  mon.add(at(cyl(0.02,0.02,0.5,darkm,8),0,-0.2,0,0,0,0.5));
  mon.add(at(box(0.52,0.38,0.05,darkm),0,0.05,0));
  const monM=new THREE.MeshStandardMaterial({color:0x081416,emissive:0x2affd8,emissiveIntensity:0.55,roughness:0.3});
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(0.46,0.32), monM); scr.position.set(0,0.05,0.028); mon.add(scr);
  root.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } });
  return {root, blinkers, rotorCols, leverArm, rotorLight};
}
function mkRoundelWall(w,h){
  const g=new THREE.Group();
  g.add(at(box(w,h,0.3, M(0x2b3038,0.85,0.1)),0,h/2,0));
  const roundels=[];
  const cols=Math.floor(w/1.35), rows=3;
  for(let i=0;i<cols;i++) for(let j=0;j<rows;j++){
    const x=(i-(cols-1)/2)*1.35, y=0.95+j*1.35;
    g.add(at(tor(0.36,0.05, M(0x3d434d,0.6,0.3),10,26), x,y,0.16, 0,0,0));
    const dm=new THREE.MeshStandardMaterial({color:0x8a7a58,emissive:0xffc46a,emissiveIntensity:0.28,roughness:0.5});
    const d=new THREE.Mesh(new THREE.CircleGeometry(0.31,22), dm); d.position.set(x,y,0.155); g.add(d);
    roundels.push(dm);
  }
  return {root:g, roundels};
}

/* ---------- London ---------- */
const BRICKS=[0x6e4438,0x7d5346,0x5d3a30,0x8a8378,0x746055];
function mkBuilding(cfg){
  const w=cfg.w??10, floors=cfg.floors??3, d=8;
  const h=floors*3.0+0.8;
  const root=new THREE.Group();
  const brick=TM(cfg.brick??pick(BRICKS),0.9,0,'brick',4.5,3.6,1.0);
  root.add(at(box(w,h,d,brick),0,h/2,0));
  root.add(at(box(w+0.3,0.5,d+0.3,M(0x4a4640,0.9,0)),0,h+0.22,0));
  for(let i=0;i<Math.max(1,Math.floor(w/7));i++){
    const cx=(i-(Math.max(1,Math.floor(w/7))-1)/2)*6;
    root.add(at(box(0.8,1.6,0.8,brick),cx,h+1.0,-1.5));
    root.add(at(cyl(0.14,0.17,0.5,M(0x3a3632,0.9,0),8),cx-0.2,h+2.0,-1.5));
    root.add(at(cyl(0.14,0.17,0.5,M(0x3a3632,0.9,0),8),cx+0.2,h+2.0,-1.5));
  }
  const frameM=M(0xd8d2c4,0.8,0), litM=new THREE.MeshStandardMaterial({color:0xffe6b8,emissive:0xffc477,emissiveIntensity:1.35,roughness:0.5}),
        unlitM=M(0x1a2230,0.3,0.3);
  const frames=[], lit=[], unlit=[];
  const nWin=Math.max(2,Math.floor((w-2)/2.2));
  for(let f=(cfg.shop?1:0);f<floors;f++) for(let i=0;i<nWin;i++){
    const x=(i-(nWin-1)/2)*((w-2)/nWin), y=1.9+f*3.0;
    const fg=new THREE.BoxGeometry(0.82,1.30,0.12); fg.translate(x,y,d/2+0.02); frames.push(fg);
    const mg=new THREE.BoxGeometry(0.90,0.14,0.14); mg.translate(x,y-0.72,d/2+0.05); frames.push(mg);
    const gg=new THREE.PlaneGeometry(0.66,1.14); gg.translate(x,y,d/2+0.09);
    (Math.random()<cfg.litChance ? lit : unlit).push(gg);
    const bar=new THREE.BoxGeometry(0.70,0.04,0.02); bar.translate(x,y,d/2+0.10); frames.push(bar);
    const bar2=new THREE.BoxGeometry(0.04,1.14,0.02); bar2.translate(x,y,d/2+0.10); frames.push(bar2);
  }
  if(frames.length){ const fm=new THREE.Mesh(mergeGeos(frames),frameM); fm.castShadow=true; root.add(fm); }
  if(lit.length)   root.add(new THREE.Mesh(mergeGeos(lit),litM));
  if(unlit.length) root.add(new THREE.Mesh(mergeGeos(unlit),unlitM));
  const spots=[];
  if(cfg.shop){
    const fascia=box(w*0.9,0.75,0.25,M(0x26221c,0.8,0)); fascia.position.set(0,2.85,d/2+0.15); root.add(fascia);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(w*0.62,0.55),
      new THREE.MeshStandardMaterial({map:signTex(cfg.shop),emissive:0xe8ddc0,emissiveMap:signTex(cfg.shop),emissiveIntensity:0.32,roughness:0.7}));
    sign.position.set(0,2.85,d/2+0.29); root.add(sign);
    // bay display window sticking out
    const bw=w*0.62, bd=1.0;
    root.add(at(box(bw+0.3,0.45,bd+0.2,M(0x1e1a16,0.8,0)),0,0.22,d/2+bd/2));
    const backM=new THREE.MeshStandardMaterial({color:0x2e2418,emissive:0xffc477,emissiveIntensity:0.95,roughness:0.8});
    root.add(at(new THREE.Mesh(new THREE.PlaneGeometry(bw,2.1), backM),0,1.5,d/2+0.05));
    const glassM=new THREE.MeshStandardMaterial({color:0xaad4e8,transparent:true,opacity:0.16,roughness:0.05,metalness:0.2});
    root.add(at(new THREE.Mesh(new THREE.PlaneGeometry(bw,2.05), glassM),0,1.52,d/2+bd));
    root.add(at(box(bw+0.1,0.16,bd+0.1,M(0x26221c,0.8,0)),0,2.52,d/2+bd/2));
    for(const s of [-1,1]) root.add(at(box(0.14,2.1,0.14,M(0x26221c,0.8,0)),s*(bw/2+0.05),1.5,d/2+bd-0.05));
    const n=cfg.mannequins??0;
    for(let i=0;i<n;i++) spots.push({x:(i-(n-1)/2)*(bw/(n+0.4)), z:d/2+bd*0.5});
    const dw=1.0;
    root.add(at(box(dw,2.3,0.15,M(0x3a2e22,0.7,0)), -w/2+1.2,1.15,d/2+0.10));
  } else {
    root.add(at(box(1.05,2.25,0.18,M(pick([0x27404f,0x4f2727,0x2e402a,0x3a3a44]),0.6,0)),0,1.32,d/2+0.06));
    root.add(at(box(1.5,0.18,0.9,M(0x8a8378,0.9,0)),0,0.09,d/2+0.4));
    root.add(at(box(0.24,0.24,0.24,frameM),0,2.6,d/2+0.08));
  }
  return {root, w, d, h, spots};
}
function placeBuilding(Z, b, x, z, rotY=0){
  b.root.position.set(x,0,z); b.root.rotation.y=rotY;
  Z.scene.add(b.root); markStatic(b.root);
  const hw=(rotY%PI===0)? b.w/2 : b.d/2, hd=(rotY%PI===0)? b.d/2 : b.w/2;
  aabb(Z, x-hw, z-hd, x+hw, z+hd);
  return b.spots.map(s=>{
    const v=V3(s.x,0,s.z).applyAxisAngle(V3(0,1,0),rotY);
    return {x:x+v.x, z:z+v.z, yaw:rotY};
  });
}
/* soft volumetric-style light cone (additive, fades to ground) */
function mkLightCone(color=0xffc46a, topR=0.16, botR=1.7, h=4.6, opacity=0.07){
  if(!TEX.coneGrad){ TEX.coneGrad=ctex(16,128,(x,w,hh)=>{ const g=x.createLinearGradient(0,0,0,hh);
    g.addColorStop(0,'rgba(255,255,255,0.9)'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=g; x.fillRect(0,0,w,hh); }); }
  const m=new THREE.MeshBasicMaterial({color, map:TEX.coneGrad, transparent:true, opacity,
    blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, fog:false});
  return new THREE.Mesh(new THREE.CylinderGeometry(topR,botR,h,20,1,true), m);
}

function mkLampPost(){
  const g=new THREE.Group();
  const dk=M(0x1e2226,0.6,0.5);
  g.add(at(cyl(0.05,0.09,4.4,dk,10),0,2.2,0));
  g.add(at(cyl(0.13,0.16,0.25,dk,10),0,0.12,0));
  const arc=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.035,8,14,PI/2), dk);
  arc.position.set(0,4.35,0); arc.rotation.z=PI/2; arc.rotation.y=PI/2; arc.castShadow=true; g.add(arc);
  const headM=new THREE.MeshStandardMaterial({color:0xffe8c0,emissive:0xffc46a,emissiveIntensity:2.4,roughness:0.4});
  const head=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.13,0.22,10), headM);
  head.position.set(0,4.82,0.55); g.add(head);
  g.add(at(cone(0.17,0.14,dk,10),0,4.97,0.55));
  g.traverse(m=>{ if(m.isMesh) m.castShadow=true; });
  return {root:g, headPos:V3(0,4.7,0.55)};
}
function mkCar(){
  const g=new THREE.Group();
  const col=pick([0x1c2430,0x33221e,0x1e2a20,0x2a2a30,0x3a2030]);
  const bodyM=M(col,0.32,0.55), chrome=M(0xc9cdd4,0.2,0.95);
  g.add(at(rbox(1.72,0.52,4.15,0.16,bodyM),0,0.58,0));
  g.add(at(rbox(1.58,0.5,2.1,0.2,bodyM),0,1.02,-0.25));
  const glassM=M(0x0f1620,0.1,0.4);
  g.add(at(box(1.5,0.36,0.04,glassM),0,1.05,0.82));
  g.add(at(box(1.5,0.34,0.04,glassM),0,1.05,-1.3));
  for(const s of [-1,1]){ g.add(at(box(0.04,0.34,1.7,glassM),s*0.78,1.05,-0.25)); }
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    g.add(at(cyl(0.34,0.34,0.24,M(0x121216,0.8,0.2),14), sx*0.80,0.34,sz*1.35, 0,0,PI/2));
    g.add(at(cyl(0.14,0.14,0.26,chrome,10), sx*0.80,0.34,sz*1.35, 0,0,PI/2));
  }
  g.add(at(box(1.8,0.14,0.18,chrome),0,0.38,2.1));
  g.add(at(box(1.8,0.14,0.18,chrome),0,0.38,-2.1));
  for(const s of [-1,1]) g.add(at(sph(0.09,M(0xf8f0d8,0.3,0.6),8,6),s*0.55,0.72,2.09));
  g.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } });
  return g;
}
function mkPostBox(){
  const g=new THREE.Group(); const red=M(0x8a1a12,0.55,0.1);
  g.add(at(cyl(0.26,0.28,1.15,red,14),0,0.575,0));
  g.add(at(cyl(0.30,0.26,0.12,red,14),0,1.2,0));
  g.add(at(sph(0.06,red,10,8),0,1.28,0));
  g.add(at(box(0.30,0.035,0.02,M(0x1a1a1a,0.6,0)),0,0.95,0.27));
  g.traverse(m=>{ if(m.isMesh) m.castShadow=true; });
  return g;
}
function mkBench(){
  const g=new THREE.Group(); const wood=M(0x4a3a28,0.85,0), iron=M(0x22262a,0.7,0.3);
  for(let i=0;i<4;i++) g.add(at(box(1.7,0.05,0.09,wood),0,0.45+ (i<2?0:0.25), i<2? -0.18+i*0.16 : -0.30-(i-2)*0.1, i<2?0:-0.9));
  for(const s of [-1,1]){ g.add(at(box(0.06,0.45,0.4,iron),s*0.8,0.22,0)); g.add(at(box(0.06,0.5,0.06,iron),s*0.8,0.65,-0.22,-0.35)); }
  g.traverse(m=>{ if(m.isMesh) m.castShadow=true; });
  return g;
}

/* ---------- organic / terrain props ---------- */
function mkRockGeo(r){
  const g=new THREE.IcosahedronGeometry(r,1);
  const p=g.attributes.position, seed=rand(100);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    // deterministic per-position factor so shared corners stay welded (geometry is non-indexed)
    const h=Math.sin(x*12.9898+y*78.233+z*37.719+seed)*43758.5453;
    const f=0.78+(h-Math.floor(h))*0.5;
    p.setXYZ(i, x*f, y*(0.6+(f-0.78)*0.7), z*f);
  }
  g.computeVertexNormals(); return g;
}
function mkTree(mat, scale=1, lean=0.1){
  const g=new THREE.Group();
  function branch(parent, len, r, depth){
    const b=new THREE.Mesh(new THREE.CylinderGeometry(r*0.55,r,len,7), mat);
    b.position.y=len/2; b.castShadow=true;
    const holder=new THREE.Group(); holder.add(b);
    parent.add(holder);
    if(depth>0){
      const n=depth>2?3:2;
      for(let i=0;i<n;i++){
        const sub=new THREE.Group(); sub.position.y=len*rand(0.72,1.0); holder.add(sub);
        sub.rotation.set(rand(0.3,0.85), rand(TAU), 0);
        branch(sub, len*rand(0.55,0.72), r*0.55, depth-1);
      }
    }
    return holder;
  }
  const t=branch(g, 2.2*scale, 0.22*scale, 3);
  t.rotation.z=lean*rand(-1,1);
  return g;
}
function mkTombstoneGeos(){
  const slab=new RoundedBoxGeometry(0.62,0.85,0.12,2,0.03);
  const arch=new THREE.CylinderGeometry(0.31,0.31,0.12,16); arch.rotateX(PI/2);
  const slabTop=mergeGeos([slab.translate(0,0.42,0), arch.translate(0,0.85,0)]);
  const cross=mergeGeos([
    new THREE.BoxGeometry(0.14,1.15,0.12).translate(0,0.57,0),
    new THREE.BoxGeometry(0.55,0.14,0.12).translate(0,0.82,0),
    new THREE.BoxGeometry(0.5,0.14,0.5).translate(0,0.07,0)]);
  const obelisk=mergeGeos([
    new THREE.BoxGeometry(0.5,0.25,0.5).translate(0,0.125,0),
    new THREE.CylinderGeometry(0.09,0.17,1.3,4).translate(0,0.9,0),
    new THREE.ConeGeometry(0.13,0.22,4).translate(0,1.66,0)]);
  const flat=new THREE.BoxGeometry(0.7,0.14,1.1).translate(0,0.07,0);
  return [slabTop, cross, obelisk, flat];
}
function mkMausoleum(){
  const root=new THREE.Group();
  const stone=M(0x8a887e,0.92,0,{flat:true}), stoneD=M(0x6a685e,0.95,0,{flat:true});
  root.add(at(box(5.4,0.35,4.6,stoneD),0,0.175,0));
  // hollow interior: back + side walls + roof slab + front lintel band
  root.add(at(box(4.6,2.9,0.5,stone),0,1.8,-1.65));
  for(const s of [-1,1]) root.add(at(box(0.5,2.9,3.8,stone),s*2.05,1.8,0));
  root.add(at(box(4.6,0.4,3.8,stone),0,3.05,0));
  root.add(at(box(4.6,0.65,0.35,stone),0,2.9,1.75));
  for(const s of [-1,1]) root.add(at(box(0.85,2.9,0.35,stone),s*1.85,1.8,1.75));
  root.add(at(box(3.4,0.12,2.9,M(0x3a3833,0.9,0)),0,0.40,-0.2));
  const ped=new THREE.Mesh(new THREE.CylinderGeometry(2.65,2.65,5.0,3,1), stone);
  ped.rotation.z=PI/2; ped.rotation.x=0; ped.scale.set(0.5,1,1);
  ped.position.set(0,3.85,0); ped.rotation.y=0; ped.castShadow=true;
  root.add(ped);
  for(const sx of [-1.6,-0.55,0.55,1.6]) root.add(at(cyl(0.16,0.19,2.6,stone,10), sx,1.65,2.15));
  root.add(at(box(5.0,0.3,0.7,stone),0,3.05,2.1));
  root.add(at(box(1.6,0.18,3.2,stoneD),0,0.09,2.6));
  // iron door (openable)
  const door=new THREE.Group(); door.position.set(-0.55,0.35,1.92); root.add(door);
  const dk=M(0x1c1e22,0.6,0.5);
  const dpanel=box(1.1,2.0,0.08,dk); dpanel.position.set(0.55,1.0,0); door.add(dpanel);
  for(let i=0;i<4;i++) door.add(at(box(0.05,1.9,0.10,M(0x2e3138,0.5,0.6)), 0.2+i*0.24,1.0,0.02));
  root.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } });
  return {root, door};
}
function mkFenceRun(len){
  const g=new THREE.Group(); const iron=M(0x1a1c20,0.6,0.4);
  const geos=[];
  const n=Math.floor(len/0.5);
  for(let i=0;i<=n;i++){ const x=-len/2+i*0.5;
    geos.push(new THREE.CylinderGeometry(0.02,0.02,1.5,5).translate(x,0.75,0));
    geos.push(new THREE.ConeGeometry(0.035,0.09,5).translate(x,1.55,0)); }
  geos.push(new THREE.BoxGeometry(len,0.05,0.04).translate(0,1.25,0));
  geos.push(new THREE.BoxGeometry(len,0.05,0.04).translate(0,0.35,0));
  const m=new THREE.Mesh(mergeGeos(geos), iron); m.castShadow=true; g.add(m);
  return g;
}

/* ---------- moonbase ---------- */
function mkModule(len=7, r=2.3){
  const g=new THREE.Group();
  const hull=M(0xc9cdd2,0.55,0.3), rib=M(0x8f949c,0.5,0.5);
  const body=cyl(r,r,len,hull,18); body.rotation.z=PI/2; body.position.y=r*0.75; g.add(body);
  for(let i=0;i<4;i++){ const t=tor(r+0.04,0.09,rib,8,20); t.rotation.y=PI/2; t.position.set(-len/2+ i*(len/3),r*0.75,0); g.add(t); }
  for(const s of [-1,1]){ const capp=sph(r,hull,16,12); capp.scale.set(0.4,1,1); capp.position.set(s*len/2,r*0.75,0); g.add(capp); }
  const winM=new THREE.MeshStandardMaterial({color:0xdff2ff,emissive:0xaadcff,emissiveIntensity:1.1,roughness:0.3});
  for(let i=0;i<3;i++){ const w=new THREE.Mesh(new THREE.CircleGeometry(0.28,14), winM);
    w.position.set(-len/2+1.5+i*2.2, r*0.95, r+0.02); g.add(w); }
  g.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } });
  return g;
}
function mkDomeHab(r=6){
  const g=new THREE.Group();
  const glassM=new THREE.MeshStandardMaterial({color:0x9fd4ff,transparent:true,opacity:0.07,roughness:0.05,metalness:0.2,side:THREE.DoubleSide,depthWrite:false});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(r,24,12,0,TAU,0,PI/2), glassM); g.add(dome);
  const rib=M(0x8f949c,0.5,0.6);
  for(let i=0;i<6;i++){ const a=new THREE.Mesh(new THREE.TorusGeometry(r,0.09,8,24,PI), rib);
    a.rotation.z=PI/2; a.rotation.y=i*PI/6; a.castShadow=true; g.add(a); }
  const ring=tor(r,0.14,rib,10,30); ring.rotation.x=PI/2; ring.position.y=0.05; g.add(ring);
  g.add(at(cyl(r-0.2,r-0.2,0.12,M(0x6e737c,0.7,0.3),24),0,0.06,0));
  return g;
}
function mkRegulator(){
  const g=new THREE.Group();
  const mtl=M(0x9aa0a8,0.45,0.7);
  g.add(at(cyl(0.5,0.7,0.4,mtl,10),0,0.2,0));
  g.add(at(cyl(0.16,0.2,2.2,mtl,10),0,1.5,0));
  const rotr=new THREE.Group(); rotr.position.y=2.75; g.add(rotr);
  for(let i=0;i<3;i++){ const blade=box(1.15,0.05,0.14,M(0x6f747c,0.5,0.6)); blade.rotation.y=i*TAU/3; rotr.add(blade); }
  const lampM=new THREE.MeshStandardMaterial({color:0xff6a5a,emissive:0xff3a2a,emissiveIntensity:2.2,roughness:0.3});
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(0.09,10,8), lampM); lamp.position.y=2.95; g.add(lamp);
  g.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } });
  return {root:g, rotor:rotr, lampM};
}
function mkRover(){
  const g=new THREE.Group(); const hull=M(0xb8bdc4,0.5,0.5);
  g.add(at(rbox(1.7,0.5,3.0,0.12,hull),0,0.75,0));
  g.add(at(rbox(1.4,0.6,1.2,0.15,M(0x9fd4ff,0.15,0.3,{transparent:true,opacity:0.35})),0,1.25,0.6));
  for(const sx of [-1,1]) for(let i=0;i<3;i++)
    g.add(at(cyl(0.34,0.34,0.3,M(0x2a2d31,0.8,0.1),12), sx*0.95,0.34,-1.0+i*1.0, 0,0,PI/2));
  g.add(at(cyl(0.02,0.02,1.4,MAT.silver,6),0.6,1.9,-1.2));
  g.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } });
  return g;
}

/* ---------- skaro ---------- */
function mkDalekCity(){
  const g=new THREE.Group();
  const mtl=M(0x7a7468,0.5,0.75), mtlD=M(0x5a5448,0.55,0.8);
  const slitM=new THREE.MeshStandardMaterial({color:0xffe08a,emissive:0xffB055,emissiveIntensity:1.6,roughness:0.4});
  for(let i=0;i<9;i++){
    const x=rand(-42,42), z=rand(-16,10), s=rand(0.7,1.8);
    const tower=new THREE.Group(); tower.position.set(x,0,z); g.add(tower);
    const h=rand(7,20)*s;
    tower.add(at(cyl(rand(1.6,3.2)*s, rand(2.4,4.4)*s, h, mtl, 12),0,h/2,0));
    tower.add(at(sph(rand(1.8,3.4)*s, i%2?mtl:mtlD, 14, 10),0,h,0));
    for(let k=0;k<3;k++){ const sl=new THREE.Mesh(new THREE.PlaneGeometry(0.3*s,1.6*s), slitM);
      const a=rand(TAU); sl.position.set(Math.sin(a)*2.2*s, h*rand(0.3,0.8), Math.cos(a)*2.2*s); sl.rotation.y=a; tower.add(sl); }
  }
  for(let i=0;i<4;i++){ const a=rand(-40,40);
    const bridge=box(rand(8,14),0.5,1.2, mtlD); bridge.position.set(a, rand(6,12), rand(-12,4)); g.add(bridge); }
  g.traverse(m=>{ if(m.isMesh){ m.castShadow=false; m.receiveShadow=false; } });
  return g;
}

/* ---------- pickups ---------- */
function mkFragment(){
  const g=new THREE.Group();
  const coreM=new THREE.MeshStandardMaterial({color:0xffe9a8,emissive:0xffce54,emissiveIntensity:2.6,roughness:0.2});
  const core=new THREE.Mesh(new THREE.OctahedronGeometry(0.17,0), coreM); core.position.y=1.0; g.add(core);
  const ring=tor(0.30,0.015,M(0xd4af37,0.3,0.9),8,26); ring.position.y=1.0; g.add(ring);
  const l=new THREE.PointLight(0xffce54, 14, 10, 1.8); l.position.y=1.1; g.add(l);
  return {root:g, core, ring, light:l};
}
function addFragment(Z, x, z, flagName, label='Time Fragment'){
  const F=mkFragment();
  F.root.position.set(x, Z.groundHeight(x,z), z);
  Z.scene.add(F.root);
  Z.updaters.push((dt,t)=>{ if(!F.root.visible) return;
    F.core.rotation.y+=dt*1.4; F.core.position.y=1.0+Math.sin(t*1.7)*0.09;
    F.ring.rotation.x=t*0.8; F.ring.rotation.y=t*0.5; });
  addInteract(Z, {x, z, r:2.0,
    label:()=>`Take the <b>${label}</b>`,
    cond:()=>F.root.visible && !G.flags[flagName],
    action:()=>{
      F.root.visible=false; G.flags[flagName]=true; A.chime();
      recountFragments();
      toastMsg('TIME FRAGMENT RECOVERED', `${G.fragments} of ${FRAG_TOTAL}`);
      onQuestEvent('fragment', flagName);
      saveGame();
    }});
  return F;
}
function mkPedestal(){
  const g=new THREE.Group();
  g.add(at(cyl(0.55,0.75,0.25,MAT.stoneDark,8),0,0.125,0));
  g.add(at(cyl(0.28,0.36,0.8,MAT.stone,8),0,0.65,0));
  g.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } });
  return g;
}
