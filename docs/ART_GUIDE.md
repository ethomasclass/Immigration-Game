# Art Guide: Adding Your Tarot-Style Illustrations

Every surface in the game asks for its texture by a **key** (a name). For each key, the game:

1. draws a quick placeholder right away, then
2. looks for **`assets/art/<key>.png`** (or `.jpg`) and swaps your art in if it finds it.

So adding art means **saving a file with the right name into `assets/art/`**. You don't need to edit any code. Refresh the browser to see it.

> Tip: In the browser console (Ctrl+Shift+J), type `listArtKeys()` to print every key used by the zones you've loaded.

## Recommended sizes (keep files small for Chromebooks)

| Kind | Size (px) | Notes |
|---|---|---|
| Character body `char_<id>` | 512 × 512 | **Wraps around** the figure's body like a label on a can. The **horizontal center of the image faces forward**; the left and right edges meet at the back. Put the tarot-style figure (clothes, hands, symbols) in the middle third. |
| Character face `face_<id>` | 128 × 160 | Optional. A small face card placed over the head. Once this file exists, it appears automatically. |
| Dialogue portrait `portrait_<id>` | 300 × 460 | Optional but recommended: the **full tarot card** shown in the dialogue box. If it's missing, the game uses the `char_` art. |
| Documents `doc_<key>` | 800 × 600 | Optional. An illustration shown at the top of a document when the student reads it. |
| Walls, floors, ground | 512 × 512 | Should **tile seamlessly** (left edge matches right, top matches bottom). |
| Signs, posters, facades | Any; keep the shape | Shown once, stretched to fit the sign. Match the aspect ratio listed in the code (e.g. signs are wide). |

Use **PNG** for art with transparency or crisp lines, and **JPG** for large painted textures (smaller files). Try to keep each file under about 300 KB.

## Characters

- `char_agent` · `face_agent` · `portrait_agent`: **Miss Carver**, Castle Garden information desk
- `char_boarder` · `face_boarder` · `portrait_boarder`: **Yankel**, Boarder
- `char_boss` · `face_boss` · `portrait_boss`: **Mr. Quinn**, A man handing out coal
- `char_brennan` · `face_brennan` · `portrait_brennan`: **Mrs. Brennan**, Irish neighbor
- `char_chana` · `face_chana` · `portrait_chana`: **Chana**, Moishe's wife, finisher
- `char_changer` · `face_changer` · `portrait_changer`: **Money Changer**, Street money changer
- `char_clerk` · `face_clerk` · `portrait_clerk`: **Mr. Briggs**, Registration clerk
- `char_doctor` · `face_doctor` · `portrait_doctor`: **Dr. Hale**, Inspecting doctor
- `char_driver` · `face_driver` · `portrait_driver`: **Mike**, Horsecar driver
- `char_elguard` · `face_elguard` · `portrait_elguard`: **El Guard**, Elevated railway guard
- `char_foreman` · `face_foreman` · `portrait_foreman`: **Mr. Halvorsen**, Construction foreman
- `char_fraweber` · `face_fraweber` · `portrait_fraweber`: **Frau Weber**, Herr Weber's wife
- `char_girl` · `face_girl` · `portrait_girl`: **Sarah**, Girl sewing buttons
- `char_giuseppe` · `face_giuseppe` · `portrait_giuseppe`: **Giuseppe Russo**, Laborer from Calabria, Italy
- `char_guild` · `face_guild` · `portrait_guild`: **Mr. Whitcomb**, Volunteer, the Neighborhood Guild
- `char_keeper` · `face_keeper` · `portrait_keeper`: **Park Keeper**, Central Park keeper
- `char_lee` · `face_lee` · `portrait_lee`: **Mr. Lee Fong**, Shopkeeper on Mott Street
- `char_mama` · `face_mama` · `portrait_mama`: **Mrs. Abramowitz**, Rivka's mother
- `char_moishe` · `face_moishe` · `portrait_moishe`: **Cousin Moishe**, Tailor on Hester Street
- `char_newsboy` · `face_newsboy` · `portrait_newsboy`: **Tony the Newsboy**, Newsboy
- `char_novak` · `face_novak` · `portrait_novak`: **Anton Novak**, Passenger held for questioning
- `char_oldrep` · `face_oldrep` · `portrait_oldrep`: **Mr. Haskins**, Old newspaper reporter
- `char_peddler` · `face_peddler` · `portrait_peddler`: **Mrs. Leah Gold**, Pushcart peddler
- `char_peddler2` · `face_peddler2` · `portrait_peddler2`: **Herschel**, Pushcart peddler
- `char_plunkitt` · `face_plunkitt` · `portrait_plunkitt`: **George Washington Plunkitt**, Tammany Hall leader
- `char_priest` · `face_priest` · `portrait_priest`: **Father Morelli**, Priest of a Catholic parish
- `char_rabbi` · `face_rabbi` · `portrait_rabbi`: **Mr. Kaplan**, Secretary of the Kiever Society
- `char_riis` · `face_riis` · `portrait_riis`: **Jacob Riis**, Police reporter, New York Tribune
- `char_rivka` · `face_rivka` · `portrait_rivka`: **Rivka Abramowitz**, Passenger from the Russian Empire
- `char_runner` · `face_runner` · `portrait_runner`: **"Smiling" Jack Doyle**, Boardinghouse runner
- `char_shmuel` · `face_shmuel` · `portrait_shmuel`: **Shmuel**, Rivka's little brother
- `char_steward` · `face_steward` · `portrait_steward`: **Mr. Pryce**, Ship's steward
- `char_weber` · `face_weber` · `portrait_weber`: **Herr Weber**, Farmer from Pomerania, Germany

