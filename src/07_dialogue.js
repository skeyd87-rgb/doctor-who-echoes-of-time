/* ============================== 07 DIALOGUE, QUESTS & BANTER ============================== */

function banter(key, text, delay=0, who='riley'){
  if(G.seen[key]) return; G.seen[key]=1;
  setTimeout(()=>say('Riley', text, Math.max(3.2, text.length*0.05), who), delay*1000);
}

/* ---------- quest starters & events ---------- */
function startAutonQuest(){
  if(G.flags.autonsActive) return;
  G.flags.autonsActive=true; G.flags.autonsDown=0;
  const Z=G.zones.london;
  Z.autons.forEach((a,i)=>setTimeout(()=>{ if(a.alive) a.activate(); }, 900+i*650));
  banter('b_autons','Doctor! The window dummies — they\'re WALKING. That\'s not a thing plastic should do!',1.8);
  setTimeout(()=>A.breakGlass(),700);
}
function startDalekQuest(){ G.flags.dalekQuest=true; G.flags.daleksDown=G.flags.daleksDown||0; }
function startMoonQuest(){ G.flags.moonQuest=true; G.flags.regsFixed=0; G.zones.moon.waveT=8; }
function startGraveQuest(){ G.flags.graveQuest=true; banter('b_grave','Statues that move when you\'re not looking. Right. I\'m never blinking again. Ever.',1.2); }

function startRepair(reg){
  G.channel={type:'repair', reg, t:0, need:2.4, x:reg.x, z:reg.z,
    label:'STABILISING REGULATOR', onDone(){
      reg.fixed=true; reg.R.lampM.color.set(0x5affc8); reg.R.lampM.emissive.set(0x2adf98); reg.R.lampM.emissiveIntensity=1.8;
      G.flags.regsFixed=(G.flags.regsFixed||0)+1; A.chime();
      onQuestEvent('regFixed');
    }};
}
function startDoorUnseal(){
  const Z=G.zones.grave;
  G.channel={type:'door', t:0, need:2.0, x:0, z:-31.4,
    label:'UNSEALING THE CRYPT', onDone(){
      G.flags.mausoleumOpen=true;
      const i=Z.aabbs.indexOf(Z.doorBlock); if(i>=0) Z.aabbs.splice(i,1);
      A.doorCreak();
      let k=0; addTrans(dt=>{ k+=dt; Z.mausoleum.door.rotation.y=-Math.min(k*1.4,1)*1.9; return k<1; });
      banter('b_door','Okay. Door\'s open, crypt\'s glowing, statues everywhere. What could possibly go wrong.',0.8);
    }};
}

function recountFragments(){
  G.fragments=['fragLondon','fragSkaro','fragMoon','fragGrave'].reduce((n,f)=>n+(G.flags[f]?1:0),0);
}
function onQuestEvent(type, data){
  const F=G.flags;
  if(type==='autonDown'){ F.autonsDown=(F.autonsDown||0)+1;
    if(F.autonsDown===2) banter('b_auton2','Two down! The sonic thing works — keep buzzing them!');
    if(F.autonsDown>=6 && !F.autonsDone){ F.autonsDone=true;
      G.zones.london.fragLondon.root.visible=true;
      banter('b_autondone','That\'s all of them... Doctor, look — by the shop. Something\'s glowing gold.',1.5);
      G.zones.london.npcs.forEach(n=>{ n.state='idle'; });
    }}
  if(type==='dalekDown'){ F.daleksDown=(F.daleksDown||0)+1;
    if(F.daleksDown===1) banter('b_dalek1','You just talked a DALEK to death with a screwdriver. I take back every joke.');
    if(F.daleksDown>=5 && !F.gateOpen){ F.gateOpen=true;
      banter('b_gate','Patrol\'s down. That big black one by the gate hasn\'t moved... I hate it already.',1); }}
  if(type==='secDown'){ F.secDown=true; banter('b_sec','THAT one. That one was the scary one. Pedestal\'s all yours, Doctor.',1); }
  if(type==='cyberDown'){ F.cybersDown=(F.cybersDown||0)+1; }
  if(type==='regFixed'){
    if(F.regsFixed>=3 && !F.moonDone){ F.moonDone=true;
      banter('b_moondone','Gravity\'s holding! Okafor says the pod they crashed in is still out in the big crater.',1.2); }
    else banter('b_reg'+F.regsFixed,`Regulator ${F.regsFixed} of 3 humming nicely!`);
  }
  if(type==='fragment'){
    recountFragments();
    if(G.fragments===1) banter('b_frag1','So that\'s a piece of the time rupture? It\'s beautiful. In a "probably deadly" way.',1.5);
    if(G.fragments===2) banter('b_frag2','Two of four. Halfway to saving the universe before tea.',1.5);
    if(G.fragments===3) banter('b_frag3','Three! One more, Doctor. I can feel the TARDIS getting impatient from here.',1.5);
    if(G.fragments>=4){ A.bell(); banter('b_frag4','That\'s ALL of them! The console — the rupture — let\'s go home the long way round!',1.8); }
    saveGame();
  }
}

