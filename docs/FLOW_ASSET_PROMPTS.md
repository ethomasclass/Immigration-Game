# Flow Asset Prompts: Everything Besides Characters

Character prompts are in [CHARACTER_ART_PROMPTS.md](CHARACTER_ART_PROMPTS.md). This file covers the other art you can generate in Google Flow and drop into the game. Every item is optional: the game draws a placeholder until a file with the right name appears in `assets/art/`.

Use the same look everywhere so the world matches your characters. Paste this first:

```
Hand-inked illustration in an Art Nouveau tarot-card art style: confident black linework with varied line weight, flat cel-shaded color with soft watercolor texture and subtle paper grain. Muted vintage palette: ochre gold, deep teal, brick red, olive, warm cream, sepia browns, ink black. New York City, 1888, historically accurate. No modern objects, no cars, no electric signs, no text unless requested.
```

## 1. Wraparound skylines (biggest single upgrade)

The game wraps one wide picture around the whole horizon of each outdoor zone. It mirrors the picture so the ends always join, which means **you do not need a seamless panorama**. One ordinary landscape image works.

- **Size:** Landscape 16:9, about 2048 × 1152. Save as JPG, under 600 KB.
- **Composition rule:** the horizon line must sit **about one third up from the bottom** (30%). Sky fills the top two thirds. Keep tall things (towers, masts) away from the left and right edges, because the edges get mirrored.
- **No foreground:** nothing close to the viewer. Distant shapes only.

| File | Zone | Add after the style block |
|---|---|---|
| `skyline_castle.jpg` | Castle Garden | Wide distant view across New York Harbor on a hazy morning in 1888: calm gray-green water filling the bottom third, low distant shorelines of New Jersey and Brooklyn, a few sailing ships and steamships with smoke far away, pale cream sky with soft clouds. Horizon one third up from the bottom. No statue, no foreground, no people. |
| `skyline_les.jpg` | Lower East Side | Distant rooftops of Lower Manhattan tenements at dusk in 1888, seen across the roofs: brick chimneys with coal smoke, wooden rooftop water tanks, church steeples, laundry lines, a purple and rose evening sky. The bottom third is a dark band of flat rooftops. Horizon one third up from the bottom. No foreground, no people. |
| `skyline_city.jpg` | Park Row and the rooftop | Distant skyline of Lower Manhattan in 1888 on a bright day: low five-story brick buildings, many church spires, Trinity Church spire tallest, ship masts along the rivers, coal smoke, pale blue sky with thin clouds. The bottom third is a hazy band of rooftops. Horizon one third up from the bottom. No foreground, no tall modern skyscrapers. |
| `skyline_park.jpg` | Central Park | Distant tree line around Central Park in 1888 in early autumn: elms and oaks turning gold, a few mansard-roofed buildings and church spires beyond the trees, soft blue sky. The bottom third is green lawn. Horizon one third up from the bottom. No foreground, no people. |

## 2. Shop signs

Each painted signboard has a stable file name. Save your sign art with that name and it replaces the placeholder lettering.

- **Size:** very wide, about 8:1 (for example 1024 × 128). PNG or JPG.
- **Names:** `sign_hester_north_01` … `_13`, `sign_hester_south_01` … `_13`, `sign_bowery_east_01` … `_10`, `sign_bowery_west_01` … `_10`, `sign_pell_01` … `_03`, `sign_saloon_01`, `sign_lee_shop`.
- To see which sign is which, change its text in `js/zones/les.js` (the `SIGNS` list) or just try one and look.

Prompt pattern:

```
A hand-painted wooden shop signboard from 1888 New York, viewed straight on, filling the whole image, very wide and short. Dark green board with gold-leaf serif lettering that reads "KOSHER BUTCHER" with smaller Yiddish lettering in Hebrew script beside it. Slightly weathered paint. No wall, no background.
```

Swap the text and colors: `BÄCKEREI · BAKERY` (German), `DRY GOODS`, `LODGING 15¢`, `OYSTERS`, `TEAS` with Chinese characters, and so on. Image models often misspell lettering, so check each sign, or add the lettering yourself in Canva on top of a blank generated board.

## 3. Storefronts and building fronts

