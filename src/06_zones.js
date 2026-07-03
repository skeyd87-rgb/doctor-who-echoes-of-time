/* ============================== 06 ZONES ============================== */

function mkStars(scene, r=400, n=1500, size=1.6, yMin=0.02){
  const pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    let x,y,z; do{ const u=rand(-1,1),th=rand(TAU); y=Math.abs(u); x=Math.cos(th)*Math.sqrt(1-u*u); z=Math.sin(th)*Math.sqrt(1-u*u);}while(y<yMin);
    pos[i*3]=x*r; pos[i*3+1]=y*r; pos[i*3+2]=z*r;
  }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const m=new THREE.PointsMaterial({color:0xcfe0ff,size,sizeAttenuation:false,transparent:true,opacity:0.85,depthWrite:false,fog:false});
  const p=new THREE.Points(g,m); scene.add(p); return p;
}
function skyDome(scene, stops){ // stops: [[t,'#hex'],...] bottom→top
  const t=ctex(16,256,(x,w,h)=>{ const gr=x.createLinearGradient(0,h,0,0);
    for(const [k,c] of stops) gr.addColorStop(k,c); x.fillStyle=gr; x.fillRect(0,0,w,h); });
  const m=new THREE.MeshBasicMaterial({map:t, side:THREE.BackSide, fog:false, depthWrite:false});
  const s=new THREE.Mesh(new THREE.SphereGeometry(430,24,16), m); s.renderOrder=-10; scene.add(s); return s;
}
function terrainMesh(Z, size, seg, mat){
  const g=new THREE.PlaneGeometry(size,size,seg,seg); g.rotateX(-PI/2);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++) p.setY(i, Z.groundHeight(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat); m.receiveShadow=true; Z.scene.add(m); return m;
}

