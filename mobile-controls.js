/* Pointer capture keeps independent fingers on movement and combat controls. */
(() => {
  const g=window.SIDE_GAME,$=id=>document.getElementById(id),root=document.documentElement,stick=$('moveStick'),thumb=$('stickThumb'),controls=$('mobileControls');
  let stickId=null,stickUp=false,codeDirection=null,aim=0,updated=-Infinity;
  const held=new Map(),stickKeys=new Set(),aimKeys=new Set(),keyboardKeys=new Set();
  const ownKey=(set,key,down)=>{if(down){set.add(key);g.keys.add(key);}else{set.delete(key);if(!keyboardKeys.has(key)&&![...held.values()].includes(key)&&!stickKeys.has(key)&&!aimKeys.has(key))g.keys.delete(key);}};
  const M=window.MobileControls={enabled:false,
    setEnabled(on){this.reset();this.enabled=!!on;root.classList.toggle('touch-input',this.enabled);g.renderer.resize();$('touchMode').textContent=this.enabled?'触控 开':'触控 关';$('touchMode').setAttribute('aria-pressed',String(this.enabled));$('start').querySelector('span').textContent=this.enabled?'点击出发':'ENTER ↵';document.querySelector('.title-foot span').textContent=this.enabled?'左手移动 · 右手战斗 · 横竖屏均可游玩':'SHIFT 冲刺 · Q / E 向上 / 下瞄准';this.update(true);},
    reset(){for(const code of new Set([...held.values(),...stickKeys,...aimKeys]))if(!keyboardKeys.has(code))g.keys.delete(code);held.clear();stickKeys.clear();aimKeys.clear();stickId=null;stickUp=false;codeDirection=null;aim=0;thumb.style.transform='translate(0px,0px)';for(const b of controls.querySelectorAll('.pressed'))b.classList.remove('pressed');$('mobileAim').textContent='平瞄';$('mobileAim').setAttribute('aria-pressed','false');},
    release(id){const code=held.get(id);held.delete(id);if(code&&!keyboardKeys.has(code)&&!stickKeys.has(code)&&!aimKeys.has(code)&&![...held.values()].includes(code))g.keys.delete(code);},
    update(force=false){const now=performance.now();if(!force&&now-updated<120)return;updated=now;const panel=!!g.panel&&g.mode==='playing';controls.classList.toggle('code-input',panel);document.querySelector('.movement-pad small').textContent=panel?'输入方向 · 回中后再拨':'左右移动 · 上拨跳跃';if(panel&&this.enabled)$('codePanel').querySelector('small').textContent='按顺序点方向键或拨摇杆 · 退出面板可取消';else if(!panel)$('codePanel').querySelector('small').textContent='按顺序输入方向键 · F 退出';$('mobileFire').textContent=g.weapon().melee?'挥刀':'开火';$('mobileWeapon').textContent=g.weaponIndex===g.equipped[0]?'切副武器':'切主武器';$('mobileSkill').textContent=g.skillCd>0?'技能 '+Math.ceil(g.skillCd)+'s':'技能';$('mobileSkill').setAttribute('aria-disabled',String(g.skillCd>0));$('mobileGrenade').textContent=g.world?.spec.capture?'震撼弹':'手雷';},
    action(name){if(!this.enabled||g.mode!=='playing')return;if(g.panel&&name!=='interact')return;const actions={jump:()=>g.jump(),interact:()=>g.interact(),skill:()=>g.useSkill(),reload:()=>g.reload(),grenade:()=>g.throwGrenade(),heal:()=>g.useMed(),dash:()=>g.dash(),switchWeapon:()=>g.switchWeapon(g.equipped[g.weaponIndex===g.equipped[0]?1:0]),aim:()=>{for(const code of [...aimKeys])ownKey(aimKeys,code,false);aim=(aim+1)%3;if(aim)ownKey(aimKeys,aim===1?'KeyQ':'KeyE',true);$('mobileAim').textContent=['平瞄','上瞄','下瞄'][aim];$('mobileAim').setAttribute('aria-pressed',String(aim!==0));}};actions[name]?.();this.update(true);}
  };
  const inputActive=()=>M.enabled&&g.mode==='playing';
  const capture=(element,id)=>{try{element.setPointerCapture(id);}catch(_){}};
  const move=e=>{if(e.pointerId!==stickId||!inputActive())return;e.preventDefault();const box=stick.getBoundingClientRect(),radius=box.width*.36;let x=(e.clientX-box.left-box.width/2)/radius,y=(e.clientY-box.top-box.height/2)/radius;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}thumb.style.transform=`translate(${x*radius}px,${y*radius}px)`;
    if(g.panel){for(const code of [...stickKeys])ownKey(stickKeys,code,false);const dir=Math.max(Math.abs(x),Math.abs(y))<.5?null:Math.abs(x)>Math.abs(y)?x<0?'ArrowLeft':'ArrowRight':y<0?'ArrowUp':'ArrowDown';if(dir&&dir!==codeDirection)g.inputCode(dir);codeDirection=dir;return;}
    ownKey(stickKeys,'KeyA',x<-.2);ownKey(stickKeys,'KeyD',x>.2);ownKey(stickKeys,'KeyS',y>.6);const up=y<-.55;if(up&&!stickUp)g.jump();stickUp=up;
  };
  stick.addEventListener('pointerdown',e=>{if(!inputActive()||stickId!==null)return;e.preventDefault();stickId=e.pointerId;capture(stick,e.pointerId);move(e);});stick.addEventListener('pointermove',move);
  const releaseStick=e=>{if(e.pointerId!==stickId)return;stickId=null;stickUp=false;codeDirection=null;for(const code of [...stickKeys])ownKey(stickKeys,code,false);thumb.style.transform='translate(0px,0px)';};
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,releaseStick);
  for(const button of controls.querySelectorAll('button')){
    button.addEventListener('pointerdown',e=>{if(!inputActive())return;e.preventDefault();capture(button,e.pointerId);button.classList.add('pressed');if(button.dataset.mobileCode){if(g.panel)g.inputCode(button.dataset.mobileCode);return;}if(button.dataset.mobileHold){if(g.panel)return;held.set(e.pointerId,button.dataset.mobileHold);g.keys.add(button.dataset.mobileHold);g.shoot();}else M.action(button.dataset.mobileAction);});
    const release=e=>{button.classList.remove('pressed');M.release(e.pointerId);};for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
    button.addEventListener('click',e=>{if(e.detail!==0||!inputActive())return;if(button.dataset.mobileAction)M.action(button.dataset.mobileAction);else if(button.dataset.mobileCode&&g.panel)g.inputCode(button.dataset.mobileCode);else if(button.dataset.mobileHold&&!g.panel)g.shoot();});
  }
  $('touchMode').onclick=()=>{saved=M.enabled?'off':'on';M.setEnabled(!M.enabled);try{localStorage.setItem('breach-touch-mode',saved);}catch(_){}};
  let saved=null;try{saved=localStorage.getItem('breach-touch-mode');}catch(_){}M.setEnabled(saved?saved==='on':navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches);
  window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!M.enabled&&saved!=='off'){M.setEnabled(true);}},{capture:true});
  window.addEventListener('keydown',e=>{if(g.mode==='playing'&&!['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName))keyboardKeys.add(e.code);},{capture:true});window.addEventListener('keyup',e=>{keyboardKeys.delete(e.code);if(stickKeys.has(e.code)||aimKeys.has(e.code)||[...held.values()].includes(e.code))g.keys.add(e.code);});
  for(const event of ['blur','resize','pagehide'])window.addEventListener(event,()=>{keyboardKeys.clear();M.reset();});document.addEventListener('visibilitychange',()=>{if(document.hidden){keyboardKeys.clear();M.reset();}});
  new MutationObserver(()=>{if(g.mode!=='playing')M.reset();M.update(true);}).observe($('overlay'),{attributes:true,attributeFilter:['hidden']});
  controls.addEventListener('contextmenu',e=>e.preventDefault());stick.addEventListener('contextmenu',e=>e.preventDefault());
})();


