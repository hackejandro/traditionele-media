# Architectuur van de MVP

## Doel

De eerste operationele versie is een read-only live weergave van bestaande openbare `app.bsky.feed.post`-records. De applicatie maakt geen eigen Lexicon aan en vraagt gebruikers niet om in te loggen.

## Gegevensstroom

```text
ATProto Jetstream
    ↓
Geplande Cloudflare Worker (iedere 15 minuten)
    ↓
Inhaalslag vanaf opgeslagen Jetstream-cursor
    ├── accepteert alleen expliciete nl-taalcodes
    ├── accepteert alleen berichten met een external embed of linkfacet
    └── verstuurt relevante records in één bundel
    ↓
Durable Object met SQLite
    ├── normaliseert en groepeert links
    ├── haalt de bijbehorende threads op
    ├── telt uitsluitend antwoorden met een expliciete nl-taalcode
    ├── verbergt links zonder bijdragen van minstens twee accounts
    ├── sorteert op actieve gespreksthreads en daarna berichten
    └── bewaart resultaten maximaal 24 uur
    ↓
Gedeelde KV-snapshot
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

De live MVP vindt eerst Nederlandstalige berichten die de link zelf bevatten. Via `app.bsky.feed.getPostThread` worden de antwoorden opgehaald. Een antwoord telt alleen mee wanneer zijn eigen record een expliciete Nederlandse taalcode bevat. Een link verschijnt pas wanneer minstens één van zijn threads zo'n antwoord bevat.

De feed sorteert eerst op het aantal afzonderlijke roots met een Nederlandstalig antwoord en daarna op het totale aantal Nederlandstalige berichten binnen die actieve threads.

Berichten uit verschillende roots worden als afzonderlijke gesprekken getoond. Commonplace doet niet alsof deze berichten rechtstreeks op elkaar antwoorden.

## Verwijderingen en wijzigingen

- Een gewijzigd record wordt opnieuw verwerkt wanneer het via de live stroom binnenkomt.
- De centrale index verwijdert records en kaarten na maximaal 24 uur.
- Volledige verwerking van verwijderingen en accountstatussen vereist de latere gedeelde index.

## Niet in de eerste versie

- automatische taaldetectie;
- onderwerp- of standpuntclassificatie;
- automatische samenvattingen;
- gebruikerslogin;
- reageren vanuit Commonplace;
- een eigen Lexicon;
- personalisatie;
- blijvende historie ouder dan 24 uur.
