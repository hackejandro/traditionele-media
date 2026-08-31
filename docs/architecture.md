# Architectuur van de MVP

## Doel

De eerste operationele versie is een read-only live weergave van bestaande openbare `app.bsky.feed.post`-records. De applicatie maakt geen eigen Lexicon aan en vraagt gebruikers niet om in te loggen.

## Gegevensstroom

```text
ATProto Jetstream
    ↓
Cloudflare Worker: alleen app.bsky.feed.post
    ↓
Live filter
    ├── accepteert alleen expliciete nl-taalcodes
    ├── accepteert alleen berichten met een external embed of linkfacet
    └── stuurt echte records door naar de geopende webpagina
    ↓
Browser
    ├── normaliseert en groepeert links
    ├── bewaart resultaten maximaal 24 uur in localStorage
    └── toont de oorspronkelijke berichten per link
    ↓
GitHub Pages-interface
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

De live MVP toont berichten die de link zelf bevatten. Een Nederlandstalig antwoord hoeft de link niet te herhalen; het volledig ophalen van zulke antwoorden vereist een gedeelde index en hoort daarom bij de volgende implementatiefase.

Berichten uit verschillende roots worden als afzonderlijke gesprekken getoond. Commonplace doet niet alsof deze berichten rechtstreeks op elkaar antwoorden.

## Verwijderingen en wijzigingen

- Een gewijzigd record wordt opnieuw verwerkt wanneer het via de live stroom binnenkomt.
- De browser verwijdert lokaal bewaarde records na maximaal 24 uur.
- Volledige verwerking van verwijderingen en accountstatussen vereist de latere gedeelde index.

## Niet in de eerste versie

- automatische taaldetectie;
- onderwerp- of standpuntclassificatie;
- automatische samenvattingen;
- gebruikerslogin;
- reageren vanuit Commonplace;
- een eigen Lexicon;
- personalisatie;
- een centrale database of blijvende gedeelde historie.
