/* ============ SHINOBI STRIKE - chakra arena (offline+online client core) ============ */
var Net={sock:null,close(){if(this.sock){try{this.sock.close()}catch(e){}this.sock=null}},send(o){if(this.sock&&this.sock.readyState===1)this.sock.send(JSON.stringify(o))}};
const $=id=>document.getElementById(id),touch='ontouchstart' in window;
if(touch)document.body.classList.add('touch');
$('how').textContent=touch?'Stick moves. Drag anywhere (or drag while holding FIRE) to aim. FIRE shoots, ADS toggles aim-down-sights, CRCH crouches. Ride yellow chakra rails. Streaks: 3 kills Byakugan scan, 5 kills scroll drop, 7 kills Meteor Jutsu (keys 1/2/3). Online: 1v1 vs anyone, or FFA Battle Royale.':'WASD move, SHIFT sprint, SPACE jump, C/CTRL crouch, Right-click ADS, click fire (hold for auto), R reload, Q chakra wall, F heal, G explosive tag, 1/2/3 jutsu streaks, ESC menu. Crouch to peek windows. Online 1v1 and FFA BR in the menu.';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const H=14,HW=45,CH=[0x35c8ff,0xff4d6d,0xffc933,0x7dff6a],CS=['#35c8ff','#ff4d6d','#ffc933','#7dff6a'];
const ti=t=>t===0?0:1+(t-1)%3;
let AC=null,master=null,noiseBuf=null;
function initAudio(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=.45;master.connect(AC.destination);
 const len=AC.sampleRate;noiseBuf=AC.createBuffer(1,len,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
 const src=AC.createBufferSource();src.buffer=noiseBuf;src.loop=true;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=300;const g=AC.createGain();g.gain.value=.04;src.connect(f);f.connect(g);g.connect(master);src.start();}catch(e){}}
function beep(fr,dur,type,vol,slide){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.type=type||'square';o.frequency.setValueAtTime(fr,AC.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),AC.currentTime+dur);g.gain.setValueAtTime(vol,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+dur);o.connect(g);g.connect(master);o.start();o.stop(AC.currentTime+dur)}
function nz(dur,freq,vol,type,slideF){if(!AC)return;const s=AC.createBufferSource();s.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type=type||'lowpass';f.frequency.setValueAtTime(freq,AC.currentTime);if(slideF)f.frequency.exponentialRampToValueAtTime(Math.max(30,slideF),AC.currentTime+dur);const g=AC.createGain();g.gain.setValueAtTime(vol,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+dur);s.connect(f);f.connect(g);g.connect(master);s.start();s.stop(AC.currentTime+dur)}
const sShot=k=>{nz(.1,k==='mk'?900:1600,.22,'bandpass',400);beep(k==='mk'?180:140,.07,'square',.16,60)};
const sExplode=()=>{nz(.8,400,.7,'lowpass',60);beep(70,.6,'sine',.55,28);nz(.4,3000,.12,'highpass',500)};
const sTick=h=>beep(h?1500:1050,.045,'square',.12);
const sKill=()=>{beep(880,.09,'square',.14);setTimeout(()=>beep(1320,.12,'square',.14),70)};
const sReload=()=>{beep(300,.06,'triangle',.1);setTimeout(()=>beep(500,.06,'triangle',.1),260)};
const sBeep2=(a,b)=>{beep(a,.12,'sine',.12);setTimeout(()=>beep(b,.14,'sine',.12),130)};
addEventListener('pointerdown',initAudio,{once:false});addEventListener('keydown',initAudio,{once:false});
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xecc9a2,70,235);
const cam=new THREE.PerspectiveCamera(78,innerWidth/innerHeight,.08,600);cam.rotation.order='YXZ';scene.add(cam);
const ren=new THREE.WebGLRenderer({antialias:true});ren.setPixelRatio(Math.min(devicePixelRatio,2));ren.setSize(innerWidth,innerHeight);
ren.shadowMap.enabled=true;ren.shadowMap.type=THREE.PCFSoftShadowMap;ren.outputEncoding=THREE.sRGBEncoding;ren.toneMapping=THREE.ACESFilmicToneMapping;ren.toneMappingExposure=1.18;
document.body.prepend(ren.domElement);
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();ren.setSize(innerWidth,innerHeight)});
function tex(fn,rx,ry,sz){const c=document.createElement('canvas');c.width=c.height=sz||256;const g=c.getContext('2d');fn(g);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=4;return t}
const nzz=(g,n,a,c)=>{for(let i=0;i<n;i++){g.fillStyle=`rgba(${c||'0,0,0'},${Math.random()*a})`;g.fillRect(Math.random()*256,Math.random()*256,2,2)}};
const groundT=tex(g=>{g.fillStyle='#6d6152';g.fillRect(0,0,256,256);nzz(g,2600,.1);nzz(g,1200,.06,'255,255,255');
 for(let i=0;i<7;i++){g.strokeStyle='rgba(10,10,12,.5)';g.lineWidth=1;g.beginPath();let x=Math.random()*256,y=Math.random()*256;g.moveTo(x,y);for(let j=0;j<5;j++){x+=Math.random()*40-20;y+=Math.random()*40-20;g.lineTo(x,y)}g.stroke()}
 g.fillStyle='#c8b23a';for(let i=0;i<4;i++)g.fillRect(30+i*56,124,30,6);g.fillStyle='rgba(230,230,230,.65)';g.fillRect(0,20,256,5);g.fillRect(0,231,256,5);
 g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=2;g.strokeRect(0,0,256,256);g.beginPath();g.arc(128,128,13,0,7);g.stroke()},26,26,512);
const concT=tex(g=>{g.fillStyle='#b3a894';g.fillRect(0,0,256,256);nzz(g,2400,.09);nzz(g,900,.05,'255,255,255');
 g.strokeStyle='rgba(60,64,70,.6)';g.lineWidth=3;for(let i=0;i<=2;i++){g.beginPath();g.moveTo(i*128,0);g.lineTo(i*128,256);g.stroke();g.beginPath();g.moveTo(0,i*128);g.lineTo(256,i*128);g.stroke()}
 for(let i=0;i<5;i++){g.fillStyle='rgba(50,52,55,.25)';g.fillRect(Math.random()*220,Math.random()*220,Math.random()*30+8,Math.random()*60+20)}},2,1);
const wallT=tex(g=>{g.fillStyle='#b9b2a2';g.fillRect(0,0,256,256);nzz(g,2200,.08);g.fillStyle='#8a4a3a';g.fillRect(0,196,256,60);nzz(g,500,.12);
 g.fillStyle='#22303c';g.fillRect(36,60,52,64);g.fillRect(168,60,52,64);g.fillStyle='#7fa8bd';g.fillRect(41,65,42,54);g.fillRect(173,65,42,54);
 g.strokeStyle='#5a544a';g.lineWidth=4;g.strokeRect(36,60,52,64);g.strokeRect(168,60,52,64);
 g.fillStyle='rgba(255,77,109,.75)';g.font='bold 26px Verdana';g.fillText('NA-04',62,168);g.fillStyle='rgba(53,200,255,.6)';g.fillRect(150,150,70,12)},2,1);
const crateT=tex(g=>{g.fillStyle='#4d5540';g.fillRect(0,0,256,256);nzz(g,2400,.12);g.strokeStyle='#2e3326';g.lineWidth=10;g.strokeRect(6,6,244,244);g.lineWidth=4;
 g.beginPath();g.moveTo(12,12);g.lineTo(244,244);g.moveTo(244,12);g.lineTo(12,244);g.stroke();g.fillStyle='#d8d2b8';g.font='bold 34px Verdana';g.fillText('07',96,140)},1,1);
