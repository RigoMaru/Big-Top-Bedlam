'use strict';
/* Big Top Bedlam: electro-swing engine. The ragtime circus tune rides on house drums,
   sidechained offbeat bass, supersaw stabs, builds and drops. All synthesized live. */
const A={C:null,out:null,mus:null,pump:null,lp:null,sfx:null,rev:null,dly:null,dlyT:null,noise:null,muted:false};
function audioInit(){
  if(A.C){if(A.C.state==='suspended')A.C.resume();return;}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const C=new AC();A.C=C;
  const comp=C.createDynamicsCompressor();comp.threshold.value=-12;comp.knee.value=8;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.16;
  A.out=C.createGain();A.out.gain.value=A.muted?0:.9;comp.connect(A.out);A.out.connect(C.destination);
  A.lp=C.createBiquadFilter();A.lp.type='lowpass';A.lp.frequency.value=18000;A.lp.Q.value=.7;A.lp.connect(comp);
  A.mus=C.createGain();A.mus.gain.value=.55;A.mus.connect(A.lp);
  A.pump=C.createGain();A.pump.gain.value=1;A.pump.connect(A.mus);
  const conv=C.createConvolver(),len=Math.floor(C.sampleRate*1.8),ir=C.createBuffer(2,len,C.sampleRate);
  for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}conv.buffer=ir;
  A.rev=C.createGain();A.rev.gain.value=.22;A.rev.connect(conv);conv.connect(A.mus);
  A.dly=C.createGain();A.dly.gain.value=.5;A.dlyT=C.createDelay(1);A.dlyT.delayTime.value=.34;const fb=C.createGain();fb.gain.value=.38;const dlp=C.createBiquadFilter();dlp.type='lowpass';dlp.frequency.value=3200;
  A.dly.connect(A.dlyT);A.dlyT.connect(dlp);dlp.connect(fb);fb.connect(A.dlyT);dlp.connect(A.mus);
  A.sfx=C.createGain();A.sfx.gain.value=.62;A.sfx.connect(comp);
  const nb=C.createBuffer(1,C.sampleRate*2,C.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;A.noise=nb;
}
function setMute(m){A.muted=m;if(A.out)A.out.gain.setTargetAtTime(m?0:.9,A.C.currentTime,.02);}
const mtof=m=>440*Math.pow(2,(m-69)/12);
function osc(type,f,t,dest,det=0){const o=A.C.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);if(det)o.detune.setValueAtTime(det,t);o.connect(dest);return o;}
function nsrc(t,dur){const s=A.C.createBufferSource();s.buffer=A.noise;s.start(t,Math.random()*1.5,dur+.05);return s;}
function env(g,t,a,peak,hold,rel){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(0,t+a+hold,rel);}

/* ---- instruments ---- */
function iLead(t,m,dur,v,wet=true){
  const C=A.C,g=C.createGain(),f=C.createBiquadFilter();f.type='lowpass';f.Q.value=2.2;
  f.frequency.setValueAtTime(1000,t);f.frequency.linearRampToValueAtTime(3800,t+.035);f.frequency.setTargetAtTime(2000,t+.05,.12);
  const fr=mtof(m),o1=osc('sawtooth',fr,t,f),o2=osc('square',fr,t,f,7);
  const lfo=C.createOscillator();lfo.frequency.value=5.8;const lg=C.createGain();lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(fr*.012,t+Math.min(.22,dur));lfo.connect(lg);lg.connect(o1.frequency);lg.connect(o2.frequency);
  f.connect(g);g.connect(A.mus);if(wet)g.connect(A.rev);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.015);g.gain.setTargetAtTime(v*.72,t+.02,.07);g.gain.setTargetAtTime(0,t+dur,.035);
  const stop=t+dur+.3;o1.start(t);o2.start(t);lfo.start(t);o1.stop(stop);o2.stop(stop);lfo.stop(stop);
}
function iPluck(t,m,v){const C=A.C,g=C.createGain(),f=C.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(5200,t);f.frequency.exponentialRampToValueAtTime(900,t+.18);
  const o=osc('square',mtof(m),t,f),o2=osc('triangle',mtof(m)*2,t,f);f.connect(g);g.connect(A.mus);g.connect(A.dly);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.start(t);o2.start(t);o.stop(t+.25);o2.stop(t+.25);}
