/* ============ net.js - online transport, matchmaking & bot fallback ============ */
(function(){
const $=id=>document.getElementById(id);
let searching=false,waitTimer=null,suggestTimer=null,lastMode='duel';
function status(t){$('nstat').textContent=t||''}
function showSuggest(){if(!searching)return;$('suggest').hidden=false;status('')}
function hideSuggest(){$('suggest').hidden=true}
function connect(mode){
 Net.close();hideSuggest();lastMode=mode;
 const proto=location.protocol==='https:'?'wss://':'ws://';
 let w;try{w=new WebSocket(proto+location.host)}catch(e){status('Could not open connection');return}
 Net.sock=w;searching=true;
 w.onopen=()=>{status('Connecting...');w.send(JSON.stringify({t:'q',mode,name:($('nm').value.trim()||'Shinobi'),}))};
 w.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(err){return}
  if(m.t==='wait'){status(`Searching ${m.n}/${m.cap}${m.in?' - starting in '+m.in+'s':''}...`);if(waitTimer){clearTimeout(waitTimer);waitTimer=null}}
  else if(m.t==='go'){searching=false;hideSuggest();status('');clearTimeout(suggestTimer);onlineStart(m)}
  else netMsg(m)};
 w.onerror=()=>{if(searching)status('Connection failed - is the server running?')};
 w.onclose=()=>{const wasInMatch=!!mp&&!over;searching=false;hideSuggest();
  if(wasInMatch){toast('Disconnected from server','#ff4d6d');showMenu(false)}
  else status('')};
 // nobody found -> suggest a bot match
 clearTimeout(suggestTimer);suggestTimer=setTimeout(()=>{if(searching&&Net.sock)showSuggest()},25000);
}
$('on1').onclick=()=>connect('duel');
$('onbr').onclick=()=>connect('br');
$('ncancel').onclick=()=>{Net.close();status('')};
$('sugBot').onclick=()=>{Net.close();searching=false;hideSuggest();status('');
 startMatch(lastMode==='br'?'br':'duel');
 setTimeout(()=>toast('No players found - bot match started','#ffc933'),400)};
$('sugCan').onclick=()=>{Net.close();searching=false;hideSuggest();status('')};
})();