/* ============================================================ LONDON 1963 */
function buildLondon(){
  const Z=newZone('london','LONDON','October 1963', {bound:60, spawn:{x:0,z:2.5,yaw:PI/2}, tardis:{x:-6,z:5.0,yaw:0.5}, surface:'wet',
    ambience:{noise:{f:900,v:0.055,type:'bandpass',q:0.4}, drone:{notes:[49,73.4],v:0.010,f:220}}});
  const S=Z.scene;
  S.background=new THREE.Color(0x0c1220);
  S.fog=new THREE.FogExp2(0x101828, 0.0112);
  S.add(new THREE.HemisphereLight(0x4a6488, 0x1a1c24, 1.7));
  const moon=new THREE.DirectionalLight(0xbcd0f0, 1.25); moon.position.set(-30,48,20);
  moon.castShadow=true; moon.shadow.mapSize.setScalar(2048);
  Object.assign(moon.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:5,far:140}); S.add(moon); Z.sun=moon;
  // moon disc
  const md=new THREE.Mesh(new THREE.CircleGeometry(9,24), new THREE.MeshBasicMaterial({color:0xe8eef8,fog:false}));
  md.position.set(-140,190,120); md.lookAt(0,0,0); S.add(md);
  mkStars(S, 400, 500, 1.3, 0.15);
  // road & sidewalks
  const road=pl(140,9.4, M(0x14161c,0.28,0.05)); road.rotation.x=-PI/2; road.position.y=0.001; S.add(road);
  for(const s of [-1,1]){
    const sw=pl(140,3.4, M(0x2a2c30,0.55,0)); sw.rotation.x=-PI/2; sw.position.set(0,0.012,s*6.4); S.add(sw);
    const curb=box(140,0.09,0.22, M(0x3a3c40,0.6,0)); curb.position.set(0,0.045,s*4.75); S.add(curb);
  }
  const dashG=[]; for(let i=0;i<16;i++) dashG.push(new THREE.PlaneGeometry(2.2,0.16).rotateX(-PI/2).translate(-64+i*8.6,0.015,0));
  S.add(new THREE.Mesh(mergeGeos(dashG), M(0xb8b09a,0.6,0)));
  // puddles
  for(let i=0;i<14;i++){
    const p=new THREE.Mesh(new THREE.CircleGeometry(rand(0.5,1.6),18), M(0x11161f,0.04,0.85));
    p.rotation.x=-PI/2; p.position.set(rand(-52,52), 0.02, rand(-6.5,6.5)); p.scale.x=rand(1,2.2); S.add(p);
  }
  // buildings
  const shopsN=[{x:-33,shop:"HARLAN & SONS",man:3},{x:-9,shop:"WOLSEY RADIO & TV",man:1},{x:15,shop:null},{x:39,shop:"FINCH'S FABRICS",man:2}];
  let harlanSpots=null, otherSpots=[];
  for(const cfg of shopsN.concat([{x:-45},{x:-21},{x:3},{x:27}])){
    const b=mkBuilding({w:11.2, floors:randi(3,4), shop:cfg.shop||null, mannequins:cfg.man||0, litChance:0.45});
    const spots=placeBuilding(Z,b,cfg.x, 11.6, PI);
    if(cfg.shop==="HARLAN & SONS") harlanSpots=spots; else otherSpots.push(...spots);
  }
  const south=[{x:-39},{x:-15,shop:"THE POWELL ARMS",lit:0.9},{x:9},{x:33,shop:"E. BRYCE — GROCER",man:1},{x:-27},{x:-3},{x:21},{x:45}];
  for(const cfg of south){
    const b=mkBuilding({w:11.2, floors:randi(2,4), shop:cfg.shop||null, mannequins:cfg.man||0, litChance:cfg.lit??0.4});
    const spots=placeBuilding(Z,b,cfg.x,-11.6, 0);
    otherSpots.push(...spots);
  }
  // street furniture
  const lampXs=[-42,-28,-14,0,14,28,42];
  lampXs.forEach((x,i)=>{
    for(const s of [-1,1]){
      if((i+ (s>0?0:1))%2) continue;
      const L=mkLampPost(); L.root.position.set(x,0,s*6.1); L.root.rotation.y=s>0?PI:0;
      S.add(L.root); markStatic(L.root); circ(Z,x,s*6.1,0.25);
      if([-28,0,28].includes(x)&&s>0 || [-14,14].includes(x)&&s<0){
        const pt=new THREE.PointLight(0xffc46a, 60, 24, 1.75); pt.position.set(x, 4.6, s*6.1 + (s>0?-0.55:0.55)); S.add(pt);
      }
    }
  });
  for(const [x,z,ry] of [[-22,2.9,0.15],[8,-2.9,PI+0.1],[30,3.0,-0.08],[-44,-3,PI-0.2]]){
    const c=mkCar(); c.position.set(x,0,z); c.rotation.y=ry; S.add(c); markStatic(c); aabb(Z,x-1,z-2.2,x+1,z+2.2);
  }
  const pb=mkPostBox(); pb.position.set(20.5,0,5.6); S.add(pb); markStatic(pb); circ(Z,20.5,5.6,0.4);
  const bench=mkBench(); bench.position.set(-17,0,5.9); bench.rotation.y=PI; S.add(bench); markStatic(bench); circ(Z,-17,5.9,0.8);
  placeTardis(Z);
  // rain
  {
    const n=380, segs=new Float32Array(n*6), vel=[];
    for(let i=0;i<n;i++){ const x=rand(-60,60), y=rand(0,22), z=rand(-25,25);
      segs.set([x,y,z, x-0.06,y+0.42,z-0.03], i*6); vel.push(rand(14,20)); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(segs,3));
    const rain=new THREE.LineSegments(g, new THREE.LineBasicMaterial({color:0x8fa8c8,transparent:true,opacity:0.30,blending:THREE.AdditiveBlending,depthWrite:false}));
    S.add(rain);
    Z.updaters.push((dt)=>{ const a=g.attributes.position.array;
      for(let i=0;i<n;i++){ const dy=vel[i]*dt; a[i*6+1]-=dy; a[i*6+4]-=dy;
        if(a[i*6+1]<0){ const x=G.player?G.player.root.position.x+rand(-45,45):rand(-60,60), y=rand(16,24), z=rand(-25,25);
          a.set([x,y,z, x-0.06,y+0.42,z-0.03], i*6); } }
      g.attributes.position.needsUpdate=true; });
  }
  // NPCs
  addNPC(Z, mkPerson({height:1.86,skin:0xE8B792,hair:0x2e2a26,hairStyle:'short',jacket:0x1c2438,coatLen:0.5,shirt:0xd8d4c8,tie:0x14161c,top:0x1c2438,trousers:0x1c2438,shoes:0x14100c,hat:'helmet',hatColor:0x161c28,build:1.08}),
    'Constable Bryce','bryce', 17.5, 4.6, -1.9, {wanderR:6});
  addNPC(Z, mkPerson({height:1.7,skin:0xDCA57E,hair:0x9a8560,hairStyle:'combover',jacket:0x54483c,coatLen:0.18,shirt:0xd8d4c8,tie:0x5a2a2a,top:0x54483c,trousers:0x3a362e,shoes:0x201c18,glasses:true,build:1.05}),
    'Mr. Harlan','harlan', -31, 6.8, PI+0.4, {wanderR:3});
  addNPC(Z, mkNPC('1963',{fem:true,hat:'cloche',skirt:0x5a4a5e,height:1.64}),
    'Dot Finch','dot', 37, 6.5, PI-0.3, {wanderR:8});
  addNPC(Z, mkPerson({height:1.42,skin:0xF1C9A8,hair:0x7a5a30,hairStyle:'flatcap-hair',hat:'flatcap',hatColor:0x4a4238,top:0x6e5a48,jacket:0x6e5a48,coatLen:0,shirt:0x8a7a60,trousers:0x3a3f48,shoes:0x2a241f,build:0.8}),
    'Tommy','tommy', 21.5, 4.2, -2.3, {wanderR:9});
  addNPC(Z, mkNPC('1963',{fem:true,hairStyle:'bun',skirt:0x6e3b3b,height:1.66,build:1.02}),
    'Vera Lane','vera', -14.5, -6.6, 0.4, {wanderR:4});
  addNPC(Z, mkNPC('1963',{hat:'flatcap',coatLen:0.42,height:1.76}),
    'Alf Dobbs','alf', -18.5, 5.6, PI+0.5, {wanderR:5});
  // Autons in shop windows (dormant mannequins)
  Z.autons=[];
  const spots=(harlanSpots||[]).concat(otherSpots);
  for(const s of spots.slice(0,6)){
    const a=addAuton(Z, s.x, s.z, {yaw:s.yaw, dormant:true});
    a.onDisabled=()=>onQuestEvent('autonDown');
    Z.autons.push(a);
  }
  // fragment appears after quest at Harlan's shopfront
  Z.fragLondon=addFragment(Z, -29, 5.4, 'fragLondon');
  Z.fragLondon.root.visible=false;
  return Z;
}

