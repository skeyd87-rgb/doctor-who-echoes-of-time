/* ============================== 02 TEXTURES & SHARED MATERIALS ============================== */
const TEX = {};

TEX.policeSign = ctex(512,96,(x,w,h)=>{
  x.fillStyle='#0a1420'; x.fillRect(0,0,w,h);
  x.strokeStyle='#dfe7f2'; x.lineWidth=3; x.strokeRect(6,6,w-12,h-12);
  x.fillStyle='#f2f6fb'; x.textAlign='center'; x.textBaseline='middle';
  x.font='700 44px Arial Narrow, Arial, sans-serif';
  x.fillText('POLICE', 92, h/2);
  x.fillText('BOX', w-84, h/2);
  x.font='700 24px Arial Narrow, Arial, sans-serif';
  x.fillText('PUBLIC', w/2, h/2-16);
  x.fillText('CALL', w/2, h/2+18);
});
TEX.tardisNote = ctex(256,320,(x,w,h)=>{
  x.fillStyle='#e8e4d8'; x.fillRect(0,0,w,h);
  x.strokeStyle='#555'; x.lineWidth=4; x.strokeRect(8,8,w-16,h-16);
  x.fillStyle='#222'; x.textAlign='center';
  x.font='700 26px Georgia, serif'; x.fillText('POLICE TELEPHONE',w/2,48);
  x.font='400 18px Georgia, serif'; x.fillText('FREE',w/2,80);
  x.font='400 13px Georgia, serif';
  ['FOR USE OF','PUBLIC','','ADVICE & ASSISTANCE','OBTAINABLE IMMEDIATELY','','OFFICERS & CARS','RESPOND TO ALL CALLS','','PULL TO OPEN'].forEach((l,i)=>x.fillText(l,w/2,116+i*19));
});
TEX.grate = ctex(256,256,(x,w,h)=>{
  x.fillStyle='#1c2126'; x.fillRect(0,0,w,h);
  x.strokeStyle='#3a444e'; x.lineWidth=3;
  for(let i=0;i<=8;i++){ x.beginPath(); x.moveTo(i*32,0); x.lineTo(i*32,h); x.stroke(); x.beginPath(); x.moveTo(0,i*32); x.lineTo(w,i*32); x.stroke(); }
  x.fillStyle='#454f5a';
  for(let i=0;i<8;i++)for(let j=0;j<8;j++){ x.beginPath(); x.arc(i*32+16,j*32+16,3,0,7); x.fill(); }
});
TEX.grate.wrapS=TEX.grate.wrapT=THREE.RepeatWrapping; TEX.grate.repeat.set(8,8);

TEX.earth = ctex(512,256,(x,w,h)=>{
  const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,'#1a4d8f'); g.addColorStop(.5,'#2a6bb5'); g.addColorStop(1,'#1a4d8f');
  x.fillStyle=g; x.fillRect(0,0,w,h);
  x.fillStyle='#3f7a3a';
  const blob=(cx,cy,r,n=8)=>{ x.beginPath(); for(let i=0;i<=n;i++){ const a=i/n*TAU, rr=r*(0.6+Math.sin(i*3.7+cx)*0.35); x.lineTo(cx+Math.cos(a)*rr*1.6, cy+Math.sin(a)*rr); } x.fill(); };
  blob(90,95,42); blob(150,170,30); blob(300,80,50); blob(360,160,26); blob(430,110,20); blob(60,190,18);
  x.fillStyle='rgba(232,240,248,.85)';
  for(let i=0;i<26;i++){ x.save(); x.translate(rand(w),rand(h)); x.rotate(rand(TAU)); x.fillRect(-rand(20,55),-4,rand(40,110),rand(5,9)); x.restore(); }
  x.fillStyle='rgba(240,246,252,.9)'; x.fillRect(0,0,w,16); x.fillRect(0,h-16,w,16);
});

TEX.moonNoise = ctex(256,256,(x,w,h)=>{
  x.fillStyle='#909095'; x.fillRect(0,0,w,h);
  for(let i=0;i<1400;i++){ const v=randi(115,160); x.fillStyle=`rgb(${v},${v},${v+3})`; x.fillRect(rand(w),rand(h),rand(1,4),rand(1,4)); }
  for(let i=0;i<40;i++){ const r=rand(3,14); x.fillStyle='rgba(80,80,85,.35)'; x.beginPath(); x.arc(rand(w),rand(h),r,0,7); x.fill();
    x.fillStyle='rgba(170,170,175,.3)'; x.beginPath(); x.arc(rand(w),rand(h),r*0.5,0,7); x.fill(); }
});
TEX.moonNoise.wrapS=TEX.moonNoise.wrapT=THREE.RepeatWrapping; TEX.moonNoise.repeat.set(18,18);

