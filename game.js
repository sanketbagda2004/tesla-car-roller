(()=>{
'use strict';
const U=0.6,G=32.2*U,HC=0.65,R1=22,WH=14,R2=9,CURL=22*Math.PI/180,ROAD=60,H=1/120,DS=0.25;
const L1=R1*Math.PI/2,L=L1+WH+R2*CURL,SINK_OK=39*U,TILT_OK=28*Math.PI/180;
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=a=>{a%=2*Math.PI;return a>Math.PI?a-2*Math.PI:a<-Math.PI?a+2*Math.PI:a};
// ---- ramp path, sampled by arc length ----
function raw(s){
  if(s<L1){const t=s/R1;return{x:R1*Math.sin(t),y:R1*(1-Math.cos(t)),a:t,k:1/R1}}
  if(s<L1+WH)return{x:R1,y:R1+s-L1,a:Math.PI/2,k:0};
  const u=(s-L1-WH)/R2;return{x:R1-R2+R2*Math.cos(u),y:R1+WH+R2*Math.sin(u),a:Math.PI/2+u,k:-1/R2}}
const T=[];for(let i=0;i<=Math.ceil(L/DS);i++)T.push(raw(Math.min(i*DS,L)));
function pathAt(s){s=clamp(s,0,L);const f=s/DS,i=Math.min(Math.floor(f),T.length-2),w=f-i,a=T[i],b=T[i+1],m=k=>a[k]+(b[k]-a[k])*w;return{x:m('x'),y:m('y'),a:m('a'),k:m('k')}}
const groundY=x=>x<0||x>R1?0:R1*(1-Math.sqrt(1-(x/R1)**2));
// ---- three.js scene ----
const el=$('game'),ren=new THREE.WebGLRenderer({antialias:true});
ren.setPixelRatio(Math.min(devicePixelRatio,2));el.appendChild(ren.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x05070f);scene.fog=new THREE.Fog(0x05070f,60,260);
const cam=new THREE.PerspectiveCamera(50,1,0.5,600);
function resize(){ren.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
scene.add(new THREE.HemisphereLight(0x6688ff,0x101018,0.9));
const dl=new THREE.DirectionalLight(0xaaccff,0.8);dl.position.set(-20,40,30);scene.add(dl);
const M=(c,e,x)=>new THREE.MeshStandardMaterial(Object.assign({color:c,emissive:e||0,roughness:.4,metalness:.5},x));
const road=new THREE.Mesh(new THREE.PlaneGeometry(900,40),M(0x10131c,0,{metalness:0}));road.rotation.x=-Math.PI/2;road.position.x=-300;scene.add(road);
const road2=road.clone();road2.scale.x=.2;road2.position.x=100;scene.add(road2);
const em=new THREE.MeshBasicMaterial({color:0x6df0ff});
for(let x=-500;x<150;x+=8){const b=new THREE.Mesh(new THREE.BoxGeometry(3,.02,.3),new THREE.MeshBasicMaterial({color:0x9ab}));b.position.set(x,.01,0);scene.add(b);
  if(x%24==0){const p=new THREE.Mesh(new THREE.BoxGeometry(.3,10,.3),M(0x223));p.position.set(x,5,-14);scene.add(p);const l=new THREE.Mesh(new THREE.SphereGeometry(.6),new THREE.MeshBasicMaterial({color:0xffd9a0}));l.position.set(x,10.2,-14);scene.add(l)}}
// ramp
const sh=new THREE.Shape();sh.moveTo(0,-.5);for(let i=0;i<T.length;i+=4)sh.lineTo(T[i].x,T[i].y);
const e=T[T.length-1];sh.lineTo(e.x,e.y);sh.lineTo(e.x+8,e.y);sh.lineTo(e.x+8,-.5);
const rg=new THREE.ExtrudeGeometry(sh,{depth:14,bevelEnabled:false});rg.translate(0,0,-7);
scene.add(new THREE.Mesh(rg,M(0x1a2030,0x040810)));
[-7.05,7.05].forEach(z=>{const g=new THREE.BufferGeometry().setFromPoints(T.map(p=>new THREE.Vector3(p.x,p.y,z)));scene.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:0xff3df0})))});
// skyline + stars
const sk=new THREE.Group();for(let i=0;i<70;i++){const h=10+Math.random()*60,b=new THREE.Mesh(new THREE.BoxGeometry(8+Math.random()*10,h,8),M(0x0a0e18,0x03050a));b.position.set(-400+i*12+Math.random()*6,h/2,-70-Math.random()*30);sk.add(b)}scene.add(sk);
const wp=[];for(let i=0;i<500;i++)wp.push(-400+Math.random()*850,3+Math.random()*60,-65);
const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(wp,3));scene.add(new THREE.Points(wg,new THREE.PointsMaterial({color:0xffd070,size:1.2})));
const sp=[];for(let i=0;i<400;i++)sp.push(-300+Math.random()*600,40+Math.random()*120,-150);
const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:1.4,fog:false})));
// car (original design: extruded wedge profile)
const car=new THREE.Group(),bodyM=M(0x1b3cff,0x050a30,{metalness:.8,roughness:.25});
function ext(pts,d,m){const s=new THREE.Shape();s.moveTo(...pts[0]);pts.slice(1).forEach(p=>s.lineTo(...p));const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.12,bevelThickness:.12,bevelSegments:2});g.translate(0,0,-d/2);return new THREE.Mesh(g,m)}
car.add(ext([[-3.1,-.2],[-3.1,.25],[-2.5,.45],[-1.1,.5],[-.3,.95],[.9,.95],[1.9,.45],[3.1,.3],[3.2,-.2]],2,bodyM));
car.add(ext([[-1,.55],[-.3,.97],[.8,.97],[1.55,.55]],1.7,M(0x05080f,0x001018,{metalness:1,roughness:.1})));
const wm=M(0x080808);[[-2,1.2],[2,1.2],[-2,-1.2],[2,-1.2]].forEach(([x,z])=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.45,16),wm);w.rotation.x=Math.PI/2;w.position.set(x,-.2,z);car.add(w)});
const mk=(c,x,y,sx,sy)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(.1,sy,sx),new THREE.MeshBasicMaterial({color:c}));b.position.set(x,y,0);car.add(b)};
mk(0xffffff,3.3,.15,1.8,.12);mk(0xff2244,-3.2,.35,1.9,.12);mk(0x6df0ff,0,-.25,.1,.05);
const ug=new THREE.PointLight(0x30e0ff,1.2,14);ug.position.set(0,-1,0);car.add(ug);
const plumeM=new THREE.MeshBasicMaterial({color:0x4aa8ff,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false});
const plumes=[[-2,1],[2,1],[-2,-1],[2,-1]].map(([x,z])=>{const c=new THREE.Mesh(new THREE.ConeGeometry(.38,2.4,10),plumeM);c.rotation.x=Math.PI;c.position.set(x,-.45-1.2,z*.8);c.visible=false;car.add(c);return c});
scene.add(car);
// ---- state ----
const S={st:'title',ct:0,greenAt:0,greenTime:0,green:false,lock:0,lit:0,rt:0,react:0,v0:0,v:0,acc:0,s:0,x:-ROAD,y:HC,vx:0,vy:0,th:0,om:0,gas:1,rings:0,flips:0,inv:false,air:0,maxAlt:0,peakG:1,sink:0,soft:0,shake:0,score:0,best:0};
const held={space:false,l:false,r:false};
try{S.best=+localStorage.getItem('roadsterLoopBest')||0}catch(e){}$('best').textContent=S.best;
let rings=[],parts=[],au;
function beep(f,d,t='square'){try{au=au||new(window.AudioContext||window.webkitAudioContext)();const o=au.createOscillator(),g=au.createGain();o.type=t;o.frequency.value=f;g.gain.value=.08;o.connect(g);g.connect(au.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,au.currentTime+d);o.stop(au.currentTime+d)}catch(e){}}
let toastT;function toast(t,ms=1200){const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),ms)}
function setLights(n,green){document.querySelectorAll('.lt').forEach((l,i)=>{l.className='lt'+(i<n?(green&&i==3?' green':' red'):'')})}
function clearObjs(){rings.forEach(r=>scene.remove(r.m));rings=[];parts.forEach(p=>scene.remove(p.m));parts=[]}
function reset(){clearObjs();Object.assign(S,{st:'count',ct:0,green:false,greenAt:2.8+.9+Math.random()*1.4,lock:.4,lit:0,v:0,s:0,x:-ROAD,y:HC,vx:0,vy:0,th:0,om:0,gas:1,rings:0,flips:0,inv:false,air:0,maxAlt:0,peakG:1,sink:0,soft:0,shake:0});
  car.visible=true;plumes.forEach(p=>p.visible=false);setLights(0);$('lights').classList.add('show');$('title').classList.add('hidden');$('results').classList.add('hidden');$('toast').classList.remove('on')}