/* ============================================================ TARDIS INTERIOR */
function buildTardisInterior(){
  const Z=newZone('tardis','THE TARDIS','Dimensionally transcendental', {bound:7.5, spawn:{x:0,z:5.6,yaw:PI}, tardis:null, surface:'metal',
    ambience:{drone:{notes:[36.7,55,73.4],v:0.022,f:260,type:'sawtooth'}, noise:{f:180,v:0.012}}});
  const S=Z.scene;
  S.background=new THREE.Color(0x05070c);
  S.add(new THREE.HemisphereLight(0xb0a074, 0x1c1e26, 1.05));
  const key=new THREE.DirectionalLight(0xdfe6f2, 0.75); key.position.set(4,9,3); key.castShadow=true;
  key.shadow.mapSize.setScalar(1024);
  Object.assign(key.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:2,far:24}); S.add(key); Z.sun=key;
  // floor & ceiling
  const floor=new THREE.Mesh(new THREE.CylinderGeometry(8.6,8.6,0.3,6),
    new THREE.MeshStandardMaterial({map:TEX.grate, color:0x8a8f98, roughness:0.55, metalness:0.55}));
  floor.position.y=-0.15; floor.receiveShadow=true; S.add(floor);
  const ceil=new THREE.Mesh(new THREE.CylinderGeometry(8.8,8.8,0.4,6), M(0x14171c,0.9,0.2));
  ceil.position.y=5.6; S.add(ceil);
  const haloM=new THREE.MeshStandardMaterial({color:0x66d9ff,emissive:0x49b8e8,emissiveIntensity:0.9,roughness:0.4});
  const halo=new THREE.Mesh(new THREE.TorusGeometry(2.6,0.09,10,40), haloM); halo.rotation.x=PI/2; halo.position.y=5.35; S.add(halo);
  // walls of roundels
  Z.roundels=[];
  for(let i=0;i<6;i++){
    const w=mkRoundelWall(9.6,5.4);
    const a=i*PI/3;
    w.root.position.set(Math.sin(a)*8.35,0,Math.cos(a)*8.35);
    w.root.rotation.y=a+PI;
    S.add(w.root); markStatic(w.root);
    Z.roundels.push(...w.roundels);
  }
  // interior doors (exit) on wall behind spawn
  const doorG=new THREE.Group(); doorG.position.set(0,0,7.9); doorG.rotation.y=PI; S.add(doorG);
  for(const s of [-1,1]){ const d=box(0.72,2.5,0.12, MAT.tardisBlue); d.position.set(s*0.37,1.25,0); doorG.add(d);
    for(let r2=0;r2<3;r2++){ const p=box(0.5,0.6,0.04, MAT.tardisDark); p.position.set(s*0.37,0.62+r2*0.75,0.07); doorG.add(p); } }
  const dl=new THREE.PointLight(0xffe0a0, 8, 7, 2); dl.position.set(0,2.9,7.0); S.add(dl);
  markStatic(doorG);
  addInteract(Z,{x:0,z:6.9,r:1.7, label:()=>`Step out into <b>${G.zones[G.tardisAt].title}</b>`, action:()=>exitTardis()});
  // console
  const C=mkConsole(); S.add(C.root); Z.console=C; circ(Z,0,0,2.05);
  const steps=new THREE.Mesh(new THREE.CylinderGeometry(3.3,3.7,0.18,6), M(0x2b2f36,0.7,0.3)); steps.position.y=0.09; steps.receiveShadow=true; S.add(steps);
  const steps2=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.9,0.18,6), M(0x33383f,0.65,0.35)); steps2.position.y=0.27; steps2.receiveShadow=true; S.add(steps2);
  // rail
  const railM=M(0x6e5a38,0.5,0.7);
  const rail=tor(4.3,0.035,railM,8,40); rail.rotation.x=PI/2; rail.position.y=1.05; S.add(rail);
  for(let i=0;i<10;i++){ const a=i/10*TAU; const p2=cyl(0.03,0.03,1.05,railM,6); p2.position.set(Math.sin(a)*4.3,0.52,Math.cos(a)*4.3); S.add(p2); }
  circ(Z,0,0,0.1); // (console circle already)
  for(const a of [0.5,2.6,4.2]){ const sc=new THREE.PointLight(0xffc46a, 13, 11, 2); sc.position.set(Math.sin(a)*7.6, 3.4, Math.cos(a)*7.6); S.add(sc); }
  addInteract(Z,{x:0,z:1.6,r:1.5, label:()=>G.fragments>=4&&!G.flags.ended?'Set course — <b>seal the time rupture</b>':'Use the <b>TARDIS console</b>', action:()=>openTravel()});
  // idle animation
  Z.updaters.push((dt,t)=>{
    const spd=G.travelAnim?7:1;
    C.rotorCols.forEach((c,i)=>{ c.position.y=0.75+Math.sin(t*1.1*spd+i*TAU/3)*(G.travelAnim?0.42:0.16); });
    C.blinkers.forEach((b,i)=>{ if(Math.random()<(G.travelAnim?0.06:0.012)) b.emissiveIntensity=rand(0.15,1.4); });
    C.rotorLight.intensity=26+Math.sin(t*2.2*spd)*(G.travelAnim?14:5);
    haloM.emissiveIntensity=0.85+Math.sin(t*1.3)*0.15;
    if(Math.random()<0.008){ const r=pick(Z.roundels); r.emissiveIntensity=rand(0.15,0.5); }
    C.leverArm.rotation.x=damp(C.leverArm.rotation.x, G.travelAnim?-0.55:0.55, 5, dt);
  });
  return Z;
}

