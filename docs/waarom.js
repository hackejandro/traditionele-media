const revisions = [
  {
    id: 'chatgpt',
    title: 'ChatGPT-versie',
    date: '21 september 2026 · versie 1',
    pageTitle: 'Wat gebeurt er als we sociale media niet rond mensen, maar rond gesprekken ordenen?',
    dek: '',
    paragraphs: {
      c01: 'Ik heb de afgelopen tijd een kleine website gebouwd: traditionele.media. De site verzamelt links die op het Nederlandstalige deel van Bluesky worden gedeeld en kijkt vervolgens hoeveel afzonderlijke mensen rond zo’n link een gesprek beginnen.',
      c02: 'Niet hoeveel volgers iemand heeft. Niet hoe vaak één enthousiast account dezelfde link plaatst. Niet hoeveel seconden mensen boven een bericht blijven hangen. Maar: hoeveel verschillende mensen vonden deze link interessant genoeg om hem te delen, en ontstond daar ook daadwerkelijk interactie omheen?',
      c03: 'Het begon als een vrij eenvoudig experiment. Ik wilde weten wat er op Bluesky werd besproken buiten de kring van mensen die ik zelf volg. Al snel bleek dat dit een verrassend ander beeld van het internet oplevert.',
      c04: 'Zo ontdekte ik Polderprikker, een dagelijks spel waarin je locaties op een kaart van Nederland moet aanwijzen. Ik volgde geen van de mensen die hun resultaten deelden. Toch was duidelijk dat er op dat moment iets gemeenschappelijks gebeurde. Op een andere dag leerde ik door zo’n verzameling gesprekken dat er tonijnenmesterijen bestaan, en waarom die zo problematisch zijn.',
      c05: 'Dat zijn kleine voorbeelden, maar ze lieten me iets groters zien: wat ik interessant vind op sociale media wordt nu voor een groot deel bepaald door wie ik ooit ben gaan volgen, of door wat een aanbevelingsalgoritme denkt dat mijn aandacht vasthoudt. Daartussen ontbreekt een derde mogelijkheid: kijken naar de onderwerpen waar op dat moment op verschillende plekken echte gesprekken omheen ontstaan.',
      c06: '<span class="section-heading">Sociale media zijn steeds minder sociaal</span>',
      c07: 'In de paper <em>Towards a Post-Social Media Studies</em> stellen Petter Törnberg en Richard Rogers dat het begrip ‘sociale media’ steeds minder goed beschrijft wat grote platforms werkelijk zijn geworden.',
      c08: 'De klassieke belofte van sociale media was gebaseerd op drie elementen. Mensen maakten zelf de inhoud, die inhoud verspreidde zich via sociale relaties, en gebruikers reageerden publiekelijk op elkaar. Wie je volgde bepaalde in belangrijke mate wat je zag.',
      c09: 'Die samenhang valt uit elkaar.',
      c10: 'Op TikTok, Instagram, Facebook, YouTube en X wordt de selectie steeds minder bepaald door je sociale netwerk en steeds meer door aanbevelingssystemen. Die systemen kijken niet alleen naar actieve handelingen zoals delen of reageren, maar vooral naar passieve signalen: kijktijd, scrollgedrag, herhaling en de fractie van een seconde waarin iemand aarzelt.',
      c11: 'De gebruiker verandert daarmee, in de woorden van de auteurs, van deelnemer in toeschouwer. Het platform laat niet voornamelijk zien wat de mensen om je heen belangrijk vinden, maar wat het systeem verwacht dat jou zo lang mogelijk laat kijken.',
      c12: 'Generatieve AI versterkt die ontwikkeling. Platforms zijn steeds minder afhankelijk van mensen die zelf iets maken. Teksten, afbeeldingen en video’s kunnen goedkoop en vrijwel onbeperkt worden geproduceerd. Modellen maken de inhoud, algoritmes verspreiden die en mensen leveren vooral nog aandacht.',
      c13: 'Tegelijkertijd verplaatst een deel van het echte sociale verkeer zich juist naar besloten omgevingen: groepsapps, Discordservers, Signal, WhatsApp, nieuwsbrieven en kleine online gemeenschappen. Daar is meer context en vertrouwen, maar wat er wordt besproken is veel minder zichtbaar voor de buitenwereld.',
      c14: 'Het resultaat is een vreemd medialandschap. Publieke platforms worden steeds meer gepersonaliseerde omroepen, terwijl betekenisvolle sociale interactie zich terugtrekt in kleinere, besloten ruimtes.',
      c15: '<span class="section-heading">Wat meten we eigenlijk?</span>',
      c16: 'De meeste ranglijsten op sociale media zijn gebaseerd op volume. Een bericht met veel likes, veel weergaven of veel reacties stijgt naar boven.',
      c17: 'Maar volume is een ambigu signaal.',
      c18: 'Duizend likes kunnen betekenen dat duizend mensen iets belangrijk vinden. Ze kunnen ook betekenen dat één beroemd account een enorm bereik heeft. Tien posts met dezelfde link kunnen wijzen op brede belangstelling, maar ook afkomstig zijn van één account dat de link blijft herhalen. Een lange reactiedraad kan een inhoudelijk gesprek bevatten, maar net zo goed een ruzie tussen twee mensen zijn.',
      c19: 'De keuze voor een meeteenheid bepaalt wat zichtbaar wordt.',
      c20: 'Als je accounts centraal zet, zie je vooral de mensen die je al kent. Als je bereik centraal zet, zie je vooral wie al groot is. Als je kijktijd centraal zet, zie je wat moeilijk te negeren is. En als je simpelweg alle berichten telt, kunnen de luidste en meest actieve accounts de uitkomst domineren.',
      c21: 'Daarom probeer ik op traditionele.media een ander signaal uit: afzonderlijke gespreksstarters rond dezelfde link.',
      c22: 'De link is daarbij het gedeelde object. Mensen hoeven elkaar niet te volgen, niet tot dezelfde gemeenschap te behoren en het ook niet met elkaar eens te zijn. Wat ze delen is dat ze onafhankelijk van elkaar naar hetzelfde stuk van het web wijzen en daar reacties omheen ontstaan.',
      c23: 'Eén account telt per link maximaal één keer mee. Tien keer dezelfde link plaatsen maakt een verhaal dus niet tien keer belangrijker. Pas wanneer verschillende accounts de link oppakken, wordt het een sterker signaal.',
      c24: 'Dat is geen perfecte maat voor kwaliteit, waarheid of maatschappelijk belang. Het is wel een andere manier om verspreide publieke aandacht zichtbaar te maken.',
      c25: '<span class="section-heading">Van sociale grafiek naar gedeeld object</span>',
      c26: 'De paper beschrijft hoe we voor het bestuderen van hedendaagse platforms misschien minder naar vaste netwerken en meer naar stromen moeten kijken: hoe inhoud opkomt, zich verspreidt, verschillende publieken bereikt en weer verdwijnt.',
      c27: 'Traditionele.media is daar een klein, praktisch experiment mee.',
      c28: 'In plaats van te beginnen bij een persoon en diens netwerk, begint de site bij een link. Daaromheen worden berichten en reacties gegroepeerd. Het resultaat is geen persoonlijke tijdlijn, maar een tijdelijk overzicht van gedeelde aandacht.',
      c29: 'Dat verandert ook wat je kunt ontdekken.',
      c30: 'Een persoonlijke tijdlijn herhaalt in zekere zin je eerdere keuzes. Je ziet de mensen die je ooit bent gaan volgen, plus wat een algoritme daaruit over jou heeft afgeleid. Een overzicht op basis van afzonderlijke gesprekken kan juist iets tonen dat buiten je bestaande kring valt.',
      c31: 'Niet omdat het ‘voor jou’ is geselecteerd, maar omdat meerdere andere mensen er kennelijk iets in zagen.',
      c32: 'Dat verschil vind ik belangrijk. Personalisatie belooft relevantie, maar maakt het steeds moeilijker om te weten wat anderen zien. Iedereen krijgt een eigen informatiestroom. We delen hetzelfde platform, maar niet noodzakelijk dezelfde werkelijkheid.',
      c33: 'Links kunnen in zo’n omgeving fungeren als kleine gemeenschappelijke ankerpunten. Rond een link kunnen mensen elkaar tegenspreken, aanvullen of op verschillende manieren betekenis geven aan hetzelfde bronmateriaal. Er blijft iets achter waarnaar anderen kunnen terugkeren.',
      c34: 'Juist in een medialandschap van geïndividualiseerde feeds en privégesprekken is zo’n gedeeld object waardevol.',
      c35: '<span class="section-heading">Geen objectieve populariteitsmeter</span>',
      c36: 'Er zijn voldoende beperkingen.',
      c37: 'De site ziet alleen openbare Nederlandstalige berichten op Bluesky. Besloten gesprekken blijven buiten beeld. Niet ieder gesprek bevat een link. Een link kan verschillende URL’s of doorverwijzingen hebben, waardoor dezelfde pagina niet altijd direct als hetzelfde object wordt herkend. Reacties zeggen bovendien niets automatisch over de kwaliteit van een gesprek.',
      c38: 'Ook ‘afzonderlijke gesprekken’ blijft een ontworpen categorie. Ik heb besloten dat herhaling door hetzelfde account niet opnieuw meetelt, dat er meerdere mensen betrokken moeten zijn en dat dagelijkse spelletjes zoals Polderprikker niet thuishoren in een journalistiek weekoverzicht. Andere keuzes zouden andere resultaten opleveren.',
      c39: 'Dat is geen fout in het systeem, maar precies het punt: iedere tijdlijn en iedere ranglijst bevat zulke keuzes. Bij grote platforms zijn ze alleen grotendeels onzichtbaar en gericht op commerciële doelen zoals kijktijd en terugkeer.',
      c40: 'Traditionele.media maakt geen aanspraak op objectiviteit. Het stelt een ontwerpvraag:',
      c41: '<strong class="pullquote">Wat wordt zichtbaar wanneer we onafhankelijke belangstelling en gesprek zwaarder wegen dan bereik, herhaling en voorspelde aandacht?</strong>',
      c42: '<span class="section-heading">Sociale signalen kunnen anders</span>',
      c43: 'We praten vaak over de problemen van sociale media alsof ze uitsluitend voortkomen uit slechte inhoud of slecht gedrag. Maar ook de ordening zelf doet ertoe.',
      c44: 'Een systeem dat bereik beloont, produceert beroemdheden.<br>Een systeem dat kijktijd beloont, produceert onweerstaanbare inhoud.<br>Een systeem dat herhaling telt, beloont volharding en automatisering.<br>Een systeem dat sociale relaties centraal zet, houdt ons binnen bekende kringen.',
      c45: 'Een systeem dat kijkt naar afzonderlijke gesprekken rond gedeelde bronnen zou iets anders kunnen belonen: onderwerpen die op meerdere plekken tegelijk nieuwsgierigheid, discussie of betrokkenheid oproepen.',
      c46: 'Dat lost de problemen van sociale media niet op. Het voorkomt geen desinformatie, garandeert geen nuance en vervangt geen journalistieke afweging. Maar het maakt wel duidelijk dat de bekende tijdlijn niet de enige mogelijke interface voor het publieke internet is.',
      c47: 'Misschien is de interessantste vraag daarom niet hoe we de huidige sociale media kunnen repareren.',
      c48: 'Misschien moeten we opnieuw beginnen bij wat we zichtbaar willen maken — en vervolgens bepalen welke signalen daarbij horen.',
      c49: 'Traditionele.media is mijn eerste, onvolmaakte poging om die vraag tastbaar te maken.'
    }
  },
  {
    id: 'current',
    title: 'Eerste volledige versie',
    date: '21 september 2026 · versie 2',
    pageTitle: 'Waarom ik deze website heb gemaakt (een eerlijk verhaal)',
    dek: 'Ik ga deze tekst mogelijk vaak updaten om minder dom te lijken, maar je kan alle versies terugkijken.',
    paragraphs: {
      p01: '<em>Uit pure luiheid vroeg ik ChatGPT om een artikel te schrijven over waarom ik deze site bouwde, maar de kwaliteit van schrijven was zo belabberd dat ik het zelf maar moet doen.</em>',
      p02: 'Ik zou hier kunnen beginnen met een groots altruïstisch statement: ik bouwde deze site omdat ik me zorgen maak over een samenleving met gebrek aan gedeelde ervaring en realiteit.',
      p03: 'Of omdat het in het huidige gefragmenteerde en gepolariseerde medialandschap zo moeilijk is om bij te blijven met relevante gebeurtenissen en ontwikkelingen omdat alles als even belangrijk gepresenteerd wordt.',
      p04: 'Of dat social media stuk is, dat je én niet meer de bronnen en mensen ziet die je volgt, én dat het volume van content te groot is geworden, én dat personalisatie van aanbod door algoritmes ervoor zorgt dat je alleen nog maar ‘nieuwe’ dingen ziet binnen een beperkt kader van passieve signalen (‘oh vond je die video van een eend een beetje leuk, hier zijn oneindig veel videos van eenden!’).',
      p05: 'En áls je dan nieuws ziet, is het meestal opinie van een columnist met heel veel volgers die vrijwel allemaal één recept volgen: de verontwaardigingsmachine aanzwengelen. Zonder het eens of oneens te zijn over de inhoud (echt geen zin in online discussies): of dat nou Sander Schimmelpenninck is die het feminismeknopje ontdekt heeft, Wierd Duk die wat dan ook doet, of Sheila Sitalsing die signaleert hoe de rechterflank van de politiek eigenlijk allemaal onguur is, de functie is hetzelfde – mensen zijn boos op wat ze schrijven, of over wat ze schrijven.',
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
const articleTitle = document.getElementById('article-title');
const articleDek = document.getElementById('article-dek');
const panel = document.getElementById('comment-panel');
const thread = document.getElementById('comment-thread');
const quote = document.getElementById('selected-quote');
const form = document.getElementById('comment-form');
const textarea = document.getElementById('comment-text');
const replyingTo = document.getElementById('replying-to');
let revisionIndex = revisions.length - 1;
let selectedParagraph = null;
let replyParent = null;
let revisionRenderToken = 0;
let comments = loadComments();

function loadComments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').map(comment => ({
      ...comment,
      revisionId: comment.revisionId || (comment.revisionIndex === 0 ? 'first-draft' : 'current')
    }));
  }
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
  return comments.filter(comment => comment.paragraphId === id && comment.revisionId === revisions[revisionIndex].id).length;
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
  articleTitle.textContent = current.pageTitle;
  articleDek.textContent = current.dek;
  articleDek.hidden = !current.dek;
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
  const renderToken = ++revisionRenderToken;
  const previous = revisions[revisionIndex];
  const next = revisions[nextIndex];
  revisionIndex = nextIndex;
  articleTitle.textContent = next.pageTitle;
  articleDek.textContent = next.dek;
  articleDek.hidden = !next.dek;
  for (const id of allParagraphIds()) {
    const p = body.querySelector(`[data-paragraph-id="${id}"]`);
    const text = p.querySelector('.paragraph-text');
    const before = previous.paragraphs[id] || '';
    const after = next.paragraphs[id] || '';
    if (before === after) continue;
    p.classList.add('is-changing');
    window.setTimeout(() => {
      if (renderToken !== revisionRenderToken) return;
      text.innerHTML = after;
      p.classList.toggle('is-absent', !after);
      p.classList.toggle('is-new', Boolean(after) && !before);
      p.classList.remove('is-changing');
      if (after && !before) window.setTimeout(() => {
        if (renderToken === revisionRenderToken) p.classList.remove('is-new');
      }, 1100);
    }, 180);
  }
  updateRevisionControls();
  updateCommentCounts();
  if (selectedParagraph) {
    const selectedHtml = next.paragraphs[selectedParagraph];
    if (selectedHtml) {
      quote.textContent = plainText(selectedHtml);
      replyParent = null;
      replyingTo.classList.remove('is-visible');
      renderThread();
    }
    else closeComments();
  }
}

