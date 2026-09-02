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
function render(){
  list.replaceChildren();const items=[...links.values()].slice(0,20);
  if(!items.length){list.append(element('p','empty-state','Nog geen link met een actief Nederlandstalig gesprek gevonden. De gedeelde feed wordt iedere vijftien minuten bijgewerkt.'));return}
  for(const item of items){const score=metrics(item),card=element('button','link-card');card.setAttribute('aria-label','Open berichten over '+(item.title||fallbackTitle(item.url)));card.append(element('span','domain',item.domain),element('strong','',item.title||fallbackTitle(item.url)));if(item.description)card.append(element('span','description',item.description));const meta=element('span','card-meta');meta.append(element('span','',score.conversations+' '+(score.conversations===1?'gesprek':'gesprekken')),element('span','',score.messages+' berichten'),element('span','',score.people+' '+(score.people===1?'persoon':'mensen')),element('span','open-label','Open →'));card.append(meta);card.addEventListener('click',()=>openLink(item.url));list.append(card)}
}
function showFeed(){selectedUrl=null;detail.classList.add('hidden');feed.classList.remove('hidden');window.scrollTo(0,0)}
function openLink(url,scroll=true){
  const item=links.get(url);if(!item)return;selectedUrl=url;const posts=item.posts||[],replies=posts.flatMap(post=>post.replies||[]),people=new Set([...posts,...replies].map(post=>post.did)).size;
  document.getElementById('detail-domain').textContent=item.domain;document.getElementById('detail-title').textContent=item.title||fallbackTitle(item.url);document.getElementById('detail-description').textContent=item.description||'Gedeeld in openbare Nederlandstalige ATProto-berichten.';document.getElementById('detail-conversations').textContent=posts.length+' '+(posts.length===1?'gesprek':'gesprekken');document.getElementById('detail-messages').textContent=(posts.length+replies.length)+' berichten';document.getElementById('detail-people').textContent=people+' '+(people===1?'persoon':'mensen');document.getElementById('article-button').href=item.url;
  const conversations=document.getElementById('conversations');conversations.replaceChildren();
  function appendMessage(post,label,isReply=false){const article=element('article','conversation'+(isReply?' reply':'')),author=element('div','conversation-author'),identity=element('div'),name=post.displayName||post.handle||shortDid(post.did);identity.append(element('strong','',name),element('span','',(post.handle?'@'+post.handle+' · ':'')+label+' · '+relativeTime(post.createdAt)));author.append(element('span','avatar',initials(name)),identity);article.append(author,element('p','',post.text||'Dit bericht deelde de link zonder begeleidende tekst.'));const meta=element('div','conversation-meta'),source=element('a','','Bekijk oorspronkelijk bericht ↗');source.href='https://bsky.app/profile/'+post.did+'/post/'+post.rkey;source.target='_blank';source.rel='noopener noreferrer';meta.append(source);article.append(meta);conversations.append(article)}
  for(const post of posts){appendMessage(post,'start van gesprek');for(const reply of post.replies||[])appendMessage(reply,'antwoord',true)}feed.classList.add('hidden');detail.classList.remove('hidden');if(scroll)window.scrollTo(0,0)
}
async function loadFeed(){
  setStatus('loading','Gedeelde feed ophalen…');
  try{const response=await fetch(FEED_URL,{cache:'no-store'});if(!response.ok)throw new Error();const snapshot=await response.json();links.clear();for(const item of snapshot.items||[])links.set(item.url,item);render();if(selectedUrl&&links.has(selectedUrl))openLink(selectedUrl,false);generatedAt=snapshot.generatedAt||null;generatedAt?liveStatus():setStatus('loading','De eerste gedeelde feed wordt opgebouwd…')}
  catch{setStatus('error','De gedeelde feed kon niet worden opgehaald — opnieuw proberen…')}
}
async function loadVisitorCount(){
  let counted=false;try{counted=localStorage.getItem(VISITOR_KEY)==='1'}catch{}
  try{const response=await fetch(VISITOR_URL,{method:counted?'GET':'POST',cache:'no-store'});if(!response.ok)throw new Error();const data=await response.json();visitorCount=Number(data.count);if(!counted)try{localStorage.setItem(VISITOR_KEY,'1')}catch{}liveStatus()}catch{}
}
loadFeed();loadVisitorCount();setInterval(loadFeed,15*60*1000);document.getElementById('back').addEventListener('click',showFeed);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadFeed()});
