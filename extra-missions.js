/* Additional campaign objectives; keeps the original three missions intact. */
(() => {
  const M=BreachMissions,W=BreachWorld,base={...M},dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const arrows={ArrowUp:'↑',ArrowRight:'→',ArrowDown:'↓',ArrowLeft:'←'};
  function spot(w,point,r=28){for(let d=0;d<180;d+=16)for(let i=0;i<16;i++){const p={x:point.x+Math.cos(i*Math.PI/8)*d,y:point.y+Math.sin(i*Math.PI/8)*d};if(W.free(w,p,r))return p;}throw Error('No free objective position');}
  M.setup=s=>{base.setup(s);const w=s.world;
    if(s.level===3)s.mission={bombs:[{x:250,y:250,sequence:['ArrowLeft','ArrowUp','ArrowRight','ArrowDown']},{x:960,y:800,sequence:['ArrowUp','ArrowRight','ArrowDown','ArrowLeft']},{x:1380,y:240,sequence:['ArrowRight','ArrowDown','ArrowLeft','ArrowUp']}].map(p=>({...p,...spot(w,p),done:false})),panel:null,step:0};
    if(s.level===4)s.mission={crates:[{...spot(w,{x:260,y:240}),taken:false},{...spot(w,{x:1330,y:780}),taken:false}],carrying:false,delivered:0};
    if(s.level===5){s.mission={targets:[{x:300,y:250},{x:1260,y:800},{x:1250,y:240}].map(p=>({...spot(w,p),r:27,hp:90,maxHp:90,kind:'generator'}))};for(const t of s.mission.targets)w.props.push(W.box(t.x,t.y,42,42,'server',{target:t}));w.rebuild();}
  };
  M.goal=s=>{if(s.level<3)return base.goal(s);const m=s.mission;if(s.objectiveReady)return s.world.exit;
    if(s.level===3)return m.bombs.find(b=>!b.done)||s.world.exit;
    if(s.level===4)return m.carrying?s.world.exit:m.crates.find(c=>!c.taken)||s.world.exit;
    return m.targets.find(t=>t.hp>0)||s.world.enemies.find(e=>e.kind==='captain'&&e.hp>0)||s.world.exit;
  };
  M.label=s=>s.level<3?base.label(s):s.objectiveReady?'撤离点':s.level===3?'待拆炸弹':s.level===4?(s.mission.carrying?'补给卸货点':'补给箱'):s.mission.targets.some(t=>t.hp>0)?'供电装置':'守备队长';
  M.description=s=>{if(s.level<3)return base.description(s);const m=s.mission;
    if(s.objectiveReady)return ['任务完成 · 前往撤离点','靠近绿色标记按 F 撤离，进入下一关。'];
    if(s.level===3)return ['拆除炸弹 '+m.bombs.filter(b=>b.done).length+' / 3',m.panel?'按面板顺序输入四个方向键；输错可重试，F 退出操作。':'靠近金色炸弹按 F，按显示顺序输入方向键。战斗继续，先找好掩护。'];
    if(s.level===4)return ['运送补给 '+m.delivered+' / 2',m.carrying?'携带补给时移动稍慢；带回绿色卸货点，按 F 交付。':'每次携带一箱。靠近蓝色补给按 F 拿起，再运回卸货点。'];
    const n=m.targets.filter(t=>t.hp<=0).length;return n<3?['摧毁供电装置 '+n+' / 3','用霰弹枪击毁三台红色装置，再击败守备队长，向北撤离。']:['击败守备队长','供电已切断。消灭队长后，前往北侧出口。'];
  };
  M.interactions=(s,notice)=>{if(s.level<3)return base.interactions(s,notice);const m=s.mission,p=s.player,list=[];
    if(s.level===3)for(const b of m.bombs)if(!b.done&&dist(p,b)<78)list.push({...b,priority:1,text:'F  打开拆弹面板',run:()=>{m.panel=b;m.step=0;notice('按面板顺序输入方向键，F 退出。',4);}});
    if(s.level===4){if(!m.carrying)for(const c of m.crates)if(!c.taken&&dist(p,c)<75)list.push({...c,priority:1,text:'F  搬起补给箱',run:()=>{c.taken=true;m.carrying=true;notice('带补给箱回绿色卸货点。',3);}});
      if(m.carrying&&dist(p,s.world.exit)<80)list.push({...s.world.exit,priority:1,text:'F  交付补给箱',run:()=>{m.carrying=false;m.delivered++;if(m.delivered===2){s.objectiveReady=true;notice('两箱补给已交付，按 F 撤离！',4);}else notice('补给已交付，再运回一箱。',3);}});
    }
    return list;
  };
  M.handleKey=(s,e,notice)=>{if(s.level!==3||!s.mission.panel)return false;const m=s.mission;
    if(e.code==='Escape'||e.code==='KeyF'){m.panel=null;return true;}
    if(e.code==='KeyP')return false;
    if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','KeyG','KeyV','KeyR'].includes(e.code)){m.panel=null;return false;}
    if(e.repeat)return true;
    if(arrows[e.code]){if(e.code===m.panel.sequence[m.step]){m.step++;if(m.step===m.panel.sequence.length){m.panel.done=true;m.panel=null;notice('炸弹已拆除！',3);if(m.bombs.every(b=>b.done)){s.objectiveReady=true;notice('三枚炸弹已拆除，前往东侧出口。',4);}}}else{m.step=0;notice('顺序不对，从第一步重试。',2);}}
    return true;
  };
  M.panelText=s=>s.level===3&&s.mission.panel?'拆弹 / 按顺序输入：'+s.mission.panel.sequence.map((code,i)=>i<s.mission.step?'✓':arrows[code]).join('  ')+'　|　F 退出':null;
  M.tick=(s,dt,api)=>{if(s.level<3){base.tick(s,dt,api);return;}const m=s.mission;
    if(s.level===3&&m.panel&&dist(s.player,m.panel)>85)m.panel=null;
    if(s.level===5&&!s.objectiveReady&&m.targets.every(t=>t.hp<=0)&&!s.world.enemies.some(e=>e.kind==='captain'&&e.hp>0)){s.objectiveReady=true;api.notice('供电设施已摧毁，守备队长已被击败。前往北侧出口！',5);}
  };
  M.draw=(r,s,time)=>{if(s.level<3){base.draw(r,s,time);return;}const m=s.mission,c=r.ctx;
    if(s.level===3)for(const b of m.bombs){r.fill(b.x-17,b.y-12,34,24,b.done?'#537e69':'#ac7353',4);r.marker(b,b.done?'SAFE':'DISARM / F',b.done?'#a9d3ac':'#edbd84',time,32);}
    if(s.level===4){for(const b of m.crates)if(!b.taken){r.fill(b.x-21,b.y-16,42,32,'#598d92',3);r.marker(b,'CARGO / F','#8ed9e5',time,34);}if(m.carrying){r.fill(s.player.x-12,s.player.y+20,24,19,'#8eb5a0',3);}r.marker(s.world.exit,'DELIVER / F','#b5dca9',time,46);}
    if(s.level===5){for(const t of m.targets){r.fill(t.x-21,t.y-21,42,42,t.hp>0?'#a5684e':'#283738',3);r.marker(t,t.hp>0?'POWER':'OFFLINE',t.hp>0?'#e9a484':'#8cb5a0',time,35);if(t.hp>0){r.fill(t.x-24,t.y-35,48,4,'#17292d');r.fill(t.x-24,t.y-35,48*t.hp/t.maxHp,4,'#edbd84');}}const captain=s.world.enemies.find(e=>e.kind==='captain'&&e.hp>0);if(captain)r.marker(captain,'COMMANDER','#edbd84',time,38);}
    for(const g of s.explosives){r.circle(g.x,g.y,7,'#f1c38a');r.marker(g,'GRENADE','#f1c38a',time,15);}
  };
})();
