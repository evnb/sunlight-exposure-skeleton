<img src="https://raw.githubusercontent.com/evnb/sunlight-exposure-skeleton/refs/heads/main/src/lib/assets/favicon.svg" width="200">

# Sun Exposure Calculator

Calculate sun exposure on a transit trip and find out which side of the bus or train to sit on to avoid the sun.

**Live demo:** https://evnb.github.io/sunlight-exposure-skeleton

## Features

- Enter an origin and destination to get a side-of-vehicle recommendation (left, right, either, or nighttime)
- Preview map showing the route and sun direction at each point along the trip
- Shareable URLs — origin and destination coordinates are saved to the URL automatically

## How it works

The user enters origin and destination, as well as departure and arrival times for the trip. Sun azimuth is calculated using [SunCalc](https://github.com/mourner/suncalc) at the origin, destination, and sometimes intermediate points along the route. (Intermediate points are equidistant based on slerp.) The sun azimuth is compared against the route bearing at each point to determine which side of the vehicle the sun will be coming from. The side that appears most often across the route wins.

Geocoding and reverse geocoding are provided by [Nominatim](https://nominatim.org/) (OpenStreetMap data). Maps are rendered with [MapLibre GL](https://maplibre.org/).

## Stack

- [Svelte 5](https://svelte.dev/) + [SvelteKit 2](https://kit.svelte.dev/) (static adapter)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Skeleton Labs v4](https://www.skeleton.dev/) — sahara dark theme
- [Lucide Svelte](https://lucide.dev/) for icons

## Development

```sh
npm install
npm run dev
npm run build    # production build
npm run preview  # preview production build
npm run check    # type-check
```

## Found Resources

Resources I discovered along the way while working on this project

### Sun Calculation

- [SunCalc](https://github.com/mourner/suncalc) Library by  [Volodymyr Agafonkin](https://agafonkin.com/)
- CosineKitty's [Astronomy](https://github.com/cosinekitty/astronomy) Engine, a library by [Don Cross](http://cosinekitty.com/)
- [suncalc.org](https://www.suncalc.org/) tool by [Torsten Hoffmann](https://www.torsten-hoffmann.de/)
- [suncalc.net](https://suncalc.net/) tool by [Volodymyr Agafonkin](https://agafonkin.com/)

### Geocoding

- [Nominatim](https://nominatim.org/), an Free* and Open Source geocoding service by [Sarah Hoffmann](https://lonvia.de/)
- [Photon](https://photon.komoot.io/), a Free* geocoding service by [Komoot](https://www.komoot.com/)
- [Pelias](https://github.com/pelias/pelias), an Open Source hostable geocoder 
- [List of Free Geocoding Services](https://wiki.openstreetmap.org/wiki/Geocoding#Non-commercial,_ToS_limited) on the Open Street Map Wiki

### Map Rendering

- [Leaflet](https://leafletjs.com/), an open source JS library for interactive maps
- [Open Free Map](https://openfreemap.org/)
- [MapLibre](https://maplibre.org/), a collection of Open Source mapping libraries
  - [Awesome MapLibre](https://github.com/maplibre/awesome-maplibre)

### Icons

- [Iconify.Design](https://iconify.design/), viewer for Open Source icon sets (including emojis)
- [Streamline emojis](https://icon-sets.iconify.design/streamline-emojis/), cute stylized (nonexhausetive) emoji set CC BY 4.0
- [Lucide](https://lucide.dev/), free beautiful and consistent icons

### Resource Lists

- [Awesome](http://awesome.re/) Lists, resource lists about many topics