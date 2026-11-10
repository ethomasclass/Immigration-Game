# Art Guide: Adding Your Tarot-Style Illustrations

The game looks for your art by **file name**. Save a file with the right name into **`assets/art/`** (PNG or JPG) and refresh. The game swaps it in automatically, and nothing else needs editing. Until then it draws a placeholder.

> Tip: in the browser console (Ctrl+Shift+J), `listArtKeys()` prints every art name used by the zones you've loaded.

## 1. Characters (2D cutouts)

Characters are **flat 2D illustrations standing in the 3D world**, like a paper theater. They always turn to face the player, and each one has its own idle and talking animation, set in `js/data/characters.js`.

| File | What it is | Size |
|---|---|---|
| `portrait_<id>.png` | **Required.** The full-body figure on a **transparent background**, feet at the bottom edge. Used in the world *and* in the dialogue box. | about 600 × 1200 px (1:2), under 400 KB |
| `anim_<id>.png` | **Optional.** A sprite strip: animation frames side by side in one row, all the same size, e.g. 8 frames × 300 px wide = 2400 × 600. It replaces the still figure and loops (faster while the character talks). | frames set by `anim.frames` in characters.js (default 8) |

### Making the art
- Prompts for every character are in **[CHARACTER_ART_PROMPTS.md](CHARACTER_ART_PROMPTS.md)** (Google Flow).
- Remove the background, crop tight around the figure (feet touching the bottom), and save as PNG.

### Optional: animated characters with Flow (Veo)
1. In Flow, use the finished portrait as the **starting frame** of a short video, with a prompt like *"subtle idle animation, the figure breathes and shifts weight, plain background, camera locked"* (2–4 s).
2. Turn the video into a strip of 8 frames. For example, with ffmpeg:
   `ffmpeg -i rivka.mp4 -vf "fps=4,scale=300:-1,tile=8x1" anim_rivka.png`
3. Remove the background from the strip (or generate on a flat green background and key it out), then save as `assets/art/anim_rivka.png`.

### Animation styles (no art needed)
Every character already moves using simple "puppet" motions. Change them in `characters.js` → `anim: { idle, talk, speed }`:
- `idle`: `breathe`, `sway`, `bounce`, `fidget`, `rock`, `shiver`, `still`
- `talk`: `nod`, `gesture`, `bounce`, `lean`
- `speed`: 1 = normal, 0.5 = slow (old Mr. Novak), 1.5 = jumpy (the newsboy)

### Character file names

- `portrait_rivka`: **Rivka Abramowitz**, Passenger from the Russian Empire
- `portrait_mama`: **Mrs. Abramowitz**, Rivka's mother
- `portrait_shmuel`: **Shmuel**, Rivka's little brother
- `portrait_giuseppe`: **Giuseppe Russo**, Laborer from Calabria, Italy
- `portrait_weber`: **Herr Weber**, Farmer from Pomerania, Germany
- `portrait_fraweber`: **Frau Weber**, Herr Weber's wife
- `portrait_steward`: **Mr. Pryce**, Ship's steward
- `portrait_doctor`: **Dr. Hale**, Inspecting doctor
- `portrait_clerk`: **Mr. Briggs**, Registration clerk
- `portrait_novak`: **Anton Novak**, Passenger held for questioning
- `portrait_runner`: **"Smiling" Jack Doyle**, Boardinghouse runner
- `portrait_changer`: **Money Changer**, Street money changer
- `portrait_agent`: **Miss Carver**, Castle Garden information desk
- `portrait_moishe`: **Cousin Moishe**, Tailor on Hester Street
- `portrait_chana`: **Chana**, Moishe's wife, finisher
- `portrait_boarder`: **Yankel**, Boarder
- `portrait_riis`: **Jacob Riis**, Police reporter, New York Tribune
- `portrait_peddler`: **Mrs. Leah Gold**, Pushcart peddler
- `portrait_peddler2`: **Herschel**, Pushcart peddler
- `portrait_newsboy`: **Tony the Newsboy**, Newsboy
- `portrait_rabbi`: **Mr. Kaplan**, Secretary of the Kiever Society
- `portrait_priest`: **Father Morelli**, Priest of a Catholic parish
- `portrait_lee`: **Mr. Lee Fong**, Shopkeeper on Mott Street
- `portrait_brennan`: **Mrs. Brennan**, Irish neighbor
- `portrait_guild`: **Mr. Whitcomb**, Volunteer, the Neighborhood Guild
- `portrait_boss`: **Mr. Quinn**, A man handing out coal
- `portrait_girl`: **Sarah**, Girl sewing buttons
- `portrait_plunkitt`: **George Washington Plunkitt**, Tammany Hall leader
- `portrait_oldrep`: **Mr. Haskins**, Old newspaper reporter
- `portrait_foreman`: **Mr. Halvorsen**, Construction foreman
- `portrait_driver`: **Mike**, Horsecar driver
- `portrait_elguard`: **El Guard**, Elevated railway guard
- `portrait_keeper`: **Park Keeper**, Central Park keeper
- `portrait_crowd0` … `portrait_crowd7`: eight background passersby, reused everywhere

