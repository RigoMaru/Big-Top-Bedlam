'use strict';
/* Big Top Bedlam: character painting (baked into sprite frames at startup) */

/* ======================= LION ======================= */
const LC={base:'#c4884a',light:'#f1c98e',dark:'#7a4a22',belly:'#f1dcb0',paw:'#e2b57c',maneD:'#361708',maneM:'#76381a',maneL:'#c38745',maneT:'#e9bd73',out:'#2b1509',nose:'#2a1410',eye:'#e39a22'};
const FORE_K=[[0,-.45,-.05],[.45,.5,.45],[.55,.6,1.7],[.75,0,1.3],[.9,-.6,-.2],[1,-.45,-.05]];
const HIND_K=[[0,-.6,.45,-.1],[.45,.25,.95,.7],[.55,.35,1.35,2.1],[.75,-.35,1.1,.8],[.9,-.75,.45,-.15],[1,-.6,.45,-.1]];
const LION_BODY=[[84,-84],[76,-104],[54,-117],[26,-115],[-4,-108],[-36,-109],[-64,-115],[-90,-108],[-105,-90],[-104,-70],[-90,-58],[-66,-60],[-38,-58],[-10,-52],[20,-45],[48,-43],[68,-51],[80,-66]];
const LION_HEAD=[[-2,-26],[18,-21],[30,-11],[38,-2],[42,5],[38,12],[31,19],[20,25],[4,24],[-12,15],[-18,-6]];
function lionPose(mode,t){
  const P={bob:0,pitch:0,cr:0,ls:1,tail:Math.sin(t*TAU)*.5,head:0,mouth:.15,eyes:'open',sweep:1};
  if(mode==='run'||mode==='crouch'){
    P.bob=-4*Math.sin(t*TAU+.6);P.pitch=.035*Math.sin(t*TAU);P.head=-.05*Math.sin(t*TAU+1.2);
    P.foreFar=keyInterp(FORE_K,(t+.55)%1);P.foreNear=keyInterp(FORE_K,(t+.45)%1);
    P.hindFar=keyInterp(HIND_K,t%1);P.hindNear=keyInterp(HIND_K,(t+.1)%1);
    P.mouth=.4+.2*Math.sin(t*TAU);P.tail=.35+Math.sin(t*TAU)*.5;P.sweep=1.6;
    if(mode==='crouch'){P.cr=18;P.ls=.76;P.bob*=.5;P.head=.14;P.mouth=.2;}
  }else if(mode==='idle'){P.bob=Math.sin(t*TAU)*1.2;P.foreFar=[.14,-.02];P.foreNear=[.1,0];P.hindFar=[-.3,.62,-.04];P.hindNear=[-.38,.58,-.06];P.tail=Math.sin(t*TAU)*.9;P.head=Math.sin(t*TAU)*.03;P.mouth=.05;P.sweep=.4;}
  else if(mode==='up'){P.pitch=-.12;P.foreFar=[-1.05,.45];P.foreNear=[-.95,.3];P.hindFar=[.55,1.25,1.9];P.hindNear=[.45,1.15,1.7];P.tail=-.7;P.mouth=.55;P.sweep=2;}
  else if(mode==='down'){P.pitch=.08;P.foreFar=[-.6,-.32];P.foreNear=[-.5,-.22];P.hindFar=[-.85,.8,.35];P.hindNear=[-.75,.7,.25];P.tail=.7;P.mouth=.3;P.sweep=1.2;}
  else if(mode==='hurt'){P.pitch=-.18;P.foreFar=[-.8,.4];P.foreNear=[-.7,.65];P.hindFar=[-.4,.9,.4];P.hindNear=[-.2,.8,.2];P.tail=1.3;P.mouth=1;P.eyes='shut';P.sweep=.6;}
  return P;
}
function lionTuft(g,x0,y0,ang,len,w,bend,c1,c2){
  const dx=Math.cos(ang),dy=Math.sin(ang),nx=-dy,ny=dx;
  const tx=x0+dx*len+nx*bend,ty=y0+dy*len+ny*bend,mx=x0+dx*len*.5+nx*bend*.55,my=y0+dy*len*.5+ny*bend*.55;
  g.beginPath();g.moveTo(x0+nx*w/2,y0+ny*w/2);g.quadraticCurveTo(mx+nx*w*.42,my+ny*w*.42,tx,ty);g.quadraticCurveTo(mx-nx*w*.42,my-ny*w*.42,x0-nx*w/2,y0-ny*w/2);g.closePath();
  const gr=g.createLinearGradient(x0,y0,tx,ty);gr.addColorStop(0,c1);gr.addColorStop(1,c2);g.fillStyle=gr;g.fill();
}
function drawLionG(g,P){
  const cr=P.cr,ls=P.ls,S=[48,-70],HP=[-62,-78];
  g.save();
  g.translate(0,P.bob+cr);g.translate(0,-80);g.rotate(P.pitch);g.translate(0,80);
  const pawPaint=(x,y,a,far)=>{const c=far?drk(LC.paw,.4):LC.paw,f=[Math.cos(a),Math.sin(a)];
    paint(g,()=>ellPath(g,x+f[0]*6,y+f[1]*6-2,11.5,7,a),{fill:vgrad(g,y-10,y+5,[[0,lit(c,.25)],[1,drk(c,.25)]]),line:rgba(LC.out,.75),lw:1.2});
    g.strokeStyle=rgba(LC.out,.55);g.lineWidth=.9;for(let i=0;i<3;i++){const ox=x+f[0]*(9+i*4)-f[1]*2,oy=y+f[1]*(9+i*4)-2+f[0]*2;g.beginPath();g.moveTo(ox,oy+2);g.lineTo(ox-f[1]*3,oy+2+f[0]*3);g.stroke();}};
  const fore=(a,far)=>{const pts=chain(S,[[36*ls,a[0]],[38*ls,a[1]]]),all=[[S[0]-2,S[1]-18],...pts],base=far?drk(LC.base,.4):LC.base;
    paint(g,()=>limbPath(g,all,[30,29,21,15]),{fill:vgrad(g,-112,8,[[0,lit(base,.2)],[.55,base],[1,drk(base,.25)]]),line:rgba(LC.out,.32),lw:1.2,fn:()=>{
      soft(g,pts[1][0]+6,pts[1][1]-4,12,22,'#fff1cc',far?.05:.22);soft(g,pts[1][0]-8,pts[1][1]+10,8,18,'#2a1206',.25);
      furStrokes(g,60,[pts[0][0]-24,pts[0][1]-30,48,80],()=>PI*.5+.2,5,[lit(base,.3),drk(base,.3)],far?3:4,.3,.9);}});
    pawPaint(pts[2][0],pts[2][1],a[1],far);};
  const hind=(a,far)=>{const pts=chain(HP,[[36*ls,a[0]],[36*ls,a[1]],[20*ls,a[2]]]),all=[[HP[0]-6,HP[1]-14],...pts],base=far?drk(LC.base,.4):LC.base;
    paint(g,()=>limbPath(g,all,[40,38,27,15,13]),{fill:vgrad(g,-112,8,[[0,lit(base,.18)],[.5,base],[1,drk(base,.25)]]),line:rgba(LC.out,.32),lw:1.2,fn:()=>{
      soft(g,HP[0]+4,HP[1]-6,24,26,'#fff1cc',far?.05:.25);soft(g,pts[2][0]+4,pts[2][1],10,16,'#2a1206',.22);
      furStrokes(g,70,[HP[0]-40,HP[1]-34,80,90],()=>PI*.55,5,[lit(base,.3),drk(base,.3)],far?5:6,.3,.9);}});
    pawPaint(pts[3][0],pts[3][1],a[2]*.3,far);};
  /* tail */
  const s=P.tail,tp=[[-94,-98],[-113,-96+s*4],[-129,-86+s*10],[-141,-94+s*16],[-149,-110+s*20]];
  paint(g,()=>limbPath(g,tp,[11,8,7,6,5]),{fill:vgrad(g,-125,-78,[[0,LC.base],[1,LC.dark]]),line:rgba(LC.out,.7),lw:1.2});
  {const e=tp[4],R=rng(41);for(let i=0;i<22;i++){const a=-PI/2+(R()-.5)*1.6-s*.4;lionTuft(g,e[0]+(R()-.5)*4,e[1]+(R()-.5)*4,a,10+R()*9,6,(R()-.5)*6,LC.maneD,mixHex(LC.maneD,LC.maneM,.6));}}
  hind(P.hindFar,true);fore(P.foreFar,true);
  /* body */
  const bodyP=()=>shapePath(g,LION_BODY);
  paint(g,bodyP,{fill:vgrad(g,-118,-42,[[0,LC.light],[.3,LC.base],[.78,mixHex(LC.base,LC.belly,.32)],[1,mixHex(LC.base,LC.belly,.55)]]),line:rgba(LC.out,.8),lw:1.6,rim:'rgba(255,238,196,.6)',rimW:2.4,rimDy:2.2,fn:()=>{
    soft(g,44,-90,36,26,'#fff1c8',.3);soft(g,-74,-94,34,28,'#fff1c8',.3);soft(g,-8,-48,90,12,'#3b1d0a',.38);soft(g,-40,-70,30,12,'#3b1d0a',.16);soft(g,26,-60,30,14,'#fff8e0',.14);
    soft(g,-58,-78,16,26,'#3b1d0a',.18,-.3);soft(g,20,-82,18,24,'#3b1d0a',.1,.3);
    furStrokes(g,620,[-106,-118,192,78],(x,y)=>PI+.22+(y+84)*.007,7,[LC.light,LC.dark,LC.base,'#fff1cc'],11,.32,1);}});
  hind(P.hindNear,false);fore(P.foreNear,false);
  /* saddle blanket */
  const SAD=[[-48,-111],[-20,-111],[8,-114],[33,-117],[37,-100],[33,-80],[-2,-75],[-41,-78],[-52,-93]];
  paint(g,()=>shapePath(g,SAD),{fill:vgrad(g,-118,-74,[[0,'#d23a44'],[.45,'#9a1a26'],[1,'#560a12']]),line:'#2a0508',lw:1.4,fn:()=>{soft(g,-6,-106,42,9,'#ffc2b0',.3);soft(g,-10,-80,50,8,'#1a0204',.35);}});
  g.save();g.beginPath();crPath(g,[[37,-99],[33,-81],[-2,-76.5],[-41,-79],[-51,-93]],false);g.lineWidth=4.5;g.strokeStyle=lgrad(g,-50,0,40,0,[[0,'#b07a24'],[.5,'#ffe08a'],[1,'#b07a24']]);g.stroke();g.restore();
  for(let i=0;i<16;i++){const t=i/15,x=lerp(34,-48,t),y=t<.5?lerp(-80,-76,t*2):lerp(-76,-90,(t-.5)*2);g.strokeStyle=i%2?'#f4cd62':'#b98524';g.lineWidth=1.6;g.beginPath();g.moveTo(x,y+1);g.lineTo(x-.5,y+7);g.stroke();}
  starPath(g,-6,-95,7.5,0);g.fillStyle=lgrad(g,-12,-100,0,-88,[[0,'#fff0a8'],[1,'#c88a22']]);g.fill();g.lineWidth=1;g.strokeStyle='#3a1a04';g.stroke();
  /* mane: solid mass, then layered tufts for volume */
  const C=[96,-108+P.head*20],sw=P.sweep;
  const maneR=th=>34+17*Math.max(0,-Math.cos(th))+13*Math.max(0,Math.sin(th))+6*Math.max(0,-Math.sin(th));
  {const pts=[];for(let i=0;i<=20;i++){const th=PI*.22+i/20*PI*1.56,r=maneR(th)*.9;pts.push([C[0]+Math.cos(th)*r,C[1]+Math.sin(th)*r]);}pts.push([C[0]+26,C[1]+4]);
    paint(g,()=>shapePath(g,pts),{fill:rgrad(g,C[0]-4,C[1]-8,6,64,[[0,LC.maneL],[.45,LC.maneM],[1,LC.maneD]])});}
  const maneLayer=(n,seed,rA,rB,lenA,lenB,wA,wB,c1,c2,th0,th1)=>{const R=rng(seed);for(let i=0;i<n;i++){const th=th0+R()*(th1-th0),r0=rA+R()*(rB-rA),len=(lenA+R()*(lenB-lenA))*(maneR(th)/40);
    const d=(.42+.14*sw)*Math.cos(th-PI/2)+(R()-.5)*.3;
    lionTuft(g,C[0]+Math.cos(th)*r0,C[1]+Math.sin(th)*r0,th+d,len,wA+R()*(wB-wA),(R()-.5)*14+Math.cos(th)*4*sw,c1,mixHex(c2,c1,R()*.35));}};
  maneLayer(120,901,10,24,26,40,16,24,LC.maneD,mixHex(LC.maneD,LC.maneM,.75),PI*.22,PI*1.78);
  maneLayer(100,902,8,20,18,32,13,19,LC.maneM,LC.maneL,PI*.25,PI*1.72);
  maneLayer(60,905,8,18,12,22,10,14,LC.maneL,LC.maneT,PI*1.0,PI*1.7);
  {const R=rng(903);g.save();g.lineCap='round';for(let i=0;i<260;i++){const th=PI*.25+R()*PI*1.5,r=14+R()*maneR(th)*.7,x=C[0]+Math.cos(th)*r,y=C[1]+Math.sin(th)*r,a=th+(.42+.14*sw)*Math.cos(th-PI/2),l=5+R()*7;
    g.strokeStyle=R()<.5?rgba(LC.maneT,.32):rgba(LC.maneD,.42);g.lineWidth=.8;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a)*l*.5+Math.cos(a+1.5)*2,y+Math.sin(a)*l*.5+Math.sin(a+1.5)*2,x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}g.restore();}
  g.save();g.translate(C[0],C[1]);g.rotate(P.head);g.scale(1.22,1.22);
  /* ear */
  paint(g,()=>ellPath(g,-8,-24,9,8,-.3),{fill:'#4a2210',line:rgba(LC.out,.8),lw:1.2});paint(g,()=>ellPath(g,-7,-23,5.5,4.5,-.3),{fill:'#b8804e'});
  /* head */
  paint(g,()=>shapePath(g,LION_HEAD),{fill:vgrad(g,-26,26,[[0,'#e8ba78'],[.55,'#d09a55'],[1,'#b27a3e']]),line:rgba(LC.out,.85),lw:1.5,rim:'rgba(255,242,205,.55)',rimW:2,fn:()=>{
    soft(g,30,10,15,11,'#f8e8c4',.95);soft(g,22,22,13,6,'#f6e6c6',.85);soft(g,17,-2,9,5,'#faeed6',.7);soft(g,6,-18,17,8,'#fff2d2',.4);soft(g,-6,6,14,17,'#5a2e12',.28);
    furStrokes(g,150,[-18,-26,60,52],()=>PI+.2,4,['#f6d8a4','#9a6430','#dcaa66'],21,.3,.8);}});
  g.strokeStyle=rgba('#6b3c18',.6);g.lineWidth=1.4;g.beginPath();g.moveTo(13,-17);g.quadraticCurveTo(26,-13.5,35,-3.5);g.stroke();
  if(P.eyes==='shut'){g.strokeStyle=LC.out;g.lineWidth=2;g.beginPath();g.moveTo(9,-10);g.quadraticCurveTo(16,-6.5,23,-10);g.stroke();}
  else{soft(g,16,-11,11,8,'#3a1a08',.4);
    g.beginPath();g.moveTo(9,-11);g.quadraticCurveTo(15.5,-16.5,23.5,-11.2);g.quadraticCurveTo(16,-6.8,9,-11);g.closePath();g.fillStyle=rgrad(g,17,-11,0,6.5,[[0,'#ffd970'],[.55,LC.eye],[1,'#8a4a0c']]);g.fill();g.lineWidth=1.3;g.strokeStyle=LC.out;g.stroke();
    g.beginPath();g.arc(17.6,-11.4,2.2,0,TAU);g.fillStyle='#120804';g.fill();g.beginPath();g.arc(18.6,-12.6,.95,0,TAU);g.fillStyle='#fff';g.fill();
    g.beginPath();g.moveTo(8.4,-11.3);g.quadraticCurveTo(15.3,-17.4,24,-11.6);g.lineWidth=2.1;g.strokeStyle=LC.out;g.stroke();
    g.lineWidth=1.1;g.strokeStyle=rgba(LC.out,.55);g.beginPath();g.moveTo(10,-10);g.quadraticCurveTo(12,-2,18,2.5);g.stroke();}
  paint(g,()=>{g.beginPath();g.moveTo(32.5,-4.5);g.quadraticCurveTo(38.5,-6.5,42.5,-1);g.quadraticCurveTo(43.5,4.5,39.5,7.5);g.quadraticCurveTo(34,6.5,32.5,2);g.closePath();},{fill:vgrad(g,-6,8,[[0,'#9a5646'],[.35,'#4a2218'],[1,LC.nose]]),line:LC.out,lw:1});
  g.beginPath();g.ellipse(39.5,4.4,1.8,1.1,.3,0,TAU);g.fillStyle='#0d0503';g.fill();
  const m=P.mouth;
  if(m>.3){g.beginPath();g.moveTo(38.5,11.5);g.quadraticCurveTo(29,16+m*11,19,15+m*3);g.quadraticCurveTo(28,14+m*2,38.5,11.5);g.closePath();g.fillStyle='#3a0a08';g.fill();
    g.beginPath();g.moveTo(34.5,12.6);g.lineTo(33.4,16+m*2.5);g.lineTo(32,13.2);g.closePath();g.fillStyle='#fbf3e2';g.fill();}
  g.beginPath();g.moveTo(40.5,8);g.quadraticCurveTo(38.5,12,32,12.6+m*2);g.quadraticCurveTo(26,14+m*2.5,19,14.2+m*2);g.lineWidth=1.6;g.strokeStyle=LC.out;g.stroke();
  g.fillStyle=rgba('#3a1a08',.65);for(let r=0;r<3;r++)for(let c=0;c<4;c++){g.beginPath();g.arc(24+c*3+r*.8,3+r*2.8,.65,0,TAU);g.fill();}
  g.strokeStyle='rgba(255,250,236,.75)';g.lineWidth=.55;for(let i=0;i<5;i++){g.beginPath();g.moveTo(29,5+i*1.6);g.quadraticCurveTo(45,1+i*3,60,-2+i*6);g.stroke();}
  /* cheek fur along the jaw edge */
  {const R=rng(904),edge=[[-18,-6],[-16,4],[-12,15],[-4,21],[4,24],[12,26],[20,25]];for(let i=0;i<36;i++){const k=R()*(edge.length-1),j=Math.floor(k),f=k-j,x=lerp(edge[j][0],edge[j+1][0],f),y=lerp(edge[j][1],edge[j+1][1],f),ang=Math.atan2(y-4,x-6)+(R()-.5)*.5;
    lionTuft(g,x-Math.cos(ang)*3,y-Math.sin(ang)*3,ang+.2*sw,8+R()*9,6+R()*4,(R()-.5)*5,"#d7a25c",LC.maneL);}}
  g.restore();
  g.restore();
}