function iBass(t,m,dur,v=.3){const C=A.C,g=C.createGain(),f=C.createBiquadFilter();f.type='lowpass';f.Q.value=6;f.frequency.setValueAtTime(280,t);f.frequency.linearRampToValueAtTime(1500,t+.02);f.frequency.setTargetAtTime(420,t+.03,.06);
  const o=osc('sawtooth',mtof(m),t,f),o2=osc('square',mtof(m),t,f,-9),sub=osc('sine',mtof(m-12),t,g);f.connect(g);g.connect(A.pump);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.setTargetAtTime(v*.6,t+.01,.08);g.gain.setTargetAtTime(0,t+dur,.025);
  const st=t+dur+.2;o.start(t);o2.start(t);sub.start(t);o.stop(st);o2.stop(st);sub.stop(st);}
function iTuba(t,m,dur,v=.26){const C=A.C,g=C.createGain(),f=C.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(260,t);f.frequency.linearRampToValueAtTime(700,t+.03);f.frequency.setTargetAtTime(320,t+.04,.08);
  const o=osc('sawtooth',mtof(m),t,f),o2=osc('sine',mtof(m),t,g);f.connect(g);g.connect(A.mus);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.012);g.gain.setTargetAtTime(v*.55,t+.02,.1);g.gain.setTargetAtTime(0,t+dur,.03);o.start(t);o2.start(t);o.stop(t+dur+.2);o2.stop(t+dur+.2);}
function iStab(t,notes,dur,v=.04,cut=3600){const C=A.C,g=C.createGain(),f=C.createBiquadFilter();f.type='lowpass';f.Q.value=2;f.frequency.setValueAtTime(cut,t);f.frequency.setTargetAtTime(cut*.28,t+.01,.07);
  f.connect(g);g.connect(A.pump);g.connect(A.rev);
  notes.forEach(m=>{for(const d of[-14,0,14]){const o=osc('sawtooth',mtof(m),t,f,d);o.start(t);o.stop(t+dur+.25);}});
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.setTargetAtTime(v*.45,t+.01,.05);g.gain.setTargetAtTime(0,t+dur,.03);}
function dKick(t,v=.95){const C=A.C,o=C.createOscillator(),g=C.createGain();o.frequency.setValueAtTime(165,t);o.frequency.exponentialRampToValueAtTime(46,t+.1);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.38);o.connect(g);g.connect(A.mus);o.start(t);o.stop(t+.4);
  const s=nsrc(t,.02),f=C.createBiquadFilter();f.type='highpass';f.frequency.value=2500;const cg=C.createGain();cg.gain.setValueAtTime(v*.35,t);cg.gain.exponentialRampToValueAtTime(.001,t+.015);s.connect(f);f.connect(cg);cg.connect(A.mus);
  A.pump.gain.setValueAtTime(.18,t);A.pump.gain.linearRampToValueAtTime(1,t+.21);}
function dClap(t,v=.34){const C=A.C;for(let i=0;i<4;i++){const tt=t+i*.011,s=nsrc(tt,i===3?.2:.02),f=C.createBiquadFilter();f.type='bandpass';f.frequency.value=1500;f.Q.value=.8;const g=C.createGain();g.gain.setValueAtTime(v*(i===3?.9:.6),tt);g.gain.exponentialRampToValueAtTime(.001,tt+(i===3?.18:.02));s.connect(f);f.connect(g);g.connect(A.mus);if(i===3)g.connect(A.rev);}}
function dSnare(t,v=.28){const C=A.C,s=nsrc(t,.15),f=C.createBiquadFilter();f.type='bandpass';f.frequency.value=2200;f.Q.value=.9;const g=C.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.13);s.connect(f);f.connect(g);g.connect(A.mus);g.connect(A.rev);
  const o=C.createOscillator(),og=C.createGain();o.type='triangle';o.frequency.setValueAtTime(230,t);o.frequency.exponentialRampToValueAtTime(150,t+.07);og.gain.setValueAtTime(v*.5,t);og.gain.exponentialRampToValueAtTime(.001,t+.08);o.connect(og);og.connect(A.mus);o.start(t);o.stop(t+.09);}
