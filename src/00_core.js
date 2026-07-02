/* ============================== 00 CORE ============================== */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI*2, PI = Math.PI;
const V3 = (x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const rand=(a=1,b)=> b===undefined ? Math.random()*a : a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const damp=(cur,tgt,l,dt)=>lerp(cur,tgt,1-Math.exp(-l*dt));
const angNorm=a=>{while(a>PI)a-=TAU;while(a<-PI)a+=TAU;return a;};
const angDamp=(cur,tgt,l,dt)=>cur+angNorm(tgt-cur)*(1-Math.exp(-l*dt));
const dist2=(ax,az,bx,bz)=>{const dx=ax-bx,dz=az-bz;return Math.sqrt(dx*dx+dz*dz);};

/* ---------- global game state ---------- */
const G = {
  state:'menu',            // menu | play | dialogue | travel | paused | vortex | dead | ending
  time:0, quality:new URLSearchParams(location.search).has('low')?'low':'high',
  debug:new URLSearchParams(location.search).has('debug'),
  yaw:0, pitch:-0.12, sens:0.0023,
  keys:{}, pressed:{}, sonicHeld:false,
  hp:100, maxhp:100, lastHit:-99,
  flags:{}, seen:{},       // quest flags, one-shot banter keys
  zones:{}, zone:null,     // id -> Zone, active Zone
  tardisAt:'london', returnZone:'london',
  player:null, companion:null,
  camOverride:null,        // debug free camera {pos, yaw, pitch}
  voice:true, sound:true,
};
window.DW = { G, THREE };  // debug handle

/* ---------- renderer ---------- */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(62, innerWidth/innerHeight, 0.08, 900);
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(new THREE.Scene(), camera);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), 0.42, 0.55, 0.82);
composer.addPass(renderPass);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function applyQuality(){
  const hi = G.quality==='high';
  renderer.setPixelRatio(hi?Math.min(devicePixelRatio,2):1);
  bloom.enabled = hi;
  for(const id in G.zones){const s=G.zones[id].sun; if(s&&s.shadow){s.shadow.mapSize.setScalar(hi?2048:1024); if(s.shadow.map){s.shadow.map.dispose();s.shadow.map=null;}}}
  renderer.shadowMap.enabled = true;
  resize();
}
function resize(){
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight);
}
addEventListener('resize', resize); resize();

/* ---------- input ---------- */
addEventListener('keydown', e=>{
  if(e.repeat) return;
  G.keys[e.code]=true; G.pressed[e.code]=true;
  if(e.code==='Tab') e.preventDefault();
});
addEventListener('keyup', e=>{ G.keys[e.code]=false; });
addEventListener('mousedown', e=>{ if(e.button===0) G.sonicHeld=true; });
addEventListener('mouseup',   e=>{ if(e.button===0) G.sonicHeld=false; });
addEventListener('mousemove', e=>{
  if(document.pointerLockElement!==canvas) return;
  G.yaw   -= e.movementX*G.sens;
  G.pitch = clamp(G.pitch - e.movementY*G.sens, -0.62, 0.95);
});
canvas.addEventListener('click', ()=>{ if(G.state==='play' && document.pointerLockElement!==canvas && !G.debug) canvas.requestPointerLock(); });
document.addEventListener('pointerlockchange', ()=>{
  if(document.pointerLockElement!==canvas && G.state==='play' && !G.debug) pauseGame(true);
});

/* ---------- helpers: materials & geometry ---------- */
const _mats = new Map();
function M(color, rough=0.8, metal=0, o={}){
  const key = color+'|'+rough+'|'+metal+'|'+JSON.stringify(o);
  if(_mats.has(key)) return _mats.get(key);
  const m = new THREE.MeshStandardMaterial({color, roughness:rough, metalness:metal});
  if(o.flat) m.flatShading=true;
  if(o.emissive!==undefined){ m.emissive=new THREE.Color(o.emissive); m.emissiveIntensity=o.ei??1; }
  if(o.transparent){ m.transparent=true; m.opacity=o.opacity??0.5; }
  if(o.side) m.side=o.side;
  _mats.set(key,m); return m;
}
function shadows(m){ m.castShadow=true; m.receiveShadow=true; return m; }
function box(w,h,d,mat){ return shadows(new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat)); }
function rbox(w,h,d,r,mat,seg=3){ return shadows(new THREE.Mesh(new RoundedBoxGeometry(w,h,d,seg,r), mat)); }
function cyl(rt,rb,h,mat,seg=20,open=false){ return shadows(new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg,1,open), mat)); }
function sph(r,mat,ws=18,hs=13){ return shadows(new THREE.Mesh(new THREE.SphereGeometry(r,ws,hs), mat)); }
function hemi(r,mat,ws=20){ return shadows(new THREE.Mesh(new THREE.SphereGeometry(r,ws,12,0,TAU,0,PI/2), mat)); }
function cap(r,len,mat){ return shadows(new THREE.Mesh(new THREE.CapsuleGeometry(r,len,5,12), mat)); }
function cone(r,h,mat,seg=16){ return shadows(new THREE.Mesh(new THREE.ConeGeometry(r,h,seg), mat)); }
function tor(r,t,mat,s1=12,s2=24){ return shadows(new THREE.Mesh(new THREE.TorusGeometry(r,t,s1,s2), mat)); }
function pl(w,h,mat){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h), mat); m.receiveShadow=true; return m; }
function grp(...kids){ const g=new THREE.Group(); for(const k of kids) g.add(k); return g; }
function at(obj,x,y,z,rx=0,ry=0,rz=0){ obj.position.set(x,y,z); obj.rotation.set(rx,ry,rz); return obj; }
function markStatic(root){ root.traverse(o=>{ o.matrixAutoUpdate=false; o.updateMatrix(); }); return root; }
function mergeGeos(list){
  let g=BufferGeometryUtils.mergeGeometries(list);
  if(!g) g=BufferGeometryUtils.mergeGeometries(list.map(x=>x.index?x.toNonIndexed():x));
  return g;
}
function ctex(w,h,draw){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}
/* sprite with text (floating labels like EXTERMINATE) */
function textSprite(text, color='#ff5a3c', size=26){
  const pad=18, c=document.createElement('canvas'); const x=c.getContext('2d');
  x.font=`800 ${size}px Segoe UI, sans-serif`;
  c.width=Math.ceil(x.measureText(text).width)+pad*2; c.height=size+pad*2;
  const x2=c.getContext('2d'); x2.font=`800 ${size}px Segoe UI, sans-serif`;
  x2.shadowColor='rgba(0,0,0,.9)'; x2.shadowBlur=10; x2.fillStyle=color;
  x2.textAlign='center'; x2.textBaseline='middle'; x2.fillText(text,c.width/2,c.height/2);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t, transparent:true, depthWrite:false}));
  sp.scale.set(c.width/110, c.height/110, 1); return sp;
}

