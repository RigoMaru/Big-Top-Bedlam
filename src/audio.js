'use strict';
/* Big Top Bedlam: retro soundtrack engine.
   Two mixes of one original tune, synthesized live:
   'retro' = pure chiptune instrumental (pulse leads, arpeggios, triangle bass, noise drums)
   'edm'   = the same chiptune over house drums, sidechained sub bass, stabs, risers and drops */
const A={C:null,out:null,mus:null,chip:null,pump:null,lp:null,sfx:null,rev:null,dly:null,dlyT:null,noise:null,muted:false};
function audioInit(){
  if(A.C){if(A.C.state==='suspended')A.C.resume();return;}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const C=new AC();A.C=C;
  const comp=C.createDynamicsCompressor();comp.threshold.value=-12;comp.knee.value=8;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.16;
  A.out=C.createGain();A.out.gain.value=A.muted?0:.9;comp.connect(A.out);A.out.connect(C.destination);
  A.lp=C.createBiquadFilter();A.lp.type='lowpass';A.lp.frequency.value=18000;A.lp.connect(comp);
  A.mus=C.createGain();A.mus.gain.value=.6;A.mus.connect(A.lp);
  A.pump=C.createGain();A.pump.gain.value=1;A.pump.connect(A.mus);
  const clp=C.createBiquadFilter();clp.type='lowpass';clp.frequency.value=9500;clp.connect(A.mus);
  A.chip=C.createGain();A.chip.gain.value=1;A.chip.connect(clp);
  const conv=C.createConvolver(),len=Math.floor(C.sampleRate*1.4),ir=C.createBuffer(2,len,C.sampleRate);
  for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);}conv.buffer=ir;
  A.rev=C.createGain();A.rev.gain.value=.16;A.rev.connect(conv);conv.connect(A.mus);
  A.dly=C.createGain();A.dly.gain.value=.4;A.dlyT=C.createDelay(1);A.dlyT.delayTime.value=.33;const fb=C.createGain();fb.gain.value=.34;const dlp=C.createBiquadFilter();dlp.type='lowpass';dlp.frequency.value=3600;
  A.dly.connect(A.dlyT);A.dlyT.connect(dlp);dlp.connect(fb);fb.connect(A.dlyT);dlp.connect(A.mus);
  A.sfx=C.createGain();A.sfx.gain.value=.55;A.sfx.connect(comp);
  const nb=C.createBuffer(1,C.sampleRate*2,C.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;A.noise=nb;
}
function setMute(m){A.muted=m;if(A.out)A.out.gain.setTargetAtTime(m?0:.9,A.C.currentTime,.02);}
const mtof=m=>440*Math.pow(2,(m-69)/12);
const _waves={};
/* NES-style pulse wave with a given duty cycle */
function pulseWave(d){if(_waves[d])return _waves[d];const n=48,re=new Float32Array(n),im=new Float32Array(n);for(let k=1;k<n;k++)re[k]=(2/(k*PI))*Math.sin(k*PI*d);return _waves[d]=A.C.createPeriodicWave(re,im);}
function chipOsc(t,f,duty,dest){const o=A.C.createOscillator();if(duty==='tri')o.type='triangle';else o.setPeriodicWave(pulseWave(duty));o.frequency.setValueAtTime(f,t);o.connect(dest);return o;}
function nsrc(t,dur){const s=A.C.createBufferSource();s.buffer=A.noise;s.start(t,Math.random()*1.5,dur+.05);return s;}

