(() => {
  const R=SideRenderer.prototype,interior=R.interior;
  R.interior=function(g,time){interior.call(this,g,time);const w=g.world;
    for(const s of w.storeys||[]){if(s.x+s.w<this.camera-60||s.x>this.camera+this.w/this.scale+60)continue;this.gradient(s.x,s.y-124,s.w,124,'#334b5c66','#152937aa');this.line(s.x,s.y-124,s.x+s.w,s.y-124,'#8396a06b',3);this.rect(s.x,s.y-10,s.w,10,'#202f39');
      for(let x=s.x+25;x<s.x+s.w-65;x+=150){this.gradient(x,s.y-98,75,44,'#223d4b','#3f596244');this.line(x+37,s.y-98,x+37,s.y-54,'#8ca0a644',1);this.line(x,s.y-76,x+75,s.y-76,'#8ca0a644',1);if(!w.tasks.some(t=>Math.abs(t.x-(x+30))<105&&Math.abs(t.y-s.y)<10))this.cabinet(x+10,s.y,30,43,'tools');}
      this.text(s.label+' / '+w.spec.place,s.x+18,s.y-111,10,'#b4c5cd');for(const x of[s.x+5,s.x+s.w-7])this.gradient(x,s.y+18,8,w.ground-s.y-18,'#546a76','#273c48');
    }
    for(const s of w.stairs||[]){if(s.end<this.camera-60||s.x>this.camera+this.w/this.scale+60)continue;const rise=Math.abs(s.y1-s.y2),count=Math.max(1,Math.ceil(rise/10)),step=(s.end-s.x)/count;for(let i=0;i<count;i++){const x=s.x+i*step,y=VerticalLevels.surface(s,x+step/2);this.gradient(x,y,step+1,5,'#a6b4b6','#465c69');if(i%4===0)this.line(x+step/2,y+5,x+step/2,w.ground,'#52697477',2);}this.line(s.x,s.y1-41,s.end,s.y2-41,'#7d929d',2);for(let i=0;i<=count;i+=4){const x=s.x+i*step,y=VerticalLevels.surface(s,x);this.line(x,y-41,x,y,'#718995',1.3);}this.text('楼梯',s.x+(s.end-s.x)*.5,VerticalLevels.surface(s,(s.x+s.end)/2)-53,10,'#bbcbd3','center');}
  };
})();