const contT=tex(g=>{g.fillStyle='#e8ecef';g.fillRect(0,0,256,256);nzz(g,2000,.08);g.fillStyle='rgba(0,0,0,.16)';for(let i=0;i<16;i++)g.fillRect(i*16,0,7,256);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,0,256,12);g.fillRect(0,244,256,12)},3,1);
const roofT=tex(g=>{g.fillStyle='#41464d';g.fillRect(0,0,256,256);nzz(g,3200,.14);nzz(g,800,.06,'255,255,255');g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=3;g.strokeRect(2,2,252,252)},2,2);
const metalT=tex(g=>{g.fillStyle='#7d8790';g.fillRect(0,0,256,256);nzz(g,1500,.1);g.strokeStyle='rgba(30,34,38,.5)';g.lineWidth=2;for(let i=0;i<8;i++){g.beginPath();g.moveTo(0,i*32);g.lineTo(256,i*32);g.stroke()}g.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<40;i++)g.fillRect(Math.random()*252,Math.random()*252,3,3)},1,2);
const hazardT=tex(g=>{g.fillStyle='#e8c222';g.fillRect(0,0,256,256);g.fillStyle='#1c1c1c';for(let i=-4;i<12;i++){g.beginPath();g.moveTo(i*32,0);g.lineTo(i*32+32,0);g.lineTo(i*32,32);g.lineTo(i*32-32,32);g.fill();g.beginPath();g.moveTo(i*32,128);g.lineTo(i*32+32,128);g.lineTo(i*32,160);g.lineTo(i*32-32,160);g.fill()}},1,1);
const mat=(t,r,m)=>new THREE.MeshStandardMaterial({map:t,roughness:r==null?.85:r,metalness:m==null?.1:m});
const stM=mat(concT,.9,.05),hmM=mat(wallT,.85,.05),cm=mat(crateT,.7,.15),roofM=mat(roofT,.95,.02),metM=mat(metalT,.5,.5),hazM=mat(hazardT,.7,.2);
const contM=c=>new THREE.MeshStandardMaterial({map:contT,color:c,roughness:.55,metalness:.35});
const glassM=new THREE.MeshStandardMaterial({color:0xbfe6ff,transparent:true,opacity:.22,roughness:.05,metalness:.4});
const iceM=new THREE.MeshStandardMaterial({color:0x8fdcff,transparent:true,opacity:.72,roughness:.15,emissive:0x1a4a6a});
const emis=c=>new THREE.MeshBasicMaterial({color:c});
const sky=new THREE.Mesh(new THREE.SphereGeometry(420,20,10),new THREE.MeshBasicMaterial({map:tex(g=>{const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#2c3f6e');gr.addColorStop(.45,'#8a5f8e');gr.addColorStop(.72,'#e8915a');gr.addColorStop(1,'#ffd9a0');g.fillStyle=gr;g.fillRect(0,0,256,256);g.fillStyle='rgba(255,214,150,.95)';g.beginPath();g.arc(150,150,20,0,7);g.fill();g.fillStyle='rgba(255,190,120,.4)';g.beginPath();g.arc(150,150,38,0,7);g.fill()},1,1),side:THREE.BackSide,fog:false}));scene.add(sky);
const seaT=tex(g=>{g.fillStyle='#2a6d8f';g.fillRect(0,0,256,256);g.strokeStyle='rgba(255,255,255,.14)';g.lineWidth=2;for(let i=0;i<30;i++){g.beginPath();const y=Math.random()*256,x=Math.random()*256;g.moveTo(x,y);g.lineTo(x+20+Math.random()*30,y);g.stroke()}},8,8);
const sea=new THREE.Mesh(new THREE.PlaneGeometry(1000,1000),new THREE.MeshStandardMaterial({map:seaT,color:0x77c4e8,roughness:.25,metalness:.35}));sea.rotation.x=-Math.PI/2;sea.position.y=-.8;scene.add(sea);
[[-120,-160,55,80],[80,-180,60,90],[150,80,45,60],[-150,90,50,70],[0,-220,70,100]].forEach(([x,z,r,h])=>{const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,7),new THREE.MeshStandardMaterial({color:0x6f8296,flatShading:true,roughness:1}));m.position.set(x,h/2-3,z);scene.add(m)});
const clouds=[];for(let i=0;i<7;i++){const c=new THREE.Mesh(new THREE.PlaneGeometry(60+Math.random()*50,18+Math.random()*10),new THREE.MeshBasicMaterial({map:tex(g=>{for(let j=0;j<16;j++){const gr=g.createRadialGradient(40+Math.random()*176,40+Math.random()*80,4,40+Math.random()*176,40+Math.random()*80,30+Math.random()*26);gr.addColorStop(0,'rgba(255,255,255,.85)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,256,256)}},1,1),transparent:true,depthWrite:false,fog:false}));c.position.set(Math.random()*400-200,70+Math.random()*50,Math.random()*400-200);c.rotation.y=Math.random()*7;scene.add(c);clouds.push(c)}
scene.add(new THREE.HemisphereLight(0xffe2c4,0x54423a,.8));
const sun=new THREE.DirectionalLight(0xffc890,1.35);sun.position.set(46,40,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-62;sun.shadow.camera.right=62;sun.shadow.camera.top=62;sun.shadow.camera.bottom=-62;sun.shadow.camera.far=180;sun.shadow.bias=-.0006;scene.add(sun);
const obs=[],AB=[],glassObs=[];
function box(x,z,w,d,h,m,col,y0,opts){opts=opts||{};const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,(y0||0)+h/2,z);b.castShadow=opts.shadow!==false;b.receiveShadow=true;scene.add(b);
 if(opts.collide!==false){const ab={x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,y0:y0||0,t:(y0||0)+h};AB.push(ab);obs.push(b);b.userData.ab=ab}
 if(col){const s=new THREE.Mesh(new THREE.BoxGeometry(w+.05,.09,d+.05),emis(col));s.position.set(x,(y0||0)+h-.045,z);scene.add(s)}
 return b}
function glassPane(x,z,w,d,y0,h){const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),glassM);b.position.set(x,y0+h/2,z);scene.add(b);glassObs.push(b);return b}
function winWall(cx,cz,len,axis,h,m,opts){opts=opts||{};const t=.42;if(axis==='x'){
 if(opts.door){const g=2.5,sw=(len-g)/2;box(cx-g/2-sw/2,cz,sw,t,1.15,m);box(cx+g/2+sw/2,cz,sw,t,1.15,m);box(cx-g/2-sw/2,cz,sw,t,h-3.15,m,0,3.15);box(cx+g/2+sw/2,cz,sw,t,h-3.15,m,0,3.15);box(cx,cz,g+.3,t+.14,.28,hazM,0,2.92)}
 else box(cx,cz,len,t,h,m);
 if(!opts.door){const nw=opts.win||2;for(let i=0;i<nw;i++){const wx=cx-len/2+len*(i+.5)/nw;glassPane(wx,cz,len/nw*.5,.1,1.15,1.4);box(wx,cz-.14,len/nw*.62,.12,.1,metM,0,2.62)}}}
 else{if(opts.door){const g=2.5,sd=(len-g)/2;box(cx,cz-g/2-sd/2,t,sd,1.15,m);box(cx,cz+g/2+sd/2,t,sd,1.15,m);box(cx,cz-g/2-sd/2,t,sd,h-3.15,m,0,3.15);box(cx,cz+g/2+sd/2,t,sd,h-3.15,m,0,3.15);box(cx,cz,t+.14,g+.3,.28,hazM,0,2.92)}
 else box(cx,cz,t,len,h,m);
 if(!opts.door){const nw=opts.win||2;for(let i=0;i<nw;i++){const wz=cz-len/2+len*(i+.5)/nw;glassPane(cx,wz,.1,len/nw*.5,1.15,1.4);box(cx-.14,wz,.12,len/nw*.62,.1,metM,0,2.62)}}}}
const floor=new THREE.Mesh(new THREE.PlaneGeometry(HW*2+30,HW*2+30),mat(groundT,.92,.05));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
[[0,-45.6,92,1],[0,45.6,92,1],[-45.6,0,1,92],[45.6,0,1,92]].forEach(([x,z,w,d])=>box(x,z,w,d,4.2,glassM,0xffc933));
for(const sx of[-1,1])for(const sz of[-1,1]){const x=sx*44,z=sz*44;box(x-.9,z-.9,.35,.35,6.4,metM);box(x+.9,z-.9,.35,.35,6.4,metM);box(x-.9,z+.9,.35,.35,6.4,metM);box(x+.9,z+.9,.35,.35,6.4,metM);box(x,z,2.6,2.6,1.4,stM,0xffc933,5.0)}
(function(){const W=12,D=10,Hh=4.4;
 winWall(0,-D/2,W,'x',Hh,stM,{door:true});
 winWall(0,D/2,W,'x',Hh,stM,{door:true});
 winWall(-W/2,0,D,'z',Hh,stM,{win:2});
 winWall(W/2,0,D,'z',Hh,stM,{win:2});
 box(0,0,W+.5,D+.5,.32,roofM,0,Hh);
 for(const s of[-1,1]){box(s*2.6,0,1.1,1.1,Hh,stM);}
 box(0,-2.2,2.2,2.2,1.1,cm,0xffc933);box(2.2,2.4,2.2,2.2,1.1,cm,0x35c8ff);
 box(0,-D/2+.15,W,.3,.95,stM,0,Hh+.32);box(0,D/2-.15,W,.3,.95,stM,0,Hh+.32);
 box(-W/2+.15,0,.3,D,.95,stM,0,Hh+.32);box(W/2-.15,0,.3,D,.95,stM,0,Hh+.32);
 box(-3,-2.5,1.8,1.4,1,metM,0,Hh+.32);box(3.2,2,1.6,1.6,.9,cm,0xffc933,Hh+.32);
 for(let i=0;i<6;i++)box(6.9+(5-i)*.85,0,1.05,2.6,.63*(i+1),cm,i%2?0x35c8ff:0xffc933);
 for(const s of[-1,1]){box(s*4.5,3.8,.12,.12,3.2,metM,0,Hh+.32)}
})();
const flags=[];for(const s of[-1,1]){const f=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.9,6,3),new THREE.MeshBasicMaterial({color:s>0?0xff4d6d:0x35c8ff,side:THREE.DoubleSide}));f.position.set(s*4.5- s*.8,7.6,3.8);scene.add(f);flags.push(f)}
box(0,-14,3.4,3.4,1,metM,0x35c8ff);{const sc=new THREE.Mesh(new THREE.OctahedronGeometry(1.3),new THREE.MeshStandardMaterial({color:0x9fb4c8,metalness:.8,roughness:.25}));sc.position.set(0,2.5,-14);sc.castShadow=true;scene.add(sc)}
box(0,14,3.4,3.4,1,metM,0xffc933);{const sc=new THREE.Mesh(new THREE.TorusGeometry(1.1,.28,10,20),new THREE.MeshStandardMaterial({color:0xc8a24a,metalness:.7,roughness:.35}));sc.position.set(0,2.3,14);sc.castShadow=true;scene.add(sc)}
for(const sx of[-1,1])for(const sz of[-1,1]){box(sx*18,sz*7,7,1.1,1.25,stM,0x35c8ff);box(sx*10,sz*16,1.1,7,1.25,stM,0xffc933)}
for(const sx of[-1,1])for(const sz of[-1,1]){box(sx*20,sz*13,2.4,2.4,1.05,cm,0xffc933)}
const contCols=[0xbf6a3f,0x8f4a3a,0x3f7f7f,0xbfa23f];
[[-27,-20],[-25,-10],[-29,0],[-26,10],[-28,20]].forEach(([x,z],i)=>{
 box(x,z,6,2.6,2.6,contM(contCols[i%4]),0x35c8ff);
 if(i%2===0)box(x+(i%4-1.5)*1.2,z,2.4,2.2,1.2,cm,0xffc933,2.6);
 box(x+3.6,z+(i%2?2.4:-2.4),2.2,2.2,1.1,cm,0xffc933)});
[[-27,20],[-25,10],[-29,0],[-26,-10],[-28,-20]].forEach(([x,z],i)=>{
 box(x,z,6,2.6,2.6,contM(contCols[(i+2)%4]),0x35c8ff);
 if(i%2===1)box(x,z,2.4,2.2,1.2,cm,0xffc933,2.6);
 box(x+3.6,z+(i%2?-2.4:2.4),2.2,2.2,1.1,cm,0xffc933)});
function house(cx,cz,doorSide){const W=10,D=8,Hh=4;
 winWall(cx,cz-D/2,W,'x',Hh,hmM,{win:2});
 winWall(cx,cz+D/2,W,'x',Hh,hmM,{win:2});
 winWall(cx-W/2,cz,D,'z',Hh,hmM,{door:doorSide==='w',win:doorSide==='w'?0:2});
 winWall(cx+W/2,cz,D,'z',Hh,hmM,{win:2});
 box(cx,cz,W+.5,D+.5,.3,roofM,0,Hh);
 box(cx-W/2+.15,cz,.3,D,.9,hmM,0,Hh+.3);box(cx+W/2-.15,cz,.3,D,.9,hmM,0,Hh+.3);box(cx,cz-D/2+.15,W,.3,.9,hmM,0,Hh+.3);box(cx,cz+D/2-.15,W,.3,.9,hmM,0,Hh+.3);
 box(cx,cz,2,2,1.1,cm,0xffc933);
 for(let i=0;i<6;i++)box(cx+5.35+(5-i)*.8,cz,.95,2.4,.58*(i+1),cm,i%2?0xffc933:0x35c8ff);
}
house(27,-15,'w');house(27,15,'w');
function car(x,z,col){box(x,z,4.4,2,0.85,new THREE.MeshStandardMaterial({color:col,roughness:.35,metalness:.6}),0,.35);
 box(x-.3,z,2.3,1.8,.75,new THREE.MeshStandardMaterial({color:0x1c2833,roughness:.2,metalness:.7}),0,1.15);
 for(const sx of[-1.5,1.5])for(const sz of[-.95,.95]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.3,10),new THREE.MeshStandardMaterial({color:0x14181c,roughness:.9}));w.rotation.x=Math.PI/2;w.position.set(x+sx,.36,z+sz);w.castShadow=true;scene.add(w)}}
car(-14,-24,0xb04038);car(14,24,0x3868b0);car(-14,24,0xc8c8d0);car(14,-24,0x38b06a);car(-7,-33,0xbfa23f);car(7,33,0x8858b0);
const fires=[];function barrel(x,z){box(x,z,1,1,1.05,metM,0xff4d6d);const l=new THREE.PointLight(0xff8c3a,0,9);l.position.set(x,1.6,z);scene.add(l);fires.push({x,z,l,t:0})}
barrel(-16,-3);barrel(16,3);barrel(-34,12);
function lamp(x,z){box(x,z,.18,.18,4.6,metM);box(x,z,1.1,.3,.16,metM,0,4.55);const h=new THREE.Mesh(new THREE.BoxGeometry(.9,.12,.24),emis(0xffc080));h.position.set(x,4.5,z);scene.add(h)}
lamp(-8,-14);lamp(8,14);lamp(-8,14);lamp(8,-14);lamp(-19,0);lamp(19,0);
const lampL=[];[[-8,-14],[8,14]].forEach(([x,z])=>{const l=new THREE.PointLight(0xffb070,.6,14);l.position.set(x,4.3,z);scene.add(l);lampL.push(l)});
function tree(x,z,s){box(x,z,.7,.7,3.4,new THREE.MeshStandardMaterial({color:0x5a4030,roughness:.95}));const c1=new THREE.Mesh(new THREE.IcosahedronGeometry(2.1*s,1),new THREE.MeshStandardMaterial({color:0xf2a0c8,flatShading:true,roughness:.9}));c1.position.set(x,4.6*s+1,z);c1.scale.y=.8;c1.castShadow=true;scene.add(c1);const c2=new THREE.Mesh(new THREE.IcosahedronGeometry(1.4*s,1),new THREE.MeshStandardMaterial({color:0xffc4da,flatShading:true,roughness:.9}));c2.position.set(x+1,5.6*s+1,z+.6);c2.castShadow=true;scene.add(c2)}
const sakuraP=[];[[-41,-30],[-41,-8],[-41,14],[-41,34],[41,-30],[41,-8],[41,14],[41,34],[-22,41],[22,41],[-22,-41],[22,-41],[6,41],[-6,-41]].forEach(([x,z],i)=>{tree(x,z,.85+((i%3)*.15));sakuraP.push([x,z])});
box(0,34,6,6,3,stM,0x35c8ff);box(0,34,7.2,7.2,.3,roofM,0,3);
box(0,31.2,6,.3,.9,stM,0,3.3);box(0,36.8,6,.3,.9,stM,0,3.3);box(-2.8,34,.3,6,.9,stM,0,3.3);box(2.8,34,.3,6,.9,stM,0,3.3);
for(let i=0;i<4;i++)box(3.55+(3-i)*.75,34,.9,2.2,.72*(i+1),cm,i%2?0x35c8ff:0xffc933);
const mast=new THREE.Mesh(new THREE.CylinderGeometry(.35,.7,30,8),mat(tex(g=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#e8e8e8':'#d04040';g.fillRect(0,i*32,256,32)}},1,6),.6,.3));mast.position.set(0,18,37.6);mast.castShadow=true;scene.add(mast);
box(0,-34.5,4,3,3,hmM,0xffc933);
box(0,37,1.6,1.6,12.5,metM,0xffc933);const wheel=new THREE.Group();wheel.position.set(0,12.5,36);scene.add(wheel);
wheel.add(new THREE.Mesh(new THREE.TorusGeometry(9.5,.28,8,36),emis(0xffffff)));wheel.add(new THREE.Mesh(new THREE.TorusGeometry(4.8,.16,8,24),emis(0x35c8ff)));
const gond=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2,gm=new THREE.Mesh(new THREE.BoxGeometry(1.3,1.1,1.3),new THREE.MeshStandardMaterial({color:i%2?0xffc933:0xff4d6d,roughness:.5}));gm.position.set(Math.cos(a)*9.5,Math.sin(a)*9.5,0);wheel.add(gm);gond.push(gm);const sp=new THREE.Mesh(new THREE.BoxGeometry(.1,19,.1),emis(0xdddddd));sp.rotation.z=a;wheel.add(sp)}
function torii(x,z){const pm=new THREE.MeshStandardMaterial({color:0xd8452a,roughness:.6});box(x-1.9,z,.45,.45,4.4,pm);box(x+1.9,z,.45,.45,4.4,pm);
 box(x,z,5.4,.6,.5,pm,0,4.4);box(x,z,6.4,.7,.55,pm,0,5.15);box(x,z,.5,.5,.9,pm,0,4.9)}
torii(0,-21);torii(0,21);
const SL=[{ax:-12,az:-26,bx:-12,bz:26},{ax:12,az:26,bx:12,bz:-26}];
SL.forEach(s=>{s.len=Math.hypot(s.bx-s.ax,s.bz-s.az);const r=new THREE.Mesh(new THREE.BoxGeometry(.55,.22,s.len),emis(0xffc933));r.position.set(s.ax,.2,(s.az+s.bz)/2);r.castShadow=true;scene.add(r);
 for(const[x,z]of[[s.ax,s.az],[s.bx,s.bz]]){const p=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,.12,20),emis(0xffc933));p.position.set(x,.07,z);scene.add(p);const q=new THREE.Mesh(new THREE.RingGeometry(1.4,1.75,20),emis(0xffffff));q.rotation.x=-Math.PI/2;q.position.set(x,.09,z);scene.add(q)}});
const zoneM=new THREE.Mesh(new THREE.CylinderGeometry(1,1,70,48,1,true),new THREE.MeshBasicMaterial({color:0x2a8fff,transparent:true,opacity:.16,side:THREE.DoubleSide,fog:false}));zoneM.position.y=32;zoneM.visible=false;scene.add(zoneM);
function resolve(p,r,y,st){for(const o of AB){if(o.t<=y+st||o.y0>=y+1.8)continue;const cx=Math.max(o.x0,Math.min(p.x,o.x1)),cz=Math.max(o.z0,Math.min(p.z,o.z1));let dx=p.x-cx,dz=p.z-cz,d=Math.hypot(dx,dz);if(d<r){if(d<1e-4){dx=1;dz=0;d=1}p.x+=dx/d*(r-d);p.z+=dz/d*(r-d)}}}
function groundH(x,z,y){let g=0;for(const o of AB)if(o.t<=y+.75&&o.t>g&&x>o.x0-.35&&x<o.x1+.35&&z>o.z0-.35&&z<o.z1+.35)g=o.t;return g}
function inBox(x,z,m){for(const o of AB)if(o.y0<1&&x>o.x0-m&&x<o.x1+m&&z>o.z0-m&&z<o.z1+m)return true;return false}
function clear(ax,az,bx,bz,m){const d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/.5);for(let i=1;i<n;i++){const t=i/n;if(inBox(ax+(bx-ax)*t,az+(bz-az)*t,m))return false}return true}
const rc=new THREE.Raycaster(),_a=new THREE.Vector3(),_b=new THREE.Vector3();
function los3(ax,ay,az,bx,by,bz){_a.set(ax,ay,az);_b.set(bx,by,bz);const d=_a.distanceTo(_b);rc.set(_a,_b.clone().sub(_a).normalize());rc.far=d;return rc.intersectObjects(obs,false).length===0}
const S=3,N=31,O=-45,D8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],free=[],FL=[];
for(let i=0;i<N;i++){free[i]=[];for(let j=0;j<N;j++)free[i][j]=!inBox(O+i*S,O+j*S,.9)}
const cell=v=>clamp(Math.round((v-O)/S),0,N-1);
function nearFree(i,j){for(let r=0;r<5;r++)for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++){const x=i+a,y=j+b;if(x>=0&&y>=0&&x<N&&y<N&&free[x][y])return[x,y]}return[i,j]}
function path(ax,az,bx,bz){const[si,sj]=nearFree(cell(ax),cell(az)),[ti,tj]=nearFree(cell(bx),cell(bz)),k=(i,j)=>i*N+j,prev=new Map([[k(si,sj),null]]),q=[[si,sj]];
 while(q.length){const[i,j]=q.shift();if(i===ti&&j===tj)break;for(const[a,b]of D8){const x=i+a,y=j+b;if(x<0||y<0||x>=N||y>=N||!free[x][y]||prev.has(k(x,y)))continue;if(a&&b&&(!free[i+a][j]||!free[i][j+b]))continue;prev.set(k(x,y),[i,j]);q.push([x,y])}}
 const out=[];if(!prev.has(k(ti,tj)))return out;let c=[ti,tj];while(c){out.push({x:O+c[0]*S,z:O+c[1]*S});c=prev.get(k(c[0],c[1]))}return out.reverse()}
(function(){const[si,sj]=nearFree(cell(0),cell(34)),seen=new Set([si*N+sj]),q=[[si,sj]];while(q.length){const[i,j]=q.shift();FL.push({x:O+i*S,z:O+j*S});for(const[a,b]of D8){const x=i+a,y=j+b;if(x<0||y<0||x>=N||y>=N||!free[x][y]||seen.has(x*N+y))continue;if(a&&b&&(!free[i+a][j]||!free[i][j+b]))continue;seen.add(x*N+y);q.push([x,y])}}})();
const d2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),pickF=()=>FL[Math.floor(Math.random()*FL.length)];
const WEAP=[{k:'ar',n:'AR-4',dmg:22,rate:.098,mag:30,spr:1,rel:1.55,auto:1,rec:.005},
 {k:'smg',n:'VK-9 SMG',dmg:16,rate:.066,mag:34,spr:1.9,rel:1.35,auto:1,rec:.0038},
 {k:'mk',n:'LR-7 DMR',dmg:62,rate:.34,mag:10,spr:.28,rel:2.0,auto:0,rec:.016},
 {k:'lmg',n:'HAMR LMG',dmg:24,rate:.088,mag:70,spr:1.35,rel:3.1,auto:1,rec:.006}];
const DIF=[{n:'Recruit',react:1.0,acc:.4,dmg:6,sp:5.0,wk:3.0,flank:.06,crouch:.12,nade:false},
 {n:'Regular',react:.68,acc:.6,dmg:8,sp:5.6,wk:3.4,flank:.16,crouch:.28,nade:false},
 {n:'Hardened',react:.42,acc:.8,dmg:10,sp:6.2,wk:3.8,flank:.3,crouch:.45,nade:true},
 {n:'Veteran',react:.28,acc:.92,dmg:12,sp:6.6,wk:4.1,flank:.45,crouch:.6,nade:true}];
const MODES={duel:{goal:10,bots:[[1,'Raze']],time:360},squad:{goal:20,bots:[[0,'Dagger'],[1,'Raze'],[1,'Vex']],time:480},br:{goal:11,bots:[[1,'Raze'],[2,'Vex'],[3,'Kuro'],[4,'Nox'],[5,'Zed'],[6,'Mako'],[7,'Ryn']],time:0}};
const P={isP:true,team:0,name:'You',pos:new THREE.Vector3(0,0,34),vy:0,yaw:0,pitch:0,hp:100,armor:0,spd:0,cd:0,dead:0,ground:true,crouch:false,adsT:0,bloom:0,ammo:30,rel:0,prot:0,gl:3,glcd:0,hl:2,healQ:0,nades:2,slide:null,slcd:0,campT:0,deaths:0,shots:0,hits:0};
let dif=1,wi=0,aimOn=true,invY=false,qHigh=true,cur='duel',bots=[],kills=Array(10).fill(0),goal=10,over=false,playing=false,started=false,dmgA=0,mouseDown=false,adsHold=false,sens=1,time=0,warm=0,zoneOn=false,zt=0,zr=70,timeLeft=0,overtime=false,streak=0,stUsed={uav:false,sup:false,air:false},uavT=0,shakeT=0,shakeA=0,hvtT=0,hvtBot=null,dropT=45,gren=[],crates=[],strikes=[],mp=null,mpK={},lastSend=0;
const keys={},mv={x:0,y:0},T={};
const alive=e=>e.dead<=0;
const enemies=b=>[P,...bots].filter(e=>e!==b&&e.team!==b.team&&alive(e));
const zoneR=t=>t<20?70:Math.max(11,70-(t-20)*.35);
function spawnFor(team,self){const br=cur==='br';for(let t=0;t<140;t++){const p=pickF(),o=[P,...bots].filter(e=>e!==self&&alive(e));
 const ok=br?o.every(e=>d2(e.pos,p)>25-t*.2):(team===0?p.z>26:p.z<-26);
 if(ok&&o.every(e=>d2(e.pos,p)>4))return p}return pickF()}
const parts=[],pGeo=new THREE.BoxGeometry(.1,.1,.1);
function spawnPart(x,y,z,vx,vy,vz,col,size,life,grav){if(parts.length>260)return;const m=new THREE.Mesh(pGeo,new THREE.MeshBasicMaterial({color:col,transparent:true}));m.position.set(x,y,z);m.scale.setScalar(size);scene.add(m);parts.push({m,vx,vy,vz,life,t:life,g:grav||0,s:size})}
function impactFX(p,norm,kind){const n=kind===2?10:7;
 for(let i=0;i<n;i++)spawnPart(p.x,p.y,p.z,(Math.random()-.5)*5,(Math.random())*4,(Math.random()-.5)*5,kind===2?0x8a1020:(kind===1?0xffc040:0xd8d8d8),.07+Math.random()*.06,.35+Math.random()*.3,9);
 if(kind!==2)for(let i=0;i<3;i++)spawnPart(p.x,p.y,p.z,(Math.random()-.5)*1.2,1+Math.random(),(Math.random()-.5)*1.2,0x999999,.14,.7,-.5)}
function smokeFX(x,y,z,col){for(let i=0;i<6;i++)spawnPart(x+(Math.random()-.5),y+Math.random()*.5,z+(Math.random()-.5),(Math.random()-.5)*1.4,1.6+Math.random()*1.4,(Math.random()-.5)*1.4,col||0x777788,.22,.9+Math.random()*.5,-1)}
const fx=[];function tracer(a,b,col,w){const l=a.distanceTo(b),m=new THREE.Mesh(new THREE.BoxGeometry(w||.05,w||.05,l),new THREE.MeshBasicMaterial({color:col,transparent:true,blending:THREE.AdditiveBlending}));m.position.copy(a).lerp(b,.5);m.lookAt(b);scene.add(m);fx.push({m,t:.09})}
function shake(a,t){shakeA=Math.max(shakeA,a);shakeT=Math.max(shakeT,t)}
const boomL=new THREE.PointLight(0xffa040,0,26);scene.add(boomL);let boomT=0;
function explode(x,y,z,r,dmg,src){sExplode();shake(clamp(1.6-d2({x,z},P.pos)*.05,.2,1.6),.5);
 for(let i=0;i<22;i++)spawnPart(x,y+.4,z,(Math.random()-.5)*11,Math.random()*9,(Math.random()-.5)*11,i%3?0xffa030:0xff5522,.09+Math.random()*.1,.5+Math.random()*.4,10);
 for(let i=0;i<10;i++)spawnPart(x,y+.6,z,(Math.random()-.5)*3,2+Math.random()*3,(Math.random()-.5)*3,0x555555,.25,1.1,-.8);
 boomL.position.set(x,y+1,z);boomL.intensity=4;boomT=.35;
 const pd=Math.hypot(P.pos.x-x,P.pos.z-z);
 if(pd<r&&P.dead<=0&&P.prot<=0){const f=1-pd/r*.75;hurt(Math.round(dmg*f),src)}
 for(const b of bots)if(b.dead<=0){const d=Math.hypot(b.pos.x-x,b.pos.z-z);if(d<r&&(!src||b.team!==src.team)){if(b.spd>4)dmg*=.6;dmgBot(b,Math.round(dmg*(1-d/r*.75)),src,false);b.alert=6;b.last=src?{x:src.pos.x,z:src.pos.z}:{x,z};b.rp=0}}}
function toast(t,c,ms){const m=$('msg');m.textContent=t;m.style.color=c||'#fff';m.style.opacity=1;clearTimeout(toast.h);toast.h=setTimeout(()=>m.style.opacity=0,ms||1500)}
function event(t,ms){const m=$('ev');m.textContent=t;m.style.opacity=1;clearTimeout(event.h);event.h=setTimeout(()=>m.style.opacity=0,ms||3500)}
function feed(t,c){const d=document.createElement('div');d.textContent=t;d.style.borderColor=c;$('feed').appendChild(d);setTimeout(()=>d.remove(),4500);if($('feed').children.length>5)$('feed').firstChild.remove()}
const $hm=$('hm');
function hitmark(head){$('hm').style.opacity=1;$hm.style.borderColor=head?'#ff4d6d':'#fff';sTick(head);clearTimeout(hitmark.h);hitmark.h=setTimeout(()=>$('hm').style.opacity=0,100)}
function score(){let a,o;if(mp){a=mpK[mp.id]||0;o=Math.max(0,...Object.entries(mpK).filter(e=>e[0]!==mp.id).map(e=>e[1]))}else{a=kills[0];o=Math.max(...kills.slice(1))}
 const storm=zoneOn?`STORM ${zr.toFixed(0)}m${zt<20?' - closes '+Math.ceil(20-zt)+'s':''}`:'';
 const tl=timeLeft>0?`${Math.floor(timeLeft/60)}:${String(Math.floor(timeLeft%60)).padStart(2,'0')}${overtime?' OT':''}`:'';
 $('sc').innerHTML=`${a} : ${o}<small>First to ${goal} - ${tl||storm}${tl&&storm?' - '+storm:''}</small>`}
const SK=[0xe0b090,0x8d5a3c,0xc68642,0xf1c27d];
function mkBot(team,name,wk){const col=CH[ti(team)],g=new THREE.Group(),
 b={team,name,pos:new THREE.Vector3(),hp:100,dead:0,rot:Math.PI,wk:wk||(Math.random()<.25?'mk':(Math.random()<.5?'smg':'ar')),g,state:'patrol',sees:false,react:0,cd:0,burst:3,strafe:1,strafeT:0,path:[],rp:0,last:null,flashT:0,cover:null,heard:null,seenT:0,losT:Math.random()*.2,tgt:null,alert:0,spd:0,walk:0,called:false,crouchT:0,gloo:1,nadeCd:8,hvt:0,flankPt:null,flankCd:4,wait:1+Math.random()*2,pt:null,legs:[],hips:[],hit:[]};
 const suit=new THREE.MeshStandardMaterial({color:new THREE.Color(col).multiplyScalar(.45),roughness:.65,metalness:.2}),dk=new THREE.MeshStandardMaterial({color:0x232b38,roughness:.5,metalness:.5}),skin=new THREE.MeshStandardMaterial({color:SK[Math.floor(Math.random()*4)],roughness:.85}),acc=new THREE.MeshStandardMaterial({color:0x101418,emissive:col});b.dk=suit;
 const top=new THREE.Group();g.add(top);b.top=top;
 const add=(geo,m,x,y,z,t,par)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.userData={part:t,bot:b};if(t)b.hit.push(o);(par||top).add(o);return o};
 const bx=(w,h,d)=>new THREE.BoxGeometry(w,h,d),cy=(a,c,h)=>new THREE.CylinderGeometry(a,c,h,10),sp=r=>new THREE.SphereGeometry(r,12,10),grp=(x,y,z,par)=>{const o=new THREE.Group();o.position.set(x,y,z);(par||g).add(o);return o};
 add(bx(.5,.22,.3),dk,0,.98,0,'body');add(bx(.42,.26,.28),suit,0,1.17,0,'body');add(bx(.56,.36,.34),suit,0,1.45,0,'body');add(bx(.4,.24,.06),acc,0,1.45,.19);
 add(bx(.3,.4,.16),dk,0,1.4,-.25);add(cy(.06,.07,.1),skin,0,1.66,0,'body');
 add(sp(.14),skin,0,1.8,0,'head');add(new THREE.SphereGeometry(.17,12,8,0,Math.PI*2,0,Math.PI*.55),dk,0,1.82,0,'head');add(bx(.24,.06,.05),acc,0,1.8,.14);
 add(bx(.07,.1,.7),dk,.18,1.3,.42);add(bx(.05,.05,.32),dk,.18,1.32,.9);
 for(const s of[-1,1]){const sh=grp(s*.36,1.55,top);add(sp(.1),dk,0,0,0,'body',sh);add(cy(.07,.06,.3),suit,0,-.16,0,'body',sh);const fo=grp(0,-.3,0,sh);add(cy(.06,.05,.28),skin,0,-.14,0,'body',fo);
  sh.rotation.x=s<0?-1.35:-1.1;sh.rotation.z=s<0?-.45:.05;fo.rotation.x=-.25}
 for(const s of[-1,1]){const hp=grp(s*.13,.95,g);add(cy(.095,.08,.46),suit,0,-.23,0,'body',hp);const kn=grp(0,-.46,0,hp);add(cy(.075,.06,.42),dk,0,-.21,0,'body',kn);add(bx(.14,.1,.27),dk,0,-.44,.05,'body',kn);b.legs.push({hp,kn});b.hips.push(hp)}
 if(team===0){b.mk=new THREE.Mesh(new THREE.OctahedronGeometry(.14),new THREE.MeshBasicMaterial({color:0x35c8ff,depthTest:false}));b.mk.position.y=2.5;b.mk.renderOrder=9;g.add(b.mk)}
 const bg=new THREE.Mesh(new THREE.PlaneGeometry(.9,.1),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.55})),fl=new THREE.Mesh(new THREE.PlaneGeometry(.86,.06),emis(col));fl.position.z=.01;bg.add(fl);scene.add(bg);b.bar=bg;b.fl=fl;
 if(b.wk==='mk')add(bx(.06,.1,1.1),dk,.18,1.3,.5);
 scene.add(g);return b}