/* ---- chip instruments ---- */
function cLead(t,m,dur,v,duty=.25,echo=true){
  const C=A.C,g=C.createGain(),f=mtof(m),o=chipOsc(t,f,duty,g);
  o.frequency.setValueAtTime(f*1.03,t);o.frequency.exponentialRampToValueAtTime(f,t+.025);
  if(dur>.14){const lfo=C.createOscillator(),lg=C.createGain();lfo.frequency.value=6.2;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(0,t+.12);lg.gain.linearRampToValueAtTime(f*.018,t+.22);lfo.connect(lg);lg.connect(o.frequency);lfo.start(t);lfo.stop(t+dur+.1);}
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.setTargetAtTime(v*.72,t+.02,.09);g.gain.setTargetAtTime(0,t+dur,.02);
  g.connect(A.chip);if(echo)g.connect(A.dly);o.start(t);o.stop(t+dur+.12);
}
function cArp(t,notes,dur,v,duty=.125){
  const C=A.C,g=C.createGain(),o=chipOsc(t,mtof(notes[0]),duty,g),step=1/60;
  for(let i=0,tt=t;tt<t+dur;i++,tt+=step)o.frequency.setValueAtTime(mtof(notes[i%notes.length]),tt);
  g.gain.setValueAtTime(v,t);g.gain.setTargetAtTime(v*.5,t+.02,.05);g.gain.setTargetAtTime(0,t+dur,.012);g.connect(A.chip);o.start(t);o.stop(t+dur+.06);
}
function cBass(t,m,dur,v=.3){const C=A.C,g=C.createGain(),o=chipOsc(t,mtof(m),'tri',g);g.gain.setValueAtTime(v,t);g.gain.setValueAtTime(v,t+dur*.9);g.gain.linearRampToValueAtTime(0,t+dur);g.connect(A.chip);o.start(t);o.stop(t+dur+.02);}
function cKick(t,v=.5){const C=A.C,g=C.createGain(),o=chipOsc(t,190,'tri',g);o.frequency.exponentialRampToValueAtTime(40,t+.07);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);g.connect(A.chip);o.start(t);o.stop(t+.14);}
function cSnare(t,v=.22){const C=A.C,s=nsrc(t,.12),f=C.createBiquadFilter();f.type='bandpass';f.frequency.value=2600;f.Q.value=.6;const g=C.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.11);s.connect(f);f.connect(g);g.connect(A.chip);}
function cHat(t,v=.06){const C=A.C,s=nsrc(t,.03),f=C.createBiquadFilter();f.type='highpass';f.frequency.value=9000;const g=C.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.025);s.connect(f);f.connect(g);g.connect(A.chip);}
/* ---- EDM layer ---- */
function dKick(t,v=.95){const C=A.C,o=C.createOscillator(),g=C.createGain();o.frequency.setValueAtTime(160,t);o.frequency.exponentialRampToValueAtTime(45,t+.1);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.36);o.connect(g);g.connect(A.mus);o.start(t);o.stop(t+.38);
  A.pump.gain.setValueAtTime(.15,t);A.pump.gain.linearRampToValueAtTime(1,t+.2);}
function dClap(t,v=.32){const C=A.C;for(let i=0;i<4;i++){const tt=t+i*.011,s=nsrc(tt,i===3?.2:.02),f=C.createBiquadFilter();f.type='bandpass';f.frequency.value=1500;f.Q.value=.8;const g=C.createGain();g.gain.setValueAtTime(v*(i===3?.9:.6),tt);g.gain.exponentialRampToValueAtTime(.001,tt+(i===3?.18:.02));s.connect(f);f.connect(g);g.connect(A.mus);if(i===3)g.connect(A.rev);}}
function dOpenHat(t,v=.06){const C=A.C,s=nsrc(t,.25),f=C.createBiquadFilter();f.type='highpass';f.frequency.value=6500;const g=C.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);s.connect(f);f.connect(g);g.connect(A.mus);}
function dSub(t,m,dur,v=.34){const C=A.C,g=C.createGain(),o=C.createOscillator();o.type='sine';o.frequency.setValueAtTime(mtof(m),t);const o2=chipOsc(t,mtof(m+12),.5,g);
  const g2=C.createGain();o.connect(g2);g2.gain.value=1;g2.connect(g);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.setTargetAtTime(v*.55,t+.01,.08);g.gain.setTargetAtTime(0,t+dur,.02);
  g.connect(A.pump);o.start(t);o2.start(t);o.stop(t+dur+.15);o2.stop(t+dur+.15);}
