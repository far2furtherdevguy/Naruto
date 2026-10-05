/* SHINOBI STRIKE server - zero-dependency Node.js: static files + hand-rolled WebSocket (RFC6455) */
'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000,PUBLIC=path.join(__dirname,'public');
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.md':'text/markdown; charset=utf-8'};
const server=http.createServer((req,res)=>{
 let p=decodeURIComponent((req.url||'/').split('?')[0]);if(p==='/')p='/index.html';
 const fp=path.normalize(path.join(PUBLIC,p));
 if(!fp.startsWith(PUBLIC)){res.writeHead(403);res.end('forbidden');return}
 fs.readFile(fp,(e,d)=>{if(e){res.writeHead(404);res.end('not found');return}
  res.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(d)});
});
/* ---------------- WebSocket core ---------------- */
const WS_GUID='258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
function wsAccept(key){return crypto.createHash('sha1').update(key+WS_GUID).digest('base64')}
function encodeFrame(str){
 const p=Buffer.from(str,'utf8'),len=p.length;let h;
 if(len<126){h=Buffer.from([0x81,len])}
 else if(len<65536){h=Buffer.alloc(4);h[0]=0x81;h[1]=126;h.writeUInt16BE(len,2)}
 else{h=Buffer.alloc(10);h[0]=0x81;h[1]=127;h.writeBigUInt64BE(BigInt(len),2)}
 return Buffer.concat([h,p]);
}
function wsSend(sock,str){if(sock.destroyed)return;try{sock.write(encodeFrame(str))}catch(e){}}
/* frame parser: handles masked client text frames, ping, close */
function makeParser(sock,onText,onClose){
 let buf=Buffer.alloc(0);
 return chunk=>{
  buf=Buffer.concat([buf,chunk]);
  for(;;){
   if(buf.length<2)return;
   const op=buf[0]&0x0f,masked=buf[1]&0x80;let len=buf[1]&0x7f,off=2;
   if(len===126){if(buf.length<4)return;len=buf.readUInt16BE(2);off=4}
   else if(len===127){if(buf.length<10)return;len=Number(buf.readBigUInt64BE(2));off=10}
   if(len>4096){sock.destroy();return}
   if(buf.length<off+len+(masked?4:0))return;
   let payload=buf.slice(off,off+len);
   if(masked){const mk=buf.slice(off+len,off+len+4);payload=Buffer.from(payload);for(let i=0;i<payload.length;i++)payload[i]^=mk[i&3]}
   buf=buf.slice(off+len+(masked?4:0));
   if(op===8){onClose();try{sock.end()}catch(e){}return}
   else if(op===9){const p=Buffer.concat([Buffer.from([0x8A,payload.length]),payload]);try{sock.write(p)}catch(e){}}
   else if(op===1){onText(payload.toString('utf8'))}
  }
 };
}
/* ---------------- game rooms ---------------- */
const players=new Map(); // sock -> {id,name,room,mode}
const rooms=new Map();   // id -> room
const duelQueue=[];      // waiting socks
const brLobby={socks:[],timer:null};
let nextId=1,nextRoom=1;
const SPAWNS=[[-40,-40],[40,-40],[-40,40],[40,40],[-40,0],[40,0],[0,-40],[0,40]];
function roomCast(room,msg,except){const s=JSON.stringify(msg);for(const p of room.players)if(p.sock!==except)wsSend(p.sock,s)}
function joinRoom(socks,mode){
 const id='r'+(nextRoom++),room={id,mode,goal:11,players:[],scores:{},over:false};
 socks.forEach((sock,i)=>{const pl=players.get(sock);pl.room=id;
  const px=SPAWNS[i%SPAWNS.length];
  room.players.push({id:pl.id,name:pl.name,sock,x:px[0],z:px[1]});room.scores[pl.id]=0});
 rooms.set(id,room);
 const payload={t:'go',mode,you:'',goal:room.goal,players:room.players.map(p=>({id:p.id,name:p.name,x:p.x,z:p.z}))};
 for(const p of room.players)wsSend(p.sock,JSON.stringify({...payload,you:p.id}));
 return room;
}
function leaveQueue(sock){const i=duelQueue.indexOf(sock);if(i>=0)duelQueue.splice(i,1);
 const j=brLobby.socks.indexOf(sock);if(j>=0){brLobby.socks.splice(j,1);
  if(brLobby.socks.length<2&&brLobby.timer){clearTimeout(brLobby.timer);brLobby.timer=null}
  if(brLobby.socks.length===0)for(const s2 of brLobby.socks)wsSend(s2,JSON.stringify({t:'wait',n:1,cap:8}));
  else if(brLobby.socks.length>0)for(const s2 of brLobby.socks)wsSend(s2,JSON.stringify({t:'wait',n:brLobby.socks.length,cap:8}))}}
function endRoom(room,wid){if(room.over)return;room.over=true;roomCast(room,{t:'end',w:wid});
 for(const p of room.players){players.get(p.sock).room=null}
 setTimeout(()=>rooms.delete(room.id),2000)}