/* ---------- procedural PBR textures: height canvas -> albedo + normal map ---------- */
function _heightCanvas(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); return c; }
function _normalFromHeight(hc, strength=2.0){
  const w=hc.width, h=hc.height, src=hc.getContext('2d').getImageData(0,0,w,h).data;
  const out=document.createElement('canvas'); out.width=w; out.height=h;
  const octx=out.getContext('2d'), img=octx.createImageData(w,h), d=img.data;
  const H=(x,y)=>src[(((y+h)%h)*w+((x+w)%w))*4]/255;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const dx=(H(x+1,y)-H(x-1,y))*strength, dy=(H(x,y+1)-H(x,y-1))*strength;
    const inv=1/Math.sqrt(dx*dx+dy*dy+1), i=(y*w+x)*4;
    d[i]=(-dx*inv*0.5+0.5)*255; d[i+1]=(dy*inv*0.5+0.5)*255; d[i+2]=inv*255; d[i+3]=255;
  }
  octx.putImageData(img,0,0);
  const t=new THREE.CanvasTexture(out); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4; return t;
}
function texSet(name, w, h, drawHeight, drawAlbedo, nStrength=2.0){
  const hc=_heightCanvas(w,h,drawHeight);
  const ac=document.createElement('canvas'); ac.width=w; ac.height=h;
  drawAlbedo(ac.getContext('2d'),w,h,hc);
  const map=new THREE.CanvasTexture(ac); map.colorSpace=THREE.SRGBColorSpace; map.wrapS=map.wrapT=THREE.RepeatWrapping; map.anisotropy=8;
  const nrm=_normalFromHeight(hc,nStrength);
  TEX[name]={map,nrm}; return TEX[name];
}
// brick: drawn light so material.color tints it per building
texSet('brick', 256,256, (x,w,h)=>{
  x.fillStyle='#666'; x.fillRect(0,0,w,h);
  const bw=64,bh=32;
  for(let ry=0;ry<h/bh;ry++)for(let cx=-1;cx<w/bw;cx++){
    const ox=(ry%2)*bw/2;
    x.fillStyle=`rgb(${randi(180,225)},${randi(180,225)},${randi(180,225)})`;
    x.fillRect(cx*bw+ox+3, ry*bh+3, bw-6, bh-6);
  }
},(x,w,h,hc)=>{
  x.drawImage(hc,0,0);
  const id=x.getImageData(0,0,w,h), d=id.data;
  for(let i=0;i<d.length;i+=4){ const v=d[i];
    if(v<120){ d[i]=205;d[i+1]=200;d[i+2]=192; }                     // mortar
    else { const j=randi(-14,14); d[i]=225+j; d[i+1]=215+j; d[i+2]=208+j; } }
  x.putImageData(id,0,0);
}, 2.6);
// asphalt: fine noise + patches
texSet('asphalt', 256,256, (x,w,h)=>{
  x.fillStyle='#808080'; x.fillRect(0,0,w,h);
  for(let i=0;i<5200;i++){ const v=randi(90,170); x.fillStyle=`rgb(${v},${v},${v})`; x.fillRect(rand(w),rand(h),randi(1,3),randi(1,3)); }
  for(let i=0;i<14;i++){ x.strokeStyle='rgba(60,60,60,.5)'; x.lineWidth=1.2; x.beginPath();
    let px=rand(w),py=rand(h); x.moveTo(px,py); for(let k=0;k<5;k++){ px+=rand(-24,24); py+=rand(-24,24); x.lineTo(px,py);} x.stroke(); }
},(x,w,h,hc)=>{
  x.fillStyle='#b9bcc2'; x.fillRect(0,0,w,h);
  x.globalAlpha=0.5; x.drawImage(hc,0,0); x.globalAlpha=1;
}, 1.6);
// paving slabs
texSet('paving', 256,256, (x,w,h)=>{
  x.fillStyle='#9a9a9a'; x.fillRect(0,0,w,h);
  for(let ry=0;ry<4;ry++)for(let cx=0;cx<4;cx++){
    x.fillStyle=`rgb(${randi(150,200)},${randi(150,200)},${randi(150,200)})`;
    x.fillRect(cx*64+2, ry*64+2, 60, 60);
  }
  for(let i=0;i<1500;i++){ const v=randi(120,190); x.fillStyle=`rgb(${v},${v},${v})`; x.fillRect(rand(w),rand(h),2,2); }
},(x,w,h,hc)=>{ x.drawImage(hc,0,0);
  const id=x.getImageData(0,0,w,h), d=id.data;
  for(let i=0;i<d.length;i+=4){ const v=d[i]; const j=randi(-8,8);
    d[i]=clamp(v+40+j,0,255); d[i+1]=clamp(v+40+j,0,255); d[i+2]=clamp(v+42+j,0,255); }
  x.putImageData(id,0,0);
}, 2.2);
// wind-rippled sand
texSet('sand', 256,256, (x,w,h)=>{
  x.fillStyle='#808080'; x.fillRect(0,0,w,h);
  for(let y=0;y<h;y++){ const v=128+70*Math.sin(y*0.22+Math.sin(y*0.045)*4);
    x.fillStyle=`rgb(${v|0},${v|0},${v|0})`; x.fillRect(0,y,w,1); }
  for(let i=0;i<2400;i++){ const v=randi(100,170); x.fillStyle=`rgb(${v},${v},${v})`; x.fillRect(rand(w),rand(h),randi(1,3),1); }
},(x,w,h,hc)=>{
  x.fillStyle='#cfae86'; x.fillRect(0,0,w,h);
  x.globalAlpha=0.35; x.drawImage(hc,0,0); x.globalAlpha=1;
}, 1.5);
// mossy grass
texSet('grass', 256,256, (x,w,h)=>{
  x.fillStyle='#777'; x.fillRect(0,0,w,h);
  for(let i=0;i<4200;i++){ const v=randi(70,190); x.fillStyle=`rgb(${v},${v},${v})`;
    x.fillRect(rand(w),rand(h),randi(1,2),randi(2,5)); }
},(x,w,h,hc)=>{
  x.fillStyle='#8fa06a'; x.fillRect(0,0,w,h);
  for(let i=0;i<3600;i++){ x.fillStyle=`rgba(${randi(90,150)},${randi(120,175)},${randi(70,110)},0.8)`;
    x.fillRect(rand(w),rand(h),randi(1,3),randi(2,6)); }
}, 1.4);
// fabric weave (normal only, subtle) — for clothing
texSet('fabric', 128,128, (x,w,h)=>{
  x.fillStyle='#808080'; x.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=3){ x.fillStyle=y%6?'#8c8c8c':'#747474'; x.fillRect(0,y,w,1); }
  for(let X=0;X<w;X+=3){ x.fillStyle=X%6?'#888':'#787878'; x.fillRect(X,0,1,h); }
  for(let i=0;i<600;i++){ const v=randi(110,150); x.fillStyle=`rgb(${v},${v},${v})`; x.fillRect(rand(w),rand(h),1,1); }
},(x,w,h)=>{ x.fillStyle='#fff'; x.fillRect(0,0,w,h); }, 1.1);