/* ---------- zone factory ---------- */
function newZone(id, title, sub, opt={}){
  const scene = new THREE.Scene();
  const Z = {
    id, title, sub, scene,
    sun:null, bound:opt.bound??90, gravity:opt.gravity??-20, jumpV:opt.jumpV??6.4,
    groundHeight:opt.groundHeight??(()=>0),
    aabbs:[], circles:[], npcs:[], enemies:[], pickups:[], interactables:[], updaters:[], projectiles:[],
    spawn:opt.spawn??{x:0,z:6,yaw:0}, tardis:opt.tardis??{x:3,z:2,yaw:0},
    surface:opt.surface??'stone', ambience:opt.ambience??{}, visited:false,
  };
  G.zones[id]=Z; return Z;
}
function aabb(Z,x1,z1,x2,z2){ Z.aabbs.push({x1:Math.min(x1,x2),z1:Math.min(z1,z2),x2:Math.max(x1,x2),z2:Math.max(z1,z2)}); }
function circ(Z,x,z,r){ Z.circles.push({x,z,r}); }
function addInteract(Z,o){ Z.interactables.push(o); return o; }

/* line-of-sight vs zone AABBs (2D, sampled) */
function losBlocked(Z, ax,az, bx,bz){
  const d=dist2(ax,az,bx,bz), steps=Math.max(2,Math.ceil(d/1.4));
  for(let i=1;i<steps;i++){
    const t=i/steps, x=lerp(ax,bx,t), z=lerp(az,bz,t);
    for(const b of Z.aabbs) if(x>b.x1&&x<b.x2&&z>b.z1&&z<b.z2) return true;
  }
  return false;
}

/* ---------- shared vfx: spark bursts ---------- */
const _bursts=[];
function sparkBurst(scene, pos, color=0x9fd8ff, n=26, speed=5, life=0.7, gravity=-7){
  const geo=new THREE.BufferGeometry();
  const p=new Float32Array(n*3), v=[];
  for(let i=0;i<n;i++){ p[i*3]=pos.x; p[i*3+1]=pos.y; p[i*3+2]=pos.z;
    const th=rand(TAU), ph=rand(-1,1);
    v.push(V3(Math.cos(th)*Math.sqrt(1-ph*ph), ph*1.2+0.5, Math.sin(th)*Math.sqrt(1-ph*ph)).multiplyScalar(rand(speed*0.35,speed))); }
  geo.setAttribute('position', new THREE.BufferAttribute(p,3));
  const mat=new THREE.PointsMaterial({color, size:0.085, transparent:true, opacity:1, blending:THREE.AdditiveBlending, depthWrite:false});
  const pts=new THREE.Points(geo,mat); scene.add(pts);
  _bursts.push({pts,v,life,age:0,gravity,scene});
}
function updateBursts(dt){
  for(let i=_bursts.length-1;i>=0;i--){
    const b=_bursts[i]; b.age+=dt;
    if(b.age>=b.life){ b.scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); _bursts.splice(i,1); continue; }
    const arr=b.pts.geometry.attributes.position.array;
    for(let j=0;j<b.v.length;j++){ b.v[j].y+=b.gravity*dt;
      arr[j*3]+=b.v[j].x*dt; arr[j*3+1]+=b.v[j].y*dt; arr[j*3+2]+=b.v[j].z*dt; }
    b.pts.geometry.attributes.position.needsUpdate=true;
    b.pts.material.opacity=1-(b.age/b.life);
  }
}