function press(){
  if(S.st==='title'||(S.st==='results'&&S.rt>.5)){reset();return}
  if(S.st==='count'){if(S.lock>0)return;
    if(!S.green){S.lock=.4;beep(160,.3,'sawtooth');toast('Too early, wait for green',900);return}
    launch((performance.now()-S.greenTime)/1000)}}
function launch(r){S.react=r;S.v0=clamp(90-5*r,76,90)*U;S.acc=S.v0*S.v0/(2*ROAD);S.v=0;S.st='drive';$('lights').classList.remove('show');toast('GO!',600);beep(880,.25)}
function spawnRings(){const T0=S.vy+Math.sqrt(S.vy*S.vy+2*G*S.y),Tt=T0/G,off=[3,-2,4,-1,2];
  for(let i=0;i<5;i++){const t=Tt*(.18+.16*i),m=new THREE.Mesh(new THREE.TorusGeometry(2.3,.2,10,28),new THREE.MeshBasicMaterial({color:0xffd24a,transparent:true}));
    m.position.set(S.x+S.vx*t,Math.max(5,S.y+S.vy*t-.5*G*t*t+off[i]),0);scene.add(m);rings.push({m,x:m.position.x,y:m.position.y,got:0})}}
function boom(){car.visible=false;S.shake=1.2;beep(70,.8,'sawtooth');
  const fl=new THREE.PointLight(0xff8830,4,60);fl.position.set(S.x,S.y,3);scene.add(fl);parts.push({m:fl,light:1,life:.5,v:new THREE.Vector3()});
  for(let i=0;i<45;i++){const big=i<30,m=new THREE.Mesh(new THREE.BoxGeometry(.3+Math.random()*(big?.6:.3),.3+Math.random()*.4,.3+Math.random()*.4),new THREE.MeshBasicMaterial({color:big?[0xff7a18,0xffc040,0x1b3cff,0x222][i%4]:0xff4010}));
    m.position.set(S.x,S.y,0);const a=Math.random()*6.28,sp=6+Math.random()*22;scene.add(m);parts.push({m,v:new THREE.Vector3(Math.cos(a)*sp,Math.abs(Math.sin(a))*sp*.9+4,(Math.random()-.5)*12),r:new THREE.Vector3(Math.random()*8,Math.random()*8,Math.random()*8),life:2.5})}}
