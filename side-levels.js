/* Each operation has its own ordered objective chain and completion rules. */
(() => {
  const task=(kind,label,extra={})=>({kind,label,...extra});
  const use=(label,extra)=>task('use',label,extra),hold=(label,seconds,extra)=>task('hold',label,{seconds,...extra}),take=(label,extra)=>task('take',label,extra),shoot=(label,hp=150,extra)=>task('destroy',label,{hp,...extra}),code=(label,sequence,extra)=>task('code',label,{sequence,...extra});
  const levels=[
    {title:'大楼营救',place:'办公楼 · 安全室',brief:'解救被困记者，再带他穿过楼内走廊。记者距离太远会停下等待。',theme:0,tasks:[use('打开安全屋，解救记者',{release:true}),task('escort','护送记者到接应点')]},
    {title:'失落的证据',place:'档案楼 · 档案室',brief:'在三个档案柜中找到证据，最后把资料封存到接应箱。',theme:1,tasks:[take('搜查一楼档案柜'),take('搜查封存室档案柜'),take('搜查经理室档案柜'),use('封存三份证据',{requiresItems:3})]},
    {title:'弹药库爆破',place:'仓储楼 · 弹药库',brief:'在两处库房安装炸药，引爆后八秒内撤到安全线外。',theme:2,tasks:[hold('安装西库炸药',2),hold('安装东库炸药',2),use('启动八秒引爆倒计时',{blast:true}),task('escapeBlast','远离弹药库爆炸区')]},
    {title:'列车站拆弹',place:'地下货站 · 封闭月台',brief:'先启动拆弹计时，再输入两组不同的方向键，限时九十秒。',theme:3,tasks:[use('接入炸弹定位器',{timer:90}),code('拆除月台炸弹',['ArrowLeft','ArrowUp','ArrowRight']),code('拆除信号房炸弹',['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'],{stopTimer:true})]},
    {title:'电网重连',place:'设备楼 · 配电室',brief:'必须按“总闸、支线、断路器”的顺序恢复供电，最后检查控制柜。',theme:1,tasks:[use('接通总闸',{flag:'mainPower'}),use('接通民用支线'),use('复位断路器'),hold('检查电压稳定',5)]},
    {title:'电台防线',place:'地下设施 · 通信室',brief:'启动野战电台后留在接收范围内坚守二十四秒，抵挡三波增援。',theme:2,tasks:[hold('启动电台并坚守接收区',24,{waves:3,radius:180})]},
    {title:'重载搬运',place:'港区仓库 · 物资间',brief:'分两次搬运沉重的补给箱。携带时无法冲刺，跳跃能力略微降低。',theme:3,tasks:[take('搬起第一箱补给',{carry:true}),use('交付第一箱补给',{deliver:true}),take('搬起第二箱补给',{carry:true}),use('交付第二箱补给',{deliver:true})]},
    {title:'切断干扰',place:'设备楼 · 干扰机房',brief:'先关闭干扰器装甲，再用武器摧毁两台干扰设备。',theme:2,tasks:[use('关闭干扰站装甲保护',{flag:'jammerOpen'}),shoot('摧毁移动干扰器',180),shoot('摧毁主干扰机',240)]},
    {title:'军官的门禁卡',place:'边检大楼 · 门禁大厅',brief:'击败巡逻军官，拾取其门禁卡，再打开边检大门。',theme:0,tasks:[task('officer','击败携带门禁卡的军官'),take('拾取军官门禁卡',{flag:'keycard'}),use('刷卡打开边检大门',{requiresFlag:'keycard'})]},
    {title:'车队重启',place:'地下车库 · 车辆检修区',brief:'修好运输车，护送车辆到检查点。车辆受攻击会损坏，F 可维修。',theme:0,tasks:[hold('修复运输车发动机',4),task('vehicle','护送运输车通过封锁线',{vehicle:true})]},
    {title:'夹层信号校准',place:'广播楼 · 设备夹层',brief:'从室内检修平台跳到设备夹层，对准天线，再保持位置完成信号校准。',theme:1,tasks:[use('启用夹层检修设备'),hold('登上设备夹层并校准天线',8,{elevated:true,radius:95})]},
    {title:'战地急救',place:'医疗楼 · 急救室',brief:'带着三份急救物资救治三名伤员。按 F 后保持靠近完成治疗。',theme:0,tasks:[hold('救治第一名伤员',3,{healNPC:true}),hold('救治第二名伤员',3,{healNPC:true}),hold('救治第三名伤员',3,{healNPC:true})]},
    {title:'管线泄压',place:'油库 · 输油泵房',brief:'关闭进油阀，开启泄压阀，等压力归零后才能炸毁输油泵。',theme:2,tasks:[use('关闭进油阀'),hold('打开泄压阀，等待压力归零',7),shoot('摧毁停机输油泵',200)]},
    {title:'机密传递',place:'办公楼 · 联络走廊',brief:'领取密件后开始七十五秒倒计时，必须把密件交给另一端的联络员。',theme:0,tasks:[take('领取加密密件',{timer:75,carry:true}),use('限时交付密件',{deliver:true,stopTimer:true})]},
    {title:'据点清剿',place:'厂房内部 · 武装据点',brief:'清除所有守军后，检查指挥桌，确认据点安全。',theme:2,tasks:[task('clear','消灭据点全部守军'),use('检查指挥桌，确认清场')]},
    {title:'同步送电',place:'地下车站 · 应急机房',brief:'从第一台发电机启动起，十八秒内开启另外两台，否则必须重来。',theme:3,tasks:[use('启动第一台发电机',{syncStart:18}),use('启动第二台发电机'),use('启动第三台发电机',{syncEnd:true})]},
    {title:'高处的枪声',place:'仓库 · 高架检修通道',brief:'找出三名占据检修夹层的狙击手，逐一清除后撤离。M24 适合远距离作战。',theme:1,tasks:[task('snipers','消灭三名夹层狙击手')]},
    {title:'输送机抢修',place:'仓储楼 · 输送设备间',brief:'寻找替换面板和工具包，修复输送机并在控制台确认运转。',theme:3,tasks:[take('搬运替换面板',{carry:true}),take('找到设备工具包'),hold('安装面板并固定连接',5,{flag:'conveyorFixed',deliver:true}),use('在控制台确认输送机运转',{requiresFlag:'conveyorFixed'})]},
    {title:'带电通道',place:'设备层 · 电网隔离室',brief:'电网会造成持续伤害。先关闭控制箱，再穿过围栏取回设备。',theme:2,tasks:[use('关闭通道电网',{flag:'gridOff'}),take('穿过断电通道取回侦测器'),use('把侦测器放回回收箱',{requiresItems:1})],hazard:'electric'},
    {title:'仓库灭火',place:'仓储楼 · 失火库房',brief:'取出灭火器，逐个扑灭三个火点。灭火时保持靠近，火焰仍会伤人。',theme:2,tasks:[take('领取灭火器',{flag:'extinguisher'}),hold('扑灭西侧火点',3,{fire:true}),hold('扑灭中部火点',3,{fire:true}),hold('扑灭东侧火点',3,{fire:true})]},
    {title:'无人机来袭',place:'机库内部 · 无人机检修区',brief:'先激活识别终端，再击落四架机库内的无人机。按空格会辅助瞄准前方目标。',theme:3,tasks:[use('激活无人机识别终端'),task('drones','击落四架来袭无人机')]},
    {title:'安静地进入',place:'拘押楼 · 内部监区',brief:'报警器断电前不能开枪或投雷。先切断报警，再打开牢门救人。',theme:1,tasks:[use('潜入并切断报警电源',{flag:'alarmOff'}),use('打开拘押室牢门',{release:true}),task('escort','护送获救人员离开')],silent:true},
    {title:'货运列车',place:'地下货运站 · 运输隧道',brief:'取得列车时刻表，登上货车，启动列车后随车驶到终点站。',theme:3,tasks:[take('取得列车时刻表'),use('解锁列车驾驶室'),task('train','登上货车随列车抵达终点')]},
    {title:'诡雷走廊',place:'地下设施 · 布雷走廊',brief:'开启探雷仪后，按提示逐个排除三枚地雷。未扫描前接近雷区很危险。',theme:0,tasks:[use('开启便携探雷仪',{flag:'scanned'}),code('排除第一枚地雷',['ArrowUp','ArrowLeft']),code('排除第二枚地雷',['ArrowRight','ArrowDown','ArrowLeft']),code('排除第三枚地雷',['ArrowLeft','ArrowUp','ArrowDown'])],hazard:'mines'},
    {title:'备用电池',place:'航站楼 · 应急控制室',brief:'搬起两块电池，分别送到两个备用电源插槽，最后开启导航灯。',theme:1,tasks:[take('搬起第一块备用电池',{carry:true}),use('安装第一块电池',{deliver:true}),take('搬起第二块备用电池',{carry:true}),use('安装第二块电池并开启导航灯',{deliver:true})]},
    {title:'医院补给线',place:'医院内部 · 急救门厅',brief:'在物资站取到药箱，送往医院，并守护医护人员完成急救。',theme:0,tasks:[take('领取急救药箱',{carry:true}),use('把药箱交给医护人员',{deliver:true}),hold('守护急救室门口，等待急救完成',15,{waves:2,radius:160})]},
    {title:'燃油泄漏',place:'储油站 · 阀门控制室',brief:'按顺序关闭三处阀门，观察油压下降，再带走取样瓶。',theme:2,tasks:[use('关闭上游供油阀'),use('关闭回流阀'),hold('缓慢关闭主阀，稳定油压',9),take('收集无泄漏的燃油样本')]},
    {title:'货梯接应',place:'地下设施 · 货梯大厅',brief:'取得接应信号灯，标记货梯入口并守住二十秒，接应货梯抵达后撤离。',theme:0,tasks:[take('取得接应信号灯',{flag:'flare'}),use('标记安全候梯区',{requiresFlag:'flare'}),hold('守住货梯入口直到接应抵达',20,{waves:3,radius:170})]},
    {title:'数据上传',place:'通信中心 · 数据机房',brief:'找到访问码，上传现场数据。上传期间必须靠近终端，开火或受伤会暂停。',theme:1,tasks:[take('取得通信终端访问码',{flag:'access'}),hold('上传现场数据',14,{upload:true,radius:115})]},
    {title:'装甲炮塔',place:'地下堡垒 · 防御设备间',brief:'正面装甲无法击穿。先切断炮塔电源，拿取破甲弹，再摧毁炮塔。',theme:2,tasks:[use('绕至侧面关闭炮塔电源',{flag:'turretOff'}),take('领取破甲弹药',{armorRounds:true}),shoot('摧毁断电后的装甲炮塔',420,{armored:true})]},
    {title:'泵站涨水',place:'地下设施 · 排水泵房',brief:'开启控制系统后水位开始上升。七十秒内依次启动三台排水泵。',theme:3,tasks:[use('接入泵站控制系统',{timer:70,flag:'flood'}),hold('启动第一台排水泵',3),hold('启动第二台排水泵',3),hold('启动第三台排水泵',3,{stopTimer:true,flag:'drained'})]},
    {title:'停电大楼',place:'办公楼 · 停电楼层',brief:'停电使远处视线受限。收集两枚保险丝并装入配电箱，恢复楼内照明。',theme:1,tasks:[take('找到第一枚保险丝'),take('找到第二枚保险丝'),hold('安装保险丝并恢复照明',4,{flag:'lightsOn'})],dark:true},
    {title:'活捉指挥官',place:'指挥楼 · 内部指挥室',brief:'指挥官必须活着。用 G 在其附近投掷震撼弹，靠近按 F 控制，再押送撤离。',theme:0,tasks:[task('capture','震撼并控制指挥官'),task('escort','押送指挥官到撤离点')],capture:true},
    {title:'逐室推进',place:'办公楼 · 三个连通厅室',brief:'依次占领三个厅室。每个厅室需要保持在标记区域六秒，期间会有敌军反扑。',theme:1,tasks:[hold('占领第一厅室',6,{waves:1,radius:145}),hold('占领第二厅室',6,{waves:1,radius:145}),hold('占领第三厅室',6,{waves:1,radius:145})]},
    {title:'信号定位',place:'通信楼 · 总控机房',brief:'读取三处天线上的方向线索，再按正确顺序解锁定位终端。',theme:3,tasks:[use('读取西天线：↑',{clue:'↑'}),use('读取中天线：←',{clue:'←'}),use('读取东天线：→',{clue:'→'}),code('输入三处天线提供的方向线索',['ArrowUp','ArrowLeft','ArrowRight'])]},
    {title:'最后的封锁线',place:'指挥部 · 核心控制层',brief:'关闭防爆门，解除发射程序，击败重装队长；最后六十秒内穿过封锁线撤离。',theme:2,tasks:[use('关闭军火库防爆门'),code('解除发射控制程序',['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ArrowUp']),task('boss','击败重装守备队长'),take('取回行动记录并启动撤离倒计时',{timer:60}),use('通过最终封锁检查点',{stopTimer:true})]}
  ];
  window.SideCampaign={levels,make(index){
    if(!levels[index])throw Error('Unknown operation '+index);
    const spec=levels[index],width=4400+(index%3)*240,ground=640;
    const gaps=[],platforms=[{x:0,y:ground,w:width,h:200,ground:true}];
    for(let i=0;i<7;i++){const x=500+i*520+(index%3)*30;platforms.push({x,y:ground-85,w:160,h:24});platforms.push({x:x+170,y:ground-170,w:210,h:28});if(i%2===0)platforms.push({x:x+390,y:ground-85,w:100,h:22});}
    const tasks=spec.tasks.map((t,i)=>({...t,id:i,x:620+i*(width-1250)/Math.max(1,spec.tasks.length-1),y:ground,progress:0,started:false,done:false,hp:t.hp||0,maxHp:t.hp||0}));
    // Every operation has a continuous floor; raised platforms provide optional height.
    for(const t of tasks){if(t.elevated){t.x=2200; t.y=ground-170;platforms.push({x:1810,y:ground-85,w:180,h:24},{x:1990,y:ground-170,w:360,h:26});}if(t.kind==='escapeBlast')t.x=width-350;}
    const enemies=[];for(let i=0;i<5+Math.floor(index/6);i++){let x=850+i*(width-1350)/(5+Math.floor(index/6));for(const [a,b]of gaps)if(x>a-30&&x<b+30)x=b+70;enemies.push({id:i,x,y:ground,vx:0,vy:0,w:26,h:48,hp:i%4===3?110:65,maxHp:i%4===3?110:65,kind:i%4===3?'heavy':'rifle',facing:-1,fire:1.5+i*.24,grounded:true,home:x,stun:0});}
    const add=(x,y,kind,hp)=>enemies.push({id:enemies.length,x,y,vx:0,vy:0,w:kind==='drone'?38:28,h:kind==='drone'?22:48,hp,maxHp:hp,kind,facing:-1,fire:2,home:x,stun:0,tag:true});
    if(index===8)add(tasks[0].x,ground,'officer',140);
    if(index===16)for(let i=0;i<3;i++){const x=1000+i*1050;platforms.push({x:x-120,y:ground-170,w:240,h:26});add(x,ground-170,'sniper',75);}
    if(index===20)for(let i=0;i<4;i++)add(1300+i*600,ground-115,'drone',90);
    if(index===32)add(tasks[0].x,ground,'commander',180);
    if(index===35)add(tasks[2].x,ground,'boss',500);
    const pickups=Array.from({length:6},(_,i)=>({x:350+i*660,y:ground,type:i%3===2?'med':'ammo',taken:false}));
    return {index,spec,width,ground,platforms,gaps,tasks,enemies,pickups,exit:{x:width-135,y:ground},spawn:{x:145,y:ground},decorSeed:index*31+7};
  }};
})();