function dStab(t,notes,dur,v=.035,cut=4000){const C=A.C,g=C.createGain(),f=C.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(cut,t);f.frequency.setTargetAtTime(cut*.3,t+.01,.07);f.connect(g);g.connect(A.pump);g.connect(A.rev);
  notes.forEach(m=>{for(const d of[-.012,0,.012]){const o=chipOsc(t,mtof(m)*(1+d),.5,f);o.start(t);o.stop(t+dur+.2);}});
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.setTargetAtTime(v*.45,t+.01,.05);g.gain.setTargetAtTime(0,t+dur,.03);}
function dCrash(t,v=.15){const C=A.C,s=nsrc(t,1.5),f=C.createBiquadFilter();f.type='highpass';f.frequency.value=4200;const g=C.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+1.3);s.connect(f);f.connect(g);g.connect(A.mus);g.connect(A.rev);}
function fxRiser(t,dur){const C=A.C,s=nsrc(t,dur),f=C.createBiquadFilter();f.type='bandpass';f.Q.value=3;f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(7000,t+dur);const g=C.createGain();g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.18,t+dur);g.gain.setValueAtTime(0,t+dur+.01);s.connect(f);f.connect(g);g.connect(A.mus);
  const o=chipOsc(t,110,.25,C.createGain());const og=C.createGain();o.disconnect();o.connect(og);o.frequency.exponentialRampToValueAtTime(1760,t+dur);og.gain.setValueAtTime(.001,t);og.gain.exponentialRampToValueAtTime(.05,t+dur);og.gain.setValueAtTime(0,t+dur+.01);og.connect(A.chip);o.start(t);o.stop(t+dur+.05);}
function fxImpact(t){const C=A.C,o=C.createOscillator(),g=C.createGain();o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(28,t+.9);g.gain.setValueAtTime(.8,t);g.gain.exponentialRampToValueAtTime(.001,t+1.1);o.connect(g);g.connect(A.mus);o.start(t);o.stop(t+1.2);dCrash(t,.2);}

/* ---- the tune ----
   Section A (128 steps): the circus theme. Section B (128 steps): a heroic minor-key run.
   One step = a swung 16th note. */
const MEL_A=[
 [[76,1],[79,1],[84,2],[83,1],[84,1],[81,1],[79,1]],[[76,2],[0,1],[76,1],[75,1],[76,1],[79,2]],
 [[81,1],[79,1],[76,1],[73,1],[74,1],[76,1],[79,2]],[[81,3],[0,1],[81,1],[82,1],[81,1],[79,1]],
 [[78,1],[81,1],[86,2],[84,1],[81,1],[78,1],[74,1]],[[79,1],[77,1],[74,1],[71,1],[74,1],[77,1],[81,1],[79,1]],
 [[76,2],[79,1],[84,3],[0,2]],[[83,1],[81,1],[79,1],[77,1],[74,1],[71,1],[67,2]],
 [[72,1],[76,1],[79,1],[84,1],[88,2],[86,1],[84,1]],[[82,2],[79,1],[76,1],[72,2],[0,2]],
 [[81,1],[84,1],[89,2],[88,1],[86,1],[84,1],[81,1]],[[80,2],[77,1],[72,1],[80,2],[79,2]],
 [[79,1],[76,1],[72,1],[76,1],[79,1],[84,1],[88,2]],[[85,1],[86,1],[88,1],[85,1],[81,2],[79,2]],
 [[78,1],[81,1],[86,1],[84,1],[83,1],[79,1],[77,1],[74,1]],[[84,2],[79,1],[76,1],[72,2],[0,2]],
];
const MEL_B=[
 [[76,2],[81,2],[79,1],[81,1],[84,2],[83,2],[81,2],[79,2],[76,2]],
 [[77,2],[81,2],[84,4],[86,2],[84,2],[81,2],[77,2]],
 [[79,2],[84,2],[88,4],[86,1],[84,1],[83,2],[84,4]],
 [[83,2],[79,2],[74,2],[79,2],[83,2],[86,2],[83,4]],
 [[81,1],[83,1],[84,2],[81,2],[76,2],[81,1],[83,1],[84,2],[88,4]],
 [[89,4],[88,2],[86,2],[84,2],[81,2],[77,4]],
 [[74,2],[77,2],[81,2],[86,2],[84,2],[81,2],[77,2],[74,2]],
 [[80,2],[83,2],[86,2],[88,6],[0,4]],
];
const SONG=(()=>{
  const RT={C:48,D:50,E:40,F:41,G:43,A:45},Q={M:[0,4,7],'7':[0,4,7,10],m:[0,3,7]};
  const mkChord=tok=>{const root=RT[tok[0]],ints=Q[tok.slice(1)];const arp=ints.map(i=>{let n=root+i;while(n<72)n+=12;while(n>=84)n-=12;return n;}).sort((a,b)=>a-b);const stab=ints.map(i=>{let n=root+i;while(n<60)n+=12;while(n>=72)n-=12;return n;}).sort((a,b)=>a-b);return{root,ints,arp,stab};};
  const steps=[];
  const barsA='CM CM A7 A7 D7 G7 CM G7 CM C7 FM Fm CM A7 D7/G7 CM/G7'.split(' ');
  barsA.forEach((tok,b)=>{const halves=tok.includes('/')?tok.split('/'):[tok,tok];const cs=halves.map(mkChord);for(let s=0;s<8;s++)steps.push({sec:'A',ch:cs[s<4?0:1],mel:null});
    let s=0;MEL_A[b].forEach(([m,l])=>{steps[b*8+s].mel=[m,l];s+=l;});});
  'Am FM CM GM Am FM Dm E7'.split(' ').forEach((tok,b)=>{const c=mkChord(tok);for(let s=0;s<16;s++)steps.push({sec:'B',ch:c,mel:null});
    let s=0;MEL_B[b].forEach(([m,l])=>{steps[128+b*16+s].mel=[m,l];s+=l;});});
  return steps;
})();
function harmonyOf(note,c){let best=note-12;for(let o=-2;o<=3;o++)for(const i of c.ints){const n=c.root+i+o*12;if(n<=note-3&&n>best)best=n;}return best;}