function crash(why){S.st='crashed';S.rt=0;S.soft=0;boom();toast(why,1600)}
function step(dt){
  S.rt+=dt;if(S.lock>0)S.lock-=dt;
  if(S.st==='count'){S.ct+=dt;const n=Math.min(4,Math.floor(S.ct/.7));
    if(n!==S.lit&&!S.green){S.lit=n;setLights(n);beep(440,.12)}
    if(!S.green&&S.ct>=S.greenAt){S.green=true;S.greenTime=performance.now();setLights(4,true);beep(1000,.3)}
    if(S.green&&S.ct>S.greenAt+2.5)launch(2.5)}
  else if(S.st==='drive'){S.v+=S.acc*dt;S.x+=S.v*dt;S.y=HC;if(S.x>=0){S.st='ramp';S.s=0;S.v=S.v0}}
  else if(S.st==='ramp'){const p=pathAt(S.s);S.v=Math.sqrt(Math.max(S.v0*S.v0-2*G*p.y,9));S.s+=S.v*dt;
    S.peakG=Math.max(S.peakG,Math.abs(S.v*S.v*p.k+G*Math.cos(p.a))/G);
    const q=pathAt(S.s);S.x=q.x-Math.sin(q.a)*HC;S.y=q.y+Math.cos(q.a)*HC;S.th=q.a;
    if(S.s>=L){S.vx=S.v*Math.cos(q.a);S.vy=S.v*Math.sin(q.a);S.om=.6*S.v/R2;S.st='air';S.air=0;spawnRings();toast('AIRBORNE',700)}}
  else if(S.st==='air'){
    S.air+=dt;S.om+=((held.l?1:0)-(held.r?1:0))*6*dt;S.om*=Math.exp(-1.5*dt);S.th+=S.om*dt;
    let th=held.space&&S.gas>0;plumes.forEach(p=>p.visible=th);
    if(th){S.gas=Math.max(0,S.gas-.28*dt);S.vx+=-Math.sin(S.th)*26*dt;S.vy+=Math.cos(S.th)*26*dt;S.peakG=Math.max(S.peakG,26/G+1)}
    S.vy-=G*dt;S.x+=S.vx*dt;S.y+=S.vy*dt;S.maxAlt=Math.max(S.maxAlt,S.y/U);
    const c=Math.cos(S.th);if(!S.inv&&c<-.7){S.inv=true;S.flips++;toast('FLIP x'+S.flips,700);beep(660,.1)}else if(S.inv&&c>-.3)S.inv=false;
    rings.forEach(r=>{if(!r.got&&Math.hypot(S.x-r.x,S.y-r.y)<2.9){r.got=1;S.rings++;S.gas=Math.min(1,S.gas+.35);toast('+500',500);beep(1200,.12,'sine')}});
    const low=S.y-(3*Math.abs(Math.sin(S.th))+HC*Math.abs(c)),gy=groundY(S.x);
    if(low<=gy){plumes.forEach(p=>p.visible=false);S.sink=-S.vy;S.peakG=Math.max(S.peakG,S.sink/.25/G);const tilt=Math.abs(wrap(S.th));
      if(gy>.5)crash('Ramp strike!');else if(S.sink>SINK_OK)crash('Too fast! '+(S.sink/U).toFixed(0)+' ft/s');else if(tilt>TILT_OK)crash('Not upright!');
      else{S.st='landed';S.rt=0;S.th=0;S.om=0;S.y=gy+HC;S.vy=0;S.soft=Math.round(500+(1-S.sink/SINK_OK)*1500);toast('SOFT LANDING +'+S.soft,1400);beep(520,.2,'sine')}}}
  else if(S.st==='landed'){S.vx*=Math.exp(-1.8*dt);S.x+=S.vx*dt;if(S.rt>1.5)results()}
  else if(S.st==='crashed'){if(S.rt>2)results()}
  S.shake=Math.max(0,S.shake-dt*.9)}
