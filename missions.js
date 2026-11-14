/* Three different objectives, all operated with F. */
(() => {
  const W=BreachWorld,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function spot(w,point,r=18){
    for(let radius=0;radius<200;radius+=16)for(let i=0;i<16;i++){
      const p={x:point.x+Math.cos(i*Math.PI/8)*radius,y:point.y+Math.sin(i*Math.PI/8)*radius};
      if(W.free(w,p,r))return p;
    }
    return {...w.spawn};
  }
  const M=window.BreachMissions={
    setup(s){const w=s.world;s.objectiveReady=false;s.download=0;s.grenades=3;s.grenadeCd=0;s.explosives=[];
      s.mission=s.level===0?{hostage:{...spot(w,{x:1390,y:220}),r:12,angle:0,gait:0},released:false,nav:0,path:[]}
        :s.level===1?{charges:[{...spot(w,{x:260,y:250}),planted:false},{...spot(w,{x:1320,y:770}),planted:false}],active:null,fuse:null,detonated:false}
        :{started:false,hold:0,waves:0};
    },
    goal(s){const m=s.mission;if(s.objectiveReady)return s.world.exit;
      if(s.level===0)return m.released?s.world.exit:m.hostage;
      if(s.level===1)return m.charges.find(c=>!c.planted)||s.world.exit;
      return s.world.enemies.find(e=>e.kind==='captain'&&e.hp>0)||s.world.exit;
    },
    label(s){return s.objectiveReady?'撤离点':s.level===0?(s.mission.released?'护送至出口':'被困工程师'):s.level===1?'爆破装置':s.world.enemies.some(e=>e.kind==='captain'&&e.hp>0)?'指挥官':'防守集结区';},
    description(s){const m=s.mission;
      if(s.objectiveReady)return ['任务完成 · 前往撤离点','靠近绿色标记按 F 撤离。'];
      if(s.level===0)return m.released?['护送工程师撤离','工程师会跟随你；靠近出口等待他抵达。']:['解救被困工程师','找到蓝色标记，靠近按 F 解救，再护送到出口。'];
      if(s.level===1){const n=m.charges.filter(c=>c.planted).length;return m.fuse!==null?['爆破倒计时 '+Math.ceil(m.fuse)+' 秒','远离两个红色危险圈！爆破会波及附近的人。']:['安装爆破装置 '+n+' / 2','两处各按 F 安装 2 秒；移动、开火或受伤会中断。'];}
      return s.world.enemies.some(e=>e.kind==='captain'&&e.hp>0)?['击败指挥官','击败指挥官后，返回入口启动守点撤离。']:[m.started?'坚守撤离区 '+Math.floor(m.hold)+' / 30 秒':'返回入口 · 启动撤离','留在入口 145 图距内累计防守 30 秒；三波增援来袭。'];
    },
    interactions(s,notice){const m=s.mission,p=s.player,list=[];
      if(s.level===0&&!m.released&&dist(p,m.hostage)<72)list.push({...m.hostage,priority:1,text:'F  解救工程师',run:()=>{m.released=true;notice('工程师已获救，会跟随你。带他到出口！',4);}});
      if(s.level===1)for(const c of m.charges)if(!c.planted&&dist(p,c)<75)list.push({...c,priority:1,text:s.download?'安装中… 保持不动':'F  安装爆破装置',run:()=>{if(!s.download){m.active=c;s.download=2;notice('正在安装，保持不动并停止开火。');}}});
      if(s.level===2&&!m.started&&!s.world.enemies.some(e=>e.kind==='captain'&&e.hp>0)&&dist(p,s.world.exit)<100)list.push({...s.world.exit,priority:1,text:'F  呼叫撤离 / 开始守点',run:()=>{m.started=true;notice('撤离呼叫已发出！守住标记区 30 秒。',4);}});
      return list;
    },
    wave(s){const w=s.world,m=s.mission;m.waves++;
      const centers=s.level===2?[{x:720,y:525},{x:800,y:525}]:[{x:800,y:525},{x:800,y:470}];
      for(const center of centers){const p=spot(w,center),id=w.enemies.length;
        w.enemies.push({...p,id,home:{...p},kind:'rifle',hp:60,maxHp:60,r:13,angle:Math.PI,gait:0,shot:2.3,memory:60,last:{...s.player},nav:0,path:[],patrol:0,dead:0,hit:0,flash:0,alert:1});
      }
    },
    tick(s,dt,api){const m=s.mission,w=s.world;
      if(s.level===0&&m.released&&!s.objectiveReady){const h=m.hostage;h.moving=false;
        for(const d of w.doors)if(dist(h,{x:d.cx,y:d.cy})<115)api.requestDoor(d,1);
        if(dist(h,s.player)>52){m.nav-=dt;if(m.nav<=0){m.nav=.6;m.path=W.path(w,h,s.player,12);}while(m.path.length&&dist(h,m.path[0])<9)m.path.shift();const target=m.path[0];if(target){const a=Math.atan2(target.y-h.y,target.x-h.x);h.angle=a;W.move(w,h,Math.cos(a)*155*dt,Math.sin(a)*155*dt,12);h.gait+=dt*12;h.moving=true;}}
        if(dist(h,w.exit)<95){s.objectiveReady=true;api.notice('工程师已安全抵达，按 F 撤离。',4);}
      }
      if(s.level===1){if(s.download){if(!m.active||dist(s.player,m.active)>75||s.player.moving||s.dashTime)s.download=0;
          else{s.download=Math.max(0,s.download-dt);if(s.download<1e-7){s.download=0;m.active.planted=true;api.notice('装置安装完成。');if(m.charges.every(c=>c.planted)){m.fuse=8;api.notice('8 秒后引爆！远离两个红色危险圈。',4);}}}}
        if(m.fuse!==null&&!m.detonated){m.fuse=Math.max(0,m.fuse-dt);if(!m.fuse){m.detonated=true;for(const c of m.charges)api.explode(c,165,80);if(s.mode==='playing'){s.objectiveReady=true;api.notice('设施已摧毁，前往出口！',4);}}}
      }
      if(s.level===2&&m.started&&!s.objectiveReady){if(dist(s.player,w.exit)<145)m.hold+=dt;
        if(m.waves<3&&m.hold>=m.waves*10){M.wave(s);api.notice('第 '+m.waves+' 波增援，守住撤离区！',3);}
        if(m.hold>=30){s.objectiveReady=true;api.notice('接应已抵达！靠近出口按 F 撤离。',4);}
      }
    },
    draw(r,s,time){const m=s.mission,c=r.ctx;if(!m)return;
      if(s.level===0&&!s.objectiveReady){r.human(m.hostage,{...s,flash:0,dashTime:0},true,time);r.marker(m.hostage,m.released?'ESCORT':'RESCUE','#8ed9e5',time,30);}
      if(s.level===1)for(const p of m.charges){r.fill(p.x-18,p.y-14,36,28,p.planted?'#cc8764':'#648e96',4);r.marker(p,m.detonated?'DESTROYED':p.planted?'ARMED':'PLANT','#edbd84',time,32);if(p.planted&&!m.detonated){c.save();c.setLineDash([9,9]);c.strokeStyle='#ed956888';c.beginPath();c.arc(p.x,p.y,165,0,Math.PI*2);c.stroke();c.restore();}}
      if(s.level===2&&m.started&&!s.objectiveReady){c.strokeStyle='#b5dca9';c.lineWidth=2;c.beginPath();c.arc(s.world.exit.x,s.world.exit.y,145,0,Math.PI*2);c.stroke();}
      if(s.level===2){const captain=s.world.enemies.find(e=>e.kind==='captain'&&e.hp>0);if(captain)r.marker(captain,'COMMANDER','#edbd84',time,37);else if(!s.objectiveReady)r.marker(s.world.exit,'HOLD / F','#b5dca9',time,48);}
      for(const g of s.explosives){r.circle(g.x,g.y,7,'#f1c38a');r.marker(g,'GRENADE','#f1c38a',time,15);}
    }
  };
})();
