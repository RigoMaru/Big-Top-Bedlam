'use strict';
/* Big Top Bedlam: environments, fire, lighting and props */

/* ======================= FX SPRITES ======================= */
const FXS={};
function radialSprite(size,stops){const c=mkCanvas(size,size),g=c.getContext('2d');g.fillStyle=rgrad(g,size/2,size/2,0,size/2,stops);g.fillRect(0,0,size,size);return c;}
function tongueCanvas(seed){
  const R=rng(seed),w=56,h=112,c=mkCanvas(w,h),g=c.getContext('2d');
  const draw=(sc,cols)=>{const bw=w*.44*sc,x0=w/2,y0=h-8,sway=(R()-.5)*16*sc,tipX=x0+sway,tipY=y0-(h-16)*sc,dy=y0-tipY;
    g.beginPath();g.moveTo(x0-bw/2,y0);g.bezierCurveTo(x0-bw*.75,y0-dy*.45,tipX-bw*.22+(R()-.5)*6,y0-dy*.72,tipX,tipY);
    g.bezierCurveTo(tipX+bw*.28+(R()-.5)*6,y0-dy*.66,x0+bw*.78,y0-dy*.42,x0+bw/2,y0);g.quadraticCurveTo(x0,y0+bw*.35,x0-bw/2,y0);g.closePath();
    g.fillStyle=vgrad(g,tipY,y0+bw*.3,cols);g.fill();};
  draw(1,[[0,'rgba(190,30,8,0)'],[.22,'rgba(225,60,12,.7)'],[.65,'rgba(255,130,28,.95)'],[1,'rgba(255,190,70,1)']]);
  draw(.7,[[0,'rgba(255,140,30,0)'],[.3,'rgba(255,175,50,.9)'],[1,'rgba(255,235,160,1)']]);
  draw(.4,[[0,'rgba(255,240,190,0)'],[.35,'rgba(255,248,215,.95)'],[1,'rgba(255,255,245,1)']]);
  return c;
}
function buildFxSprites(){
  FXS.hot=radialSprite(64,[[0,'rgba(255,255,236,1)'],[.25,'rgba(255,232,150,.9)'],[.6,'rgba(255,150,40,.35)'],[1,'rgba(255,90,10,0)']]);
  FXS.mid=radialSprite(64,[[0,'rgba(255,205,105,.95)'],[.35,'rgba(255,128,30,.7)'],[.7,'rgba(220,60,10,.25)'],[1,'rgba(160,20,0,0)']]);
  FXS.cool=radialSprite(64,[[0,'rgba(255,115,40,.7)'],[.5,'rgba(190,40,10,.33)'],[1,'rgba(90,10,0,0)']]);
  FXS.smoke=radialSprite(64,[[0,'rgba(58,48,46,.55)'],[.6,'rgba(40,34,32,.22)'],[1,'rgba(30,25,24,0)']]);
  FXS.glow=radialSprite(128,[[0,'rgba(255,170,70,.6)'],[.4,'rgba(255,120,40,.22)'],[1,'rgba(255,80,20,0)']]);
  FXS.spark=radialSprite(16,[[0,'rgba(255,255,225,1)'],[.4,'rgba(255,200,90,.85)'],[1,'rgba(255,120,20,0)']]);
  FXS.dust=radialSprite(32,[[0,'rgba(245,225,185,.55)'],[1,'rgba(245,225,185,0)']]);
  FXS.puff=radialSprite(64,[[0,'rgba(250,240,222,.85)'],[.55,'rgba(235,222,200,.45)'],[1,'rgba(230,215,190,0)']]);
  FXS.bulb=radialSprite(64,[[0,'rgba(255,248,215,1)'],[.18,'rgba(255,222,140,.85)'],[.45,'rgba(255,180,80,.25)'],[1,'rgba(255,160,60,0)']]);
  FXS.pink=radialSprite(96,[[0,'rgba(255,130,200,.65)'],[.5,'rgba(255,80,160,.22)'],[1,'rgba(255,60,150,0)']]);
  FXS.white=radialSprite(96,[[0,'rgba(255,250,235,.8)'],[.5,'rgba(255,240,210,.25)'],[1,'rgba(255,240,210,0)']]);
  FXS.tongues=[];for(let i=0;i<8;i++)FXS.tongues.push(tongueCanvas(100+i*17));
}

