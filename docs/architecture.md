# Architectuur van de MVP

## Doel

De eerste operationele versie is een read-only AppView over bestaande openbare `app.bsky.feed.post`-records. De applicatie maakt geen eigen Lexicon aan en vraagt gebruikers niet om in te loggen.

## Gegevensstroom

```text
ATProto Relay
    ↓
Tap: alleen app.bsky.feed.post
    ↓
Indexer
    ├── accepteert alleen expliciete nl-taalcodes
    ├── haalt links uit external embeds en rich-text facets
    ├── koppelt antwoorden via root- en parent-URI's
    └── verwerkt create, update en delete
    ↓
Database
    ↓
Read-only API
    ├── GET /api/links
    └── GET /api/links/:id
    ↓
Commonplace-webinterface
```

## Taalregel

Een record is Nederlandstalig wanneer minstens één waarde in `langs` als primaire taalcode `nl` heeft. Er wordt niet naar de tekst, auteur, PDS, bronwebsite of locatie gekeken om taal af te leiden.

Records zonder `langs` worden niet opgenomen, ook wanneer de tekst Nederlands lijkt te zijn.

## Links

De indexer leest links uit:

- `app.bsky.embed.external`;
- `app.bsky.richtext.facet` met een linkfeature.

De eerste normalisatie is bewust beperkt en omkeerbaar:

- hostnaam naar kleine letters;
- standaardpoorten verwijderen;
- fragmenten verwijderen;
- bekende trackingparameters zoals `utm_*` verwijderen;
- overige pad- en querygegevens bewaren.

Elke oorspronkelijke URL blijft bewaard. Handmatige correctie of geavanceerde canonicalisatie hoort niet bij de eerste versie.

## Gesprekken

Een Nederlandstalig antwoord hoeft de link niet te herhalen. De indexer bewaart daarom de `root`- en `parent`-referenties van ieder bericht. Wanneer de root aan een link is gekoppeld, wordt het antwoord op dezelfde linkpagina weergegeven.

Berichten uit verschillende roots worden als afzonderlijke gesprekken getoond. Commonplace doet niet alsof deze berichten rechtstreeks op elkaar antwoorden.

## Verwijderingen en wijzigingen

- Een verwijderd record verdwijnt uit de zichtbare applicatie.
- Een gewijzigd record wordt opnieuw verwerkt.
- Wanneer een account wordt gedeactiveerd, worden de bijbehorende records niet meer getoond.
- De AT-URI en CID worden bewaard om versies en verwijderingen correct te verwerken.

## Niet in de eerste versie

- automatische taaldetectie;
- onderwerp- of standpuntclassificatie;
- automatische samenvattingen;
- gebruikerslogin;
- reageren vanuit Commonplace;
- een eigen Lexicon;
- personalisatie.