function calc(){return S.rings*500+S.flips*1500+Math.round(S.maxAlt*10)+Math.round(S.air*100)+S.soft}
function results(){S.st='results';S.rt=0;S.score=calc();const ok=S.soft>0,nb=S.score>S.best;
  if(nb){S.best=S.score;try{localStorage.setItem('roadsterLoopBest',S.best)}catch(e){}$('best').textContent=S.best}
  const g=!ok?'F':S.score>=9000?'S':S.score>=6000?'A':S.score>=3500?'B':S.score>=1500?'C':'D';
  $('grade').textContent=g;$('rScore').textContent=S.score.toLocaleString();$('badge').classList.toggle('hidden',!nb);$('rTitle').textContent=ok?'Landed clean':'Crashed';
  const rows=[['Reaction',S.react.toFixed(3)+' s'],['Ramp speed',(S.v0/U).toFixed(1)+' mph'],['Peak G',S.peakG.toFixed(1)+' G'],['Max altitude',S.maxAlt.toFixed(0)+' ft'],['Airtime',S.air.toFixed(2)+' s'],['Flips',S.flips],['Rings',S.rings+' / 5'],['Touchdown',(S.sink/U).toFixed(1)+' ft/s']];
  $('rGrid').innerHTML=rows.map(r=>`<div><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');$('results').classList.remove('hidden')}
// ---- render ----
const camS={x:-50,y:8};
function visuals(dt){
  car.position.set(S.x,S.y,0);car.rotation.z=S.th;
  const f=performance.now()/60;plumes.forEach((p,i)=>{p.scale.set(1,.8+.4*Math.sin(f+i*2),1)});
  rings.forEach(r=>{if(r.got){r.got+=dt*3;r.m.scale.setScalar(1+r.got);r.m.material.opacity=Math.max(0,1-r.got/1.5);if(r.got>1.6)r.m.visible=false}else r.m.rotation.y=Math.sin(f/8)*.3});
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.life-=dt;if(p.life<=0){scene.remove(p.m);parts.splice(i,1);continue}
    if(p.light){p.m.intensity=p.life*8;continue}
    p.v.y-=G*dt;p.m.position.addScaledVector(p.v,dt);p.m.rotation.x+=p.r.x*dt;p.m.rotation.y+=p.r.y*dt;
    if(p.m.position.y<.2){p.m.position.y=.2;p.v.y*=-.4;p.v.x*=.7}}
  const tx=S.x+(S.st==='air'?0:9),ty=S.y*.6+7,k=1-Math.exp(-4*dt);
  camS.x+=(tx-camS.x)*k;camS.y+=(ty-camS.y)*k;
  const sx=(Math.random()-.5)*S.shake*2,sy=(Math.random()-.5)*S.shake*2;
  cam.position.set(camS.x+sx,camS.y+sy,36+S.y*.5);cam.lookAt(camS.x,S.y*.55+2,0);
  $('hSpd').textContent=Math.round((S.st==='air'||S.st==='landed'||S.st==='crashed'?Math.hypot(S.vx,S.vy):S.v)/U);
  $('hAlt').textContent=Math.max(0,Math.round((S.y-HC)/U));$('hScore').textContent=calc().toLocaleString();
  $('hRings').textContent=S.rings;$('hFlips').textContent=S.flips;$('hGas').style.width=S.gas*100+'%'}
let last=0,acc=0;
function frame(t){requestAnimationFrame(frame);const dt=Math.min(.1,(t-last)/1000||0);last=t;acc+=dt;while(acc>=H){step(H);acc-=H}visuals(dt);ren.render(scene,cam)}
requestAnimationFrame(frame);
// ---- input ----
addEventListener('keydown',e=>{
  if(e.code==='Space'){e.preventDefault();if(!e.repeat)press();held.space=true}
  else if(e.code==='ArrowLeft'){e.preventDefault();held.l=true}else if(e.code==='ArrowRight'){e.preventDefault();held.r=true}});
addEventListener('keyup',e=>{if(e.code==='Space')held.space=false;if(e.code==='ArrowLeft')held.l=false;if(e.code==='ArrowRight')held.r=false});
const bind=(id,fn)=>{const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();fn(true)});['pointerup','pointerleave','pointercancel'].forEach(n=>b.addEventListener(n,()=>fn(false)))};
bind('bl',v=>held.l=v);bind('br',v=>held.r=v);bind('bt',v=>{if(v)press();held.space=v});
ren.domElement.addEventListener('pointerdown',()=>{press();held.space=true});
addEventListener('pointerup',()=>held.space=false);
$('bStart').onclick=e=>{e.stopPropagation();reset()};$('bAgain').onclick=e=>{e.stopPropagation();reset()};
})();
