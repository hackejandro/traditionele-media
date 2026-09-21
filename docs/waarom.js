const revisions = [
  {
    title: 'Eerste aanzet',
    date: '18 september 2026',
    paragraphs: {
      p01: '<em>Uit pure luiheid vroeg ik ChatGPT om een artikel te schrijven over waarom ik deze site bouwde, maar de kwaliteit van schrijven was zo belabberd dat ik het zelf maar moet doen.</em>',
      p02: 'Ik zou hier kunnen beginnen met een groots altruïstisch statement: ik bouwde deze site omdat ik me zorgen maak over een samenleving met gebrek aan gedeelde ervaring en realiteit.',
      p03: 'Of omdat het in het huidige gefragmenteerde en gepolariseerde medialandschap zo moeilijk is om bij te blijven met relevante gebeurtenissen en ontwikkelingen omdat alles als even belangrijk gepresenteerd wordt.',
      p04: 'Of dat social media stuk is, dat je én niet meer de bronnen en mensen ziet die je volgt, én dat het volume van content te groot is geworden, én dat personalisatie van aanbod door algoritmes ervoor zorgt dat je alleen nog maar ‘nieuwe’ dingen ziet binnen een beperkt kader van passieve signalen (‘oh vond je die video van een eend een beetje leuk, hier zijn oneindig veel videos van eenden!’).',
      p05: 'En áls je dan nieuws ziet, is het meestal opinie van een columnist met heel veel volgers die vrijwel allemaal één recept volgen: de verontwaardigingsmachine aanzwengelen. Zonder het eens of oneens te zijn over de inhoud (echt geen zin in online discussies): of dat nou Sander Schimmelpenninck is die het feminismeknopje ontdekt heeft, Wierd Duk die wat dan ook doet, of Sheila Sistalting die signaleert hoe de rechterflank van de politiek eigenlijk allemaal onguur is, de functie is hetzelfde – mensen zijn boos <em>op</em> wat ze schrijven, of <em>over</em> wat ze schrijven.',
      p06: 'Of dat het media-aanbod én verschraald is door eigendomsconcentratie (looking at you, Mediahuis en DPG), waarbinnen verschillende nieuwsbronnen op dezelfde systemen met dezelfde doelen draaien en gelijksoortige content opleveren; én te rijk in nét verschillende smaken om elke mogelijke doelgroep te bedienen, waardoor het als divers geïnteresseerd mens niet mogelijk is om aan je informationele trekken te komen bij één medium (tenzij je je 100% identificeert als Volkskrant-lezer? Bestaat zo iemand?) en alles achter paywalls zit en je geen geld hebt voor allemaal en dus maar gewoon weer teruggaat naar oneindige eenden.',
      p07: 'Het zou allemaal niet onwaar zijn.',
      p08: 'Maar het simpele antwoord is veel egoïstischer en arroganter, sorry.',
      p09: 'Ik denk namelijk dat wat hier staat een manier is om dit allemaal enigszins beter te doen. En ik deel dat graag met jou, een mens op het internet.',
      p10: 'Het idee – of algoritme, zo je wil – is heel simpel. De site houdt bij elke links worden gedeeld door Nederlandstalige accounts op Bluesky (of Eurosky, of W, etc) en of een link door meerdere afzonderlijke accounts wordt gedeeld. Vervolgens kijkt het of er bij meerdere van die gedeelde links reacties komen. Dan wordt die link meegenomen in het overzicht.',
      p11: 'Het kijkt in feite naar onderwerpen die op meerdere plekken tegelijk nieuwsgierigheid, discussie of betrokkenheid oproepen.',
      p12: 'Daarmee voorkom je een aantal dingen die extreem irritant zijn op de platforms waar de meeste mensen nu hun nieuws vandaan halen:'
    }
  },
  {
    title: 'Eerste volledige versie',
    date: '21 september 2026',
    paragraphs: {
      p01: '<em>Uit pure luiheid vroeg ik ChatGPT om een artikel te schrijven over waarom ik deze site bouwde, maar de kwaliteit van schrijven was zo belabberd dat ik het zelf maar moet doen.</em>',
      p02: 'Ik zou hier kunnen beginnen met een groots altruïstisch statement: ik bouwde deze site omdat ik me zorgen maak over een samenleving met gebrek aan gedeelde ervaring en realiteit.',
      p03: 'Of omdat het in het huidige gefragmenteerde en gepolariseerde medialandschap zo moeilijk is om bij te blijven met relevante gebeurtenissen en ontwikkelingen omdat alles als even belangrijk gepresenteerd wordt.',
      p04: 'Of dat social media stuk is, dat je én niet meer de bronnen en mensen ziet die je volgt, én dat het volume van content te groot is geworden, én dat personalisatie van aanbod door algoritmes ervoor zorgt dat je alleen nog maar ‘nieuwe’ dingen ziet binnen een beperkt kader van passieve signalen (‘oh vond je die video van een eend een beetje leuk, hier zijn oneindig veel videos van eenden!’).',
      p05: 'En áls je dan nieuws ziet, is het meestal opinie van een columnist met heel veel volgers die vrijwel allemaal één recept volgen: de verontwaardigingsmachine aanzwengelen. Zonder het eens of oneens te zijn over de inhoud (echt geen zin in online discussies): of dat nou Sander Schimmelpenninck is die het feminismeknopje ontdekt heeft, Wierd Duk die wat dan ook doet, of Sheila Sistalting die signaleert hoe de rechterflank van de politiek eigenlijk allemaal onguur is, de functie is hetzelfde – mensen zijn boos op wat ze schrijven, of over wat ze schrijven.',
      p06: 'Of dat het media-aanbod én verschraald is door eigendomsconcentratie (looking at you, Mediahuis en DPG), waarbinnen verschillende nieuwsbronnen op dezelfde systemen met dezelfde doelen draaien en gelijksoortige content opleveren; én te rijk in nét verschillende smaken om elke mogelijke doelgroep te bedienen, waardoor het als divers geïnteresseerd mens niet mogelijk is om aan je informationele trekken te komen bij één medium (tenzij je je 100% identificeert als Volkskrant-lezer? Bestaat zo iemand?) en alles achter paywalls zit en je geen geld hebt voor allemaal en dus maar gewoon weer teruggaat naar oneindige eenden.',
      p07: 'Het zou allemaal niet onwaar zijn.',
      p08: 'Maar het simpele antwoord is veel egoïstischer en arroganter, sorry.',
      p09: 'Ik denk namelijk dat wat hier staat een manier is om dit allemaal enigszins beter te doen. En ik deel dat graag met jou, een mens op het internet.',
      p10: 'Het idee – of algoritme, zo je wil – is heel simpel. De site houdt bij elke links worden gedeeld door Nederlandstalige accounts op Bluesky (of Eurosky, of W, etc) en of een link door meerdere afzonderlijke accounts wordt gedeeld. Vervolgens kijkt het of er bij meerdere van die gedeelde links reacties komen. Dan wordt die link meegenomen in het overzicht.',
      p11: 'Het kijkt in feite naar onderwerpen die op meerdere plekken tegelijk nieuwsgierigheid, discussie of betrokkenheid oproepen.',
      p12: 'Daarmee voorkom je een aantal dingen die extreem irritant zijn op de platforms waar de meeste mensen nu hun nieuws vandaan halen:',
      p13: 'Ten eerste telt volume maar beperkt mee. Als één account dezelfde link tien keer deelt, zijn dat niet ineens tien gesprekken. Pas wanneer verschillende mensen de link onafhankelijk van elkaar oppakken, wordt het een signaal.',
      p14: 'Ten tweede maakt het niet zoveel uit wie iets deelt. Een columnist met 300.000 volgers en iemand met twaalf volgers leveren allebei één gesprek op. Bereik wordt daarmee niet volledig irrelevant — een groot account kan natuurlijk alsnog mensen aan het praten krijgen — maar het bepaalt niet vooraf wat bovenaan komt te staan.',
      p15: 'Ten derde hoef je die mensen niet te volgen. Dat klinkt onbenullig, maar is voor mij juist het interessant! Het overzicht wordt niet begrensd door de keuzes die ik ooit zelf heb gemaakt over welke accounts blijkbaar relevant zijn voor mijn leven. En het is ook niet gepersonaliseerd op basis van de eenden waar ik gisteren twee seconden te lang naar keek.',
      p16: 'Dat levert een ietwat vreemd maar vaak verrassend overzicht op. Naast wat ik veronderstel groot nieuws is, verschijnen er artikelen, blogs, spelletjes en obscure hoeken van het internet die ik anders nooit had gevonden.',
      p17: 'Het is misschien niet het beste signaal, maar het is wel sympathiek, al zeg ik het zelf. De site weet niet of iets waar is, belangrijk is of de moeite waard is. Veel gesprekken kunnen ook ontstaan omdat iets onzinnig of woedendmakend is.',
      p18: 'Daarnaast zijn openbare Nederlandstalige posts op Bluesky natuurlijk geen representatieve doorsnede van Nederland. Het is een klein groepje mensen op één relatief klein platform.',
      p19: 'Als ik iets weet als uitgever is het dat een voorpagina, trendinglijst of tijdlijn is nooit een neutrale weergave van wat er gebeurt. Het is altijd een antwoord op de vraag: welke signalen vinden we belangrijk genoeg om iets zichtbaar te maken? En zorgen die signalen voor het gewenste resultaat – of dat nou terugkerende bezoekers, langere kijktijd, meer abonnees, whatever?',
      p20: 'Als uitgever weet ik ook dat bezoekersaantallen, kijktijd, herhaling, likes, bereik en allerlei minuscule gedragingen waar je zelf nauwelijks weet van hebt, belangrijk zijn om een platform in leven te houden. Het is commercieel een begrijpelijk antwoord. Het is alleen niet noodzakelijk het antwoord dat mij helpt begrijpen wat er buiten mijn eigen hoofd gebeurt.',
      p21: 'Mocht het niet duidelijk zijn, met traditionele.media probeer ik een ander antwoord uit: zichtbaar maken wanneer meerdere mensen, met elkaar, maar zonder het per se van elkaar te weten, een actieve keuze maken om een gedeelde werkelijkheid te creeëren.',
      p22: 'Het is een vrij eenvoudige website die best vaak kapotgaat en waarschijnlijk allerlei dingen verkeerd meet. Maar het laat wel zien dat we sociale media anders kunnen ordenen dan rond accounts, bereik en voorspelde aandacht.',
      p23: 'Misschien is dat uiteindelijk de reden waarom ik de site heb gebouwd. Niet omdat ik precies weet hoe online media beter moeten werken, maar omdat ik het vreemd vind dat we nauwelijks nog experimenteren met de manier waarop informatie bij ons terechtkomt. We discussiëren eindeloos over de inhoud van sociale media, terwijl de ordening ervan minstens zo bepalend is.',
      p24: 'Dus heb ik zelf maar een ordening gemaakt.',
      p25: 'Doe er je voordeel mee.'
    }
  }
];

