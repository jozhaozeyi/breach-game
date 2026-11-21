(() => {
  'use strict';
  const $=id=>document.getElementById(id),keys=new Set(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const weapons=[
    {name:'M870 霰弹枪',mag:8,reserve:48,damage:17,pellets:8,spread:.20,interval:.65,reload:1.8,range:540,speed:1050,pickup:16},
    {name:'M4A1 突击步枪',mag:30,reserve:180,damage:27,pellets:1,spread:.018,interval:.14,reload:2.1,range:1000,speed:1450,pickup:60},
    {name:'MP5 冲锋枪',mag:30,reserve:210,damage:18,pellets:1,spread:.055,interval:.085,reload:1.6,range:650,speed:1200,pickup:60},
    {name:'M24 狙击步枪',mag:5,reserve:35,damage:115,pellets:1,spread:0,interval:1.05,reload:2.6,range:1600,speed:2000,pickup:10},
    {name:'M9 手枪',mag:15,reserve:90,damage:34,pellets:1,spread:.012,interval:.26,reload:1.2,range:850,speed:1300,pickup:30},
    {name:'战术刀',melee:true,mag:0,reserve:0,damage:70,interval:.45,range:72,pickup:0}
  ];
  weapons.forEach((w,i)=>w.slot=i<4?'primary':'secondary');
  const classes={
    assault:{name:'突击兵',skill:'火力强化',cooldown:25,duration:8,description:'8 秒内枪械伤害提高 50%，射击间隔缩短 25%。冷却 25 秒。'},
    medic:{name:'医疗兵',skill:'战地急救',cooldown:25,duration:0,description:'立即恢复 50 点生命，不消耗医疗包。满生命时不消耗技能。冷却 25 秒。'},
    scout:{name:'侦察兵',skill:'侦察标记',cooldown:20,duration:10,description:'10 秒内标记所有存活敌人，显示位置和剩余生命。冷却 20 秒。'},
    engineer:{name:'工程兵',skill:'弹药补给',cooldown:30,duration:0,description:'为所装备的两把枪各补充一份备弹；刀无需弹药。冷却 30 秒。'}
  };
  const read=(key,fallback)=>{try{return localStorage.getItem(key)||fallback;}catch(_){return fallback;}},save=(key,value)=>{try{localStorage.setItem(key,String(value));}catch(_){}};
  const audio=new SideAudio(read,save);
  const g=window.SIDE_GAME={keys,weapons,audio,renderer:new SideRenderer($('game')),mode:'title',level:0,time:0,totalTime:0,world:null,weaponIndex:0,inventory:[],player:null,bullets:[],grenades:[],particles:[],flags:{},step:0,ready:false,noticeTime:0,message:'',kills:0,fireCd:0,flash:0,hitFlash:0,timer:null,sync:null,panel:null,carryCount:0,carrying:false,follower:null,vehicle:null,blast:null,lastDamage:0,lastShot:-100,clues:[],hint:'',jumpBuffer:0,coyote:0,
    classes,equipped:[0,4],classId:'assault',skillCd:0,skillTime:0,
    weapon(){return weapons[this.weaponIndex];},ammo(){return this.inventory[this.weaponIndex];},task(){return this.world?.tasks[this.step]||null;},
    readLoadout(){const primary=Number($('primarySelect').value),secondary=Number($('secondarySelect').value);this.equipped=[weapons[primary]?.slot==='primary'?primary:0,weapons[secondary]?.slot==='secondary'?secondary:4];this.classId=Object.hasOwn(classes,$('classSelect').value)?$('classSelect').value:'assault';},
    useSkill(){if(this.mode!=='playing'||this.panel||this.skillCd>0)return;const c=classes[this.classId];if(this.classId==='medic'&&this.player.hp>=100){this.notice('生命已满，无需急救。');return;}this.skillCd=c.cooldown;this.skillTime=c.duration;if(this.classId==='medic')this.player.hp=Math.min(100,this.player.hp+50);if(this.classId==='engineer')for(const i of this.equipped)this.inventory[i].reserve+=weapons[i].pickup;this.notice(c.name+' · '+c.skill+' 已释放');audio.play('skill',this.classId);this.hud();},
    notice(text,seconds=3){this.message=text;this.noticeTime=seconds;$('notice').textContent=text;$('notice').hidden=false;},
    load(level){if(!StoryCampaign.canEnter(level)){this.notice('先完成上一关，才能解锁这次行动。');return false;}this.storyRadio=-1;this.aimAngle=0;this.dropTime=0;this.readLoadout();this.skillCd=0;this.skillTime=0;this.level=level;this.world=SideCampaign.make(level);this.player={...this.world.spawn,vx:0,vy:0,w:24,h:48,hp:100,facing:1,grounded:true,invuln:1,stun:0};this.inventory=weapons.map((w,i)=>this.equipped.includes(i)?{mag:w.mag,reserve:w.reserve}:null);this.weaponIndex=this.equipped[0];
      Object.assign(this,{time:0,step:0,ready:false,kills:0,fireCd:0,flash:0,hitFlash:0,timer:null,sync:null,panel:null,carryCount:0,carrying:false,follower:null,vehicle:null,blast:null,noticeTime:0,fireReload:0,heal:0,meds:3,grenadeCount:5,grenadeCd:0,dashCd:0,dashTime:0,lastDamage:-100,lastShot:-100,jumpBuffer:0,coyote:.1,clues:[],flags:{},bullets:[],grenades:[],particles:[],hint:''});
      ActionMissions.reset(this);keys.clear();this.renderer.camera=0;this.setupTask();this.hud();return true;},
    start(skipBriefing=false){const selected=clamp(Number($('levelSelect').value)||0,0,35);if(!this.load(selected))return false;this.totalTime=0;this.mode='playing';$('title').hidden=true;$('hud').hidden=false;$('pause').hidden=false;$('overlay').hidden=true;$('game').focus({preventScroll:true});this.hud();if(skipBriefing)StoryCampaign.radio(this);else this.beginBriefing();return true;},
    beginBriefing(){this.mode='briefing';keys.clear();$('title').hidden=true;$('hud').hidden=true;$('pause').hidden=true;$('notice').hidden=true;this.showOverlay(StoryCampaign.act(this.level)+' · '+String(this.level+1).padStart(2,'0')+' / 36',StoryCampaign.entries[this.level][0],StoryCampaign.briefing(this.level));},
    setupTask(){const t=this.task();if(!t){this.ready=true;this.timer=null;this.notice('任务完成，前往右侧安全出口按 F。',5);return;}
      if(t.kind==='vehicle'||t.kind==='train'){this.vehicle={x:t.x-200,y:640,hp:100,started:false,train:t.kind==='train',finish:Math.min(this.world.width-300,t.x+620)};t.x=this.vehicle.x;}
      if(t.kind==='capture')this.notice('G 投掷震撼弹，指挥官眩晕时靠近按 F 控制。',5);
    },
    advance(){const t=this.task();if(!t)return;t.done=true;this.panel=null;if(t.stopTimer)this.timer=null;if(t.flag)this.flags[t.flag]=true;if(t.timer)this.timer=t.timer;if(t.clue){this.clues.push(t.clue);this.notice('获得线索：'+this.clues.join('  '),4);}
      if(t.carry){this.carrying=true;}if(t.deliver)this.carrying=false;if(t.kind==='take')this.carryCount++;
      if(t.armorRounds){this.flags.armorRounds=true;for(const i of this.equipped)this.inventory[i].reserve+=weapons[i].pickup;}
      if(t.release)this.follower={x:t.x,y:t.y,vx:0,vy:0,w:22,h:44,facing:1,hp:100,grounded:true};
      if(t.syncStart)this.sync={time:t.syncStart,from:this.step};if(t.syncEnd)this.sync=null;
      if(t.blast){this.blast={x:t.x,time:8};}
      ActionMissions.advanced(this,t);this.step++;audio.play('done');this.setupTask();this.hud();StoryCampaign.radio(this);
    },
    switchWeapon(i){if(this.mode!=='playing'||this.panel||!this.equipped.includes(i)||i===this.weaponIndex)return;this.weaponIndex=i;audio.play('switch');this.fireReload=0;this.heal=0;this.fireCd=Math.max(.15,this.fireCd);this.notice((i===this.equipped[0]?'主武器':'副武器')+' · '+weapons[i].name,1.8);this.hud();},
    jump(){if(this.mode!=='playing')return;if(this.keys.has('KeyS')&&VerticalLevels.canDrop(this)){this.dropTime=.3;this.player.y+=8;this.player.vy=90;this.player.grounded=false;this.jumpBuffer=0;return;}this.jumpBuffer=.14;},
    reload(){if(this.mode!=='playing'||this.weapon().melee||this.fireReload||this.ammo().mag===this.weapon().mag||!this.ammo().reserve)return;this.fireReload=this.weapon().reload;audio.play('reload');this.heal=0;},
    useMed(){if(this.mode!=='playing'||this.heal||!this.meds||this.player.hp>=100)return;this.heal=1.4;this.fireReload=0;this.notice('治疗中，避免开火和受伤。',1.5);},
    dash(){if(this.mode!=='playing'||this.dashCd||this.carrying)return;this.dashTime=.16;this.dashCd=2.5;},
    near(t,r=90){return Math.abs(this.player.x-t.x)<r&&Math.abs(this.player.y-t.y)<85;},
    interact(){if(this.mode!=='playing')return;if(this.panel){this.panel=null;return;}if(ActionMissions.interact(this))return;const t=this.task();
      if(t&&t.kind==='capture'){const e=this.world.enemies.find(e=>e.kind==='commander'&&e.hp>0);if(e&&this.near(e,90)){if(e.stun<=0){this.notice('先用 G 投掷震撼弹，再靠近控制。');return;}this.follower={x:e.x,y:e.y,vx:0,vy:0,w:23,h:46,facing:1,grounded:true,hp:100};e.hp=0;this.advance();return;}}
      if(this.vehicle&&['vehicle','train'].includes(t?.kind)&&this.near(this.vehicle,130)){if(this.vehicle.hp<100){this.vehicle.hp=Math.min(100,this.vehicle.hp+35);this.notice('车辆已维修。');}this.vehicle.started=true;t.started=true;if(t.kind==='train'){this.player.x=this.vehicle.x;this.player.y=this.vehicle.y-78;this.player.grounded=true;}this.notice(t.kind==='train'?'列车启动，保持在车厢上。':'运输车启动，保持靠近并保护车辆。');return;}
      if(t&&this.near(t,t.radius||90)){
        if(t.requiresFlag&&!this.flags[t.requiresFlag]){this.notice('先取得任务所需物品。');return;}
        if(t.requiresItems&&this.carryCount<t.requiresItems){this.notice('任务物品尚未收集齐。');return;}
        if(t.kind==='use'||t.kind==='take'){this.advance();return;}
        if(t.kind==='hold'){t.started=true;this.notice(t.upload?'上传已启动，保持靠近，开火或受伤会暂停。':'操作开始，保持在标记区域。');return;}
        if(t.kind==='code'){this.panel={task:t,step:0};keys.clear();this.notice('按显示顺序输入方向键，F 退出。',3);this.hud();return;}
      }
      const pickup=this.world.pickups.find(p=>!p.taken&&this.near(p,60));if(pickup){pickup.taken=true;if(pickup.type==='med'){this.meds++;this.notice('医疗包 +1');}else{const i=this.weapon().melee?this.equipped[0]:this.weaponIndex;this.inventory[i].reserve+=weapons[i].pickup;this.notice(weapons[i].name+' 弹药 +'+weapons[i].pickup);}this.hud();return;}
      if(this.near(this.world.exit,90)){if(!this.ready){this.notice(this.task().label);return;}if(this.follower&&Math.abs(this.follower.x-this.player.x)>140){this.notice('等待护送人员到达撤离点。');return;}this.finish();}
    },
    inputCode(code){if(!this.panel)return false;const p=this.panel;if(code===p.task.sequence[p.step]){p.step++;if(p.step===p.task.sequence.length){this.notice('验证完成。');this.advance();}}else if(code.startsWith('Arrow')){p.step=0;this.notice('顺序错误，从第一步重新输入。');}this.hud();return true;},
    shoot(){if(this.mode!=='playing'||this.fireCd||this.fireReload||this.panel)return;const w=this.weapon();if(w.melee){this.fireCd=w.interval;this.flash=.16;this.heal=0;this.lastShot=this.time;audio.play('knife');const p=this.player,e=this.world.enemies.filter(e=>e.hp>0&&(e.x-p.x)*p.facing>=0&&Math.abs(e.x-p.x)<=w.range&&Math.abs(e.y-e.h/2-(p.y-p.h/2))<45).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];if(e){e.hp=Math.max(0,e.hp-w.damage);if(!e.hp)this.kills++;this.burst(e.x,e.y-e.h/2,'#cab28c',5);audio.play('impact');}return;}if(this.world.spec.silent&&!this.flags.alarmOff){this.fail('枪声触发了报警。先关闭报警电源。');return;}const a=this.ammo();if(!a.mag){this.reload();return;}a.mag--;this.fireCd=w.interval*(this.classId==='assault'&&this.skillTime>0?.75:1);this.flash=.08;this.heal=0;this.lastShot=this.time;
      const p=this.player,origin={x:p.x+p.facing*22,y:p.y-p.h*.57};const targets=[...this.world.enemies.filter(e=>e.hp>0&&e.stun<=0),...ActionMissions.targets(this),...(this.task()?.kind==='destroy'?[{...this.task(),y:this.task().y-30}]:[])].filter(e=>(e.x-p.x)*p.facing>0&&Math.abs(e.x-p.x)<w.range&&Math.abs((e.y-(e.h||0)*.5)-origin.y)<240).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
      let angle=p.facing>0?0:Math.PI;if(keys.has('KeyQ'))angle=p.facing>0?-.65:Math.PI+.65;else if(keys.has('KeyE'))angle=p.facing>0?.55:Math.PI-.55;else if(targets[0]){const target=targets[0];angle=Math.atan2(target.y-(target.h||0)*.5-origin.y,target.x-origin.x);}
      this.aimAngle=Math.atan2(Math.sin(angle),Math.cos(angle)*p.facing);for(let i=0;i<w.pellets;i++){const spread=w.pellets>1?(i/(w.pellets-1)-.5)*w.spread:(Math.random()-.5)*w.spread;this.bullets.push({...origin,vx:Math.cos(angle+spread)*w.speed,vy:Math.sin(angle+spread)*w.speed,life:w.range/w.speed,damage:w.damage*(this.classId==='assault'&&this.skillTime>0?1.5:1),team:'player'});}audio.play('shot',this.weaponIndex);
    },
    throwGrenade(){if(this.mode!=='playing'||this.grenadeCd||!this.grenadeCount)return;if(this.world.spec.silent&&!this.flags.alarmOff){this.fail('投雷触发了报警。先关闭报警电源。');return;}this.grenadeCount--;audio.play('throw');this.grenadeCd=.7;this.heal=0;this.grenades.push({x:this.player.x,y:this.player.y-34,vx:this.player.facing*350,vy:-340,fuse:1.0,stun:!!this.world.spec.capture});},
    hurt(damage){const p=this.player;if(this.mode!=='playing'||p.invuln>0||this.dashTime>0)return;p.hp=Math.max(0,p.hp-damage);p.invuln=.65;this.hitFlash=.3;this.lastDamage=this.time;this.heal=0;audio.play('hit');if(p.hp<=0)this.fail('行动员失去战斗能力。利用平台、掩体和医疗包重新突围。');},
    burst(x,y,color='#e0b070',n=16){for(let i=0;i<n;i++)this.particles.push({x,y,vx:(Math.random()-.5)*220,vy:-Math.random()*220,r:2+Math.random()*5,life:.7,color});},
    explode(grenade){ActionMissions.blast(this,grenade);this.burst(grenade.x,grenade.y,grenade.stun?'#d6ddbb':'#ecba76',30);for(const e of this.world.enemies)if(e.hp>0&&Math.hypot(e.x-grenade.x,e.y-e.h*.5-grenade.y)<170){if(grenade.stun){e.stun=7;}else{e.hp=Math.max(0,e.hp-150);if(!e.hp)this.kills++;}}const t=this.task();if(t?.kind==='destroy'&&Math.hypot(t.x-grenade.x,t.y-25-grenade.y)<170&&!grenade.stun){t.hp=Math.max(0,t.hp-180);if(!t.hp)this.advance();}audio.play(grenade.stun?'stun':'explosion');},
    moveBody(p,dt){const oldY=p.y,oldX=p.x;p.vy=Math.min(1000,p.vy+1550*dt);p.x=clamp(p.x+p.vx*dt,18,this.world.width-18);p.y+=p.vy*dt;p.grounded=false;
      const platforms=this.vehicle&&this.task()?.kind==='train'?[...this.world.platforms,{x:this.vehicle.x-65,y:this.vehicle.y-78,w:130,h:10}]:this.world.platforms;
      // One-way platform tops: leap up through them, land while descending.
      for(const b of platforms)if(!(p===this.player&&this.dropTime>0&&!b.ground)&&p.vy>=0&&oldY<=b.y+2&&p.y>=b.y&&p.x+p.w/2>b.x&&p.x-p.w/2<b.x+b.w){p.y=b.y;p.vy=0;p.grounded=true;}
      if(p.y>900){p.y=this.world.ground;p.vy=0;p.grounded=true;}ActionMissions.body(this,p,oldX,oldY);p.gait=(p.gait||0)+Math.abs(p.x-oldX)/100*4;
    },
    spawnWave(){const p=this.player;for(let i=0;i<2;i++){let x=clamp(p.x+(i?430:-400),100,this.world.width-100);for(const [a,b]of this.world.gaps)if(x>a&&x<b)x=b+60;this.world.enemies.push({id:this.world.enemies.length,x,y:640,vx:0,vy:0,w:25,h:48,hp:65,maxHp:65,kind:'rifle',facing:i?-1:1,fire:2,home:x,stun:0});}this.notice('敌军增援到达！',2);},
    updateMission(dt){const t=this.task();if(!t)return;
      if(this.timer!==null){this.timer=Math.max(0,this.timer-dt);if(this.timer<=0){this.fail('任务时间耗尽。');return;}}
      if(this.sync){this.sync.time-=dt;if(this.sync.time<=0){for(let i=this.sync.from;i<this.step;i++)this.world.tasks[i].done=false;this.step=this.sync.from;this.sync=null;this.notice('发电机未能同步，回到第一台重新启动。',4);return;}}
      if(this.blast){this.blast.time-=dt;if(this.blast.time<=0){audio.play('explosion');const x=this.blast.x;this.burst(x,610,'#efb56e',60);if(Math.abs(this.player.x-x)<330)this.hurt(120);this.flags.blastDone=true;this.blast=null;}}
      if(t.kind==='escapeBlast'&&this.flags.blastDone&&Math.abs(this.player.x-t.x)<150)this.advance();
      if(t.kind==='hold'&&t.started&&this.near(t,t.radius||100)){
        const blocked=t.upload&&(this.time-this.lastDamage<1||this.time-this.lastShot<.5);if(!blocked)t.progress+=dt;
        if(t.waves){const expected=Math.min(t.waves,1+Math.floor(t.progress/(t.seconds/t.waves)));if((t.wavesSent||0)<expected){t.wavesSent=(t.wavesSent||0)+1;this.spawnWave();}}
        if(t.progress>=t.seconds)this.advance();
      }
      if(t.kind==='destroy'&&t.hp<=0)this.advance();
      if(['clear','officer','snipers','drones','boss'].includes(t.kind)){const kind={officer:'officer',snipers:'sniper',drones:'drone',boss:'boss'}[t.kind];const remaining=this.world.enemies.filter(e=>e.hp>0&&(!kind||e.kind===kind));if(!remaining.length)this.advance();}
      if(t.kind==='escort'&&this.follower&&Math.abs(this.follower.x-t.x)<130&&Math.abs(this.player.x-t.x)<180)this.advance();
      if((t.kind==='vehicle'||t.kind==='train')&&this.vehicle){const v=this.vehicle;if(v.started){if(t.kind==='train'){const aboard=Math.abs(this.player.x-v.x)<92&&Math.abs(this.player.y-(v.y-78))<15;if(aboard){const dx=105*dt;v.x+=dx;this.player.x+=dx;}}else if(Math.abs(this.player.x-v.x)<470)v.x+=82*dt;if(v.x>=v.finish)this.advance();}if(v.hp<=0)this.fail('护送车辆被摧毁，靠近按 F 可以维修车辆。');}
      if(this.world.spec.capture&&this.world.enemies.some(e=>e.kind==='commander'&&e.hp<=0)&&!this.follower)this.fail('指挥官阵亡。此任务必须活捉，使用 G 投掷震撼弹。');
      if(this.world.index===18&&!this.flags.gridOff&&this.player.x>2100&&this.player.x<2400&&this.player.y>520)this.hurt(12);
      if(this.world.index===23&&!this.flags.scanned&&this.world.tasks.slice(1).some(m=>Math.abs(this.player.x-m.x)<35))this.hurt(45);
      if(this.flags.flood&&!this.flags.drained&&this.timer!==null&&this.timer<32&&this.player.y>610)this.hurt(8);
      for(const fire of this.world.tasks)if(fire.fire&&!fire.done&&Math.abs(fire.x-this.player.x)<45&&this.player.y>600)this.hurt(8);
    },
    tick(dt){if(this.mode!=='playing')return;dt=Math.min(.04,Math.max(0,dt));this.time+=dt;this.totalTime+=dt;this.fireCd=Math.max(0,this.fireCd-dt);this.flash=Math.max(0,this.flash-dt);this.hitFlash=Math.max(0,this.hitFlash-dt);this.grenadeCd=Math.max(0,this.grenadeCd-dt);this.dashCd=Math.max(0,this.dashCd-dt);this.dashTime=Math.max(0,this.dashTime-dt);this.player.invuln=Math.max(0,this.player.invuln-dt);this.noticeTime=Math.max(0,this.noticeTime-dt);if(!this.noticeTime)$('notice').hidden=true;
      this.dropTime=Math.max(0,(this.dropTime||0)-dt);this.skillCd=Math.max(0,this.skillCd-dt);this.skillTime=Math.max(0,this.skillTime-dt);ActionMissions.beforeTick(this,dt);
      const p=this.player,move=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
      if(move)p.facing=move;p.vx=this.dashTime?p.facing*650:move*(this.carrying?225:270);if(keys.has('KeyS')&&p.grounded)p.vx*=.5;
      if(p.grounded)this.coyote=.11;else this.coyote=Math.max(0,this.coyote-dt);this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);if(this.jumpBuffer&&this.coyote){p.vy=this.carrying?-570:-590;p.grounded=false;this.jumpBuffer=0;this.coyote=0;audio.play('jump');}
      const wasGrounded=p.grounded;this.moveBody(p,dt);if(!wasGrounded&&p.grounded)audio.play('land');if(p.grounded&&Math.abs(p.vx)>20){this.footstep=(this.footstep||0)+dt;if(this.footstep>.30){this.footstep=0;audio.play('step');}}else this.footstep=0;if(this.mode!=='playing'){this.hud();return;}
      if(this.fireReload){this.fireReload=Math.max(0,this.fireReload-dt);if(!this.fireReload){const a=this.ammo(),n=Math.min(this.weapon().mag-a.mag,a.reserve);a.mag+=n;a.reserve-=n;audio.play('reloadDone');}}
      if(this.heal){this.heal=Math.max(0,this.heal-dt);if(!this.heal){p.hp=Math.min(100,p.hp+45);this.meds--;this.notice('生命恢复 45。');audio.play('skill','medic');}}
      if(keys.has('Space')||keys.has('KeyJ'))this.shoot();
      for(const e of this.world.enemies){if(e.hp<=0)continue;e.flash=Math.max(0,(e.flash||0)-dt);e.stun=Math.max(0,e.stun-dt);if(e.stun)continue;e.fire-=dt;const dx=p.x-e.x,dy=p.y-p.h*.5-(e.y-e.h*.5);e.facing=dx>0?1:-1;if(e.kind==='drone')e.y=525+Math.sin(this.time*2+e.id)*24;
        if(Math.abs(dx)<820&&Math.abs(dy)<250&&(!window.MobileControls?.enabled||(e.x>this.renderer.camera-35&&e.x<this.renderer.camera+this.renderer.w/this.renderer.scale+35))){if(e.fire<=0&&!(this.world.spec.silent&&!this.flags.alarmOff)){const a=Math.atan2(dy,dx);this.bullets.push({x:e.x+e.facing*18,y:e.y-e.h*.55,vx:Math.cos(a)*440,vy:Math.sin(a)*440,life:2.3,damage:e.kind==='boss'?12:7,team:'enemy'});e.flash=.07;e.fire=e.kind==='sniper'?2.7:e.kind==='boss'?.8:1.65+e.id%3*.2;}}
        if(e.kind!=='drone'&&e.kind!=='sniper'){e.vx=Math.abs(dx)<560&&Math.abs(dx)>240?e.facing*45:0;const ahead=e.x+e.facing*32;const floor=this.world.platforms.some(b=>Math.abs(b.y-e.y)<8&&ahead>b.x&&ahead<b.x+b.w);if(!floor)e.vx=0;this.moveBody(e,dt);}
      }
      // Substeps keep fast sniper rounds from tunnelling through a thin target.
      for(const b of this.bullets){b.life-=dt;const steps=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/10));for(let i=0;i<steps&&b.life>0;i++){b.x+=b.vx*dt/steps;b.y+=b.vy*dt/steps;
          if(ActionMissions.hitProjectile(this,b))break;const solid=this.world.platforms.some(s=>b.x>s.x&&b.x<s.x+s.w&&b.y>s.y+3&&b.y<s.y+s.h);if(solid){b.life=0;break;}
          if(b.team==='player'){
            const e=this.world.enemies.find(e=>e.hp>0&&Math.abs(e.x-b.x)<e.w/2+3&&b.y>e.y-e.h&&b.y<e.y+2);if(e){e.hp=Math.max(0,e.hp-b.damage);if(!e.hp)this.kills++;b.life=0;this.burst(b.x,b.y,'#cab28c',3);audio.play('impact');break;}
            const t=this.task();if(t?.kind==='destroy'&&Math.abs(t.x-b.x)<30&&b.y>t.y-62&&b.y<t.y){if(!t.armored||this.flags.armorRounds)t.hp=Math.max(0,t.hp-b.damage);b.life=0;this.burst(b.x,b.y,'#e4c288',4);}
          }else if(Math.abs(p.x-b.x)<15&&b.y>p.y-p.h&&b.y<p.y){this.hurt(b.damage);b.life=0;}
          else if(b.team==='enemy'&&this.vehicle&&this.task()?.kind==='vehicle'&&Math.abs(this.vehicle.x-b.x)<65&&b.y>this.vehicle.y-70&&b.y<this.vehicle.y){this.vehicle.hp-=b.damage*.7;b.life=0;}
      }}this.bullets=this.bullets.filter(b=>b.life>0);
      for(const grenade of this.grenades){grenade.fuse-=dt;grenade.vy+=900*dt;grenade.x+=grenade.vx*dt;grenade.y+=grenade.vy*dt;if(grenade.y>628){grenade.y=628;grenade.vy=-Math.abs(grenade.vy)*.28;grenade.vx*=.85;}if(grenade.fuse<=0)this.explode(grenade);}this.grenades=this.grenades.filter(b=>b.fuse>0);
      if(this.follower){const f=this.follower,dx=p.x-f.x;f.facing=dx>0?1:-1;f.vx=Math.abs(dx)>65?f.facing*235:0;const gapAhead=!this.world.platforms.some(b=>Math.abs(b.y-f.y)<5&&f.x+f.facing*45>b.x&&f.x+f.facing*45<b.x+b.w);if(f.grounded&&(gapAhead||p.y<f.y-55)&&Math.abs(dx)>55)f.vy=-590;this.moveBody(f,dt);}
      for(const particle of this.particles){particle.life-=dt;particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.vy+=500*dt;}this.particles=this.particles.filter(p=>p.life>0).slice(-180);
      if(this.mode==='playing')ActionMissions.update(this,dt);if(this.mode==='playing')this.updateMission(dt);this.hud();
    },
    hud(){if(!this.world)return;const t=this.task(),a=this.ammo();$('chapter').textContent=String(this.level+1).padStart(2,'0')+' / 36 · '+this.world.spec.title;$('objective').textContent=t?t.label:'前往右侧撤离点 · F 撤离';
      let detail=t?`${this.step+1} / ${this.world.tasks.length} 步`:'任务已完成';if(t?.kind==='hold')detail+=' · '+t.progress.toFixed(1)+' / '+t.seconds+' 秒';if(this.sync)detail+=' · 同步剩余 '+Math.ceil(this.sync.time)+' 秒';if(this.timer!==null)detail+=' · 剩余 '+Math.ceil(this.timer)+' 秒';if(this.clues.length)detail+=' · 线索 '+this.clues.join(' ');$('detail').textContent=detail;
      $('health').textContent=Math.ceil(this.player.hp);$('healthFill').style.width=this.player.hp+'%';$('ammo').textContent=a.mag;$('reserve').textContent=a.reserve;$('weaponName').textContent=(this.weaponIndex+1)+' · '+this.weapon().name;$('supplies').textContent='医疗 '+this.meds+' · '+(this.world.spec.capture?'震撼弹 ':'手雷 ')+this.grenadeCount;$('weaponStatus').textContent=this.fireReload?'换弹 '+this.fireReload.toFixed(1)+'s':this.heal?'治疗中…':this.carrying?'负重移动':'1/2 主副武器';$('clock').textContent=String(Math.floor(this.time/60)).padStart(2,'0')+':'+String(Math.floor(this.time%60)).padStart(2,'0');
      const target=this.ready?this.world.exit:(['clear','snipers','drones','officer','boss','capture'].includes(t?.kind)?this.world.enemies.find(e=>e.hp>0&&(t.kind==='clear'||e.kind===({snipers:'sniper',drones:'drone',officer:'officer',boss:'boss',capture:'commander'}[t.kind]))):t);const dx=(target?.x||this.player.x)-this.player.x;$('direction').textContent=target?(dx>60?'→ ':dx< -60?'← ':'↓ ')+Math.round(Math.abs(dx))+' m':'';
      this.hint=this.ready&&this.near(this.world.exit)?'F 撤离':t&&this.near(t,t.radius||90)?t.kind==='destroy'?'空格 开火摧毁目标':t.kind==='hold'?t.started?'保持在标记范围内':'F 开始任务':t.kind==='code'?'F 打开方向键面板':['use','take'].includes(t.kind)?'F '+t.label:'':this.world.pickups.some(p=>!p.taken&&this.near(p,60))?'F 拾取补给':'';
      const c=classes[this.classId];$('skillStatus').textContent=c.name+' · C '+c.skill+' · '+(this.skillTime>0?'生效 '+this.skillTime.toFixed(1)+'s · ':'')+(this.skillCd>0?'冷却 '+Math.ceil(this.skillCd)+'s':'就绪');
      $('ammo').textContent=this.weapon().melee?'—':a.mag;$('reserve').textContent=this.weapon().melee?'—':a.reserve;$('weaponName').textContent=(this.weaponIndex===this.equipped[0]?'1 主武器':'2 副武器')+' · '+this.weapon().name;
      ActionMissions.hud(this);if(window.MobileControls?.enabled)this.hint=this.hint.replace(/空格/g,'攻击').replace(/^F /,'交互 · ');$('codePanel').hidden=!this.panel;if(this.panel){const arrows={ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'};$('codeSequence').textContent=this.panel.task.sequence.map((s,i)=>i<this.panel.step?'✓':arrows[s]).join('   ');}
    },
    pause(){if(this.mode==='playing'){this.mode='paused';keys.clear();this.showOverlay('行动暂停','稍作调整','利用室内高低平台避开火力，地面可以直接通行。');}else if(this.mode==='paused'||this.mode==='briefing'){const briefing=this.mode==='briefing';this.mode='playing';$('overlay').hidden=true;$('hud').hidden=false;$('pause').hidden=false;$('game').focus({preventScroll:true});if(briefing)StoryCampaign.radio(this);}},
    showOverlay(label,title,text){$('overlay').hidden=false;$('overlayLabel').textContent=label;$('overlayTitle').textContent=title;$('overlayText').textContent=text;$('resume').hidden=!['paused','briefing'].includes(this.mode);$('resume').textContent=this.mode==='briefing'?(window.MobileControls?.enabled?'进入行动':'进入行动 · ENTER'):'继续行动';$('next').hidden=this.mode!=='clear';$('restart').hidden=this.mode==='won'||this.mode==='briefing';$('overlay').querySelector('button:not([hidden])')?.focus({preventScroll:true});},
    fail(text){if(this.mode!=='playing')return;this.mode='dead';audio.play('fail');keys.clear();this.panel=null;$('codePanel').hidden=true;this.showOverlay('行动中断','再试一次。',text);},
    finish(){if(this.mode!=='playing'||!this.ready)return false;StoryCampaign.complete(this.level);StoryCampaign.refresh();this.mode=this.level===35?'won':'clear';audio.play('win');keys.clear();this.showOverlay('行动完成 · '+$('clock').textContent,this.level===35?'黎明已经到来。':StoryCampaign.entries[this.level][0],StoryCampaign.debrief(this.level));return true;},
    restart(){this.load(this.level);this.mode='playing';$('overlay').hidden=true;},
    title(){this.mode='title';keys.clear();this.panel=null;$('codePanel').hidden=true;$('overlay').hidden=true;$('hud').hidden=true;$('pause').hidden=true;$('title').hidden=false;document.querySelector('.title-content').scrollTop=0;$('notice').hidden=true;StoryCampaign.refresh();$('levelSelect').value=String(StoryCampaign.unlocked);this.updateBrief();$('start').focus({preventScroll:true});},
    updateBrief(){StoryCampaign.refresh();const i=Number($('levelSelect').value)||0,s=SideCampaign.levels[i];$('missionPlace').textContent=s.place;$('missionBrief').textContent=s.brief;$('missionSteps').textContent=s.tasks.map((t,j)=>(j+1)+'. '+t.label).join('  /  ');StoryCampaign.menu(i);}
  };
  for(const [i,w]of weapons.entries()){const o=document.createElement('option');o.value=i;o.textContent=w.name;$(w.slot==='primary'?'primarySelect':'secondarySelect').append(o);}
  for(const [id,c]of Object.entries(classes)){const o=document.createElement('option');o.value=id;o.textContent=c.name+' · '+c.skill;$('classSelect').append(o);}
  for(const [id,key,fallback]of [['primarySelect','breach-side-primary','0'],['secondarySelect','breach-side-secondary','4'],['classSelect','breach-side-class','assault']]){const select=$(id),stored=read(key,fallback);select.value=[...select.options].some(o=>o.value===stored)?stored:fallback;select.onchange=()=>{save(key,select.value);g.updateClassDescription();};}
  g.updateClassDescription=()=>{$('classDescription').textContent=classes[$('classSelect').value].description;};g.updateClassDescription();
  for(let i=0;i<36;i++){const o=document.createElement('option');o.value=i;o.textContent=String(i+1).padStart(2,'0')+' · '+SideCampaign.levels[i].title;$('levelSelect').append(o);}
  StoryCampaign.refresh();$('levelSelect').value=String(StoryCampaign.unlocked);$('levelSelect').onchange=()=>g.updateBrief();g.load(0);g.updateBrief();
  $('start').onclick=()=>g.start();$('pause').onclick=()=>g.pause();$('resume').onclick=()=>g.pause();$('restart').onclick=()=>g.restart();$('next').onclick=()=>{if(g.mode!=='clear'||!g.load(g.level+1))return;g.beginBriefing();};$('menu').onclick=()=>g.title();
  $('sound').onclick=()=>{audio.setSound(!audio.on);$('sound').textContent=audio.on?'声音 开':'声音 关';$('sound').setAttribute('aria-pressed',String(audio.on));};$('sound').textContent=audio.on?'声音 开':'声音 关';$('sound').setAttribute('aria-pressed',String(audio.on));
  const updateMusicButton=()=>{$('music').textContent=audio.musicOn?'音乐 开':'音乐 关';$('music').setAttribute('aria-pressed',String(audio.musicOn));};updateMusicButton();$('music').onclick=()=>{audio.setMusic(!audio.musicOn);updateMusicButton();};
  window.addEventListener('pointerdown',()=>audio.unlock(),{capture:true});
  window.addEventListener('keydown',()=>audio.unlock(),{capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.stopMusic();if(g.mode==='playing')g.pause();}});
  window.addEventListener('keydown',e=>{
    if(['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName))return;
    if(e.target.closest?.('#mobileControls')&&['Space','Enter'].includes(e.code))return;
    if(g.panel&&g.mode==='playing'){if(e.code==='Escape'||e.code==='KeyF'){g.panel=null;g.hud();e.preventDefault();return;}if(e.code.startsWith('Arrow')){e.preventDefault();if(!e.repeat)g.inputCode(e.code);return;}}
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();
    if(e.code==='KeyP'||e.code==='Escape'){if(!e.repeat)g.pause();return;}
    if(g.mode!=='playing'){
      if(e.repeat)return;const root=g.mode==='title'?$('title'):$('overlay'),buttons=[...root.querySelectorAll('button')].filter(b=>!b.hidden);
      if(e.code.startsWith('Arrow')){const d=e.code==='ArrowLeft'||e.code==='ArrowUp'?-1:1,i=buttons.indexOf(document.activeElement);buttons[(i+d+buttons.length)%buttons.length]?.focus({preventScroll:true});}
      if(e.code==='Enter'||e.code==='Space')(buttons.includes(document.activeElement)?document.activeElement:buttons[0])?.click();return;
    }
    keys.add(e.code);if(e.repeat)return;
    if(/^Digit[12]$/.test(e.code))g.switchWeapon(g.equipped[Number(e.code.slice(-1))-1]);
    if(e.code==='KeyC')g.useSkill();
    if(['KeyW','ArrowUp'].includes(e.code)&&!g.panel)g.jump();if(e.code==='Space'||e.code==='KeyJ')g.shoot();if(e.code==='KeyF')g.interact();if(e.code==='KeyR')g.reload();if(e.code==='KeyG')g.throwGrenade();if(e.code==='KeyV')g.useMed();if(e.code==='ShiftLeft'||e.code==='ShiftRight')g.dash();
  });
  window.addEventListener('keyup',e=>{keys.delete(e.code);if(['KeyW','ArrowUp'].includes(e.code)&&g.player.vy< -200)g.player.vy=-200;});window.addEventListener('blur',()=>{keys.clear();if(g.mode==='playing')g.pause();});
  // Small touch controls are optional; keyboard remains the primary control scheme.
  for(const button of document.querySelectorAll('[data-key]')){button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);const code=button.dataset.key;keys.add(code);if(/^Digit[12]$/.test(code))g.switchWeapon(g.equipped[Number(code.slice(-1))-1]);if(code==='KeyC')g.useSkill();if(code==='KeyW'||code==='ArrowUp')g.jump();if(code==='KeyF')g.interact();if(code==='Space'||code==='KeyJ')g.shoot();});const release=()=>keys.delete(button.dataset.key);button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);}
  let last=0,visual=0;function frame(now){const dt=Math.min(.04,(now-last)/1000||.016);last=now;audio.update(g.mode);if(g.mode==='playing')g.tick(dt);if(g.mode!=='paused')visual+=dt;window.MobileControls?.update();g.renderer.draw(g,visual,dt);requestAnimationFrame(frame);}requestAnimationFrame(frame);$('start').focus({preventScroll:true});
})();