/* ---------- objectives ---------- */
function currentObjective(){
  const F=G.flags, id=G.zone?G.zone.id:'';
  if(G.fragments>=4 && !F.ended) return id==='tardis' ? 'Pull the lever — seal the time rupture' : 'Return to the TARDIS console';
  switch(id){
    case 'london':
      if(!F.metHarlan&&!F.autonsActive) return 'Explore the street — talk to the locals';
      if(F.autonsActive&&!F.autonsDone) return `Disable the Autons — ${F.autonsDown||0} / 6 · hold the sonic on them`;
      if(F.autonsDone&&!F.fragLondon) return 'Take the glowing shard by Harlan\'s shop';
      return 'The TARDIS can travel anywhere. Anywhen.';
    case 'tardis': return 'Use the console to choose a destination';
    case 'skaro':
      if(!F.metVeyra) return 'Something is hiding among the petrified trees';
      if(F.dalekQuest&&(F.daleksDown||0)<5) return `Disable the Dalek patrol — ${F.daleksDown||0} / 5`;
      if((F.daleksDown||0)>=5&&!F.secDown) return 'Face the black Dalek at the city gate';
      if(!F.fragSkaro) return 'Take the fragment from the gate pedestal';
      return 'Skaro is quiet. Too quiet. Head back.';
    case 'moon':
      if(!F.metOkafor) return 'Reach the dome — find the crew';
      if(F.moonQuest&&(F.regsFixed||0)<3) return `Repair the gravity regulators — ${F.regsFixed||0} / 3 · hold off the Cybermen`;
      if(F.moonDone&&!F.fragMoon) return 'Search the crashed cyber-pod in the great crater';
      if(!F.moonQuest) return 'Commander Okafor needs a word';
      return 'Artemis Base is safe. For now.';
    case 'grave':
      if(!F.metEllie) return 'A torchlight waits by the gate';
      if(F.graveQuest&&!F.mausoleumOpen) return 'Unseal the mausoleum — and DON\'T BLINK';
      if(F.mausoleumOpen&&!F.fragGrave) return 'Take the fragment from the crypt — keep watching the angels';
      if(F.fragGrave&&!F.toldEllie) return 'Return to Ellie — walking backwards is allowed';
      return 'The angels are only statues. Probably.';
  }
  return 'Explore';
}