const STORAGE_KEY = 'traditionele-media-margin-comments-v1';
const body = document.getElementById('article-body');
const knob = document.getElementById('revision-knob');
const panel = document.getElementById('comment-panel');
const thread = document.getElementById('comment-thread');
const quote = document.getElementById('selected-quote');
const form = document.getElementById('comment-form');
const textarea = document.getElementById('comment-text');
const replyingTo = document.getElementById('replying-to');
let revisionIndex = revisions.length - 1;
let selectedParagraph = null;
let replyParent = null;
let comments = loadComments();

function loadComments() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveComments() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(comments)); } catch {}
}

function plainText(html) {
  const node = document.createElement('div');
  node.innerHTML = html;
  return node.textContent || '';
}

function allParagraphIds() {
  return [...new Set(revisions.flatMap(revision => Object.keys(revision.paragraphs)))];
}

function commentCount(id) {
  return comments.filter(comment => comment.paragraphId === id).length;
}

function makeParagraph(id, html) {
  const p = document.createElement('p');
  p.className = 'paragraph';
  p.dataset.paragraphId = id;
  if (id === 'p01') p.dataset.intro = 'true';
  const text = document.createElement('span');
  text.className = 'paragraph-text';
  text.innerHTML = html;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'comment-button';
  button.setAttribute('aria-label', 'Reageer op deze alinea');
  button.setAttribute('aria-expanded', 'false');
  button.textContent = commentCount(id) || '+';
  button.addEventListener('click', () => openComments(id));
  p.append(text, button);
  return p;
}