function onMessage(sock,raw){
 let m;try{m=JSON.parse(raw)}catch(e){return}
 const pl=players.get(sock);if(!pl)return;
 if(m.t==='q'){
  pl.name=String(m.name||'Shinobi').slice(0,14).replace(/[^\w \-]/g,'')||'Shinobi';pl.mode=m.mode==='br'?'br':'duel';
  if(pl.mode==='duel'){
   const other=duelQueue.shift();
   if(other&&players.has(other)){wsSend(other,JSON.stringify({t:'wait',n:2,cap:2}));joinRoom([other,sock],'duel')}
   else{duelQueue.push(sock);wsSend(sock,JSON.stringify({t:'wait',n:1,cap:2}))}
  }else{
   brLobby.socks.push(sock);
   for(const s2 of brLobby.socks)wsSend(s2,JSON.stringify({t:'wait',n:brLobby.socks.length,cap:8}));
   if(brLobby.socks.length>=8)startBR();
   else if(brLobby.socks.length>=2&&!brLobby.timer){let n=12;brLobby.timer=setInterval(()=>{
     for(const s2 of brLobby.socks)wsSend(s2,JSON.stringify({t:'wait',n:brLobby.socks.length,cap:8,in:n}));
     if(--n<0||brLobby.socks.length>=8){clearInterval(brLobby.timer);brLobby.timer=null;startBR()}},1000)}
  }
  return}
 const room=rooms.get(pl.room);if(!room||room.over)return;
 const others=msg=>roomCast(room,msg,sock);
 if(m.t==='u')others({t:'s',id:pl.id,x:+m.x||0,y:+m.y||0,z:+m.z||0,w:+m.w||0,p:+m.p||0});
 else if(m.t==='f')others({t:'f',id:pl.id});
 else if(m.t==='g')others({t:'g',x:+m.x||0,z:+m.z||0,w:+m.w||0,d:+m.d||0});
 else if(m.t==='m')others({t:'m',id:pl.id});
 else if(m.t==='h'){const tgt=room.players.find(p=>p.id===m.id);if(tgt)wsSend(tgt.sock,JSON.stringify({t:'h',from:pl.id,dmg:Math.min(120,Math.max(1,+m.dmg||10)),hd:m.hd?1:0}))}
 else if(m.t==='hp')others({t:'hp',id:pl.id,hp:Math.max(0,Math.min(100,+m.hp||0))});
 else if(m.t==='oh')others({t:'oh',id:pl.id,hp:Math.max(0,Math.min(100,+m.hp||0))});
 else if(m.t==='k'){const v=String(m.v),from=String(m.from);
  if(!room.scores.hasOwnProperty(from))return;
  room.scores[from]=(room.scores[from]||0)+1;
  roomCast(room,{t:'k',k:from,v,hd:m.hd?1:0});
  roomCast(room,{t:'sc',s:Object.entries(room.scores)});
  if(room.scores[from]>=room.goal)endRoom(room,from)}
 else if(m.t==='rs')others({t:'ro',id:pl.id,x:+m.x||0,z:+m.z||0})}
function startBR(){const socks=brLobby.socks.splice(0,brLobby.socks.length);if(brLobby.timer){clearInterval(brLobby.timer);brLobby.timer=null}
 if(socks.length<2){for(const s of socks)wsSend(s,JSON.stringify({t:'wait',n:1,cap:8}));return}
 joinRoom(socks,'br')}
function onLeave(sock){
 const pl=players.get(sock);if(!pl)return;players.delete(sock);leaveQueue(sock);
 const room=pl.room&&rooms.get(pl.room);
 if(room&&!room.over){roomCast(room,{t:'l',id:pl.id},sock);
  const alive=room.players.filter(p=>p.sock!==sock&&players.has(p.sock));
  if(alive.length<=1&&alive.length<room.players.length-0)endRoom(room,alive[0]?alive[0].id:'')}}
server.on('upgrade',(req,sock)=>{
 const key=(req.headers['sec-websocket-key']||'').trim();
 if(!key){sock.destroy();return}
 sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n'+
  'Sec-WebSocket-Accept: '+wsAccept(key)+'\r\n\r\n');
 sock.setNoDelay(true);
 const id='p'+(nextId++);
 players.set(sock,{id,name:'Shinobi',room:null,mode:'duel'});
 wsSend(sock,JSON.stringify({t:'hello',id}));
 sock.on('data',makeParser(sock,t=>onMessage(sock,t),()=>onLeave(sock)));
 const bye=()=>onLeave(sock);sock.on('close',bye);sock.on('error',()=>{});
 const ping=setInterval(()=>{try{sock.write(Buffer.from([0x89,0]))}catch(e){}},30000);
 sock.on('close',()=>clearInterval(ping))});
server.listen(PORT,()=>console.log('SHINOBI STRIKE server on :'+PORT));