/* ======================= FIRE PARTICLES ======================= */
let fireP=[];
function emitFlame(x,y,sz,vx=0,vy=-90){if(fireP.length>1100)return;fireP.push({k:0,x,y,vx:vx+(Math.random()-.5)*24,vy:vy*(.7+Math.random()*.6),life:.3+Math.random()*.4,age:0,s:sz*(.75+Math.random()*.5),seed:Math.random()*99});}
function emitSpark(x,y){if(fireP.length>1100)return;fireP.push({k:1,x,y,vx:(Math.random()-.5)*90,vy:-120-Math.random()*220,life:.6+Math.random()*.9,age:0,s:1.6+Math.random()*2.2,seed:Math.random()*99});}
function emitSmoke(x,y,sz=16){if(fireP.length>1100)return;fireP.push({k:2,x,y,vx:(Math.random()-.5)*20,vy:-30-Math.random()*40,life:1+Math.random()*.9,age:0,s:sz,seed:Math.random()*99});}
function updFire(dt){
  for(const p of fireP){p.age+=dt;const n=noise1(p.seed+p.age*3.3);
    if(p.k===0){p.vy-=220*dt;p.vx+=n*140*dt;}else if(p.k===1){p.vy+=60*dt;p.vx+=n*120*dt;}else{p.vy-=10*dt;p.vx+=n*30*dt;}
    p.x+=p.vx*dt;p.y+=p.vy*dt;}
  fireP=fireP.filter(p=>p.age<p.life);
}
function drawFireParticles(ctx){
  ctx.save();
  for(const p of fireP){if(p.k!==2)continue;const t=p.age/p.life,s=p.s*(1+t*1.8);ctx.globalAlpha=(1-t)*.5;ctx.drawImage(FXS.smoke,p.x-s,p.y-s,s*2,s*2);}
  ctx.globalCompositeOperation='lighter';
  for(const p of fireP){const t=p.age/p.life;
    if(p.k===0){const img=t<.28?FXS.hot:t<.62?FXS.mid:FXS.cool,s=p.s*(t<.2?.7+t*1.5:1.1-(t-.2)*.8);ctx.globalAlpha=Math.pow(1-t,1.1)*.9;ctx.drawImage(img,p.x-s,p.y-s*1.35,s*2,s*2.7);}
    else if(p.k===1){ctx.globalAlpha=(1-t)*(.6+.4*Math.sin(p.age*40+p.seed));const s=p.s*2.2;ctx.drawImage(FXS.spark,p.x-s,p.y-s,s*2,s*2);}}
  ctx.restore();
}
/* flickering painted flame tongue, additive */
function tongue(ctx,x,y,h,seed,lean=0,alpha=1){
  const f=noise1(seed*3.7+T*9),f2=noise1(seed*1.3+T*13);
  const hh=h*(.82+.28*f),ww=hh*.5*(.9+.15*f2),img=FXS.tongues[Math.floor(seed*7+T*14)%FXS.tongues.length];
  ctx.save();ctx.translate(x,y);ctx.rotate(lean+f2*.12);ctx.globalAlpha=alpha;ctx.drawImage(img,-ww/2,-hh,ww,hh);ctx.restore();
}