/* ---------- dialogue trees ---------- */
const DLG={

bryce:{ start:()=> G.flags.autonsDone?'post': G.flags.autonsActive?'panic':'n0',
 nodes:{
  n0:{t:'Evening, sir. Bit late for a stroll. That blue box on the corner yours? Only it wasn\'t there when I came on shift, and police boxes don\'t generally... arrive.',
    o:[{t:'It\'s more of a company car.', next:'n1'},{t:'Anything strange tonight, Constable?', next:'n2'},{t:'Goodnight, Constable.'}]},
  n1:{t:'A company car. Right. And I\'m the Lord Mayor. Keep your nose clean, sir, and we\'ll say no more about it.', r:'He\'s going to write us up. We\'re going to get a parking ticket. In 1963.',
    o:[{t:'Anything strange tonight?', next:'n2'},{t:'Goodnight.'}]},
  n2:{t:'Strange? Hm. Old Harlan\'s been flapping about his new window dummies — says they moved. Six pints of mild will do that to a man. Still... third complaint this week, different shops.',
    o:[{t:'Which shop is Harlan\'s?', next:'n3'},{t:'Dummies that move. Noted.'}]},
  n3:{t:'Harlan & Sons, north side, past the lamp there. Tell him to get some sleep — and you as well, sir. Fog\'s coming in off the river.'},
  panic:{t:'GET BACK! The dummies— the blasted DUMMIES are walking! Twenty years on the beat and NOTHING in the manual about this!',
    r:'The manual\'s about to get a very weird appendix.'},
  post:{t:'I saw what you did with that little torch of yours. I don\'t know what you are, sir, and I find I don\'t want to. But this street owes you a debt.',
    o:[{t:'Just doing my rounds, Constable.'},{t:'Look after them, Bryce.'}]},
}},

harlan:{ start:()=> G.flags.fragLondon?'end': G.flags.autonsDone?'post': G.flags.autonsActive?'mid': G.flags.metHarlan?'n1':'n0',
 nodes:{
  n0:{t:'We\'re closed! ...Oh. You don\'t look like a customer. You look like trouble in a nice coat. Are you here about the dummies?', do:()=>{G.flags.metHarlan=true;},
    o:[{t:'Dummies?', next:'n1'},{t:'Trouble in a nice coat is my specialty.', next:'n1b'},{t:'Wrong shop. Goodnight.'}]},
  n1b:{t:'Heh. Well, specialist, my problem\'s in the window. New stock, delivered Tuesday. Nobody ordered it. No invoice, no van, no driver anyone saw.', next:'n1c'},
  n1:{t:'The mannequins. New stock, delivered Tuesday — except nobody ordered them. No invoice. No van. And last night, I\'d swear on my mother\'s grave... one of them turned its head to watch me lock up.', next:'n1c'},
  n1c:{t:'Forty years in haberdashery, sir. I know where I put things. THEY. MOVE.', r:'Doctor. Shop dummies. You\'ve got that face on. The "I know exactly what this is and it\'s bad" face.',
    o:[{t:'Show me the window. Now.', next:'n2', do:()=>{}},{t:'They\'re just mannequins, Mr. Harlan.', next:'n3'}]},
  n2:{t:'That\'s them, large as life— wait. Wait, that one\'s facing the street. They were all facing the till when I locked... oh good lord. Its ARM—', do:()=>startAutonQuest()},
  n3:{t:'That\'s what my Doris said. Then this morning we found footprints in the window display. Plastic doesn\'t leave FOOTPRINTS, sir.',
    o:[{t:'...Show me the window.', next:'n2'},{t:'I\'ll look into it.'}]},
  mid:{t:'They\'re out of the windows! ALL of them! Do something — you\'re the one with the glowing whatsit!'},
  post:{t:'They just... dropped. Like puppets with the strings cut. Sir, whatever you did — thank you. Oh — and that humming thing that fell out of the delivery crate, the glowing one? Couldn\'t stand the sight of it. Left it out front. It\'s YOURS.',
    o:[{t:'Very wise. I\'ll take it off your hands.'}]},
  end:{t:'Street\'s quiet again. First quiet night in a week. You ever need a good winter coat, sir — on the house.'},
}},

dot:{ start:()=> G.flags.autonsDone?'post': G.flags.autonsActive?'panic':'n0',
 nodes:{
  n0:{t:'You\'re new. I know everyone on this street and you are decidedly new. Dot Finch — Finch\'s Fabrics, third generation. Are you with the exchange? You have the look of a man from the exchange.',
    o:[{t:'Just visiting. Lovely street.', next:'n1'},{t:'What\'s the gossip, Mrs. Finch?', next:'n2'}]},
  n1:{t:'Lovely? It\'s damp and the gas board\'s been digging it up since June. But it\'s ours. Mind the puddles, dear.'},
  n2:{t:'Well — since you ask. Harlan\'s got new mannequins that give me the horrors, Vera\'s cellar keeps humming, and last Tuesday every dog on the street howled at nothing for a solid minute. Make of that what you will.',
    r:'Humming cellars and howling dogs. It\'s never just ONE weird thing with you, is it?',
    o:[{t:'The mannequins — tell me more.', next:'n3'},{t:'Thanks, Mrs. Finch.'}]},
  n3:{t:'Horrible smooth faces. And I put two in MY window on consignment, more fool me. If mine start moving, young man, I am retiring to Bournemouth.'},
  panic:{t:'BOURNEMOUTH! I\'m moving to BOURNEMOUTH!'},
  post:{t:'Is it over? My display window is a disgrace and I have never been happier about it. You\'re a strange sort of policeman, but you\'ll do.'},
}},

tommy:{ start:()=> G.flags.autonsDone?'post':'n0',
 nodes:{
  n0:{t:'Mister! Hey, mister! Is that your box? The blue one? My dad says police boxes have telephones inside but I reckon yours is different \'cause it wasn\'t there yesterday and boxes don\'t walk.',
    o:[{t:'Boxes don\'t walk. Boxes FLY.', next:'n1'},{t:'Shouldn\'t you be home, Tommy?', next:'n2'}]},
  n1:{t:'FLY?! I KNEW it! I knew you were a spaceman! Sandra Biggs said you was just a copper but Sandra Biggs doesn\'t know ANYTHING. Can I see inside? Just one look?',
    r:'One day someone\'s going to say no to that face. Not you, obviously.',
    o:[{t:'When you\'re older. The universe isn\'t going anywhere.', next:'n3'},{t:'It\'s bigger on the inside. That\'s all you get.', next:'n3'}]},
  n2:{t:'Mum works late at the Powell Arms. I\'m ALLOWED. Anyway I\'m keeping watch — Mr. Harlan\'s dummies are up to something, everyone says.'},
  n3:{t:'Cor. When I grow up I\'m going to have a flying box AND a dog. You can\'t stop me.'},
  post:{t:'I saw EVERYTHING, mister! The dummies went all stiff and you had a magic torch! Best. Night. EVER.'},
}},

vera:{ start:()=> G.flags.autonsDone?'post':'n0',
 nodes:{
  n0:{t:'We\'re open till eleven, love, and the pie\'s better than the sign suggests. Vera Lane — this is my pub. You look like a man who\'s missed a few dinners.',
    o:[{t:'What\'s the word around here, Vera?', next:'n1'},{t:'Another time. Nice pub.'}]},
  n1:{t:'The word is my cellar\'s been humming like a wasp\'s nest since Tuesday and the brewery says it\'s "settling casks". Settling casks my aunt Fanny. And there\'s lights been seen over the gasworks. Green ones.',
    r:'Humming started Tuesday. The mannequins arrived Tuesday. I\'m starting to see why you never get a day off.',
    o:[{t:'Keep the cellar locked tonight.', next:'n2'},{t:'Green lights. Of course.'}]},
  n2:{t:'Locked and bolted, love. Twenty years behind this bar — I know when a street\'s holding its breath.'},
  post:{t:'Whatever you did out there, the humming\'s stopped. There\'s a plate of pie behind this bar with your name on it. Forever.'},
}},

alf:{ start:()=>'n0',
 nodes:{
  n0:{t:'Evenin\'. Alf Dobbs. Used to drive buses; now I mostly watch the street go by. You\'re the fellow with the box. Saw it arrive, you know. Blink of an eye — nothing, then EVERYTHING. Like the war, that. Things arriving out of clear sky.',
    o:[{t:'You don\'t seem surprised, Alf.', next:'n1'},{t:'Take care of yourself, Alf.'}]},
  n1:{t:'Son, I watched the sky burn in \'41 and the lights come back on in \'45. World\'s stranger and kinder than anyone lets on. A box that arrives from nowhere? Long as it\'s on our side, that\'s just Tuesday.',
    r:'...I like him. Can we keep him?'},
}},

riley:{ start:()=>{ const id=G.zone.id;
    if(G.fragments>=4) return 'final';
    if(id==='grave') return 'grave';
    if(id==='skaro') return 'skaro';
    if(id==='moon') return 'moon';
    if(id==='tardis') return 'tardis';
    return 'london'; },
 nodes:{
  london:{t:'1963! Actual 1963. My gran was six. Everything smells like coal and rain and... chips. Doctor, why does every era smell faintly of chips?',
    o:[{t:'Chips are a universal constant.', next:'l2'},{t:'How are you holding up?', next:'l3'}]},
  l2:{t:'"Chips are a universal constant." I\'m getting that on a T-shirt when we\'re home.'},
  l3:{t:'Honestly? Three weeks ago my biggest problem was a broken Oyster card. Now I\'m in a different DECADE watching you charm policemen. I\'m... great, actually. Weirdly great.'},
  tardis:{t:'I keep finding new corridors. This morning there was a LIBRARY with a swimming pool in it. Was that always there?',
    o:[{t:'The TARDIS rearranges. She shows off for new people.', next:'t2'},{t:'Don\'t touch the pool. Long story.', next:'t3'}]},
  t2:{t:'She? ...Hello, then. Thanks for the library, gorgeous.'},
  t3:{t:'You can\'t just SAY "don\'t touch the pool, long story" and walk off— you absolutely can. You always do.'},
  skaro:{t:'Two suns, Doctor. TWO. And trees made of stone, and the air tastes like burnt matches. This is the most alien I\'ve ever felt and I once ate at a service station on the M25.',
    o:[{t:'Stay close. Skaro doesn\'t forgive carelessness.', next:'s2'},{t:'The forest was alive once. A war petrified it.', next:'s3'}]},
  s2:{t:'Stuck-to-your-coat close. Those pepper-pot things have LASERS, I saw the scorch marks.'},
  s3:{t:'A whole forest, just... stopped. Who wins a war like that? Don\'t answer. I\'ve seen the pepper pots.'},
  moon:{t:'I\'m on the MOON. I\'m standing on the actual MOON and the Earth is right THERE and I can cover it with my thumb. Riley Vance, moonwalker. My mum is never going to believe— I can\'t even TELL my mum!',
    o:[{t:'You can tell her. She won\'t believe you. That\'s the fun part.', next:'m2'},{t:'Low gravity. Try jumping.', next:'m3'}]},
  m2:{t:'She still thinks you\'re "my friend with the van". Doctor, she thinks the TARDIS is a VAN.'},
  m3:{t:'If I jump and float off into space, avenge me. ...Okay one jump. ONE.'},
  grave:{t:'Right, rules. Rule one: don\'t blink. Rule two: don\'t even THINK about blinking. Rule three: why did we come to the haunted graveyard, Doctor. Rule three is a question.',
    o:[{t:'Because someone here needs help. That\'s always why.', next:'g2'},{t:'Blink with one eye at a time. Old trick.', next:'g3'}]},
  g2:{t:'"Someone needs help." Yeah. That\'s why I got in the box. Okay. Watching the statues. Both eyes OPEN.'},
  g3:{t:'One eye at a— that actually works?! You\'re making that up. You\'re NOT making that up?!'},
  final:{t:'Four fragments, one console, and a universe that gets to keep existing because a madman with a box said "no". Come on, Doctor. Lever time. Take us home the scenic way.'},
}},

veyra:{ start:()=> G.flags.secDown?'post': (G.flags.daleksDown||0)>=5?'gate': G.flags.dalekQuest?'mid': 'n0',
 nodes:{
  n0:{t:'DOWN— get DOWN, they sweep this ridge on the quarter-hour— ...You\'re not Kaled. Not Thal. Two hearts... Doctor. My grandmother\'s grandmother told stories about a Doctor.', do:()=>{G.flags.metVeyra=true;},
    o:[{t:'Stories with a blue box in them?', next:'n1'},{t:'Who are you, and why are you this close to a Dalek city?', next:'n2'}]},
  n1:{t:'A blue box, a borrowed face, and a storm behind his eyes. She said when the box comes, Skaro shakes. I am Veyra. Science division — what\'s left of it.', next:'n3'},
  n2:{t:'Veyra. Thal science division. We were surveying the petrified belt when the patrols took my team. I\'ve been in these rocks for two days, counting their sweeps.', next:'n3'},
  n3:{t:'Listen. The city gate holds something that doesn\'t belong here — a shard that SINGS, wrongness given light. The Daleks fear it and guard it in equal measure. Five patrol units, and a black-cased commander at the gate itself.',
    r:'The singing shard. That\'s our fragment, isn\'t it? Of course the Daleks found one. Of course they did.',
    o:[{t:'I\'ll deal with the patrol. Stay hidden.', next:'n4', do:()=>startDalekQuest()},{t:'A black Dalek. Wonderful. Anything else?', next:'n5'}]},
  n4:{t:'Five units, Doctor. Their eyestalks are the weakness — my father blinded one with a mirror once and lived to whisper about it. Your... glowing wand may do better. Go. I\'ll count the silences.'},
  n5:{t:'Yes. The black one does not patrol. It does not speak. It has stood at that gate for six years without moving, and the others are AFRAID of it. Now go — and Doctor? Aim for the eye.',
    do:()=>startDalekQuest()},
  mid:{t:(()=>`Their formation is breaking — I can hear the gaps. ${5-(G.flags.daleksDown||0)} still hunt the dunes. The eyestalk, Doctor. Always the eyestalk.`)},
  gate:{t:'The patrol is SILENT. All five. In two days I have not breathed like this... Now only the black one stands between Skaro and your singing shard. It has never once moved. Perhaps today it learns fear.'},
  post:{t:'It\'s done? The gate stands empty... Doctor, my people will sing of the night the pepper-shakers went quiet. Skaro remembers kindness — it happens so rarely here, we archive each instance.',
    r:'"Archive each instance." I love her. Can we give her a lift home?',
    o:[{t:'Find your team, Veyra. Skaro needs its scientists.'},{t:'Sing the loud version.'}]},
}},

okafor:{ start:()=> G.flags.fragMoon?'end': G.flags.moonDone?'pod': G.flags.moonQuest?'mid': 'n0',
 nodes:{
  n0:{t:'Stop right there. No suit, no radio handshake, and you walked in off the REGOLITH. Unless you\'re the relief crew from Copernicus and severely lost — identify yourself.', do:()=>{G.flags.metOkafor=true;},
    o:[{t:'The Doctor. This is Riley. We\'re here to help.', next:'n1'},{t:'Respiratory bypass. Long story. What\'s your situation, Commander?', next:'n1'}]},
  n1:{t:'Commander Okafor, Artemis Base. Situation: three days ago something CRASHED in the big crater. Since then — metal men. They marched out of the dust, tore into my gravity regulators, and now the base systems are failing one by one.',
    r:'Metal men. Handles on the heads? Please say no handles.',
    o:[{t:'Handles on the heads?', next:'n2'},{t:'Why the regulators?', next:'n3'}]},
  n2:{t:'...Handles. On the heads. You KNOW these things? Then you know why my crew of nine is now a crew of four barricaded in a dome.', next:'n3b'},
  n3:{t:'Kill the gravity plating and the base evacuates. They don\'t want us dead — they want us OUT THERE, in the dark, where they can take us apart and rebuild us into... more of them.', next:'n3b'},
  n3b:{t:'Three regulators are down — the pylons out on the plain. My engineer can talk you through it, but someone has to stand in the open and fix them while those things close in. I\'m out of volunteers, Doctor.',
    o:[{t:'You just found one. Keep your crew inside.', next:'n4', do:()=>startMoonQuest()},{t:'And when the regulators hold?', next:'n5'}]},
  n4:{t:'Then heaven help the metal men. The pylons are marked on the plain — red beacons. Move fast, watch the dust line. That\'s where they come from.'},
  n5:{t:'When they hold, the base seals, and whatever\'s left in that crashed pod stops mattering to me. Salvage rights are yours — you have my blessing and my sympathies.', do:()=>startMoonQuest()},
  mid:{t:(()=>`Regulators: ${G.flags.regsFixed||0} of three stable. My board lights up every time you fix one, Doctor. Keep going — and keep MOVING between pylons.`)},
  pod:{t:'Gravity\'s green across the board. My crew is safe — words I did not expect to say this week. The pod wreck is still hot in the crater; whatever they were carrying, it\'s yours if you\'re brave enough to reach into it.'},
  end:{t:'Artemis Base owes you a debt the paperwork can\'t hold, Doctor. When we\'re back in Houston I\'m telling them EXACTLY what happened, and they are going to bury my report so deep it comes out the other side.'},
}},

priya:{ start:()=> G.flags.moonDone?'post': G.flags.moonQuest?'mid':'n0',
 nodes:{
  n0:{t:'Oh good, visitors, because today wasn\'t enough. Priya Rao, systems engineer, currently keeping this dome alive with tape and spite. Quick physics question: WHERE IS YOUR HELMET?',
    o:[{t:'Respiratory bypass. Time Lord thing.', next:'n1'},{t:'Tell me about the metal men.', next:'n2'}]},
  n1:{t:'"Time Lord thing." Sure. Fine. The man breathes vacuum and I\'ve been rationing OXYGEN. Today is a very stupid day.',
    r:'She\'s my favourite. This is my favourite moon person.'},
  n2:{t:'Cybermen — the Commander says you know the word. Engineering assessment: beautiful, horrible machines. Their neural inhibitor sits behind the faceplate — hit them with a focused EM source and they overload. That torch of yours hums at about the right band, if you hold it steady.',
    o:[{t:'Hold it steady. Got it.', next:'n3'},{t:'How long can the dome hold?', next:'n4'}]},
  n3:{t:'Two seconds of sustained contact, give or take. And whatever you do — don\'t let them get a hand on you. They\'re gentle right up until they aren\'t.'},
  n4:{t:'With three regulators down? Hours. With you out there fixing them? Ask me again when you\'ve fixed them.'},
  mid:{t:'I can see your sonic signature spiking on my board every time you cook one of them. It is the single most satisfying graph of my career.'},
  post:{t:'All regulators green, dome sealed, Cybermen down. I\'m writing this up as "resolved by contractor". You\'re the contractor. Invoice us in mysteries.'},
}},

ellie:{ start:()=> G.flags.toldEllie?'end2': G.flags.fragGrave?'end': G.flags.graveQuest?'mid':'n0',
 nodes:{
  n0:{t:'Who\'s there?! Oh— oh thank god, actual people. I\'m sorry, I— I\'m Ellie. Ellie Shaw. You\'ll think I\'m mad. Everyone thinks I\'m mad.', do:()=>{G.flags.metEllie=true;},
    o:[{t:'Try me. I have a very high bar for mad.', next:'n1'},{t:'What are you doing in a graveyard after dark, Ellie?', next:'n1'}]},
  n1:{t:'My brother. Sam. Three weeks ago he came here at dusk to photograph the old mausoleum — he\'s doing a book on Victorian churchyards. His camera was on the path. His car was still on the street. No Sam.',
    next:'n2'},
  n2:{t:'The police searched twice. Nothing. But I keep coming back, because... you\'ll think I\'m mad. The statues. The weeping angels on the plots. They\'re never where they were the day before. I\'ve been photographing them and they MOVE, and last night one of them was FACING THE GATE.',
    r:'Doctor. Doctor, she means— the don\'t-blink ones. Tell me she doesn\'t mean the don\'t-blink ones.',
    o:[{t:'You\'re not mad, Ellie. Whatever you do — don\'t stop watching them.', next:'n3', do:()=>startGraveQuest()},{t:'Which statue moved?', next:'n4'}]},
  n3:{t:'Not... mad. Right. Watching them. That\'s— you believe me. Three weeks and you\'re the first person who believes me. There\'s something in the mausoleum, isn\'t there? The door\'s sealed but it GLOWS at night. Green, then gold.'},
  n4:{t:'The tall one with the split wing — it was by the yew tree for eighty YEARS, it\'s in every photograph of this place since the war. This morning it was six plots closer to the gate. Statues don\'t walk, except I think... I think these do.',
    do:()=>startGraveQuest(), next:'n3'},
  mid:{t:'I\'m staying by the gate with the lantern like you said. They haven\'t crossed the light line... I counted five of them. There were four yesterday. Please hurry.'},
  end:{t:'You came back — you actually came— what IS that, it\'s singing— ...A letter came this morning. Solicitor\'s office, held in trust since 1958. It\'s Sam\'s handwriting, Doctor. He says he\'s SORRY. He says he lived to eighty-one, married a girl called June, planted the apple tree by the east fence. The tree in his own photograph. He\'d been photographing his OWN TREE.', do:()=>{G.flags.toldEllie=true;},
    r:'Oh... oh, Doctor. The angel didn\'t kill him. It just... posted him. He had a whole life. She got to say goodbye — most people never get the letter.',
    o:[{t:'The angels send you back. Sam landed in 1958 — and he built a good life there. He never stopped being your brother, Ellie.', next:'end3'},{t:'(Say nothing. Let her read it again.)', next:'end3'}]},
  end3:{t:'Eighty-one. June. An apple tree. I\'m going to go home, and sleep, and then I\'m going to find June\'s family and ask for every photograph they\'ve got. Thank you. Whatever you are — thank you for making the world make sense sideways.'},
  end2:{t:'I picked an apple from Sam\'s tree on the way out. It\'s the best apple I\'ve ever had, and I cried the whole time. Take care of yourself, Doctor. Watch the statues.'},
}},
};