function animB(b,dt,ox,oz){b.spd=Math.hypot(b.pos.x-ox,b.pos.z-oz)/Math.max(dt,.001);b.walk+=b.spd*dt*1.6;const sw=Math.sin(b.walk)*Math.min(1,b.spd/4)*.7;
 const cr=b.crouchT>0?1:0;b.crT=lerp(b.crT||0,cr,Math.min(1,dt*8));
 b.top.position.y=-.42*b.crT;b.top.rotation.x=.14*b.crT;
 b.legs[0].hp.rotation.x=sw*(1-b.crT)-1.15*b.crT;b.legs[1].hp.rotation.x=-sw*(1-b.crT)-1.15*b.crT;
 b.legs[0].kn.rotation.x=Math.max(0,-sw)*(1-b.crT)+1.55*b.crT;b.legs[1].kn.rotation.x=Math.max(0,sw)*(1-b.crT)+1.55*b.crT;
 if(b.mk)b.mk.rotation.y=time*3;b.g.position.set(b.pos.x,b.pos.y||0,b.pos.z);b.g.rotation.y=b.rot}
function respawnBot(b){const s=spawnFor(b.team,b);b.pos.set(s.x,0,s.z);b.hp=100;b.aimT=0;b.state='patrol';b.last=null;b.path=[];b.pt=null;b.wait=1;b.sees=false;b.called=false;b.crouchT=0;b.gloo=1;b.hvt=0;b.g.visible=true;b.bar.visible=true;b.flankPt=null;b.glcd2=false}
function botMove(b,dx,dz,sp,dt){const d=Math.hypot(dx,dz)||1;b.pos.x+=dx/d*sp*dt;b.pos.z+=dz/d*sp*dt;resolve(b.pos,.45,0,0)}
function goTo(b,tx,tz,sp,dt){b.rp-=dt;if(b.rp<=0||!b.path.length){b.path=path(b.pos.x,b.pos.z,tx,tz);b.rp=.55+Math.random()*.2}
 const p=b.path;while(p.length>1&&(Math.hypot(p[0].x-b.pos.x,p[0].z-b.pos.z)<1||clear(b.pos.x,b.pos.z,p[1].x,p[1].z,.5)))p.shift();
 let wx=tx,wz=tz;if(p.length&&!clear(b.pos.x,b.pos.z,tx,tz,.5)){wx=p[0].x;wz=p[0].z}
 botMove(b,wx-b.pos.x,wz-b.pos.z,sp,dt);return[Math.hypot(tx-b.pos.x,tz-b.pos.z),wx,wz]}
