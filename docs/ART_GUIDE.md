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

## 3. Buildings, signs, and surfaces

These are optional; the placeholders are drawn to match 1888 photographs (see [HISTORICAL_REFERENCE.md](HISTORICAL_REFERENCE.md)).
- **Tiling textures** (walls, floors, streets) should repeat seamlessly; 512 × 512.
- **Facades** (`facade_*`) are one 25-ft lot wide, ground floor to cornice; about 256 × 512.
- **Signs** match the shape of the sign.


- `barge_deck`
- `berth_ticks`
- `board_society`
- `bridge_granite`
- `ceiling_tenement`
- `desk_wood`
- `door_steerage`
- `el_car`
- `el_girder`
- `facade_city_hall`
- `facade_courthouse`
- `facade_eldridge_synagogue`
- `facade_neighborhood_guild`
- `facade_office_0`
- `facade_office_1`
- `facade_office_2`
- `facade_office_3`
- `facade_potter`
- `facade_rear`
- `facade_tenement_0`
- `facade_tenement_0_low`
- `facade_tenement_1`
- `facade_tenement_1_low`
- `facade_tenement_2`
- `facade_tenement_2_low`
- `facade_tenement_3`
- `facade_tenement_3_low`
- `facade_tenement_4`
- `facade_tenement_4_low`
- `facade_tenement_5`
- `facade_tenement_5_low`
- `facade_tenement_moishe`
- `facade_transfiguration`
- `facade_tribune`
- `fence_depot`
- `flag_us_38_stars`
- `floor_castle`
- `floor_steerage_sawdust`
- `floor_tenement`
- `grass_park`
- `ground_yard`
- `handbill_nativist`
- `horsecar_1d1d24`
- `horsecar_bowery`
- `horsecar_d8b23a`
- `laundry_0`
- `laundry_1`
- `laundry_2`
- `ledger`
- `mattress_straw`
- `newspaper_1888`
- `path_gravel`
- `pavement_battery`
- `poster_steamship`
- `privy_door`
- `roof_castle`
- `sidewalk_bluestone`
- `sign_baggage`
- `sign_bridge_terminal`
- `sign_castle_garden`
- `sign_city_hall`
- `sign_courthouse`
- `sign_el_station`
- `sign_horsecar`
- `sign_horsecar_bowery`
- `sign_horsecar_stop`
- `sign_keep_off`
- `sign_labor_exchange`
- `sign_lee_shop`
- `sign_park_rules`
- `sign_post_office`
- `sign_single_men`
- `sign_single_women`
- `sign_vert_106`
- `sign_vert_111`
- `stone_bethesda`
- `storefront_moishe_e`
- `storefront_moishe_w`
- `street_belgian_block`
- `trunk`
- `wall_brick_side`
- `wall_castle_inner`
- `wall_castle_sandstone`
- `wall_church_side`
- `wall_depot_wood`
- `wall_el_station`
- `wall_granite_po`
- `wall_marble`
- `wall_steerage_hull`
- `wall_steerage_partition`
- `wall_tenement_room`
- `wall_times_granite`
- `wall_tribune`
- `water_harbor`
- `window_airshaft`
- `window_castle`
- `window_lee_shop`
- `window_po`
- `window_yard`
- `wood_cart`
- `wood_rough`
- `wood_ship_dark`
- `wood_trestle`


Shop signs (`sign_shop_N`), street signs (`sign_street_*`), and Castle Garden and Park Row signs (`sign_cg_*`, `sign_pr_*`) are generated from text in the zone files. Edit the text there instead of replacing the image.
