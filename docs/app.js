const FEED_URL='./feed.json';
const VISITOR_URL='https://commonplace-stream.alejandrotauber.workers.dev/visitors';
const VISITOR_KEY='commonplace-counted-visitor-v1';
const links=new Map(),feed=document.getElementById('feed'),detail=document.getElementById('detail'),list=document.getElementById('link-list'),status=document.getElementById('live-status'),statusText=document.getElementById('live-text');
let selectedUrl=null,visitorCount=null,generatedAt=null;
function shortDid(did){return did.length>22?did.slice(0,12)+'…'+did.slice(-5):did}
function initials(value){return value.slice(-2).toUpperCase()}
function relativeTime(value){const m=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/60000));return m<1?'zojuist':m<60?m+' min':m<1440?Math.floor(m/60)+' u':Math.floor(m/1440)+' d'}
function fallbackTitle(url){const p=new URL(url),part=decodeURIComponent(p.pathname).replace(/[-_]/g,' ').replace(/\/+$/,'').split('/').filter(Boolean).pop();return part&&part.length>3?part:p.hostname.replace(/^www\./,'')}
function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node}
function metrics(item){const replies=item.posts.flatMap(post=>post.replies||[]);return{conversations:item.posts.length,messages:item.posts.length+replies.length,people:new Set([...item.posts,...replies].map(post=>post.did)).size}}
function setStatus(state,text){status.dataset.state=state;statusText.textContent=text}
function liveStatus(){
  if(!generatedAt)return;
  const time=new Date(generatedAt).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});
  const visitors=visitorCount===null?'':' – '+new Intl.NumberFormat('nl-NL').format(visitorCount)+' '+(visitorCount===1?'bezoeker heeft':'bezoekers hebben')+' hier hun voordeel mee gedaan';
  setStatus('live','Bijgewerkt om '+time+visitors);
}
function loadDemo(){
  const now=Date.now(),minutes=value=>new Date(now-value*60000).toISOString();
  const demo=[
    {id:'demo-wonen',url:'https://voorbeeld.nl/stad/ruimte-voor-wonen',domain:'voorbeeld.nl',title:'Hoe maken we in bestaande steden meer ruimte voor wonen?',description:'Een analyse van verdichting, openbare ruimte en de keuzes die gemeenten daarbij maken.',posts:[
      {did:'did:plc:demo1',rkey:'wonen1',handle:'marieke.example',displayName:'Marieke de Vries',text:'Interessant dat het debat steeds over aantallen woningen gaat, en veel minder over wat voor buurten we daarmee bouwen.',createdAt:minutes(18),replies:[{did:'did:plc:demo2',rkey:'wonen2',handle:'jochem.example',displayName:'Jochem',text:'Precies. Vooral het stuk over voorzieningen op loopafstand verdient meer aandacht.',createdAt:minutes(11)}]},
      {did:'did:plc:demo3',rkey:'wonen3',handle:'stadsblik.example',displayName:'Stadsblik',text:'Dit artikel legt helder uit waarom alleen hoger bouwen geen volledig antwoord is.',createdAt:minutes(7),replies:[]}
    ]},
    {id:'demo-publiek',url:'https://dekrant.example/cultuur/publieke-ruimte',domain:'dekrant.example',title:'Van wie is de publieke ruimte?',description:'Over terrassen, verkeer en de plekken in de stad waar niemand iets hoeft te kopen.',posts:[
      {did:'did:plc:demo4',rkey:'ruimte1',handle:'noor.example',displayName:'Noor El Amrani',text:'De beste zin: openbare ruimte is geen restruimte. Daar zouden veel gemeenteraden mee mogen beginnen.',createdAt:minutes(42),replies:[{did:'did:plc:demo5',rkey:'ruimte2',handle:'pieter.example',displayName:'Pieter',text:'En ook geen verdienmodel. Mooi dat het artikel dat onderscheid zo concreet maakt.',createdAt:minutes(31)},{did:'did:plc:demo6',rkey:'ruimte3',handle:'lot.example',displayName:'Lot',text:'Ben benieuwd hoe dit buiten de grote steden speelt.',createdAt:minutes(24)}]}
    ]},
    {id:'demo-media',url:'https://tijdschrift.example/media/nieuws-zonder-volgers',domain:'tijdschrift.example',title:'Wat blijft er van nieuws over als we de afzender minder belangrijk maken?',description:'Een essay over aandacht, distributie en gesprekken die niet rond één invloedrijk account draaien.',posts:[
      {did:'did:plc:demo7',rkey:'media1',handle:'bas.example',displayName:'Bas Smit',text:'Dit raakt precies aan waarom een chronologische tijdlijn nog niet automatisch een gedeelde publieke ruimte is.',createdAt:minutes(63),replies:[{did:'did:plc:demo8',rkey:'media2',handle:'eline.example',displayName:'Eline',text:'Ja — de ordening bepaalt nog steeds enorm veel, ook zonder aanbevelingsalgoritme.',createdAt:minutes(54)}]},
      {did:'did:plc:demo9',rkey:'media3',handle:'mediaonderzoek.example',displayName:'Mediaonderzoek',text:'Een nuttig gedachte-experiment: niet wie spreekt, maar waar meerdere mensen onafhankelijk naar verwijzen als vertrekpunt.',createdAt:minutes(37),replies:[]}
    ]},
    {id:'demo-natuur',url:'https://weekblad.example/wetenschap/rivier-als-buur',domain:'weekblad.example',title:'Kunnen we een rivier behandelen als een buur?',description:'Nieuwe manieren om over natuur, rechten en lokaal bestuur na te denken.',posts:[
      {did:'did:plc:demo10',rkey:'natuur1',handle:'sanne.example',displayName:'Sanne',text:'Mooie manier om een abstract juridisch idee ineens voorstelbaar te maken.',createdAt:minutes(96),replies:[{did:'did:plc:demo11',rkey:'natuur2',handle:'wouter.example',displayName:'Wouter',text:'Al blijft de vraag wie er dan namens die buur mag spreken.',createdAt:minutes(82)}]}
    ]}
  ];
  links.clear();for(const item of demo)links.set(item.url,item);generatedAt=new Date().toISOString();render();setStatus('live','Lokale ontwerpvoorbeelden — geen echte berichten');
}
function render(){
  list.replaceChildren();const items=[...links.values()].slice(0,20);
  if(!items.length){list.append(element('p','empty-state','Nog geen link met een actief Nederlandstalig gesprek gevonden. De gedeelde feed wordt iedere vijftien minuten bijgewerkt.'));return}
  for(const item of items){const score=metrics(item),card=element('button','link-card'),copy=element('span','link-copy');card.setAttribute('aria-label','Open berichten over '+(item.title||fallbackTitle(item.url)));copy.append(element('span','domain',item.domain),element('strong','link-title',item.title||fallbackTitle(item.url)));if(item.description)copy.append(element('span','description',item.description));const meta=element('span','card-meta');meta.append(element('span','',score.conversations+' '+(score.conversations===1?'gesprek':'gesprekken')),element('span','',score.messages+' berichten'),element('span','',score.people+' '+(score.people===1?'persoon':'mensen')));copy.append(meta);const arrow=element('span','open-label','→');arrow.setAttribute('aria-hidden','true');card.append(copy,arrow);card.addEventListener('click',()=>openLink(item.url));list.append(card)}
}
function showFeed(updateHistory=true){selectedUrl=null;detail.classList.add('hidden');feed.classList.remove('hidden');if(updateHistory){const next=new URL(location.href);next.searchParams.delete('gesprek');history.pushState({},'',next)}window.scrollTo(0,0)}
function openLink(url,scroll=true,updateHistory=true){
  const item=links.get(url);if(!item)return;selectedUrl=url;const posts=item.posts||[],replies=posts.flatMap(post=>post.replies||[]),people=new Set([...posts,...replies].map(post=>post.did)).size;
  if(updateHistory&&item.id){const next=new URL(location.href);next.searchParams.set('gesprek',item.id);history.pushState({},'',next)}
  document.getElementById('detail-domain').textContent=item.domain;document.getElementById('detail-title').textContent=item.title||fallbackTitle(item.url);document.getElementById('detail-description').textContent=item.description||'Gedeeld in openbare Nederlandstalige ATProto-berichten.';document.getElementById('detail-conversations').textContent=posts.length+' '+(posts.length===1?'gesprek':'gesprekken');document.getElementById('detail-messages').textContent=(posts.length+replies.length)+' berichten';document.getElementById('detail-people').textContent=people+' '+(people===1?'persoon':'mensen');document.getElementById('article-button').href=item.url;
  const conversations=document.getElementById('conversations');conversations.replaceChildren();
  function appendMessage(post,label,isReply=false){const article=element('article','conversation'+(isReply?' reply':'')),author=element('div','conversation-author'),identity=element('div'),name=post.displayName||post.handle||shortDid(post.did);identity.append(element('strong','',name),element('span','',(post.handle?'@'+post.handle+' · ':'')+label+' · '+relativeTime(post.createdAt)));author.append(element('span','avatar',initials(name)),identity);article.append(author,element('p','',post.text||'Dit bericht deelde de link zonder begeleidende tekst.'));const meta=element('div','conversation-meta'),source=element('a','','Bekijk oorspronkelijk bericht ↗');source.href='https://bsky.app/profile/'+post.did+'/post/'+post.rkey;source.target='_blank';source.rel='noopener noreferrer';meta.append(source);article.append(meta);conversations.append(article)}
  for(const post of posts){appendMessage(post,'start van gesprek');for(const reply of post.replies||[])appendMessage(reply,'antwoord',true)}feed.classList.add('hidden');detail.classList.remove('hidden');if(scroll)window.scrollTo(0,0)
}
async function loadFeed(){
  if(location.protocol==='file:'){loadDemo();return}
  setStatus('loading','Gedeelde feed ophalen…');
  try{const response=await fetch(FEED_URL,{cache:'no-store'});if(!response.ok)throw new Error();const snapshot=await response.json();links.clear();for(const item of snapshot.items||[])links.set(item.url,item);render();const requested=new URLSearchParams(location.search).get('gesprek'),requestedItem=[...links.values()].find(item=>item.id===requested);if(requestedItem)openLink(requestedItem.url,false,false);else if(selectedUrl&&links.has(selectedUrl))openLink(selectedUrl,false,false);generatedAt=snapshot.generatedAt||null;generatedAt?liveStatus():setStatus('loading','De eerste gedeelde feed wordt opgebouwd…')}
  catch{setStatus('error','De gedeelde feed kon niet worden opgehaald — opnieuw proberen…')}
}
async function loadVisitorCount(){
  if(location.protocol==='file:')return;
  let counted=false;try{counted=localStorage.getItem(VISITOR_KEY)==='1'}catch{}
  try{const response=await fetch(VISITOR_URL,{method:counted?'GET':'POST',cache:'no-store'});if(!response.ok)throw new Error();const data=await response.json();visitorCount=Number(data.count);if(!counted)try{localStorage.setItem(VISITOR_KEY,'1')}catch{}liveStatus()}catch{}
}
loadFeed();loadVisitorCount();setInterval(loadFeed,15*60*1000);document.getElementById('back').addEventListener('click',()=>showFeed());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadFeed()});window.addEventListener('popstate',()=>{const requested=new URLSearchParams(location.search).get('gesprek'),item=[...links.values()].find(value=>value.id===requested);item?openLink(item.url,false,false):showFeed(false)});