/* ======================= ENVIRONMENTS ======================= */
const THEMES={
  ruby:{a:'#a3242d',b:'#eed9b0',val:'#6a0f16',pole:'#b3262e',haze:'#ffb46a',banner:'#8e1520',light:'#ffd9a0'},
  royal:{a:'#1f4282',b:'#ead3a0',val:'#122650',pole:'#23478a',haze:'#ffc98a',banner:'#1a3470',light:'#ffe0b0'},
};
function catenary(g,x0,y0,x1,y1,sag){g.moveTo(x0,y0);g.quadraticCurveTo((x0+x1)/2,Math.max(y0,y1)+sag*2,x1,y1);}
function bulbString(g,x0,y0,x1,y1,sag,n,col='#ffe9a8'){
  g.strokeStyle='rgba(20,10,6,.85)';g.lineWidth=1.6;g.beginPath();catenary(g,x0,y0,x1,y1,sag);g.stroke();
  const mx=(x0+x1)/2,my=Math.max(y0,y1)+sag*2;
  for(let j=1;j<n;j++){const t=j/n,bx=(1-t)*(1-t)*x0+2*(1-t)*t*mx+t*t*x1,by=(1-t)*(1-t)*y0+2*(1-t)*t*my+t*t*y1+5;
    g.drawImage(FXS.bulb,bx-16,by-16,32,32);g.beginPath();g.arc(bx,by,3.2,0,TAU);g.fillStyle=col;g.fill();}
}
function tentPole(g,x,y0,y1,w,cA){
  g.fillStyle=lgrad(g,x-w/2,0,x+w/2,0,[[0,'#2a1410'],[.3,'#f2e2c0'],[.5,'#fff6e2'],[1,'#3a1a12']]);g.fillRect(x-w/2,y0,w,y1-y0);
  g.save();g.beginPath();g.rect(x-w/2,y0,w,y1-y0);g.clip();g.fillStyle=cA;
  for(let y=y0-w;y<y1;y+=w*1.6){g.beginPath();g.moveTo(x-w/2,y);g.lineTo(x+w/2,y-w*.7);g.lineTo(x+w/2,y-w*.7+w*.7);g.lineTo(x-w/2,y+w*.7);g.closePath();g.fill();}
  g.fillStyle=lgrad(g,x-w/2,0,x+w/2,0,[[0,'rgba(0,0,0,.55)'],[.35,'rgba(255,255,255,.12)'],[.55,'rgba(255,255,255,.2)'],[1,'rgba(0,0,0,.6)']]);g.fillRect(x-w/2,y0,w,y1-y0);g.restore();
  for(let y=y0+140;y<y1;y+=220){g.fillStyle=lgrad(g,x-w/2-3,0,x+w/2+3,0,[[0,'#6a4a12'],[.45,'#ffe18a'],[1,'#6a4a12']]);g.fillRect(x-w/2-3,y,w+6,9);}
}
function buildTent(th,seed){
  const TW=2560,R=rng(seed),raw=mkCanvas(TW,H),g=raw.getContext('2d');
  g.fillStyle='#120807';g.fillRect(0,0,TW,H);
  /* canvas stripes fanning toward two apexes */
  for(let s=0;s<2;s++){const ax=s*1280+640,ay=-1400;g.save();g.beginPath();g.rect(s*1280,0,1280,H);g.clip();
    for(let k=-12;k<32;k++){const bx0=s*1280+k*64-400,bx1=bx0+64,top=(bx)=>ax+(bx-ax)*.62;
      g.beginPath();g.moveTo(top(bx0),-10);g.lineTo(bx0,H);g.lineTo(bx1,H);g.lineTo(top(bx1),-10);g.closePath();
      g.fillStyle=k%2?th.a:th.b;g.fill();
      const cx=(bx0+bx1)/2;g.fillStyle=lgrad(g,bx0,0,bx1,0,[[0,'rgba(0,0,0,.28)'],[.45,'rgba(255,240,210,.1)'],[.6,'rgba(255,240,210,.14)'],[1,'rgba(0,0,0,.34)']]);g.fill();}
    for(const sy of[90,190,300]){g.strokeStyle='rgba(20,6,4,.22)';g.lineWidth=9;g.beginPath();for(let k=-2;k<22;k++){const x0=s*1280+k*64,x1=x0+64;g.moveTo(x0,sy);g.quadraticCurveTo(x0+32,sy+16,x1,sy);}g.stroke();
      g.strokeStyle='rgba(255,236,200,.1)';g.lineWidth=3;g.beginPath();for(let k=-2;k<22;k++){const x0=s*1280+k*64,x1=x0+64;g.moveTo(x0,sy-6);g.quadraticCurveTo(x0+32,sy+10,x1,sy-6);}g.stroke();}
    g.restore();}
  watercolorWash(g,TW,H,th.a,R);
  /* darkness above, warm arena light below */
  g.fillStyle=vgrad(g,0,H,[[0,'rgba(8,3,2,.86)'],[.25,'rgba(8,3,2,.45)'],[.5,'rgba(8,3,2,.2)'],[.62,'rgba(8,3,2,.35)'],[1,'rgba(8,3,2,.8)']]);g.fillRect(0,0,TW,H);
  for(let s=0;s<2;s++){g.save();g.globalCompositeOperation='lighter';g.drawImage(FXS.white,s*1280+140,40,1000,560);g.restore();}
  /* rigging ropes */
  g.strokeStyle='rgba(18,8,5,.75)';g.lineWidth=1.4;
  for(let i=0;i<26;i++){const x0=R()*TW,x1=x0+(R()-.5)*600;g.beginPath();g.moveTo(x0,-5);g.quadraticCurveTo((x0+x1)/2,120+R()*80,x1,200+R()*140);g.stroke();}
  /* trapeze platforms and bars */
  for(const px of[430,1720]){g.fillStyle='#24120c';g.fillRect(px-50,196,100,8);g.fillStyle=lgrad(g,px-50,0,px+50,0,[[0,'#6a4a12'],[.5,'#e9c46a'],[1,'#6a4a12']]);g.fillRect(px-50,192,100,4);
    g.strokeStyle='#24120c';g.lineWidth=2;for(let i=0;i<5;i++){g.beginPath();g.moveTo(px-48+i*24,192);g.lineTo(px-48+i*24,176);g.stroke();}g.beginPath();g.moveTo(px-50,176);g.lineTo(px+50,176);g.stroke();
    g.beginPath();g.moveTo(px-30,-5);g.lineTo(px-30,196);g.moveTo(px+30,-5);g.lineTo(px+30,196);g.stroke();
    g.beginPath();g.moveTo(px+150,-5);g.lineTo(px+150,150);g.moveTo(px+200,-5);g.lineTo(px+200,150);g.stroke();g.lineWidth=5;g.beginPath();g.moveTo(px+146,150);g.lineTo(px+204,150);g.stroke();}
  /* big banner */
  for(const bx of[640,1920]){
    g.save();g.translate(bx,236);
    g.fillStyle=vgrad(g,-34,40,[[0,lit(th.banner,.15)],[1,drk(th.banner,.35)]]);g.beginPath();g.moveTo(-230,-34);g.lineTo(230,-34);g.lineTo(230,26);g.quadraticCurveTo(0,52,-230,26);g.closePath();g.fill();
    g.lineWidth=5;g.strokeStyle=lgrad(g,-230,0,230,0,[[0,'#8a5a14'],[.5,'#ffe28a'],[1,'#8a5a14']]);g.stroke();
    for(let i=0;i<46;i++){const t=i/45,x=lerp(-228,228,t),y=26+Math.sin(t*PI)*22;g.strokeStyle=i%2?'#f2c75a':'#a0701e';g.lineWidth=2;g.beginPath();g.moveTo(x,y);g.lineTo(x,y+10);g.stroke();}
    goldText(g,'THE GRAND CARNIVAL',0,-4,36,{depth:3});
    g.restore();
    bulbString(g,bx-600,120,bx-240,150,30,9,th.light);bulbString(g,bx+240,150,bx+600,120,30,9,th.light);}
  bulbString(g,0,70,640,58,50,14,th.light);bulbString(g,640,58,1280,70,50,14,th.light);bulbString(g,1280,70,1920,58,50,14,th.light);bulbString(g,1920,58,2560,70,50,14,th.light);
  /* poles at the seams */
  for(const px of[0,1280,2560])tentPole(g,px,-10,H,38,th.pole);
  /* haze */
  g.fillStyle=vgrad(g,200,480,[[0,rgba(th.haze,0)],[1,rgba(th.haze,.14)]]);g.fillRect(0,200,TW,280);
  paperGrain(g,TW,H,R,.05);
  const out=mkCanvas(TW,H),o=out.getContext('2d');o.filter='blur(1.1px)';o.drawImage(raw,0,0);o.filter='none';
  return out;
}
function watercolorWash(g,w,h,col,R){g.save();for(let i=0;i<340;i++){g.globalAlpha=.035+R()*.04;g.fillStyle=R()<.5?drk(col,.5):lit(col,.35);g.beginPath();g.ellipse(R()*w,R()*h,30+R()*110,20+R()*70,R()*3,0,TAU);g.fill();}g.restore();}
function paperGrain(g,w,h,R,a){g.save();for(let i=0;i<w*h/220;i++){g.fillStyle=R()<.5?`rgba(255,240,210,${R()*a})`:`rgba(20,8,4,${R()*a*1.4})`;g.fillRect(R()*w,R()*h,1+R()*1.6,1+R()*1.6);}g.restore();}

