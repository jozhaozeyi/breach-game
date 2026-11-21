/* Thirty modern-day operations built on the six established objective systems. */
(() => {
  const W=BreachWorld,M=BreachMissions,make=W.make,original={...M};
  const operations=[
    ['港区仓库',0],['燃料配送站',1],['警务指挥所',2],['地铁检修库',3],['救援物资站',4],['变电站',5],
    ['边境检查站',0],['军用油库',1],['市政办公楼',2],['货运车站',3],['野战医院',4],['通信机房',5],
    ['海关大楼',0],['弹药转运库',1],['港口调度中心',2],['地下停车场',3],['应急仓储中心',4],['雷达控制站',5],
    ['使馆后勤楼',0],['维修车间',1],['机场塔台',2],['供水泵站',3],['前线补给所',4],['无线电中继站',5],
    ['战地诊所',0],['装甲维修厂',1],['联合指挥部',2],['铁路枢纽',3],['撤离集结站',4],['敌方总指挥所',5]
  ];
  const subtitles=['解救并护送被困人员','安装炸药，摧毁指定设施','击败指挥官，坚守撤离区','按顺序拆除三枚炸弹','搬运两箱物资至卸货区','摧毁发电设备，击败守备队长'];
  W.chapters[5]={title:'供电站',subtitle:subtitles[5]};
  for(const [title,type] of operations)W.chapters.push({title,subtitle:subtitles[type],missionType:type});
  W.missionType=level=>W.chapters[level]?.missionType??level;
  W.make=level=>{
    if(level<6)return make(level);
    if(!W.chapters[level])throw Error('Unknown chapter '+level);
    const chapter=W.chapters[level],type=chapter.missionType,w=make(type),sector=Math.floor((level-6)/6);
    // Reflect complete geometry, including door hinges and swing directions.
    const flipX=sector%2===0,flipY=sector%3!==0,sign=(flipX?-1:1)*(flipY?-1:1);
    const point=p=>{if(flipX)p.x=w.width-p.x;if(flipY)p.y=w.height-p.y;};
    const angle=a=>Math.atan2((flipY?-1:1)*Math.sin(a),(flipX?-1:1)*Math.cos(a));
    for(const b of [...w.walls,...w.props]){point(b);b.angle=angle(b.angle||0);}
    for(const r of w.rooms){if(flipX)r.x=w.width-r.x-r.w;if(flipY)r.y=w.height-r.y-r.h;}
    for(const d of w.doors){const hinge={x:d.hx,y:d.hy},center={x:d.cx,y:d.cy};point(hinge);point(center);d.hx=hinge.x;d.hy=hinge.y;d.cx=center.x;d.cy=center.y;point(d.inside);d.base=angle(d.base);d.openSide*=sign;d.angle*=sign;d.target=0;}
    for(const p of [w.spawn,w.exit,w.terminal,...w.pickups])point(p);
    for(const e of w.enemies){point(e);point(e.home);e.angle=angle(e.angle);}
    w.level=level;w.missionType=type;w.title=chapter.title;w.subtitle=chapter.subtitle;
    w.palette=sector%3;
    w.rebuild();
    // Extra defenders occupy clear room positions; health and damage remain fair.
    const extra=2+sector;
    for(let i=0;i<extra;i++){
      const r=w.rooms[(i+sector)%w.rooms.length];let p=null;
      for(const [fx,fy] of [[.5,.72],[.7,.5],[.3,.5],[.5,.4]]){const q={x:r.x+r.w*fx,y:r.y+r.h*fy};if(W.free(w,q,18)&&w.enemies.every(e=>Math.hypot(e.x-q.x,e.y-q.y)>42)){p=q;break;}}
      if(!p)continue;
      const kind=i%3===2?'heavy':'rifle',hp=kind==='heavy'?80:60;
      w.enemies.push({...w.enemies[0],...p,id:w.enemies.length,home:{...p},room:r.index,kind,hp,maxHp:hp,path:[],shot:2+i*.3,angle:0});
    }
    for(const [dx,dy] of [[110,0],[-110,0],[0,110],[0,-110]]){const p={x:w.spawn.x+dx,y:w.spawn.y+dy};if(W.free(w,p,16)&&Math.hypot(p.x-w.exit.x,p.y-w.exit.y)>90){w.pickups.push({...p,type:'ammo',taken:false});break;}}
    return w;
  };
  // Proxy only the objective type; all mission state writes reach the real session.
  const view=s=>s.level<6?s:new Proxy(s,{get:(target,key)=>key==='level'?W.missionType(target.level):Reflect.get(target,key),set:(target,key,value)=>Reflect.set(target,key,value)});
  for(const name of ['setup','goal','label','description','interactions','handleKey','panelText','tick','draw']){
    if(!original[name])continue;
    M[name]=(s,...args)=>original[name](view(s),...args);
  }
  const setup=M.setup;
  M.setup=s=>{setup(s);if(s.level>=6&&s.mission.bombs){const directions=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'];for(let i=0;i<s.mission.bombs.length;i++)s.mission.bombs[i].sequence=Array.from({length:4},(_,j)=>directions[(j+i+s.level)%4]);}
    if(s.level>=6){const w=s.world,walk={...w,solids:[...w.walls,...w.props,...w.doors.map(d=>W.doorBox({...d,angle:d.openSide*Math.PI/2}))]};
      for(const p of [...(s.mission.bombs||[]),...(s.mission.crates||[]),...(s.mission.charges||[]),...(s.mission.hostage?[s.mission.hostage]:[])]){
        if(W.path(walk,w.spawn,p,12).length)continue;
        const room=w.rooms.find(r=>p.x>r.x&&p.x<r.x+r.w&&p.y>r.y&&p.y<r.y+r.h);
        const candidates=[...(room?[room.door.inside]:[]),...w.doors.map(d=>d.inside)];
        const next=candidates.find(q=>W.free(walk,q,28)&&W.path(walk,w.spawn,q,12).length);if(!next)throw Error('Unreachable objective in chapter '+s.level);p.x=next.x;p.y=next.y;
      }
    }
    // Objective equipment can occupy a defender's authored spawn; move that guard clear.
    for(const e of s.world.enemies){if(W.free(s.world,e,18))continue;let found=false;
      for(let radius=24;radius<=300&&!found;radius+=16)for(let i=0;i<16;i++){const p={x:e.x+Math.cos(i*Math.PI/8)*radius,y:e.y+Math.sin(i*Math.PI/8)*radius};if(W.free(s.world,p,18)&&s.world.enemies.every(other=>other===e||Math.hypot(other.x-p.x,other.y-p.y)>38)){Object.assign(e,p);e.home={...p};found=true;break;}}
    }
  };
  const describe=M.description;
  M.description=s=>describe(s).map(text=>s.level<6?text:text.replace(/向北撤离/g,'前往标记撤离').replace(/[北东南西]侧出口/g,'标记出口'));
})();
