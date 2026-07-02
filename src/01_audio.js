/* ============================== 01 AUDIO (all synthesized) ============================== */
const A = (()=>{
  let ctx=null, master=null, sfx=null, amb=null, noiseBuf=null;
  let sonicNodes=null, ambNodes=[], humNodes=null;

  function init(){
    if(ctx) return;
    ctx = new (window.AudioContext||window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.85;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value=-18; comp.ratio.value=6;
    master.connect(comp); comp.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value=1; sfx.connect(master);
    amb = ctx.createGain(); amb.gain.value=1; amb.connect(master);
    // shared noise buffer
    const len = ctx.sampleRate*2;
    noiseBuf = ctx.createBuffer(1,len,ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
  }
  const on = ()=> ctx && G.sound;

  function noise(){ const s=ctx.createBufferSource(); s.buffer=noiseBuf; s.loop=true; return s; }
  function env(g, t0, a, peak, dec, sus=0){ g.gain.cancelScheduledValues(t0); g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(Math.max(peak,0.0002), t0+a); g.gain.exponentialRampToValueAtTime(Math.max(sus,0.0001), t0+a+dec); }

  function blip(freq=880, dur=0.07, vol=0.12, type='sine'){
    if(!on())return; const t=ctx.currentTime;
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type; o.frequency.value=freq; env(g,t,0.005,vol,dur);
    o.connect(g); g.connect(sfx); o.start(t); o.stop(t+dur+0.1);
  }
  function sweep(f0,f1,dur,vol=0.15,type='square'){
    if(!on())return; const t=ctx.currentTime;
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(f1,20),t+dur);
    env(g,t,0.006,vol,dur); o.connect(g); g.connect(sfx); o.start(t); o.stop(t+dur+0.1);
  }
  function noiseBurst(dur=0.09, vol=0.2, f=1200, q=1){
    if(!on())return; const t=ctx.currentTime;
    const s=noise(), bp=ctx.createBiquadFilter(), g=ctx.createGain();
    bp.type='bandpass'; bp.frequency.value=f; bp.Q.value=q;
    env(g,t,0.004,vol,dur); s.connect(bp); bp.connect(g); g.connect(sfx);
    s.start(t); s.stop(t+dur+0.1);
  }

  /* ---- named effects ---- */
  const footstep = surface=>{
    const m={wet:[500,0.16],sand:[300,0.10],metal:[900,0.14],moon:[240,0.08],grass:[380,0.09],stone:[600,0.12]}[surface]||[600,0.1];
    noiseBurst(0.055, m[1]*0.9, m[0]+rand(-60,60), 1.2);
    if(surface==='wet'&&Math.random()<0.4) noiseBurst(0.12,0.05,2400,0.6);
    if(surface==='metal') blip(180+rand(-20,20),0.08,0.03,'triangle');
  };
  const ui   = ()=>blip(1320,0.05,0.06,'sine');
  const chime= ()=>{ if(!on())return; [880,1174.7,1568,2093].forEach((f,i)=>setTimeout(()=>blip(f,0.5,0.09,'sine'),i*90)); };
  const hit  = ()=>{ noiseBurst(0.15,0.3,300,0.8); sweep(160,60,0.22,0.25,'sawtooth'); };

  function sonicStart(){
    if(!on()||sonicNodes)return; const t=ctx.currentTime;
    const o1=ctx.createOscillator(), o2=ctx.createOscillator(), g=ctx.createGain(), bp=ctx.createBiquadFilter(), lfo=ctx.createOscillator(), lg=ctx.createGain();
    o1.type='square'; o1.frequency.value=2960; o2.type='sawtooth'; o2.frequency.value=1480;
    bp.type='bandpass'; bp.frequency.value=2900; bp.Q.value=2.2;
    lfo.type='sine'; lfo.frequency.value=13; lg.gain.value=52;
    lfo.connect(lg); lg.connect(o1.frequency);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.055,t+0.05);
    o1.connect(bp); o2.connect(bp); bp.connect(g); g.connect(sfx);
    o1.start(); o2.start(); lfo.start();
    sonicNodes={o1,o2,lfo,g};
  }
  function sonicStop(){
    if(!sonicNodes)return; const t=ctx.currentTime, s=sonicNodes; sonicNodes=null;
    s.g.gain.cancelScheduledValues(t); s.g.gain.setValueAtTime(s.g.gain.value,t); s.g.gain.exponentialRampToValueAtTime(0.0001,t+0.09);
    setTimeout(()=>{try{s.o1.stop();s.o2.stop();s.lfo.stop();}catch(e){}},150);
  }

  const dalekShot = ()=>{ sweep(1500,190,0.16,0.3,'square'); noiseBurst(0.12,0.22,2600,0.7); };
  const dalekAlert= ()=>{ blip(392,0.12,0.14,'square'); setTimeout(()=>blip(311,0.14,0.14,'square'),130); };
  function dalekVoice(text='Exterminate!'){
    dalekAlert();
    if(!G.voice) return;
    try{
      const u=new SpeechSynthesisUtterance(text);
      u.rate=1.15; u.pitch=0.05; u.volume=0.9;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }catch(e){}
  }
  const cyberZap = ()=>{ for(let i=0;i<3;i++)setTimeout(()=>noiseBurst(0.05,0.25,2500+rand(-500,500),3),i*45); sweep(220,90,0.2,0.2,'sawtooth'); };
  const stomp    = ()=>{ if(!on())return; sweep(70,38,0.16,0.4,'sine'); noiseBurst(0.04,0.12,800,1); };
  const autonShot= ()=>{ sweep(980,300,0.12,0.18,'square'); };
  const breakGlass=()=>{ for(let i=0;i<5;i++)setTimeout(()=>noiseBurst(0.09,0.16,3400+rand(-800,800),4),i*30); };
  const sting    = ()=>{ if(!on())return; const t=ctx.currentTime;
    [523.3,554.4,466.2].forEach(f=>{ const o=ctx.createOscillator(),g=ctx.createGain();
      o.type='sawtooth'; o.frequency.value=f; env(g,t,0.06,0.055,1.4);
      o.connect(g); g.connect(sfx); o.start(t); o.stop(t+1.6); }); };
  const doorCreak= ()=>{ sweep(140,90,0.7,0.07,'sawtooth'); };
  const bell     = ()=>{ if(!on())return; const t=ctx.currentTime;
    [196,196.8].forEach(f=>{ const o=ctx.createOscillator(),g=ctx.createGain();
      o.type='sine'; o.frequency.value=f; env(g,t,0.01,0.22,2.6);
      o.connect(g); g.connect(sfx); o.start(t); o.stop(t+2.8); }); };

  function demat(){
    if(!on())return; const t=ctx.currentTime, dur=3.6;
    for(const f0 of [54,56.5]){
      const o=ctx.createOscillator(), g=ctx.createGain(), lp=ctx.createBiquadFilter(), lfo=ctx.createOscillator(), lg=ctx.createGain();
      o.type='sawtooth'; o.frequency.value=f0;
      lp.type='lowpass'; lp.Q.value=7; lp.frequency.value=300;
      lfo.type='sine'; lfo.frequency.value=0.92; lg.gain.value=260;
      lfo.connect(lg); lg.connect(lp.frequency);
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.16,t+0.5);
      g.gain.setValueAtTime(0.16,t+dur-0.7); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      o.connect(lp); lp.connect(g); g.connect(sfx);
      o.start(t); o.stop(t+dur+0.2); lfo.start(t); lfo.stop(t+dur+0.2);
    }
    const s=noise(), lp2=ctx.createBiquadFilter(), g2=ctx.createGain();
    lp2.type='lowpass'; lp2.frequency.value=500;
    g2.gain.setValueAtTime(0.0001,t); g2.gain.exponentialRampToValueAtTime(0.05,t+1.2); g2.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.connect(lp2); lp2.connect(g2); g2.connect(sfx); s.start(t); s.stop(t+dur);
  }

  /* ---- zone ambience: layered loops, crossfaded ---- */
  function stopAmb(){ for(const n of ambNodes){ try{ n.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.8);}catch(e){} setTimeout(()=>{try{n.stop&&n.stop();}catch(e){}; try{n.src&&n.src.stop();}catch(e){}},1000);} ambNodes=[]; }
  function zone(spec){
    if(!ctx||!G.sound)return; stopAmb(); const t=ctx.currentTime;
    // wind/rain noise layer
    if(spec.noise){
      const s=noise(), f=ctx.createBiquadFilter(), g=ctx.createGain(), lfo=ctx.createOscillator(), lg=ctx.createGain();
      f.type=spec.noise.type||'lowpass'; f.frequency.value=spec.noise.f||600; f.Q.value=spec.noise.q||0.8;
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(spec.noise.v||0.05, t+1.5);
      lfo.type='sine'; lfo.frequency.value=0.13; lg.gain.value=(spec.noise.v||0.05)*0.35;
      lfo.connect(lg); lg.connect(g.gain);
      s.connect(f); f.connect(g); g.connect(amb); s.start(); lfo.start();
      ambNodes.push({src:s,g},{src:lfo,g});
    }
    // drone chord layer
    if(spec.drone){
      for(const f0 of spec.drone.notes){
        const o=ctx.createOscillator(), g=ctx.createGain(), lp=ctx.createBiquadFilter();
        o.type=spec.drone.type||'sawtooth'; o.frequency.value=f0; o.detune.value=rand(-6,6);
        lp.type='lowpass'; lp.frequency.value=spec.drone.f||420;
        g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(spec.drone.v||0.018, t+2.2);
        o.connect(lp); lp.connect(g); g.connect(amb); o.start();
        ambNodes.push({src:o,g});
      }
    }
  }

  return { init, get ctx(){return ctx;}, footstep, ui, chime, hit, sonicStart, sonicStop,
    dalekShot, dalekAlert, dalekVoice, cyberZap, stomp, autonShot, breakGlass, sting, doorCreak, bell, demat, zone, blip, sweep, noiseBurst };
})();
