# Commonplace

**Waar mensen over praten.**

Commonplace is een linkgerichte weergave van openbare gesprekken op ATProto. In plaats van afzonderlijke posters centraal te zetten, groepeert Commonplace bestaande berichten en gesprekken rond de link die wordt besproken.

Deze repository bevat:

- een live Nederlandstalig frontendprototype op GitHub Pages;
- een Cloudflare Worker die openbare ATProto Jetstream-berichten filtert;
- lokale aggregatie van links en berichten in de browser;
- het eerste databaseschema voor een latere gedeelde indexer;
- de afgesproken, bewust beperkte regels voor de MVP.

De zichtbare inhoud komt uit echte openbare ATProto-records. Er staat geen fictieve voorbeeldinhoud meer in de gepubliceerde interface.

## Website

De publieke prototypeversie wordt via GitHub Pages gepubliceerd op <https://hackejandro.github.io/commonplace/>. De statische Pages-versie staat in `docs/index.html`.

De gratis live doorgeeflaag draait op Cloudflare Workers. Voor deze fase verwerkt iedere geopende browser een korte terugblik en daarna de live stroom. Eens per 15 minuten haalt de pagina de bijbehorende threads op. Alleen links met minstens één expliciet Nederlandstalig antwoord worden getoond; de rangschikking gebruikt eerst het aantal actieve gespreksthreads en daarna het aantal berichten. Resultaten worden maximaal 24 uur lokaal in die browser bewaard.

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