/* crowd rows: seat planks and seated people (drawn live so they can cheer to the beat) */
let PEOPLE=[];
function buildPeople(){
  const R=rng(4242);PEOPLE=[];
  for(let i=0;i<40;i++){const sp=personSpec(R);PEOPLE.push([0,1,2].map(pose=>bake(64,120,32,104,g=>drawPersonG(g,sp,pose),1.35)));}
}
function buildRows(G,seed,th){
  const R=rng(seed),TILE=2048,rows=[],ys=[G-212,G-176,G-138,G-98,G-56],sc=[.54,.62,.71,.8,.9],par=[.26,.29,.32,.35,.38];
  for(let r=0;r<5;r++){const people=[];let x=8;
    while(x<TILE-12){people.push({x,s:Math.floor(R()*PEOPLE.length),ph:R(),ex:R()<.7,clap:R()<.25});x+=(30+R()*12)*sc[r];}
    const plank=mkCanvas(512,40),q=plank.getContext('2d');
    q.fillStyle=vgrad(q,0,40,[[0,'#6a3e22'],[.18,'#8a5630'],[.2,'#3a2012'],[1,'#1c0e08']]);q.fillRect(0,0,512,40);
    q.fillStyle=rgba(th.a,.55);q.fillRect(0,8,512,10);q.fillStyle='rgba(255,220,160,.2)';q.fillRect(0,0,512,2);
    for(let x=0;x<512;x+=64){q.fillStyle='rgba(0,0,0,.35)';q.fillRect(x,8,2,32);}
    rows.push({y:ys[r],scale:sc[r],par:par[r],people,plank});}
  return rows;
}
function makeCurb(th){
  const c=mkCanvas(512,60),g=c.getContext('2d');
  g.fillStyle=vgrad(g,0,60,[[0,lit(th.a,.25)],[.25,th.a],[.75,drk(th.a,.45)],[1,drk(th.a,.7)]]);g.fillRect(0,0,512,60);
  g.fillStyle=vgrad(g,0,14,[[0,'rgba(255,255,255,.35)'],[1,'rgba(255,255,255,0)']]);g.fillRect(0,0,512,14);
  g.fillStyle=lgrad(g,0,10,0,17,[[0,'#ffe79a'],[1,'#8a5a14']]);g.fillRect(0,12,512,5);g.fillRect(0,50,512,4);
  for(let x=32;x<512;x+=64){starPath(g,x,33,9,0);g.fillStyle=lgrad(g,x-9,24,x+9,42,[[0,'#fff3b0'],[1,'#b07a1e']]);g.fill();g.lineWidth=1;g.strokeStyle='#3a1a04';g.stroke();
    for(const sx of[x-24,x+24]){g.beginPath();g.arc(sx,33,3,0,TAU);g.fillStyle=rgrad(g,sx-1,32,0,3.5,[[0,'#fff6c0'],[1,'#8a5a14']]);g.fill();}}
  g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,56,512,4);
  return c;
}
function makeFloor(h,tacks,seed){
  const c=mkCanvas(1024,h),g=c.getContext('2d'),R=rng(seed);
  g.fillStyle=vgrad(g,0,h,[[0,'#caa06a'],[.4,'#b88a55'],[1,'#7a5430']]);g.fillRect(0,0,1024,h);
  const id=g.getImageData(0,0,1024,h),d=id.data;for(let i=0;i<d.length;i+=4){const n=(R()-.5)*38;d[i]+=n;d[i+1]+=n*.85;d[i+2]+=n*.6;}g.putImageData(id,0,0);
  g.save();for(let i=0;i<140;i++){g.globalAlpha=.06+R()*.06;g.fillStyle=R()<.5?'#5a3818':'#f2d6a0';g.beginPath();g.ellipse(R()*1024,R()*h,20+R()*60,4+R()*10,0,0,TAU);g.fill();}g.restore();
  g.strokeStyle='rgba(60,34,14,.25)';g.lineWidth=2;for(let i=0;i<22;i++){const x=R()*1024,y=12+R()*(h-20);g.beginPath();g.ellipse(x,y,6,3,0,PI,TAU);g.stroke();}
  g.fillStyle=vgrad(g,0,10,[[0,'rgba(20,8,2,.55)'],[1,'rgba(20,8,2,0)']]);g.fillRect(0,0,1024,10);
  if(tacks){for(let row=0;row<3;row++)for(let x=6+row*9;x<1024;x+=22){const y=16+row*15+R()*4,s=.85+R()*.3;
    g.fillStyle='rgba(20,8,2,.35)';g.beginPath();g.ellipse(x+2,y+2,6*s,2*s,0,0,TAU);g.fill();
    g.beginPath();g.moveTo(x-5*s,y);g.lineTo(x+5*s,y);g.lineTo(x+R()*2-1,y-13*s);g.closePath();g.fillStyle=lgrad(g,x-5,0,x+5,0,[[0,'#6c767c'],[.45,'#eef4f6'],[1,'#58626a']]);g.fill();g.lineWidth=.8;g.strokeStyle='#1a1c20';g.stroke();}}
  return c;
}
function makeFgPole(th){const raw=mkCanvas(90,H+40),g=raw.getContext('2d');tentPole(g,45,0,H+40,52,drk(th.pole,.3));g.fillStyle='rgba(10,4,2,.55)';g.fillRect(0,0,90,H+40);const out=mkCanvas(90,H+40),o=out.getContext('2d');o.filter='blur(5px)';o.drawImage(raw,0,0);o.filter='none';return out;}
function makeFgHeads(){
  const w=1600,h=120,raw=mkCanvas(w,h),g=raw.getContext('2d'),R=rng(77);
  for(let x=20;x<w;x+=60+R()*50){const s=.9+R()*.5,y=h-6;g.fillStyle='#0d0605';g.beginPath();g.ellipse(x,y,34*s,30*s,0,PI,TAU);g.fill();g.beginPath();g.ellipse(x,y-38*s,17*s,20*s,0,0,TAU);g.fill();
    const hat=R();if(hat<.35){g.fillRect(x-24*s,y-56*s,48*s,5*s);g.beginPath();g.ellipse(x,y-58*s,16*s,14*s,0,PI,TAU);g.fill();}else if(hat<.55){g.fillRect(x-14*s,y-80*s,28*s,26*s);g.fillRect(x-22*s,y-56*s,44*s,5*s);}}
  const out=mkCanvas(w,h),o=out.getContext('2d');o.filter='blur(6px)';o.drawImage(raw,0,0);o.filter='none';return out;
}
/* high-wire environment */
function buildWireSky(){
  const TW=2560,R=rng(55),raw=mkCanvas(TW,H),g=raw.getContext('2d');
  g.fillStyle='#0b1418';g.fillRect(0,0,TW,H);
  for(let s=0;s<2;s++){const ax=s*1280+640,ay=-380;g.save();g.beginPath();g.rect(s*1280,0,1280,H);g.clip();
    for(let k=-16;k<16;k++){g.beginPath();g.moveTo(ax,ay);g.lineTo(ax+k*170,H+300);g.lineTo(ax+(k+1)*170,H+300);g.closePath();g.fillStyle=k%2?'#1f4d58':'#d3c092';g.fill();
      const m1=ax+k*170,m2=ax+(k+1)*170;g.fillStyle=lgrad(g,m1,H,m2,H,[[0,'rgba(0,0,0,.35)'],[.5,'rgba(255,255,255,.06)'],[1,'rgba(0,0,0,.35)']]);g.fill();}
    g.restore();}
  watercolorWash(g,TW,H,'#1f4d58',R);
  g.fillStyle=vgrad(g,0,H,[[0,'rgba(4,8,10,.55)'],[.35,'rgba(4,8,10,.3)'],[.62,'rgba(4,8,10,.6)'],[.78,'rgba(4,8,10,.85)'],[1,'rgba(4,6,8,.95)']]);g.fillRect(0,0,TW,H);
  /* rigging, pulleys, spotlight rigs */
  g.strokeStyle='rgba(6,10,12,.9)';g.lineWidth=1.5;for(let i=0;i<40;i++){const x=R()*TW;g.beginPath();g.moveTo(x,-5);g.quadraticCurveTo(x+(R()-.5)*300,250,x+(R()-.5)*500,H*.7);g.stroke();}
  for(let i=0;i<6;i++){const lx=200+i*430;g.strokeStyle='#070b0d';g.lineWidth=3;g.beginPath();g.moveTo(lx,-5);g.lineTo(lx,120);g.stroke();
    g.fillStyle=lgrad(g,lx-18,0,lx+18,0,[[0,'#101214'],[.5,'#4a4e54'],[1,'#101214']]);g.beginPath();g.moveTo(lx-16,120);g.lineTo(lx+16,120);g.lineTo(lx+24,150);g.lineTo(lx-24,150);g.closePath();g.fill();
    g.save();g.globalCompositeOperation='lighter';g.drawImage(FXS.bulb,lx-40,122,80,60);g.restore();}
  /* the ring far below */
  for(let s=0;s<2;s++){const cx=s*1280+640;g.save();g.globalCompositeOperation='lighter';g.drawImage(FXS.glow,cx-520,H-150,1040,320);g.restore();
    g.fillStyle='rgba(120,70,36,.6)';g.beginPath();g.ellipse(cx,H+20,420,76,0,0,TAU);g.fill();g.strokeStyle='rgba(210,60,50,.7)';g.lineWidth=6;g.stroke();
    for(let i=0;i<420;i++){const a=PI+R()*PI,rr=1.12+R()*.45;g.fillStyle=`rgba(${200+R()*55},${160+R()*60},${120+R()*60},${.18+R()*.25})`;g.beginPath();g.arc(cx+Math.cos(a)*460*rr,H+20+Math.sin(a)*100*rr,1.5+R()*2,0,TAU);g.fill();}}
  for(const px of[0,1280,2560])tentPole(g,px,-10,H,30,'#2a5e68');
  paperGrain(g,TW,H,R,.05);
  const out=mkCanvas(TW,H),o=out.getContext('2d');o.filter='blur(1.4px)';o.drawImage(raw,0,0);o.filter='none';return out;
}
function makeRopeTile(){const c=mkCanvas(24,14),g=c.getContext('2d');g.fillStyle=vgrad(g,0,14,[[0,'#f0d6a0'],[.5,'#c79a58'],[1,'#6a4822']]);g.fillRect(0,0,24,14);g.strokeStyle='rgba(70,40,15,.6)';g.lineWidth=2;for(let x=-14;x<30;x+=8){g.beginPath();g.moveTo(x,0);g.lineTo(x+10,14);g.stroke();}g.strokeStyle='rgba(255,245,215,.35)';g.lineWidth=1;for(let x=-12;x<30;x+=8){g.beginPath();g.moveTo(x,0);g.lineTo(x+6,8);g.stroke();}return c;}