/* ======================= CLOWN ======================= */
const CC={coat:'#1d6f7a',coatD:'#0c3a43',coatL:'#48a8ae',pip:'#e8b44a',shirt:'#f6e7ad',check1:'#b7262f',check2:'#f3e5c4',shoe:'#7c1a18',glove:'#fbf8f2',face:'#fdf7ee',faceS:'#cdc4c3',hair:'#ea722c',hat:'#1a1418',band:'#c32832',out:'#231015'};
let _check=null;
function checkPat(g){if(!_check){_check=mkCanvas(12,12);const q=_check.getContext('2d');q.fillStyle=CC.check2;q.fillRect(0,0,12,12);q.fillStyle=CC.check1;q.fillRect(0,0,6,6);q.fillRect(6,6,6,6);q.fillStyle='rgba(255,255,255,.22)';q.fillRect(0,2.6,12,.8);q.fillRect(2.6,0,.8,12);}return g.createPattern(_check,'repeat');}
function clownShoe(g,a,f,far){
  const pts=[[-7,-3],[-6,-9],[3,-10.5],[12,-8.5],[22,-6.5],[28,-1.5],[25,4],[9,5],[-6,4]];
  const c=Math.cos(f),s=Math.sin(f),P=pts.map(([x,y])=>[a[0]+x*c-y*s,a[1]+x*s+y*c]);const base=far?drk(CC.shoe,.35):CC.shoe;
  paint(g,()=>shapePath(g,P),{fill:vgrad(g,a[1]-11,a[1]+5,[[0,lit(base,.25)],[.6,base],[1,drk(base,.5)]]),line:CC.out,lw:1.2,fn:()=>{soft(g,a[0]+18*c,a[1]+18*s-4,6,3,'#ffffff',far?.15:.55);}});
  g.strokeStyle=rgba('#f6e7c8',far?.25:.6);g.lineWidth=1;g.beginPath();g.moveTo(a[0]+2*c+7*s,a[1]+2*s-7*c);g.lineTo(a[0]+7*c+7*s,a[1]+7*s-7*c);g.stroke();
}
function clownGlove(g,w,a,far,open){
  const d=dirOf(a),p=[w[0]+d[0]*6,w[1]+d[1]*6],base=far?drk(CC.glove,.25):CC.glove;
  if(open){for(let i=-1;i<=1;i++){const fa=a+i*.38,fd=dirOf(fa);g.lineCap='round';g.strokeStyle=CC.out;g.lineWidth=5.2;g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0]+fd[0]*9,p[1]+fd[1]*9);g.stroke();g.strokeStyle=base;g.lineWidth=3.2;g.stroke();}}
  paint(g,()=>ellPath(g,p[0],p[1],6.2,6.8,a),{fill:rgrad(g,p[0]-2,p[1]-2,0,8,[[0,'#ffffff'],[1,far?'#b9b4b0':'#d8d2cc']]),line:CC.out,lw:1.1});
  paint(g,()=>ellPath(g,p[0]+d[1]*5,p[1]-d[0]*5,2.8,4,a+.6),{fill:base,line:CC.out,lw:1});
  paint(g,()=>ellPath(g,w[0],w[1],6.5,3,a),{fill:far?'#c9c3bd':'#ffffff',line:CC.out,lw:1});
}
function clownFace(g,face){
  const hair=[[-13,-4,6],[-16,3,5.5],[-11,8,5],[-15,-10,5],[-7,11,4.5],[-17,-3,4.5]];
  for(const[x,y,r]of hair)paint(g,()=>ellPath(g,x,y,r,r),{fill:rgrad(g,x-1.5,y-2,0,r,[[0,'#ffb068'],[.6,CC.hair],[1,'#a3401a']]),line:rgba(CC.out,.6),lw:.9});
  const HEAD=[[-15,-8],[-8,-16],[4,-17],[13,-12],[17,-3],[17,6],[12,13],[3,17],[-7,15],[-14,8],[-16,0]];
  paint(g,()=>ellPath(g,-7,2,3.8,5.2),{fill:'#f0bea6',line:rgba(CC.out,.7),lw:1});
  paint(g,()=>shapePath(g,HEAD),{fill:rgrad(g,6,-5,1,22,[[0,'#ffffff'],[.55,CC.face],[1,CC.faceS]]),line:rgba(CC.out,.85),lw:1.2,fn:()=>{soft(g,11,7,6,5,'#ff5a64',.45);soft(g,0,15,12,4,'#8a7a80',.35);soft(g,-10,0,6,12,'#9a8f90',.25);}});
  g.strokeStyle='#1c0d12';g.lineWidth=1.5;g.beginPath();g.moveTo(-1.5,-9.5);g.quadraticCurveTo(3,-15.5,8,-10.5);g.moveTo(10,-10.5);g.quadraticCurveTo(13.5,-15,16.5,-10);g.stroke();
  const eye=(x,y,w,h)=>{if(face==='ouch'){g.strokeStyle='#1c0d12';g.lineWidth=1.4;g.beginPath();g.moveTo(x-w,y-h*.6);g.lineTo(x+w,y);g.lineTo(x-w,y+h*.6);g.stroke();return;}
    const sq=face==='focus'?.55:1;paint(g,()=>ellPath(g,x,y,w,h*sq),{fill:'#ffffff',line:'#2a1418',lw:.9});
    g.beginPath();g.arc(x+w*.35,y+.3,w*.62*Math.min(1,sq+.2),0,TAU);g.fillStyle=rgrad(g,x+w*.3,y,0,w*.7,[[0,'#7fc3ff'],[1,'#1f4f9a']]);g.fill();
    g.beginPath();g.arc(x+w*.4,y+.3,w*.3,0,TAU);g.fillStyle='#0a0508';g.fill();g.beginPath();g.arc(x+w*.55,y-.8,w*.16,0,TAU);g.fillStyle='#fff';g.fill();};
  eye(3.5,-5,3.6,4.6);eye(12.6,-5,2.8,4.4);
  if(face==='yell'||face==='ouch'){
    paint(g,()=>{g.beginPath();g.moveTo(1,5);g.quadraticCurveTo(10,9,19,4);g.quadraticCurveTo(11,22,1,5);g.closePath();},{fill:'#d8222e',line:CC.out,lw:1});
    paint(g,()=>ellPath(g,10,11,5,4.2),{fill:'#3a0810'});paint(g,()=>ellPath(g,10,13.5,3.2,1.8),{fill:'#e85a6a'});
  }else{
    paint(g,()=>{g.beginPath();g.moveTo(1,6);g.quadraticCurveTo(10,9.5,19,4.5);g.quadraticCurveTo(11,17.5,1,6);g.closePath();},{fill:lgrad(g,0,5,0,16,[[0,'#ff3a44'],[1,'#b3121e']]),line:CC.out,lw:1});
    g.strokeStyle='#4a0810';g.lineWidth=1.2;g.beginPath();g.moveTo(2.5,7);g.quadraticCurveTo(10,12.5,17.5,6);g.stroke();
  }
  paint(g,()=>ellPath(g,17.5,1,6.3,6.1),{fill:rgrad(g,15.5,-1.5,.5,7.5,[[0,'#ffb3a8'],[.25,'#ef2a30'],[1,'#8a0a12']]),line:CC.out,lw:1});
  g.beginPath();g.ellipse(15.6,-1.4,1.8,1.2,-.5,0,TAU);g.fillStyle='rgba(255,255,255,.85)';g.fill();
  g.save();g.translate(-2,-15);g.rotate(-.2);
  paint(g,()=>{g.beginPath();g.moveTo(-8,0);g.lineTo(-7,-15);g.quadraticCurveTo(0,-17,7,-15);g.lineTo(8,0);g.closePath();},{fill:lgrad(g,-8,0,8,0,[[0,'#0e0a0c'],[.45,'#3a2c34'],[1,'#0e0a0c']]),line:'#050304',lw:1});
  g.fillStyle=CC.band;g.fillRect(-7.8,-5.5,15.6,4);
  paint(g,()=>ellPath(g,0,0,13,3.2),{fill:lgrad(g,-13,0,13,0,[[0,'#0e0a0c'],[.5,'#40323a'],[1,'#0e0a0c']]),line:'#050304',lw:1});
  for(let i=0;i<6;i++){const a=i/6*TAU;g.beginPath();g.ellipse(6+Math.cos(a)*2.6,-4+Math.sin(a)*2.6,2,1.1,a,0,TAU);g.fillStyle='#fffdf6';g.fill();}
  g.beginPath();g.arc(6,-4,1.3,0,TAU);g.fillStyle='#f5c021';g.fill();
  g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=1;g.beginPath();g.moveTo(-4,-14);g.lineTo(-4,-7);g.stroke();
  g.restore();
}
function drawClownG(g,P){
  const hip=P.hip,lean=P.lean||0;
  const rot=(lx,ly)=>[hip[0]+lx*Math.cos(lean)-ly*Math.sin(lean),hip[1]+lx*Math.sin(lean)+ly*Math.cos(lean)];
  const shN=rot(1,-35),shF=rot(-4,-34);
  const arm=(sh,a,far,open)=>{const pts=chain(sh,[[20,a[0]],[19,a[1]]]),base=far?drk(CC.coat,.35):CC.coat;
    paint(g,()=>limbPath(g,pts,[12,10.5,9]),{fill:vgrad(g,pts[0][1]-10,pts[2][1]+10,[[0,lit(base,.2)],[1,drk(base,.3)]]),line:CC.out,lw:1.1,fn:()=>{soft(g,pts[1][0],pts[1][1],6,10,'#ffffff',far?.03:.12);}});
    clownGlove(g,pts[2],a[1],far,open);};
  const leg=(hj,a,far)=>{const pts=chain(hj,[[30,a[0]],[29,a[1]]]);
    paint(g,()=>limbPath(g,pts,[21,17,20]),{fill:checkPat(g),line:CC.out,lw:1.1,fn:()=>{g.fillStyle=lgrad(g,pts[1][0]-12,0,pts[1][0]+12,0,[[0,'rgba(20,6,6,.35)'],[.45,'rgba(255,240,220,.1)'],[1,'rgba(20,6,6,.3)']]);g.fillRect(-300,-300,600,600);if(far){g.fillStyle='rgba(10,4,6,.35)';g.fillRect(-300,-300,600,600);}}});
    clownShoe(g,pts[2],a[2]||0,far);};
  if(!P.sit)arm(shF,P.arms[0],true,P.open);
  else arm(shF,P.arms[0],true,P.open);
  /* coat tails */
  g.save();g.translate(hip[0],hip[1]);g.rotate(lean);
  paint(g,()=>shapePath(g,[[-12,-30],[-15,-6],[-18,10],[-11,17],[-5,6],[-3,-10]]),{fill:vgrad(g,-30,17,[[0,CC.coat],[1,CC.coatD]]),line:CC.out,lw:1.1});
  g.restore();
  if(!P.sit)leg([hip[0]-2,hip[1]],P.legs[0],true);
  leg([hip[0]+2,hip[1]],P.legs[1],false);
  /* coat */
  g.save();g.translate(hip[0],hip[1]);g.rotate(lean);
  const COAT=[[-12,-37],[-2,-41],[10,-39],[15,-31],[16,-17],[14,-3],[10,4],[-4,3],[-13,0],[-15,-18]];
  paint(g,()=>shapePath(g,COAT),{fill:vgrad(g,-40,4,[[0,CC.coatL],[.35,CC.coat],[1,CC.coatD]]),line:CC.out,lw:1.2,rim:'rgba(210,255,250,.35)',rimW:2,fn:()=>{soft(g,8,-26,10,14,'#ffffff',.14);soft(g,-10,-10,8,18,'#021418',.3);}});
  paint(g,()=>shapePath(g,[[7,-38],[13.5,-31],[13,-13],[9,-13],[6,-30]]),{fill:vgrad(g,-38,-13,[[0,'#fff8d8'],[1,CC.shirt]]),line:rgba(CC.out,.6),lw:.8});
  paint(g,()=>shapePath(g,[[3,-39.5],[11,-37.5],[9.5,-24],[5.5,-31]]),{fill:lit(CC.coat,.3),line:rgba(CC.out,.6),lw:.8});
  g.strokeStyle=lgrad(g,0,-38,0,4,[[0,'#ffe79a'],[1,'#a8741e']]);g.lineWidth=1.6;g.beginPath();g.moveTo(9.5,-24);g.quadraticCurveTo(12,-10,10,3.5);g.stroke();
  for(const by of[-19,-9]){g.beginPath();g.arc(12.6,by,1.9,0,TAU);g.fillStyle=rgrad(g,12,by-.6,0,2.2,[[0,'#fff3b0'],[1,'#a8741e']]);g.fill();}
  for(let i=0;i<6;i++){const a=i/6*TAU;g.beginPath();g.ellipse(4+Math.cos(a)*2.2,-31+Math.sin(a)*2.2,1.7,.9,a,0,TAU);g.fillStyle='#ffffff';g.fill();}
  g.beginPath();g.arc(4,-31,1.1,0,TAU);g.fillStyle='#f4bf22';g.fill();
  /* ruff collar */
  for(let layer=0;layer<2;layer++){const cy=-40-layer*2.2,rx=17-layer*3,ry=6-layer*1.3;const pts=[];for(let i=0;i<24;i++){const a=i/24*TAU,r=i%2?1:1.22;pts.push([1+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r]);}
    paint(g,()=>shapePath(g,pts),{fill:rgrad(g,4,cy-2,1,rx*1.2,[[0,'#ffffff'],[.7,'#f2eee8'],[1,'#b9b2b4']]),line:rgba(CC.out,.7),lw:.9});
    g.strokeStyle='rgba(120,110,120,.4)';g.lineWidth=.6;for(let i=1;i<24;i+=2){const a=i/24*TAU;g.beginPath();g.moveTo(1+Math.cos(a)*rx*.5,cy+Math.sin(a)*ry*.5);g.lineTo(1+Math.cos(a)*rx*1.2,cy+Math.sin(a)*ry*1.2);g.stroke();}}
  paint(g,()=>{g.beginPath();g.moveTo(4,-40);g.lineTo(-2,-44);g.lineTo(-2,-36);g.closePath();g.moveTo(4,-40);g.lineTo(10,-44);g.lineTo(10,-36);g.closePath();},{fill:'#d0222c',line:CC.out,lw:.8});
  g.restore();
  /* head */
  const hc=rot(2,-58);g.save();g.translate(hc[0],hc[1]);g.rotate(lean*.55+(P.tilt||0));clownFace(g,P.face||'smile');g.restore();
  arm(shN,P.arms[1],false,P.open);
}
/* clown pose library */
function clownPose(kind,p){
  const S=Math.sin(p*TAU);
  if(kind==='run'){const leg=ph=>{const sn=Math.sin(ph*TAU),th=-.85*sn,bend=.15+1.15*Math.max(0,Math.sin(ph*TAU+1.9));return[th,th+bend,Math.max(-.25,(bend-.3)*.35)];};
    return{hip:[0,-57-3*Math.abs(Math.cos(p*TAU))],lean:.2,legs:[leg(p+.5),leg(p)],arms:[[-.9*S,-.9*S-1.3],[.9*S,.9*S-1.3]],face:'smile'};}
  if(kind==='balance'){return{hip:[2*S,-59],lean:.05*S,legs:[[.1+.08*S,.22,0],[-.1-.08*S,.05,0]],arms:[[-1.45+.22*S,-1.3+.3*S],[1.45+.22*S,1.3+.3*S]],face:'smile',open:true};}
  if(kind==='jump')return{hip:[0,-60],lean:.12,legs:[[-1.1,.05,-.3],[-.4,.95,.3]],arms:[[-2.25,-2.65],[-2.65,-2.95]],face:'yell',open:true};
  if(kind==='fall')return{hip:[0,-60],lean:.05,legs:[[.3,.62,.2],[-.5,-.1,-.2]],arms:[[1.95,2.35],[-2.05,-2.45]],face:'yell',open:true};
  if(kind==='duck')return{hip:[6,-27],lean:.98,tilt:-.25,legs:[[-1.3,1,0],[-1.45,.9,0]],arms:[[-1.1,-1.8],[-2.05,-2.75]],face:'focus'};
  if(kind==='hurt')return{hip:[0,-58],lean:-.35,legs:[[.5,.9,.3],[-.6,-.2,-.2]],arms:[[2.3,2.6],[-2.4,-2]],face:'ouch',open:true};
  if(kind==='cheer')return{hip:[0,-59-2*S*S],lean:-.05,legs:[[.12,.18,0],[-.12,-.05,0]],arms:[[-2.7-.2*S,-2.95],[-2.8+.25*S,-3.05+.35*Math.sin(p*TAU+1.5)]],face:'yell',open:true};
  if(kind==='ride')return{sit:true,hip:[0,0],lean:.05+.03*S,legs:[null,[-1.25,.12,.2]],arms:[[-.9,-1.5],[-2.7+.3*S,-3.1+.4*Math.sin(p*TAU+1)]],face:'smile',open:true};
  if(kind==='rideDuck')return{sit:true,hip:[0,0],lean:1.2,tilt:-.45,legs:[null,[-1.25,.12,.2]],arms:[[-1.5,-1.35],[-1.65,-1.4]],face:'focus'};
  if(kind==='rideHurt')return{sit:true,hip:[0,0],lean:-.3,legs:[null,[-1.1,-.2,0]],arms:[[2.3,2.6],[-2.4,-2]],face:'ouch',open:true};
  return clownPose('balance',0);
}

