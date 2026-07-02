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