/* textured-material cache */
const _tmats=new Map();
function TM(color, rough, metal, texName, repX=1, repY=1, nscale=1){
  const key=color+'|'+rough+'|'+metal+'|'+texName+'|'+repX+'|'+repY+'|'+nscale;
  if(_tmats.has(key)) return _tmats.get(key);
  const t=TEX[texName];
  const map=t.map.clone(); map.repeat.set(repX,repY); map.needsUpdate=true;
  const nrm=t.nrm.clone(); nrm.repeat.set(repX,repY); nrm.needsUpdate=true;
  const m=new THREE.MeshStandardMaterial({color, roughness:rough, metalness:metal, map, normalMap:nrm, normalScale:new THREE.Vector2(nscale,nscale)});
  _tmats.set(key,m); return m;
}

TEX.puff = ctex(64,64,(x,w,h)=>{
  const g=x.createRadialGradient(32,32,2,32,32,30);
  g.addColorStop(0,'rgba(255,255,255,0.85)'); g.addColorStop(0.5,'rgba(255,255,255,0.28)'); g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g; x.fillRect(0,0,w,h);
});

function signTex(text, bg='#26221c', fg='#e8ddc0', font='700 54px Georgia, serif'){
  return ctex(512,128,(x,w,h)=>{
    x.fillStyle=bg; x.fillRect(0,0,w,h);
    x.strokeStyle=fg; x.lineWidth=4; x.strokeRect(8,8,w-16,h-16);
    x.fillStyle=fg; x.font=font; x.textAlign='center'; x.textBaseline='middle';
    x.fillText(text,w/2,h/2+2);
  });
}

/* frequently reused materials */
const MAT = {
  tardisBlue : M(0x0d3a6b, 0.62, 0.05),
  tardisDark : M(0x092a4e, 0.7, 0.05),
  bronze     : M(0xa08040, 0.52, 0.75),
  bronzeDark : M(0x6e5528, 0.55, 0.8),
  gunmetal   : M(0x3d4148, 0.45, 0.8),
  black      : M(0x111114, 0.6, 0.2),
  silver     : M(0xb8bcc6, 0.32, 0.86),
  silverDark : M(0x6f747d, 0.4, 0.85),
  stone      : M(0x99978e, 0.95, 0, {flat:true}),
  stoneDark  : M(0x6f6d66, 0.95, 0, {flat:true}),
  glassBlue  : M(0x9fd4ff, 0.1, 0.1, {transparent:true, opacity:0.28}),
  glow       : (c,i=1.6)=>M(c,0.4,0,{emissive:c,ei:i}),
};
