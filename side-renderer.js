(() => {
  const palettes=[['#343c38','#4d5650','#252e2b','#737b6a','#a4a68b'],['#343e40','#515c5b','#283435','#778784','#afbaa8'],['#393b34','#595b4d','#2c3029','#83816c','#b8ad85'],['#303b3c','#4a5958','#253334','#6b8380','#9bb4a8']];
  window.SideRenderer=class {
    constructor(canvas){this.canvas=canvas;this.display=canvas.getContext('2d');this.scene=document.createElement('canvas');this.c=this.scene.getContext('2d');this.sprites=new Map();this.pixelSize=3;this.labels=[];this.camera=0;this.shake=0;this.resize();window.addEventListener('resize',()=>this.resize());}
    resize(){this.w=innerWidth;this.h=innerHeight;this.scale=Math.min(1.5,Math.max(.55,this.h/720));const d=Math.min(devicePixelRatio||1,2);this.canvas.width=this.w*d;this.canvas.height=this.h*d;this.display.setTransform(d,0,0,d,0,0);this.display.imageSmoothingEnabled=false;this.scene.width=Math.ceil(this.w/this.pixelSize);this.scene.height=Math.ceil(this.h/this.pixelSize);this.c.setTransform(1/this.pixelSize,0,0,1/this.pixelSize,0,0);this.c.imageSmoothingEnabled=false;}
    rect(x,y,w,h,color){this.c.fillStyle=color;this.c.fillRect(x,y,w,h);}
    text(text,x,y,size=12,color='#f5edcf',align='left'){const m=this.c.getTransform(),pixel=this.pixelSize;this.labels.push({text,x:Math.round((m.a*x+m.c*y+m.e)*pixel),y:Math.round((m.b*x+m.d*y+m.f)*pixel),size:Math.max(9,Math.round(size*Math.hypot(m.a,m.b)*pixel)),color,align});}
    line(x,y,xx,yy,color,width=1){const c=this.c;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
    circle(x,y,r,color){this.c.fillStyle=color;const cell=2;for(let yy=-r;yy<=r;yy+=cell){const half=Math.floor(Math.sqrt(Math.max(0,r*r-yy*yy))/cell)*cell;this.c.fillRect(Math.round(x-half),Math.round(y+yy),Math.max(cell,half*2),cell);}}
    background(g,time){const p=palettes[g.world.spec.theme];this.rect(0,0,this.w,this.h,'#172822');this.rect(0,this.h*.25,this.w,this.h*.75,p[0]);this.rect(0,this.h*.65,this.w,this.h*.35,p[1]);}
    interior(g,time){const c=this.c,w=g.world,p=palettes[w.spec.theme],view=this.w/this.scale;
      this.rect(0,95,w.width,545,p[1]);this.rect(0,95,w.width,58,'#202c29');this.rect(0,153,w.width,8,p[3]);
      // The back wall, ceiling and room furniture share world coordinates with the floor.
      for(let y=200;y<640;y+=88)this.line(this.camera,y,this.camera+view,y,'#151f1b38',1);
      for(let i=0;i<Math.ceil(w.width/520);i++){const x=i*520;if(x+520<this.camera-60||x>this.camera+view+60)continue;
        this.rect(x+6,161,504,479,p[0]);this.rect(x+15,174,486,446,p[1]);
        for(let yy=258;yy<620;yy+=88)this.line(x+15,yy,x+501,yy,'#1c292450',2);
        this.rect(x+7,161,17,479,p[2]);this.rect(x+496,161,17,479,p[2]);this.rect(x,153,520,12,'#8a928071');
        this.line(x+30,189,x+478,189,'#29342d',10);this.line(x+30,186,x+478,186,'#8d9380',3);
        this.rect(x+155,205,210,13,'#25322b');this.rect(x+161,209,198,5,'#e0ddbc');
        for(let band=0;band<7;band++){const spread=band*14;this.rect(x+158-spread,220+band*42,210+spread*2,42,band<2?'#d9db9b12':band<4?'#d9db9b09':'#d9db9b04');}
        const room=(i+w.index)%4;
        if(room===0){ // Recessed storage bay and stacked equipment cases.
          this.rect(x+70,290,218,277,'#28332d');this.rect(x+79,299,200,260,'#656c5d');for(let yy=307;yy<555;yy+=17)this.line(x+80,yy,x+278,yy,'#353f3380',3);this.rect(x+162,534,33,5,'#b8b59a');
          for(let n=0;n<3;n++){this.rect(x+330+n%2*63,583-Math.floor(n/2)*52,58,49,'#837252');this.rect(x+336+n%2*63,590-Math.floor(n/2)*52,46,5,'#b19d70');this.rect(x+354+n%2*63,583-Math.floor(n/2)*52,8,49,'#4d5742');}
        }else if(room===1){ // Office partition with internal glass and a filing cabinet.
          this.rect(x+60,292,276,155,'#27372f');this.rect(x+68,300,260,139,'#7a8a7c');for(const xx of[154,244])this.rect(x+xx,300,5,139,'#384d40');this.rect(x+68,368,260,5,'#384d40');
          this.rect(x+95,525,220,11,'#938c6d');for(const xx of[106,293])this.rect(x+xx,536,8,98,'#344639');this.rect(x+161,485,65,39,'#283b33');this.rect(x+166,490,55,28,'#8b9c8a');this.rect(x+185,524,17,6,'#314437');
          this.rect(x+374,430,83,203,'#77816a');for(let n=0;n<4;n++){this.rect(x+380,439+n*47,71,39,'#5d6a57');this.rect(x+402,455+n*47,25,4,'#b9b79b');}
        }else if(room===2){ // Conventional server cabinets with ventilation slots.
          for(let n=0;n<3;n++){const xx=x+82+n*112;this.rect(xx,337,91,295,'#273931');this.rect(xx+7,346,77,274,'#435448');for(let row=0;row<8;row++){this.rect(xx+13,353+row*32,65,24,'#283c32');for(let k=0;k<5;k++)this.rect(xx+18+k*8,361+row*32,3,9,'#596d55');this.circle(xx+69,360+row*32,2,'#b4bf83');}}
        }else{ // Maintenance bay, pipes, wall control box and warning placard.
          for(let n=0;n<3;n++){const xx=x+86+n*35;this.rect(xx,270,15,363,'#7e8b7b');this.rect(xx+3,273,3,357,'#b0baa270');for(const yy of[320,490])this.rect(xx-5,yy,25,8,'#394d3d');}
          this.rect(x+272,367,152,168,'#77816a');this.rect(x+280,375,136,152,'#52634e');this.line(x+349,376,x+349,525,'#273f2e',2);this.rect(x+327,443,5,25,'#b9bc9b');this.circle(x+397,393,5,'#d4be7c');
          this.rect(x+289,282,115,45,'#c2b37b');this.text('设备检修区',x+346,311,13,'#303f30','center');
        }
        this.text(['仓储通道','办公走廊','通信机房','设备检修间'][room],x+42,246,12,'#c2c6ad');this.text('B'+String(i+1).padStart(2,'0'),x+450,248,18,'#c2c6ad66');
        this.rect(x+25,626,470,14,'#2d4032');this.line(x+25,626,x+495,626,'#a4ab8555',2);
      }
      // Exposed ceiling services continue across room boundaries.
      for(const y of[115,137]){this.rect(this.camera,y,view,9,'#677565');this.rect(this.camera,y,view,2,'#a5b09966');}
    }
    human(p,color='#68765b',enemy=false,time=0){const c=this.c,h=p.h||48,face=p.facing||1,frame=Math.abs(p.vx||0)>12?Math.floor(time*9)%4:0,gun=p.gunLength||28,key=[color,enemy,frame,gun].join(':');
      if(!this.sprites.has(key)){const sprite=document.createElement('canvas');sprite.width=48;sprite.height=28;const s=sprite.getContext('2d'),put=(x,y,w,h,col)=>{s.fillStyle=col;s.fillRect(x,y,w,h);};
        const outline='#172a24',boots='#172820',skin='#d5b58a',shade='#927754';
        put(15,2,10,2,outline);put(13,4,14,4,outline);put(14,3,11,4,enemy?'#85805c':'#829265');put(14,4,5,2,enemy?'#aaa17a':'#b2bd85');put(13,7,15,2,outline);
        put(16,9,9,6,outline);put(17,9,8,4,skin);put(24,10,3,2,skin);put(23,9,2,2,outline);put(16,11,3,3,shade);
        put(12,14,14,9,outline);put(13,14,12,8,color);put(12,14,3,7,enemy?'#635b43':'#4d6748');put(16,15,6,6,enemy?'#b2a175':'#a8b280');put(17,16,2,2,'#5c714c');put(20,16,2,2,'#5c714c');
        put(10,14,3,7,outline);put(10,15,3,5,color);put(12,20,4,2,skin);put(21,17,8,4,outline);put(21,17,7,2,skin);
        if(p.melee){put(24,18,4,2,'#8f815c');put(28,16,2,5,outline);put(30,17,9,2,'#d7ded3');put(30,19,7,1,'#849386');}else{const length=Math.round(gun/2);put(24,17,length,3,outline);put(25,17,Math.max(3,length-3),1,'#849386');put(27,20,2,3,'#233b2d');put(23,19,4,2,'#8f815c');}
        const stride=[0,2,0,-2][frame];put(14,22,5,4,outline);put(20,22,5,4,outline);put(14+stride,23,4,3,color);put(20-stride,23,4,3,color);put(13+stride,26,6,2,boots);put(20-stride,26,7,2,boots);
        this.sprites.set(key,sprite);
      }
      c.save();c.translate(Math.round(p.x/2)*2,Math.round(p.y/2)*2);if(face<0)c.scale(-1,1);c.drawImage(this.sprites.get(key),0,0,48,28,-40,-h,96,h);if(p.flash>0){this.rect(30,-h*.57,10,4,'#ffe6a3');this.rect(34,-h*.57-4,4,12,'#f6c777');}c.restore();if(p.stun>0)this.text('✦',p.x,p.y-h-13,16,'#f8d884','center');
    }
    object(t,active,g,time){const c=this.c,x=t.x,y=t.y,col=t.done?'#648b6b':active?'#efd18d':'#a4aea0';
      if(t.kind==='destroy'){this.rect(x-27,y-56,54,56,t.done?'#484d43':'#5a655a');this.rect(x-20,y-49,40,28,'#303d38');for(let i=0;i<3;i++)this.rect(x-15+i*12,y-43,7,15,t.done?'#313b32':'#c4ae75');this.rect(x-30,y-63,60,4,'#292f29');this.rect(x-30,y-63,60*(t.hp/t.maxHp),4,'#c7b079');}
      else if(t.kind==='take'){this.rect(x-17,y-27,34,26,t.carry?'#92774d':'#746b52');this.rect(x-20,y-29,40,5,'#c1ae81');this.rect(x-3,y-27,6,26,'#39473d');}
      else if(t.fire){this.rect(x-24,y-25,48,25,'#554c3b');if(!t.done)for(let i=0;i<6;i++){const a=Math.sin(time*9+i)*5;this.circle(x-20+i*8,y-20-a,9,'#dc9455');this.circle(x-18+i*8,y-15-a,5,'#efc676');}}
      else if(t.healNPC){this.human({x,y,h:28,facing:1},'#847b60',false,time);this.text('+',x,y-38,22,'#e8d2b0','center');}
      else if(['escort','vehicle','train','clear','snipers','drones','officer','capture','boss','escapeBlast'].includes(t.kind)){this.rect(x-22,y-5,44,5,col);}
      else {this.rect(x-18,y-48,36,48,'#61695a');this.rect(x-12,y-42,24,19,'#233d39');this.rect(x-9,y-39,18,2,t.done?'#819881':'#c9c593');this.rect(x-9,y-32,12,2,'#819881');this.circle(x+8,y-14,3,t.done?'#76a27a':'#d7b371');}
      if(!t.done&&active){const bob=Math.sin(time*3)*4;this.text('▼',x,y-82+bob,16,col,'center');this.text(t.kind==='destroy'?'射击目标':t.kind==='take'?'F 拾取':t.kind==='hold'?'F 开始':'任务点',x,y-66+bob,10,col,'center');}
      if(t.progress>0&&!t.done){this.rect(x-35,y-74,70,4,'#263c33');this.rect(x-35,y-74,70*Math.min(1,t.progress/(t.seconds||1)),4,'#e8cf91');}
    }
    vehicle(v,train=false){const x=v.x,y=v.y;this.rect(x-68,y-54,136,42,train?'#6b7369':'#7e805e');this.rect(x+28,y-77,40,42,'#6a7057');this.rect(x+34,y-71,27,21,'#a8bbaf');this.rect(x-61,y-49,80,29,'#4e5c4c');for(const d of[-45,45]){this.circle(x+d,y-10,15,'#26342e');this.circle(x+d,y-10,7,'#84917c');}this.rect(x-72,y-17,144,7,'#3d4d40');if(v.hp<100){this.rect(x-45,y-94,90,4,'#303d33');this.rect(x-45,y-94,90*v.hp/100,4,'#d7b675');}}
    draw(g,time,dt=0){if(!g.world)return;this.labels=[];const c=this.c;this.background(g,time);const scale=this.scale,view=this.w/scale;
      const target=Math.max(0,Math.min(g.world.width-view,g.player.x-view*.36));this.camera+=(target-this.camera)*(1-Math.exp(-Math.max(.016,dt)*7));this.camera=Math.max(0,Math.min(g.world.width-view,this.camera));
      c.save();c.translate(0,this.h-(this.bottomInset??125*scale));c.scale(scale,scale);c.translate(-this.camera,-g.world.ground);const world=g.world;
      this.interior(g,time);
      // Continuous indoor flooring with raised maintenance platforms.
      for(const p of world.platforms){this.rect(p.x,p.y,p.w,p.h,p.ground?'#4b5546':'#6b7564');this.rect(p.x,p.y,p.w,7,p.ground?'#a3a38a':'#c0b294');this.rect(p.x,p.y+7,p.w,4,'#303e33');if(p.ground){for(let x=p.x+22;x<p.x+p.w;x+=65){this.line(x,p.y+28,x+18,p.y+42,'#7a82624d',2);this.rect(x+15,p.y+72,21,9,'#333e3438');}}else{this.rect(p.x+8,p.y+p.h-5,p.w-16,5,'#364738');for(let x=p.x+12;x<p.x+p.w;x+=48)this.line(x,p.y+7,x+20,p.y+p.h,'#404d3e',3);}}
      // Wall-mounted service signs and platform brackets reinforce the enclosed space.
      for(const platform of world.platforms)if(!platform.ground&&!platform.storey){for(const x of[platform.x+14,platform.x+platform.w-16]){this.line(x,platform.y+platform.h,x,platform.y+55,'#354b3b',5);this.line(x,platform.y+55,x+30,platform.y+platform.h,'#78886c',4);}this.rect(platform.x+8,platform.y+7,platform.w-16,3,'#d0bd8090');}
      if(world.index===18&&!g.flags.gridOff){for(let x=2100;x<2400;x+=45)this.line(x,640,x,510,'#d4bf67',3);this.text('高压危险',2220,494,13,'#e0bd65','center');}
      if(world.index===23){for(const t of world.tasks.slice(1))if(!t.done&&(g.flags.scanned||Math.abs(t.x-g.player.x)<180)){this.circle(t.x,635,13,'#564d3a');this.circle(t.x,631,5,'#c38965');}}
      for(const pickup of world.pickups)if(!pickup.taken){this.rect(pickup.x-13,pickup.y-22,26,21,pickup.type==='med'?'#a9b09a':'#9d8a5e');this.text(pickup.type==='med'?'+':'|||',pickup.x,pickup.y-7,15,'#f0e5c5','center');}
      for(const t of world.tasks)this.object(t,t===g.task(),g,time);
      for(const e of world.enemies)if(e.hp>0){if(e.kind==='drone'){this.rect(e.x-15,e.y-20,30,11,'#3e4c43');this.line(e.x-29,e.y-23,e.x+29,e.y-23,'#35483c',3);for(const dx of[-27,27])this.line(e.x+dx-10,e.y-25,e.x+dx+10,e.y-25,'#b7c5a1',3);this.circle(e.x,e.y-10,3,'#ce995f');}else this.human(e,e.kind==='boss'?'#5d6050':e.kind==='commander'?'#83765a':'#897b62',true,time);if(e.hp<e.maxHp){this.rect(e.x-19,e.y-e.h-10,38,3,'#344438');this.rect(e.x-19,e.y-e.h-10,38*e.hp/e.maxHp,3,'#d3aa76');}}
      if(g.follower)this.human({...g.follower,role:'follower'},'#a9a18a',false,time);
      if(g.vehicle)this.vehicle(g.vehicle,g.task()?.kind==='train');
      if(g.player.invuln<=0||Math.floor(time*15)%2===0)this.human({...g.player,role:'player',reload:g.fireReload,aim:g.weapon().melee?0:g.keys.has('KeyQ')?-.45:g.keys.has('KeyE')?.35:(g.aimAngle||0),gunLength:[28,36,23,48,16,20][g.weaponIndex],melee:g.weapon().melee,flash:g.weapon().melee?0:g.flash},'#687958',false,time);
      if(g.weapon().melee&&g.flash>0){const p=g.player;this.line(p.x+p.facing*25,p.y-50,p.x+p.facing*65,p.y-25,'#e9eddb',3);this.line(p.x+p.facing*65,p.y-25,p.x+p.facing*35,p.y-10,'#c2cdb0',2);}
      if(g.classId==='scout'&&g.skillTime>0)for(const e of world.enemies)if(e.hp>0){this.text('▼ '+Math.ceil(e.hp)+' HP',e.x,e.y-e.h-20,12,'#f6db85','center');this.line(e.x-16,e.y-e.h-12,e.x+16,e.y-e.h-12,'#f6db85',2);}
      if(g.carrying)this.rect(g.player.x-11,g.player.y-67,22,18,'#b09a6c');
      for(const b of g.bullets){this.line(b.x-b.vx*.012,b.y-b.vy*.012,b.x,b.y,b.team==='player'?'#ffe2a1':'#e4ad7a',b.team==='player'?2:2.5);}
      for(const grenade of g.grenades){this.circle(grenade.x,grenade.y,6,'#d4c38b');this.line(grenade.x,grenade.y-5,grenade.x+3,grenade.y-9,'#5b6d50',2);}
      for(const p of g.particles){this.circle(p.x,p.y,p.r*Math.max(.1,p.life),p.color);}
      const exit=world.exit;this.rect(exit.x-40,500,80,140,'#1f3329');this.rect(exit.x-33,508,66,132,g.ready?'#6d8968':'#465d4a');this.rect(exit.x-24,523,48,44,'#253e31');this.rect(exit.x+18,584,5,20,'#c3c7a0');this.rect(exit.x-38,475,76,19,'#456e50');this.text('安全出口 →',exit.x,489,10,'#e2e5bd','center');this.text(g.ready?'F 撤离':'撤离门',exit.x,460,12,g.ready?'#f4e5aa':'#b7c3ae','center');
      if(g.timer!==null)this.text('剩余 '+Math.ceil(g.timer)+' 秒',g.player.x,g.player.y-91,14,'#f4c788','center');
      if(g.flags.flood&&!g.flags.drained){const rise=Math.max(0,70-(g.timer||0))*.8;this.rect(this.camera,640-rise,view,180,'#739e9b55');}
      c.restore();
      if(world.spec.dark&&!g.flags.lightsOn){c.save();const screenX=(g.player.x-this.camera)*scale,screenY=this.h-(this.bottomInset??125*scale)-40*scale;const dark=c.createRadialGradient(screenX,screenY,80,screenX,screenY,460*scale);dark.addColorStop(0,'#07130b00');dark.addColorStop(1,'#07130bc9');this.rect(0,0,this.w,this.h,dark);c.restore();}
      if(g.hint&&g.mode==='playing'){this.text(g.hint,this.w/2,this.bottomInset?this.h-this.bottomInset-58:this.h-94*scale,12,'#f8ebca','center');}
      if(g.mode==='title'){const fade=c.createLinearGradient(0,0,this.w*.75,0);fade.addColorStop(0,'#101923ed');fade.addColorStop(.55,'#14202bcc');fade.addColorStop(1,'#14202b00');this.rect(0,0,this.w,this.h,fade);}
      if(g.hitFlash>0)this.rect(0,0,this.w,this.h,`rgba(155,53,35,${g.hitFlash*.5})`);
      // Enlarge the low-resolution scene without filtering; labels stay legible.
      const out=this.display;out.imageSmoothingEnabled=false;out.drawImage(this.scene,0,0,this.scene.width*this.pixelSize,this.scene.height*this.pixelSize);for(const label of this.labels){out.fillStyle=label.color;out.font=`500 ${label.size}px "Segoe UI","Microsoft YaHei",sans-serif`;out.textAlign=label.align;out.fillText(label.text,label.x,label.y);}out.textAlign='left';
    }
  };
})();