/* ============================================================ SKARO */
function buildSkaro(){
  const gh=(x,z)=>{
    let h=2.0*Math.sin(x*0.05+1.3)*Math.cos(z*0.042)+1.0*Math.sin(x*0.013*10+z*0.007*10)*0.9+0.4*Math.sin(z*0.19+x*0.02);
    const d1=dist2(x,z,0,10), d2=dist2(x,z,0,-48);
    h*=clamp((d1-9)/15,0,1)*clamp((d2-12)/18,0,1);
    return h;
  };
  const Z=newZone('skaro','SKARO','Home world of the Daleks', {bound:80, spawn:{x:0,z:14,yaw:PI}, tardis:{x:3.5,z:9,yaw:-0.6}, surface:'sand',
    groundHeight:gh, ambience:{noise:{f:420,v:0.075}, drone:{notes:[55,82.5],v:0.014,f:300}}});
  const S=Z.scene;
  S.fog=new THREE.FogExp2(0xc07840, 0.0095);
  skyDome(S, [[0,'#d88a50'],[0.25,'#c9713d'],[0.55,'#8a3a2e'],[1,'#2e1020']]);
  S.add(new THREE.HemisphereLight(0xdd9a6a, 0x4a2a1c, 0.7));
  const sun=new THREE.DirectionalLight(0xffb060, 1.25); sun.position.set(50,55,-40); sun.castShadow=true;
  sun.shadow.mapSize.setScalar(2048);
  Object.assign(sun.shadow.camera,{left:-80,right:80,top:80,bottom:-80,near:5,far:200}); S.add(sun); Z.sun=sun;
  const rim=new THREE.DirectionalLight(0xffa87a, 0.55); rim.position.set(-60,25,50); S.add(rim);
  // twin suns
  for(const [x,y,z,r,c] of [[210,120,-260,22,0xffd9a8],[130,90,-300,12,0xff8a55]]){
    const d=new THREE.Mesh(new THREE.CircleGeometry(r,24), new THREE.MeshBasicMaterial({color:c,fog:false})); d.position.set(x,y,z); d.lookAt(0,0,0); S.add(d);
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.puff, color:c,transparent:true,opacity:0.35,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
    glow.position.set(x,y,z); glow.scale.setScalar(r*7); S.add(glow);
  }
  terrainMesh(Z, 200, 100, M(0xb0793f,1,0));
  // petrified forest + rocks
  const white=M(0xd9d2c7,0.9,0,{flat:true});
  for(let i=0;i<24;i++){
    const x=rand(-70,70), z=rand(-60,45);
    if(dist2(x,z,0,10)<12||dist2(x,z,0,-48)<16||Math.abs(x)<7&&z>-52&&z<14) continue;
    const t=mkTree(white, rand(0.7,1.4), 0.25); t.position.set(x,gh(x,z)-0.1,z); S.add(t); circ(Z,x,z,0.5);
  }
  const rockM=M(0x5e4433,0.95,0,{flat:true});
  for(let i=0;i<34;i++){
    const x=rand(-75,75), z=rand(-65,50);
    if(dist2(x,z,0,10)<10||dist2(x,z,0,-48)<14) continue;
    const r=new THREE.Mesh(mkRockGeo(rand(0.6,2.4)), rockM); r.castShadow=r.receiveShadow=true;
    r.position.set(x,gh(x,z)+0.1,z); r.rotation.y=rand(TAU); S.add(r); circ(Z,x,z,rand(0.8,1.8));
  }
  // dalek city on horizon + gate plaza
  const city=mkDalekCity(); city.position.set(0,0,-95); S.add(city);
  const gate=new THREE.Group(); gate.position.set(0,0,-48); S.add(gate);
  const mtl=M(0x6e6858,0.5,0.8);
  for(const s of [-1,1]){
    const tw=grp(); tw.position.set(s*7,0,0); gate.add(tw);
    tw.add(at(cyl(1.5,2.2,9,mtl,10),0,4.5,0));
    tw.add(at(sph(1.9,M(0x8a8272,0.45,0.85),12,9),0,9,0));
    circ(Z,s*7,-48,2.3);
    const wall=box(5.5,3.2,1.2,mtl); wall.position.set(s*11.5,1.6,0); gate.add(wall);
    aabb(Z, s*11.5-2.75,-48.6, s*11.5+2.75,-47.4);
  }
  const ped=mkPedestal(); ped.position.set(0,gh(0,-52),-52); S.add(ped); circ(Z,0,-52,0.7);
  addFragment(Z, 0, -53.4, 'fragSkaro');
  placeTardis(Z);
  // drifting dust
  {
    const n=260, pos=new Float32Array(n*3);
    for(let i=0;i<n;i++) pos.set([rand(-80,80),rand(0.2,7),rand(-70,50)],i*3);
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const p=new THREE.Points(g,new THREE.PointsMaterial({color:0xd8a870,size:0.14,map:TEX.puff,transparent:true,opacity:0.55,depthWrite:false}));
    S.add(p);
    Z.updaters.push((dt,t)=>{ const a=g.attributes.position.array;
      for(let i=0;i<n;i++){ a[i*3]+=dt*(2.0+Math.sin(i)*0.8); a[i*3+1]+=Math.sin(t+i)*dt*0.3;
        if(a[i*3]>80)a[i*3]=-80; }
      g.attributes.position.needsUpdate=true; });
  }
  // daleks
  const patrols=[
    {x:-16,z:-12, wp:[[-16,-12],[-28,-24],[-10,-30],[-2,-18]]},
    {x:14,z:-16, wp:[[14,-16],[26,-28],[12,-36],[4,-22]]},
    {x:-6,z:-36, wp:[[-6,-36],[-20,-42],[-8,-50],[6,-42]]},
    {x:22,z:-40, wp:[[22,-40],[30,-30],[18,-24]]},
    {x:-30,z:-8, wp:[[-30,-8],[-40,-20],[-26,-26]]},
  ];
  for(const p of patrols){
    const d=addDalek(Z,p.x,p.z,{waypoints:p.wp});
    d.onDisabled=()=>onQuestEvent('dalekDown');
  }
  const sec=addDalek(Z,0,-46,{colors:{body:0x1c1e22,dark:0x0e0f12}, boss:true, label:'Dalek Sec'});
  sec.onDisabled=()=>onQuestEvent('secDown');
  Z.sec=sec;
  // Veyra the Thal
  addNPC(Z, mkNPC('thal'), 'Veyra','veyra', 13.5, -16.5, -2.2, {wanderR:0, pinned:false, fearless:true});
  return Z;
}

