const HANDLE = 'traditionelemedia.eurosky.social';
const PDS = 'https://eurosky.social';
const password = process.env.EUROSKY_APP_PASSWORD;

if (!password) throw new Error('EUROSKY_APP_PASSWORD is missing');

const response = await fetch(`${PDS}/xrpc/com.atproto.server.createSession`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ identifier: HANDLE, password }),
});

if (!response.ok) {
  throw new Error(`Eurosky login failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
}

const session = await response.json();
console.log(JSON.stringify({ event: 'bot_login_ok', handle: session.handle, did: session.did }));