/* ======================= PROP SPRITES ======================= */
const PROPS={};
function buildProps(){
  PROPS.brazier=bake(110,100,55,90,g=>{
    for(const[x0,x1]of[[-26,-34],[26,34],[0,0]]){g.strokeStyle='#1e120c';g.lineWidth=5;g.beginPath();g.moveTo(x0*.7,-34);g.lineTo(x1,0);g.stroke();g.strokeStyle='rgba(255,220,160,.25)';g.lineWidth=1.4;g.stroke();}
    paint(g,()=>{g.beginPath();g.moveTo(-40,-66);g.quadraticCurveTo(-36,-32,-16,-28);g.lineTo(16,-28);g.quadraticCurveTo(36,-32,40,-66);g.closePath();},
      {fill:lgrad(g,-40,0,40,0,[[0,'#3a1a0c'],[.3,'#b8742c'],[.5,'#f0c070'],[.7,'#a0621e'],[1,'#2a1208']]),line:'#150a04',lw:1.6,fn:()=>{for(let i=0;i<30;i++){g.beginPath();g.arc(-34+i*2.4,-50+Math.sin(i)*8,1.2,0,TAU);g.fillStyle='rgba(255,230,170,.25)';g.fill();}}});
    g.fillStyle=lgrad(g,-44,0,44,0,[[0,'#5a3a10'],[.5,'#ffe08a'],[1,'#5a3a10']]);rrect(g,-44,-72,88,10,5);g.fill();g.lineWidth=1.2;g.strokeStyle='#150a04';g.stroke();
    g.fillStyle=rgrad(g,0,-68,2,40,[[0,'#fff0b0'],[.3,'#ff9a30'],[1,'#7a1a06']]);g.beginPath();g.ellipse(0,-68,38,5,0,0,TAU);g.fill();
    starPath(g,0,-48,10,0);g.fillStyle=lgrad(g,-10,-58,10,-38,[[0,'#fff3b0'],[1,'#9a6a14']]);g.fill();g.lineWidth=1;g.strokeStyle='#3a1a04';g.stroke();
  });
  PROPS.moneybag=bake(56,64,28,40,g=>{
    paint(g,()=>shapePath(g,[[-7,-26],[7,-26],[4,-18],[16,-10],[20,4],[14,17],[0,21],[-14,17],[-20,4],[-16,-10],[-4,-18]]),{fill:rgrad(g,-5,-4,2,24,[[0,'#ffc6e2'],[.5,'#ff5fae'],[1,'#b31e6c']]),line:'#4a0a28',lw:1.4,fn:()=>{g.strokeStyle='rgba(120,20,60,.25)';g.lineWidth=.8;for(let i=-20;i<22;i+=4){g.beginPath();g.moveTo(i,-20);g.lineTo(i+6,22);g.stroke();}}});
    g.strokeStyle='#e8b44a';g.lineWidth=2.4;g.beginPath();g.ellipse(0,-18,7,2.2,0,0,TAU);g.stroke();
    g.font=`20px ${F_DISPLAY}`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff3fa';g.fillText('$',0,4);
  });
  PROPS.sandbag=bake(76,86,38,50,g=>{
    paint(g,()=>shapePath(g,[[-8,-34],[8,-34],[6,-26],[24,-14],[30,8],[22,28],[0,33],[-22,28],[-30,8],[-24,-14],[-6,-26]]),{fill:rgrad(g,-8,-6,3,36,[[0,'#e2c898'],[.6,'#b89262'],[1,'#6e5030']]),line:'#2a1a0c',lw:1.6,fn:()=>{
      g.strokeStyle='rgba(60,36,14,.28)';g.lineWidth=.8;for(let i=-34;i<34;i+=3){g.beginPath();g.moveTo(i,-30);g.lineTo(i,34);g.stroke();g.beginPath();g.moveTo(-34,i);g.lineTo(34,i);g.stroke();}
      soft(g,-10,-8,14,18,'#fff4d8',.3);}});
    g.strokeStyle='#5a3a1a';g.lineWidth=3;g.beginPath();g.moveTo(-8,-28);g.quadraticCurveTo(0,-24,8,-28);g.stroke();
    g.font=`15px ${F_DISPLAY}`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='rgba(40,20,10,.8)';g.fillText('1 TON',0,8);
    g.strokeStyle='rgba(40,20,10,.6)';g.setLineDash([3,3]);g.lineWidth=1;g.beginPath();g.ellipse(0,8,22,12,0,0,TAU);g.stroke();g.setLineDash([]);
  });
  PROPS.balloon=bake(60,110,30,40,g=>{
    g.strokeStyle='rgba(60,20,40,.7)';g.lineWidth=1;g.beginPath();g.moveTo(0,28);g.bezierCurveTo(10,44,-8,56,2,70);g.stroke();
    paint(g,()=>shapePath(g,[[0,-30],[16,-24],[23,-8],[20,10],[9,24],[0,28],[-9,24],[-20,10],[-23,-8],[-16,-24]]),{fill:rgrad(g,-7,-12,2,32,[[0,'#ffe0f0'],[.25,'#ff7ac0'],[.75,'#e0287e'],[1,'#8a0e48']]),line:'#4a0a28',lw:1.2});
    g.beginPath();g.ellipse(-9,-13,4.5,9,.4,0,TAU);g.fillStyle='rgba(255,255,255,.75)';g.fill();
    g.beginPath();g.moveTo(-4,29);g.lineTo(4,29);g.lineTo(0,24);g.closePath();g.fillStyle='#b01e62';g.fill();
  });
  PROPS.cannon=bake(120,80,20,40,g=>{
    paint(g,()=>{g.beginPath();g.moveTo(0,-20);g.lineTo(110,-26);g.lineTo(110,26);g.lineTo(0,20);g.closePath();},{fill:vgrad(g,-26,26,[[0,'#6a6e76'],[.35,'#2a2c32'],[1,'#0c0d10']]),line:'#050506',lw:1.5});
    for(const x of[18,50,86]){g.fillStyle=vgrad(g,-26,26,[[0,'#ffe79a'],[.5,'#b07a1e'],[1,'#4a300a']]);g.fillRect(x,-24,8,48);}
    paint(g,()=>ellPath(g,0,0,9,23),{fill:'#1a1b1f',line:'#050506',lw:1.5});paint(g,()=>ellPath(g,0,0,5.5,16),{fill:'#050506'});
  });
  PROPS.pedestal=bake(280,190,140,170,g=>{
    paint(g,()=>{g.beginPath();g.moveTo(-120,0);g.lineTo(-120,-150);g.lineTo(120,-150);g.lineTo(120,0);g.closePath();},{fill:lgrad(g,-120,0,120,0,[[0,'#4a0a10'],[.3,'#c02630'],[.5,'#e2505a'],[.75,'#a01a24'],[1,'#3a060a']]),line:'#1a0204',lw:2});
    for(let i=0;i<6;i++){const x=-100+i*40;g.fillStyle=lgrad(g,x-7,0,x+7,0,[[0,'#6a4a12'],[.5,'#ffe08a'],[1,'#6a4a12']]);g.fillRect(x-6,-150,12,150);}
    g.fillStyle=lgrad(g,-120,0,120,0,[[0,'#6a4a12'],[.5,'#ffe08a'],[1,'#6a4a12']]);g.fillRect(-124,-24,248,10);
    starPath(g,0,-86,26,0);g.fillStyle=rgrad(g,-6,-94,2,28,[[0,'#fffbe0'],[1,'#d99a22']]);g.fill();g.lineWidth=2;g.strokeStyle='#3a1a04';g.stroke();
    paint(g,()=>ellPath(g,0,-150,120,17),{fill:rgrad(g,-20,-156,4,120,[[0,'#fff0b0'],[.5,'#e8b44a'],[1,'#8a5a14']]),line:'#3a1a04',lw:2});
  });
}

