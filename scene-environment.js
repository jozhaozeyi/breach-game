/* Environment geometry shares coordinates with the playable level. No photo plate. */
(() => {
  const R=window.SideRenderer.prototype;
  R.environmentType=function(world){const place=world.spec.place;if(/医疗|医院|急救/.test(place))return 'medical';if(/档案/.test(place))return 'archive';if(/货站|车站|货运站|运输隧道|月台/.test(place))return 'rail';if(/车库|车辆|机库/.test(place))return 'garage';if(/拘押|监区/.test(place))return 'detention';if(/油|泵|阀门|排水/.test(place))return 'pipes';if(/通信|广播|机房|电台/.test(place)&&!/应急/.test(place))return 'comms';if(/配电|设备|电网|应急|防御/.test(place))return 'power';if(/仓|库房|厂房/.test(place))return 'warehouse';if(/指挥/.test(place))return 'command';return 'office';};
  R.cabinet=function(x,floor,width=42,height=76,style='archive'){
    this.gradient(x,floor-height,width,height,'#647078','#263039');this.line(x,floor-height,x+width,floor-height,'#c3cbd066',.8);this.line(x+width,floor-height,x+width,floor,'#101b23',2);
    for(let y=floor-height+5;y<floor-10;y+=17){this.gradient(x+3,y,width-6,14,'#53616a','#35434b');this.rect(x+width*.4,y+5,width*.22,1.5,'#b5c0c0');if(style==='archive')this.rect(x+5,y+3,7,4,'#c5c4b096');}
  };
  R.environmentProp=function(type,x,y,i){const c=this.c;
    if(type==='office'||type==='command'){
      const width=130;this.gradient(x,y-170,width,75,'#2c3b47','#172a37');this.rect(x+4,y-166,width-8,67,'#76909c22');for(const xx of[x+42,x+88])this.line(xx,y-168,xx,y-98,'#79858c',2);this.line(x+4,y-133,x+width-4,y-133,'#637481',2);this.line(x+6,y-164,x+125,y-103,'#bbd6df16',6);
      this.gradient(x+5,y-40,110,4,'#a3a39a','#555f61');for(const xx of[x+12,x+104])this.limb(xx,y-36,xx,y-1,2,'#2c3841');this.rect(x+40,y-64,30,20,'#101c24');this.gradient(x+42,y-62,26,16,'#436875','#142c39');this.line(x+54,y-44,x+54,y-40,'#76838a',2);this.rect(x+70,y-38,26,2,'#2c3a44');if(type==='command'){this.line(x+44,y-53,x+63,y-53,'#80b29c77',1);this.line(x+47,y-57,x+47,y-48,'#80b29c77',1);}
    }else if(type==='archive'){for(let j=0;j<3;j++)this.cabinet(x+j*45,y,40,78+(j%2)*8);}
    else if(type==='medical'){
      this.gradient(x,y-200,160,200,'#687b7e33','#35495133');this.rect(x+1,y-83,65,3,'#d6dfdb');for(const xx of[x+5,x+58]){this.limb(xx,y-28,xx,y-2,2,'#879496');this.circle(xx,y-1,2,'#23303a');}this.gradient(x,y-35,68,8,'#d3ddd9','#899c9c');this.rect(x+3,y-39,19,5,'#b9cac6');this.cabinet(x+90,y,37,70,'medical');this.line(x+109,y-63,x+109,y-50,'#b5cac3',2);this.line(x+103,y-57,x+115,y-57,'#b5cac3',2);
    }else if(type==='warehouse'){
      this.line(x,y-110,x,y,'#48545b',3);this.line(x+135,y-110,x+135,y,'#48545b',3);for(const yy of[y-75,y-36]){this.gradient(x-4,yy,143,4,'#85908b','#2b3840');for(let j=0;j<3;j++){const xx=x+8+j*42;this.gradient(xx,yy-25,34,25,'#7d7963','#474d42');this.rect(xx+5,yy-25,3,25,'#303c35');this.rect(xx+25,yy-25,3,25,'#303c35');this.rect(xx+12,yy-17,10,1,'#aaa78c');}}}
    else if(type==='comms'){
      for(let j=0;j<3;j++){const xx=x+j*41;this.gradient(xx,y-97,37,97,'#3b4b56','#192831');this.rect(xx+3,y-92,31,87,'#14222c');for(let k=0;k<7;k++){this.rect(xx+5,y-89+k*12,27,9,'#293c48');this.line(xx+8,y-85+k*12,xx+23,y-85+k*12,'#71808b',.6);this.circle(xx+29,y-85+k*12,1,k%3?'#72a58f':'#bfa778');}}}
    else if(type==='pipes'){
      for(let j=0;j<3;j++){const xx=x+15+j*35;this.gradient(xx,y-230,9,230,'#8c999d','#3c505b');for(const yy of[y-200,y-80])this.rect(xx-3,yy,15,4,'#303f49');if(j===1){this.circle(xx+4,y-65,11,'#303e47');c.strokeStyle='#9d8f77';c.lineWidth=2;c.beginPath();c.arc(xx+4,y-65,9,0,Math.PI*2);c.stroke();this.line(xx-3,y-65,xx+11,y-65,'#9d8f77',1);this.line(xx+4,y-72,xx+4,y-58,'#9d8f77',1);}}}
    else if(type==='power'){
      for(let j=0;j<2;j++){const xx=x+j*58;this.gradient(xx,y-90,53,90,'#758086','#34434c');this.line(xx+27,y-87,xx+27,y-3,'#1b2c37',.8);this.rect(xx+32,y-49,3,8,'#acb8ba');this.rect(xx+8,y-73,12,14,'#b7a26b');this.line(xx+12,y-70,xx+15,y-66,'#28343a',1);this.line(xx+15,y-66,xx+12,y-62,'#28343a',1);for(let k=0;k<3;k++)this.line(xx+6,y-16+k*3,xx+22,y-16+k*3,'#1c2d38',.7);}}
    else if(type==='detention'){
      this.gradient(x,y-130,130,110,'#1b2832','#101c25');for(let j=0;j<9;j++)this.line(x+5+j*15,y-129,x+5+j*15,y-21,'#67737b',2);this.line(x,y-65,x+130,y-65,'#6e7b82',2);
    }else if(type==='garage'){
      this.gradient(x,y-51,100,5,'#9da49b','#44545f');for(const xx of[x+8,x+91])this.limb(xx,y-47,xx,y-1,3,'#52626c');this.cabinet(x+115,y,35,58,'tools');this.line(x+8,y-95,x+95,y-95,'#75838b',2);for(let j=0;j<7;j++)this.limb(x+14+j*11,y-92,x+14+j*11,y-78,1,'#a4adb0');
    }else if(type==='rail'){
      this.gradient(x,y-185,145,43,'#293c48','#172a35');this.line(x+10,y-170,x+130,y-170,'#839fae88',2);this.line(x+10,y-159,x+78,y-159,'#839fae88',1);this.gradient(x+15,y-32,105,5,'#7d8c8e','#344650');for(const xx of[x+25,x+108])this.limb(xx,y-26,xx,y-2,2,'#6a7b84');
    }
  };
  R.interior=function(g,time){const c=this.c,w=g.world,ground=w.ground,type=this.environmentType(w),view=this.w/this.scale,left=Math.max(0,this.camera-40),right=Math.min(w.width,this.camera+view+40),wallTop=95;
    // A continuous wall ends exactly at the actual collision floor.
    this.gradient(left,wallTop,right-left,ground-wallTop,type==='medical'?'#536367':'#3a4853','#192630');c.save();c.globalAlpha=.3;c.fillStyle=c.createPattern(this.material,'repeat');c.fillRect(left,wallTop,right-left,ground-wallTop);c.restore();
    this.gradient(left,wallTop,right-left,55,'#131e27','#293842');this.line(left,150,right,150,'#73838e66',2);this.line(left,ground-4,right,ground-4,'#82949f44',1);this.rect(left,ground-12,right-left,12,'#17242d');
    for(let i=Math.max(0,Math.floor(left/520));i<Math.ceil(right/520);i++){const x=i*520,center=x+260;this.gradient(x,155,8,ground-155,'#5a6871','#25323c');this.line(x+9,155,x+9,ground-12,'#b1bdc324',.8);for(let yy=245;yy<ground-20;yy+=95)this.line(x+10,yy,Math.min(x+518,w.width),yy,'#0c182133',.7);
      this.rect(x+168,178,180,7,'#18252e');this.rect(x+173,180,170,2,'#e2dfcf');this.glow(center,197,150,type==='medical'?'#b5dce329':'#e0d1ac20');this.gradient(x+30,190,460,ground-190,'#d1e3e706','#050c141a');
      // Furniture stays on the real floor and leaves task and exit areas clear.
      for(const offset of[45,300]){const xx=x+offset,centerProp=xx+70;const blocked=w.tasks.some(t=>Math.abs(t.x-centerProp)<155)||Math.abs(w.exit.x-centerProp)<145||Math.abs(w.spawn.x-centerProp)<110;if(!blocked&&xx+155<w.width)this.environmentProp(type,xx,ground,i);}
      if(x+45<right)this.text(w.spec.place+' / '+String(i+1).padStart(2,'0'),x+30,224,11,'#a6bac66b');
    }
    // Conduits are behind the playable catwalks; those are drawn from platforms.
    for(const yy of[119,135]){this.gradient(left,yy,right-left,5,'#667781','#273841');this.line(left,yy,right,yy,'#9cacb844',.6);}
    if(type==='rail'){this.line(left,ground-2,right,ground-2,'#b7a66d',2);for(let xx=Math.floor(left/22)*22;xx<right;xx+=22)this.line(xx,ground-7,xx+8,ground-7,'#b7a66d77',1);}
    this.environmentLayout={type,ground,wallBottom:ground,photoBackdrop:false};
  };
})();