/* ======================= MONKEY ======================= */
const MC={fur:'#6e4526',furD:'#3a2111',furL:'#a8744a',face:'#efcfa2',faceS:'#c99a68',out:'#1f0f07',jacket:{brown:'#b3202a',blue:'#2358b8',pink:'#ff4fa0'}};
function drawMonkeyG(g,P,variant){
  const jc=MC.jacket[variant]||MC.jacket.brown,hip=P.hip,lean=P.lean||0;
  const rot=(lx,ly)=>[hip[0]+lx*Math.cos(lean)-ly*Math.sin(lean),hip[1]+lx*Math.sin(lean)+ly*Math.cos(lean)];
  const fur=(far)=>far?drk(MC.fur,.35):MC.fur;
  const tl=P.tail||0,tp=[rot(-6,-2),rot(-16,0+tl*2),rot(-25,-8+tl*3),rot(-25,-20+tl*3),rot(-18,-26+tl*2),rot(-13,-21+tl)];
  paint(g,()=>limbPath(g,tp,[5,4.6,4.2,3.8,3.4,3]),{fill:fur(true),line:MC.out,lw:1});
  const limb=(st,segs,ws,far)=>{const pts=chain(st,segs);paint(g,()=>limbPath(g,pts,ws),{fill:vgrad(g,pts[0][1]-6,pts[pts.length-1][1]+6,[[0,lit(fur(far),.15)],[1,drk(fur(far),.2)]]),line:MC.out,lw:1});return pts;};
  const hand=(p,far)=>paint(g,()=>ellPath(g,p[0],p[1],3.4,3.4),{fill:far?drk(MC.face,.3):MC.face,line:MC.out,lw:.9});
  const foot=(p,far)=>paint(g,()=>ellPath(g,p[0]+3,p[1]-1.5,5.2,2.8),{fill:far?drk(MC.face,.3):MC.face,line:MC.out,lw:.9});
  const shN=rot(2,-17),shF=rot(-2,-16);
  hand(limb(shF,[[10,P.arms[0][0]],[10,P.arms[0][1]]],[6,5,4.5],true)[2],true);
  foot(limb([hip[0]-2,hip[1]],[[11,P.legs[0][0]],[10,P.legs[0][1]]],[7.5,6,5],true)[2],true);
  foot(limb([hip[0]+2,hip[1]],[[11,P.legs[1][0]],[10,P.legs[1][1]]],[7.5,6,5],false)[2],false);
  g.save();g.translate(hip[0],hip[1]);g.rotate(lean);
  paint(g,()=>shapePath(g,[[-9,-18],[0,-21],[9,-17],[10,-6],[7,1],[-7,2],[-10,-6]]),{fill:vgrad(g,-21,2,[[0,lit(jc,.3)],[.5,jc],[1,drk(jc,.4)]]),line:MC.out,lw:1.1,rim:'rgba(255,230,210,.35)',rimW:1.6,fn:()=>{soft(g,4,-12,6,8,'#ffffff',.18);}});
  g.strokeStyle='#f0c24e';g.lineWidth=1.6;g.beginPath();g.moveTo(-8,1);g.lineTo(7,0);g.stroke();
  for(const by of[-14,-8,-2]){g.beginPath();g.arc(6.5,by,1.3,0,TAU);g.fillStyle='#ffe07a';g.fill();}
  g.restore();
  const hc=rot(1,-29);g.save();g.translate(hc[0],hc[1]);g.rotate(lean*.5+(P.tilt||0));
  for(const s of[-1,1])paint(g,()=>ellPath(g,s*10.5,-1,4.6,5),{fill:MC.face,line:MC.out,lw:1});
  paint(g,()=>ellPath(g,0,-2,11.5,11),{fill:rgrad(g,-2,-6,1,13,[[0,MC.furL],[1,MC.furD]]),line:MC.out,lw:1.1});
  paint(g,()=>shapePath(g,[[-4,-7],[4,-9],[10,-5],[11,2],[8,8],[2,9.5],[-3,6],[-5,0]]),{fill:rgrad(g,3,-1,1,11,[[0,'#fbe2bd'],[1,MC.faceS]]),line:rgba(MC.out,.7),lw:.9});
  const f=P.face||'grin';
  if(f==='dizzy'){g.strokeStyle=MC.out;g.lineWidth=1.1;for(const ex of[1.5,7.5]){g.beginPath();for(let i=0;i<14;i++){const a=i*.9,r=i*.22;g.lineTo(ex+Math.cos(a)*r,-2.5+Math.sin(a)*r);}g.stroke();}}
  else{for(const ex of[1.5,7.5]){paint(g,()=>ellPath(g,ex,-2.5,2.8,3.3),{fill:'#fff',line:MC.out,lw:.8});g.beginPath();g.arc(ex+.9,-2.2,1.7,0,TAU);g.fillStyle='#2a1406';g.fill();g.beginPath();g.arc(ex+1.4,-3,.6,0,TAU);g.fillStyle='#fff';g.fill();}}
  g.fillStyle=rgba(MC.furD,.35);g.fillRect(-1,-7.5,11,1.6);
  paint(g,()=>ellPath(g,7,4.5,6,4.2),{fill:'#f7dcb2',line:rgba(MC.out,.6),lw:.8});
  g.fillStyle=MC.out;g.beginPath();g.arc(8,2.5,.7,0,TAU);g.arc(10,2.6,.7,0,TAU);g.fill();
  if(f==='grin'){paint(g,()=>{g.beginPath();g.moveTo(2.5,5.5);g.quadraticCurveTo(8,10.5,12.5,5);g.quadraticCurveTo(8,7,2.5,5.5);g.closePath();},{fill:'#fffaf0',line:MC.out,lw:.9});}
  else{paint(g,()=>ellPath(g,8,7,2.4,2),{fill:'#3a0a06'});}
  g.save();g.translate(1,-12);g.rotate(.15);
  paint(g,()=>{g.beginPath();g.moveTo(-6,1);g.lineTo(-4.5,-8);g.lineTo(4.5,-8);g.lineTo(6,1);g.closePath();},{fill:lgrad(g,-6,0,6,0,[[0,drk(variant==='pink'?'#ff4fa0':'#b81e2a',.3)],[.45,lit(variant==='pink'?'#ff4fa0':'#c8222e',.2)],[1,drk(variant==='pink'?'#ff4fa0':'#b81e2a',.35)]]),line:MC.out,lw:.9});
  g.strokeStyle='#120604';g.lineWidth=1;g.beginPath();g.moveTo(0,-8);g.quadraticCurveTo(-6,-8,-7,-2);g.stroke();g.beginPath();g.arc(-7,-1.5,1.3,0,TAU);g.fillStyle='#120604';g.fill();
  g.restore();
  g.restore();
  hand(limb(shN,[[10,P.arms[1][0]],[10,P.arms[1][1]]],[6,5,4.5],false)[2],false);
}
function monkeyPose(kind,p){
  const S=Math.sin(p*TAU);
  const walkLegs=()=>{const l=ph=>{const s=Math.sin(ph*TAU);return[-.6*s,-.6*s+.3+.6*Math.max(0,Math.sin(ph*TAU+1.6))];};return[l(p+.5),l(p)];};
  if(kind==='walk')return{hip:[0,-20-1.5*Math.abs(Math.cos(p*TAU))],lean:.12,legs:walkLegs(),arms:[[-2.4-.4*S,-2.8-.3*S],[-2.4+.4*S,-2.8+.3*S]],tail:S,face:'grin'};
  if(kind==='carry')return{hip:[0,-20-1.2*Math.abs(Math.cos(p*TAU))],lean:0,legs:walkLegs(),arms:[[-2.95,-3.12],[-3.05,-3.2]],tail:S,face:'grin'};
  if(kind==='stand')return{hip:[0,-21],lean:0,legs:[[.15,.2],[-.15,-.1]],arms:[[-2.95,-3.12],[-3.05,-3.2]],tail:S*.5,face:'grin'};
  if(kind==='top')return{hip:[0,-21],lean:-.05,legs:[[.12,.18],[-.12,-.08]],arms:[[-2.6-.35*S,-3],[-2.7+.35*S,-3.1+.3*S]],tail:S,face:'grin'};
  if(kind==='jump')return{hip:[0,-20],lean:.35,legs:[[-.9,.6],[-1.2,.4]],arms:[[-1.6,-2.2],[-1.3,-1.9]],tail:1,face:'grin'};
  if(kind==='knock')return{hip:[0,-20],lean:-.4,legs:[[.9,1.4],[-.8,-.3]],arms:[[2.4,2.8],[-2.5,-2.1]],tail:-1,face:'dizzy'};
  return monkeyPose('walk',0);
}