/* ======================= DRAW HELPERS ======================= */
function drawHoopHalf(ctx,e,front){
  const x=e.x,cy=e.cy,rx=e.rx,ry=e.ry,a0=front?PI/2:-PI/2,a1=front?PI*1.5:PI/2;
  ctx.save();ctx.lineCap='butt';
  ctx.beginPath();ctx.ellipse(x,cy,rx,ry,0,a0,a1);
  ctx.strokeStyle='#0e0808';ctx.lineWidth=15;ctx.stroke();
  ctx.strokeStyle=front?lgrad(ctx,x-rx,0,x+rx,0,[[0,'#3a3a40'],[.35,'#e8e8f0'],[.6,'#8a8a94'],[1,'#26262c']]):'#3a2a24';ctx.lineWidth=10;ctx.stroke();
  ctx.setLineDash([7,9]);ctx.lineDashOffset=0;ctx.strokeStyle=front?'#2a120a':'#1a0a06';ctx.lineWidth=12;ctx.stroke();ctx.setLineDash([]);
  if(front){ctx.globalCompositeOperation='lighter';ctx.setLineDash([2,14]);ctx.lineDashOffset=-T*20;ctx.strokeStyle=`rgba(255,${150+Math.floor(noise1(T*6)*50)},40,.9)`;ctx.lineWidth=6;ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();
}
function drawHoopFire(ctx,e){
  const x=e.x,cy=e.cy,rx=e.rx,ry=e.ry;
  ctx.save();ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=.55+.15*noise1(T*7+e.seed);ctx.drawImage(FXS.glow,x-ry*1.3,cy-ry*1.35,ry*2.6,ry*2.7);
  ctx.globalAlpha=.5+.2*noise1(T*9+e.seed);ctx.beginPath();ctx.ellipse(x,cy,rx,ry,0,0,TAU);ctx.strokeStyle="rgba(255,120,30,.55)";ctx.lineWidth=26;ctx.stroke();ctx.strokeStyle="rgba(255,210,120,.6)";ctx.lineWidth=9;ctx.stroke();
  const N=44;
  for(let i=0;i<N;i++){const a=i/N*TAU,px=x+Math.cos(a)*(rx+2),py=cy+Math.sin(a)*(ry+2),up=Math.sin(a)<0?1:.72;
    tongue(ctx,px,py+6,(48+34*hash(i+e.seed))*up,e.seed+i*.37,Math.cos(a)*.3,.95);}
  ctx.restore();
}
function drawBrazierFire(ctx,x,G,seed){
  ctx.save();ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=.65+.2*noise1(T*6+seed);ctx.drawImage(FXS.glow,x-140,G-240,280,260);
  for(let i=0;i<9;i++){const ox=(i-4)*8;tongue(ctx,x+ox,G-68,74+44*(1-Math.abs(i-4)/4)+16*hash(i+seed),seed+i*.61,ox*.01,.95);}
  ctx.restore();
}
function drawFloorGlow(ctx,x,y,w,a){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a*(.85+.15*noise1(T*5+x*.01));ctx.drawImage(FXS.glow,x-w,y-w*.18,w*2,w*.36);ctx.restore();}
