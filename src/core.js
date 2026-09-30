'use strict';
/* Big Top Bedlam: core constants, math, color and painting helpers */
const W=1280,H=720,PI=Math.PI,TAU=PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const approach=(v,t,d)=>v<t?Math.min(v+d,t):Math.max(v-d,t);
const easeOutBack=x=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);};
const easeInOut=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
const easeOut=x=>1-Math.pow(1-x,3);
const smooth=x=>x*x*(3-2*x);
function hash(n){n=Math.sin(n*127.1+311.7)*43758.5453;return n-Math.floor(n);}
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function noise1(x){const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return lerp(hash(i),hash(i+1),u)*2-1;}

/* ---------- color ---------- */
const _cc=new Map();
function hx(c){let v=_cc.get(c);if(v)return v;let s=c.replace('#','');if(s.length===3)s=s.split('').map(q=>q+q).join('');const n=parseInt(s,16);v=[(n>>16)&255,(n>>8)&255,n&255];_cc.set(c,v);return v;}
function mixHex(a,b,t){const A=hx(a),B=hx(b);const r=Math.round(lerp(A[0],B[0],t)),g=Math.round(lerp(A[1],B[1],t)),bb=Math.round(lerp(A[2],B[2],t));return'#'+((1<<24)|(r<<16)|(g<<8)|bb).toString(16).slice(1);}
function rgba(c,a){const A=hx(c);return`rgba(${A[0]},${A[1]},${A[2]},${a})`;}
const lit=(c,t)=>mixHex(c,'#fff3dc',t), drk=(c,t)=>mixHex(c,'#120804',t);

/* ---------- palette ---------- */
const COL={
  ink:'#1a0d07',cream:'#f6e7c8',gold:'#e8b44a',goldD:'#9a6a1c',red:'#b3212b',redD:'#5e0c13',
  teal:'#1d6b73',pink:'#ff4fa0',night:'#0c0708',
};

/* ---------- canvases ---------- */
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c;}
const SS=1.5;
/* bake(): paint once into an offscreen sprite; origin (ox,oy) is the anchor (feet, hips...) */
function bake(w,h,ox,oy,fn,ss=SS){const c=mkCanvas(w*ss,h*ss),g=c.getContext('2d');g.scale(ss,ss);g.translate(ox,oy);g.lineJoin='round';g.lineCap='round';fn(g);return{c,w,h,ox,oy};}
function blit(ctx,s,x,y,flip=false,sx=1,sy=1,alpha=1){
  if(!s)return;
  if(!flip&&sx===1&&sy===1&&alpha===1){ctx.drawImage(s.c,x-s.ox,y-s.oy,s.w,s.h);return;}
  ctx.save();ctx.translate(x,y);ctx.scale(flip?-sx:sx,sy);if(alpha!==1)ctx.globalAlpha*=alpha;ctx.drawImage(s.c,-s.ox,-s.oy,s.w,s.h);ctx.restore();
}

/* ---------- paths ---------- */
/* Catmull-Rom spline through points (organic shapes) */
function crPath(g,pts,closed=true,moved=false){
  const n=pts.length;if(n<2)return;
  const P=i=>closed?pts[(i+n)%n]:pts[clamp(i,0,n-1)];
  if(!moved)g.moveTo(pts[0][0],pts[0][1]);
  const segs=closed?n:n-1;
  for(let i=0;i<segs;i++){const p0=P(i-1),p1=P(i),p2=P(i+1),p3=P(i+2);
    g.bezierCurveTo(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6,p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6,p2[0],p2[1]);}
  if(closed)g.closePath();
}
function shapePath(g,pts){g.beginPath();crPath(g,pts,true);}
/* tapered limb outline through joints with per-joint widths */
function limbPts(pts,ws){
  const n=pts.length,L=[],R=[];
  for(let i=0;i<n;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)];let tx=b[0]-a[0],ty=b[1]-a[1];const d=Math.hypot(tx,ty)||1;tx/=d;ty/=d;const nx=-ty,ny=tx,w=ws[i]/2;L.push([pts[i][0]+nx*w,pts[i][1]+ny*w]);R.push([pts[i][0]-nx*w,pts[i][1]-ny*w]);}
  const e=pts[n-1],e2=pts[n-2],s=pts[0],s2=pts[1];
  const ed=Math.hypot(e[0]-e2[0],e[1]-e2[1])||1,sd=Math.hypot(s2[0]-s[0],s2[1]-s[1])||1;
  const endCap=[e[0]+(e[0]-e2[0])/ed*ws[n-1]*.45,e[1]+(e[1]-e2[1])/ed*ws[n-1]*.45];
  const startCap=[s[0]-(s2[0]-s[0])/sd*ws[0]*.45,s[1]-(s2[1]-s[1])/sd*ws[0]*.45];
  return[startCap,...L,endCap,...R.reverse()];
}
function limbPath(g,pts,ws){g.beginPath();crPath(g,limbPts(pts,ws),true);}
function ellPath(g,x,y,rx,ry,rot=0){g.beginPath();g.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot,0,TAU);}