| File | What | Size | Prompt idea |
|---|---|---|---|
| `facade_tenement_0` … `_5` | One 25-ft tenement front, sidewalk to cornice | 512 × 1024 | A flat, straight-on elevation drawing of a five-story 1880s New York tenement: red brick, brownstone lintels, four windows per floor, iron fire escape, shop on the ground floor, pressed-metal cornice. No perspective, no sky, fills the whole image. |
| `storefront_saloon`, `storefront_moishe_w`, `storefront_moishe_e`, `storefront_lee_south` | Ground-floor shop only | 768 × 640 | Straight-on view of an 1888 shopfront with a large glass window, a door on the right, and a signboard above. Goods displayed in the window. |
| `facade_eldridge_synagogue` | Eldridge Street Synagogue (1887) | 768 × 1024 | Straight-on elevation of a Moorish Revival synagogue front: cream brick and terra cotta, large rose window, three arched doors, two towers. |
| `facade_transfiguration` | Church of the Transfiguration | 768 × 896 | Straight-on elevation of a small Georgian fieldstone church with arched windows and a wooden door. |
| `facade_neighborhood_guild` | The Guild's house | 768 × 640 | Straight-on view of a modest brick rowhouse door and windows with a painted sign "THE NEIGHBORHOOD GUILD". |
| `awning_0` … `_2` | Striped canvas awnings | 256 × 128 | Flat striped canvas texture, red and cream. |

## 4. Election banners and posters

| File | Size | Text |
|---|---|---|
| `banner_grant` | 1024 × 224 | FOR MAYOR · HUGH J. GRANT · REGULAR DEMOCRATIC NOMINEE · TAMMANY HALL |
| `banner_erhardt` | 1024 × 224 | FOR MAYOR · JOEL B. ERHARDT · REPUBLICAN TICKET |
| `banner_hewitt` | 1024 × 224 | RE-ELECT MAYOR HEWITT · CITIZENS' TICKET |
| `poster_grant` | 640 × 896 | A campaign poster with an engraved portrait and "FOR MAYOR". |
| `poster_steamship`, `handbill_nativist`, `newspaper_1888` | 640 × 896 | See the document text in `js/data/dialogue.js`. |

Prompt pattern: `A cloth political campaign banner from 1888 hung flat, viewed straight on, cream canvas with red and blue borders, bold black serif lettering that reads "...". Slight wrinkles. Fills the whole image, no background.`

## 5. Title cards (true tarot cards)

Here the card frame is welcome. Each chapter opens with a card, and the game shows your art above the text.

- **Files:** `card_intro`, `card_ship`, `card_castle`, `card_les`, `card_city` (PNG, portrait, about 768 × 1152).
- **Optional motion:** animate the card in Flow (Veo) and save a short looping clip as `assets/video/card_<name>.mp4`. It plays muted in place of the still image.

```
A full tarot card in ornate Art Nouveau style with a gold decorative border, Roman numeral "I" at the top and the title "THE CROSSING" on a banner at the bottom. Scene: a steamship crossing a dark Atlantic at night, steerage passengers crowded at the rail under a lantern, a single star overhead.
```

Ideas for the others: **II. CASTLE GARDEN** (a round fortress at the water's edge, a family at its door, a copper-brown statue far off in the harbor), **III. THE LOWER EAST SIDE** (a crowded street of pushcarts under laundry lines and an elevated train), **IV. THE CITY** (a clock tower and a bridge with pointed arches, a man in a top hat holding the city in his hands), and the intro card **THE ASSIGNMENT** (a box camera on a tripod with a letter and a steamship ticket).

## 6. Document illustrations

When a student reads a document, an image named `doc_<key>.png` (about 800 × 600) appears above the text. Good candidates: `doc_letter` (a handwritten letter with an address), `doc_poster`, `doc_newspaper`, `doc_handbill`, `doc_banner`, `doc_club`, `doc_rooftop`. For `doc_nast` use a scan of the real 1871 cartoon (public domain).

## 7. Animated characters (Veo)

Covered in [ART_GUIDE.md](ART_GUIDE.md#optional-animated-characters-with-flow-veo). Best candidates: Rivka, Moishe, Plunkitt, the newsboy, and the background walkers `portrait_crowd0` … `7`, `portrait_child0`, `portrait_lamplighter`, `portrait_worker0`, `portrait_worker1`.

## 8. Sound (ElevenLabs, not Flow)

Looping background sound per zone: `assets/audio/amb_ship.mp3`, `amb_castle.mp3`, `amb_les.mp3`, `amb_city.mp3`. For the Lower East Side, try "busy 1880s street market, peddlers calling in Yiddish and Italian, horse hooves on stone, an elevated steam train passing overhead."
