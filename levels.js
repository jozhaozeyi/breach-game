/* Authored rooms, physical furniture and hinged doors. All units are world pixels. */
(() => {
  const W=window.BreachWorld={};
  W.box=(x,y,w,h,type='wall',extra={})=>({x,y,w,h,angle:0,type,...extra});
  W.doorBox=d=>({x:d.hx+Math.cos(d.base+d.angle)*48,y:d.hy+Math.sin(d.base+d.angle)*48,w:96,h:12,angle:d.base+d.angle,type:'door',door:d});
  W.circleBox=(p,r,b)=>{const c=Math.cos(b.angle||0),s=Math.sin(b.angle||0),dx=p.x-b.x,dy=p.y-b.y,x=dx*c+dy*s,y=-dx*s+dy*c,qx=Math.max(-b.w/2,Math.min(b.w/2,x)),qy=Math.max(-b.h/2,Math.min(b.h/2,y));return (x-qx)**2+(y-qy)**2<r*r;};
  W.ray=(a,b,solids,pad=0)=>{let hit=null;for(const box of solids){const c=Math.cos(box.angle||0),s=Math.sin(box.angle||0),dx=a.x-box.x,dy=a.y-box.y,px=dx*c+dy*s,py=-dx*s+dy*c,vx=(b.x-a.x)*c+(b.y-a.y)*s,vy=-(b.x-a.x)*s+(b.y-a.y)*c;let lo=0,hi=1,ok=true;for(const [p,v,half]of [[px,vx,box.w/2+pad],[py,vy,box.h/2+pad]]){if(Math.abs(v)<1e-8){if(Math.abs(p)>half){ok=false;break;}}else{let t1=(-half-p)/v,t2=(half-p)/v;if(t1>t2)[t1,t2]=[t2,t1];lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>hi){ok=false;break;}}}if(ok&&lo>=0&&lo<=1&&(!hit||lo<hit.t))hit={t:lo,box};}return hit;};
  W.circleRay=(a,b,p,r)=>{const dx=b.x-a.x,dy=b.y-a.y,fx=a.x-p.x,fy=a.y-p.y,A=dx*dx+dy*dy;if(A<1e-8)return null;const B=2*(fx*dx+fy*dy),C=fx*fx+fy*fy-r*r,D=B*B-4*A*C;if(D<0)return null;const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?t:null;};
  W.free=(world,p,r=13)=>p.x>35&&p.y>35&&p.x<world.width-35&&p.y<world.height-35&&!world.solids.some(b=>W.circleBox(p,r,b));
  W.move=(world,p,dx,dy,r=13)=>{const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5));for(let i=0;i<steps;i++){const x=p.x+dx/steps,y=p.y+dy/steps;if(W.free(world,{x,y:p.y},r))p.x=x;if(W.free(world,{x:p.x,y},r))p.y=y;}};
  W.path=(world,start,goal,r=14)=>{
    const size=16,cols=Math.ceil(world.width/size),key=(x,y)=>y*cols+x,candidates=[],starts=[];let sx=Math.round(start.x/size),sy=Math.round(start.y/size);
    for(let d=0;d<4;d++)for(let x=-d;x<=d;x++)for(let y=-d;y<=d;y++)if(Math.max(Math.abs(x),Math.abs(y))===d){const xx=sx+x,yy=sy+y,p={x:xx*size,y:yy*size};if(W.free(world,p,r)&&!W.ray(start,p,world.solids,Math.max(0,r-.1)))starts.push({x:xx,y:yy,d:Math.hypot(p.x-start.x,p.y-start.y)});}starts.sort((a,b)=>a.d-b.d);if(!starts.length)return [];sx=starts[0].x;sy=starts[0].y;
    for(let d=0;d<4;d++)for(let x=-d;x<=d;x++)for(let y=-d;y<=d;y++)if(Math.max(Math.abs(x),Math.abs(y))===d){const gx=Math.round(goal.x/size)+x,gy=Math.round(goal.y/size)+y;if(W.free(world,{x:gx*size,y:gy*size},r))candidates.push({x:gx,y:gy,d:Math.hypot(gx*size-goal.x,gy*size-goal.y)});}
    candidates.sort((a,b)=>a.d-b.d);if(!candidates.length)return [];const g=candidates[0],end=key(g.x,g.y),origin=key(sx,sy),open=[{x:sx,y:sy,id:origin,cost:0,f:Math.hypot(sx-g.x,sy-g.y)}],best=new Map([[origin,0]]),closed=new Set(),parents=new Map(),valid=new Map();let found=false;
    const push=n=>{open.push(n);let i=open.length-1;while(i>0){const p=(i-1)>>1;if(open[p].f<=n.f)break;open[i]=open[p];i=p;}open[i]=n;},pop=()=>{const first=open[0],last=open.pop();if(open.length){let i=0;while(i*2+1<open.length){let child=i*2+1;if(child+1<open.length&&open[child+1].f<open[child].f)child++;if(last.f<=open[child].f)break;open[i]=open[child];i=child;}open[i]=last;}return first;};
    const free=(x,y)=>{const id=key(x,y);if(!valid.has(id))valid.set(id,W.free(world,{x:x*size,y:y*size},r));return valid.get(id);};
    for(let count=0;open.length&&count<9000;count++){const n=pop();if(closed.has(n.id))continue;if(n.id===end){found=true;break;}closed.add(n.id);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const x=n.x+dx,y=n.y+dy,id=key(x,y),p={x:x*size,y:y*size};if(closed.has(id)||!free(x,y)||W.ray({x:n.x*size,y:n.y*size},p,world.solids,Math.max(0,r-.1)))continue;const cost=n.cost+Math.hypot(dx,dy);if(cost>=(best.get(id)??Infinity))continue;best.set(id,cost);parents.set(id,n);push({x,y,id,cost,f:cost+Math.hypot(x-g.x,y-g.y)});}}
    if(!found)return [];const result=[{x:g.x*size,y:g.y*size}];let at=end;while(at!==origin){const n=parents.get(at);if(!n)return [];result.push({x:n.x*size,y:n.y*size});at=n.id;}result.reverse();if(result.length>1&&!W.ray(start,result[1],world.solids,Math.max(0,r-.1)))result.shift();return result;
  };
  W.chapters=[
    {title:'城市前哨',subtitle:'解救并护送工程师'},
    {title:'研发设施',subtitle:'安装炸药，摧毁设施'},
    {title:'指挥中枢',subtitle:'击败指挥官，守点撤离'},
    {title:'地下军械库',subtitle:'拆除三枚炸弹'},
    {title:'物流转运站',subtitle:'将两箱补给运回卸货点'},
    {title:'供电核心',subtitle:'摧毁供电装置，击败守备队长'}
  ];
  W.make=level=>{
    if(!W.chapters[level])throw Error('Unknown chapter '+level);
    const layout=level===1||level===4?1:level===2?2:0;
    const w={level,width:1600,height:1050,walls:[],props:[],doors:[],rooms:[],pickups:[],enemies:[],solids:[],terminal:null,exit:null,spawn:null,title:W.chapters[level].title,subtitle:W.chapters[level].subtitle};
    const wall=(x,y,width,height)=>w.walls.push(W.box(x,y,width,height));
    for(const b of [[800,85,1450,18],[800,965,1450,18],[75,525,18,880],[1525,525,18,880]])wall(...b);
    function split(x1,y1,x2,y2,cx,cy){if(y1===y2){wall((x1+cx-52)/2,y1,cx-52-x1,14);wall((cx+52+x2)/2,y1,x2-cx-52,14);}else{wall(x1,(y1+cy-52)/2,14,cy-52-y1);wall(x1,(cy+52+y2)/2,14,y2-cy-52);}}
    function room(x,y,width,height,side,vertical,kind,index){const r={x,y,w:width,h:height,side,kind,index,label:['行动室','补给仓','服务器','医务室','实验室','指挥室'][kind]};let cx,cy,base,openSide,inside;if(!vertical){cx=x+width*.5;cy=side<0?y+height:y;base=0;openSide=side;inside={x:cx,y:cy+side*65};split(x,cy,x+width,cy,cx,cy);}else{cx=side<0?x+width:x;cy=y+height*.5;base=Math.PI/2;openSide=-side;inside={x:cx+side*65,y:cy};split(cx,y,cx,y+height,cx,cy);}const d={id:w.doors.length,hx:cx-Math.cos(base)*48,hy:cy-Math.sin(base)*48,cx,cy,base,openSide,angle:0,target:0,blocked:0,label:r.label,inside,room:index};r.door=d;w.doors.push(d);w.rooms.push(r);return r;}
    if(level===5){for(const x of[625,975]){wall(x,240,14,310);wall(x,810,14,310);}for(const x of[75,975]){room(x,85,550,310,-1,false,x===75?1:5,w.rooms.length);room(x,655,550,310,1,false,x===75?4:2,w.rooms.length);}w.spawn={x:800,y:905};w.exit={x:800,y:145};w.terminal={x:800,y:525};}
    else if(layout===1){for(let row=0;row<3;row++){const y=85+row*880/3,h=880/3;if(row>0){wall(397.5,y,645,14);wall(1202.5,y,645,14);}room(75,y,645,h,-1,true,(row+1)%6,w.rooms.length);room(880,y,645,h,1,true,(row+3)%6,w.rooms.length);}w.spawn={x:800,y:145};w.exit={x:800,y:905};w.terminal={x:1400,y:750};}
    else if(layout===0){const xs=level===3?[75,430,780,1140,1525]:[75,558,1041,1525];for(let i=1;i<xs.length-1;i++){wall(xs[i],272.5,14,375);wall(xs[i],777.5,14,375);}for(let i=0;i<xs.length-1;i++){room(xs[i],85,xs[i+1]-xs[i],375,-1,false,i%6,w.rooms.length);room(xs[i],590,xs[i+1]-xs[i],375,1,false,(i+3)%6,w.rooms.length);}w.spawn={x:135,y:525};w.exit={x:1460,y:525};w.terminal={x:1415,y:190};}
    else{const xs=[75,558,1041];wall(558,272.5,14,375);wall(558,777.5,14,375);for(let i=0;i<2;i++){room(xs[i],85,xs[i+1]-xs[i],375,-1,false,(i+2)%6,w.rooms.length);room(xs[i],590,xs[i+1]-xs[i],375,1,false,(i+3)%6,w.rooms.length);}room(1041,85,484,880,1,true,5,w.rooms.length);w.spawn={x:135,y:525};w.exit={x:135,y:525};w.terminal={x:1420,y:200};}
    if(level===4){w.spawn={x:800,y:905};w.exit={x:800,y:905};}
    const prop=(x,y,width,height,kind='crate',extra={})=>w.props.push(W.box(x,y,width,height,kind,extra));
    for(const r of w.rooms){const x=r.x,y=r.y,wide=r.w,h=r.h;
      if(r.kind===0){for(let i=0;i<3;i++)prop(x+85+i*105,y+78,84,42,'desk');prop(x+wide*.58,y+h*.6,70,56);}
      if(r.kind===1){for(const p of [[90,95],[165,95],[90,175],[wide-95,h-95]])prop(x+p[0],y+p[1],60,60,'crate');}
      if(r.kind===2){for(let i=0;i<3;i++)prop(x+70+i*95,y+110,44,125,'server');prop(x+wide-85,y+h-105,85,44,'desk');}
      if(r.kind===3){prop(x+110,y+95,115,55,'bed');prop(x+110,y+190,115,55,'bed');prop(x+wide-60,y+85,48,90,'cabinet');}
      if(r.kind===4){prop(x+100,y+90,130,48,'bench');prop(x+wide-110,y+h-110,130,48,'bench');prop(x+75,y+h-90,44,65,'tank');}
      if(r.kind===5){prop(x+110,y+85,135,55,'desk');prop(x+wide-95,y+h-95,80,60);if(level===2){prop(x+180,y+390,105,55);prop(x+wide-115,y+570,90,50);}}
      if(r.index%2===1)w.pickups.push({x:x+wide-90,y:y+72,type:r.index%3?'ammo':'med',taken:false});
    }
    // Hallway cover leaves two genuine routes around each obstacle.
    if(layout===1){for(const y of[370,660])prop(800,y,52,65,'crate');}
    else if(level===5){for(const y of[400,650])prop(800,y,72,46,'crate');}
    else for(const x of(layout===2?[420,790]:[465,905,1225]))prop(x,525,62,46,'crate');
    w.rebuild=()=>w.solids=[...w.walls,...w.props,...w.doors.map(W.doorBox)];w.rebuild();
    const count=[5,7,8,7,6,8][level];
    for(let i=0;i<count;i++){const r=w.rooms[i%w.rooms.length],kind=(level===2||level===5)&&i===count-1?'captain':i%4===3?'heavy':'rifle';let p={x:r.x+r.w*.55,y:r.y+r.h*.54};if(kind==='captain')p=level===5?{x:800,y:260}:{x:1320,y:450};for(const [dx,dy]of [[0,0],[-80,0],[80,50],[0,-90],[0,90]]){const q={x:p.x+dx,y:p.y+dy};if(W.free(w,q,18)&&!w.enemies.some(e=>Math.hypot(e.x-q.x,e.y-q.y)<40)){p=q;break;}}
      const hp=kind==='captain'?180:kind==='heavy'?80:60;w.enemies.push({id:i,x:p.x,y:p.y,home:{...p},room:r.index,kind,hp,maxHp:hp,r:13,angle:Math.PI*.5,gait:0,shot:1.5+i*.23,memory:0,nav:0,path:[],patrol:0,dead:0,hit:0,flash:0,alert:0});}
    return w;
  };
})();
