# Commonplace

**Waar mensen over praten.**

Commonplace is een linkgerichte weergave van openbare gesprekken op ATProto. In plaats van afzonderlijke posters centraal te zetten, groepeert Commonplace bestaande berichten en gesprekken rond de link die wordt besproken.

Deze repository bevat:

- een live Nederlandstalig frontendprototype op GitHub Pages;
- een Cloudflare Worker die openbare ATProto Jetstream-berichten filtert;
- centrale aggregatie van links en berichten in Cloudflare;
- SQLite-opslag in een Durable Object en een gedeelde KV-snapshot;
- de afgesproken, bewust beperkte regels voor de MVP.

De zichtbare inhoud komt uit echte openbare ATProto-records. Er staat geen fictieve voorbeeldinhoud meer in de gepubliceerde interface.

## Website

De publieke prototypeversie wordt via GitHub Pages gepubliceerd op <https://hackejandro.github.io/commonplace/>. De statische Pages-versie staat in `docs/index.html`.

De gratis aggregatielaag draait op Cloudflare Workers. Iedere vijftien minuten haalt een geplande gewone Worker de Jetstream-achterstand op en stuurt alleen relevante Nederlandstalige records in één bundel naar een Durable Object met SQLite-opslag. Zo tellen wereldwijde, irrelevante Jetstream-berichten niet langer afzonderlijk mee voor de Durable Objects-limiet. Als een startbericht geen taalveld heeft, kan een expliciet Nederlandstalig antwoord het bovenliggende linkgesprek alsnog toelaten; er wordt nog steeds geen taal automatisch herkend. Bluesky-redirects en directe artikel-URL's worden samengevoegd. Na iedere verzamelronde wordt één gedeelde KV-momentopname gemaakt. Een link wordt alleen opgenomen wanneer minstens twee verschillende accounts erover posten of reageren. Daarna blijft de kaart 24 uur zichtbaar en worden nieuwe gesprekken en antwoorden toegevoegd. De homepage toont maximaal twintig linkkaarten; er is geen aparte limiet op het aantal berichten binnen die kaarten. Websitebezoeken lezen uitsluitend de gedeelde KV-snapshot en roepen de Durable Object niet aan.

## MVP-regels

Commonplace verwerkt voor de eerste versie uitsluitend bestaande `app.bsky.feed.post`-records.

Een bericht wordt alleen opgenomen wanneer:

1. het record expliciet een Nederlandse taalcode bevat in `langs` (`nl`, `nl-NL`, `nl-BE`, enzovoort);
2. het bericht een link bevat, of een antwoord is binnen een gesprek dat al aan een link is gekoppeld.

Commonplace gebruikt geen automatische taaldetectie, standpuntclassificatie, onderwerpherkenning of samenvattingen.

## Lokaal starten

Vereisten:

- Node.js 22.13 of nieuwer
- npm

```bash
npm install
npm run dev
```

Open daarna `http://localhost:3000`.

## Controle

```bash
npm run build
npm run lint
npm run worker:check
```

## Worker publiceren

```bash
npm run worker:deploy
```

De Worker gebruikt geen betaalde diensten, API-sleutels of automatische taaldetectie.

## Architectuur

Zie [docs/architecture.md](docs/architecture.md) voor de beoogde gegevensstroom en [database/schema.sql](database/schema.sql) voor het eerste opslagschema.

## Bijdragen

Issues, voorstellen en forks zijn welkom. Houd nieuwe functionaliteit klein, controleerbaar en trouw aan het uitgangspunt dat links en gesprekken centraal staan.

## Licentie

De software in deze repository valt onder de [MIT-licentie](LICENSE). Die licentie is alleen van toepassing op de code in deze repository, niet op externe pagina’s of ATProto-records waarnaar de software verwijst.
