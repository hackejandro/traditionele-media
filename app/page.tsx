'use client';

import { useState } from 'react';

type Conversation = { initials: string; name: string; handle: string; time: string; text: string; replies: number; client: string };
type LinkItem = { id: string; domain: string; title: string; description: string; messages: number; conversations: Conversation[] };

const links: LinkItem[] = [
  {
    id: 'ai-beslissingen', domain: 'aeon.co',
    title: 'Wat gebeurt er als AI onderdeel wordt van alledaagse beslissingen?',
    description: 'Een essay over expertise, delegeren en de kleine keuzes die in geautomatiseerde systemen besloten liggen.',
    messages: 84,
    conversations: [
      { initials: 'NV', name: 'Noor van Dijk', handle: '@noor.bsky.social', time: '2 u', text: 'Dit stuk verwoordt goed hoeveel kleine beslissingen we ongemerkt aan systemen overlaten.', replies: 31, client: 'Bluesky' },
      { initials: 'YA', name: 'Yassine Amrani', handle: '@yassine.eu', time: '4 u', text: 'Maakt het artikel genoeg onderscheid tussen adviseren, aanbevelen en beslissen?', replies: 28, client: 'mu' },
      { initials: 'EV', name: 'Eva Vermeer', handle: '@eva.example', time: 'gisteren', text: 'Is het delegeren van beslissingen aan hulpmiddelen eigenlijk wel zo nieuw?', replies: 17, client: 'Bluesky' },
    ],
  },
  {
    id: 'parkeernormen', domain: 'citylab.com',
    title: 'De verrassende effecten van het schrappen van parkeernormen',
    description: 'Nieuwe gegevens uit vier steden laten een ingewikkelder beeld zien dan verwacht.',
    messages: 51,
    conversations: [
      { initials: 'MB', name: 'Mo Bakker', handle: '@mobakker.nl', time: '3 u', text: 'Rotterdam laat goed zien wat er gebeurt als parkeerplaatsen niet langer het uitgangspunt zijn.', replies: 19, client: 'Bluesky' },
      { initials: 'ID', name: 'Iris de Jong', handle: '@iris.eu', time: '6 u', text: 'Benieuwd of de extra woningen ook echt betaalbaar zijn gebleven.', replies: 14, client: 'mu' },
      { initials: 'DS', name: 'Daniël Smit', handle: '@danielsmit.nl', time: 'gisteren', text: 'Deze vergelijking mist volgens mij de verschillen tussen stadsdelen.', replies: 8, client: 'Bluesky' },
    ],
  },
  {
    id: 'lokale-journalistiek', domain: 'reuters.com',
    title: 'Een nieuw model voor de financiering van lokale journalistiek',
    description: 'Coöperaties, publieke subsidies en abonnementen worden op nieuwe manieren gecombineerd.',
    messages: 33,
    conversations: [
      { initials: 'LK', name: 'Lieke Kramer', handle: '@liekekramer.nl', time: '5 u', text: 'Dit lijkt op het model waarmee enkele Nederlandse lokale redacties nu experimenteren.', replies: 12, client: 'Bluesky' },
      { initials: 'SB', name: 'Sem Bos', handle: '@sembos.eu', time: '8 u', text: 'Hoe voorkom je dat publieke financiering invloed krijgt op redactionele keuzes?', replies: 9, client: 'mu' },
      { initials: 'FE', name: 'Fatima El Idrissi', handle: '@fatima.example', time: 'gisteren', text: 'Het coöperatieve deel vind ik interessanter dan het abonnementsmodel.', replies: 7, client: 'Bluesky' },
    ],
  },
];

export default function Home() {
  const [selected, setSelected] = useState<LinkItem | null>(null);

  return (
    <main className="site-shell">
      <header className="site-header">
        <button className="brand" onClick={() => setSelected(null)} aria-label="Naar de linkfeed">
          <span className="brand-mark" aria-hidden="true" /><span>Commonplace</span>
        </button>
        <p>Waar mensen over praten.</p>
      </header>

      {!selected ? (
        <section className="feed" aria-labelledby="feed-title">
          <div className="feed-intro">
            <h1 id="feed-title">Vandaag besproken</h1>
            <p>Links gedeeld in Nederlandstalige ATProto-berichten.</p>
          </div>
          <div className="link-list">
            {links.map((link) => (
              <button className="link-card" key={link.id} onClick={() => setSelected(link)} aria-label={`Open gesprekken over ${link.title}`}>
                <span className="domain">{link.domain}</span>
                <strong>{link.title}</strong>
                <span className="description">{link.description}</span>
                <span className="card-meta">
                  <span>{link.messages} berichten</span><span>{link.conversations.length} gesprekken</span><span className="open-label">Open →</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="detail" aria-labelledby="detail-title">
          <button className="back-button" onClick={() => setSelected(null)}>← Terug naar de links</button>
          <article className="article-card">
            <div className="article-copy">
              <span className="domain">{selected.domain}</span>
              <h1 id="detail-title">{selected.title}</h1>
              <p>{selected.description}</p>
            </div>
            <button className="article-button">Lees artikel ↗</button>
            <div className="article-meta"><span>{selected.messages} berichten</span><span>{selected.conversations.length} afzonderlijke gesprekken</span></div>
          </article>
          <p className="language-note">Alleen berichten die door de publicerende app expliciet als Nederlands zijn gemarkeerd. Commonplace bepaalt de taal niet zelf.</p>
          <div className="conversation-list">
            <h2>Gesprekken over deze link</h2>
            {selected.conversations.map((conversation) => (
              <article className="conversation" key={conversation.handle}>
                <div className="conversation-author">
                  <span className="avatar" aria-hidden="true">{conversation.initials}</span>
                  <div><strong>{conversation.name}</strong><span>{conversation.handle} · {conversation.time}</span></div>
                </div>
                <p>{conversation.text}</p>
                <div className="conversation-meta">
                  <span>{conversation.replies} berichten</span><span>op {conversation.client}</span><button>Bekijk gesprek ↗</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