/* ---------- paint ---------- */
function vgrad(g,y0,y1,stops){const gr=g.createLinearGradient(0,y0,0,y1);stops.forEach(([t,c])=>gr.addColorStop(t,c));return gr;}
function lgrad(g,x0,y0,x1,y1,stops){const gr=g.createLinearGradient(x0,y0,x1,y1);stops.forEach(([t,c])=>gr.addColorStop(t,c));return gr;}
function rgrad(g,x,y,r0,r1,stops,fx,fy){const gr=g.createRadialGradient(fx??x,fy??y,r0,x,y,r1);stops.forEach(([t,c])=>gr.addColorStop(t,c));return gr;}
/* soft elliptical light/shadow blob */
function soft(g,x,y,rx,ry,color,alpha,rot=0){
  if(rx<=0||ry<=0)return;g.save();g.translate(x,y);g.rotate(rot);g.scale(1,ry/rx);
  const gr=g.createRadialGradient(0,0,0,0,0,rx);gr.addColorStop(0,rgba(color,alpha));gr.addColorStop(1,rgba(color,0));
  g.fillStyle=gr;g.fillRect(-rx,-rx,rx*2,rx*2);g.restore();
}
/* hair / fur strokes clipped by current clip */
function furStrokes(g,n,box,angFn,len,cols,seed,alpha,lw=1){
  const R=rng(seed);g.save();g.lineCap='round';
  for(let i=0;i<n;i++){const x=box[0]+R()*box[2],y=box[1]+R()*box[3],a=angFn(x,y)+(R()-.5)*.5,l=len*(.6+R()*.8);
    g.strokeStyle=cols[Math.floor(R()*cols.length)];g.globalAlpha=alpha*(.5+R()*.5);g.lineWidth=lw*(.6+R()*.7);
    g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a)*l*.5+Math.cos(a+1.4)*l*.12,y+Math.sin(a)*l*.5+Math.sin(a+1.4)*l*.12,x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
  g.restore();
}
/* paint a closed path with vertical gradient, rim light, occlusion and outline */
function paint(g,pathFn,o){
  pathFn();
  g.fillStyle=o.fill;g.fill();
  if(o.rim||o.shade||o.fn){g.save();pathFn();g.clip();
    if(o.fn)o.fn();
    if(o.shade){g.fillStyle=o.shade;g.fillRect(-2000,-2000,4000,4000);}
    if(o.rim){g.translate(o.rimDx||0,o.rimDy??2.2);pathFn();g.lineWidth=o.rimW||3;g.strokeStyle=o.rim;g.stroke();}
    g.restore();}
  if(o.line){pathFn();g.lineWidth=o.lw||1.4;g.strokeStyle=o.line;g.stroke();}
}
/* 2D joint chain: angle 0 = straight down, positive = rotated backward (-x) */
const dirOf=a=>[-Math.sin(a),Math.cos(a)];
function chain(start,segs){const pts=[start.slice()];let p=start;for(const[len,a]of segs){const d=dirOf(a);p=[p[0]+d[0]*len,p[1]+d[1]*len];pts.push(p);}return pts;}
/* keyframe interpolation over a cyclic phase */
function keyInterp(K,p){for(let i=0;i<K.length-1;i++){const a=K[i],b=K[i+1];if(p>=a[0]&&p<=b[0]){const t=smooth((p-a[0])/((b[0]-a[0])||1));return a.slice(1).map((v,j)=>lerp(v,b[j+1],t));}}return K[0].slice(1);}

/* ---------- type ---------- */
const F_DISPLAY='"Alfa Slab One", "Rockwell Extra Bold", Georgia, serif';
const F_UI='"Barlow Condensed", "Arial Narrow", "Segoe UI", sans-serif';
const F_SCRIPT='"Playfair Display", Georgia, serif';
/* extruded gold marquee lettering */
function goldText(ctx,s,x,y,size,o={}){
  ctx.save();ctx.font=`${size}px ${F_DISPLAY}`;ctx.textAlign=o.align||'center';ctx.textBaseline='middle';ctx.lineJoin='round';
  const depth=o.depth??Math.max(2,Math.round(size*.08));
  if(o.glow){ctx.shadowColor=o.glow;ctx.shadowBlur=size*.5;}
  for(let i=depth;i>0;i--){ctx.fillStyle=i>depth-2?'#150604':mixHex('#4e130b','#9b3a16',1-i/depth);ctx.fillText(s,x+i*.55,y+i);}
  ctx.shadowBlur=0;
  ctx.lineWidth=Math.max(2,size*.09);ctx.strokeStyle='#1a0705';ctx.strokeText(s,x,y);
  const top=o.top||'#fff7d2',mid=o.mid||'#f0bd45',low=o.low||'#b26d17',bot=o.bot||'#ffd978';
  ctx.fillStyle=vgrad(ctx,y-size*.45,y+size*.45,[[0,top],[.42,mid],[.5,low],[1,bot]]);ctx.fillText(s,x,y);
  ctx.lineWidth=Math.max(.8,size*.018);ctx.strokeStyle='rgba(255,248,214,.55)';ctx.strokeText(s,x,y-size*.015);
  ctx.restore();
}
function uiText(ctx,s,x,y,size,color,o={}){
  ctx.save();ctx.font=`${o.weight||600} ${size}px ${o.font||F_UI}`;ctx.textAlign=o.align||'center';ctx.textBaseline='middle';
  if(o.ls&&'letterSpacing' in ctx)ctx.letterSpacing=o.ls+'px';
  if(o.shadow){ctx.fillStyle=o.shadow;ctx.fillText(s,x+(o.sx??1.5),y+(o.sy??2));}
  if(o.stroke){ctx.lineJoin='round';ctx.lineWidth=o.sw||3;ctx.strokeStyle=o.stroke;ctx.strokeText(s,x,y);}
  ctx.fillStyle=color;ctx.fillText(s,x,y);ctx.restore();
}
function rrect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function starPath(g,x,y,r,rot=0,n=5,inner=.45){g.beginPath();for(let i=0;i<n*2;i++){const a=rot+i/(n*2)*TAU-PI/2,rr=i%2?r*inner:r;g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}g.closePath();}
