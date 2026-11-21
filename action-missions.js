/* Six authored opening operations and shared physical combat props. */
(() => {
  const campaign=window.SideCampaign,originalMake=campaign.make.bind(campaign),T=(kind,label,x,extra={})=>({kind,label,x,...extra});
  const operations=[
    {title:'破门突袭',place:'仓库 · 突击入口',brief:'击碎封锁门，迎击两波伏兵。利用可破坏掩体，射爆油桶清理集结敌人，然后抵达撤离点。',tasks:[T('destroy','击碎仓库封锁门',560,{hp:150,breach:true}),T('assault','突入大厅，击退两波伏兵',1160,{waves:2}),T('reach','抵达东侧撤离口',2440)]},
    {title:'暗线潜入',place:'档案楼 · 双层警戒区',brief:'地面有扫描探照灯，上层检修道可以绕过。F 操作地面开关可暂时关闭扫描；暴露会招来追兵，不会直接判负。夺取上层情报后撤离。',tasks:[T('take','夺取上层机密情报',1660,{raised:true}),T('reach','带着情报抵达接应点',2440)],stealth:true},
    {title:'猎杀运输车',place:'地下车库 · 武装运输通道',brief:'拦截往返移动的武装运输车。利用高处射击和油桶爆炸；车辆受损一半时会呼叫护卫队。摧毁目标后撤离。',tasks:[T('destroy','摧毁移动武装运输车',1050,{hp:620,movingTarget:true}),T('reach','突破车库出口',2440)]},
    {title:'爆破逃生',place:'仓储楼 · 爆破封锁区',brief:'F 启动爆破后，火线会从左侧追来。冲刺、跳过掩体，避开提前标出的落点轰炸，赶到撤离口。',tasks:[T('use','启动爆破，准备撤离',650,{startPursuit:true}),T('reach','甩开爆炸火线，抵达撤离点',2440)]},
    {title:'列车截击',place:'地下货运站 · 运输隧道',brief:'跳上第一节车厢自动发动列车，途中迎击高处守卫。跳车后可沿地面追上；车厢到站会等待，重新登车即可完成截击。',tasks:[T('ride','登上车厢，随列车突破封锁线',500),T('reach','穿过月台安全出口',2440)]},
    {title:'反攻防线',place:'指挥楼 · 三段战斗据点',brief:'靠近据点会引出守军。清空标记范围后站在区域内夺点，连续突破三个据点。油桶和掩体会改变交火位置，无需按 F 等待。',tasks:[T('secure','清除守军并占领西侧据点',650),T('secure','夺取中央火力据点',1330),T('secure','占领东侧指挥据点',2090),T('reach','通过接应检查点',2440)]}
  ];
  for(let i=0;i<operations.length;i++)campaign.levels[i]={...campaign.levels[i],...operations[i],silent:false,capture:false};
  const platform=(x,y,w)=>({x,y,w,h:12});
  campaign.make=function(index){const world=originalMake(index);world.props=[];world.scanners=[];
    if(index>=6)return world;
    const ground=world.ground;world.width=2600;world.exit={x:2460,y:ground};world.spawn={x:150,y:ground};world.tasks=operations[index].tasks.map((t,id)=>({...t,id,y:t.raised?ground-160:ground,progress:0,started:false,done:false,hp:t.hp||0,maxHp:t.hp||0}));world.enemies=[];
    const layouts=[[[380,80,170],[800,80,190],[1020,160,240],[1540,80,170],[1900,160,260]],[[380,80,190],[560,160,380],[1030,160,320],[1450,160,460],[2040,80,210]],[[420,80,210],[850,160,300],[1420,80,190],[1770,160,310]],[[840,80,150],[1120,160,220],[1560,80,180],[1900,160,230]],[[830,130,190],[1240,170,260],[1750,130,230],[2160,90,170]],[[400,80,150],[840,160,180],[1120,80,160],[1580,160,220],[1940,80,170]]];
    world.platforms=[{x:0,y:ground,w:world.width,h:200,ground:true},...layouts[index].map(([x,up,w])=>platform(x,ground-up,w))];
    const props=index===4?[[960,'barrel'],[1570,'barrel'],[2020,'cover']]:[[360,'cover'],[820,'barrel'],[1030,'cover'],[1460,'barrel'],[1810,'cover'],[2190,'barrel']];
    for(const [x,kind]of props){if(world.tasks.some(t=>Math.abs(t.x-x)<100))continue;const p={x,y:ground,w:kind==='cover'?48:24,h:kind==='cover'?39:42,hp:kind==='cover'?110:35,maxHp:kind==='cover'?110:35,kind};world.props.push(p);if(kind==='cover'){p.platform=platform(x-p.w/2,ground-p.h,p.w);world.platforms.push(p.platform);}}
    if(index===1){world.scanners=[{x:760,y:ground,range:170,phase:0,hp:40},{x:1340,y:ground,range:185,phase:2,hp:40},{x:2090,y:ground,range:170,phase:4,hp:40}];world.console={x:560,y:ground};}
    if(index===4){world.raidTrain={x:500,y:ground-60,w:155,h:60,finish:2190,started:false};world.raidTrain.platform=platform(422.5,ground-60,155);world.platforms.push(world.raidTrain.platform);}
    const initial=index===1?[[1040,ground],[1860,ground]]:index===4?[[900,ground-130],[1340,ground-170],[1840,ground-130]]:[[760,ground],[1580,ground]];
    initial.forEach(([x,y])=>A.spawn(world,x,y,index===4?'sniper':'rifle',65));world.pickups=[{x:250,y:ground,type:'ammo'},{x:1190,y:ground,type:'med'},{x:1990,y:ground,type:'ammo'}];return world;
  };
  const A=window.ActionMissions={
    spawn(w,x,y,kind='rifle',hp=65,group=null){const e={id:w.enemies.length,x,y,vx:0,vy:0,w:26,h:48,hp,maxHp:hp,kind,facing:-1,fire:1.3,grounded:true,home:x,stun:0,group};w.enemies.push(e);return e;},
    reset(g){g.action={alarm:0,alerted:false,scannerOff:0,chase:null,strikeTime:0,strikes:[],phase:'',wave:0};},
    targets(g){return [...g.world.props.filter(p=>p.hp>0).map(p=>({...p,y:p.y-p.h/2,h:0})),...g.world.scanners.filter(p=>p.hp>0).map(p=>({...p,y:p.y-105,h:0}))];},
    interact(g){const box=g.world.console;if(box&&g.near(box,70)){g.action.scannerOff=9;g.action.alarm=Math.max(0,g.action.alarm-35);g.audio.play('switch');g.notice('扫描关闭 9 秒，趁现在通过地面通道。');return true;}return false;},
    body(g,p,oldX,oldY){const obstacles=[...(g.world.props||[]).filter(p=>p.kind==='cover'),...g.world.tasks.filter(t=>t.breach&&!t.done).map(t=>({x:t.x,y:t.y,w:24,h:145,hp:t.hp}))];for(const prop of obstacles){if(prop.hp<=0||p.y<=prop.y-prop.h+2||p.y-p.h>=prop.y)continue;const left=prop.x-prop.w/2-p.w/2,right=prop.x+prop.w/2+p.w/2;if(p.x>left&&p.x<right){p.x=oldX<=prop.x?left:right;p.vx=0;}}},
    damageProp(g,p,damage){if(p.hp<=0)return;p.hp=Math.max(0,p.hp-damage);g.burst(p.x,p.y-p.h/2,p.kind==='barrel'?'#d4a571':'#9ca8ac',4);if(p.hp)return;if(p.platform)g.world.platforms=g.world.platforms.filter(s=>s!==p.platform);if(p.kind==='barrel'){g.audio.play('explosion');g.burst(p.x,p.y-20,'#f3bb78',26);for(const e of g.world.enemies)if(e.hp>0&&Math.hypot(e.x-p.x,e.y-e.h/2-(p.y-20))<175){e.hp=Math.max(0,e.hp-190);if(!e.hp)g.kills++;}if(Math.hypot(g.player.x-p.x,g.player.y-(p.y-20))<120)g.hurt(45);const t=g.task();if(t?.kind==='destroy'&&Math.hypot(t.x-p.x,t.y-30-(p.y-20))<175){t.hp=Math.max(0,t.hp-190);}for(const other of g.world.props)if(other!==p&&other.hp>0&&Math.abs(other.x-p.x)<155)this.damageProp(g,other,190);}},
    hitProjectile(g,b){const gate=g.world.tasks.find(t=>t.breach&&!t.done&&t.hp>0&&Math.abs(b.x-t.x)<14&&b.y>t.y-145&&b.y<t.y);if(gate){gate.hp=Math.max(0,gate.hp-b.damage);b.life=0;g.burst(b.x,b.y,'#b4ada0',5);return true;}const p=g.world.props?.find(p=>p.hp>0&&Math.abs(b.x-p.x)<p.w/2&&b.y>p.y-p.h&&b.y<p.y);if(p){this.damageProp(g,p,b.damage);b.life=0;return true;}if(b.team==='player'){const s=g.world.scanners?.find(s=>s.hp>0&&Math.abs(b.x-s.x)<15&&Math.abs(b.y-(s.y-105))<14);if(s){s.hp=Math.max(0,s.hp-b.damage);b.life=0;g.burst(s.x,s.y-105,'#b9ced1',5);return true;}}return false;},
    blast(g,grenade){if(grenade.stun)return;for(const p of g.world.props||[])if(p.hp>0&&Math.hypot(p.x-grenade.x,p.y-20-grenade.y)<170)this.damageProp(g,p,170);},
    beforeTick(g,dt){const train=g.world.raidTrain;if(train){const aboard=Math.abs(g.player.x-train.x)<train.w/2+5&&Math.abs(g.player.y-train.y)<5;if(aboard&&!train.started){train.started=true;g.notice('列车已启动，利用车厢迎击高处守卫！');}if(train.started&&train.x<train.finish){const dx=Math.min(100*dt,train.finish-train.x);train.x+=dx;train.platform.x=train.x-train.w/2;if(aboard)g.player.x+=dx;}}
      const t=g.task();if(t?.movingTarget){t.direction??=1;t.x+=t.direction*95*dt;if(t.x>2220){t.x=2220;t.direction=-1;}if(t.x<820){t.x=820;t.direction=1;}t.fireTimer=(t.fireTimer??2.5)-dt;if(t.fireTimer<=0&&Math.abs(g.player.x-t.x)<750&&(!window.MobileControls?.enabled||(t.x>g.renderer.camera-35&&t.x<g.renderer.camera+g.renderer.w/g.renderer.scale+35))){t.fireTimer=1.6;const angle=Math.atan2(g.player.y-25-(t.y-50),g.player.x-t.x);g.bullets.push({x:t.x,y:t.y-50,vx:Math.cos(angle)*400,vy:Math.sin(angle)*400,life:2,damage:9,team:'enemy'});}if(t.hp<t.maxHp*.5&&!t.guards){t.guards=true;this.spawn(g.world,Math.max(300,t.x-180),g.world.ground,'heavy',100);this.spawn(g.world,Math.min(2350,t.x+180),g.world.ground,'rifle',65);g.notice('运输车呼叫护卫队，注意两侧！');}}
    },
    update(g,dt){if(!g.action)return;const a=g.action,w=g.world,p=g.player,t=g.task();a.scannerOff=Math.max(0,a.scannerOff-dt);
      if(w.scanners.length){let exposed=false;for(const s of w.scanners){s.aim=s.x+Math.sin(g.time*.9+s.phase)*125;if(s.hp>0&&!a.scannerOff&&Math.abs(p.x-s.aim)<65&&p.y>w.ground-65)exposed=true;}a.alarm=Math.max(0,Math.min(100,a.alarm+(exposed?45:-18)*dt));if(a.alarm>=100&&!a.alerted){a.alerted=true;this.spawn(w,Math.max(50,p.x-260),w.ground,'rifle',65);this.spawn(w,Math.min(w.width-100,p.x+300),w.ground,'rifle',65);g.notice('警报触发！追兵赶来，仍可夺取情报后撤离。',5);}}
      if(a.chase){a.chase.wait-=dt;if(a.chase.wait<=0){a.chase.x+=145*dt;if(p.x<a.chase.x+20)g.fail('爆破火线追上了你。启动后立即向右冲刺，别停留在交火区。');a.strikeTime-=dt;if(a.strikeTime<=0){a.strikeTime=3.8;a.strikes.push({x:Math.min(w.width-100,p.x+150),timer:1.5});}}}
      for(const s of a.strikes){s.timer-=dt;if(s.timer<=0&&!s.done){s.done=true;g.burst(s.x,w.ground-15,'#efb276',30);g.audio.play('explosion');if(Math.abs(p.x-s.x)<75&&p.y>w.ground-100)g.hurt(40);}}a.strikes=a.strikes.filter(s=>s.timer>-.45);
      if(!t||g.mode!=='playing')return;
      if(t.startPursuit&&t.done)return;
      if(t.kind==='reach'&&g.near(t,85)){g.advance();if(g.ready)g.finish();return;}
      if(t.kind==='ride'&&w.raidTrain?.x>=w.raidTrain.finish&&Math.abs(p.x-w.raidTrain.x)<95&&Math.abs(p.y-w.raidTrain.y)<10){g.advance();return;}
      if(t.kind==='assault'||t.kind==='secure'){
        if(!t.started&&Math.abs(p.x-t.x)<360){t.started=true;t.wave=0;this.wave(g,t);}
        if(!t.started)return;const living=w.enemies.some(e=>e.hp>0&&(e.group===t.id||(t.kind==='secure'&&Math.abs(e.x-t.x)<180&&Math.abs(e.y-t.y)<85)));if(!living){if(t.kind==='assault'){if(t.wave<(t.waves||1))this.wave(g,t);else g.advance();}else if(g.near(t,150)){t.progress+=dt;if(t.progress>=3){g.advance();g.notice('据点已夺取，向下一处推进。');}}}
      }
    },
    wave(g,t){t.wave++;const offset=t.kind==='secure'?155:220;for(let i=0;i<(t.kind==='secure'?2:3);i++){const x=Math.max(80,Math.min(g.world.width-120,t.x+(i%2?offset:-offset)+i*35));this.spawn(g.world,x,t.y,i===2?'heavy':'rifle',i===2?95:65,t.id);}g.notice(t.kind==='secure'?'守军出动！清空据点再占领。':'伏兵第 '+t.wave+' / '+t.waves+' 波！');},
    advanced(g,t){if(t?.startPursuit){g.action.chase={x:0,wait:3};g.notice('3 秒后开始连锁爆破，立即向右撤离！',4);}},
    hud(g){const t=g.task(),a=g.action;if(!a)return;const d=document.getElementById('detail');if(t?.kind==='assault')d.textContent+=' · 伏兵 '+(t.wave||0)+' / '+t.waves+' 波';if(t?.kind==='secure')d.textContent+=' · 夺点 '+Math.floor(t.progress/3*100)+'%';if(t?.kind==='ride')d.textContent+=' · 车厢自动发车，抵达终点时留在车上';if(g.world.scanners.length)d.textContent+=' · 警戒 '+Math.floor(a.alarm)+'%'+(a.scannerOff?' · 扫描已关闭':'');if(a.chase)d.textContent+=' · 爆破火线追击中';if(g.world.console&&g.near(g.world.console,70))g.hint='F 暂时关闭扫描灯（9 秒）';}
  };
})();



