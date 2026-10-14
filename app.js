const $=s=>document.querySelector(s),mem={};
const st={get(k){try{const v=localStorage.getItem(k);if(v!==null)return JSON.parse(v)}catch{}return mem[k]??null},set(k,v){mem[k]=v;try{localStorage.setItem(k,JSON.stringify(v))}catch{}},del(k){delete mem[k];try{localStorage.removeItem(k)}catch{}}};
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hash=async(p,s)=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s+p));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')};
const rnd=()=>Math.random().toString(36).slice(2,10);
const toast=t=>{const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.append(e);setTimeout(()=>e.remove(),2200)};
let vtok=null,vmail=null;
async function vapi(a,b){let r;try{r=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:a,...b})})}catch{throw new Error('server verifikasi tidak terjangkau (pastikan situs di-deploy di Vercel)')}
  let j={};try{j=await r.json()}catch{}if(!r.ok)throw new Error(j.error||'server error '+r.status);return j}
let pend=[];const URLS={};let users=st.get('nx_users')||{},me=null,D=null,busy=false,ctl=null,sample=null;
const defSet={theme:'auto',persona:'',tier:'default',tools:true};
const save=()=>{D.ts=Date.now();st.set('nx_data_'+me,D);push()};

/* tema */
function theme(){document.documentElement.dataset.accent=(D&&D.set.accent)||'violet';const t=(D&&D.set.theme)||st.get('nx_theme')||'auto';const r=document.documentElement;t==='auto'?r.removeAttribute('data-theme'):r.setAttribute('data-theme',t)}

/* auth */
const show=(a)=>{$('#auth').classList.toggle('hide',a);$('#app').classList.toggle('hide',!a)};
$('#tL').onclick=()=>tab(1);$('#tR').onclick=()=>tab(0);
function tab(l){$('#fF').classList.add('hide');$('#tL').classList.toggle('on',!!l);$('#tR').classList.toggle('on',!l);$('#fL').classList.toggle('hide',!l);$('#fR').classList.toggle('hide',!!l);$('#eL').textContent=$('#eR').textContent=''}
$('#fR').onsubmit=async e=>{e.preventDefault();const n=$('#rN').value.trim(),m=$('#rE').value.trim().toLowerCase(),p=$('#rP').value,c=$('#rC').value,er=$('#eR');
  if(n.length<2)return er.textContent='Nama minimal 2 karakter.';
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m))return er.textContent='Format email tidak valid.';
  if(p.length<6)return er.textContent='Kata sandi minimal 6 karakter.';
  if(p!==c)return er.textContent='Konfirmasi kata sandi tidak cocok.';
  if(users[m])return er.textContent='Email sudah terdaftar. Silakan masuk.';
  if(!vtok||vmail!==m){er.textContent='Mengirim kode…';try{const j=await vapi('send',{email:m});vtok=j.token;vmail=m}catch(x){return er.textContent='Gagal kirim kode: '+x.message}
    $('#vb').classList.remove('hide');$('#rB').textContent='Verifikasi & buat akun';$('#rK').focus();return er.textContent='Kode dikirim ke '+m+'. Cek Inbox atau Spam.'}
  try{await vapi('check',{email:m,code:$('#rK').value.trim(),token:vtok})}catch(x){return er.textContent=x.message}
  vtok=vmail=null;$('#vb').classList.add('hide');$('#rB').textContent='Kirim kode ke email';$('#rK').value='';
  const salt=rnd(),rs=rnd(),code=mkcode();users[m]={name:n,salt,rs,t:Date.now(),h:await hash(p,salt),rh:await hash(code,rs)};st.set('nx_users',users);push();pendM=m;$('#rcc').textContent=code;$('#rcv').classList.remove('hide');};
$('#fL').onsubmit=async e=>{e.preventDefault();const m=$('#lE').value.trim().toLowerCase(),p=$('#lP').value,u=users[m],er=$('#eL');
  if(!u||u.h!==await hash(p,u.salt))return er.textContent='Email atau kata sandi salah.';
  st.set('nx_sess',m);boot();};
function logout(){pend=[];renderTray();unl=false;$('#lock').classList.add('hide');st.del('nx_sess');me=D=null;$('#ov').classList.add('hide');$('#lP').value='';$('#wrap').innerHTML='';show(false);theme()}

/* boot */
async function boot(){
  users=st.get('nx_users')||{};const s=st.get('nx_sess');
  if(!s||!users[s]){show(false);theme();return}
  me=s;D=st.get('nx_data_'+me)||{chats:[],cur:null,set:{...defSet}};D.set={...defSet,...D.set};theme();
  $('#av').textContent=users[me].name[0].toUpperCase();$('#mn').textContent=users[me].name;$('#me').textContent=me;
  show(true);if(!D.cur||!D.chats.find(c=>c.id===D.cur))D.cur=D.chats[0]?.id||null;renderAll();lockChk();D.set.model=MODELS[D.set.model]?D.set.model:'x:dattio';$('#mdl').value=$('#sM').value=D.set.model;extUI();
  try{sample=await claude.use('sample')}catch{sample=null}
}
const cur=()=>D.chats.find(c=>c.id===D.cur);