/* ======================= CROW ======================= */
function drawCrowG(g,flap){
  const wing=(ang,far)=>{g.save();g.translate(2,-7);g.rotate(ang);
    const pts=[[4,0],[-4,-8],[-16,-24],[-30,-38],[-40,-40],[-37,-31],[-43,-27],[-33,-20],[-37,-14],[-24,-8],[-12,-2]];
    paint(g,()=>shapePath(g,pts),{fill:vgrad(g,-40,2,[[0,far?'#15162a':'#2a2d52'],[1,far?'#07070e':'#0e0f1c']]),line:'#030307',lw:1,fn:()=>{g.strokeStyle='rgba(140,150,230,.28)';g.lineWidth=.8;for(let i=0;i<5;i++){g.beginPath();g.moveTo(-6-i*2,-4-i*2);g.lineTo(-24-i*4,-18-i*5);g.stroke();}}});
    g.restore();};
  wing(-flap*.9+.2,true);
  paint(g,()=>shapePath(g,[[-40,4],[-44,-2],[-28,-4]]),{fill:'#0d0e1a',line:'#030307',lw:1});
  paint(g,()=>shapePath(g,[[-28,2],[-16,-10],[4,-13],[17,-9],[20,2],[8,11],[-14,10]]),{fill:vgrad(g,-13,11,[[0,'#2b2f55'],[1,'#07080f']]),line:'#030307',lw:1.1,fn:()=>{soft(g,0,-8,16,5,'#8e95ff',.3);furStrokes(g,60,[-26,-10,44,20],()=>PI+.1,6,['#3a3f7a','#05060c'],7,.4,.8);}});
  paint(g,()=>ellPath(g,21,-10,10,9.5),{fill:rgrad(g,19,-14,1,11,[[0,'#3a3f6e'],[1,'#07080f']]),line:'#030307',lw:1.1});
  paint(g,()=>{g.beginPath();g.moveTo(28,-14);g.quadraticCurveTo(40,-13,47,-8);g.quadraticCurveTo(38,-4,28,-5);g.closePath();},{fill:lgrad(g,28,-14,28,-4,[[0,'#8c8c96'],[1,'#2e2e36']]),line:'#030307',lw:1});
  paint(g,()=>ellPath(g,24,-13,3.4,3.4),{fill:'#f6d23a',line:'#030307',lw:.8});g.beginPath();g.arc(24.7,-13,1.6,0,TAU);g.fillStyle='#050305';g.fill();g.beginPath();g.arc(25.3,-13.8,.6,0,TAU);g.fillStyle='#fff';g.fill();
  paint(g,()=>{g.beginPath();g.moveTo(12,-17);g.quadraticCurveTo(13,-30,21,-30);g.quadraticCurveTo(29,-30,30,-17);g.closePath();},{fill:lgrad(g,12,0,30,0,[[0,'#1a1210'],[.5,'#4a3a30'],[1,'#1a1210']]),line:'#030307',lw:1});
  paint(g,()=>ellPath(g,21,-17,12,2.6),{fill:'#231915',line:'#030307',lw:1});g.fillStyle='#8a1a22';g.fillRect(12.5,-21,17,2.4);
  wing(-flap*.9,false);
}