function updateCommentCounts() {
  for (const id of allParagraphIds()) {
    const button = body.querySelector(`[data-paragraph-id="${id}"] .comment-button`);
    const count = commentCount(id);
    button.textContent = count || '+';
  }
}

function updateRevisionControls() {
  const revision = revisions[revisionIndex];
  document.getElementById('version-title').textContent = revision.title;
  document.getElementById('version-date').textContent = revision.date;
  knob.style.setProperty('--angle', `${-45 + (revisionIndex * 90)}deg`);
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
  const items = comments.filter(comment => comment.paragraphId === selectedParagraph && comment.revisionId === revisions[revisionIndex].id);
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-comments';
    empty.textContent = 'Nog geen reacties. Je kunt hier als eerste iets naast zetten.';
    thread.append(empty);
    return;
  }
  const roots = items.filter(comment => !comment.parentId);
  for (const root of roots) {
    appendComment(root, false);
    for (const reply of items.filter(comment => comment.parentId === root.id)) appendComment(reply, true);
  }
}

function appendComment(comment, isReply) {
  const article = document.createElement('article');
  article.className = 'comment' + (isReply ? ' is-reply' : '');
  const meta = document.createElement('div');
  meta.className = 'comment-meta';
  const author = document.createElement('span');
  author.textContent = 'anoniem · ' + new Date(comment.createdAt).toLocaleString('nl-NL', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  meta.append(author);
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
  comments.push({id: crypto.randomUUID(), paragraphId: selectedParagraph, revisionId: revisions[revisionIndex].id, parentId: replyParent, text, createdAt: new Date().toISOString()});
  saveComments();
  textarea.value = '';
  replyParent = null;
  replyingTo.classList.remove('is-visible');
  const button = body.querySelector(`[data-paragraph-id="${selectedParagraph}"] .comment-button`);
  button.textContent = commentCount(selectedParagraph);
  renderThread();
});

initialRender();