/* render */
function chart(c){try{const j=JSON.parse(c.replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')),v=j.values.map(Number),l=j.labels,mx=Math.max(...v,1),W=320,H=160,bw=W/v.length,y=x=>H-8-(x/mx)*(H-30);let g;
 if(j.type==='line')g='<polyline fill="none" stroke="var(--accent)" stroke-width="3" points="'+v.map((x,i)=>(bw*i+bw/2)+','+y(x)).join(' ')+'"/>'+v.map((x,i)=>'<circle cx="'+(bw*i+bw/2)+'" cy="'+y(x)+'" r="4" fill="var(--accent2)"/>').join('');
 else g=v.map((x,i)=>'<rect x="'+(bw*i+bw*.15)+'" y="'+y(x)+'" width="'+bw*.7+'" height="'+(H-8-y(x))+'" rx="5" fill="url(#cg)"/>').join('');
 return '<div style="margin:6px 0"><b>'+esc(String(j.title||''))+'</b><svg viewBox="0 0 '+W+' '+(H+22)+'" width="100%"><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent2)"/></linearGradient></defs>'+g+l.map((x,i)=>'<text x="'+(bw*i+bw/2)+'" y="'+(H+14)+'" font-size="10" text-anchor="middle" fill="var(--muted)">'+esc(String(x))+'</text>').join('')+'</svg></div>'}catch{return'<pre><code>'+c+'</code></pre>'}}
const tb=p=>{const r=p.trim().split('\n').filter(l=>!/^\s*\|[\s:|-]+\|\s*$/.test(l)).map(l=>l.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim()));return '<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:13px">'+r.map((c,i)=>{const k=i?'td':'th';return '<tr>'+c.map(x=>'<'+k+' style="border:1px solid var(--border);padding:5px 9px;text-align:left">'+x+'</'+k+'>').join('')+'</tr>'}).join('')+'</table></div>'};
function md(t){
  t=esc(t);const blocks=[];
  t=t.replace(/```(\w*)\n?([\s\S]*?)```/g,(_,l,c)=>{blocks.push(l==='chart'?chart(c):'<pre><code>'+c+'</code></pre>');return'\u0000'+(blocks.length-1)+'\u0000'});
  t=t.replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>');
  t=t.split(/\n{2,}/).map(p=>/^\s*\|.*\|\s*\n\s*\|[\s:|-]+\|/.test(p)?tb(p):/^\s*#{1,3} /.test(p)?'<p><b>'+p.replace(/^\s*#{1,3} /,'')+'</b></p>':/^\s*[-*] /.test(p)?'<ul>'+p.split('\n').map(l=>'<li>'+l.replace(/^\s*[-*] /,'')+'</li>').join('')+'</ul>':'<p>'+p.replace(/\n/g,'<br>')+'</p>').join('');
  return t.replace(/\u0000(\d+)\u0000/g,(_,i)=>blocks[i]);
}
function renderAll(){renderChats();renderMsgs()}
let sel=null;
function row(c){const d=document.createElement('div');d.className='ci'+(c.id===D.cur&&!sel?' on':'');
  d.innerHTML=(sel?'<input type="checkbox" style="width:auto"'+(sel.has(c.id)?' checked':'')+'>':'')+'<span></span>'+(sel?'':'<b data-a="p" title="Sematkan">'+(c.pin?'📍':'📌')+'</b><b data-a="x" title="Hapus">✕</b>');
  d.querySelector('span').textContent=c.title;
  d.onclick=e=>{const a=e.target.dataset&&e.target.dataset.a;
    if(sel){sel.has(c.id)?sel.delete(c.id):sel.add(c.id);renderChats();return}
    if(busy)return;
    if(a==='p'){c.pin=!c.pin||undefined;save();renderChats();return}
    if(a==='x'){D.chats=D.chats.filter(x=>x.id!==c.id);if(D.cur===c.id)D.cur=D.chats[0]?.id||null;save();renderAll();return}
    D.cur=c.id;save();renderAll();$('#side').classList.remove('open')};
  return d}
function renderChats(){
  const el=$('#chats'),q=($('#q').value||'').toLowerCase();el.innerHTML='';
  const L=D.chats.filter(c=>c.title.toLowerCase().includes(q)),gs=[['📌 Disematkan',L.filter(c=>c.pin)]];
  [...new Set(L.filter(c=>c.f&&!c.pin).map(c=>c.f))].forEach(f=>gs.push(['📁 '+f,L.filter(c=>c.f===f&&!c.pin)]));
  gs.push(['Obrolan',L.filter(c=>!c.pin&&!c.f)]);
  gs.forEach(([h,a])=>{if(!a.length)return;const g=document.createElement('div');g.className='gh';g.textContent=h;el.append(g);a.forEach(c=>el.append(row(c)))});
  $('#bar').classList.toggle('hide',!sel);if(sel)$('#bdel').textContent='Hapus ('+sel.size+')';
}
function attEl(x){let e;const u=x.src||URLS[x.id];
  if(x.k==='img'&&u){e=document.createElement('img');e.src=u}
  else if(x.k==='video'&&u){e=document.createElement('video');e.src=u;e.controls=true;e.playsInline=true}
  else if(x.k==='audio'&&u){e=document.createElement('audio');e.src=u;e.controls=true}
  else{e=document.createElement('span');e.className='chip';e.textContent=({img:'🖼',video:'🎥',audio:'🎵',file:'📄'}[x.k]||'📄')+' '+x.n}
  return e}
function bubble(m,i){const d=document.createElement('div');d.className='m '+(m.r==='user'?'u':'a');const b=document.createElement('div');b.className='b';
  if(m.att&&m.att.length){const a=document.createElement('div');a.className='att';m.att.forEach(x=>a.append(attEl(x)));b.append(a)}
  const tx=document.createElement('div');if(m.r==='user')tx.textContent=m.t;else tx.innerHTML=m.t?md(m.t):'<span class="dots"></span>';b.append(tx);
  const ac=document.createElement('div');ac.className='act';const L=cur().msgs.length-1,vn=m.vs&&m.vs.length>1;
  if(m.r==='user')ac.innerHTML='<button data-a="e">✎ Edit</button>';
  else if(m.t)ac.innerHTML=(vn?'<button data-a="p">‹</button><span style="font-size:12px;align-self:center">'+(m.vi+1)+'/'+m.vs.length+'</span><button data-a="n">›</button>':'')+'<button data-a="c">⧉ Salin</button><button data-a="s">🔊 Bacakan</button>'+(m.mdl?'<span style="font-size:11px;color:var(--muted);align-self:center;margin-left:6px">'+esc(m.mdl)+'</span>':'')+(i===L?'<button data-a="r">↻ Ulangi</button>':'');
  if(ac.innerHTML){ac.onclick=e=>{const k=e.target.dataset.a;if(k==='c')copy(m.t);if(k==='s')speak(m.t);if(k==='r')regen();if(k==='e')edit(i);if(k==='p'||k==='n'){const n=m.vs.length;m.vi=(m.vi+(k==='n'?1:n-1))%n;m.t=m.vs[m.vi];save();renderMsgs()}};b.append(ac)}
  d.append(b);return d}
function renderMsgs(){
  const w=$('#wrap'),c=cur();w.innerHTML='';$('#ttl').textContent=c?c.title:'Obrolan baru';['back','ren','exp','fld'].forEach(i=>$('#'+i).classList.toggle('hide',!c));$('#agent').value=(c&&c.agent)||D.set.agent||'umum';
  if(!c||!c.msgs.length){const first=users[me].name.split(' ')[0];
    w.innerHTML='<div class="empty"><div class="logo" style="width:56px;height:56px;font-size:26px">N</div><h2>'+greet()+', '+esc(first)+'!</h2><p>Saya Nexa, agen AI yang siap membantu menulis, menganalisis, menghitung, dan merencanakan.</p><div class="sug"></div></div>';
    ['Buatkan rencana belajar 4 minggu','Jelaskan API dengan analogi sederhana','Berapa 18% dari 2.450.000?','Sekarang jam berapa?'].forEach((s,i)=>{const b=document.createElement('button');b.innerHTML='<i>'+['📅','💡','🧮','🕒'][i]+'</i>'+s;b.onclick=()=>{$('#inp').value=s;send()};w.querySelector('.sug').append(b)});return}
  c.msgs.forEach((m,i)=>w.append(bubble(m,i)));scroll();
}
const scroll=()=>{const e=$('#msgs');e.scrollTop=e.scrollHeight};

/* chat */
const tools=()=>[
  {name:'waktu_sekarang',description:'Mengambil tanggal dan waktu saat ini milik pengguna.',inputSchema:{type:'object',properties:{}},execute:()=>({lokal:new Date().toLocaleString('id-ID',{dateStyle:'full',timeStyle:'long'}),zona:Intl.DateTimeFormat().resolvedOptions().timeZone})},
  {name:'kalkulator',description:'Menghitung ekspresi matematika (+ - * / % ** dan kurung).',inputSchema:{type:'object',properties:{ekspresi:{type:'string'}},required:['ekspresi']},
   execute:({ekspresi})=>{const x=String(ekspresi).replace(/\^/g,'**').replace(/,/g,'.');if(!/^[0-9+\-*/().%\s*]+$/.test(x))throw new Error('Ekspresi tidak valid');return{hasil:Function('"use strict";return ('+x+')')()}}}
];
const d2b=s=>{const p=s.split(','),m=p[0].match(/:(.*?);/)[1],b=atob(p[1]),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new Blob([u],{type:m})};
async function send(){
  const inp=$('#inp');if(busy){ctl&&ctl.abort();return}
  const t=inp.value.trim()||(pend.length?'Tolong analisis lampiran ini.':'');if(!t)return;
  const M0=MODELS[D.set.model]||MODELS['c:sonnet'];if(M0.p==='claude'&&!sample){toast('Claude hanya tersedia di halaman Claude. Pilih model lain.');return}
  let c=cur();if(!c){c={id:rnd(),title:t.slice(0,40),msgs:[],agent:D.set.agent||'umum'};D.chats.unshift(c);D.cur=c.id}
  if(!c.msgs.length)c.title=t.slice(0,40);
  let keep=null;if(editing&&editing.c===c.id&&c.msgs[editing.i]){keep=c.msgs[editing.i];c.msgs.length=editing.i}editing=null;const m={r:'user',t};if(keep&&!pend.length){m.att=keep.att;m.ctx=keep.ctx}if(pend.length){m.att=pend.map(x=>({id:x.id,k:x.k,n:x.n,src:x.src,fr:x.fr}));m.ctx=pend.map(x=>x.ctx).filter(Boolean).join('\n\n')}
  c.msgs.push(m);pend=[];inp.value='';inp.style.height='auto';renderTray();await run(c);
}
async function run(c,prev){
  const bot={r:'assistant',t:''};if(prev){bot.vs=[...(prev.vs||[prev.t]),''];bot.vi=bot.vs.length-1}c.msgs.push(bot);renderAll();busy=true;ctl=new AbortController();$('#send').textContent='Stop';
  const sys='Kamu adalah Nexa, asisten AI agent yang profesional, akurat, dan ramah. Jawab dalam bahasa yang dipakai pengguna (default Bahasa Indonesia). Nama pengguna: '+users[me].name+'. '+(AG[c.agent||'umum']||AG.umum)[1]+' '+(D.set.persona?'Instruksi tambahan: '+D.set.persona:'')+' Untuk grafik, tulis blok kode berlabel chart berisi JSON {"type":"bar" atau "line","title":"...","labels":[...],"values":[angka]}; untuk tabel pakai tabel markdown.'+(D.set.tools?' Gunakan alat yang tersedia bila perlu (waktu, kalkulator) daripada menebak.':'');
  const hist=c.msgs.slice(0,-1).slice(-20).map(m=>({role:m.r,content:m.t+(m.ctx?'\n\n'+m.ctx:'')}));
  while(hist.length&&hist[0].role!=='user')hist.shift();
  hist[0].content='[Instruksi sistem]\n'+sys+'\n[Akhir instruksi]\n\n'+hist[0].content;
  const lu=[...c.msgs].reverse().find(m=>m.r==='user'),imgs=[],imgS=[];
  (lu.att||[]).forEach(a=>{const s=a.k==='img'?a.src:a.fr;if(s){imgs.push(d2b(s));imgS.push(s)}});
  const bub=()=>$('#wrap').lastChild.querySelector('.b>div:last-child');
  try{
    const M=MODELS[D.set.model]||MODELS['c:sonnet'],onText=({text})=>{bot.t=text;bub().innerHTML=md(text);scroll()};bot.mdl=M.l.split(' · ')[0];let r;
    if(M.p==='claude'){
      if(!sample)throw{message:'Claude hanya tersedia di halaman Claude. Pilih model lain.'};
      let lim={};try{lim=await sample.limits()}catch{}
      const o={signal:ctl.signal,cache:false,modelTier:D.set.tier,model:M.m,onText};
      if(D.set.tools)o.tools=tools();
      if(imgs.length){if(lim.images)o.images=imgs.slice(0,3);else hist[hist.length-1].content+='\n\n[Catatan: gambar terlampir tidak dapat dilihat saat ini.]'}
      r=await sample(hist,o);
    }else r=await extCall(D.set.model,M,hist,imgS,ctl.signal,onText);
    bot.t=r.text||bot.t||'(tidak ada jawaban)';
  }catch(e){
    if(e&&e.name==='AbortError'||ctl.signal.aborted){bot.t=bot.t||'(dihentikan)'}
    else{const m={not_granted:'Izin AI belum diberikan. Coba kirim lagi dan setujui permintaan izin.',rate_limited:'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.'}[e&&e.code];bot.t=(e&&e.text||'')+(m||'Maaf, terjadi kesalahan: '+((e&&e.message)||'tidak diketahui'))}
  }
  if(bot.vs)bot.vs[bot.vi]=bot.t;busy=false;ctl=null;$('#send').textContent='Kirim';save();renderAll();
}
function regen(){if(busy)return;const c=cur();if(!c||c.msgs.at(-1).r!=='assistant')return;run(c,c.msgs.pop())}
$('#send').onclick=send;
$('#inp').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!/Mobi|Android/i.test(navigator.userAgent)){e.preventDefault();send()}});
$('#inp').addEventListener('input',e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,160)+'px'});
$('#newC').onclick=()=>{if(busy)return;D.cur=null;save();renderAll();$('#side').classList.remove('open');$('#inp').focus()};
$('#menu').onclick=()=>$('#side').classList.toggle('open');
$('#thm').onclick=()=>{const dark=document.documentElement.getAttribute('data-theme')==='dark'||(!document.documentElement.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme:dark)').matches);D.set.theme=dark?'light':'dark';save();theme()};

/* pengaturan */
$('#gear').onclick=()=>{$('#sN').value=users[me].name;$('#sE').value=me;$('#sP').value=D.set.persona;$('#sT').value=D.set.tier;$('#sTools').checked=D.set.tools;$('#sTh').value=D.set.theme;$('#pO').value=$('#pN').value='';$('#eS').textContent='';$('#ov').classList.remove('hide')};
$('#close').onclick=()=>$('#ov').classList.add('hide');
$('#ov').onclick=e=>{if(e.target.id==='ov')$('#ov').classList.add('hide')};
$('#sSave').onclick=()=>{const n=$('#sN').value.trim();if(n.length<2)return toast('Nama minimal 2 karakter');
  users[me].name=n;st.set('nx_users',users);Object.assign(D.set,{persona:$('#sP').value.trim(),tier:$('#sT').value,tools:$('#sTools').checked,theme:$('#sTh').value});save();theme();
  $('#av').textContent=n[0].toUpperCase();$('#mn').textContent=n;renderMsgs();toast('Pengaturan disimpan')};
$('#pSave').onclick=async()=>{const o=$('#pO').value,n=$('#pN').value,u=users[me],er=$('#eS');
  if(u.h!==await hash(o,u.salt))return er.textContent='Kata sandi lama salah.';
  if(n.length<6)return er.textContent='Kata sandi baru minimal 6 karakter.';
  u.salt=rnd();u.t=Date.now();u.h=await hash(n,u.salt);st.set('nx_users',users);er.textContent='';$('#pO').value=$('#pN').value='';toast('Kata sandi diubah')};
function sure(b,fn){if(b.dataset.s){clearTimeout(+b.dataset.s);delete b.dataset.s;b.textContent=b.dataset.t;fn();return}b.dataset.t=b.textContent;b.textContent='Yakin? Ketuk lagi';b.dataset.s=setTimeout(()=>{delete b.dataset.s;b.textContent=b.dataset.t},3000)}
$('#clr').onclick=e=>sure(e.target,()=>{D.chats=[];D.cur=null;save();renderAll();toast('Obrolan dihapus')});
$('#del').onclick=e=>sure(e.target,()=>{delete users[me];st.set('nx_users',users);st.del('nx_data_'+me);logout();toast('Akun dihapus')});
$('#out').onclick=()=>{if(busy&&ctl)ctl.abort();logout()};

/* salin, suara, kembali */
async function copy(t,m){try{await navigator.clipboard.writeText(t);toast(m||'Teks disalin')}catch{const a=document.createElement('textarea');a.value=t;document.body.append(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch{}a.remove();toast(ok?(m||'Teks disalin'):'Gagal menyalin')}}
function speak(t){const s=window.speechSynthesis;if(!s)return toast('Tidak didukung browser ini');if(s.speaking){s.cancel();return}const u=new SpeechSynthesisUtterance(t.replace(/[`*#]/g,''));u.lang='id-ID';s.speak(u)}
$('#wrap').addEventListener('click',e=>{const p=e.target.closest('pre');if(p)copy(p.textContent,'Kode disalin')});
$('#back').onclick=()=>{if($('#side').classList.contains('open')){$('#side').classList.remove('open');return}if(busy&&ctl)ctl.abort();D.cur=null;save();renderAll()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#ov').classList.add('hide');$('#side').classList.remove('open')}});
$('#q').oninput=renderChats;
$('#ren').onclick=()=>{if(!cur())return;const h=$('#ttl');h.contentEditable='true';h.focus();getSelection().selectAllChildren(h)};
$('#ttl').onblur=()=>{const h=$('#ttl'),c=cur();if(h.contentEditable!=='true')return;h.contentEditable='false';const n=h.textContent.trim().slice(0,60);if(c&&n){c.title=n;save()}renderAll()};
$('#ttl').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();e.target.blur()}};
$('#exp').onclick=async()=>{const c=cur();if(!c)return;const tx='# '+c.title+'\n\n'+c.msgs.map(m=>(m.r==='user'?'Kamu':'Nexa')+':\n'+m.t).join('\n\n---\n\n');
  try{const d=await claude.use('downloads');if(!d)throw 0;await d.save({filename:(c.title.replace(/[^\w\- ]+/g,'').trim().slice(0,40)||'obrolan')+'.txt',data:tx});toast('Obrolan diekspor')}catch{copy(tx,'Obrolan disalin ke clipboard')}};

/* lampiran */
const MAX=15*1024*1024,IC={img:'🖼',video:'🎥',audio:'🎵',file:'📄'};
const shrink=f=>new Promise((ok,no)=>{const u=URL.createObjectURL(f),i=new Image();i.onload=()=>{const s=Math.min(1,1024/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*s;c.height=i.height*s;c.getContext('2d').drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.8))};i.onerror=()=>no();i.src=u});
const frame=f=>new Promise(ok=>{const v=document.createElement('video'),u=URL.createObjectURL(f);v.muted=true;v.playsInline=true;v.preload='auto';
  v.onloadeddata=()=>{v.currentTime=Math.min(1,(v.duration||1)/2)};
  v.onseeked=()=>{try{const s=Math.min(1,640/Math.max(v.videoWidth,v.videoHeight)),c=document.createElement('canvas');c.width=v.videoWidth*s;c.height=v.videoHeight*s;c.getContext('2d').drawImage(v,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.7))}catch{ok(null)}URL.revokeObjectURL(u)};
  v.onerror=()=>ok(null);v.src=u});
async function addFiles(fs){
  for(const f of fs){
    if(pend.length>=6){toast('Maksimal 6 lampiran');break}
    if(f.size>MAX){toast(f.name+' terlalu besar (maks 15 MB)');continue}
    const id=rnd(),x={id,n:f.name||'file',k:'file'};
    try{
      if(f.type.startsWith('image/')){x.k='img';x.src=await shrink(f)}
      else if(f.type.startsWith('video/')){x.k='video';URLS[id]=URL.createObjectURL(f);x.fr=await frame(f);x.ctx='[Lampiran video: '+x.n+(x.fr?' — AI hanya melihat satu cuplikan frame]':' — isi video tidak bisa dibaca AI]')}
      else if(f.type.startsWith('audio/')){x.k='audio';URLS[id]=URL.createObjectURL(f);x.ctx='[Lampiran audio: '+x.n+' — isi audio tidak bisa didengar AI]'}
      else if(f.type.startsWith('text/')||/\.(txt|md|csv|json|js|ts|html|css|py|xml|log|yml|yaml|lua|sql)$/i.test(f.name)){const tx=await f.text();x.ctx='[File: '+x.n+']\n'+tx.slice(0,15000)+(tx.length>15000?'\n…(dipotong)':'')}
      else x.ctx='[Lampiran file: '+x.n+' — format ini tidak bisa dibaca AI]';
    }catch{toast('Gagal memproses '+x.n);continue}
    pend.push(x);renderTray();
  }
}
function renderTray(){const t=$('#tray');t.innerHTML='';pend.forEach((x,i)=>{const c=document.createElement('span');c.className='chip';c.textContent=IC[x.k]+' '+x.n.slice(0,24)+' ';const r=document.createElement('i');r.textContent='✕';r.onclick=()=>{pend.splice(i,1);renderTray()};c.append(r);t.append(c)});t.classList.toggle('hide',!pend.length)}
$('#clip').onclick=e=>{e.stopPropagation();$('#pop').classList.toggle('hide')};
document.addEventListener('click',()=>$('#pop').classList.add('hide'));
$('#pop').onclick=e=>{const k=e.target.dataset.k;if(!k)return;const fi=$('#fi');fi.accept={img:'image/*',video:'video/*',audio:'audio/*',file:'*/*'}[k];fi.click()};
$('#fi').onchange=e=>{addFiles([...e.target.files]);e.target.value=''};
$('#inp').addEventListener('paste',e=>{const f=[...(e.clipboardData?.files||[])];if(f.length){e.preventDefault();addFiles(f)}});
['dragover','drop'].forEach(n=>document.addEventListener(n,e=>{if(!D)return;e.preventDefault();if(n==='drop')addFiles([...e.dataTransfer.files])}));

/* dikte suara */
let rec=null;
$('#mic').onclick=()=>{const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R)return toast('Dikte suara tidak didukung browser ini');
  if(rec){rec.stop();return}
  rec=new R();rec.lang='id-ID';rec.interimResults=true;rec.continuous=true;const base=$('#inp').value;let fin='';
  rec.onresult=e=>{let it='';for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)fin+=r[0].transcript;else it+=r[0].transcript}$('#inp').value=(base+' '+fin+it).trim();$('#inp').dispatchEvent(new Event('input'))};
  rec.onend=()=>{rec=null;$('#mic').classList.remove('on')};rec.onerror=ev=>toast('Mikrofon: '+ev.error);
  try{rec.start();$('#mic').classList.add('on')}catch{rec=null}};

const closeSide=()=>$('#side').classList.remove('open');
$('#scrim').onclick=closeSide;$('#sclose').onclick=closeSide;
let tx0=null;$('#side').addEventListener('touchstart',e=>{tx0=e.touches[0].clientX},{passive:true});
$('#side').addEventListener('touchend',e=>{if(tx0!==null&&e.changedTouches[0].clientX-tx0<-60)closeSide();tx0=null});
const greet=()=>{const h=new Date().getHours();return h<11?'Selamat pagi':h<15?'Selamat siang':h<18?'Selamat sore':'Selamat malam'};
const ACC={violet:['#6366f1','#a855f7'],emerald:['#10b981','#06b6d4'],sky:['#0ea5e9','#6366f1'],rose:['#f43f5e','#f97316'],amber:['#f59e0b','#ef4444']};
$('#sws').innerHTML=Object.entries(ACC).map(([k,v])=>'<button data-c="'+k+'" title="'+k+'" style="background:linear-gradient(135deg,'+v[0]+','+v[1]+')"></button>').join('');
const markSw=()=>document.querySelectorAll('#sws button').forEach(b=>b.classList.toggle('on',b.dataset.c===((D&&D.set.accent)||'violet')));
$('#sws').onclick=e=>{const k=e.target.dataset.c;if(!k||!D)return;D.set.accent=k;save();theme();markSw()};
$('#gear').addEventListener('click',markSw);
$('#msgs').addEventListener('scroll',()=>{const e=$('#msgs');$('#down').classList.toggle('hide',e.scrollHeight-e.scrollTop-e.clientHeight<200)});
$('#down').onclick=()=>$('#msgs').scrollTo({top:1e9,behavior:'smooth'});

/* model AI */
const IN=!!window.claude;
const MODELS={
 'c:haiku':{l:'Claude Haiku 5.5 · cepat',p:'claude',m:'claude-haiku-5-5'},
 'c:sonnet':{l:'Claude Sonnet 5.5 · seimbang',p:'claude',m:'claude-sonnet-5-5'},
 'c:opus':{l:'Claude Opus 5.5 · terkuat',p:'claude',m:'claude-opus-5-5'},
 'x:openai':{l:'GPT (OpenAI)',p:'ext',url:'https://api.openai.com/v1',m:'gpt-4o-mini',vis:1},
 'x:deepseek':{l:'DeepSeek',p:'ext',url:'https://api.deepseek.com/v1',m:'deepseek-chat'},
 'x:gemini':{l:'Gemini (Google)',p:'ext',url:'https://generativelanguage.googleapis.com/v1beta/openai',m:'gemini-2.0-flash',vis:1},
 'x:openrouter':{l:'OpenRouter (Llama, Mistral, dll)',p:'ext',url:'https://openrouter.ai/api/v1',m:'meta-llama/llama-3.3-70b-instruct',vis:1},
 'x:dattio':{l:'Dattio AI',p:'ext',url:'https://bandelbanget.xyz/v1',m:'qwen-plus',key:'sk-qwen-dadbd053bf15b3d4f11c8d62fb3ac727f0c0646470730356'},
 'x:custom':{l:'Kustom (OpenAI-compatible)',p:'ext',url:'',m:''}};
{const g=(t,f)=>'<optgroup label="'+t+'">'+Object.entries(MODELS).filter(([k,v])=>f(v)).map(([k,v])=>'<option value="'+k+'">'+v.l+'</option>').join('')+'</optgroup>';
 const h=g('Claude',v=>v.p==='claude')+g('Penyedia lain (butuh file mandiri + API key)',v=>v.p==='ext');$('#mdl').innerHTML=h;$('#sM').innerHTML=h}
function extUI(){const k=D.set.model,M=MODELS[k],e=$('#ext');e.classList.toggle('hide',M.p!=='ext');if(M.p!=='ext')return;const c=(D.set.ext||{})[k]||{};
  $('#xK').value=c.key||(M.key?'••••••••••••':'');$('#xM').value=c.model||M.m;$('#xU').value=c.url||M.url;
  $('#xN').textContent=IN?'Di halaman Claude, koneksi ke penyedia lain diblokir. Unduh file mandiri dan pasang di hosting sendiri (mis. Vercel).':'Key dikirim langsung dari browser ke penyedia. Nama model bisa diubah sesuai akunmu.'}
function setModel(k){D.set.model=k;save();$('#mdl').value=$('#sM').value=k;extUI()}
$('#mdl').onchange=e=>setModel(e.target.value);$('#sM').onchange=e=>setModel(e.target.value);
$('#xK').onfocus=e=>{if(/^•/.test(e.target.value))e.target.value=''};$('#xK').onblur=e=>{if(!e.target.value&&MODELS[D.set.model].key)e.target.value='••••••••••••'};
['xK','xM','xU'].forEach(i=>$('#'+i).oninput=()=>{const k=D.set.model;D.set.ext=D.set.ext||{};D.set.ext[k]={key:/^•/.test($('#xK').value)?'':$('#xK').value.trim(),model:$('#xM').value.trim(),url:$('#xU').value.trim().replace(/\/$/,'')};save()});
async function extCall(key,M,hist,imgS,sig,onText){
  if(IN)throw{message:'Model '+M.l+' tidak bisa dipakai di halaman Claude (koneksi keluar diblokir). Pakai file mandiri yang di-hosting sendiri, atau pilih model Claude.'};
  const c=(D.set.ext||{})[key]||{},url=(c.url||M.url||'').replace(/\/$/,'');
  const ak=c.key||M.key;if(!ak)throw{message:'API key '+M.l+' belum diisi (Pengaturan → Model AI).'};
  if(!url||!(c.model||M.m))throw{message:'Base URL dan nama model harus diisi.'};
  const msgs=hist.map(h=>({role:h.role,content:h.content}));
  if(imgS.length&&M.vis){const l=msgs[msgs.length-1];l.content=[{type:'text',text:l.content},...imgS.slice(0,3).map(u=>({type:'image_url',image_url:{url:u}}))]}
  let r;try{r=await fetch(url+'/chat/completions',{method:'POST',signal:sig,headers:{'Content-Type':'application/json',Authorization:'Bearer '+ak},body:JSON.stringify({model:c.model||M.m,messages:msgs,stream:true})})}
  catch(e){if(e.name==='AbortError')throw e;throw{message:'Gagal terhubung ke '+url+' (jaringan atau CORS ditolak). Coba lewat OpenRouter atau proxy sendiri.'}}
  if(!r.ok){let t='';try{t=(await r.text()).slice(0,200)}catch{}throw{message:'HTTP '+r.status+' '+t}}
  const rd=r.body.getReader(),dc=new TextDecoder();let buf='',txt='';
  for(;;){const{done,value}=await rd.read();if(done)break;buf+=dc.decode(value,{stream:true});let i;
    while((i=buf.indexOf('\n'))>=0){const ln=buf.slice(0,i).trim();buf=buf.slice(i+1);if(!ln.startsWith('data:'))continue;const d=ln.slice(5).trim();if(d==='[DONE]')continue;
      try{const dl=JSON.parse(d).choices?.[0]?.delta?.content;if(dl){txt+=dl;onText({text:txt})}}catch{}}}
  return{text:txt}}
/* agen */
const AG={umum:['🤖 Umum',''],penulis:['✍️ Penulis','Kamu penulis profesional: gaya jelas, hidup, terstruktur; tawarkan revisi.'],koder:['💻 Koder','Kamu senior software engineer: beri kode lengkap siap pakai, jelaskan singkat, sebut risiko dan edge case.'],tutor:['🎓 Tutor','Kamu tutor sabar: jelaskan bertahap dengan contoh dan analogi, lalu beri satu latihan singkat.'],analis:['📊 Analis','Kamu analis data dan bisnis: berpikir terstruktur, pakai angka dan tabel, beri kesimpulan dan rekomendasi.'],penerjemah:['🌐 Penerjemah','Kamu penerjemah profesional: terjemahkan akurat sesuai konteks dan nada, beri catatan bila ada ambiguitas.']};
$('#agent').innerHTML=Object.entries(AG).map(([k,v])=>'<option value="'+k+'">'+v[0]+'</option>').join('');
$('#agent').onchange=e=>{const c=cur();if(c)c.agent=e.target.value;else D.set.agent=e.target.value;save()};
/* edit pesan */
let editing=null;
function edit(i){if(busy)return;const c=cur();editing={c:c.id,i};$('#inp').value=c.msgs[i].t;$('#inp').focus();$('#inp').dispatchEvent(new Event('input'));toast('Mengedit — kirim untuk mengganti & jawab ulang')}
/* folder, pilih banyak */
const setF=f=>{const c=cur();c.f=f||undefined;save();$('#fpop').classList.add('hide');renderChats();toast(f?'Dipindah ke '+f:'Folder dilepas')};
$('#fld').onclick=e=>{e.stopPropagation();const c=cur();if(!c)return;const fs=[...new Set(D.chats.map(x=>x.f).filter(Boolean))];
  $('#fpop').innerHTML=fs.map(f=>'<button data-f="'+esc(f)+'">📁 '+esc(f)+(c.f===f?' ✓':'')+'</button>').join('')+(c.f?'<button data-f="">✕ Tanpa folder</button>':'')+'<input id="nf" placeholder="+ Folder baru (Enter)" style="margin-top:6px">';$('#fpop').classList.toggle('hide')};
$('#fpop').onclick=e=>{e.stopPropagation();const f=e.target.dataset&&e.target.dataset.f;if(f!==undefined)setF(f)};
$('#fpop').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='nf'&&e.target.value.trim())setF(e.target.value.trim().slice(0,20))});
document.addEventListener('click',()=>$('#fpop').classList.add('hide'));
$('#selb').onclick=()=>{sel=sel?null:new Set();renderChats()};
$('#bcan').onclick=()=>{sel=null;renderChats()};
$('#bdel').onclick=e=>sure(e.target,()=>{D.chats=D.chats.filter(c=>!sel.has(c.id));if(!D.chats.find(c=>c.id===D.cur))D.cur=D.chats[0]?.id||null;sel=null;save();renderAll()});
/* voice note */
let mr=null,chunks=[],tr='';
$('#rc').onclick=async()=>{if(mr){mr.stop();return}
  try{const stm=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];tr='';mr=new MediaRecorder(stm);
    const R=window.SpeechRecognition||window.webkitSpeechRecognition;let sr=null;
    if(R){try{sr=new R();sr.lang='id-ID';sr.continuous=true;sr.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)tr+=e.results[i][0].transcript+' '};sr.start()}catch{sr=null}}
    mr.ondataavailable=e=>chunks.push(e.data);
    mr.onstop=()=>{stm.getTracks().forEach(t=>t.stop());try{sr&&sr.stop()}catch{}const b=new Blob(chunks,{type:mr.mimeType||'audio/webm'});mr=null;$('#rc').classList.remove('on');const id=rnd();URLS[id]=URL.createObjectURL(b);
      setTimeout(()=>{pend.push({id,k:'audio',n:'Voice note '+new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}),ctx:'[Voice note'+(tr?' — transkrip: '+tr.trim()+']':' — tanpa transkrip]')});renderTray()},400)};
    mr.start();$('#rc').classList.add('on');toast('Merekam… ketuk 🎙 lagi untuk selesai')}catch{toast('Mikrofon tidak bisa diakses')}};
/* keamanan */
let pendM=null,unl=false,hid=0;
const mkcode=()=>[...crypto.getRandomValues(new Uint8Array(6))].map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase().replace(/(.{4})(.{4})(.{4})/,'$1-$2-$3');
$('#rccp').onclick=()=>copy($('#rcc').textContent,'Kode disalin');
$('#rcok').onclick=()=>{$('#rcv').classList.add('hide');if(pendM){st.set('nx_sess',pendM);pendM=null;boot()}};
$('#rnew').onclick=async()=>{const code=mkcode(),u=users[me];u.rs=rnd();u.rh=await hash(code,u.rs);u.t=Date.now();st.set('nx_users',users);push();$('#rcc').textContent=code;$('#rcv').classList.remove('hide')};
$('#forgot').onclick=e=>{e.preventDefault();$('#fL').classList.add('hide');$('#fF').classList.remove('hide')};
$('#fback').onclick=e=>{e.preventDefault();tab(1)};
$('#fF').onsubmit=async e=>{e.preventDefault();const m=$('#fE').value.trim().toLowerCase(),cd=$('#fC').value.trim().toUpperCase(),np=$('#fP').value,u=users[m],er=$('#eF');
  if(!u||!u.rh||u.rh!==await hash(cd,u.rs))return er.textContent='Email atau kode pemulihan salah (atau akun belum punya kode).';
  if(np.length<6)return er.textContent='Kata sandi baru minimal 6 karakter.';
  u.salt=rnd();u.h=await hash(np,u.salt);u.t=Date.now();st.set('nx_users',users);push();er.textContent='';tab(1);toast('Kata sandi direset. Silakan masuk.')};
function lockChk(){if(D&&D.set.pin&&!unl){$('#lock').classList.remove('hide');$('#lpin').value='';$('#lerr').textContent='';setTimeout(()=>$('#lpin').focus(),50)}}
$('#lpin').oninput=async e=>{const v=e.target.value,p=D.set.pin;if(!p||v.length<p.n)return;if(await hash(v,p.s)===p.h){unl=true;$('#lock').classList.add('hide')}else{$('#lerr').textContent='PIN salah';e.target.value=''}};
$('#lfg').onclick=()=>$('#fp').classList.toggle('hide');
$('#lrst').onclick=async()=>{const u=users[me];if(u.h!==await hash($('#lpw').value,u.salt)){$('#lerr').textContent='Kata sandi akun salah';return}delete D.set.pin;unl=true;save();$('#lpw').value='';$('#lock').classList.add('hide');toast('PIN dimatikan')};
$('#lout').onclick=logout;
$('#pinS').onclick=async()=>{const v=$('#pin').value.trim();if(!v){delete D.set.pin;save();return toast('PIN dimatikan')}if(!/^\d{4,6}$/.test(v))return toast('PIN harus 4–6 angka');const s2=rnd();D.set.pin={s:s2,n:v.length,h:await hash(v,s2)};unl=true;save();$('#pin').value='';toast('PIN disimpan')};
$('#lockN').onclick=()=>{if(!D.set.pin)return toast('Atur PIN dulu');unl=false;$('#ov').classList.add('hide');lockChk()};
document.addEventListener('visibilitychange',()=>{if(document.hidden)hid=Date.now();else if(hid&&D&&Date.now()-hid>120000){unl=false;lockChk()}});
/* sinkron lintas perangkat (db pribadi akun claude.ai) */
let SY=null,stmr=null;
const lite=x=>JSON.parse(JSON.stringify(x,(k,v)=>k==='src'||k==='fr'||k==='ext'?undefined:v));
async function syncInit(){try{const d=await claude.use('db'),u=await claude.use('user');if(!d||!u)return;SY=d.doc('data/users/'+await u.id()+'/nx');
  const sn=await SY.get();if(!sn.exists)return push();const r=sn.data(),ru=JSON.parse(r.users||'{}'),rd=JSON.parse(r.data||'{}');
  for(const k in ru)if(!users[k]||(ru[k].t||0)>(users[k].t||0))users[k]=ru[k];st.set('nx_users',users);
  for(const k in rd){const l=st.get('nx_data_'+k);if(!l||(rd[k].ts||0)>(l.ts||0))st.set('nx_data_'+k,rd[k])}
  if(me){const n=st.get('nx_data_'+me);if(n&&(n.ts||0)>(D.ts||0)){n.set={...n.set,ext:D.set.ext};D=n;D.set={...defSet,...D.set};theme();renderAll()}}}catch{}}
function push(){if(!SY)return;clearTimeout(stmr);stmr=setTimeout(async()=>{try{const data={};for(const k in users){const x=st.get('nx_data_'+k);if(x)data[k]=lite(x)}
  while(JSON.stringify(data).length>200000){let cut=false;for(const k in data)if(data[k].chats.length>1){data[k].chats.pop();cut=true}if(!cut)break}
  await SY.set({users:JSON.stringify(users),data:JSON.stringify(data)})}catch{}},1500)}
$('#rsd').onclick=e=>{e.preventDefault();vtok=null;$('#fR').requestSubmit()};
boot();syncInit();
