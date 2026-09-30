'use strict';
/* Big Top Bedlam: rules, stages, rendering and the main loop */
const cv=document.getElementById('c'),ctx=cv.getContext('2d'),wrap=document.getElementById('wrap');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch=matchMedia('(pointer: coarse)').matches||('ontouchstart' in window);
if(isTouch)document.body.classList.add('touch');
const AUTOPLAY=/autoplay/.test(location.hash);
let RS=1,T=0;
function resize(){
  const cs=getComputedStyle(wrap);
  const vw=wrap.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),vh=wrap.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
  let w=vw,h=vw*9/16;if(h>vh){h=vh;w=vh*16/9;}
  cv.style.width=Math.floor(w)+'px';cv.style.height=Math.floor(h)+'px';
  const dpr=Math.min(window.devicePixelRatio||1,2);RS=Math.max(.4,Math.min(w*dpr/W,1.5));cv.width=Math.round(W*RS);cv.height=Math.round(H*RS);
}
addEventListener('resize',resize);resize();
const GRAV=3000,JV=1100;

/* ======================= INPUT ======================= */
const IN={h:{},p:{},prev:{},kb:{},tc:{},gp:{},latch:{}};
const ACTS=['left','right','jump','down','dash','super','start','pause','mute','back'];
const KEYMAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',KeyZ:'jump',KeyK:'jump',ArrowDown:'down',KeyS:'down',ShiftLeft:'dash',ShiftRight:'dash',KeyX:'dash',KeyJ:'dash',KeyC:'super',KeyE:'super',KeyL:'super',Enter:'start',Escape:'pause',KeyP:'pause',KeyM:'mute',KeyQ:'back'};
addEventListener('keydown',e=>{const a=KEYMAP[e.code];if(!a)return;e.preventDefault();audioInit();if(!IN.kb[a])IN.latch[a]=true;IN.kb[a]=true;});
addEventListener('keyup',e=>{const a=KEYMAP[e.code];if(a){IN.kb[a]=false;e.preventDefault();}});
addEventListener('blur',()=>{IN.kb={};IN.tc={};});
document.querySelectorAll('[data-a]').forEach(el=>{
  const a=el.dataset.a;
  el.addEventListener('pointerdown',e=>{e.preventDefault();audioInit();try{el.setPointerCapture(e.pointerId);}catch(_){}if(!IN.tc[a])IN.latch[a]=true;IN.tc[a]=true;el.classList.add('on');});
  const off=()=>{IN.tc[a]=false;el.classList.remove('on');};
  el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('lostpointercapture',off);
});
cv.addEventListener('pointerdown',()=>{audioInit();cv.focus();if(mode!=='play'&&mode!=='intro')IN.latch.start=true;});
function pollPad(){
  IN.gp={};const pads=navigator.getGamepads?navigator.getGamepads():[];
  for(const g of pads){if(!g)continue;const b=i=>g.buttons[i]&&g.buttons[i].pressed,ax=g.axes[0]||0,ay=g.axes[1]||0;
    if(ax<-.4||b(14))IN.gp.left=true;if(ax>.4||b(15))IN.gp.right=true;if(ay>.55||b(13))IN.gp.down=true;
    if(b(0)||b(12))IN.gp.jump=true;if(b(2)||b(5)||b(7))IN.gp.dash=true;if(b(3)||b(1))IN.gp.super=true;
    if(b(9)){IN.gp.pause=true;IN.gp.start=true;}if(b(8))IN.gp.back=true;}
}
function computeInput(){for(const a of ACTS){const h=!!(IN.kb[a]||IN.tc[a]||IN.gp[a]);IN.p[a]=!!(IN.latch[a]||(h&&!IN.prev[a]));IN.h[a]=h;IN.prev[a]=h;}IN.latch={};}