function pickCover(b,ref,rad){let best=null,bd=1e9;for(const c of FL){const d=Math.hypot(c.x-b.pos.x,c.z-b.pos.z);if(d>rad||d>=bd)continue;if(clear(c.x,c.z,ref.x,ref.z))continue;bd=d;best=c}return best}
function noise(src,rad){for(const b of bots)if(b!==src&&b.team!==src.team&&b.dead<=0&&d2(b.pos,src.pos)<(rad||38)){b.heard={x:src.pos.x+(Math.random()-.5)*8,z:src.pos.z+(Math.random()-.5)*8};b.alert=Math.max(b.alert,3)}}
const bflashL=new THREE.PointLight(0xffd080,0,10);scene.add(bflashL);let bflashT=0;
function botFire(b,t,dist){const df=DIF[dif],a=new THREE.Vector3(b.pos.x+Math.sin(b.rot)*.9,1.32,b.pos.z+Math.cos(b.rot)*.9);
 const ch=clamp(.85-dist*.015-(t.spd||0)*.045-(t.crouch?.14:0)-.08*(b.spd>1?1:0),.04,.72)*df.acc*(.35+.65*(b.aimT||0));
 const head=Math.random()<.1,e=new THREE.Vector3(t.pos.x,t.pos.y+(head?1.8:(t.crouch?.95:1.25)),t.pos.z);
 const hit=Math.random()<ch;
 if(!hit){e.x+=(Math.random()-.5)*3.2;e.y+=(Math.random()-.5)*1.7;e.z+=(Math.random()-.5)*3.2}
 tracer(a,e,CH[ti(b.team)]);if(d2(b.pos,P.pos)<40)sShot('ar');noise(b,30);
 bflashL.position.copy(a);bflashL.intensity=1.6;bflashT=.06;
 if(hit){if(t.isP)hurt(df.dmg,b);else dmgBot(t,Math.round(df.dmg*(head?1.8:1)),b,head)}}
