// hatem-games-relay: tiny WebSocket relay for 2-player rooms. It does NOT run any game logic.
// Protocol: GET /room/<CODE> (WebSocket). Server -> client: {t:"hello",role,n}, {t:"peer",n}, {t:"full"}, {t:"pong"}.
// Every other message is relayed verbatim to the other socket in the room.
const ALLOWED=[/^https:\/\/hatemalmasry74-coder\.github\.io$/,/^http:\/\/localhost(:\d+)?$/,/^http:\/\/127\.0\.0\.1(:\d+)?$/];
export class Room{
  constructor(state,env){this.state=state;this.env=env;this.socks=[];}
  broadcastPeers(){const n=this.socks.length;for(const s of this.socks){try{s.send(JSON.stringify({t:'peer',n}));}catch(e){}}}
  async fetch(req){
    if(req.headers.get('Upgrade')!=='websocket')return new Response('WebSocket only',{status:426});
    const pair=new WebSocketPair();const client=pair[0],server=pair[1];
    server.accept();
    if(this.socks.length>=2){try{server.send(JSON.stringify({t:'full'}));server.close(1008,'full');}catch(e){}return new Response(null,{status:101,webSocket:client});}
    const role=this.socks.length===0?'host':'guest';
    this.socks.push(server);
    server.send(JSON.stringify({t:'hello',role,n:this.socks.length}));
    this.broadcastPeers();
    server.addEventListener('message',ev=>{
      const d=ev.data;if(typeof d!=='string'||d.length>4096)return;
      if(d.charCodeAt(0)===123&&d.indexOf('"t":"ping"')>=0&&d.length<40){try{server.send('{"t":"pong"}');}catch(e){}return;}
      for(const s of this.socks){if(s!==server){try{s.send(d);}catch(e){}}}
    });
    const drop=()=>{const i=this.socks.indexOf(server);if(i>=0){this.socks.splice(i,1);this.broadcastPeers();}};
    server.addEventListener('close',drop);server.addEventListener('error',drop);
    return new Response(null,{status:101,webSocket:client});
  }
}
export default{
  async fetch(req,env){
    const url=new URL(req.url);
    const m=url.pathname.match(/^\/room\/([A-Za-z0-9]{3,8})$/);
    if(!m)return new Response('hatem-games-relay ok',{status:200,headers:{'content-type':'text/plain'}});
    const origin=req.headers.get('Origin');
    if(origin&&!ALLOWED.some(r=>r.test(origin)))return new Response('forbidden',{status:403});
    const id=env.ROOMS.idFromName(m[1].toUpperCase());
    return env.ROOMS.get(id).fetch(req);
  }
};