function initialRender() {
  const current = revisions[revisionIndex];
  for (const id of allParagraphIds()) {
    const html = current.paragraphs[id];
    const p = makeParagraph(id, html || '');
    if (!html) p.classList.add('is-absent');
    body.append(p);
  }
  updateRevisionControls();
}

function setRevision(nextIndex) {
  if (nextIndex === revisionIndex) return;
  const previous = revisions[revisionIndex];
  const next = revisions[nextIndex];
  revisionIndex = nextIndex;
  for (const id of allParagraphIds()) {
    const p = body.querySelector(`[data-paragraph-id="${id}"]`);
    const text = p.querySelector('.paragraph-text');
    const before = previous.paragraphs[id] || '';
    const after = next.paragraphs[id] || '';
    if (before === after) continue;
    p.classList.add('is-changing');
    window.setTimeout(() => {
      text.innerHTML = after;
      p.classList.toggle('is-absent', !after);
      p.classList.toggle('is-new', Boolean(after) && !before);
      p.classList.remove('is-changing');
      if (after && !before) window.setTimeout(() => p.classList.remove('is-new'), 1100);
    }, 180);
  }
  updateRevisionControls();
  if (selectedParagraph) {
    const selectedHtml = next.paragraphs[selectedParagraph];
    if (selectedHtml) quote.textContent = plainText(selectedHtml);
    else closeComments();
  }
}

