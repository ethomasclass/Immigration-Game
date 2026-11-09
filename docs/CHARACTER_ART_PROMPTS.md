# Character Art Prompts (Google Flow)

These prompts make the **2D character art** in a tarot-illustration style. They make the figure only: no card, border, title, or Roman numeral. Characters appear as flat illustrated cutouts in the 3D world, like a paper theater.

## How to use

1. In Flow, create an image with **Portrait (9:16)** aspect ratio.
2. Paste the **STYLE BLOCK**, then one **character line** from below. Keep the style block identical every time; that's what keeps the cast consistent.
3. Generate Rivka first. When you like one, save it and add it as a **reference image (ingredient)** for every later character, with the note *"match the art style of the reference image, not the character."*
4. Remove the background (Flow's edit tools, Canva, or remove.bg), crop tight with the feet at the bottom edge, and save as **`assets/art/portrait_<id>.png`**. This one image is used both for the **2D character in the 3D world** and in the **dialogue box**.
5. Refresh the game. The character appears automatically.
6. *(Optional, animation)*: animate the portrait in Flow (Veo) and save an 8-frame sprite strip as `assets/art/anim_<id>.png`. See [ART_GUIDE.md](ART_GUIDE.md#optional-animated-characters-with-flow-veo).

---

## STYLE BLOCK (paste first, every time)

```
Character illustration in an Art Nouveau tarot-card art style, without the card: a single full-body figure standing, facing the viewer at a slight three-quarter angle, centered, head to feet fully visible, feet at the bottom of the image, plain flat cream background (#EFE3C6) with no scenery, no shadow, no border, no frame, no text, no lettering.
Confident hand-inked black linework with varied line weight, flat cel-shaded color with soft watercolor-textured fills and subtle paper grain, gentle flowing curves in hair and fabric inspired by 1890s Art Nouveau posters, decorative but readable.
Muted vintage palette: ochre gold, deep teal, brick red, olive, warm cream, sepia browns, ink black.
Historically accurate clothing for New York, 1888. Dignified, humane portrayal with natural proportions, no caricature or exaggerated ethnic features.
```

*Optional symbolic touch, in keeping with tarot:* add `Include one small symbolic object held in the hands: ___.` The suggested objects are listed per character.

---

## Character lines

### Zone I: Steerage

| File id | Paste after the style block |
|---|---|
| `rivka` | Rivka Abramowitz, a 16-year-old Jewish girl from near Kiev, Russian Empire, dark hair braided under a faded red-and-ochre kerchief, long dark wool skirt, plain blouse, gray knitted shawl over her shoulders, tired but determined eyes. Symbolic object: a folded letter held to her chest. |
| `mama` | Mrs. Abramowitz, a Jewish widow in her 40s from the Russian Empire, married woman's dark headscarf covering her hair, long black skirt and dark bodice, heavy fringed shawl, worried gentle expression. Symbolic object: a brass candlestick wrapped in cloth. |
| `shmuel` | Shmuel, an 8-year-old Jewish boy from the Russian Empire, oversized cloth cap, short wool jacket, knee-length trousers, scuffed boots, curious wide eyes. Symbolic object: a small wooden toy horse. |
| `giuseppe` | Giuseppe Russo, a cheerful 24-year-old laborer from Calabria, southern Italy, sun-browned skin, thick dark mustache, brown felt hat, red neckerchief, open-collar shirt, brown corduroy vest and trousers, sturdy boots. Symbolic object: a shovel over one shoulder. |
| `weber` | Herr Weber, a serious 55-year-old German farmer from Pomerania, gray side-whiskers and beard, dark blue wool coat, waistcoat with watch chain, low-crowned black felt hat, weathered hands. Symbolic object: a sheaf of wheat. |
| `fraweber` | Frau Weber, a 50-year-old German farm wife, hair in a tight bun under a black bonnet tied at the chin, long brown dress with a white apron, knitted shawl. Symbolic object: a loaf of dark bread. |
| `steward` | Mr. Pryce, a 45-year-old Welsh ship's steward on an 1880s transatlantic steamship, short graying beard, navy double-breasted jacket with brass buttons, peaked navy cap. Symbolic object: a hanging oil lantern. |

### Zone II: Castle Garden

| File id | Paste after the style block |
|---|---|
| `doctor` | Dr. Hale, a brisk 55-year-old American physician at an immigration station, neat gray mustache, black frock coat, white shirt, dark cravat, pince-nez spectacles. Symbolic object: a small brass hand lens. |
| `clerk` | Mr. Briggs, a tired 30-year-old New York registration clerk, center-parted hair, small mustache, sleeve garters on white shirtsleeves, dark waistcoat, ink-stained fingers. Symbolic object: a large open ledger and dip pen. |
| `novak` | Anton Novak, a dignified 72-year-old Bohemian (Czech) weaver, white mustache, thin face, worn black coat buttoned high, old felt hat in his hands, patient sad eyes. Symbolic object: a spool of thread. |
| `runner` | "Smiling" Jack Doyle, a 30-year-old swindler who meets immigrants at the dock, too-wide grin, loud checked suit, red waistcoat, derby hat tilted back, flashy watch chain. Symbolic object: a fan of boardinghouse cards. |
| `changer` | A slick 40-year-old street money changer, oiled hair, thin mustache, olive green overcoat, derby hat. Symbolic object: a handful of coins spilling between his fingers. |
| `agent` | Miss Carver, a patient 32-year-old American woman at the Castle Garden information desk, hair pinned up, high-collared navy dress with a bustle, small ribbon brooch. Symbolic object: a hand-drawn map. |

### Zone III: Lower East Side

| File id | Paste after the style block |
|---|---|
| `moishe` | Cousin Moishe, a 34-year-old Jewish tailor, short dark beard, black skullcap, rolled shirtsleeves, dark vest, tape measure around his neck, thin and overworked. Symbolic object: a large pair of tailor's shears. |
| `chana` | Chana, a 32-year-old Jewish garment finisher, headscarf knotted at the back, dark blouse with sleeves pushed up, long apron with pins stuck in it, quick hands. Symbolic object: a needle and black thread. |
| `girl` | Sarah, a shy 10-year-old Jewish girl, two dark braids, faded blue pinafore dress over a white blouse, button boots. Symbolic object: a card of buttons. |
| `boarder` | Yankel, a sleepy 20-year-old Jewish baker's apprentice, flour on his sleeves, cloth cap, rumpled white shirt and suspenders. Symbolic object: a round loaf of bread. |
| `riis` | Jacob Riis, the Danish-American police reporter and photographer, about 40, large bushy brown mustache, round wire spectacles, brown sack coat, bowler hat, energetic posture. Symbolic object: a wooden box camera with a flash-powder lamp. |
| `peddler` | Mrs. Leah Gold, a loud, funny 45-year-old Jewish pushcart peddler, headscarf, sleeves rolled up, layered skirts with a money pouch at the waist, hands on hips. Symbolic object: a pickle held up proudly. |
| `peddler2` | Herschel, a 55-year-old Jewish pushcart peddler and former teacher, long gray beard, round black hat, long dark coat, gentle scholarly face. Symbolic object: a stack of tin pots. |
| `newsboy` | Tony, an 11-year-old Italian-American New York newsboy, oversized cap pushed back, patched jacket, knickers, bare scuffed knees, big grin. Symbolic object: an armful of newspapers. |
| `rabbi` | Mr. Kaplan, a warm 65-year-old Jewish society secretary, full white beard, black wide-brimmed hat, long black frock coat, kind eyes. Symbolic object: a small dues book and a coin box. |
| `priest` | Father Morelli, a gentle 55-year-old Italian Catholic priest, black cassock with many buttons, white collar, round black hat. Symbolic object: a rosary. |
| `lee` | Mr. Lee Fong, a calm 45-year-old Chinese merchant on Mott Street, hair in a long queue (braid), black skullcap, dark blue silk tunic with frog-button closures, loose trousers, cloth shoes. Symbolic object: a tin of tea. |
| `brennan` | Mrs. Brennan, a proud 55-year-old Irish-American woman, graying red hair under a black bonnet, dark green dress, plaid shawl, arms crossed, stern expression. Symbolic object: a rolled-up handbill. |
| `guild` | Mr. Whitcomb, an earnest 24-year-old college-educated settlement-house volunteer, clean-shaven, tweed suit, high starched collar, round spectacles. Symbolic object: a stack of books. |
| `boss` | Mr. Quinn, a booming 45-year-old Irish Tammany ward boss, big walrus mustache, black frock coat, gold watch chain over a large belly, derby hat, generous grin. Symbolic object: a sack of coal on his shoulder. |
| `giuseppe` | *(reuse the Zone I art)* |

### Zone IV: The City

| File id | Paste after the style block |
|---|---|
| `plunkitt` | George Washington Plunkitt, a 46-year-old Tammany Hall political leader, round friendly face, clean-shaven with a strong chin, black frock coat, high collar, top hat, cigar in hand, sitting confidently on a shoeshine stand. Symbolic object: a top hat held out like a collection plate. |
| `oldrep` | Mr. Haskins, a dry-humored 62-year-old newspaper reporter, gray mustache, rumpled brown suit, derby hat, pencil behind his ear. Symbolic object: a folded newspaper. |
| `foreman` | Mr. Halvorsen, a 45-year-old Norwegian construction foreman, blond-gray beard, flat cap, canvas work coat, heavy boots. Symbolic object: a rolled blueprint. |
| `driver` | Mike, a 32-year-old Irish horsecar driver, wool cap with a badge, heavy blue coat, scarf, reins in his hands. Symbolic object: a horse whip. |
| `elguard` | An elevated-railway guard, about 35, dark blue uniform coat with brass buttons, peaked cap with badge, shouting with one hand cupped. Symbolic object: a train lantern. |
| `keeper` | A 55-year-old Scottish Central Park keeper, gray beard, gray-green uniform coat and cap, strict but kind face. Symbolic object: a "Keep Off the Grass" sign. |

### Background crowd (`crowd0` … `crowd7`)

Generate one figure for each id. Give them no symbolic object so they stay in the background.

| File id | Paste after the style block |
|---|---|
| `crowd0` | A working man in a cloth cap and brown jacket |
| `crowd1` | A woman in a dark headscarf and shawl carrying a basket |
| `crowd2` | An Italian laborer in a felt hat and vest |
| `crowd3` | An older woman in a bonnet and long brown dress |
| `crowd4` | A clerk in a derby hat and dark suit |
| `crowd5` | A barefoot street child in a cap and ragged jacket |
| `crowd6` | A young woman in a plain purple dress with her hair pinned up |
| `crowd7` | A bearded man in a long gray coat, hatless |

---

## Tips for good results

- **Results don't match each other?** Always attach the same reference image (your best Rivka) and say *"match the line style and palette of the reference."*
- **Flow added a card frame or text?** Add: `Do not draw any border, frame, banner, title or numbers.`
- **Background isn't plain?** Add: `isolated on a flat cream background, nothing behind the figure.`
- **Accuracy check:** 1888 men wore hats outdoors almost always. Women's skirts reached the ground. No wristwatches (pocket watches only). No zippers.
- **Real people (Jacob Riis, Plunkitt):** compare with archival photos on the Library of Congress site (loc.gov) and adjust.