## 2. Documents (optional illustrations)

An image named `doc_<key>.png` (about 800 × 600) appears at the top of that document when a student reads it.

`doc_letter`, `doc_poster`, `doc_bunks`, `doc_food`, `doc_exchange`, `doc_newspaper`, `doc_statue`, `doc_handbill`, `doc_society`, `doc_guildsign`, `doc_privy`, `doc_nast`, `doc_courthouse`, `doc_bridge`, `doc_parkrules`

`doc_nast` is also the cartoon in the newspaper office window in Chapter IV. Thomas Nast's 1871 cartoon is public domain, so a scan of the original works.

## 3. Skylines, signs, storefronts, title cards

Prompts and sizes for all of these are in **[FLOW_ASSET_PROMPTS.md](FLOW_ASSET_PROMPTS.md)**.

| Art | File names | Notes |
|---|---|---|
| Wraparound skyline | `skyline_castle`, `skyline_les`, `skyline_city`, `skyline_park` | One 16:9 image each, horizon one third up from the bottom. The game mirrors it around the whole horizon. |
| Shop signs | `sign_hester_north_01`…`13`, `sign_hester_south_01`…`13`, `sign_bowery_east_01`…`10`, `sign_bowery_west_01`…`10`, `sign_pell_01`…`03`, `sign_saloon_01`, `sign_lee_shop` | Wide boards, about 8:1. To change only the words, edit the `SIGNS` list in `js/zones/les.js`. |
| Storefronts | `storefront_saloon`, `storefront_moishe_w`, `storefront_moishe_e`, `storefront_lee_south`, `window_lee_shop` | Ground-floor shop fronts. |
| Building fronts | `facade_tenement_0`…`5`, `facade_office_0`…`3`, `facade_potter`, `facade_tribune`, `facade_city_hall`, `facade_courthouse`, `facade_eldridge_synagogue`, `facade_transfiguration`, `facade_neighborhood_guild` | One lot wide, sidewalk to cornice, drawn straight on. |
| Election banners | `banner_grant`, `banner_erhardt`, `banner_hewitt`, `poster_grant` | |
| Interiors | `shelves_lee_shop`, `backbar_saloon`, `board_club`, `board_society` | Wall panels inside the walk-in shops. |
| Chapter title cards | `card_intro`, `card_ship`, `card_castle`, `card_les`, `card_city` | Full tarot cards. Optional looping video: `assets/video/card_<name>.mp4`. |
| Awnings | `awning_0`…`2` | Striped canvas. |
| Keepsake icons | `keep_lemon`, `keep_address`, `keep_horse`, `keep_receipt`, `keep_coal`, `keep_paper`, `keep_unioncard`, `keep_leaflet`, `keep_novak_letter`, `keep_bird`, `keep_ribbon` | Square, about 256 × 256. Shown as round medallions in the journal. |

## 4. Other surfaces

Walls, floors, and street textures also have names (for example `street_belgian_block`, `wall_castle_sandstone`, `floor_steerage_sawdust`). They should tile seamlessly at 512 × 512. Type `listArtKeys()` in the browser console to print every name in the zones you have loaded.