/* ============================================================ MOONBASE 2070 */
function buildMoonbase(){
  const craters=[[-30,-25,13,2.6],[26,18,8,1.5],[-12,30,6,1.1],[38,-14,7,1.3],[-42,10,5,0.9],[12,-34,6,1.2],[-20,-48,5,1.0]];
  const gh=(x,z)=>{
    let h=0.13*Math.sin(x*0.6)*Math.sin(z*0.55)+0.1*Math.sin(x*0.23+z*0.31);
    for(const [cx,cz,r,d] of craters){
      const dd=dist2(x,z,cx,cz);
      h += -d*Math.exp(-(dd*dd)/(r*r*0.5)) + d*0.32*Math.exp(-((dd-r)*(dd-r))/(r*r*0.055));
    }
    h*=clamp((dist2(x,z,0,0)-15)/9,0,1);
    return h;
  };
  const Z=newZone('moon','MOONBASE ARTEMIS','Mare Crisium — 2070', {bound:75, spawn:{x:2,z:22,yaw:PI}, tardis:{x:7,z:24,yaw:-0.8}, surface:'moon',
    gravity:-5.2, jumpV:5.0, groundHeight:gh, ambience:{drone:{notes:[110,164.8],v:0.008,f:600,type:'sine'}, noise:{f:120,v:0.006}}});
  const S=Z.scene;
  S.background=new THREE.Color(0x020204);
  S.add(new THREE.HemisphereLight(0x4a5266, 0x0a0a10, 0.5));
  const sun=new THREE.DirectionalLight(0xffffff, 2.0); sun.position.set(60,42,-30); sun.castShadow=true;
  sun.shadow.mapSize.setScalar(2048);
  Object.assign(sun.shadow.camera,{left:-75,right:75,top:75,bottom:-75,near:5,far:200}); S.add(sun); Z.sun=sun;
  mkStars(S, 420, 1900, 1.7, 0.0);
  // the Earth
  const earth=new THREE.Mesh(new THREE.SphereGeometry(15,32,22),
    new THREE.MeshStandardMaterial({map:TEX.earth, roughness:0.75, emissive:0x8fb4d8, emissiveMap:TEX.earth, emissiveIntensity:0.28}));
  earth.position.set(-95,105,-215); earth.rotation.z=0.41; S.add(earth);
  Z.updaters.push(dt=>{ earth.rotation.y+=dt*0.011; });
  const eGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.puff, color:0x9fc8ff,transparent:true,opacity:0.18,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
  eGlow.position.copy(earth.position); eGlow.scale.setScalar(58); S.add(eGlow);
  terrainMesh(Z, 200, 110, new THREE.MeshStandardMaterial({map:TEX.moonNoise, color:0xaeaeb2, roughness:1}));
  // base
  const dome=mkDomeHab(6.5); dome.position.set(0,0,0); S.add(dome); markStatic(dome);
  const domeLight=new THREE.PointLight(0xbfe0ff, 40, 22, 1.7); domeLight.position.set(0,4.5,0); S.add(domeLight);
  const angles=[0.6, 2.2, 4.4];
  angles.forEach((a,i)=>{
    const mod=mkModule(7.5,2.2);
    const x=Math.sin(a)*11.5, z=Math.cos(a)*11.5;
    mod.position.set(x,0,z); mod.rotation.y=a+PI/2; S.add(mod); markStatic(mod);
    circ(Z,x,z,3.4);
    const conn=box(1.8,2.2,5.5,M(0x9aa0a8,0.55,0.4)); conn.position.set(Math.sin(a)*5.6,1.1,Math.cos(a)*5.6); conn.rotation.y=a; S.add(conn); markStatic(conn);
  });
  circ(Z,0,0,6.7);
  // landing pad + rover + props
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(6,6.4,0.3,20), M(0x54585e,0.8,0.2)); pad.position.set(20,gh(20,10)+0.1,10); pad.receiveShadow=true; S.add(pad);
  for(let i=0;i<8;i++){ const a=i/8*TAU; const bcn=new THREE.Mesh(new THREE.SphereGeometry(0.09,8,6),
    new THREE.MeshStandardMaterial({color:0xffa050,emissive:0xff7a30,emissiveIntensity:2.4})); bcn.position.set(20+Math.sin(a)*5.6, gh(20,10)+0.35, 10+Math.cos(a)*5.6); S.add(bcn); }
  const rover=mkRover(); rover.position.set(14,gh(14,17),17); rover.rotation.y=0.7; S.add(rover); markStatic(rover); aabb(Z,13,15.6,15.2,18.4);
  for(const [x,z] of [[-8,8],[-9.5,8.8],[-8.6,10]]){ const c=rbox(1.15,1.15,1.15,0.06,M(0x8f949c,0.6,0.3)); c.position.set(x,gh(x,z)+0.58,z); c.rotation.y=rand(TAU); S.add(c); markStatic(c); circ(Z,x,z,0.85); }
  for(const [x,z] of [[6,-9],[-13,-3]]){
    const ant=grp(at(cyl(0.05,0.08,7,MAT.silverDark,8),0,3.5,0), at(cyl(0.02,0.02,3.2,MAT.silver,6),0,6.6,0,0,0,PI/4));
    const dish=new THREE.Mesh(new THREE.SphereGeometry(1.1,12,8,0,TAU,0,PI/3), MAT.silver); dish.rotation.x=-2.3; dish.position.y=7.2; ant.add(dish);
    ant.position.set(x,gh(x,z),z); S.add(ant); markStatic(ant); circ(Z,x,z,0.4);
  }
  // gravity regulators
  Z.regulators=[];
  const regPos=[[-15,3],[10,-13],[7,15]];
  for(const [x,z] of regPos){
    const R=mkRegulator(); R.root.position.set(x,gh(x,z),z); S.add(R.root);
    circ(Z,x,z,0.75);
    const reg={R, fixed:false, x, z};
    Z.regulators.push(reg);
    Z.updaters.push((dt,t)=>{ R.rotor.rotation.y += dt*(reg.fixed?4.5:0.4);
      if(!reg.fixed) R.lampM.emissiveIntensity=1.4+Math.sin(t*6)*1.0; });
    addInteract(Z,{x,z,r:2.2,
      label:()=>reg.fixed?'Regulator stabilised':'Hold — <b>repair the gravity regulator</b>',
      cond:()=>G.flags.moonQuest&&!reg.fixed,
      action:()=>{ startRepair(reg); }});
  }
  // crashed cyber-pod in big crater + fragment
  const podG=grp();
  const pod=cyl(1.4,2.0,4.4,M(0x4a4f58,0.5,0.6),10); pod.rotation.z=1.15; pod.position.y=1.1; podG.add(pod);
  const fin=box(0.15,1.8,1.1,M(0x3a3e46,0.5,0.6)); fin.position.set(-1.6,1.9,0); fin.rotation.z=0.6; podG.add(fin);
  podG.position.set(-30,gh(-30,-25),-25); podG.rotation.y=0.7; S.add(podG); markStatic(podG); circ(Z,-30,-25,2.6);
  addFragment(Z,-27.5,-23.5,'fragMoon');
  placeTardis(Z);
  // crew
  addNPC(Z, mkNPC('moon',{skin:0x8D5A3B,hairStyle:'bald',helmetGlass:true,height:1.85,build:1.06}),
    'Cmdr. Okafor','okafor', -2.2, 2.2, 2.4, {wanderR:3, fearless:true});
  addNPC(Z, mkNPC('moon',{fem:true,skin:0xC98E63,hairStyle:'bun',helmetGlass:true,height:1.66}),
    'Priya Rao','priya', 2.6, -1.8, -0.6, {wanderR:3, fearless:true});
  // dormant cybermen outside airlock + wave spawner state
  Z.cyberWave=0; Z.waveT=0;
  for(const [x,z,yaw] of [[-4,14,PI],[-1.5,15,PI],[1.2,14.4,PI]]){
    const c=addCyberman(Z,x,z,{yaw, dormant:false});
    c.onDisabled=()=>onQuestEvent('cyberDown');
  }
  return Z;
}