function unseenBy(t,b){if(!t.isP)return true;let da=Math.atan2(b.pos.x-t.pos.x,b.pos.z-t.pos.z)-t.yaw;da=Math.atan2(Math.sin(da),Math.cos(da));return Math.abs(da)>1.05}
function botUpdate(b,dt){
 if(b.dead>0){b.dead-=dt;if(b.dead<=0)respawnBot(b);return}
 const df=DIF[dif],ox=b.pos.x,oz=b.pos.z;
 if(warm>0){animB(b,dt,ox,oz);return}
 b.alert=Math.max(0,b.alert-dt);b.flankCd=Math.max(0,b.flankCd-dt);b.nadeCd=Math.max(0,b.nadeCd-dt);
 if(b.hvt>0)b.hvt-=dt;
 b.losT-=dt;if(b.losT<=0){b.losT=.12+Math.random()*.08;b.tgt=null;let bd=1e9;
  for(const e of enemies(b)){const d=d2(e.pos,b.pos);if(d>60||d>=bd)continue;
   if(b.alert<=0&&d>7){let da=Math.atan2(e.pos.x-b.pos.x,e.pos.z-b.pos.z)-b.rot;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)>1.2)continue}
   if(los3(b.pos.x,1.5,b.pos.z,e.pos.x,e.pos.y+1.3,e.pos.z)){bd=d;b.tgt=e}}}
 const t=b.tgt&&alive(b.tgt)?b.tgt:null;
 if(t){b.seenT=0;if(!b.sees){b.sees=true;b.react=df.react*(.8+Math.random()*.5);
   if(!b.called){b.called=true;for(const o of bots)if(o!==b&&o.team===b.team&&o.dead<=0&&!o.tgt&&!o.last){o.last={x:t.pos.x,z:t.pos.z};o.alert=4}}}
  b.last={x:t.pos.x,z:t.pos.z};b.alert=6;b.aimT=Math.min(1,(b.aimT||0)+dt/3.2);
  if(b.sees&&d2(b.pos,t.pos)<9)b.aimT=1}
 else{b.sees=false;b.seenT=(b.seenT||0)+dt;b.aimT=Math.max(0,(b.aimT||0)-dt*.5);if(b.seenT>6)b.called=false}
 if(b.heard&&!t){b.last=b.heard;b.alert=Math.max(b.alert,3.5);b.rp=0}
 b.heard=null;
 if(b.flashT>0){b.flashT-=dt;if(b.flashT<=0)b.dk.emissive.setHex(0)}
 const ref=t?t.pos:b.last,outside=zoneOn&&Math.hypot(b.pos.x,b.pos.z)>zr-6;
 if(outside)b.state='zone';
 else if(b.state==='zone'&&!outside)b.state='patrol';
 else if(b.hp<34&&ref&&b.state!=='cover'){b.cover=pickCover(b,ref,18);b.state='cover';b.crouchT=1.2}
 else if(b.state==='cover'&&b.hp>=72)b.state=t?'engage':'hunt';
 else if(b.state==='flank'){if(!t)b.state=b.last?'hunt':'patrol';else if(Math.hypot(b.pos.x-b.flankPt.x,b.pos.z-b.flankPt.z)<2.5)b.state='engage'}
 else if(t){b.state='engage';
  if(b.flankCd<=0&&d2(b.pos,t.pos)<34&&unseenBy(t,b)&&Math.random()<df.flank*dt*3){
   for(const o of bots)if(o!==b&&o.team===b.team&&o.dead<=0&&o.tgt===t){const ang=Math.atan2(b.pos.x-t.pos.x,b.pos.z-t.pos.z)+(Math.random()<.5?1.25:-1.25),r=13+Math.random()*6;
    const fx=clamp(t.pos.x+Math.sin(ang)*r,-43,43),fz=clamp(t.pos.z+Math.cos(ang)*r,-43,43);
    if(clear(fx,fz,b.pos.x,b.pos.z,.3)){b.flankPt={x:fx,z:fz};b.state='flank';b.rp=0;b.flankCd=9}break}}
 }
 else if(b.last)b.state='hunt';
 else b.state='patrol';
 let face=b.rot;
 if(b.state==='zone'){const r=goTo(b,0,0,df.sp+.5,dt);face=Math.atan2(r[1]-b.pos.x,r[2]-b.pos.z)}
 else if(b.state==='cover'){
  if(b.cover){const r=goTo(b,b.cover.x,b.cover.z,df.sp,dt);face=Math.atan2(r[1]-b.pos.x,r[2]-b.pos.z);if(r[0]<1.3){b.crouchT=.6;b.hp=Math.min(100,b.hp+7*dt);if(t&&d2(b.pos,t.pos)<7)b.state='engage'}}else b.hp=Math.min(100,b.hp+4*dt);
  if(t&&b.gloo>0&&b.hp<50&&b.glcd2!==true){b.glcd2=true;botGloo(b,t)}}
 else if(b.state==='flank'&&b.flankPt){const r=goTo(b,b.flankPt.x,b.flankPt.z,df.sp,dt);face=Math.atan2(r[1]-b.pos.x,r[2]-b.pos.z)}
 else if(b.state==='engage'&&t){
  const dist=d2(t.pos,b.pos)||1,px=t.pos.x,pz=t.pos.z,ux=(px-b.pos.x)/dist,uz=(pz-b.pos.z)/dist,nx=uz,nz=-ux;
  face=Math.atan2(px-b.pos.x,pz-b.pos.z);
  b.strafeT-=dt;if(b.strafeT<=0){b.strafeT=.7+Math.random()*1.3;b.strafe=Math.random()<.5?-1:1;if(Math.random()<df.crouch)b.crouchT=.8+Math.random()*.9}
  b.crouchT=Math.max(0,b.crouchT-dt);
  const band=b.wk==='smg'?[5,11]:b.wk==='mk'?[15,30]:[8,18];
  let mx=nx*b.strafe,mz=nz*b.strafe;
  if(dist>band[1]){mx+=ux*.9;mz+=uz*.9}else if(dist<band[0]){mx-=ux*.7;mz-=uz*.7}
  const sx=b.pos.x,sz=b.pos.z,sp=(b.crouchT>0?df.sp*.42:df.sp*.86);
  botMove(b,mx,mz,sp,dt);
  if(Math.hypot(b.pos.x-sx,b.pos.z-sz)<.35*sp*dt)b.strafe*=-1;
  b.react-=dt;
  if(b.react<=0){b.cd-=dt;if(b.cd<=0){botFire(b,t,dist);if(--b.burst>0)b.cd=.13;else{b.burst=2+Math.floor(Math.random()*(2+dif));b.cd=Math.max(.55,.95-dif*.08)+Math.random()*.7}}}
  if(df.nade&&t.isP&&b.nadeCd<=0&&t.campT>3&&dist>8&&dist<24&&b.sees){b.nadeCd=14;const dx=(t.pos.x-b.pos.x)/1.3,dz=(t.pos.z-b.pos.z)/1.3;throwNade(b.pos.x,1.5,b.pos.z,dx,6.5,dz,b);feed(b.name+' threw a grenade','#ff9a4d')}}
 else if(b.state==='hunt'&&b.last){
  const dx=b.last.x-b.pos.x,dz=b.last.z-b.pos.z,r=goTo(b,b.last.x,b.last.z,b.alert>3?df.sp:df.wk,dt);face=Math.atan2(r[1]-b.pos.x,r[2]-b.pos.z);
  if(Math.hypot(dx,dz)<2.6){b.last=null;b.wait=1.4;b.pt=null;b.alert=Math.min(b.alert,2)}}
 else{
  if(b.team===0&&!b.remote&&d2(P.pos,b.pos)>7){const r=goTo(b,P.pos.x+2.2,P.pos.z+2.2,df.sp,dt);face=Math.atan2(r[1]-b.pos.x,r[2]-b.pos.z)}
  else if(b.team===0&&!b.remote){if(t)face=Math.atan2(t.pos.x-b.pos.x,t.pos.z-b.pos.z);else face=b.rot+Math.sin(time*.8+b.walk)*.02}
  else{b.wait-=dt;if(b.wait>0)face=b.rot+Math.sin(time*1.3)*.015;
   else{if(!b.pt||d2(b.pt,b.pos)<2){b.pt=pickF()}if(b.pt){const r=goTo(b,b.pt.x,b.pt.z,df.wk,dt);face=Math.atan2(r[1]-b.pos.x,r[2]-b.pos.z);if(r[0]<2){b.pt=null;b.wait=1.5+Math.random()*3}}}}}
 for(const o of bots)if(o!==b&&o.dead<=0){const d=d2(o.pos,b.pos);if(d<.9&&d>.001){b.pos.x+=(b.pos.x-o.pos.x)/d*.02;b.pos.z+=(b.pos.z-o.pos.z)/d*.02}}
 let da=face-b.rot;da=Math.atan2(Math.sin(da),Math.cos(da));b.rot+=da*Math.min(1,dt*7);
 animB(b,dt,ox,oz)}
function botGloo(b,t){const mx=(b.pos.x+t.pos.x)/2,mz=(b.pos.z+t.pos.z)/2,dx=t.pos.x-b.pos.x,dz=t.pos.z-b.pos.z,al=Math.abs(dx)>Math.abs(dz);
 boxW(mx+(Math.random()-.5),mz+(Math.random()-.5),al?.5:3.4,al?3.4:.5);b.gloo--;if(d2(b.pos,P.pos)<30)beep(700,.15,'triangle',.06)}
function dmgBot(b,n,src,head){if(b.dead>0)return;b.hp-=n;b.flashT=.09;b.dk.emissive.setHex(0x883322);
 if(src&&src.pos){b.last={x:src.pos.x,z:src.pos.z};b.alert=6;b.rp=0;b.tgt=b.tgt||src}
 spawnPart(b.pos.x,1.3,b.pos.z,(Math.random()-.5)*2,2,(Math.random()-.5)*2,0x8a1020,.09,.4,8);
 if(b.hp<=0){b.hp=0;kill(src,b,head)}}
function kill(k,v,head){
 if(mp){
  if(v.isP){P.dead=999;P.deaths++;streak=0;stUsed={uav:false,sup:false,air:false};updateChips();toast('YOU WERE ELIMINATED','#ff4d6d',2000)}
  else{v.dead=999;v.g.visible=false;v.bar.visible=false}
  return}
 if(over)return;let bonus=0;
 if(k&&k.team!=null){kills[k.team]++;if(v.hvt>0){kills[k.team]++;bonus=1}
  feed(`${k.name} > ${v.name}${head?' (head)':''}${bonus?' +HVT':''}`,CS[ti(k.team)]);
  if(k.isP){streak++;sKill();toast(head?'HEADSHOT':(bonus?'HVT ELIMINATED +2':'ELIMINATED '+v.name.toUpperCase()),head?'#ff4d6d':'#35c8ff');
   if(bonus)event('HIGH VALUE TARGET DOWN +2');checkStreaks()}}
 else feed(`${v.name} was lost to the storm`,'#4fb0ff');
 if(v.isP){P.dead=4;P.deaths++;streak=0;stUsed={uav:false,sup:false,air:false};updateChips();toast('YOU WERE ELIMINATED','#ff4d6d',2000)}
 else{v.dead=4;v.g.visible=false;v.bar.visible=false;if(v.hvt>0)hvtBot=null}
 score();if(k&&k.team!=null&&kills[k.team]>=goal)endGame(k.team===0)}
const tmp=[],casings=[];
function rmBox(m){scene.remove(m);const ab=m.userData.ab;if(ab){const i=AB.indexOf(ab);if(i>=0)AB.splice(i,1)}const j=obs.indexOf(m);if(j>=0)obs.splice(j,1)}
function boxW(x,z,w,d,life){const m=box(x,z,w,d,2.2,iceM);tmp.push({m,t:life||14});return m}
const vg=new THREE.Group();cam.add(vg);
const gm=new THREE.MeshStandardMaterial({color:0x242e3c,metalness:.75,roughness:.35}),gm2=new THREE.MeshStandardMaterial({color:0x11161e,metalness:.6,roughness:.5});
const gb=new THREE.Mesh(new THREE.BoxGeometry(.09,.14,.55),gm);vg.add(gb);
const gbar=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.42,8),gm2);gbar.rotation.x=Math.PI/2;gbar.position.set(0,.03,-.42);vg.add(gbar);
const gmag=new THREE.Mesh(new THREE.BoxGeometry(.07,.2,.12),gm2);gmag.position.set(0,-.15,.02);vg.add(gmag);
const gstk=new THREE.Mesh(new THREE.BoxGeometry(.08,.12,.22),gm2);gstk.position.set(0,-.02,.32);vg.add(gstk);
const gsight=new THREE.Mesh(new THREE.BoxGeometry(.03,.06,.1),gm2);gsight.position.set(0,.1,-.12);vg.add(gsight);
const gdot=new THREE.Mesh(new THREE.BoxGeometry(.012,.012,.012),emis(0x35ffb0));gdot.position.set(0,.1,-.17);vg.add(gdot);
vg.position.set(.24,-.22,-.5);
const mf=new THREE.PointLight(0xffd966,0,12);mf.position.set(.2,-.15,-1);cam.add(mf);let muzzleT=0,gunKick=0;
const casGeo=new THREE.BoxGeometry(.03,.03,.05);
function reload(){const W=WEAP[wi];if(P.rel>0||P.ammo>=W.mag||P.dead>0)return;P.rel=W.rel;sReload()}
function currentSpread(){const W=WEAP[wi];let s=.0016*W.spr+P.bloom*.004;
 if(P.spd>1)s*=1.5;if(!P.ground)s*=2;if(P.crouch)s*=.75;if(P.adsT>.5)s*=.32;return s}
function shoot(){const W=WEAP[wi];if(P.ammo<=0){reload();return}
 P.cd=W.rate;P.ammo--;P.shots++;noise(P,46);
 const sp=currentSpread();rc.setFromCamera({x:(Math.random()-.5)*sp*2,y:(Math.random()-.5)*sp*2},cam);rc.far=140;
 const tg=obs.slice();for(const b of bots)if(b.dead<=0){b.g.updateMatrixWorld(true);tg.push(...b.hit)}
 const h=rc.intersectObjects(tg,false)[0];
 const end=h?h.point.clone():rc.ray.at(90,new THREE.Vector3());
 const fw=new THREE.Vector3();cam.getWorldDirection(fw);const rt=new THREE.Vector3().crossVectors(fw,cam.up).normalize();
 const o=cam.position.clone().add(fw.multiplyScalar(.7)).add(rt.multiplyScalar(.17));o.y-=.1;
 tracer(o,end,0xffe27a,.045);sShot(W.k);muzzleT=.05;gunKick=1;P.bloom=Math.min(1,P.bloom+.14);
 P.pitch=clamp(P.pitch+W.rec,-1.5,1.5);P.yaw+=(Math.random()-.5)*W.rec*.8;
 const ub=h&&h.object.userData.bot;
 if(ub&&ub.team!==0){P.hits++;const hd=h.object.userData.part==='head';hitmark(hd);
  if(ub.remote)Net.send({t:'h',id:ub.id,dmg:Math.round(W.dmg*(hd?2.1:1)),hd:hd?1:0});
  else dmgBot(ub,W.dmg*(hd?2.1:1),P,hd)}
 else if(h)impactFX(end,null,Math.random()<.3?1:0);
 if(casings.length<24){const c=new THREE.Mesh(casGeo,new THREE.MeshBasicMaterial({color:0xd8b040}));c.position.copy(o);scene.add(c);casings.push({c,vx:rt.x*1.6+fw.x*.5,vy:1.8,vz:rt.z*1.6+fw.z*.5,t:1})}}
function gloo(){if(!playing||P.dead>0||P.gl<=0||P.glcd>0||over)return;const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),x=P.pos.x+fx*3,z=P.pos.z+fz*3,al=Math.abs(fx)>Math.abs(fz),w=al?.5:3.4,d=al?3.4:.5;
 boxW(x,z,w,d);P.gl--;P.glcd=3;beep(700,.15,'triangle',.08);event('CHAKRA WALL DEPLOYED',1200);if(mp)Net.send({t:'g',x,z,w,d})}
function heal(){if(!playing||P.dead>0||P.hl<=0||P.hp>=100||over)return;P.hl--;if(mp){P.healQ+=60;Net.send({t:'m'})}else P.healQ+=60;toast('+60 HP','#4dff9a',900)}
const nadeGeo=new THREE.SphereGeometry(.11,8,6),nadeMat=new THREE.MeshStandardMaterial({color:0x2a3328,roughness:.5,metalness:.4});
function throwNade(x,y,z,dx,dy,dz,src){const m=new THREE.Mesh(nadeGeo,nadeMat);m.position.set(x,y,z);m.castShadow=true;scene.add(m);gren.push({m,p:new THREE.Vector3(x,y,z),v:new THREE.Vector3(dx,dy,dz),t:2.1,src})}
function nade(){if(!playing||P.dead>0||P.nades<=0||over)return;P.nades--;const fw=new THREE.Vector3();cam.getWorldDirection(fw);
 throwNade(cam.position.x+fw.x*.5,cam.position.y-.1,cam.position.z+fw.z*.5,fw.x*17,fw.y*17+5,fw.z*17,P);beep(500,.1,'triangle',.1)}