function updateRevisionControls() {
  const revision = revisions[revisionIndex];
  document.getElementById('version-title').textContent = revision.title;
  document.getElementById('version-date').textContent = revision.date;
  knob.style.setProperty('--angle', revisionIndex === 0 ? '-45deg' : '135deg');
  knob.setAttribute('aria-label', revisionIndex === revisions.length - 1 ? 'Ga naar de vorige versie' : 'Ga naar de volgende versie');
}

function openComments(id) {
  selectedParagraph = id;
  replyParent = null;
  textarea.value = '';
  replyingTo.classList.remove('is-visible');
  document.querySelectorAll('.comment-button').forEach(button => button.setAttribute('aria-expanded', 'false'));
  body.querySelector(`[data-paragraph-id="${id}"] .comment-button`).setAttribute('aria-expanded', 'true');
  quote.textContent = plainText(revisions[revisionIndex].paragraphs[id] || '');
  renderThread();
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  document.getElementById('close-panel').focus();
}

function closeComments() {
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('.comment-button').forEach(button => button.setAttribute('aria-expanded', 'false'));
  selectedParagraph = null;
  replyParent = null;
}

function renderThread() {
  thread.replaceChildren();
  const items = comments.filter(comment => comment.paragraphId === selectedParagraph);
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-comments';
    empty.textContent = 'Nog geen reacties. Je kunt hier als eerste iets naast zetten.';
    thread.append(empty);
    return;
  }
  const roots = items.filter(comment => !comment.parentId);
  for (const root of roots) {
    appendComment(root, false, items.some(comment => comment.parentId === root.id));
    for (const reply of items.filter(comment => comment.parentId === root.id)) appendComment(reply, true, true);
  }
}

function appendComment(comment, isReply, isSet) {
  const article = document.createElement('article');
  article.className = 'comment' + (isReply ? ' is-reply' : '');
  const meta = document.createElement('div');
  meta.className = 'comment-meta';
  const author = document.createElement('span');
  author.textContent = 'anoniem · ' + new Date(comment.createdAt).toLocaleString('nl-NL', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  const state = document.createElement('span');
  state.className = 'state' + (isSet ? ' is-set' : '');
  state.textContent = isSet ? 'vastgezet' : 'staat los';
  meta.append(author, state);
  const text = document.createElement('p');
  text.textContent = comment.text;
  article.append(meta, text);
  if (!isReply) {
    const reply = document.createElement('button');
    reply.type = 'button';
    reply.className = 'reply-action';
    reply.textContent = 'Antwoord';
    reply.addEventListener('click', () => {
      replyParent = comment.id;
      replyingTo.textContent = 'Je antwoordt op: “' + comment.text.slice(0, 62) + (comment.text.length > 62 ? '…' : '') + '”';
      replyingTo.classList.add('is-visible');
      textarea.focus();
    });
    article.append(reply);
  }
  thread.append(article);
}

knob.addEventListener('click', () => setRevision(revisionIndex === revisions.length - 1 ? 0 : revisionIndex + 1));
knob.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); setRevision(Math.max(0, revisionIndex - 1)); }
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); setRevision(Math.min(revisions.length - 1, revisionIndex + 1)); }
});
document.getElementById('close-panel').addEventListener('click', closeComments);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && panel.classList.contains('is-open')) closeComments(); });
form.addEventListener('submit', event => {
  event.preventDefault();
  const text = textarea.value.trim();
  if (!text || !selectedParagraph) return;
  comments.push({id: crypto.randomUUID(), paragraphId: selectedParagraph, parentId: replyParent, text, createdAt: new Date().toISOString()});
  saveComments();
  textarea.value = '';
  replyParent = null;
  replyingTo.classList.remove('is-visible');
  const button = body.querySelector(`[data-paragraph-id="${selectedParagraph}"] .comment-button`);
  button.textContent = commentCount(selectedParagraph);
  renderThread();
});

initialRender();