/* ============================================================ GRAVEYARD */
function buildGraveyard(){
  const gh=(x,z)=> 0.35*Math.sin(x*0.15)*Math.cos(z*0.13)+0.22*Math.sin(x*0.31+1.2)+0.15*Math.sin(z*0.27);
  const Z=newZone('grave','WESTER DRUMLINS','The old churchyard — don\'t blink', {bound:52, spawn:{x:0,z:40,yaw:PI}, tardis:{x:-4.5,z:40.5,yaw:0.7}, surface:'grass',
    groundHeight:gh, ambience:{noise:{f:600,v:0.05,type:'bandpass',q:0.5}, drone:{notes:[65.4,77.8,98],v:0.016,f:240}}});
  const S=Z.scene;
  S.fog=new THREE.FogExp2(0x333c52, 0.0145);
  S.background=new THREE.Color(0x222634);
  S.add(new THREE.HemisphereLight(0x5c6a94, 0x1e2230, 2.0));
  const moon=new THREE.DirectionalLight(0xc2d2f8, 1.55); moon.position.set(25,40,-30); moon.castShadow=true;
  moon.shadow.mapSize.setScalar(2048);
  Object.assign(moon.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:5,far:130}); S.add(moon); Z.sun=moon;
  const gfill=new THREE.DirectionalLight(0x9aaad8, 0.65); gfill.position.set(-10,18,55); S.add(gfill);
  const md=new THREE.Mesh(new THREE.CircleGeometry(11,24), new THREE.MeshBasicMaterial({color:0xdfe8fa,fog:false}));
  md.position.set(120,150,-170); md.lookAt(0,0,0); S.add(md);
  const mGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.puff, color:0xbfd0f8,transparent:true,opacity:0.22,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
  mGlow.position.copy(md.position); mGlow.scale.setScalar(70); S.add(mGlow);
  terrainMesh(Z, 130, 80, M(0x39482f,0.95,0));
  // gravel path from gate to mausoleum
  const path=pl(3.2,80, M(0x4a4640,0.85,0)); path.rotation.x=-PI/2; path.position.set(0,0.05,4); S.add(path);
  // fences + gate
  for(const [x,z,ry,len] of [[0,-46,0,92],[0,46,0,40],[-46,0,PI/2,92],[46,0,PI/2,92],[-32,46,0,26],[32,46,0,26]]){
    const f=mkFenceRun(len); f.position.set(x,gh(x,z),z); f.rotation.y=ry; S.add(f); markStatic(f);
    if(ry===0) aabb(Z,x-len/2,z-0.3,x+len/2,z+0.3); else aabb(Z,x-0.3,z-len/2,x+0.3,z+len/2);
  }
  const arch=grp();
  for(const s of [-1,1]) arch.add(at(box(0.5,3.6,0.5,MAT.stoneDark),s*2.6,1.8,0));
  const archTop=new THREE.Mesh(new THREE.TorusGeometry(2.6,0.22,8,20,PI), MAT.stoneDark); archTop.position.y=3.6; arch.add(archTop);
  arch.position.set(0,gh(0,44),44); S.add(arch); markStatic(arch);
  circ(Z,-2.6,44,0.5); circ(Z,2.6,44,0.5);
  // tombstones (shared geometries)
  const tsg=mkTombstoneGeos();
  const stoneShades=[0x8a887e,0x7a786f,0x93908a,0x6f6d66];
  let placed=0;
  for(let row=0;row<9&&placed<90;row++) for(let col=0;col<12&&placed<90;col++){
    if(Math.random()<0.22) continue;
    const x=-38+col*7+rand(-1.8,1.8), z=-40+row*8.6+rand(-2,2);
    if(Math.abs(x)<2.8 && z>-38) continue;               // keep the path clear
    if(dist2(x,z,0,-34)<7||dist2(x,z,0,40)<6) continue;
    const g2=new THREE.Mesh(pick(tsg), M(pick(stoneShades),0.95,0,{flat:true}));
    g2.position.set(x,gh(x,z),z); g2.rotation.y=rand(TAU); g2.rotation.z=rand(-0.09,0.09); g2.scale.setScalar(rand(0.85,1.3));
    g2.castShadow=g2.receiveShadow=true; S.add(g2);
    circ(Z,x,z,0.35); placed++;
  }
  // dead trees
  const bark=M(0x18140f,0.95,0,{flat:true});
  for(let i=0;i<13;i++){
    const x=rand(-42,42), z=rand(-42,40);
    if(Math.abs(x)<4&&z>-40) continue; if(dist2(x,z,0,-34)<8||dist2(x,z,0,40)<8) continue;
    const t=mkTree(bark, rand(0.9,1.6), 0.3); t.position.set(x,gh(x,z)-0.05,z); S.add(t); circ(Z,x,z,0.45);
  }
  // mausoleum + fragment inside
  const mau=mkMausoleum(); mau.root.position.set(0,gh(0,-34),-34); S.add(mau.root);
  aabb(Z,-2.35,-35.95,-1.75,-32.1);  // left wall
  aabb(Z, 1.75,-35.95, 2.35,-32.1);  // right wall
  aabb(Z,-2.35,-35.95, 2.35,-35.35); // back wall
  Z.doorBlock={x1:-1.2,z1:-32.45,x2:1.2,z2:-31.85};
  Z.aabbs.push(Z.doorBlock);
  Z.mausoleum=mau;
  const cryptLight=new THREE.PointLight(0x7fd8b8, 7, 8, 1.9); cryptLight.position.set(0,2.2,-34.4); S.add(cryptLight);
  const cped=mkPedestal(); cped.position.set(0,gh(0,-34.5)+0.35,-34.5); S.add(cped);
  addFragment(Z, 0,-34.3, 'fragGrave');
  addInteract(Z,{x:0,z:-31.4,r:2.2,
    label:()=>'Hold — <b>unseal the mausoleum door</b>',
    cond:()=>G.flags.graveQuest&&!G.flags.mausoleumOpen,
    action:()=>startDoorUnseal()});
  // lantern lights
  for(const [x,z] of [[2.5,41],[1.8,10],[-2.2,-16],[2.8,-30.5]]){
    const post=grp(at(cyl(0.04,0.06,2.3,M(0x1a1c20,0.7,0.3),8),0,1.15,0), at(box(0.3,0.35,0.3,M(0x1a1c20,0.6,0.4)),0,2.35,0));
    const flameM=new THREE.MeshStandardMaterial({color:0xffd9a0,emissive:0xffb055,emissiveIntensity:2.0,roughness:0.4});
    const flame=new THREE.Mesh(new THREE.SphereGeometry(0.07,8,6), flameM); flame.position.y=2.35; post.add(flame);
    post.position.set(x,gh(x,z),z); S.add(post); circ(Z,x,z,0.2);
    const pt=new THREE.PointLight(0xffB868, 11, 12, 1.9); pt.position.set(x,2.4,z); S.add(pt);
    Z.updaters.push((dt,t)=>{ pt.intensity=11+Math.sin(t*9+x)*1.6+Math.sin(t*23+z)*0.9; flameM.emissiveIntensity=2.0+Math.sin(t*11+x)*0.5; });
  }
  // ground mist
  {
    const n=90, pos=new Float32Array(n*3);
    for(let i=0;i<n;i++) pos.set([rand(-45,45),rand(0.2,1.4),rand(-45,45)],i*3);
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const p=new THREE.Points(g,new THREE.PointsMaterial({color:0x9aa8c8,size:4.2,map:TEX.puff,transparent:true,opacity:0.10,depthWrite:false,blending:THREE.AdditiveBlending}));
    S.add(p);
    Z.updaters.push((dt,t)=>{ const a=g.attributes.position.array;
      for(let i=0;i<n;i++){ a[i*3]+=dt*0.5; if(a[i*3]>45)a[i*3]=-45; }
      g.attributes.position.needsUpdate=true; });
  }
  placeTardis(Z);
  // Ellie
  addNPC(Z, mkNPC('modern',{fem:true,hairStyle:'long',jacket:0x3a4a5e,coatLen:0.4,height:1.65,skin:0xF1C9A8,hair:0x2e2a26}),
    'Ellie Shaw','ellie', 2.5, 39.5, -2.6, {wanderR:0, fearless:true});
  // the angels
  const angelSpots=[[-12,-8],[15,-15],[-18,-26],[8,-30],[3,-20]];
  for(const [x,z] of angelSpots) addAngel(Z,x,z,{});
  return Z;
}