const crateGeo=new THREE.BoxGeometry(1.5,1.1,1.5);
function spawnCrate(x,z,kind){const m=new THREE.Mesh(crateGeo,kind==='sup'?hazM:cm);m.castShadow=true;scene.add(m);
 const c={m,x,z,y:17,vy:0,kind,t:45,landed:false,ft:0};m.position.set(x,17,z);crates.push(c);
 event((kind==='sup'?'SCROLL DROP':'CHAKRA CACHE')+' INBOUND - CHECK MINIMAP');sBeep2(600,900)}
function updateCrates(dt){for(let i=crates.length-1;i>=0;i--){const c=crates[i];c.t-=dt;
 if(!c.landed){c.vy-=22*dt;c.y+=c.vy*dt;const g=groundH(c.x,c.z,10)+.55;if(c.y<=g){c.y=g;c.landed=true;shake(.3,.2);nz(.2,400,.3)}
  c.m.position.set(c.x,c.y,c.z);c.m.rotation.y+=dt*2;continue}
 c.ft-=dt;if(c.ft<=0){c.ft=.16;spawnPart(c.x+(Math.random()-.5)*.6,c.y+.6,c.z+(Math.random()-.5)*.6,(Math.random()-.5)*.5,2.4,(Math.random()-.5)*.5,c.kind==='sup'?0xff4040:0x35c8ff,.12,.8,-.6)}
 c.m.position.set(c.x,c.y,c.z);
 if(d2({x:c.x,z:c.z},P.pos)<1.9&&P.dead<=0){
  if(c.kind==='sup'){P.armor=100;P.nades=Math.min(3,P.nades+2);P.hl=Math.min(3,P.hl+1);P.ammo=WEAP[wi].mag;P.hp=100;toast('SUPPLIES SECURED','#ffc933')}
  else{P.armor=100;if(wi!==3){wi=3;P.ammo=70;toast('SEVER BLADE LMG ACQUIRED','#ffc933')}else{P.nades=3;toast('RESUPPLIED','#ffc933')}}
  c.t=0}}
 for(let i=crates.length-1;i>=0;i--)if(crates[i].t<=0){scene.remove(crates[i].m);crates.splice(i,1)}}
function checkStreaks(){if(streak>=3&&!stUsed.uav){stUsed.uav=true;event('BYAKUGAN READY - PRESS 1');sBeep2(500,700)}
 if(streak>=5&&!stUsed.sup){stUsed.sup=true;event('SCROLL DROP READY - PRESS 2');sBeep2(500,700)}
 if(streak>=7&&!stUsed.air){stUsed.air=true;event('METEOR JUTSU READY - PRESS 3');sBeep2(500,700)}
 updateChips()}
function updateChips(){$('c1').className='chip'+(stUsed.uav?(uavT>0?' used':' on'):'');$('c2').className='chip'+(stUsed.sup?' on':'');$('c3').className='chip'+(stUsed.air?' on':'')}
function useStreak(n){if(P.dead>0||over)return;
 if(n===1&&stUsed.uav&&uavT<=0){uavT=25;event('BYAKUGAN ACTIVE - ENEMIES REVEALED');sBeep2(700,1000)}
 else if(n===2&&stUsed.sup){stUsed.sup=false;updateChips();spawnCrate(P.pos.x+1.5,P.pos.z+1.5,'pkg')}
 else if(n===3&&stUsed.air){stUsed.air=false;updateChips();
  let tx=null,tz=null,bd=1e9;for(const b of bots)if(b.dead<=0&&b.team!==0){const d=d2(b.pos,P.pos);if(d<bd){bd=d;tx=b.pos.x;tz=b.pos.z}}
  if(bd>42||tx===null){tx=P.pos.x-Math.sin(P.yaw)*22;tz=P.pos.z-Math.cos(P.yaw)*22}
  const dx=-Math.sin(P.yaw),dz=-Math.cos(P.yaw),nx=dz,nz2=-dx;
  for(let i=-2;i<=2;i++)strikes.push({x:tx+nx*i*4.5,z:tz+nz2*i*4.5,t:1.5+(i+2)*.17});
  event('METEOR JUTSU INBOUND');beep(1200,.7,'sawtooth',.12,300)}}
function updateStrikes(dt){for(let i=strikes.length-1;i>=0;i--){const s=strikes[i];s.t-=dt;
 if(s.t<=0){explode(s.x,groundH(s.x,s.z,10),s.z,6.5,120,P);strikes.splice(i,1)}
 else if(Math.random()<.3)spawnPart(s.x,groundH(s.x,s.z,10)+.3,s.z,0,1.6,0,0xff3030,.1,.5,-.5)}}
function zoneHurt(dt){P.hp-=5*dt;dmgA=Math.max(dmgA,.4);if(P.hp<=0){P.hp=0;kill(null,P)}}
function hurt(n,src){if(P.dead>0||over||P.prot>0||n<=0)return;
 if(P.armor>0){const ab=Math.min(P.armor,n);P.armor-=ab;n-=ab}
 P.hp-=n;dmgA=1;shake(.25,.2);nz(.15,300,.2,'lowpass');
 if(src&&src.pos){const br=Math.atan2(-(src.pos.x-P.pos.x),-(src.pos.z-P.pos.z));$('di').style.transform=`rotate(${-(br-P.yaw)}rad)`;$('di').style.opacity=1;clearTimeout(hurt.h);hurt.h=setTimeout(()=>$('di').style.opacity=0,650)}
 if(P.hp<=0){P.hp=0;kill(src,P)}}
function setStatus(s){$('st')&&0}
function showMenu(resume){playing=false;document.body.classList.remove('play');$('ov').style.display='flex';$('end').style.display='none';
 $('resume').hidden=!resume||over;$('restart').hidden=!started||over;Object.keys(T).forEach(k=>delete T[k]);mv.x=mv.y=0;adsHold=false;
 if(document.pointerLockElement)document.exitPointerLock()}
function enter(){$('end').style.display='none';playing=true;document.body.classList.add('play');$('ov').style.display='none';if(!touch)ren.domElement.requestPointerLock()}
function resetP(){const W=WEAP[wi];P.hp=100;P.armor=0;P.ammo=W.mag;P.dead=0;P.rel=0;P.vy=0;P.yaw=0;P.pitch=0;P.gl=3;P.hl=2;P.healQ=0;P.nades=2;P.slide=null;P.prot=3;P.crouch=false;P.adsT=0;P.bloom=0;P.deaths=0;P.shots=0;P.hits=0;streak=0;stUsed={uav:false,sup:false,air:false};uavT=0;updateChips();
 for(const t of tmp)rmBox(t.m);tmp.length=0;for(const g of gren)scene.remove(g.m);gren.length=0;for(const c of crates)scene.remove(c.m);crates.length=0;strikes.length=0}
function clearBots(){bots.forEach(b=>{scene.remove(b.g);scene.remove(b.bar)});bots=[]}
function startMatch(m){if(Net.sock)Net.close();mp=null;mpK={};cur=m;const M=MODES[m];goal=M.goal;kills=Array(10).fill(0);over=false;overtime=false;clearBots();bots=M.bots.map(([t,n])=>mkBot(t,n));
 $('ally').style.display=m==='squad'?'block':'none';resetP();zoneOn=m==='br';zt=0;zr=70;zoneM.visible=zoneOn;zoneM.scale.set(70,1,70);timeLeft=M.time;
 $('feed').innerHTML='';warm=5;score();enter();started=true;hvtT=20;dropT=50;hvtBot=null;
 const ps=spawnFor(0,P);P.pos.set(ps.x,0,ps.z);bots.forEach(b=>respawnBot(b));
 setTimeout(()=>{event(m==='duel'?'ELIMINATE THE ENEMY - FIRST TO '+goal:m==='squad'?'WORK WITH DAGGER - FIRST TEAM TO '+goal:'LAST ONE STANDING - CLOSING STORM',4000)},600)}
function endGame(win){if(over)return;over=true;
 const acc=P.shots?Math.round(P.hits/P.shots*100):0,kl=mp?(mpK[mp.id]||0):kills[0];
 let xp=kl*100+(win?300:60);try{const old=+(localStorage.getItem('na_xp')||0);localStorage.setItem('na_xp',old+xp)}catch(e){}
 $('endT').textContent=win?'VICTORY':'DEFEAT';$('endT').style.color=win?'#ffc933':'#ff4d6d';
 const o=mp?Math.max(0,...Object.entries(mpK).filter(e=>e[0]!==mp.id).map(e=>e[1])):Math.max(...kills.slice(1));
 $('endStats').innerHTML=`Score <b>${kl} : ${o}</b><br>Eliminations <b>${kl}</b> &nbsp; Deaths <b>${P.deaths}</b> &nbsp; Accuracy <b>${acc}%</b><br>XP earned <b>+${xp}</b>`;
 document.body.classList.remove('play');$('end').style.display='flex';playing=false;
 if(document.pointerLockElement)document.exitPointerLock();
 toast(win?'BOOYAH!':'DEFEAT',win?'#ffc933':'#ff4d6d',2500);if(win)sBeep2(600,900);refreshXP()}
document.querySelectorAll('#ov [data-m]').forEach(b=>b.onclick=()=>startMatch(b.dataset.m));
$('resume').onclick=enter;$('restart').onclick=()=>startMatch(cur);$('pause').onclick=()=>showMenu(true);
$('again').onclick=()=>startMatch(cur);$('toMenu').onclick=()=>{started=false;over=false;showMenu(false)};
$('dif').onclick=()=>{dif=(dif+1)%DIF.length;$('dif').textContent='Bots: '+DIF[dif].n};
$('wp').onclick=()=>{wi=(wi+1)%3;$('wp').textContent='Gun: '+WEAP[wi].n};
$('qly').onclick=()=>{qHigh=!qHigh;$('qly').textContent='Quality: '+(qHigh?'High':'Low');applyQuality()};
$('aim').onclick=()=>{aimOn=!aimOn;$('aim').textContent='Aim assist: '+(aimOn?'On':'Off')};
$('inv').onclick=()=>{invY=!invY;$('inv').textContent='Invert Y: '+(invY?'On':'Off')};
$('sens').oninput=e=>sens=+e.target.value;
function applyQuality(){ren.setPixelRatio(qHigh?Math.min(devicePixelRatio,2):1);ren.shadowMap.enabled=qHigh;sun.castShadow=qHigh;
 lampL.forEach(l=>l.visible=qHigh);scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)}})}
function xpInfo(){let xp=0;try{xp=+(localStorage.getItem('na_xp')||0)}catch(e){}
 let lvl=1,need=0,cur=xp;while(cur>=(need=lvl*lvl*140)){cur-=need;lvl++}
 return{lvl,pct:Math.round(cur/need*100)}}
function refreshXP(){const x=xpInfo();$('xpw').firstElementChild.style.width=x.pct+'%';
 const rn=['Rookie','Private','Corporal','Sergeant','Lieutenant','Captain','Major','Colonel','General','Legend'][Math.min(9,x.lvl-1)];
 $('xpt').textContent=`RANK: ${rn} - LEVEL ${x.lvl} (${x.pct}%)`}
refreshXP();
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&!touch&&playing&&!over)showMenu(true)});
function onlineStart(m){
 cur=m.mode==='br'?'mpbr':'mpduel';goal=m.goal;over=false;overtime=false;kills=Array(10).fill(0);mpK={};mp={id:m.you};
 clearBots();$('ally').style.display='none';resetP();zoneOn=m.mode==='br';zt=0;zr=70;zoneM.visible=zoneOn;zoneM.scale.set(70,1,70);
 m.players.forEach((p,i)=>{mpK[p.id]=0;
  if(p.id===m.you){P.pos.set(p.x,0,p.z)}
  else{const b=mkBot(1+i%3,p.name);b.remote=true;b.id=p.id;b.pos.set(p.x,0,p.z);b.tx=p.x;b.ty=0;b.tz=p.z;b.tr=0;bots.push(b)}});
 timeLeft=m.mode==='br'?0:480;warm=0;$('feed').innerHTML='';hvtBot=null;score();enter();started=true;
 if(!touch)setTimeout(()=>toast('Click to capture mouse','#ffc933'),500);
 toast('FIGHT','#ffc933')}