function dHat(t,v=.05,open=false){const C=A.C,s=nsrc(t,open?.3:.05),f=C.createBiquadFilter();f.type='highpass';f.frequency.value=open?6500:8200;const g=C.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+(open?.22:.04));s.connect(f);f.connect(g);g.connect(A.mus);}
function dCrash(t,v=.16){const C=A.C,s=nsrc(t,1.5),f=C.createBiquadFilter();f.type='highpass';f.frequency.value=4200;const g=C.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+1.4);s.connect(f);f.connect(g);g.connect(A.mus);g.connect(A.rev);}
function fxRiser(t,dur){const C=A.C,s=nsrc(t,dur),f=C.createBiquadFilter();f.type='bandpass';f.Q.value=3;f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(7000,t+dur);const g=C.createGain();g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.2,t+dur);g.gain.setValueAtTime(0,t+dur+.01);s.connect(f);f.connect(g);g.connect(A.mus);
  const o=C.createOscillator(),og=C.createGain();o.type='sawtooth';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(880,t+dur);og.gain.setValueAtTime(.001,t);og.gain.exponentialRampToValueAtTime(.05,t+dur);og.gain.setValueAtTime(0,t+dur+.01);o.connect(og);og.connect(A.rev);o.start(t);o.stop(t+dur+.05);}
function fxImpact(t){const C=A.C,o=C.createOscillator(),g=C.createGain();o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(28,t+.9);g.gain.setValueAtTime(.8,t);g.gain.exponentialRampToValueAtTime(.001,t+1.1);o.connect(g);g.connect(A.mus);o.start(t);o.stop(t+1.2);dCrash(t,.22);}

/* ---- the tune: 16 bars of ragtime, each melody "eighth" now plays as a swung 16th ---- */
const MEL=[
 [[76,1],[79,1],[84,2],[83,1],[84,1],[81,1],[79,1]],[[76,2],[0,1],[76,1],[75,1],[76,1],[79,2]],
 [[81,1],[79,1],[76,1],[73,1],[74,1],[76,1],[79,2]],[[81,3],[0,1],[81,1],[82,1],[81,1],[79,1]],
 [[78,1],[81,1],[86,2],[84,1],[81,1],[78,1],[74,1]],[[79,1],[77,1],[74,1],[71,1],[74,1],[77,1],[81,1],[79,1]],
 [[76,2],[79,1],[84,3],[0,2]],[[83,1],[81,1],[79,1],[77,1],[74,1],[71,1],[67,2]],
 [[72,1],[76,1],[79,1],[84,1],[88,2],[86,1],[84,1]],[[82,2],[79,1],[76,1],[72,2],[0,2]],
 [[81,1],[84,1],[89,2],[88,1],[86,1],[84,1],[81,1]],[[80,2],[77,1],[72,1],[80,2],[79,2]],
 [[79,1],[76,1],[72,1],[76,1],[79,1],[84,1],[88,2]],[[85,1],[86,1],[88,1],[85,1],[81,2],[79,2]],
 [[78,1],[81,1],[86,1],[84,1],[83,1],[79,1],[77,1],[74,1]],[[84,2],[79,1],[76,1],[72,2],[0,2]],
];
const SONG=(()=>{
  const RT={C:48,D:50,F:53,G:43,A:45},Q={M:[0,4,7],'7':[0,4,7,10],m:[0,3,7]};
  const bars='CM CM A7 A7 D7 G7 CM G7 CM C7 FM Fm CM A7 D7/G7 CM/G7'.split(' ');const ch=[],mel=[];
  bars.forEach((tok,b)=>{const halves=tok.includes('/')?tok.split('/'):[tok,tok];
    const cs=halves.map(hf=>{const root=RT[hf[0]],ints=Q[hf.slice(1)];const voic=ints.map(i=>{let n=root+12+i;while(n<57)n+=12;while(n>72)n-=12;return n;}).sort((a,b)=>a-b);return{root,ints,voic};});
    for(let s=0;s<8;s++)ch.push(cs[s<4?0:1]);let s=0;MEL[b].forEach(([m,l])=>{mel[b*8+s]=[m,l];s+=l;});});
  return{ch,mel};
})();
function harmonyOf(note,c){let best=note-12;for(let o=-2;o<=3;o++)for(const i of c.ints){const n=c.root+i+o*12;if(n<=note-3&&n>best)best=n;}return best;}