/* ======================= CROWD PEOPLE ======================= */
const SKINS=['#f3cfa9','#e6b48a','#c98d62','#9a6440','#6e4228','#f7dcc0'];
const HAIRS=['#1c120c','#3a2416','#6a3e1c','#b0702e','#d9b36a','#8a8a8a','#e0e0e0','#a2381e'];
const CLOTH=['#7a1f24','#23466e','#2f5a3a','#6a4a24','#4a2a52','#8a6a2a','#2a2a30','#b04a2a','#3a6a78','#a33a5a','#5a5f2a','#1f3a5a'];
function personSpec(R){
  const kid=R()<.18,female=R()<.5;
  return{kid,female,skin:SKINS[Math.floor(R()*SKINS.length)],hair:HAIRS[Math.floor(R()*(kid?5:HAIRS.length))],hs:Math.floor(R()*6),
    hat:R()<.45?1+Math.floor(R()*6):0,cloth:CLOTH[Math.floor(R()*CLOTH.length)],cloth2:CLOTH[Math.floor(R()*CLOTH.length)],style:Math.floor(R()*4),
    acc:R()<.42?1+Math.floor(R()*6):0,glasses:R()<.12,mous:!female&&!kid&&R()<.25};
}
function drawPersonG(g,s,pose){
  const k=s.kid?.8:1;g.save();g.scale(k,k);
  const skin=s.skin,shadow=drk(skin,.35);
  const arm=(sx,pts,far)=>{paint(g,()=>limbPath(g,[[sx,-26],...pts],[8,7,6]),{fill:far?drk(s.cloth,.3):s.cloth,line:rgba('#140a06',.7),lw:.9});const h=pts[pts.length-1];paint(g,()=>ellPath(g,h[0],h[1],3.3,3.6),{fill:skin,line:rgba('#140a06',.6),lw:.8});};
  if(s.female&&(s.hs===2||s.hs===4))paint(g,()=>shapePath(g,[[-11,-48],[11,-48],[13,-30],[9,-22],[-9,-22],[-13,-30]]),{fill:vgrad(g,-48,-22,[[0,s.hair],[1,drk(s.hair,.3)]])});
  if(pose===1){arm(-12,[[-19,-40],[-17,-56]],true);}
  /* torso */
  paint(g,()=>shapePath(g,[[-15,2],[-16,-17],[-13,-26],[-6,-30],[6,-30],[13,-26],[16,-17],[15,2]]),{fill:vgrad(g,-30,2,[[0,lit(s.cloth,.12)],[.5,s.cloth],[1,drk(s.cloth,.35)]]),line:rgba('#140a06',.7),lw:1,fn:()=>{
    if(s.style===1){g.fillStyle=rgba(s.cloth2,.8);for(let y=-28;y<4;y+=5)g.fillRect(-17,y,34,2.2);}
    if(s.style===0&&!s.female){g.fillStyle='#f4efe6';g.beginPath();g.moveTo(-4,-30);g.lineTo(0,-18);g.lineTo(4,-30);g.closePath();g.fill();g.fillStyle=s.cloth2;g.beginPath();g.moveTo(-1.2,-26);g.lineTo(0,-14);g.lineTo(1.2,-26);g.closePath();g.fill();
      g.strokeStyle=rgba('#000',.35);g.lineWidth=1;g.beginPath();g.moveTo(-5,-30);g.lineTo(-1,-12);g.moveTo(5,-30);g.lineTo(1,-12);g.stroke();}
    if(s.female&&s.style!==1){g.fillStyle='#f6f0e6';g.beginPath();g.ellipse(0,-29,7,3.5,0,0,PI);g.fill();}
    soft(g,0,-22,12,8,'#fff2d6',.18);}});
  /* neck & head */
  g.fillStyle=shadow;g.fillRect(-3,-35,6,6);
  const hy=-43;
  if(s.hs===5&&!s.female){}else if(!(s.female&&(s.hs===2||s.hs===4)))paint(g,()=>ellPath(g,0,hy-2,9.6,10),{fill:s.hair});
  paint(g,()=>ellPath(g,0,hy,8.4,9.6),{fill:rgrad(g,1,hy+1,1,11,[[0,lit(skin,.12)],[.7,skin],[1,shadow]]),line:rgba('#140a06',.65),lw:.9});
  paint(g,()=>ellPath(g,-8.3,hy+.5,1.8,2.6),{fill:skin,line:rgba('#140a06',.5),lw:.6});paint(g,()=>ellPath(g,8.3,hy+.5,1.8,2.6),{fill:skin,line:rgba('#140a06',.5),lw:.6});
  /* hair styles */
  const hairFill=vgrad(g,hy-12,hy,[[0,lit(s.hair,.15)],[1,s.hair]]);
  if(s.hs===0)paint(g,()=>{g.beginPath();g.ellipse(0,hy-3,9,7.5,0,PI,TAU);g.quadraticCurveTo(4,hy-4,-9,hy-2);g.closePath();},{fill:hairFill});
  else if(s.hs===1)paint(g,()=>{g.beginPath();g.ellipse(0,hy-3,9.2,8,0,PI*.95,PI*2.05);g.lineTo(6,hy-5);g.quadraticCurveTo(0,hy-8,-6,hy-3);g.closePath();},{fill:hairFill});
  else if(s.hs===3){for(let i=0;i<7;i++){const a=PI+i/6*PI;paint(g,()=>ellPath(g,Math.cos(a)*7.5,hy-2+Math.sin(a)*7.5,3.6,3.6),{fill:hairFill});}}
  else if(s.hs===5){if(s.female)paint(g,()=>{g.beginPath();g.ellipse(0,hy-3,9,7.5,0,PI,TAU);g.closePath();},{fill:hairFill});else{g.fillStyle=s.hair;g.fillRect(-9,hy-2,2.6,5);g.fillRect(6.4,hy-2,2.6,5);}}
  else paint(g,()=>{g.beginPath();g.ellipse(0,hy-3,9.4,8,0,PI,TAU);g.closePath();},{fill:hairFill});
  if(s.female&&s.hs===2)paint(g,()=>ellPath(g,0,hy-11,4.5,4),{fill:hairFill});
  /* face */
  const eyeY=hy+.5;
  for(const ex of[-3.2,3.2]){g.beginPath();g.ellipse(ex,eyeY,1.25,pose===1?.9:1.4,0,0,TAU);g.fillStyle='#1a0e08';g.fill();g.beginPath();g.arc(ex+.4,eyeY-.5,.45,0,TAU);g.fillStyle='#fff';g.fill();}
  g.strokeStyle=rgba(drk(s.hair,.2),.9);g.lineWidth=.9;g.beginPath();g.moveTo(-5,eyeY-3);g.lineTo(-1.6,eyeY-3.6);g.moveTo(1.6,eyeY-3.6);g.lineTo(5,eyeY-3);g.stroke();
  soft(g,-4.5,hy+4,2.6,1.6,'#ff6a60',.35);soft(g,4.5,hy+4,2.6,1.6,'#ff6a60',.35);
  g.strokeStyle=rgba(shadow,.8);g.lineWidth=.8;g.beginPath();g.moveTo(0,eyeY+1);g.lineTo(.8,hy+4.4);g.stroke();
  if(pose===1){paint(g,()=>ellPath(g,0,hy+6.4,2.4,2.1),{fill:'#4a0e0c'});}
  else{g.strokeStyle='#5a1a14';g.lineWidth=.9;g.beginPath();g.arc(0,hy+4.8,2.6,.25,PI-.25);g.stroke();}
  if(s.mous){g.fillStyle=drk(s.hair,.2);g.beginPath();g.ellipse(-2,hy+4.8,2.6,1,-.2,0,TAU);g.ellipse(2,hy+4.8,2.6,1,.2,0,TAU);g.fill();}
  if(s.glasses){g.strokeStyle='#1a0e08';g.lineWidth=.8;g.beginPath();g.arc(-3.2,eyeY,2.4,0,TAU);g.moveTo(5.6,eyeY);g.arc(3.2,eyeY,2.4,0,TAU);g.moveTo(-.8,eyeY);g.lineTo(.8,eyeY);g.stroke();}
  /* hats */
  const hc=s.female?['#8a1a3a','#d9c28a','#2a4a6a'][s.hs%3]:['#1a1210','#d9c28a','#3a3024'][s.hs%3];
  if(s.hat===1){paint(g,()=>ellPath(g,0,hy-6,13,2.6),{fill:'#1a1210'});paint(g,()=>{g.beginPath();g.ellipse(0,hy-7,8.4,8,0,PI,TAU);g.closePath();},{fill:vgrad(g,hy-15,hy-7,[[0,'#3a2e28'],[1,'#120c0a']])});}
  else if(s.hat===2){paint(g,()=>ellPath(g,0,hy-7,13.5,3),{fill:'#e3cc8e',line:rgba('#3a2a10',.6),lw:.7});g.fillStyle='#d9c28a';g.fillRect(-8,hy-13,16,6);g.fillStyle='#7a1a1a';g.fillRect(-8,hy-9.5,16,2.2);}
  else if(s.hat===3){paint(g,()=>{g.beginPath();g.ellipse(0,hy-6,9.6,6.5,0,PI,TAU);g.lineTo(13,hy-5);g.lineTo(9,hy-4);g.closePath();},{fill:vgrad(g,hy-13,hy-4,[[0,lit(hc,.2)],[1,hc]])});}
  else if(s.hat===4){paint(g,()=>ellPath(g,0,hy-6.5,12,2.5),{fill:'#141010'});g.fillStyle='#1c1616';g.fillRect(-7,hy-21,14,15);g.fillStyle='#6a1a1a';g.fillRect(-7,hy-10,14,2.5);}
  else if(s.hat===5){paint(g,()=>{g.beginPath();g.ellipse(0,hy-4,10.5,9,0,PI,TAU);g.closePath();},{fill:vgrad(g,hy-13,hy-4,[[0,lit(hc,.25)],[1,hc]])});g.fillStyle=lit(hc,.35);g.fillRect(-10,hy-6,20,2);}
  else if(s.hat===6&&s.female){g.fillStyle=s.cloth2;g.beginPath();g.moveTo(5,hy-8);g.lineTo(11,hy-12);g.lineTo(11,hy-4);g.closePath();g.moveTo(5,hy-8);g.lineTo(-1,hy-12);g.lineTo(-1,hy-4);g.closePath();g.fill();}
  /* arms & props */
  if(pose===1){arm(12,[[19,-40],[17,-56]],false);}
  else if(pose===2){arm(-12,[[-8,-14],[-1,-20]],true);arm(12,[[8,-14],[1,-21]],false);}
  if(s.acc===1&&pose!==2){const px=pose===1?17:9,py=pose===1?-62:-14;g.fillStyle='#f4f0e6';g.fillRect(px-4,py-7,8,9);g.fillStyle='#c8222c';g.fillRect(px-3,py-7,2,9);g.fillRect(px+1,py-7,2,9);for(let i=0;i<4;i++){g.beginPath();g.arc(px-3+i*2,py-8,2,0,TAU);g.fillStyle='#fff3c4';g.fill();}}
  if(s.acc===2){const px=pose===1?-17:-11,py=pose===1?-58:-14;g.strokeStyle='#5a3a1a';g.lineWidth=1.2;g.beginPath();g.moveTo(px,py);g.lineTo(px,py-22);g.stroke();g.beginPath();g.moveTo(px,py-22);g.lineTo(px+15,py-18);g.lineTo(px,py-14);g.closePath();g.fillStyle=s.cloth2==='#2a2a30'?'#c8222c':s.cloth2;g.fill();}
  if(s.acc===3&&s.kid){g.strokeStyle='rgba(40,20,10,.7)';g.lineWidth=.7;g.beginPath();g.moveTo(10,-18);g.quadraticCurveTo(16,-50,12,-80);g.stroke();paint(g,()=>ellPath(g,12,-88,8,9.5),{fill:rgrad(g,9,-92,1,10,[[0,'#ffd0e0'],[.4,['#ff4f7a','#4fb0ff','#ffc84f'][s.hs%3]],[1,drk(['#ff4f7a','#4fb0ff','#ffc84f'][s.hs%3],.4)]])});}
  if(s.acc===4){const px=pose===1?-17:-9,py=pose===1?-60:-14;g.strokeStyle='#e8dcc0';g.lineWidth=1.2;g.beginPath();g.moveTo(px,py);g.lineTo(px,py-12);g.stroke();for(let i=0;i<5;i++){g.beginPath();g.arc(px+(i%3-1)*3,py-16-(i>2?4:0),4,0,TAU);g.fillStyle='#ffb3d9';g.fill();}}
  g.restore();
}