function netMsg(m){
 if(m.t==='s'){const b=bots.find(x=>x.id===m.id);if(b){b.tx=m.x;b.ty=m.y;b.tz=m.z;b.tr=m.w+Math.PI}}
 else if(m.t==='f'){const b=bots.find(x=>x.id===m.id);if(b&&b.dead<=0){const a=new THREE.Vector3(b.pos.x,b.pos.y+1.3,b.pos.z),e=a.clone().add(new THREE.Vector3(Math.sin(b.tr),0,Math.cos(b.tr)).multiplyScalar(30));tracer(a,e,CH[ti(b.team)]);if(d2(b.pos,P.pos)<42)sShot('ar')}}
 else if(m.t==='h'){
  if(P.dead>0||over)return;let n=m.dmg;
  if(P.armor>0){const ab=Math.min(P.armor,n);P.armor-=ab;n-=ab}
  P.hp-=n;dmgA=1;shake(.22,.2);nz(.15,300,.2,'lowpass');
  const b=bots.find(x=>x.id===m.from);
  if(b){const br=Math.atan2(-(b.pos.x-P.pos.x),-(b.pos.z-P.pos.z));$('di').style.transform=`rotate(${-(br-P.yaw)}rad)`;$('di').style.opacity=1;clearTimeout(hurt.h);hurt.h=setTimeout(()=>$('di').style.opacity=0,650)}
  Net.send({t:'hp',hp:Math.max(0,Math.round(P.hp))});
  if(P.hp<=0){P.hp=0;P.dead=999;P.deaths++;streak=0;stUsed={uav:false,sup:false,air:false};updateChips();
   toast('YOU WERE ELIMINATED','#ff4d6d',2000);Net.send({t:'k',v:mp.id,from:m.from,hd:m.hd||0});
   setTimeout(()=>{if(mp&&!over){const s=spawnFor(0,P);P.pos.set(s.x,0,s.z);P.hp=100;P.armor=0;P.ammo=WEAP[wi].mag;P.gl=3;P.hl=2;P.nades=2;P.prot=3;P.dead=0;Net.send({t:'rs',x:s.x,z:s.z})}},4000)}}
 else if(m.t==='hp'){if(m.id!==mp.id){const b=bots.find(x=>x.id===m.id);if(b)b.hp=m.hp}}
 else if(m.t==='oh'){const b=bots.find(x=>x.id===m.id);if(b){b.hp=m.hp;b.flashT=.09;b.dk.emissive.setHex(0x883322)}}
 else if(m.t==='m'){const b=bots.find(x=>x.id===m.id);if(b){b.hp=Math.min(100,b.hp+60);spawnPart(b.pos.x,1.4,b.pos.z,0,2,0,0x4dff9a,.12,.7,-.5)}}
 else if(m.t==='k'){const kn=m.k===mp.id?(P.name||'You'):(m.k<0?'The storm':(bots.find(x=>x.id===m.k)||{}).name||'?');
  const vn=m.v===mp.id?(P.name||'You'):(bots.find(x=>x.id===m.v)||{}).name||'?';
  feed(`${kn} > ${vn}${m.hd?' (head)':''}`,'#ff9a4d');
  if(m.v!==mp.id){const b=bots.find(x=>x.id===m.v);if(b){b.dead=999;b.g.visible=false;b.bar.visible=false}}
  if(m.k===mp.id){toast(m.hd?'HEADSHOT':'ELIMINATED '+vn.toUpperCase(),'#35c8ff');streak++;checkStreaks()}}
 else if(m.t==='ro'){if(m.id!==mp.id){const b=bots.find(x=>x.id===m.id);if(b){b.dead=0;b.hp=100;b.g.visible=true;b.pos.set(m.x,0,m.z);b.tx=m.x;b.ty=0;b.tz=m.z}}
  else P.dead=0}
 else if(m.t==='sc'){m.s.forEach(([id,k])=>mpK[id]=k);score()}
 else if(m.t==='g')boxW(m.x,m.z,m.w,m.d)
 else if(m.t==='l'){const i=bots.findIndex(x=>x.id===m.id);if(i>=0){scene.remove(bots[i].g);scene.remove(bots[i].bar);bots.splice(i,1)}toast('A player left','#ff9a4d')}
 else if(m.t==='end'){const win=m.w===mp.id;endGame(win);setTimeout(()=>Net.close(),600)}}
function jump(){if(playing&&P.ground&&P.dead<=0){P.vy=7.4;P.ground=false;P.slide=null;P.slcd=1}}
addEventListener('keydown',e=>{keys[e.code]=1;
 if(e.code==='Space')jump();if(e.code==='KeyR')reload();if(e.code==='KeyQ')gloo();if(e.code==='KeyF')heal();if(e.code==='KeyG')nade();
 if(e.code==='KeyC'||e.code==='ControlLeft')P.crouch=!P.crouch;
 if(e.code==='Digit1')useStreak(1);if(e.code==='Digit2')useStreak(2);if(e.code==='Digit3')useStreak(3)});
addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('mousedown',e=>{if(e.button===2)adsHold=true;if(e.button===0){mouseDown=true;if(!touch&&!document.pointerLockElement&&playing)ren.domElement.requestPointerLock()}});
addEventListener('mouseup',e=>{if(e.button===2)adsHold=false;if(e.button===0)mouseDown=false});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(document.pointerLockElement){const k=.0022*sens*(P.adsT>.5?.62:1);P.yaw-=e.movementX*k;P.pitch=clamp(P.pitch-e.movementY*k*(invY?-1:1),-1.5,1.5)}});
const stick=$('stick'),sk=stick.firstElementChild;
document.addEventListener('touchstart',e=>{if(!playing)return;for(const t of e.changedTouches){const el=t.target;if(el.closest('button,.ab'))continue;e.preventDefault();
 if(el.closest('.fb'))T[t.identifier]={k:'f',x:t.clientX,y:t.clientY};
 else if(t.clientX<innerWidth*.45&&t.clientY>innerHeight*.3){T[t.identifier]={k:'m',x:t.clientX,y:t.clientY};stick.style.left=t.clientX-55+'px';stick.style.bottom=innerHeight-t.clientY-55+'px'}
 else T[t.identifier]={k:'l',x:t.clientX,y:t.clientY}}},{passive:false});
document.addEventListener('touchmove',e=>{if(!playing)return;e.preventDefault();for(const t of e.changedTouches){const s=T[t.identifier];if(!s)continue;
 if(s.k==='m'){mv.x=clamp((t.clientX-s.x)/50,-1,1);mv.y=clamp((t.clientY-s.y)/50,-1,1);sk.style.transform=`translate(${mv.x*35}px,${mv.y*35}px)`}
 else{const k=.0058*sens*(P.adsT>.5?.62:1);P.yaw-=(t.clientX-s.x)*k;P.pitch=clamp(P.pitch-(t.clientY-s.y)*k*(invY?-1:1),-1.5,1.5);s.x=t.clientX;s.y=t.clientY}}},{passive:false});
const tend=e=>{for(const t of e.changedTouches){const s=T[t.identifier];if(s&&s.k==='m'){mv.x=mv.y=0;sk.style.transform='';stick.style.left='30px';stick.style.bottom=''}delete T[t.identifier]}};
document.addEventListener('touchend',tend);document.addEventListener('touchcancel',tend);
[['jump',jump],['reload',reload],['gloo',gloo],['heal',heal],['nade',nade]].forEach(([id,f])=>$(id).addEventListener('touchstart',e=>{e.preventDefault();f()}));
$('ads').addEventListener('touchstart',e=>{e.preventDefault();P.adsToggle=!P.adsToggle});
$('crouch').addEventListener('touchstart',e=>{e.preventDefault();P.crouch=!P.crouch});
function assist(dt,firing){let best=null,be=1,locked=false;if(!aimOn||P.dead>0)return false;
 for(const b of bots){if(b.dead>0||b.team===0)continue;const dx=b.pos.x-P.pos.x,dy=b.pos.y+1.35-(P.pos.y+P.eyeH||1.7),dz=b.pos.z-P.pos.z,dist=Math.hypot(dx,dz);if(dist>60)continue;
  const ty=Math.atan2(-dx,-dz),tp=Math.atan2(dy,dist);let ey=ty-P.yaw;ey=Math.atan2(Math.sin(ey),Math.cos(ey));const ep=tp-P.pitch,e=Math.hypot(ey,ep),cone=.06+.5/dist;
  if(e<cone&&e<be&&los3(P.pos.x,P.pos.y+P.eyeH,P.pos.z,b.pos.x,b.pos.y+1.35,b.pos.z)){be=e;best={ey,ep}}}
 if(best){locked=true;const k=Math.min(1,dt*9)*(firing?.7:.15);P.yaw+=best.ey*k;P.pitch+=best.ep*k}return locked}
const mm=$('mm').getContext('2d'),MS=140/(HW*2);
function drawMM(){const c=mm;c.clearRect(0,0,140,140);c.save();c.beginPath();c.arc(70,70,70,0,7);c.clip();c.fillStyle='#1a120add';c.fillRect(0,0,140,140);c.fillStyle='#c8a880';
 for(const o of AB)if(o.y0===0&&o.t>1.1)c.fillRect(70+o.x0*MS,70+o.z0*MS,(o.x1-o.x0)*MS,(o.z1-o.z0)*MS);
 c.strokeStyle='#ffc933';c.lineWidth=2;for(const s of SL){c.beginPath();c.moveTo(70+s.ax*MS,70+s.az*MS);c.lineTo(70+s.bx*MS,70+s.bz*MS);c.stroke()}
 if(zoneOn){c.strokeStyle='#4fb0ff';c.lineWidth=2;c.beginPath();c.arc(70,70,zr*MS,0,7);c.stroke()}
 for(const cr of crates){c.fillStyle=cr.kind==='sup'?'#ff9a4d':'#35c8ff';c.fillRect(70+cr.x*MS-3,70+cr.z*MS-3,6,6)}
 if(hvtBot&&hvtBot.dead<=0&&hvtBot.hvt>0){c.fillStyle='#ff2222';c.save();c.translate(70+hvtBot.pos.x*MS,70+hvtBot.pos.z*MS);c.rotate(Math.PI/4);c.fillRect(-4,-4,8,8);c.restore()}
 for(const b of bots)if(b.dead<=0&&(b.team===0||(uavT>0||d2(b.pos,P.pos)<26))){c.fillStyle=CS[ti(b.team)];c.beginPath();c.arc(70+b.pos.x*MS,70+b.pos.z*MS,3.5,0,7);c.fill()}
 c.translate(70+P.pos.x*MS,70+P.pos.z*MS);c.rotate(-P.yaw);c.fillStyle='#fff';c.beginPath();c.moveTo(0,-8);c.lineTo(5.5,6);c.lineTo(-5.5,6);c.fill();c.restore()}
const cp=$('compass').getContext('2d');
function drawCompass(){const c=cp;c.clearRect(0,0,280,26);c.fillStyle='rgba(20,10,4,.5)';c.fillRect(0,0,280,26);
 const hd=Math.atan2(-Math.sin(P.yaw),Math.cos(P.yaw));
 c.font='bold 13px Verdana';c.textAlign='center';
 for(let d=0;d<360;d+=15){let a=(d*Math.PI/180)-hd;while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;
  if(Math.abs(a)>1.1)continue;const x=140+a*120;
  if(d%90===0){c.fillStyle='#fff';const lbl=['N','E','S','W'][d/90];c.fillText(lbl,x,17)}else{c.fillStyle='#ffffff88';c.fillRect(x,7,1,d%45===0?10:5)}}}