const MUS={on:false,bpm:126,target:126,tr:0,i:0,next:0,mellow:false,rush:0,beats:[],beatN:0};
function musicPlay(bpm,tr,o={}){if(!A.C)return;MUS.bpm=MUS.target=bpm;MUS.tr=tr;MUS.i=0;MUS.next=A.C.currentTime+.06;MUS.on=true;MUS.mellow=!!o.mellow;MUS.rush=0;MUS.beats=[];MUS.beatN=0;
  A.lp.frequency.cancelScheduledValues(A.C.currentTime);A.lp.frequency.setTargetAtTime(MUS.mellow?2400:18000,A.C.currentTime,.3);if(A.dlyT)A.dlyT.delayTime.setTargetAtTime(60/bpm*.75,A.C.currentTime,.1);}
function musicStop(){MUS.on=false;}
const SWING=.58;
function scheduleStep(i,t,spb){
  const loop=Math.floor(i/128),k=i%128,s16=k%16,bar=Math.floor(k/16),tr=MUS.tr,s16d=spb/4,c=SONG.ch[k],mn=SONG.mel[k];
  const mellow=MUS.mellow,build=!mellow&&loop%2===1&&bar>=6,silentBar=build&&bar===7;
  if(s16%4===0){MUS.beats.push([t,MUS.beatN++]);if(MUS.beats.length>16)MUS.beats.shift();}
  if(k===0){if(loop>0&&loop%2===0&&!mellow)fxImpact(t);else dCrash(t,mellow?.08:.14);}
  if(build&&k===96)fxRiser(t,spb*8);
  if(!mellow){
    if(s16%4===0&&!silentBar)dKick(t);
    if((s16===4||s16===12)&&!silentBar)dClap(t);
    if(!silentBar){if(s16%4===2)dHat(t,.07,true);else dHat(t,s16%2?.035:.055);}
    if(s16%4===2&&!silentBar)iBass(t,c.root-12+tr+(s16===14?12:0),s16d*1.7);
    if(s16%4===2)iStab(t,c.voic.map(n=>n+tr),s16d*.9,s16===2||s16===10?.042:.03,build?1800+((k-96)/32)*5000:3600);
    if(build){if(bar===6&&s16%2===0)dSnare(t,.12+s16*.008);if(bar===7)dSnare(t,.12+s16*.014);}
    if(MUS.rush>0&&!silentBar){const nn=c.voic.map(n=>n+12+tr);iPluck(t,nn[k%nn.length],.028*MUS.rush);}
  }else{
    if(s16===0||s16===8)iTuba(t,c.root-12+tr,s16d*3);
    if(s16===4||s16===12)iStab(t,c.voic.map(n=>n+tr),s16d*1.2,.03,2000);
    if(s16%2===0)dHat(t,.02);
  }
  if(mn&&mn[0]){iLead(t,mn[0]+tr,mn[1]*s16d*1.9,mellow?.085:.1);if(loop%2===1)iLead(t,harmonyOf(mn[0],c)+tr,mn[1]*s16d*1.8,.045,false);
    if(!mellow&&loop%2===1&&!build)iPluck(t,mn[0]+12+tr,.03);}
}
setInterval(()=>{
  if(!MUS.on||!A.C||A.C.state!=='running')return;
  if(MUS.next<A.C.currentTime-.1){MUS.next=A.C.currentTime+.02;}
  while(MUS.next<A.C.currentTime+.14){MUS.bpm+=(MUS.target-MUS.bpm)*.06;const spb=60/MUS.bpm;
    scheduleStep(MUS.i,MUS.next,spb);MUS.next+=(MUS.i%2===0?SWING:1-SWING)*spb*.5;MUS.i++;}
},25);
function beatPhase(){
  if(MUS.on&&A.C&&MUS.beats.length){const now=A.C.currentTime;let b=MUS.beats[0];for(const x of MUS.beats)if(x[0]<=now)b=x;return b[1]+Math.max(0,(now-b[0]))/(60/MUS.bpm);}
  return T*2.1;
}