Background crowds: `char_crowd0` … `char_crowd7` (and matching `face_crowd0…7`). Eight generic passersby, reused everywhere.

## Documents (optional illustrations)

`doc_letter`, `doc_poster`, `doc_bunks`, `doc_food`, `doc_exchange`, `doc_newspaper`, `doc_statue`, `doc_handbill`, `doc_society`, `doc_guildsign`, `doc_privy`, `doc_nast`, `doc_courthouse`, `doc_bridge`, `doc_parkrules`

`doc_nast` is also shown as the cartoon in the newspaper office window in Zone IV. Thomas Nast's 1871 cartoon is in the public domain, so you can use a scan of the original.

## Environment textures

- `board_society`
- `bridge_granite`
- `ceiling_tenement`
- `desk_wood`
- `el_car`
- `facade_neighborhood_guild`
- `facade_parish`
- `facade_synagogue`
- `flag_us_1888`
- `floor_castle`
- `floor_construction`
- `floor_tenement`
- `grass_park`
- `ground_yard`
- `handbill_nativist`
- `horsecar`
- `laundry_0`
- `laundry_1`
- `laundry_2`
- `ledger`
- `mattress_straw`
- `newspaper_1888`
- `papers_stack`
- `path_gravel`
- `pavement_battery`
- `poster_steamship`
- `privy_door`
- `roof_castle`
- `sidewalk`
- `sign_castle_garden`
- `sign_city_hall`
- `sign_construction`
- `sign_courier`
- `sign_courthouse`
- `sign_el_station`
- `sign_exchange`
- `sign_exit`
- `sign_forsyth`
- `sign_horsecar`
- `sign_horsecar_stop`
- `sign_lee_shop`
- `sign_mott`
- `sign_park_rules`
- `sign_shop_0`
- `sign_shop_1`
- `sign_shop_2`
- `sign_shop_3`
- `sign_shop_4`
- `sign_shop_5`
- `sign_shop_6`
- `sign_tenement_number`
- `sign_tribune`
- `street_cobble`
- `trunk`
- `wall_brick_dark`
- `wall_brick_office`
- `wall_brick_tenement`
- `wall_brownstone`
- `wall_castle`
- `wall_el_station`
- `wall_marble`
- `wall_steerage`
- `wall_tenement_room`
- `wall_tribune`
- `water_harbor`
- `window_airshaft`
- `window_lee_shop`
- `window_office`
- `window_tenement`
- `window_tenement_lit`
- `wood_cart`
- `wood_rough`
- `wood_ship`
- `wood_ship_dark`


## Quick test

1. Save `assets/art/char_rivka.png`.
2. Run the game locally (see README) or push to GitHub Pages.
3. Choose Chapter Select, then I. Steerage. Rivka should now wear your art.
