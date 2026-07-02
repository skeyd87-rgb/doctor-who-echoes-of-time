/* ============================== 11 TOUCH CONTROLS ============================== */
if(G.isTouch){
  document.documentElement.classList.add('touch');
  const cc=document.getElementById('controls-card'); if(cc) cc.style.display='none';

  const wrap=document.createElement('div'); wrap.id='touchui';
  wrap.innerHTML=`
    <div id="tstick"><div id="tstick-k"></div></div>
    <div id="tbtns">
      <div class="tbtn" id="tb-jump">JUMP</div>
      <div class="tbtn" id="tb-act">E</div>
      <div class="tbtn big" id="tb-sonic">SONIC</div>
    </div>
    <div id="tb-pause" class="tbtn">II</div>`;
  document.body.appendChild(wrap);

  const stick=document.getElementById('tstick'), knob=document.getElementById('tstick-k');
  const btns=document.getElementById('tbtns'), pauseBtn=document.getElementById('tb-pause'), actBtn=document.getElementById('tb-act');
  const R=58; let moveId=null, lookId=null, ox=0, oy=0, lx=0, ly=0;

  const showStick=(x,y)=>{ ox=x; oy=y; stick.style.left=(x-70)+'px'; stick.style.top=(y-70)+'px'; stick.style.display='block'; knob.style.transform='translate(0,0)'; };
  const hideStick=()=>{ stick.style.display='none'; G.moveVec=null; G.touchRun=false; };
  const isBtn=t=> t && t.closest && t.closest('.tbtn');

  addEventListener('touchstart', e=>{
    if(G.state!=='play') return;
    for(const t of e.changedTouches){
      if(isBtn(t.target)) continue;
      if(t.clientX < innerWidth*0.5 && moveId===null){ moveId=t.identifier; showStick(t.clientX,t.clientY); e.preventDefault(); }
      else if(t.clientX >= innerWidth*0.5 && lookId===null){ lookId=t.identifier; lx=t.clientX; ly=t.clientY; e.preventDefault(); }
    }
  }, {passive:false});

  addEventListener('touchmove', e=>{
    for(const t of e.changedTouches){
      if(t.identifier===moveId){
        let dx=t.clientX-ox, dy=t.clientY-oy; const d=Math.hypot(dx,dy)||1, cl=Math.min(d,R);
        const nx=dx/d*cl, ny=dy/d*cl;
        knob.style.transform=`translate(${nx}px,${ny}px)`;
        G.moveVec={ x:nx/R, z:-ny/R }; G.touchRun = d/R>0.72;
        e.preventDefault();
      } else if(t.identifier===lookId){
        G.yaw   -= (t.clientX-lx)*0.006;
        G.pitch = Math.max(-0.62, Math.min(0.95, G.pitch-(t.clientY-ly)*0.006));
        lx=t.clientX; ly=t.clientY; e.preventDefault();
      }
    }
  }, {passive:false});

  const end=e=>{ for(const t of e.changedTouches){
    if(t.identifier===moveId){ moveId=null; hideStick(); }
    if(t.identifier===lookId){ lookId=null; } } };
  addEventListener('touchend', end); addEventListener('touchcancel', end);

  const bind=(id,down,up)=>{ const el=document.getElementById(id);
    el.addEventListener('touchstart',e=>{ e.preventDefault(); e.stopPropagation(); el.classList.add('on'); down&&down(); },{passive:false});
    const off=e=>{ e.preventDefault(); e.stopPropagation(); el.classList.remove('on'); up&&up(); };
    el.addEventListener('touchend',off,{passive:false}); el.addEventListener('touchcancel',off,{passive:false});
  };
  bind('tb-sonic', ()=>G.sonicHeld=true, ()=>G.sonicHeld=false);
  bind('tb-jump',  ()=>{ G.pressed.Space=true; });
  bind('tb-act',   ()=>{ G.pressed.KeyE=true; });
  bind('tb-pause', ()=>{ if(G.state==='play') pauseGame(); else if(G.state==='paused') resumeGame(); });

  const prompt=document.getElementById('prompt');
  setInterval(()=>{                         // interval, not rAF — survives backgrounded tabs
    const play=G.state==='play';
    btns.style.display  = play?'flex':'none';
    stick.style.opacity = play?'1':'0';
    pauseBtn.style.display = (play||G.state==='paused')?'flex':'none';
    actBtn.style.visibility = prompt.classList.contains('hidden')?'hidden':'visible';
    if(!play){ if(moveId===null) hideStick(); G.moveVec=null; G.touchRun=false; }
  }, 110);
}