/* ---- sound effects ---- */
function sTone(type,f1,f2,dur,v,delay=0){if(!A.C)return;const C=A.C,t=C.currentTime+delay,o=C.createOscillator(),g=C.createGain();o.type=type;o.frequency.setValueAtTime(f1,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(A.sfx);o.start(t);o.stop(t+dur+.02);}
function sNoise(dur,v,type,f1,f2,delay=0){if(!A.C)return;const C=A.C,t=C.currentTime+delay,s=nsrc(t,dur),f=C.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(f1,t);if(f2)f.frequency.exponentialRampToValueAtTime(f2,t+dur);const g=C.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(A.sfx);}
const SFX={
  jump(){sTone('sine',190,560,.15,.16);sNoise(.12,.12,'bandpass',800,3000);},
  land(){sNoise(.09,.28,'lowpass',520,110);},
  dash(){sNoise(.22,.32,'bandpass',500,4200);sTone('sawtooth',300,90,.15,.04);},
  hit(){sTone('sawtooth',520,60,.38,.2);sNoise(.28,.42,'lowpass',2800,180);sTone('square',950,280,.1,.08,.05);},
  parry(){[1318,1976,2637].forEach((f,i)=>sTone('sine',f,0,.7-i*.12,.13));sNoise(.5,.08,'highpass',6000,9000);},
  coin(){sTone('square',988,0,.07,.05);sTone('square',1319,0,.18,.05,.07);},
  ring(){sNoise(.4,.26,'bandpass',300,2200);sTone('triangle',880,1760,.16,.05);},
  boom(){sTone('sine',120,32,.55,.65);sNoise(.7,.5,'lowpass',1400,90);},
  stomp(){sTone('square',220,900,.12,.07);sTone('sine',110,55,.16,.32);sTone('square',950,1700,.1,.035,.05);},
  squeal(){sTone('square',1100,1800,.1,.04);sTone('square',1500,900,.12,.03,.08);},
  checkpoint(){[784,988,1175,1568].forEach((f,i)=>sTone('square',f,0,.14,.045,i*.07));},
  superS(){sNoise(.9,.4,'bandpass',200,7000);[523,659,784,1046].forEach((f,i)=>sTone('sawtooth',f,0,.7,.05,i*.05));if(A.C)fxImpact(A.C.currentTime+.5);},
  warn(){sTone('square',1250,0,.06,.05);sTone('square',1250,0,.06,.05,.12);},
  select(){sTone('square',660,990,.08,.05);sTone('sine',1320,0,.1,.04,.05);},
  curtain(){sNoise(.55,.22,'lowpass',900,300);},
  ko(){if(!A.C)return;const C=A.C;[[58,0,.32],[57,.34,.32],[56,.68,.32],[55,1.02,1.1]].forEach(([m,d,l],i)=>{const t=C.currentTime+d,o=C.createOscillator(),f=C.createBiquadFilter(),g=C.createGain();o.type='sawtooth';o.frequency.setValueAtTime(mtof(m-12),t);f.type='lowpass';f.frequency.setValueAtTime(500,t);f.frequency.linearRampToValueAtTime(1400,t+.1);f.frequency.linearRampToValueAtTime(500,t+l);if(i===3){const lfo=C.createOscillator(),lg=C.createGain();lfo.frequency.value=6;lg.gain.value=4;lfo.connect(lg);lg.connect(o.frequency);lfo.start(t);lfo.stop(t+l);}g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+.04);g.gain.setValueAtTime(.22,t+l-.08);g.gain.linearRampToValueAtTime(0,t+l);o.connect(f);f.connect(g);g.connect(A.sfx);o.start(t);o.stop(t+l+.05);});},
  fanfare(){if(!A.C)return;const t=A.C.currentTime+.02;[[60,64,67],[64,67,72],[67,72,76]].forEach((c,i)=>iStab(t+i*.13,c,.1,.08));iStab(t+.42,[72,76,79,84],.9,.09);iLead(t+.42,84,.9,.12);fxImpact(t+.42);},
};
