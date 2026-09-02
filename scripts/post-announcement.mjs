const HANDLE = 'traditionelemedia.eurosky.social';
const PDS = 'https://eurosky.social';
const URL = 'https://traditionele.media/';
const TEXT = `traditionele.media is een site om te experimenteren met media.

Nu: Wat als sociale media draait om gesprekken rond nieuws in plaats van discussies onder posts?

Maximaal 8 keer per dag een link waar mensen op ATProto over praten — met de verschillende gesprekken erbij.

${URL}`;

const password = process.env.EUROSKY_APP_PASSWORD;
if (!password) throw new Error('EUROSKY_APP_PASSWORD is missing');

async function request(path, body, accessJwt) {
  const response = await fetch(`${PDS}/xrpc/${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(accessJwt ? { authorization: `Bearer ${accessJwt}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${path} failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
  return response.json();
}

const session = await request('com.atproto.server.createSession', { identifier: HANDLE, password });
const characterStart = TEXT.indexOf(URL);
const byteStart = Buffer.byteLength(TEXT.slice(0, characterStart), 'utf8');
const result = await request('com.atproto.repo.createRecord', {
  repo: session.did,
  collection: 'app.bsky.feed.post',
  record: {
    $type: 'app.bsky.feed.post',
    text: TEXT,
    facets: [{
      index: { byteStart, byteEnd: byteStart + Buffer.byteLength(URL, 'utf8') },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri: URL }],
    }],
    langs: ['nl'],
    createdAt: new Date().toISOString(),
  },
}, session.accessJwt);

console.log(JSON.stringify({ event: 'announcement_posted', uri: result.uri, cid: result.cid }));