const MUS={on:false,bpm:138,target:138,tr:0,i:0,next:0,style:'edm',calm:false,rush:0,beats:[],beatN:0};
function musicPlay(bpm,tr,o={}){if(!A.C)return;MUS.bpm=MUS.target=bpm;MUS.tr=tr;MUS.i=0;MUS.next=A.C.currentTime+.06;MUS.on=true;MUS.calm=!!o.calm;MUS.rush=0;MUS.beats=[];MUS.beatN=0;
  A.lp.frequency.cancelScheduledValues(A.C.currentTime);A.lp.frequency.setTargetAtTime(MUS.calm?5200:18000,A.C.currentTime,.3);if(A.dlyT)A.dlyT.delayTime.setTargetAtTime(60/bpm*.75,A.C.currentTime,.1);}
function musicStop(){MUS.on=false;}
const SWING=.54;
function scheduleStep(i,t,spb){
  const L=SONG.length,loop=Math.floor(i/L),k=i%L,s16=k%16,bar=Math.floor(k/16),st=SONG[k],c=st.ch,tr=MUS.tr,s16d=spb/4;
  const edm=MUS.style==='edm'&&!MUS.calm,secB=st.sec==='B',build=edm&&secB&&bar>=14,silent=build&&bar===15;
  if(s16%4===0){MUS.beats.push([t,MUS.beatN++]);if(MUS.beats.length>16)MUS.beats.shift();}
  /* melody */
  if(st.mel&&st.mel[0]){const m=st.mel[0]+tr,dur=st.mel[1]*s16d*1.9;
    cLead(t,m,dur,secB?.075:.08,secB?.125:.25);
    if(loop%2===1||secB)cLead(t,harmonyOf(st.mel[0],c)+tr,dur*.95,.035,.5,false);}
  /* arpeggios */
  if(secB||k>=64||MUS.rush>0)cArp(t,c.arp.map(n=>n+tr),s16d*.95,MUS.calm?.018:.026);
  /* triangle bass: octave bounce on 8ths */
  if(s16%2===0&&!silent)cBass(t,c.root+tr-(s16%4===0?12:0),s16d*1.8,edm?.2:.3);
  /* chip drums */
  if(!MUS.calm||bar%2===1){
    if(!edm){if(s16===0||s16===6||s16===8)cKick(t);if(s16===4||s16===12)cSnare(t);if(s16%2===0)cHat(t,s16%4===2?.07:.045);
      if(bar%8===7&&s16>=12)cSnare(t+s16d*.5,.16);}
    else if(!silent){if(s16%2===1)cHat(t,.035);}
  }
  /* EDM layer */
  if(edm){
    if(k===0&&loop>0)fxImpact(t);else if(k===0||k===128)dCrash(t,.12);
    if(build&&k===224)fxRiser(t,spb*8);
    if(s16%4===0&&!silent)dKick(t);
    if((s16===4||s16===12)&&!silent)dClap(t);
    if(s16%4===2&&!silent){dOpenHat(t);dSub(t,c.root-12+tr+(s16===14?12:0),s16d*1.7);}
    if(s16%4===2&&secB)dStab(t,c.stab.map(n=>n+tr),s16d*.9,.03,build?1500+(k-224)/32*6000:4200);
    if(build){if(bar===14&&s16%2===0)cSnare(t,.1+s16*.006);if(bar===15)cSnare(t,.1+s16*.012);}
  }
}
setInterval(()=>{
  if(!MUS.on||!A.C||A.C.state!=='running')return;
  if(MUS.next<A.C.currentTime-.1)MUS.next=A.C.currentTime+.02;
  while(MUS.next<A.C.currentTime+.14){MUS.bpm+=(MUS.target-MUS.bpm)*.06;const spb=60/MUS.bpm;
    scheduleStep(MUS.i,MUS.next,spb);MUS.next+=(MUS.i%2===0?SWING:1-SWING)*spb*.5;MUS.i++;}
},25);
function beatPhase(){
  if(MUS.on&&A.C&&MUS.beats.length){const now=A.C.currentTime;let b=MUS.beats[0];for(const x of MUS.beats)if(x[0]<=now)b=x;return b[1]+Math.max(0,now-b[0])/(60/MUS.bpm);}
  return T*2.2;
}

