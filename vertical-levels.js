/* Real upper floors and traversable stairs in the same coordinate system as combat. */
(() => {
  const make=SideCampaign.make.bind(SideCampaign),body=ActionMissions.body.bind(ActionMissions);
  SideCampaign.make=function(index){const w=make(index),ground=w.ground;w.storeys=[];w.stairs=[];
    const plans=index<6?[
      [[1180,560,160]],[[560,1350,160]],[[900,620,160]],[[1220,460,160]],[[830,190,130],[1240,260,170],[1750,230,130]],[[1050,580,160]]
    ][index]:[[index===10?1990:980+(index%3)*170,index===10?360:620,index===10?170:160]];
    for(const [x,width,height]of plans){const y=ground-height,run=index===4?220:320,left=Math.max(190,x-run),right=Math.min(w.width-130,x+width+run);w.storeys.push({x,y,w:width,h:18,storey:true,label:height>=150?'二楼':'夹层'});w.stairs.push({x:left,end:x,y1:ground,y2:y},{x:x+width,end:right,y1:y,y2:ground});}
    if(index===4){w.stairs=[{x:610,end:830,y1:ground,y2:510},{x:1020,end:1240,y1:510,y2:470},{x:1500,end:1750,y1:470,y2:510},{x:1980,end:2200,y1:510,y2:ground}];}
    // Existing loose catwalks in a rebuilt stairwell give way to the actual floor.
    w.platforms=w.platforms.filter(p=>p.ground||p===w.raidTrain?.platform||w.props.some(prop=>prop.platform===p)||!w.storeys.some(s=>p.x<s.x+s.w+80&&p.x+p.w>s.x-80));w.platforms.push(...w.storeys);
    if(index===0){w.tasks[1].x=1340;w.tasks[1].y=ground-160;}
    if(index===5)w.tasks[1].y=ground-160;
    // Supply caches reward using the upper route without moving legacy objectives.
    if(index>=6&&index!==10){const floor=w.storeys[0];w.pickups.push({x:floor.x+floor.w*.55,y:floor.y,type:index%2?'med':'ammo',taken:false});}
    return w;
  };
  const V=window.VerticalLevels={
    surface(stair,x){return stair.y1+(stair.y2-stair.y1)*(x-stair.x)/(stair.end-stair.x);},
    resolve(g,p,oldX,oldY){if(p.vy<0)return;if(p===g.player){if(g.dropTime>0||g.keys.has('KeyS'))return;const train=g.world.raidTrain;if(train?.started&&Math.abs(p.x-train.x)<train.w/2+5&&Math.abs(p.y-train.y)<9)return;if(g.vehicle&&g.task()?.kind==='train'&&Math.abs(p.x-g.vehicle.x)<95&&Math.abs(p.y-(g.vehicle.y-78))<9)return;}
      for(const stair of g.world.stairs||[]){const edge=Math.max(p.w/2+2,Math.abs(p.x-oldX)+1);if(p.x<stair.x-edge||p.x>stair.end+edge||stair.end<=stair.x)continue;const y=this.surface(stair,Math.max(stair.x,Math.min(stair.end,p.x)));const maxStep=Math.max(19,Math.abs(p.x-oldX)*Math.abs((stair.y2-stair.y1)/(stair.end-stair.x))+4);if(oldY<=y+maxStep&&p.y>=y-10){p.y=y;p.vy=0;p.grounded=true;break;}}
    },
    canDrop(g){const p=g.player;return p.grounded&&p.y<g.world.ground-22&&((g.world.platforms||[]).some(s=>!s.ground&&s.w>=100&&p.x>s.x-8&&p.x<s.x+s.w+8&&Math.abs(p.y-s.y)<5)||(g.world.stairs||[]).some(s=>p.x>=s.x&&p.x<=s.end&&Math.abs(p.y-this.surface(s,p.x))<10));}
  };
  ActionMissions.body=function(g,p,oldX,oldY){body(g,p,oldX,oldY);V.resolve(g,p,oldX,oldY);};
})();