/* ======================= ASSETS ======================= */
const SPR={lion:{run:[],crouch:[],idle:[]},clown:{run:[],balance:[],cheer:[]},rider:{ride:[]},monkey:{},crow:[]},BGS={};
let ready=false,loadP=0,loadMsg='Raising the tent',VIG=null;const GRAIN=[];
function saddleOf(P){const th=P.pitch,px=-6,py=-32;return[px*Math.cos(th)-py*Math.sin(th),px*Math.sin(th)+py*Math.cos(th)-80+P.bob+P.cr];}
function lionFrame(mode,t){const P=lionPose(mode,t),s=bake(340,250,174,218,g=>drawLionG(g,P));s.sad=saddleOf(P);return s;}
const clownFrame=(k,p)=>bake(150,215,66,194,g=>drawClownG(g,clownPose(k,p)));
const riderFrame=(k,p)=>bake(160,195,66,140,g=>drawClownG(g,clownPose(k,p)));
const monkeyFrame=(k,p,v)=>bake(92,100,46,90,g=>drawMonkeyG(g,monkeyPose(k,p),v));
function makeCurtain(){
  const w=720,c=mkCanvas(w,H),g=c.getContext('2d'),folds=11,R=rng(3);
  for(let i=0;i<folds;i++){const x0=i*w/folds,x1=x0+w/folds;g.fillStyle=lgrad(g,x0,0,x1,0,[[0,'#2e0308'],[.3,'#9a111c'],[.55,'#d73540'],[.78,'#850d17'],[1,'#2e0308']]);g.fillRect(x0,0,x1-x0+1,H);}
  for(let i=0;i<2600;i++){g.fillStyle=`rgba(255,${120+R()*90},${120+R()*70},${R()*.05})`;g.fillRect(R()*w,R()*H,1,2+R()*8);}
  g.fillStyle=vgrad(g,0,H,[[0,'rgba(0,0,0,.5)'],[.22,'rgba(0,0,0,0)'],[.85,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.45)']]);g.fillRect(0,0,w,H);
  g.fillStyle=lgrad(g,0,H-44,0,H-34,[[0,'#ffe08a'],[1,'#8a5a14']]);g.fillRect(0,H-46,w,10);
  for(let x=2;x<w;x+=5){g.strokeStyle=x%10?'#e8b44a':'#9a6a1c';g.lineWidth=2;g.beginPath();g.moveTo(x,H-36);g.lineTo(x+1,H-10);g.stroke();}
  return c;
}
function makeValance(){
  const c=mkCanvas(W,110),g=c.getContext('2d');
  g.fillStyle=vgrad(g,0,90,[[0,'#3a040a'],[1,'#9a111c']]);g.beginPath();g.moveTo(0,0);g.lineTo(W,0);
  for(let x=W;x>=0;x-=80){g.lineTo(x,60);g.quadraticCurveTo(x-40,96,x-80,60);}g.closePath();g.fill();
  g.strokeStyle=lgrad(g,0,0,W,0,[[0,'#8a5a14'],[.5,'#ffe08a'],[1,'#8a5a14']]);g.lineWidth=5;g.beginPath();for(let x=0;x<W;x+=80){g.moveTo(x,56);g.quadraticCurveTo(x+40,92,x+80,56);}g.stroke();
  for(let x=40;x<W;x+=80){g.strokeStyle='#e8b44a';g.lineWidth=2;g.beginPath();g.moveTo(x,78);g.lineTo(x,96);g.stroke();g.beginPath();g.arc(x,100,5,0,TAU);g.fillStyle='#d9a23a';g.fill();}
  return c;
}
function loadTasks(){
  const t=[];
  t.push(['Lighting the lamps',()=>{buildFxSprites();buildProps();VIG=mkCanvas(W,H);const g=VIG.getContext('2d');g.fillStyle=rgrad(g,W/2,H*.48,H*.38,H*1.02,[[0,'rgba(12,4,2,0)'],[1,'rgba(12,4,2,.72)']]);g.fillRect(0,0,W,H);
    for(let k=0;k<3;k++){const c=mkCanvas(256,256),q=c.getContext('2d'),id=q.createImageData(256,256);for(let i=0;i<id.data.length;i+=4){const v=Math.random()*255;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255;}q.putImageData(id,0,0);GRAIN.push(ctx.createPattern(c,'repeat'));}}]);
  t.push(['Painting the big top',()=>{BGS.ruby=buildTent(THEMES.ruby,11);}]);
  t.push(['Painting the big top',()=>{BGS.royal=buildTent(THEMES.royal,33);}]);
  t.push(['Rigging the high wire',()=>{BGS.wire=buildWireSky();BGS.rope=makeRopeTile();}]);
  t.push(['Sweeping the sawdust',()=>{BGS.floorA=makeFloor(H-594,false,9);BGS.floorC=makeFloor(H-624,true,10);BGS.curbA=makeCurb(THEMES.ruby);BGS.curbC=makeCurb(THEMES.royal);
    BGS.fgPoleA=makeFgPole(THEMES.ruby);BGS.fgPoleC=makeFgPole(THEMES.royal);BGS.fgHeads=makeFgHeads();BGS.curtain=makeCurtain();BGS.valance=makeValance();}]);
  t.push(['Seating the audience',()=>{buildPeople();BGS.rowsA=buildRows(610,21,THEMES.ruby);BGS.rowsC=buildRows(640,23,THEMES.royal);}]);
  for(let i=0;i<16;i++)t.push(['Warming up the lion',()=>SPR.lion.run.push(lionFrame('run',i/16))]);
  for(let i=0;i<12;i++)t.push(['Warming up the lion',()=>SPR.lion.crouch.push(lionFrame('crouch',i/12))]);
  for(let i=0;i<8;i++)t.push(['Warming up the lion',()=>SPR.lion.idle.push(lionFrame('idle',i/8))]);
  t.push(['Warming up the lion',()=>{SPR.lion.up=lionFrame('up',0);SPR.lion.down=lionFrame('down',0);SPR.lion.hurt=lionFrame('hurt',0);}]);
  for(const k of['run','balance'])for(let i=0;i<12;i++)t.push(['Painting the clown',()=>SPR.clown[k].push(clownFrame(k,i/12))]);
  for(let i=0;i<8;i++)t.push(['Painting the clown',()=>SPR.clown.cheer.push(clownFrame('cheer',i/8))]);
  t.push(['Painting the clown',()=>{for(const k of['jump','fall','duck','hurt'])SPR.clown[k]=clownFrame(k,.2);for(let i=0;i<8;i++)SPR.rider.ride.push(riderFrame('ride',i/8));SPR.rider.duck=riderFrame('rideDuck',0);SPR.rider.hurt=riderFrame('rideHurt',0);}]);
  for(const v of['brown','blue','pink'])t.push(['Dressing the monkeys',()=>{const M={walk:[],carry:[],top:[]};for(let i=0;i<8;i++){M.walk.push(monkeyFrame('walk',i/8,v));M.carry.push(monkeyFrame('carry',i/8,v));M.top.push(monkeyFrame('top',i/8,v));}
    M.stand=monkeyFrame('stand',0,v);M.jump=monkeyFrame('jump',0,v);M.knock=monkeyFrame('knock',0,v);SPR.monkey[v]=M;}]);
  t.push(['Training the crows',()=>{for(let i=0;i<8;i++){const f=Math.sin(i/8*TAU);SPR.crow.push(bake(124,110,62,62,g=>drawCrowG(g,f)));}}]);
  return t;
}
async function loadAll(){const t=loadTasks();for(let i=0;i<t.length;i++){loadMsg=t[i][0];t[i][1]();loadP=(i+1)/t.length;await new Promise(r=>setTimeout(r,0));}ready=true;if(AUTOPLAY){score=0;superM=0;startStage(parseInt((location.hash.match(/stage(\d)/)||[0,0])[1])||0,false);}}

/* ======================= STATE ======================= */
const STAGES=[
  {act:'ACT I',name:'RING OF FIRE',mode:'lion',G:610,END:11000,bpm:124,tr:0,par:48},
  {act:'ACT II',name:'THE HIGH WIRE',mode:'clown',G:560,END:10600,bpm:128,tr:-7,par:54},
  {act:'ACT III',name:'BALL BEDLAM',mode:'clown',G:640,END:9000,bpm:130,tr:-3,par:52,balls:true},
];
let mode='loading',mt=0,SI=0,ST=STAGES[0],ents=[],parts=[],pops=[],banners=[],PL=null,stats=null,motes=[];
let score=0,best=0,unlocked=0,cpX=0,stopT=0,flashT=0,superM=0,cheerT=0,ET=0,paused=false,titleSel=0,introShown=false,resRev=0,stampDone=false,finalShown=false;
const cam={x:0,shake:0};
const curt={k:1,dir:-1,hold:.4,cb:null};
function load(){try{const s=JSON.parse(localStorage.getItem('big-top-bedlam')||'{}');best=s.best||0;unlocked=clamp(s.unlocked||0,0,2);}catch(e){}}
function save(){try{localStorage.setItem('big-top-bedlam',JSON.stringify({best,unlocked}));}catch(e){}}
const MS=1.15,monkeyH=e=>71+(e.kinds.length-1)*50;

function wpick(R,list){let t=0;for(const l of list)t+=l[1];let r=R()*t;for(const l of list){r-=l[1];if(r<=0)return l[0];}return list[0][0];}
function build(i){
  const st=STAGES[i],R=rng(1000+i*77),out=[],G=st.G;
  const pot=x=>out.push({type:'pot',x,seed:R()*100});
  const ring=(x,o={})=>{const ry=182.5,cy=(o.high?G-172:G-61)-ry;out.push({type:'ring',x,vx:-(o.v||120),high:!!o.high,bag:!!o.bag,pink:!!o.bag,cy,ry,rx:28,seed:R()*100,px:x,py:cy-ry*.3});};
  const cannon=(x,y)=>out.push({type:'cannon',x,y});
  const monkey=(x,kinds,v,o={})=>{const e=Object.assign({type:'monkey',x,kinds,vx:-v,ph:R()*6,jy:0,jvy:0,lv:0,hop:.3+R()*.6,px:x,py:G-30,pink:kinds[kinds.length-1]==='pink'},o);out.push(e);return e;};
  const bird=(x,y,v)=>out.push({type:'bird',x,y,vx:-v,ph:R()*6});
  if(i===0){
    let x=1100;const END=st.END;
    while(x<END-800){const d=x/END,tight=1-d*.25;
      if(d<.14){if(R()<.55){pot(x);x+=560+R()*160;}else{ring(x);x+=700+R()*150;}continue;}
      switch(wpick(R,[['pot',3],['ring',3],['pot2',1+2*d],['bag',1.1],['high',1.6+d],['cannon',.8+2*d],['fast',2.4*d],['combo',.6+2*d]])){
        case 'pot':pot(x);x+=(470+R()*220)*tight;break;
        case 'ring':ring(x,{v:110+R()*50});x+=(560+R()*220)*tight;break;
        case 'pot2':pot(x);pot(x+340);x+=(870+R()*160)*tight;break;
        case 'bag':ring(x,{bag:true,v:110});x+=650*tight;break;
        case 'high':ring(x,{high:true,v:130});x+=(620+R()*150)*tight;break;
        case 'cannon':cannon(x,G-168);x+=(560+R()*150)*tight;break;
        case 'fast':ring(x,{v:240});x+=(640+R()*160)*tight;break;
        case 'combo':pot(x);ring(x+520,{v:120});x+=(980+R()*150)*tight;break;
      }}
  }else if(i===1){
    let x=950;const END=st.END;
    while(x<END-800){const d=x/END,tight=1-d*.3;
      if(d<.1){monkey(x,['brown'],170);x+=560;continue;}
      switch(wpick(R,[['m',2],['m2',1+d],['stack2',1.6+d],['stack3',.6+2.4*d],['pinkTop',1],['frog',1.4+1.6*d],['frogStack',.4+1.6*d],['fast',1+d],['blue',.8+d],['bag',1+d],['birdH',.8+d],['birdL',.6+d],['cannon',.5+d]])){
        case 'm':monkey(x,['brown'],180+R()*60);x+=(470+R()*170)*tight;break;
        case 'm2':monkey(x,['brown'],180);monkey(x+130,['brown'],180);x+=(690+R()*140)*tight;break;
        case 'stack2':monkey(x,['brown','brown'],160+R()*40);x+=(560+R()*150)*tight;break;
        case 'stack3':monkey(x,['brown','brown','brown'],150);x+=(640+R()*150)*tight;break;
        case 'pinkTop':monkey(x,['brown',R()<.5?'brown':'blue','pink'].slice(R()<.5?1:0),150);x+=(600+R()*150)*tight;break;
        case 'frog':{const a=monkey(x,['brown'],180),b=monkey(x+120,['brown'],180);a.frog=b;b.frog=a;b.leapT=.35;a.leapT=99;x+=(760+R()*150)*tight;}break;
        case 'frogStack':{const a=monkey(x,['brown','brown'],160),b=monkey(x+150,['blue'],160,{noHop:true});b.frog=a;b.leapT=.3;b.leapOnly=true;x+=(820+R()*150)*tight;}break;
        case 'fast':monkey(x,['brown'],320);x+=(540+R()*150)*tight;break;
        case 'blue':monkey(x,['blue'],170);x+=(560+R()*150)*tight;break;
        case 'bag':{const L=G+60-128;out.push({type:'bag',x,py0:-60,L,amp:.55+R()*.25,w:2.6+R(),ph:R()*6,bx:x,by:-60+L});x+=(560+R()*150)*tight;}break;
        case 'birdH':bird(x+300,G-118,330);x+=(500+R()*150)*tight;break;
        case 'birdL':bird(x+300,G-32,300);x+=(500+R()*150)*tight;break;
        case 'cannon':cannon(x,G-118);x+=(520+R()*150)*tight;break;
      }}
  }else{
    const mk=(x0,r,Am,w,ph)=>({type:'ball',x0,x:x0+Am*Math.sin(ph),r,A:Am,w,ph,ang:0,vx:0,keep:true});
    let x=260,pr=72,pA=0;out.push(mk(x,72,0,1,0));
    for(;;){const d=x/9000,r=56+R()*18,Am=d<.08?0:12+R()*(22+d*20),gap=pA+Am+16+R()*(30+d*36),nx=x+pr+gap+r;if(nx>8800)break;out.push(mk(nx,r,Am,1.1+R()*.8,R()*TAU));x=nx;pr=r;pA=Am;}
    const px=Math.round(x+pr+pA+90+120);st.END=px;
    out.push({type:'pedestal',x:px,top:G-150,w:240,keep:true});
    let hx=1400;while(hx<px-700){if(R()<.6)bird(hx,G-270,280+R()*60);else out.push({type:'balloon',x:hx,y:G-330,pink:true,px:hx,py:G-330});hx+=650+R()*500;}
  }
  out.push({type:'cp',x:Math.round(st.END*.5),keep:true});
  return out;
}
function newPlayer(x,y){return{x,y,vx:0,vy:0,prevY:y,onG:true,crouch:false,dashT:0,dashCD:0,dashDir:1,airDash:true,coy:0,jbuf:0,inv:0,hp:3,ph:0,sx:1,sy:1,face:1,ball:null,koT:0};}
function startStage(i,fromCP){
  SI=i;ST=STAGES[i];
  if(!fromCP){cpX=0;stats={time:0,hits:0,parries:0,rings:0,stomps:0,supers:0};}
  ents=build(i);parts=[];pops=[];banners=[];fireP=[];ET=0;paused=false;stopT=0;finalShown=false;
  if(cpX>0)ents=ents.filter(e=>e.keep||e.x>cpX+150);
  const sx=cpX>0?cpX:(i===1?120:220);
  PL=newPlayer(sx,ST.G);
  if(ST.balls){let b=null,bd=1e9;for(const e of ents)if(e.type==='ball'&&Math.abs(e.x-sx)<bd){bd=Math.abs(e.x-sx);b=e;}PL.x=b.x;PL.y=ST.G-2*b.r;PL.ball=b;}
  cam.x=Math.max(0,PL.x-W*.34);
  mode='intro';mt=0;introShown=false;
  addBanner(ST.name,fromCP?'FROM THE CHECKPOINT':ST.act,1.15,COL.cream,92);
  musicPlay(ST.bpm,ST.tr);
}
function toTitle(){mode='title';mt=0;paused=false;titleSel=Math.min(titleSel,unlocked);cam.x=0;parts=[];pops=[];banners=[];fireP=[];PL=null;best=Math.max(best,score);save();musicPlay(118,0,{mellow:true});}
function toFinale(){mode='finale';mt=0;cam.x=0;parts=[];pops=[];best=Math.max(best,score);save();musicPlay(128,0);}
function curtainTo(cb){if(curt.dir!==0)return;curt.dir=1;curt.cb=cb;SFX.curtain();}
function addBanner(txt,sub,dur=1.3,col=COL.cream,size=110){banners.push({txt,sub,t:0,dur,col,size});}
function addPop(txt,x,y,col='#ffe08a',big=false,sub=null){pops.push({txt,x,y,t:0,col,big,sub});}
function addScore(n,x,y,label,col){score+=n;addPop(label||('+'+n),x,y,col||'#ffe08a',false,label?'+'+n:null);}

/* ======================= PARTICLES ======================= */
function P_(o){parts.push(Object.assign({t:0,life:.6,vx:0,vy:0,r:6,rot:0,vr:0,g:0,seed:Math.random()*99},o));}
function dust(x,y,n){for(let i=0;i<n;i++)P_({k:'puff',x:x+(Math.random()-.5)*50,y:y-6,vx:(Math.random()-.5)*190,vy:-Math.random()*70,r:9+Math.random()*9,life:.45+Math.random()*.25,col:'#e6d3ae'});}
function stars(x,y,n,col='#ffe08a',sp=360){for(let i=0;i<n;i++){const a=i/n*TAU+Math.random()*.3;P_({k:'star',x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:8+Math.random()*6,life:.5,vr:8,col,g:300});}}
const CONF=[COL.red,COL.gold,COL.teal,COL.pink,COL.cream,'#3f6fd8'];
function confetti(x,y,n,sp=300){for(let i=0;i<n;i++)P_({k:'conf',x,y,vx:(Math.random()-.5)*sp*2,vy:-Math.random()*sp-60,life:1.8+Math.random(),col:CONF[i%CONF.length],vr:(Math.random()-.5)*14,g:520});}
function updateParticles(dt){
  for(const q of parts){q.t+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=q.g*dt;q.rot+=q.vr*dt;if(q.k==='puff'){q.vx*=.94;q.vy*=.94;}if(q.k==='conf')q.vx*=.985;}
  parts=parts.filter(q=>q.t<q.life);if(parts.length>500)parts.splice(0,parts.length-500);
  for(const q of pops)q.t+=dt;pops=pops.filter(q=>q.t<1);
  updFire(dt);
  if(!motes.length)for(let i=0;i<40;i++)motes.push({x:Math.random()*W,y:Math.random()*H,s:.6+Math.random()*1.6,v:6+Math.random()*14,ph:Math.random()*9});
  for(const m of motes){m.y-=m.v*dt;m.x+=Math.sin(T*.6+m.ph)*8*dt;if(m.y<-10){m.y=H+10;m.x=Math.random()*W;}}
}

/* ======================= PLAYER & RULES ======================= */
function pBoxes(){const p=PL,x=p.x,y=p.y;if(ST.mode==='lion')return p.crouch?[[x-78,y-88,x+100,y-5],[x-24,y-136,x+24,y-84]]:[[x-80,y-112,x+96,y-5],[x-22,y-196,x+22,y-100]];return p.crouch?[[x-22,y-88,x+22,y-2]]:[[x-18,y-140,x+18,y-2]];}
function hitCircle(cx,cy,r){for(const b of pBoxes()){const nx=clamp(cx,b[0],b[2]),ny=clamp(cy,b[1],b[3]);if((nx-cx)**2+(ny-cy)**2<r*r)return true;}return false;}
function hitRect(x1,y1,x2,y2){for(const b of pBoxes())if(b[0]<x2&&b[2]>x1&&b[1]<y2&&b[3]>y1)return true;return false;}
function land(){const p=PL;p.sx=1.18;p.sy=.84;SFX.land();dust(p.x,p.y,5);}
function hurt(){
  const p=PL;if(p.inv>0||mode!=='play')return false;
  p.hp--;stats.hits++;p.inv=1.5;stopT=.1;cam.shake=16;flashT=.1;SFX.hit();
  stars(p.x,p.y-(ST.mode==='lion'?150:90),9,'#ffe08a',340);
  p.vy=Math.min(p.vy,-520);p.vx=-260;p.onG=false;p.ball=null;p.dashT=0;
  if(p.hp<=0){mode='ko';mt=0;p.koT=0;musicStop();SFX.ko();addBanner('CURTAINS!',null,1.4,'#ff6a5a',130);}
  return true;
}
function fell(){
  const p=PL;SFX.land();stars(p.x,ST.G-10,6,'#d9e2e6',260);
  if(p.inv<=0)hurt();
  if(mode!=='play')return;
  let best_=null,bd=1e9;
  for(const b of ents){if(b.type!=='ball')continue;const sx=b.x-cam.x;if(sx<120||sx>W-160)continue;const d=Math.abs(b.x-(p.x+80));if(d<bd){bd=d;best_=b;}}
  if(!best_)for(const b of ents){if(b.type!=='ball')continue;const d=Math.abs(b.x-p.x);if(d<bd){bd=d;best_=b;}}
  p.x=best_.x;p.y=ST.G-2*best_.r;p.prevY=p.y;p.vy=0;p.vx=0;p.ball=best_;p.onG=true;p.airDash=true;p.dashT=0;p.inv=Math.max(p.inv,1.3);
  p.sx=1.25;p.sy=.78;dust(p.x,p.y,6);addPop('OOPS!',p.x,p.y-190,COL.cream,true);
}
function knockTop(e,fy){
  const k=e.kinds.pop();ents.push({type:'mfly',x:e.x,y:fy-e.kinds.length*50,kind:k,vx:240+Math.random()*80,vy:-760,rot:0});
  if(!e.kinds.length)e.dead=true;e.pink=e.kinds.length>0&&e.kinds[e.kinds.length-1]==='pink';
}
function tryParry(){
  const p=PL,lion=ST.mode==='lion',cy=p.y-(lion?130:80),rad=lion?115:92;
  for(const e of ents){
    if(!e.pink||e.dead)continue;
    const ex=e.type==='monkey'?e.x:e.px,ey=e.type==='monkey'?ST.G+e.jy-monkeyH(e)+30:e.py;
    if(Math.hypot(ex-p.x,ey-cy)>rad)continue;
    if(e.type==='ring'){e.bag=false;e.pink=false;}
    else if(e.type==='monkey')knockTop(e,ST.G+e.jy);
    else e.dead=true;
    p.vy=-(lion?1000:960);p.airDash=true;p.jbuf=0;stopT=.09;superM=Math.min(5,superM+1);stats.parries++;cheerT=1.4;
    addScore(500,ex,ey-40,'PARRY!',COL.pink);SFX.parry();
    for(let i=0;i<12;i++)P_({k:'star',x:ex,y:ey,vx:Math.cos(i/12*TAU)*400,vy:Math.sin(i/12*TAU)*400,r:9,life:.45,col:i%2?COL.pink:'#fff0f6',vr:9});
    return true;
  }
  return false;
}
function doSuper(){
  superM=0;stats.supers++;flashT=.35;cam.shake=20;stopT=.15;SFX.superS();PL.inv=Math.max(PL.inv,2);cheerT=2.4;
  addBanner('SHOWSTOPPER!',null,1.1,COL.pink,104);
  for(const e of ents){if(e.dead)continue;const sx=(e.bx??e.x)-cam.x;if(sx<-60||sx>W+60)continue;
    if(e.type==='bag'){e.amp=0;e.done=true;continue;}
    if(['pot','ring','monkey','cball','bird','warn'].includes(e.type)){e.dead=true;const cy=e.type==='ring'?e.cy:e.type==='pot'?ST.G-50:e.type==='monkey'?ST.G-40:(e.y??ST.G-40);confetti(e.x,cy,20,400);score+=150;}}
  addPop('BIG TOP BONUS!',PL.x,PL.y-250,COL.gold,true);
}
function stageClear(){
  if(mode!=='play')return;
  mode='clear';mt=0;musicStop();SFX.fanfare();cheerT=3.6;PL.vx=0;PL.dashT=0;PL.crouch=false;
  addBanner('BRAVO!',null,1.9,COL.gold,140);
  for(let i=0;i<4;i++)confetti(cam.x+W*(.2+i*.2),H*.3,28,440);
  unlocked=Math.max(unlocked,Math.min(2,SI+1));save();
}
function beginResults(){
  stats.tb=Math.max(0,Math.round(ST.par*1.5-stats.time))*50;stats.hb=PL.hp*1000;score+=stats.tb+stats.hb;
  let s=PL.hp;const t=stats.time;s+=t<=ST.par?2:t<=ST.par*1.35?1:0;s+=Math.min(stats.parries,2)*.5;s+=stats.hits===0?.5:0;
  stats.grade=s>=6?'A+':s>=5?'A':s>=4.5?'A-':s>=4?'B+':s>=3?'B':s>=2.5?'B-':'C';
  best=Math.max(best,score);save();resRev=0;stampDone=false;musicPlay(118,0,{mellow:true});
}
let stepDT=1/120;
function groundBalls(){
  const p=PL,G=ST.G;
  if(p.ball){const b=p.ball;p.x+=b.vx*stepDT;const dx=p.x-b.x;
    if(Math.abs(dx)>b.r*.84||p.vy<0){p.ball=null;p.onG=false;}else{p.y=G-b.r-Math.sqrt(b.r*b.r-dx*dx);p.vy=0;p.onG=true;return;}}
  p.onG=false;
  if(p.vy>=0){
    for(const b of ents){if(b.type!=='ball')continue;const dx=p.x-b.x;if(Math.abs(dx)<b.r*.84){const top=G-b.r-Math.sqrt(b.r*b.r-dx*dx);if(p.prevY<=top+10&&p.y>=top){p.y=top;p.vy=0;p.ball=b;p.onG=true;p.airDash=true;land();return;}}}
    for(const e of ents){if(e.type==='pedestal'&&Math.abs(p.x-e.x)<e.w/2&&p.prevY<=e.top+10&&p.y>=e.top){p.y=e.top;p.vy=0;p.onG=true;land();stageClear();return;}}
  }
  if(p.y>=G-6)fell();
}
function stepPlay(dt,first){
  stepDT=dt;
  const p=PL,lion=ST.mode==='lion',G=ST.G,h=IN.h;
  ET+=dt;stats.time+=dt;
  if(AUTOPLAY){p.inv=Math.max(p.inv,.5);p.hp=3;}
  if(first&&IN.p.super&&superM>=5)doSuper();
  if(ST.balls)for(const b of ents)if(b.type==='ball'){const nx=b.x0+b.A*Math.sin(b.w*ET+b.ph);b.vx=(nx-b.x)/dt;b.ang+=(nx-b.x)/b.r;b.x=nx;}
  const dir=(h.right?1:0)-(h.left?1:0);
  p.crouch=!!h.down&&p.onG&&p.dashT<=0;
  const mF=lion?560:480,mB=lion?340:420,k=p.crouch?.4:1;
  if(p.dashT>0){p.dashT-=dt;p.vx=p.dashDir*(lion?1150:1050);p.vy=0;if(Math.random()<dt*40)P_({k:'puff',x:p.x-p.dashDir*50,y:p.y-(lion?80:60)+(Math.random()-.5)*40,vx:-p.dashDir*60,vy:-20,r:10,life:.35,col:'#efe3c8'});}
  else{const tg=dir>0?mF*k:dir<0?-mB*k:0;p.vx=approach(p.vx,tg,(p.onG?4800:3200)*dt);}
  if(dir&&!lion)p.face=dir;
  if(first&&IN.p.jump)p.jbuf=.13;else p.jbuf-=dt;
  p.coy=p.onG?.09:p.coy-dt;
  if(first&&IN.p.jump&&!p.onG&&p.coy<=0)tryParry();
  if(p.jbuf>0&&p.coy>0){p.vy=-JV;p.onG=false;p.coy=0;p.jbuf=0;p.ball=null;p.sx=.86;p.sy=1.14;SFX.jump();dust(p.x,p.y,4);}
  p.dashCD-=dt;
  if(first&&IN.p.dash&&p.dashCD<=0&&(p.onG||p.airDash)){p.dashT=.16;p.dashCD=.45;p.dashDir=dir||(lion?1:p.face);if(!p.onG)p.airDash=false;p.ball=null;SFX.dash();for(let i=0;i<6;i++)P_({k:'puff',x:p.x-p.dashDir*30,y:p.y-20-Math.random()*(lion?120:90),vx:-p.dashDir*(80+Math.random()*90),vy:-10,r:9+Math.random()*6,life:.4,col:'#efe3c8'});}
  if(p.dashT<=0){let g=GRAV;if(p.vy<0&&!h.jump)g*=2.2;if(h.down&&!p.onG)g*=1.7;p.vy=Math.min(p.vy+g*dt,1900);}
  p.prevY=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;
  if(p.x<60){p.x=60;p.vx=Math.max(0,p.vx);}
  if(ST.balls)groundBalls();
  else{if(p.y>=G){if(!p.onG)land();p.y=G;p.vy=0;p.onG=true;p.airDash=true;}else p.onG=false;}
  if(mode!=='play')return;
  p.sx=lerp(p.sx,1,Math.min(1,dt*14));p.sy=lerp(p.sy,1,Math.min(1,dt*14));
  p.ph+=lion?(p.onG?p.vx*dt/30:dt*3):(p.onG?(Math.abs(p.vx)>40?Math.abs(p.vx)*dt/26:dt*3):dt*2);
  p.inv=Math.max(0,p.inv-dt);
  const prog=clamp(p.x/ST.END,0,1);
  MUS.target=ST.bpm*(1+.16*smooth(clamp((prog-.55)/.45,0,1)));MUS.rush=prog>.78?clamp((prog-.78)/.1,0,1):0;
  if(!finalShown&&prog>.82){finalShown=true;addBanner('FINAL STRETCH!',null,1,COL.gold,70);cheerT=Math.max(cheerT,2);}
  if(cpX<ST.END*.5&&p.x>=ST.END*.5){cpX=Math.round(ST.END*.5);addPop('CHECKPOINT!',p.x,p.y-(lion?250:190),'#9fe0d0',true);SFX.checkpoint();}
  for(const e of ents)if(!e.dead)updE(e,dt);
  ents=ents.filter(e=>!e.dead);
  if(mode==='play'&&!ST.balls&&p.x>=ST.END)stageClear();
}
function updE(e,dt){
  const p=PL,G=ST.G,onScreen=e.x-cam.x<W+140,vis=e.x-cam.x>-200&&e.x-cam.x<W+200;
  switch(e.type){
    case 'pot':
      if(vis){const n=Math.floor(dt*80+Math.random());for(let i=0;i<n;i++)emitFlame(e.x+(Math.random()-.5)*56,G-74,22,0,-150);if(Math.random()<dt*16)emitSpark(e.x+(Math.random()-.5)*30,G-100);if(Math.random()<dt*5)emitSmoke(e.x,G-150,18);}
      if(hitRect(e.x-26,G-86,e.x+26,G)){if(hurt())e.hitP=true;}
      if(!e.done&&p.x-60>e.x+30){e.done=true;if(!e.hitP){addScore(100,e.x,G-120);superM=Math.min(5,superM+.1);}}
      break;
    case 'ring':{
      if(!e.act&&onScreen)e.act=true;if(e.act)e.x+=e.vx*dt;
      if(vis){const n=Math.floor(dt*220+Math.random());for(let i=0;i<n;i++){const a=Math.random()*TAU;emitFlame(e.x+Math.cos(a)*(e.rx+3),e.cy+Math.sin(a)*(e.ry+3),20,Math.cos(a)*40,-110);}
        if(Math.random()<dt*14){const a=-Math.random()*PI;emitSpark(e.x+Math.cos(a)*e.rx,e.cy+Math.sin(a)*e.ry);}if(Math.random()<dt*3)emitSmoke(e.x,e.cy-e.ry-30,20);}
      e.px=e.x;e.py=e.cy-e.ry*.3;
      if(hitCircle(e.x,e.cy-e.ry,14)||hitCircle(e.x,e.cy+e.ry,14)){if(hurt())e.hitP=true;}
      if(!e.done&&e.x<p.x-30){e.done=true;if(!e.hitP){
        if(e.high&&p.onG)addScore(150,e.x,e.cy+e.ry-50,'DUCKED!');
        else{addScore(200,e.x,e.cy,'THROUGH!');stats.rings++;superM=Math.min(5,superM+.25);SFX.ring();cheerT=Math.max(cheerT,.6);for(let i=0;i<16;i++)emitSpark(e.x,e.cy+(Math.random()-.5)*e.ry*1.6);}}}
      if(e.x<cam.x-300)e.dead=true;}break;
    case 'cannon':
      if(!e.fired&&p.x>e.x-200){e.fired=true;ents.push({type:'warn',t:.85,y:e.y,x:cam.x+W-58});SFX.warn();}
      break;
    case 'warn':
      e.t-=dt;e.x=cam.x+W-58;
      if(e.t<=0){e.dead=true;ents.push({type:'cball',x:cam.x+W+60,y:e.y,vx:-820,r:22});SFX.boom();cam.shake=Math.max(cam.shake,7);
        for(let i=0;i<10;i++)P_({k:'puff',x:cam.x+W-10,y:e.y+(Math.random()-.5)*40,vx:-100-Math.random()*240,vy:(Math.random()-.5)*90,r:16+Math.random()*12,life:.7,col:'#d9d0bf'});
        for(let i=0;i<14;i++)emitFlame(cam.x+W-20,e.y+(Math.random()-.5)*20,16,-300-Math.random()*200,0);}
      break;
    case 'cball':
      e.x+=e.vx*dt;if(Math.random()<dt*34)P_({k:'puff',x:e.x+26,y:e.y,vx:50,vy:-20,r:8,life:.45,col:'#cfc6b4'});
      if(hitCircle(e.x,e.y,e.r-2)){if(hurt())e.hitP=true;}
      if(!e.done&&e.x<p.x-40){e.done=true;if(!e.hitP)addScore(100,e.x,e.y-50,'DODGED!');}
      if(e.x<cam.x-120)e.dead=true;break;
    case 'mfly':e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=2400*dt;e.rot+=dt*14;if(e.y>H+220)e.dead=true;break;
    case 'monkey':{
      if(!e.act&&onScreen)e.act=true;if(!e.act)break;
      e.x+=(e.vx+e.lv)*dt;e.ph+=dt*14;
      if(e.frog&&!e.frog.dead){e.leapT-=dt;const q=e.frog;if(e.leapT<=0&&e.jy===0&&e.x>q.x-10){const peak=monkeyH(q)+26;e.jvy=-Math.sqrt(2*GRAV*peak);const air=2*(-e.jvy)/GRAV;e.lv=-((e.x-q.x)+110)/air;e.leapT=99;if(!e.leapOnly&&q.frog===e)q.leapT=air+.3;SFX.squeal();}}
      else if(e.kinds[0]==='blue'&&!e.noHop){e.hop-=dt;if(e.hop<=0&&e.jy===0){e.jvy=-760;e.hop=1;}}
      if(e.jvy!==0||e.jy<0){e.jvy+=GRAV*dt;e.jy+=e.jvy*dt;if(e.jy>=0){e.jy=0;e.jvy=0;e.lv=0;}}
      const fy=G+e.jy,hh=monkeyH(e),top=fy-hh+6;
      if(!e.pink&&p.vy>0&&Math.abs(p.x-e.x)<42&&p.prevY<=top+16&&p.y>=top){
        knockTop(e,fy);p.vy=-820;p.y=top;p.airDash=true;const lvl=e.kinds.length+1;
        addScore(300*lvl,e.x,top-24,lvl>1?`STOMP x${lvl}!`:'STOMP!');superM=Math.min(5,superM+.35);stats.stomps++;cheerT=Math.max(cheerT,1);SFX.stomp();stars(e.x,top,7);break;}
      if(hitRect(e.x-23,fy-hh+4,e.x+23,fy)){if(hurt())e.hitP=true;}
      if(!e.done&&e.x<p.x-50){e.done=true;if(!e.hitP)addScore(100*e.kinds.length,e.x,fy-hh-30);}
      if(e.x<cam.x-200)e.dead=true;}break;
    case 'bag':{
      const a=e.amp*Math.sin(e.w*ET+e.ph);e.bx=e.x+Math.sin(a)*e.L;e.by=e.py0+Math.cos(a)*e.L;
      if(hitCircle(e.bx,e.by,26)){if(hurt())e.hitP=true;}
      if(!e.done&&e.x<p.x-140){e.done=true;if(!e.hitP)addScore(100,e.x,G-200);}}break;
    case 'bird':
      if(!e.act&&onScreen){e.act=true;if(ST.balls)e.y=(p.onG?p.y:G-128)-118;}
      if(!e.act)break;
      e.x+=e.vx*dt;e.ph+=dt*14;
      if(hitCircle(e.x,e.y,20)){if(hurt())e.hitP=true;}
      if(!e.done&&e.x<p.x-40){e.done=true;if(!e.hitP)addScore(100,e.x,e.y-50);}
      if(e.x<cam.x-150)e.dead=true;break;
    case 'balloon':e.px=e.x;e.py=e.y+Math.sin(ET*2+e.x)*10;break;
  }
}

/* ======================= WORLD RENDER ======================= */
function tileX(img,par,y,w=img.width,h=img.height){let ox=-((cam.x*par)%w);if(ox>0)ox-=w;for(let x=ox;x<W;x+=w)ctx.drawImage(img,x,y,w,h);}
let beamX=[];
function beams(G){
  ctx.save();ctx.globalCompositeOperation='lighter';beamX=[];
  for(let i=0;i<3;i++){const sx=W*(.18+.32*i)+Math.sin(T*.5+i*2.1)*240,tx=sx+Math.sin(T*.8+i*1.3)*300;beamX.push(tx);
    const gr=ctx.createLinearGradient(0,0,0,G);gr.addColorStop(0,'rgba(255,236,190,.15)');gr.addColorStop(1,'rgba(255,220,160,.035)');
    ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(sx-14,-10);ctx.lineTo(sx+14,-10);ctx.lineTo(tx+110,G);ctx.lineTo(tx-110,G);ctx.closePath();ctx.fill();}
  ctx.restore();
}
function drawCrowd(rows){
  const bp=beatPhase(),TILE=2048;
  for(const row of rows){const s=row.scale,off=(cam.x*row.par)%TILE;
    for(const p of row.people){let sx=p.x-off;if(sx<-40)sx+=TILE;if(sx>W+40)continue;
      const hype=cheerT>0&&p.ex,pose=hype?1:(p.clap&&Math.floor(bp*2+p.ph*4)%2===0?2:0);
      const bob=Math.abs(Math.sin((bp+p.ph)*PI))*(hype?7:2.4)*s,spr=PEOPLE[p.s][pose];
      ctx.drawImage(spr.c,sx-spr.ox*s,row.y-bob-spr.oy*s,spr.w*s,spr.h*s);}
    const pw=512;let po=-((cam.x*row.par)%pw);if(po>0)po-=pw;for(let x=po;x<W;x+=pw)ctx.drawImage(row.plank,x,row.y-3,pw,40*s+8);
    ctx.fillStyle=vgrad(ctx,rows[0].y-110,row.y+40*s,[[0,'rgba(14,6,4,0)'],[.35,'rgba(14,6,4,.13)'],[1,'rgba(14,6,4,.13)']]);ctx.fillRect(0,rows[0].y-110,W,row.y-rows[0].y+110+40*s);}
  ctx.save();ctx.globalCompositeOperation='saturation';ctx.fillStyle=vgrad(ctx,rows[0].y-120,ST.G,[[0,'rgba(128,128,128,0)'],[.3,'rgba(128,128,128,.32)'],[1,'rgba(128,128,128,.32)']]);ctx.fillRect(0,rows[0].y-120,W,ST.G-rows[0].y+120);ctx.restore();
  ctx.fillStyle=vgrad(ctx,rows[0].y-60,ST.G,[[0,'rgba(12,5,3,0)'],[1,'rgba(12,5,3,.28)']]);ctx.fillRect(0,rows[0].y-60,W,ST.G-rows[0].y+60);
}
function drawTentStage(){
  const G=ST.G,A_=SI===0;
  tileX(A_?BGS.ruby:BGS.royal,.12,0);
  beams(G);
  drawCrowd(A_?BGS.rowsA:BGS.rowsC);
  tileX(A_?BGS.curbA:BGS.curbC,.8,G-66,512,60);
  tileX(A_?BGS.floorA:BGS.floorC,1,G-16);
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const bx of beamX){ctx.globalAlpha=.35;ctx.drawImage(FXS.white,bx-150,G-26,300,70);}
  if(PL){ctx.globalAlpha=.55;ctx.drawImage(FXS.white,PL.x-cam.x-190,ST.G-30,380,80);}
  ctx.restore();
}
function drawWireStage(){
  const G=ST.G;tileX(BGS.wire,.1,0);
  const par=.5,sp=820,off=cam.x*par,k0=Math.floor(off/sp)-1;
  for(let k=k0;k<k0+4;k++){const px=k*sp+300-off,a=Math.sin(T*1.4+k*1.7)*.35,L=250,bx=px+Math.sin(a)*L,by=-20+Math.cos(a)*L;
    ctx.strokeStyle='rgba(6,10,12,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px-30,-20);ctx.lineTo(bx-30,by);ctx.moveTo(px+30,-20);ctx.lineTo(bx+30,by);ctx.stroke();
    ctx.lineWidth=7;ctx.strokeStyle='#1a2226';ctx.beginPath();ctx.moveTo(bx-34,by);ctx.lineTo(bx+34,by);ctx.stroke();}
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){const bx=W*(.2+.3*i)+Math.sin(T*.4+i*2)*260,tx=bx+Math.sin(T*.7+i)*320;const gr=ctx.createLinearGradient(0,H,0,0);gr.addColorStop(0,'rgba(190,230,255,.14)');gr.addColorStop(1,'rgba(190,230,255,0)');
    ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(bx-16,H+10);ctx.lineTo(bx+16,H+10);ctx.lineTo(tx+160,-20);ctx.lineTo(tx-160,-20);ctx.closePath();ctx.fill();}
  if(PL){const px=PL.x-cam.x,py=PL.y-70;ctx.globalAlpha=.7;ctx.drawImage(FXS.white,px-240,py-220,480,440);}
  ctx.restore();
  /* safety net far below */
  const noff=(cam.x*.9)%36;ctx.strokeStyle='rgba(215,200,170,.22)';ctx.lineWidth=1.2;ctx.beginPath();
  for(let x=-noff-60;x<W+60;x+=36){ctx.moveTo(x,650);ctx.lineTo(x+40,720);ctx.moveTo(x+40,650);ctx.lineTo(x,720);}
  ctx.moveTo(0,650);ctx.lineTo(W,650);ctx.stroke();
}
let ropePat=null;
function drawDecor(){
  const G=ST.G,END=ST.END;
  if(SI===1){
    for(let x=900;x<END;x+=1800){if(x<cam.x-60||x>cam.x+W+60)continue;ctx.fillStyle=lgrad(ctx,x-9,0,x+9,0,[[0,'#1a1008'],[.5,'#7a5230'],[1,'#1a1008']]);ctx.fillRect(x-9,G+4,18,H-G);
      ctx.strokeStyle='rgba(20,12,6,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,G+4);ctx.lineTo(x-220,H+20);ctx.moveTo(x,G+4);ctx.lineTo(x+220,H+20);ctx.stroke();}
    platform(-460,70,G);platform(END-40,END+760,G);
    if(!ropePat)ropePat=ctx.createPattern(BGS.rope,'repeat');
    ctx.save();ctx.translate(0,G-5);ctx.fillStyle=ropePat;ctx.fillRect(Math.max(40,cam.x-40),0,Math.min(END,cam.x+W+40)-Math.max(40,cam.x-40),11);ctx.restore();
    ctx.strokeStyle='rgba(20,10,4,.8)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(40,G-5);ctx.lineTo(END,G-5);ctx.moveTo(40,G+6);ctx.lineTo(END,G+6);ctx.stroke();
    ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(40,G+7,END-40,5);
  }
  for(let x=Math.max(1000,Math.ceil((cam.x-100)/1000)*1000);x<cam.x+W+100&&x<END-200;x+=1000)meterSign(x,Math.round((END-x)/100));
  if(SI!==2)drawFinish(END,G);
}
function platform(x0,x1,top){
  const cx=(x0+x1)/2;ctx.fillStyle=lgrad(ctx,cx-14,0,cx+14,0,[[0,'#140a06'],[.5,'#6a4424'],[1,'#140a06']]);ctx.fillRect(cx-14,top+26,28,H-top);
  ctx.fillStyle=vgrad(ctx,top,top+28,[[0,'#a8743e'],[.2,'#7a4a24'],[1,'#3a200e']]);ctx.fillRect(x0,top,x1-x0,28);
  ctx.fillStyle=lgrad(ctx,0,top,0,top+6,[[0,'#ffe08a'],[1,'#8a5a14']]);ctx.fillRect(x0,top-2,x1-x0,5);
  ctx.strokeStyle='rgba(20,10,4,.6)';ctx.lineWidth=1.5;for(let x=x0+44;x<x1;x+=44){ctx.beginPath();ctx.moveTo(x,top+4);ctx.lineTo(x,top+26);ctx.stroke();}
  for(let x=x0+30;x<x1;x+=90){ctx.strokeStyle='#2a160a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,top-46);ctx.stroke();}
  ctx.strokeStyle=lgrad(ctx,0,0,0,1,[[0,'#e8b44a'],[1,'#e8b44a']]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0+30,top-46);ctx.lineTo(x1-30,top-46);ctx.stroke();
}
function meterSign(x,m){
  const G=ST.G,y=SI===1?G+40:G-96;
  if(SI===1){ctx.strokeStyle='#2a160a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,G+6);ctx.lineTo(x,y);ctx.stroke();}
  else{ctx.fillStyle=lgrad(ctx,x-4,0,x+4,0,[[0,'#2a160a'],[.5,'#8a5a30'],[1,'#2a160a']]);ctx.fillRect(x-3,y+28,6,G-y-36);}
  rrect(ctx,x-34,y,68,30,6);ctx.fillStyle=vgrad(ctx,y,y+30,[[0,'#fbf0d4'],[1,'#d9c08a']]);ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#8a5a14';ctx.stroke();
  uiText(ctx,m+' m',x,y+16,19,'#5a1a10',{weight:700});
}
function drawFinish(x,base){
  const h=320;
  for(const px of[x-40,x+240]){ctx.fillStyle=lgrad(ctx,px-9,0,px+9,0,[[0,'#3a1a10'],[.4,'#f6e6c4'],[1,'#3a1a10']]);ctx.fillRect(px-9,base-h,18,h);
    ctx.fillStyle='rgba(179,33,43,.9)';for(let yy=base-h;yy<base-8;yy+=26)ctx.fillRect(px-9,yy,18,11);
    ctx.drawImage(FXS.bulb,px-20,base-h-30,40,40);}
  const bx=x-50,by=base-h+6,bw=300,bh=74;
  rrect(ctx,bx,by,bw,bh,10);ctx.fillStyle=vgrad(ctx,by,by+bh,[[0,'#b3212b'],[1,'#5e0c13']]);ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=lgrad(ctx,bx,0,bx+bw,0,[[0,'#8a5a14'],[.5,'#ffe08a'],[1,'#8a5a14']]);ctx.stroke();
  const n=22;ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<n;i++){const t=i/n,on=(Math.floor(T*8)+i)%3!==0;const px=t<.5?bx+8+(bw-16)*t*2:bx+bw-8-(bw-16)*(t-.5)*2,py=t<.5?by+6:by+bh-6;if(on)ctx.drawImage(FXS.bulb,px-9,py-9,18,18);}ctx.restore();
  goldText(ctx,'FINISH',bx+bw/2,by+bh/2+2,40,{depth:3});
}
function drawCP(e){
  const x=e.x,G=ST.G,reached=cpX>=e.x-1,w=Math.sin(T*6)*6;
  ctx.fillStyle=lgrad(ctx,x-4,0,x+4,0,[[0,'#2a160a'],[.5,'#9a6a3a'],[1,'#2a160a']]);ctx.fillRect(x-4,G-160,8,160);
  ctx.beginPath();ctx.moveTo(x+4,G-156);ctx.quadraticCurveTo(x+36,G-148+w,x+70,G-134+w);ctx.quadraticCurveTo(x+36,G-126-w*.5,x+4,G-114);ctx.closePath();
  ctx.fillStyle=reached?lgrad(ctx,x,0,x+70,0,[[0,'#ffe08a'],[1,'#c08a22']]):lgrad(ctx,x,0,x+70,0,[[0,'#d8323c'],[1,'#7a0e16']]);ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#1a0804';ctx.stroke();
  starPath(ctx,x+28,G-136,8,0);ctx.fillStyle=reached?'#7a0e16':'#fff3c4';ctx.fill();
  if(reached){ctx.save();ctx.globalCompositeOperation='lighter';ctx.drawImage(FXS.bulb,x-26,G-190,52,52);ctx.restore();}
  starPath(ctx,x,G-166,9,T*2);ctx.fillStyle=lgrad(ctx,x-9,G-175,x+9,G-157,[[0,'#fff6c0'],[1,'#b07a1e']]);ctx.fill();
}
function drawCannonball(x,y,r){
  for(let i=1;i<=3;i++){ctx.globalAlpha=.12/i;ctx.beginPath();ctx.arc(x+i*14,y,r,0,TAU);ctx.fillStyle='#2a2c32';ctx.fill();}ctx.globalAlpha=1;
  ctx.fillStyle=rgrad(ctx,x,y,r*.1,r,[[0,'#8a8e98'],[.35,'#3a3c44'],[1,'#08090c']],x-r*.35,y-r*.4);ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#020203';ctx.stroke();
  ctx.beginPath();ctx.ellipse(x-r*.35,y-r*.45,r*.28,r*.16,-.5,0,TAU);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fill();
}
function drawBall(x,y,r,ang){
  ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fillStyle='#f3e4c2';ctx.fill();
  ctx.save();ctx.clip();ctx.rotate(ang);const cols=['#c3202a','#f3e4c2','#1f4c9a','#f3e4c2','#e8b44a','#f3e4c2','#1f7a5a','#f3e4c2'];
  for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,i*TAU/8,(i+1)*TAU/8);ctx.closePath();ctx.fillStyle=cols[i];ctx.fill();}
  starPath(ctx,0,0,r*.32,0);ctx.fillStyle='#ffe08a';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#5a3a0a';ctx.stroke();ctx.restore();
  ctx.fillStyle=rgrad(ctx,0,0,r*.05,r*1.02,[[0,'rgba(255,255,255,.5)'],[.3,'rgba(255,255,255,.08)'],[.72,'rgba(0,0,0,0)'],[1,'rgba(20,5,0,.6)']],-r*.35,-r*.45);ctx.fillRect(-r,-r,2*r,2*r);
  ctx.beginPath();ctx.ellipse(-r*.38,-r*.5,r*.2,r*.1,-.6,0,TAU);ctx.fillStyle='rgba(255,255,255,.8)';ctx.fill();
  ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.lineWidth=2;ctx.strokeStyle='#1a0a06';ctx.stroke();
  ctx.restore();
}
function drawChains(e){
  const x=e.x,top=e.cy-e.ry;ctx.save();ctx.strokeStyle='#2a2a30';ctx.lineWidth=4;ctx.setLineDash([6,4]);
  ctx.beginPath();ctx.moveTo(x-10,top-4);ctx.lineTo(x-40,-20);ctx.moveTo(x+10,top-4);ctx.lineTo(x+40,-20);ctx.stroke();
  ctx.strokeStyle='rgba(200,200,215,.5)';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
}
function monkeyFrameFor(e,lvl,n,kind){
  const M=SPR.monkey[kind]||SPR.monkey.brown,f=Math.floor(e.ph)%8;
  if(lvl===0){if(e.jy<0)return M.jump;return n>1?M.carry[f]:M.walk[f];}
  if(lvl===n-1)return M.top[f];return M.stand;
}
function drawEntity(e){
  const G=ST.G;
  if(e.type==='bag'){if(e.x-cam.x<-500||e.x-cam.x>W+500)return;ctx.strokeStyle='#2a1a0c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e.x,e.py0);ctx.lineTo(e.bx,e.by-30);ctx.stroke();
    ctx.save();ctx.translate(e.bx,e.by);ctx.rotate(-Math.asin(clamp((e.bx-e.x)/e.L,-1,1)));blit(ctx,PROPS.sandbag,0,0);ctx.restore();return;}
  if(e.type==='warn'){const x=cam.x+W-58,y=e.y;blit(ctx,PROPS.cannon,x+18,y);
    if(Math.floor(T*10)%2){ctx.save();ctx.globalCompositeOperation='lighter';ctx.drawImage(FXS.glow,x-80,y-50,100,100);ctx.restore();starPath(ctx,x-30,y,20,0,3,.5);ctx.fillStyle='#ffcf3a';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#3a1a04';ctx.stroke();uiText(ctx,'!',x-30,y+3,22,'#3a1a04',{weight:700});}return;}
  const sx=e.x-cam.x;if(sx<-300||sx>W+300)return;
  switch(e.type){
    case 'pot':ctx.drawImage(FXS.dust,e.x-60,G-12,120,24);blit(ctx,PROPS.brazier,e.x,G);break;
    case 'monkey':{const fy=G+e.jy,n=e.kinds.length;ctx.save();ctx.globalAlpha=.35;ctx.fillStyle='#1a0a04';ctx.beginPath();ctx.ellipse(e.x,G,22,5,0,0,TAU);ctx.fill();ctx.restore();
      for(let l=0;l<n;l++){const kind=e.kinds[l],y=fy-l*50;if(kind==='pink'){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.7+.3*Math.sin(T*8);ctx.drawImage(FXS.pink,e.x-48,y-80,96,96);ctx.restore();}
        blit(ctx,monkeyFrameFor(e,l,n,kind),e.x,y,true,MS,MS);}}break;
    case 'mfly':{ctx.save();ctx.translate(e.x,e.y-30);ctx.rotate(e.rot);blit(ctx,SPR.monkey[e.kind].knock,0,30,true,MS,MS);ctx.restore();}break;
    case 'bird':blit(ctx,SPR.crow[Math.floor(e.ph)%8],e.x,e.y,true);break;
    case 'cball':drawCannonball(e.x,e.y,e.r);break;
    case 'balloon':{const y=e.py??e.y;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.6+.3*Math.sin(T*6);ctx.drawImage(FXS.pink,e.x-60,y-60,120,120);ctx.restore();blit(ctx,PROPS.balloon,e.x,y);}break;
    case 'ball':ctx.save();ctx.globalAlpha=.4;ctx.fillStyle='#1a0a04';ctx.beginPath();ctx.ellipse(e.x,G,e.r*.9,7,0,0,TAU);ctx.fill();ctx.restore();drawBall(e.x,G-e.r,e.r,e.ang);break;
    case 'pedestal':blit(ctx,PROPS.pedestal,e.x,G);drawFinish(e.x-100,e.top-30);break;
    case 'cp':drawCP(e);break;
  }
}
function drawPlayer(){
  const p=PL;if(!p)return;const lion=ST.mode==='lion';
  const gy=ST.balls?null:ST.G;
  if(gy!==null){const hg=clamp((gy-p.y)/400,0,.7);ctx.save();ctx.globalAlpha=.45*(1-hg);ctx.fillStyle='#1a0a04';ctx.beginPath();ctx.ellipse(p.x+(lion?0:0),gy,(lion?120:30)*(1-hg*.6),(lion?12:6)*(1-hg*.6),0,0,TAU);ctx.fill();ctx.restore();}
  const hurtNow=mode==='play'&&p.inv>1.15;
  let yy=p.y;if(mode==='clear')yy-=Math.abs(Math.sin(mt*7))*(lion?12:34);
  if(p.dashT>0){ctx.save();ctx.strokeStyle='rgba(255,240,210,.55)';ctx.lineWidth=3;for(let i=0;i<4;i++){const ly=p.y-30-i*(lion?40:32);ctx.beginPath();ctx.moveTo(p.x-p.dashDir*(80+i*12),ly);ctx.lineTo(p.x-p.dashDir*(170+i*30),ly);ctx.stroke();}ctx.restore();}
  ctx.save();
  if(mode==='play'&&p.inv>0&&Math.floor(T*16)%2)ctx.globalAlpha=.4;
  if(!reduce)ctx.filter='drop-shadow(0 0 1.5px rgba(12,4,2,.95)) drop-shadow(0 0 12px rgba(255,214,150,.35))';
  if(lion){
    let fr;const L=SPR.lion;
    if(mode==='ko')fr=L.hurt;else if(!p.onG)fr=p.vy<0?L.up:L.down;else if(p.crouch)fr=L.crouch[Math.floor(((p.ph/TAU)%1+1)%1*12)%12];
    else if(Math.abs(p.vx)<25||mode==='clear'||mode==='intro')fr=L.idle[Math.floor(T*6)%8];else fr=L.run[Math.floor(((p.ph/TAU)%1+1)%1*16)%16];
    blit(ctx,fr,p.x,yy,false,p.sx,p.sy);
    if(mode!=='ko'){const sp=fr.sad,rx=p.x+sp[0]*p.sx,ry=yy+sp[1]*p.sy;
      if(mode==='clear')blit(ctx,SPR.clown.cheer[Math.floor(T*10)%8],rx,ry+2);
      else if(hurtNow)blit(ctx,SPR.rider.hurt,rx,ry);
      else if(p.crouch&&p.onG)blit(ctx,SPR.rider.duck,rx,ry);
      else blit(ctx,SPR.rider.ride[Math.floor(T*9)%8],rx,ry);}
  }else{
    const C=SPR.clown;let fr;
    if(mode==='clear')fr=C.cheer[Math.floor(T*10)%8];else if(mode==='ko'||hurtNow)fr=C.hurt;else if(!p.onG)fr=p.vy<0?C.jump:C.fall;else if(p.crouch)fr=C.duck;
    else if(Math.abs(p.vx)>40)fr=C.run[Math.floor(((p.ph/TAU)%1+1)%1*12)%12];else fr=C.balance[Math.floor(p.ph*1.9)%12];
    if(mode==='ko')ctx.globalAlpha=Math.max(0,1-p.koT*2);
    blit(ctx,fr,p.x,yy,p.face<0,p.sx,p.sy);
  }
  ctx.restore();
  if(mode==='ko'){const k=p.koT,gy2=p.y-(lion?70:0)-k*150,gx=p.x+Math.sin(k*3)*22;
    ctx.save();ctx.globalAlpha=Math.max(0,.7-k*.12);ctx.globalCompositeOperation='lighter';ctx.drawImage(FXS.white,gx-60,gy2-190,120,160);ctx.globalCompositeOperation='source-over';
    ctx.beginPath();ctx.ellipse(gx+4,gy2-168,22,6,0,0,TAU);ctx.strokeStyle='#ffe08a';ctx.lineWidth=4;ctx.stroke();blit(ctx,SPR.clown.fall,gx,gy2);ctx.restore();}
}
function drawFirePass(){
  for(const e of ents){const sx=e.x-cam.x;if(sx<-260||sx>W+260)continue;
    if(e.type==='ring'){drawHoopHalf(ctx,e,true);drawHoopFire(ctx,e);drawFloorGlow(ctx,e.x,ST.G,150,.5);}
    else if(e.type==='pot'){drawBrazierFire(ctx,e.x,ST.G,e.seed);drawFloorGlow(ctx,e.x,ST.G,130,.6);}}
  drawFireParticles(ctx);
}
function drawParticles(){
  for(const q of parts){const k=q.t/q.life;ctx.save();ctx.globalAlpha=Math.max(0,1-k*k);
    if(q.k==='puff'){const s=q.r*(1+k*1.4);ctx.drawImage(FXS.puff,q.x-s,q.y-s,s*2,s*2);}
    else if(q.k==='star'){starPath(ctx,q.x,q.y,q.r*(1-k*.4),q.rot);ctx.fillStyle=q.col;ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='rgba(60,20,0,.8)';ctx.stroke();}
    else if(q.k==='conf'){ctx.translate(q.x,q.y);ctx.rotate(q.rot);const c=Math.cos(q.t*12);ctx.fillStyle=q.col;ctx.fillRect(-5,-3*c,10,6*c+.5);}
    ctx.restore();}
}
function drawPops(){
  for(const q of pops){const k=q.t/.95,s=q.t<.12?easeOutBack(q.t/.12):1;ctx.save();ctx.globalAlpha=1-Math.max(0,(k-.7)/.3);ctx.translate(q.x,q.y-q.t*70);ctx.scale(s,s);
    uiText(ctx,q.txt,0,0,q.big?34:26,q.col,{weight:700,stroke:'#1a0804',sw:5});if(q.sub)uiText(ctx,q.sub,0,26,18,COL.cream,{weight:700,stroke:'#1a0804',sw:4});ctx.restore();}
}
function drawFG(){
  if(SI===1){const off=cam.x*1.4;ctx.save();ctx.strokeStyle='rgba(8,10,12,.55)';ctx.lineWidth=9;
    for(let k=Math.floor((off-400)/1500);k<=Math.floor((off-400)/1500)+2;k++){const x=k*1500+400-off;ctx.beginPath();ctx.moveTo(x-300,H+20);ctx.lineTo(x+200,-20);ctx.stroke();}ctx.restore();return;}
  const pole=SI===0?BGS.fgPoleA:BGS.fgPoleC,par=1.32,sp=2300,off=cam.x*par,k0=Math.floor((off-300)/sp);
  for(let k=k0;k<=k0+2;k++){const sx=k*sp+900-off;if(sx>-100&&sx<W+100)ctx.drawImage(pole,sx-45,-20);}
  tileX(BGS.fgHeads,1.55,H-86,1600,120);
}
function renderWorld(){
  ctx.save();
  if(cam.shake>0){const s=reduce?cam.shake*.3:cam.shake;ctx.translate((Math.random()-.5)*s,(Math.random()-.5)*s);}
  if(SI===1)drawWireStage();else drawTentStage();
  ctx.save();ctx.translate(-Math.round(cam.x),0);
  drawDecor();
  for(const e of ents)if(e.type==='ring'&&e.x-cam.x>-200&&e.x-cam.x<W+200){drawChains(e);drawHoopHalf(ctx,e,false);if(e.bag){const by=e.cy-e.ry*.3;ctx.strokeStyle='#2a1a0c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e.x,e.cy-e.ry);ctx.lineTo(e.x,by-24);ctx.stroke();
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.7+.3*Math.sin(T*7);ctx.drawImage(FXS.pink,e.x-50,by-50,100,100);ctx.restore();blit(ctx,PROPS.moneybag,e.x,by);}}
  for(const e of ents)if(e.type!=='ring')drawEntity(e);
  drawPlayer();
  drawFirePass();
  drawParticles();drawPops();
  ctx.restore();
  drawFG();
  ctx.save();ctx.globalCompositeOperation='lighter';for(const m of motes){ctx.globalAlpha=.25+.2*Math.sin(T*2+m.ph);ctx.drawImage(FXS.dust,m.x-m.s*3,m.y-m.s*3,m.s*6,m.s*6);}ctx.restore();
  ctx.restore();
}

/* ======================= HUD & SCREENS ======================= */
function fmt(t){const m=Math.floor(t/60),s=Math.floor(t%60);return m+':'+String(s).padStart(2,'0');}
function panel(x,y,w,h,r=10){rrect(ctx,x,y,w,h,r);ctx.fillStyle='rgba(18,8,6,.72)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=lgrad(ctx,x,0,x+w,0,[[0,'#7a5214'],[.5,'#ffe08a'],[1,'#7a5214']]);ctx.stroke();}
function ticket(x,y,alive){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.06);ctx.globalAlpha=alive?1:.28;
  ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(60,0);ctx.arc(64,14,5,-PI/2,PI/2,true);ctx.lineTo(64,32);ctx.lineTo(60,38);ctx.lineTo(4,38);ctx.arc(0,24,5,PI/2,-PI/2,true);ctx.lineTo(0,10);ctx.closePath();
  ctx.fillStyle=vgrad(ctx,0,38,[[0,'#fff3d2'],[1,'#e8cf96']]);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#8a1a1e';ctx.stroke();
  ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(48,4);ctx.lineTo(48,34);ctx.stroke();ctx.setLineDash([]);
  uiText(ctx,'ADMIT',24,13,12,'#8a1a1e',{weight:700,ls:1});uiText(ctx,'ONE',24,26,13,'#8a1a1e',{weight:700,ls:1});
  starPath(ctx,56,19,6,0);ctx.fillStyle='#b3212b';ctx.fill();
  if(!alive){ctx.globalAlpha=.8;ctx.strokeStyle='#8a1a1e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-2,4);ctx.lineTo(66,34);ctx.stroke();}
  ctx.restore();
}
function drawHUD(){
  const p=PL;if(!p)return;
  ctx.save();
  panel(18,16,300,54);uiText(ctx,ST.act,34,32,14,COL.gold,{align:'left',weight:700,ls:3});uiText(ctx,ST.name,34,52,24,COL.cream,{align:'left',weight:700,ls:1});
  uiText(ctx,'SCORE',W-28,24,13,COL.gold,{align:'right',weight:700,ls:3});goldText(ctx,String(score).padStart(7,'0'),W-26,54,32,{align:'right',depth:3});
  const x0=470,x1=810,y=38,pr=clamp(p.x/ST.END,0,1);
  ctx.fillStyle='rgba(18,8,6,.7)';rrect(ctx,x0-16,y-16,x1-x0+60,34,17);ctx.fill();
  ctx.strokeStyle='#3a2410';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();
  ctx.strokeStyle=lgrad(ctx,x0,0,x1,0,[[0,'#8a5a14'],[.5,'#ffe08a'],[1,'#8a5a14']]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+(x1-x0)*pr,y);ctx.stroke();
  ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<=10;i++){const bx=x0+(x1-x0)*i/10;if(i/10<=pr)ctx.drawImage(FXS.bulb,bx-9,y-9,18,18);}ctx.restore();
  for(let i=0;i<=10;i++){const bx=x0+(x1-x0)*i/10;ctx.beginPath();ctx.arc(bx,y,2.4,0,TAU);ctx.fillStyle=i/10<=pr?'#fff3c4':'#5a4020';ctx.fill();}
  starPath(ctx,(x0+x1)/2,y,9,0);ctx.fillStyle=cpX>0?'#ffe08a':'#6a5030';ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle='#1a0804';ctx.stroke();
  ctx.fillStyle='#e8b44a';ctx.fillRect(x1+14,y-14,3,26);ctx.beginPath();ctx.moveTo(x1+17,y-14);ctx.lineTo(x1+36,y-8);ctx.lineTo(x1+17,y-2);ctx.closePath();ctx.fillStyle='#d8323c';ctx.fill();
  const hx=x0+(x1-x0)*pr;ctx.beginPath();ctx.arc(hx,y,8,0,TAU);ctx.fillStyle=rgrad(ctx,hx-2,y-2,1,9,[[0,'#ffffff'],[1,'#e8d8c8']]);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#1a0804';ctx.stroke();ctx.beginPath();ctx.arc(hx+4,y+1,3,0,TAU);ctx.fillStyle='#e8222c';ctx.fill();
  uiText(ctx,`${Math.max(0,Math.ceil((ST.END-p.x)/100))} m to go`,(x0+x1)/2,y+30,15,COL.cream,{weight:600,ls:1,shadow:'rgba(0,0,0,.7)'});
  for(let i=0;i<3;i++)ticket(24+i*72,H-66,i<p.hp);
  const full=superM>=5;
  for(let i=0;i<5;i++){const cx=250+i*30,cy=H-72,f=clamp(superM-i,0,1);ctx.save();
    if(full){ctx.translate(cx+11,cy+17);ctx.rotate(Math.sin(T*8+i)*.1);ctx.translate(-cx-11,-cy-17);}
    rrect(ctx,cx,cy,22,34,3);ctx.fillStyle='#3a0a10';ctx.fill();
    ctx.save();ctx.clip();ctx.strokeStyle='rgba(232,180,74,.35)';ctx.lineWidth=1;for(let d=-40;d<40;d+=6){ctx.beginPath();ctx.moveTo(cx+d,cy);ctx.lineTo(cx+d+34,cy+34);ctx.moveTo(cx+d+34,cy);ctx.lineTo(cx+d,cy+34);ctx.stroke();}
    if(f>0){ctx.fillStyle=full?lgrad(ctx,cx,0,cx+22,0,[[0,'#b07a1e'],[.5,'#fff0a8'],[1,'#b07a1e']]):rgba(COL.pink,.85);ctx.fillRect(cx,cy+34*(1-f),22,34*f);}ctx.restore();
    rrect(ctx,cx,cy,22,34,3);ctx.lineWidth=1.6;ctx.strokeStyle='#e8b44a';ctx.stroke();ctx.restore();}
  if(full){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.5+.3*Math.sin(T*8);ctx.drawImage(FXS.glow,230,H-110,190,110);ctx.restore();
    if(Math.floor(T*3)%2===0)uiText(ctx,isTouch?'TAP SUPER':'PRESS C',325,H-86,16,COL.gold,{weight:700,ls:2,stroke:'#1a0804',sw:4});}
  if(A.muted)uiText(ctx,'SOUND OFF (M)',W-28,86,14,'#d9c08a',{align:'right'});
  ctx.restore();
}
function drawBanners(dt){
  for(const b of banners){b.t+=dt;const k=b.t,pop=k<.2?easeOutBack(k/.2):1,fade=k>b.dur-.22?Math.max(0,(b.dur-k)/.22):1;
    ctx.save();ctx.globalAlpha=fade;ctx.translate(W/2,H*.38);ctx.scale(pop,pop);
    if(b.sub)uiText(ctx,b.sub,0,-b.size*.78,26,COL.gold,{weight:700,ls:6,stroke:'#1a0804',sw:5});
    goldText(ctx,b.txt,0,0,b.size,b.col===COL.cream?{}:b.col===COL.pink?{top:'#fff0f8',mid:'#ff7ac0',low:'#a01a5a',bot:'#ffc0e0'}:b.col==='#ff6a5a'?{top:'#ffe0d8',mid:'#ff5a4a',low:'#8a0a0a',bot:'#ffb0a0'}:{});ctx.restore();}
  banners=banners.filter(b=>b.t<b.dur);
}
function poster(x,y,w,h){
  rrect(ctx,x,y,w,h,16);ctx.fillStyle=vgrad(ctx,y,y+h,[[0,'#fbefd2'],[1,'#e6cf9c']]);ctx.fill();ctx.lineWidth=8;ctx.strokeStyle='#8a1a1e';ctx.stroke();
  rrect(ctx,x+14,y+14,w-28,h-28,10);ctx.lineWidth=2;ctx.strokeStyle='#c08a22';ctx.stroke();
  for(const[cx,cy]of[[x+30,y+30],[x+w-30,y+30],[x+30,y+h-30],[x+w-30,y+h-30]]){starPath(ctx,cx,cy,9,0);ctx.fillStyle='#b3212b';ctx.fill();}
}
function drawResults(){
  const k=mt;ctx.fillStyle='rgba(10,4,3,.6)';ctx.fillRect(0,0,W,H);
  const x=240,y=60,w=800,h=600;ctx.save();ctx.translate(0,k<.35?(1-easeOutBack(k/.35))*-720:0);
  poster(x,y,w,h);
  goldText(ctx,'THE RESULTS!',W/2,y+70,52,{depth:4});
  uiText(ctx,`${ST.act} · ${ST.name}`,W/2,y+118,18,'#7a3a1a',{weight:700,ls:4});
  const rows=[['TIME',fmt(stats.time)+' / '+fmt(ST.par)],['HP BONUS',PL.hp+' × 1000'],['TIME BONUS','+'+stats.tb],['PARRIES',stats.parries],['TRICKS',stats.rings+stats.stomps],['SHOWSTOPPERS',stats.supers],['SCORE',String(score).padStart(7,'0')]];
  rows.forEach((r,i)=>{if(k<.5+i*.18)return;const ry=y+168+i*50;uiText(ctx,r[0],x+70,ry,24,'#3a1a10',{align:'left',weight:600,ls:2});
    ctx.strokeStyle='rgba(58,26,16,.3)';ctx.setLineDash([2,6]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+260,ry+6);ctx.lineTo(x+420,ry+6);ctx.stroke();ctx.setLineDash([]);
    uiText(ctx,String(r[1]),x+540,ry,26,i===6?'#b3212b':'#3a1a10',{align:'right',weight:700});});
  const st=.5+7*.18+.2;
  if(k>st){const t=k-st,s=t<.2?3-2*(t/.2):1;ctx.save();ctx.translate(x+668,y+340);ctx.rotate(-.18);ctx.scale(s,s);
    ctx.beginPath();ctx.arc(0,0,80,0,TAU);ctx.fillStyle='rgba(179,33,43,.08)';ctx.fill();ctx.lineWidth=7;ctx.strokeStyle='#b3212b';ctx.stroke();ctx.beginPath();ctx.arc(0,0,67,0,TAU);ctx.lineWidth=2.5;ctx.stroke();
    uiText(ctx,'GRADE',0,-46,15,'#b3212b',{weight:700,ls:3});uiText(ctx,stats.grade,0,12,stats.grade.length>1?76:92,'#b3212b',{font:F_DISPLAY,weight:400});ctx.restore();}
  if(k>2.4&&Math.floor(T*2.5)%2===0)uiText(ctx,SI<2?'PRESS JUMP FOR THE NEXT ACT':'PRESS JUMP FOR THE GRAND FINALE',W/2,y+h-44,22,'#3a1a10',{weight:700,ls:3});
  ctx.restore();
}
function drawKO(){
  if(mt<1.2)return;const a=Math.min(1,(mt-1.2)/.3);
  ctx.fillStyle=`rgba(10,4,3,${.6*a})`;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.globalAlpha=a;poster(300,160,680,390);
  goldText(ctx,'KNOCKED OUT!',W/2,230,50,{top:'#ffe0d8',mid:'#ff5a4a',low:'#8a0a0a',bot:'#ffb0a0',depth:4});
  const x0=390,x1=890,y=320,pr=clamp(PL.x/ST.END,0,1);
  ctx.strokeStyle='#3a2410';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();
  ctx.strokeStyle=lgrad(ctx,x0,0,x1,0,[[0,'#8a5a14'],[.5,'#ffe08a'],[1,'#8a5a14']]);ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+(x1-x0)*pr,y);ctx.stroke();
  starPath(ctx,(x0+x1)/2,y,11,0);ctx.fillStyle=cpX>0?'#e8b44a':'#b8a080';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#3a1a04';ctx.stroke();
  const hx=x0+(x1-x0)*pr;ctx.beginPath();ctx.arc(hx,y,11,0,TAU);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#1a0804';ctx.stroke();ctx.beginPath();ctx.arc(hx+5,y+1,4,0,TAU);ctx.fillStyle='#e8222c';ctx.fill();
  uiText(ctx,`You made it ${Math.round(pr*100)}% of the way through ${ST.name.toLowerCase()}.`,W/2,y+52,21,'#3a1a10',{weight:600});
  uiText(ctx,cpX>0?'JUMP  ·  retry from the checkpoint star':'JUMP  ·  retry the act',W/2,y+104,22,'#b3212b',{weight:700,ls:1});
  uiText(ctx,'DASH  ·  back to the big top',W/2,y+140,19,'#7a3a1a',{weight:700,ls:1});
  ctx.restore();
}
function drawPause(){
  ctx.fillStyle='rgba(10,4,3,.62)';ctx.fillRect(0,0,W,H);poster(380,200,520,300);
  goldText(ctx,'INTERMISSION',W/2,262,46,{depth:3});
  uiText(ctx,'JUMP or P  ·  back to the show',W/2,340,22,'#3a1a10',{weight:700});
  uiText(ctx,'DASH or Q  ·  leave for the title',W/2,378,22,'#3a1a10',{weight:700});
  uiText(ctx,'M  ·  sound on / off',W/2,416,19,'#7a3a1a',{weight:600});
}
function drawCurtains(k,valance=true){
  if(k>0){const e=easeInOut(clamp(k,0,1));ctx.drawImage(BGS.curtain,e*660-720,0);ctx.save();ctx.translate(W-e*660+720,0);ctx.scale(-1,1);ctx.drawImage(BGS.curtain,0,0);ctx.restore();
    ctx.fillStyle=`rgba(0,0,0,${.35*(1-e)})`;}
  if(valance)ctx.drawImage(BGS.valance,0,-4);
}
function marquee(cx,cy,w,h){
  rrect(ctx,cx-w/2,cy-h/2,w,h,22);ctx.fillStyle=vgrad(ctx,cy-h/2,cy+h/2,[[0,'#5e0c13'],[1,'#2a0408']]);ctx.fill();ctx.lineWidth=6;ctx.strokeStyle=lgrad(ctx,cx-w/2,0,cx+w/2,0,[[0,'#7a5214'],[.5,'#ffe08a'],[1,'#7a5214']]);ctx.stroke();
  const per=2*(w+h)-60,n=Math.floor(per/28);ctx.save();ctx.globalCompositeOperation='lighter';
  for(let i=0;i<n;i++){const d=i/n*per;let x,y;const ww=w-24,hh=h-24;
    if(d<ww){x=cx-ww/2+d;y=cy-hh/2;}else if(d<ww+hh){x=cx+ww/2;y=cy-hh/2+(d-ww);}else if(d<2*ww+hh){x=cx+ww/2-(d-ww-hh);y=cy+hh/2;}else{x=cx-ww/2;y=cy+hh/2-(d-2*ww-hh);}
    const on=(i+Math.floor(T*10))%4<2;ctx.globalAlpha=on?1:.25;ctx.drawImage(FXS.bulb,x-11,y-11,22,22);}ctx.restore();
}
function renderTitle(){
  cam.x=T*30;
  tileX(BGS.ruby,.12,0);beams(610);drawCrowd(BGS.rowsA);tileX(BGS.curbA,.8,544,512,60);tileX(BGS.floorA,1,594);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.8;ctx.drawImage(FXS.white,W/2-330,380,660,380);ctx.restore();
  blit(ctx,PROPS.pedestal,W/2,700,false,.95,.95);
  const fr=SPR.lion.idle[Math.floor(T*6)%8];blit(ctx,fr,W/2-10,700-150*.95,false,.95,.95);
  blit(ctx,SPR.rider.ride[Math.floor(T*9)%8],W/2-10+fr.sad[0]*.95,700-150*.95+fr.sad[1]*.95,false,.95,.95);
  drawCurtains(.28);
  marquee(W/2,168,660,220);
  goldText(ctx,'BIG TOP',W/2,120,76,{depth:5});goldText(ctx,'BEDLAM',W/2,208,100,{depth:6,glow:'rgba(255,190,80,.45)'});
  uiText(ctx,'A Rubber-Hose Circus Caper in Three Acts',W/2,300,26,'#fff0d0',{font:F_SCRIPT,weight:'italic 700',stroke:'#1a0804',sw:5});
  const act=STAGES[titleSel];
  if(unlocked>0)uiText(ctx,`◀   ${act.act} · ${act.name}   ▶`,W/2,650,24,COL.cream,{weight:700,ls:3,stroke:'#1a0804',sw:5});
  if(Math.floor(T*2.2)%2===0)uiText(ctx,isTouch?'TAP JUMP TO RAISE THE CURTAIN':'PRESS JUMP TO RAISE THE CURTAIN',W/2,unlocked>0?686:668,26,COL.gold,{weight:700,ls:4,stroke:'#1a0804',sw:5});
  panel(W/2-450,H-30-(unlocked>0?-4:0)+2,900,26,13);
  uiText(ctx,isTouch?'Pink things can be PARRIED: tap JUMP again while touching them in mid-air':'MOVE ←→   JUMP ↑ SPACE Z   DUCK ↓   DASH SHIFT X   SUPER C   PAUSE P   SOUND M',W/2,H-15,15,COL.cream,{weight:600,ls:1});
  if(best>0)uiText(ctx,'BEST '+String(best).padStart(7,'0'),W-40,120,18,COL.gold,{align:'right',weight:700,ls:2,stroke:'#1a0804',sw:4});
  uiText(ctx,A.C?'Tip: parry PINK things for super meter':'Sound starts on your first key press or tap',40,120,16,COL.cream,{align:'left',weight:600,stroke:'#1a0804',sw:4});
}
function renderFinale(){
  cam.x=T*40;tileX(BGS.royal,.12,0);beams(640);drawCrowd(BGS.rowsC);tileX(BGS.curbC,.8,574,512,60);tileX(BGS.floorC,1,624);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.9;ctx.drawImage(FXS.white,W/2-340,380,680,380);ctx.restore();
  blit(ctx,PROPS.pedestal,W/2,712,false,.95,.95);const fr=SPR.lion.idle[Math.floor(T*6)%8];blit(ctx,fr,W/2-10,712-150*.95,false,.95,.95);
  blit(ctx,SPR.clown.cheer[Math.floor(T*10)%8],W/2-10+fr.sad[0]*.95,712-150*.95+fr.sad[1]*.95,false,.95,.95);
  ctx.save();ctx.translate(-cam.x,0);drawParticles();ctx.restore();
  drawCurtains(.22);
  marquee(W/2,150,600,190);goldText(ctx,'THE END',W/2,140,100,{depth:6,glow:'rgba(255,190,80,.45)'});
  uiText(ctx,'What a show! The crowd is on its feet.',W/2,268,28,'#fff0d0',{font:F_SCRIPT,weight:'italic 700',stroke:'#1a0804',sw:5});
  panel(120,420,250,110,14);uiText(ctx,'FINAL SCORE',245,448,16,COL.gold,{weight:700,ls:4});goldText(ctx,String(score).padStart(7,'0'),245,494,40,{depth:3});
  panel(W-370,420,250,110,14);uiText(ctx,'BEST SHOW',W-245,448,16,COL.gold,{weight:700,ls:4});goldText(ctx,String(best).padStart(7,'0'),W-245,494,40,{depth:3});
  if(mt>1.6&&Math.floor(T*2.5)%2===0)uiText(ctx,'PRESS JUMP TO RETURN TO THE BIG TOP',W/2,H-34,24,COL.gold,{weight:700,ls:3,stroke:'#1a0804',sw:5});
}
function renderLoading(){
  ctx.fillStyle='#0e0605';ctx.fillRect(0,0,W,H);
  ctx.fillStyle=rgrad(ctx,W/2,H/2,20,600,[[0,'#3a1008'],[1,'#0e0605']]);ctx.fillRect(0,0,W,H);
  goldText(ctx,'BIG TOP BEDLAM',W/2,H/2-60,64,{depth:4});
  const bw=520,bx=W/2-bw/2,by=H/2+20;rrect(ctx,bx,by,bw,16,8);ctx.fillStyle='#2a100a';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#7a5214';ctx.stroke();
  if(loadP>0){rrect(ctx,bx+3,by+3,(bw-6)*loadP,10,5);ctx.fillStyle=lgrad(ctx,bx,0,bx+bw,0,[[0,'#b07a1e'],[.5,'#ffe08a'],[1,'#b07a1e']]);ctx.fill();}
  uiText(ctx,loadMsg+'…',W/2,by+46,20,COL.cream,{weight:600,ls:2});
}
function postFX(){
  ctx.save();ctx.globalCompositeOperation='soft-light';ctx.fillStyle='rgba(255,186,120,.2)';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';
  if(VIG)ctx.drawImage(VIG,0,0);
  if(!reduce&&GRAIN.length){ctx.globalCompositeOperation='overlay';ctx.globalAlpha=.05;ctx.fillStyle=GRAIN[Math.floor(T*24)%GRAIN.length];ctx.translate(Math.random()*256,Math.random()*256);ctx.fillRect(-256,-256,W+512,H+512);}
  ctx.restore();
}

/* ======================= LOOP ======================= */
function updCam(dt){const tx=PL.x-W*.34;cam.x+=(tx-cam.x)*(1-Math.exp(-dt*9));cam.x=clamp(cam.x,0,Math.max(0,ST.END+560-W));}
function update(dt){
  pollPad();computeInput();const p=IN.p,go=p.jump||p.start;
  if(AUTOPLAY&&mode==='play'){IN.h.right=true;if(Math.floor(T*60)%24===0)IN.p.jump=true;IN.h.jump=Math.floor(T*60)%24<12;}
  if(p.mute){audioInit();setMute(!A.muted);}
  flashT=Math.max(0,flashT-dt);cam.shake=Math.max(0,cam.shake-dt*60);cheerT=Math.max(0,cheerT-dt);
  if(mode!=='loading'&&curt.dir>0){curt.k+=dt*2.3;if(curt.k>=1){curt.k=1;const cb=curt.cb;curt.cb=null;curt.dir=-1;curt.hold=.18;cb&&cb();}}
  else if(mode!=='loading'&&curt.dir<0){if(curt.hold>0)curt.hold-=dt;else{curt.k-=dt*1.7;if(curt.k<=0){curt.k=0;curt.dir=0;}}}
  switch(mode){
    case 'loading':if(ready){mode='title';toTitle();}break;
    case 'title':
      if(A.C&&!MUS.on)musicPlay(118,0,{mellow:true});
      if(p.left&&titleSel>0){titleSel--;SFX.select();}
      if(p.right&&titleSel<unlocked){titleSel++;SFX.select();}
      if(go&&curt.dir===0){audioInit();SFX.select();curtainTo(()=>{score=0;superM=0;startStage(titleSel,false);});}
      break;
    case 'intro':mt+=dt;if(mt>1.05&&!introShown){introShown=true;addBanner('SHOWTIME!',null,.95,COL.gold,124);SFX.select();}if(mt>1.5)mode='play';updCam(dt);break;
    case 'play':
      if(p.pause){paused=!paused;SFX.select();}
      else if(paused){if(p.jump)paused=false;else if(p.dash||p.back){paused=false;musicStop();curtainTo(toTitle);}}
      if(paused)break;
      if(stopT>0){stopT-=dt;break;}
      {const n=Math.max(1,Math.ceil(dt/(1/120)));for(let i=0;i<n&&mode==='play';i++)stepPlay(dt/n,i===0);}
      updCam(dt);break;
    case 'ko':mt+=dt;PL.koT+=dt;if(mt>1.5&&curt.dir===0){if(go)curtainTo(()=>startStage(SI,true));else if(p.dash||p.back)curtainTo(toTitle);}break;
    case 'clear':mt+=dt;if(Math.random()<dt*14)confetti(cam.x+Math.random()*W,-10,3,200);if(mt>2.3){mode='results';mt=0;beginResults();}break;
    case 'results':{mt+=dt;const n=Math.min(7,Math.floor((mt-.5)/.18)+1);if(mt>.5&&n>resRev){resRev=n;SFX.coin();}
      if(mt>.5+7*.18+.2&&!stampDone){stampDone=true;SFX.boom();cam.shake=10;}
      if((mt>2.4&&go||AUTOPLAY&&mt>3)&&curt.dir===0){if(SI<2)curtainTo(()=>startStage(SI+1,false));else curtainTo(toFinale);}}break;
    case 'finale':mt+=dt;if(Math.random()<dt*22)confetti(cam.x+Math.random()*W,-10,2,160);if(mt>1.6&&go&&curt.dir===0)curtainTo(toTitle);break;
  }
  if(!paused)updateParticles(dt);
}
function render(dt){
  ctx.setTransform(RS,0,0,RS,0,0);ctx.lineJoin='round';ctx.lineCap='round';ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  if(mode==='loading'){renderLoading();return;}
  if(mode==='title')renderTitle();
  else if(mode==='finale')renderFinale();
  else{renderWorld();drawHUD();if(mode==='results')drawResults();if(mode==='ko')drawKO();if(paused)drawPause();}
  drawBanners(paused?0:dt);
  if(flashT>0){ctx.fillStyle=`rgba(255,250,235,${Math.min(.8,flashT*3)})`;ctx.fillRect(0,0,W,H);}
  postFX();
  if(curt.k>0)drawCurtains(curt.k,false);
}
let last=performance.now();
function frame(now){const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;T+=dt;update(dt);render(dt);requestAnimationFrame(frame);}
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(mode==='play')paused=true;if(A.C)A.C.suspend();}else if(A.C)A.C.resume();});
load();
if(document.fonts&&document.fonts.load)Promise.all([`40px ${F_DISPLAY}`,`600 20px ${F_UI}`,`italic 700 20px ${F_SCRIPT}`].map(f=>document.fonts.load(f))).catch(()=>{});
cv.focus();requestAnimationFrame(frame);loadAll();