let last=performance.now(),wsec=0,hbT=0,mmT=0,locked=false,petalT=0;
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;
 wheel.rotation.z+=dt*.1;gond.forEach(g=>g.rotation.z=-wheel.rotation.z);
 clouds.forEach((c,i)=>{c.position.x+=dt*(1.5+i*.3);if(c.position.x>260)c.position.x=-260});
 flags.forEach((f,i)=>{f.rotation.y=Math.sin(time*2.4+i)*.28;f.scale.x=1+Math.sin(time*5+i)*.06});
 seaT.offset.x+=dt*.008;seaT.offset.y+=dt*.004;
 petalT-=dt;if(petalT<=0&&sakuraP.length){petalT=.14;const sp=sakuraP[Math.floor(Math.random()*sakuraP.length)];
  spawnPart(sp[0]+(Math.random()-.5)*4,5.5+Math.random()*1.5,sp[1]+(Math.random()-.5)*4,.6+Math.random()*.5,-.5,(Math.random()-.5)*.6,Math.random()<.5?0xf2a0c8:0xffd0e0,.08,3.2,.35)}
 for(const f of fires){f.t-=dt;if(f.t<=0){f.t=.09;spawnPart(f.x+(Math.random()-.5)*.4,1.15,f.z+(Math.random()-.5)*.4,(Math.random()-.5)*.4,1.5+Math.random(),(Math.random()-.5)*.4,Math.random()<.6?0xff9a30:0xffd050,.13,.55,-.4)}f.l.intensity=.7+Math.sin(time*11+f.x)*.25+Math.random()*.15}
 for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.t-=dt;if(p.t<=0){scene.remove(p.m);p.m.material.dispose();parts.splice(i,1);continue}
  p.vy-=p.g*dt;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;p.m.material.opacity=p.t/p.life;p.m.scale.setScalar(p.s*(0.5+0.5*p.t/p.life))}
 for(let i=fx.length-1;i>=0;i--){const e=fx[i];e.t-=dt;e.m.material.opacity=Math.max(0,e.t*11);if(e.t<=0){scene.remove(e.m);e.m.geometry.dispose();e.m.material.dispose();fx.splice(i,1)}}
 for(let i=casings.length-1;i>=0;i--){const cs=casings[i];cs.t-=dt;if(cs.t<=0){scene.remove(cs.c);casings.splice(i,1);continue}
  cs.vy-=12*dt;cs.c.position.x+=cs.vx*dt;cs.c.position.y+=cs.vy*dt;cs.c.position.z+=cs.vz*dt;cs.c.rotation.x+=dt*9}
 for(let i=gren.length-1;i>=0;i--){const g=gren[i];g.t-=dt;g.v.y-=16*dt;g.p.addScaledVector(g.v,dt);
  const gh=groundH(g.p.x,g.p.z,g.p.y)+.1;
  if(g.p.y<gh){g.p.y=gh;g.v.y*=-.38;g.v.x*=.55;g.v.z*=.55;if(Math.abs(g.v.y)<.6)g.v.y=0}
  g.m.position.copy(g.p);g.m.rotation.x+=dt*7;
  if(g.t<=0){explode(g.p.x,g.p.y,g.p.z,5.5,95,g.src);scene.remove(g.m);gren.splice(i,1)}}
 boomT-=dt;if(boomT<=0)boomL.intensity=0;else boomL.intensity=4*boomT/.35;
 bflashT-=dt;if(bflashT<=0)bflashL.intensity=0;
 for(let i=tmp.length-1;i>=0;i--){tmp[i].t-=dt;if(tmp[i].t<=0){rmBox(tmp[i].m);tmp.splice(i,1)}}
 const paused=started&&!playing;
 if(playing&&!over){
  if(warm>0){warm-=dt;const s=Math.ceil(warm);if(s!==wsec&&warm>0){wsec=s;toast(s>3?'GET READY':String(s),'#ffc933',900)}if(warm<=0)toast('FIGHT','#ffc933')}
  if(timeLeft>0&&warm<=0&&!overtime){timeLeft-=dt;if(timeLeft<=0){timeLeft=0;const o=Math.max(...kills.slice(1));
   if(kills[0]===o){overtime=true;event('OVERTIME - NEXT KILL WINS',5000)}else endGame(kills[0]>o)}if(Math.floor(timeLeft)!==Math.floor(timeLeft+dt))score()}
  if(zoneOn&&warm<=0){zt+=dt;zr=zoneR(zt);zoneM.scale.set(zr,1,zr);
   if(Math.hypot(P.pos.x,P.pos.z)>zr&&P.dead<=0&&P.prot<=0)zoneHurt(dt);
   if(!mp)for(const b of bots)if(b.dead<=0&&Math.hypot(b.pos.x,b.pos.z)>zr)dmgBot(b,5*dt,null,false);
   if(Math.floor(zt*2)!==Math.floor((zt-dt)*2))score()}
  if(uavT>0){uavT-=dt;if(uavT<=0)updateChips()}
  if(warm<=0)P.prot=Math.max(0,P.prot-dt);P.glcd=Math.max(0,P.glcd-dt);P.slcd=Math.max(0,P.slcd-dt);
  hvtT-=dt;if(hvtT<=0){hvtT=35;const cands=bots.filter(b=>b.dead<=0&&b.team!==0&&!b.remote);if(cands.length&&!hvtBot){hvtBot=cands[Math.floor(Math.random()*cands.length)];hvtBot.hvt=25;event('HIGH VALUE TARGET: '+hvtBot.name.toUpperCase()+' - +2 KILLS')}}
  if(hvtBot&&hvtBot.hvt<=0)hvtBot=null;
  dropT-=dt;if(dropT<=0){dropT=cur==='br'?45:75;let p=null;for(let i=0;i<40;i++){const q=pickF();if(Math.abs(q.x)<24&&Math.abs(q.z)<24){p=q;break}}if(p)spawnCrate(p.x,p.z,'sup')}
  updateCrates(dt);updateStrikes(dt);
  if(P.dead>0){P.dead-=dt;toast('REDEPLOY IN '+Math.max(1,Math.ceil(P.dead)),'#ff4d6d',900);
   if(P.dead<=0){if(mp){const s=spawnFor(0,P);P.pos.set(s.x,0,s.z);Net.send({t:'rs',x:s.x,z:s.z});P.dead=999}
   else{const s=spawnFor(0,P);P.pos.set(s.x,0,s.z);P.hp=100;P.armor=0;P.ammo=WEAP[wi].mag;P.rel=0;P.gl=3;P.hl=2;P.nades=2;P.prot=3;$('msg').style.opacity=0}}}
  else{
   const W=WEAP[wi],f=(keys.KeyW?1:0)-(keys.KeyS?1:0)-mv.y,s=(keys.KeyD?1:0)-(keys.KeyA?1:0)+mv.x,l=Math.hypot(f,s)||1,k=Math.min(1,l);
   const adsOn=touch?!!P.adsToggle:adsHold;
   P.adsT=lerp(P.adsT,(adsOn&&P.ground)?1:0,Math.min(1,dt*10));
   const sprint=(keys.ShiftLeft||keys.ShiftRight||k>.95&&touch)&&f>0&&P.adsT<.3&&!P.crouch;
   let sp=P.crouch?3.3:sprint?8.6:P.adsT>.5?4.4:6;
   if(P.slide){const sl=P.slide;sl.t+=dt*16;const q=Math.min(1,sl.t/sl.s.len);P.pos.x=sl.fx+(sl.tx-sl.fx)*q;P.pos.z=sl.fz+(sl.tz-sl.fz)*q;P.spd=16;if(q>=1){P.slide=null;P.slcd=1.5}}
   else{const sy=Math.sin(P.yaw),cy=Math.cos(P.yaw),vx=(-sy*f+cy*s)/l*k*sp,vz=(-cy*f-sy*s)/l*k*sp;
    P.pos.x+=vx*dt;P.pos.z+=vz*dt;P.spd=Math.hypot(vx,vz);
    if(P.slcd<=0&&P.ground)for(const sl of SL){if(Math.hypot(P.pos.x-sl.ax,P.pos.z-sl.az)<1.3){P.slide={s:sl,t:0,fx:sl.ax,fz:sl.az,tx:sl.bx,tz:sl.bz};break}if(Math.hypot(P.pos.x-sl.bx,P.pos.z-sl.bz)<1.3){P.slide={s:sl,t:0,fx:sl.bx,fz:sl.bz,tx:sl.ax,tz:sl.az};break}}}
   resolve(P.pos,.4,P.pos.y,.7);
   const gh=groundH(P.pos.x,P.pos.z,P.pos.y);P.vy-=20*dt;P.pos.y+=P.vy*dt;if(P.pos.y<=gh){P.pos.y=gh;P.vy=0}P.ground=P.pos.y<=gh+.02;
   P.campT=P.spd<.6?P.campT+dt:0;
   P.cd-=dt;P.bloom=Math.max(0,P.bloom-dt*1.6);
   const firing=(mouseDown||Object.values(T).some(t=>t.k==='f'))&&warm<=0&&!(sprint&&P.ground);
   if(P.rel>0){P.rel-=dt;if(P.rel<=0)P.ammo=W.mag}
   else if(firing&&P.cd<=0){if(W.auto||!P.firedHeld){shoot();P.firedHeld=true}}
   if(!firing)P.firedHeld=false;
   if(P.healQ>0){const h=Math.min(P.healQ,22*dt);P.hp=Math.min(100,P.hp+h);P.healQ-=h}
   locked=assist(dt,firing)}
  if(!mp)for(const b of bots)botUpdate(b,dt);
  else{for(const b of bots){if(!b.remote)botUpdate(b,dt);else{if(b.dead>0)continue;const ox=b.pos.x,oz=b.pos.z,k=Math.min(1,dt*12);
    b.pos.x+=(b.tx-b.pos.x)*k;b.pos.z+=(b.tz-b.pos.z)*k;b.pos.y+=(b.ty-b.pos.y)*k;
    let da=b.tr-b.rot;da=Math.atan2(Math.sin(da),Math.cos(da));b.rot+=da*k;animB(b,dt,ox,oz)}
    if(P.dead<=0){lastSend+=dt;if(lastSend>.05){lastSend=0;Net.send({t:'u',x:+P.pos.x.toFixed(2),y:+P.pos.y.toFixed(2),z:+P.pos.z.toFixed(2),w:+P.yaw.toFixed(3),p:+P.pitch.toFixed(3)})}}}
  if(P.hp<30&&P.dead<=0){hbT-=dt;if(hbT<=0){hbT=.95;beep(70,.1,'sine',.22);setTimeout(()=>beep(60,.12,'sine',.18),160)}}
 }
 const dead=P.dead>0;
 P.eyeH=lerp(P.eyeH||1.7,P.crouch?1.12:1.7,Math.min(1,dt*9));
 cam.position.set(P.pos.x,P.pos.y+(dead?.5:P.eyeH),P.pos.z);
 cam.rotation.set(dead?-.35:P.pitch,P.yaw,dead?.5:0);
 if(shakeT>0){shakeT-=dt;shakeA=lerp(shakeA,0,Math.min(1,dt*5));cam.position.x+=(Math.random()-.5)*shakeA*.25;cam.position.y+=(Math.random()-.5)*shakeA*.25;cam.rotation.z+=(Math.random()-.5)*shakeA*.02}else shakeA=0;
 const sprinting=(keys.ShiftLeft||keys.ShiftRight)&&P.spd>6;
 const fovT=(P.adsT>.5?58:78)+(sprinting?6:0);
 if(Math.abs(cam.fov-fovT)>.1){cam.fov=lerp(cam.fov,fovT,Math.min(1,dt*10));cam.updateProjectionMatrix()}
 gunKick=Math.max(0,gunKick-dt*9);muzzleT-=dt;mf.intensity=muzzleT>0?3:0;
 const adsX=lerp(.24,0,P.adsT),adsY=lerp(-.22,-.158,P.adsT),adsZ=lerp(-.5,-.42,P.adsT);
 const bobA=Math.min(1,P.spd/6)*(P.ground?1:0);
 vg.position.x=lerp(vg.position.x,adsX+Math.sin(time*7.3)*.008*bobA,Math.min(1,dt*12));
 vg.position.y=lerp(vg.position.y,adsY+Math.abs(Math.sin(time*14.6))*.014*bobA-(sprinting?.09:0),Math.min(1,dt*12));
 vg.position.z=lerp(vg.position.z,adsZ+gunKick*.09,Math.min(1,dt*14));
 vg.rotation.x=lerp(vg.rotation.x,sprinting?.5:P.rel>0?-.7:gunKick*.14,Math.min(1,dt*10));
 gmag.position.y=-.15+(P.rel>0?.1:0);
 $('xh').classList.toggle('ads',P.adsT>.5);
 $('xh').classList.toggle('lock',!!locked);
 for(const b of bots){b.bar.visible=b.dead<=0&&d2(b.pos,P.pos)<48;if(b.bar.visible){b.bar.position.set(b.pos.x,(b.pos.y||0)+2.15+(b.hvt>0?Math.sin(time*6)*.08:0),b.pos.z);b.bar.quaternion.copy(cam.quaternion);const r=Math.max(.001,b.hp/100);b.fl.scale.x=r;b.fl.position.x=-.43*(1-r)}
  if(b.hvt>0&&b.dead<=0){if(!b.hvtM){b.hvtM=new THREE.Mesh(new THREE.OctahedronGeometry(.2),emis(0xff2222));b.g.add(b.hvtM);b.hvtM.position.y=2.4}b.hvtM.visible=true;b.hvtM.rotation.y=time*4}
  else if(b.hvtM)b.hvtM.visible=false}
 dmgA=Math.max(0,dmgA-dt*2.2);if(playing&&P.hp<30&&P.dead<=0)dmgA=Math.max(dmgA,.22+.14*Math.sin(time*5));
 $('dmg').style.opacity=dmgA;
 $('php').querySelectorAll('.bar')[1].firstElementChild.style.width=P.hp+'%';
 $('armb').firstElementChild.style.width=P.armor+'%';
 $('hpt').textContent=(P.prot>0&&P.dead<=0?'SHIELDED - ':'')+Math.ceil(P.hp);
 $('ammo').innerHTML=(P.rel>0?'RELOADING':P.ammo+' / '+WEAP[wi].mag)+`<br><small>${WEAP[wi].n} - GLOO ${P.gl} - HEAL ${P.hl} - NADE ${P.nades}</small>`;
 $('gloo').textContent='GLOO '+P.gl;$('heal').textContent='HEAL '+P.hl;$('nade').textContent='NADE '+P.nades;
 const al=bots.find(b=>b.team===0&&!b.remote);if(al)$('ally').lastElementChild.firstElementChild.style.width=al.dead>0?'0%':al.hp+'%';
 if(!started){const t=time*.06;cam.position.set(Math.sin(t)*36,15+Math.sin(time*.21)*3,Math.cos(t)*36);cam.lookAt(0,3,0);cam.rotation.order='YXZ';cam.rotation.z=0}
 mmT-=dt;if(mmT<=0){mmT=.08;if(started){drawMM();drawCompass()}}
 ren.render(scene,cam)}
requestAnimationFrame(loop);