/* ---- 8-bit sound effects ---- */
function sChip(duty,f1,f2,dur,v,delay=0){if(!A.C)return;const C=A.C,t=C.currentTime+delay,g=C.createGain(),o=chipOsc(t,f1,duty,g);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);g.gain.setValueAtTime(v,t);g.gain.setValueAtTime(v,t+dur*.7);g.gain.linearRampToValueAtTime(0,t+dur);g.connect(A.sfx);o.start(t);o.stop(t+dur+.02);}
function sNoise(dur,v,type,f1,f2,delay=0){if(!A.C)return;const C=A.C,t=C.currentTime+delay,s=nsrc(t,dur),f=C.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(f1,t);if(f2)f.frequency.exponentialRampToValueAtTime(f2,t+dur);const g=C.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(A.sfx);}
const SFX={
  jump(){sChip(.5,280,760,.13,.07);},
  land(){sNoise(.07,.2,'lowpass',600,120);},
  dash(){sNoise(.2,.26,'bandpass',500,4200);sChip(.125,500,1400,.1,.035);},
  hit(){sChip(.5,420,70,.32,.1);sNoise(.28,.35,'lowpass',3000,200);},
  parry(){[1047,1319,1568,2093].forEach((f,i)=>sChip(.25,f,0,.08,.06,i*.045));},
  coin(){sChip(.5,988,0,.06,.05);sChip(.5,1319,0,.2,.05,.06);},
  ring(){sNoise(.35,.22,'bandpass',300,2200);[784,1047,1319].forEach((f,i)=>sChip(.25,f,0,.06,.04,i*.035));},
  boom(){sChip('tri',150,32,.45,.5);sNoise(.6,.45,'lowpass',1400,90);},
  stomp(){sChip(.5,200,800,.1,.07);sChip('tri',110,55,.14,.3);},
  squeal(){sChip(.125,1100,1800,.08,.03);sChip(.125,1500,900,.1,.025,.07);},
  bump(){sChip('tri',180,90,.1,.28);sNoise(.06,.15,'lowpass',900,300);},
  checkpoint(){[784,988,1175,1568].forEach((f,i)=>sChip(.25,f,0,.1,.045,i*.07));},
  superS(){sNoise(.9,.35,'bandpass',200,7000);[523,659,784,1047,1319,1568].forEach((f,i)=>sChip(.25,f,0,.12,.05,i*.06));if(A.C)fxImpact(A.C.currentTime+.5);},
  warn(){sChip(.5,1250,0,.06,.045);sChip(.5,1250,0,.06,.045,.12);},
  select(){sChip(.25,660,0,.05,.05);sChip(.25,990,0,.08,.05,.05);},
  curtain(){sNoise(.55,.2,'lowpass',900,300);},
  ko(){[[67,0],[66,.18],[65,.36],[64,.54],[60,.8]].forEach(([m,d],i)=>sChip(.5,mtof(m),i===4?mtof(48):0,i===4?.9:.16,.07,d));},
  fanfare(){[[72,0],[76,.1],[79,.2],[84,.3]].forEach(([m,d])=>sChip(.25,mtof(m),0,.1,.06,d));sChip(.25,mtof(88),0,.7,.06,.42);sChip(.5,mtof(76),0,.7,.04,.42);if(A.C)fxImpact(A.C.currentTime+.42);},
};
