/* Original procedural score and effects; works offline without audio downloads. */
window.SideAudio=class SideAudio{
  constructor(read,save){this.on=read('breach-side-sound','1')==='1';this.musicOn=read('breach-side-music','1')==='1';this.save=save;this.ctx=null;this.mode='title';this.voices=new Set();this.musicVoices=new Set();this.beat=0;this.nextBeat=0;this.lastImpact=-1;}
  init(){if(this.ctx)return true;try{const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;const c=this.ctx=new Context();this.master=c.createGain();this.master.gain.value=this.on?.7:0;this.limiter=c.createDynamicsCompressor();this.limiter.threshold.value=-16;this.limiter.knee.value=15;this.limiter.ratio.value=5;this.limiter.attack.value=.003;this.limiter.release.value=.16;this.fx=c.createGain();this.fx.gain.value=.65;this.music=c.createGain();this.music.gain.value=.19;this.fx.connect(this.master);this.music.connect(this.master);this.master.connect(this.limiter);this.limiter.connect(c.destination);this.noiseBuffer=c.createBuffer(1,c.sampleRate,c.sampleRate);const data=this.noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;return true;}catch(_){return false;}}
  unlock(){if(!this.on||!this.init())return;this.ctx.resume().catch(()=>{});}
  setSound(on){this.on=on;this.save('breach-side-sound',on?'1':'0');if(on)this.unlock();if(this.ctx){this.master.gain.cancelScheduledValues(this.ctx.currentTime);this.master.gain.setTargetAtTime(on?.7:0,this.ctx.currentTime,.025);}if(!on)this.stopMusic();}
  setMusic(on){this.musicOn=on;this.save('breach-side-music',on?'1':'0');if(on)this.unlock();else this.stopMusic();}
  voice(source,gain,filter,bus,end){const group=bus===this.music?this.musicVoices:this.voices;group.add(source);source.connect(filter||gain);if(filter)filter.connect(gain);gain.connect(bus);source.onended=()=>{group.delete(source);source.disconnect();gain.disconnect();filter?.disconnect();};source.stop(end);}
  tone(freq,endFreq,time,duration,volume=.2,type='triangle',bus=this.fx){const c=this.ctx,o=c.createOscillator(),a=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,time);o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),time+duration);a.gain.setValueAtTime(.0001,time);a.gain.exponentialRampToValueAtTime(volume,time+.006);a.gain.exponentialRampToValueAtTime(.0001,time+duration);o.start(time);this.voice(o,a,null,bus,time+duration+.01);}
  noise(time,duration,volume,frequency=1800,type='lowpass',bus=this.fx){const c=this.ctx,n=c.createBufferSource(),a=c.createGain(),f=c.createBiquadFilter();n.buffer=this.noiseBuffer;f.type=type;f.frequency.value=frequency;a.gain.setValueAtTime(.0001,time);a.gain.exponentialRampToValueAtTime(volume,time+.004);a.gain.exponentialRampToValueAtTime(.0001,time+duration);n.start(time);this.voice(n,a,f,bus,time+duration+.01);}
  play(kind,variant=0){if(!this.on||!this.init()||this.ctx.state!=='running'||this.voices.size>42)return;const t=this.ctx.currentTime+.002;
    if(kind==='shot'){const profiles=[[130,42,.24,.65,1500],[170,55,.13,.42,2400],[220,70,.085,.30,2900],[95,30,.40,.72,1200],[240,65,.14,.38,2100]],p=profiles[variant]||profiles[1];this.tone(p[0],p[1],t,p[2],p[3]);this.noise(t,p[2]*.7,p[3]*.7,p[4]);this.tone(1700,700,t+.015,.035,.06,'square');}
    else if(kind==='knife'){this.noise(t,.16,.2,2700,'bandpass');this.tone(650,180,t,.12,.08);}
    else if(kind==='impact'){if(t-this.lastImpact<.055)return;this.lastImpact=t;this.noise(t,.07,.18,1300);this.tone(180,65,t,.075,.16);}
    else if(kind==='explosion'){this.noise(t,.85,.65,700);this.tone(100,24,t,.7,.7,'sine');this.noise(t+.05,.45,.25,1800);}
    else if(kind==='stun'){this.noise(t,.22,.3,3600,'highpass');this.tone(1600,650,t,.5,.06,'sine');}
    else if(kind==='reload'||kind==='switch'){this.noise(t,.055,.22,2200,'highpass');this.tone(450,180,t+.07,.07,.09,'square');}
    else if(kind==='reloadDone'){this.noise(t,.09,.26,1700,'bandpass');this.tone(260,120,t,.09,.12);}
    else if(kind==='hit'){this.tone(100,35,t,.2,.28,'sine');this.noise(t,.12,.19,650);}
    else if(kind==='jump'){this.tone(150,280,t,.13,.07);this.noise(t,.045,.07,700);}
    else if(kind==='step'){this.noise(t,.045,.07,550);}
    else if(kind==='land'){this.noise(t,.095,.16,650);this.tone(90,40,t,.09,.12);}
    else if(kind==='throw'){this.noise(t,.12,.12,1600,'bandpass');}
    else if(kind==='skill'){const notes={assault:[164,220,330],medic:[330,440,660],scout:[660,880,1100],engineer:[220,330,440]}[variant]||[330,440,660];notes.forEach((f,i)=>this.tone(f,f,t+i*.075,.22,.12,'sine'));}
    else if(kind==='fail'){[220,185,130].forEach((f,i)=>this.tone(f,f*.8,t+i*.18,.3,.15));}
    else if(kind==='win'){[262,330,392,523].forEach((f,i)=>this.tone(f,f,t+i*.13,.4,.12));}
    else{[440,660].forEach((f,i)=>this.tone(f,f,t+i*.09,.16,.1,'sine'));}
    if(kind==='shot'||kind==='explosion'){this.music.gain.cancelScheduledValues(t);this.music.gain.setValueAtTime(.10,t);this.music.gain.linearRampToValueAtTime(.19,t+.35);}
  }
  stopMusic(){for(const v of this.musicVoices){try{v.stop();}catch(_){}}this.musicVoices.clear();this.nextBeat=0;this.beat=0;}
  update(mode){if(mode!==this.mode){this.stopMusic();this.mode=mode;}if(!this.on||!this.musicOn||!this.ctx||this.ctx.state!=='running'||document.hidden||!['title','briefing','playing'].includes(mode)){if(this.nextBeat)this.stopMusic();return;}const c=this.ctx,active=mode==='playing',step=60/(active?104:76)/2;if(!this.nextBeat||this.nextBeat<c.currentTime-.2)this.nextBeat=c.currentTime+.04;while(this.nextBeat<c.currentTime+.14){this.score(this.beat++,this.nextBeat,step,active);this.nextBeat+=step;}}
  score(beat,t,step,active){const root=[110,87.307,130.813,97.999][Math.floor(beat/16)%4],n=beat%16,bus=this.music;
    if(n===0){[1,1.5,2].forEach(r=>this.tone(root*r,root*r,t,step*13,.065,'sine',bus));}
    if(n%2===0){const f=root*([1,1,1.5,2][Math.floor(n/2)%4]);this.tone(f,f,t,step*1.4,active?.17:.10,'triangle',bus);}
    if(n%4===2){const f=root*2*[1,1.5,2,1.5][Math.floor(n/4)];this.tone(f,f,t,step*2.8,.075,'sine',bus);}
    if(active){if(n%4===0)this.tone(105,32,t,.19,.29,'sine',bus);if(n%8===4)this.noise(t,.12,.12,1500,'bandpass',bus);this.noise(t,.035,n%2?.035:.055,6500,'highpass',bus);}
  }
};
