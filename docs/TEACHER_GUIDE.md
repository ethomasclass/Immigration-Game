# Teacher Guide: *The Other Half: A Photographer's Passage*

Students play a newspaper photographer in **1888**. They cross the Atlantic in steerage, pass through Castle Garden, and document life on the Lower East Side. An optional fourth chapter covers urbanization and political machines. Their photographs become evidence for a supporting question, which they copy onto the paper handout.

## Running it

- Students open the GitHub Pages link in Chrome. There's nothing to install and no login.
- Progress (photos, notes, answers) saves automatically **on that Chromebook only**. If a student switches computers, they can use **Chapter Select** to jump ahead.
- If the mouse won't "lock" (some managed Chromebooks), turn on **Settings → Drag to look**.
- If the game runs slowly, set **Settings → Graphics quality → Low**.
- **One goal at a time:** the top-left box shows only the current goal. The round map (top right) shows the student as a blue arrow and the goal as a gold star. Red dots are optional "leads" worth photographing. The full list of goals and leads is in the journal (**J**, Notebook tab).
- **Goal marker:** the current goal also shows in the 3D world as a gold diamond with a thin beam of light and the distance in meters. When the goal is off screen, the diamond sits at the screen edge with an arrow.
- **People move:** some scenes play out physically. After the doctor, Rivka's family walks to the registration desk; follow them and the scene starts on its own. They also walk into Moishe's tenement.
- **Purse:** students start with $2.50 in expense money (top center). The telegram for Mr. Novak costs 25 cents, a newspaper 2 cents, a pickle 1 cent, a horsecar or El ride 5 cents. They cannot run out.
- **Keepsakes:** objects people hand the student (Giuseppe's lemon, a union leaflet, Mr. Novak's letter) collect on the Keepsakes page of the journal. They make good writing prompts.
- **Darkroom:** each wrap-up opens with students rocking a developing tray to watch a photograph appear.
- **Required steps are short on purpose.** The questions a goal needs are marked with a star in conversations. Everything else (Mott Street, Mrs. Brennan, the settlement house, Boss Tweed) is an optional lead, so tell students which leads you want them to follow for your lesson.
- Controls: **WASD** move · **mouse** look · **E** talk/use · **F** (or right-click) raise camera, click to take a photo · **J** journal · **M** map · **Esc** pause.
- **Phones, tablets, and touchscreens:** touch controls turn on automatically. The left thumb walks (a joystick appears wherever it lands; push all the way to hurry), and the right thumb drags to look. A big button names what you can do next ("Talk to Rivka"); tap it or tap the screen. The camera button raises the viewfinder and a shutter button takes the photo. Buttons at the top open the map, the journal, and pause. Landscape works best. To force touch controls on or off (for example on a touchscreen Chromebook with a mouse), use **Settings → Touch controls**. **Full Screen** on the main menu hides the browser bars on Android.
- Developers can add `?dev` to the URL for an inspector (ground-gap audit, top-down plans, performance stats).
- The places are rebuilt from 1880s maps, photographs and records. See [HISTORICAL_REFERENCE.md](HISTORICAL_REFERENCE.md) for sources and the places where distances are compressed.

## Structure and timing (two class periods, about 25 minutes each)

The full story, every choice, and every consequence are in **[STORY.md](STORY.md)**.

**Day 1: Arrival**

| Chapter | Time | Covers | Student must… |
|---|---|---|---|
| Intro letter | 1 min | The assignment | Read |
| I. Steerage | ~5 min | Push and pull factors, steerage conditions, old vs. new immigrants, chain migration | Ask Rivka why she left; read her letter; take 2 photos |
| II. Castle Garden | ~7 min | Medical inspection (will Shmuel's cough get him sent back?), Immigration Act of 1882, "public charge," runners and swindlers, the Statue of Liberty, Chinese Exclusion | Doctor, clerk, **decide about Mr. Novak's telegram**, then **help Rivka decide who to trust** |
| III. Lower East Side | ~10 min | Tenements, sweatshop piecework, a contractor who cheats, child labor, Jacob Riis, pushcarts, mutual aid, Mott Street, nativism | Reach Moishe's tenement; photograph the sewing; take 4 photos |
| Wrap-Up A | ~3 min | **Was America a land of opportunity for newcomers?** | **Decide whether to print Sarah's face**; evidence chart; answer |

**Day 2: Election Week** (Monday, November 5 and Tuesday, November 6, 1888)

| Chapter | Time | Covers | Student must… |
|---|---|---|---|
| IV. One Week Later | ~7 min | Consequences of Day 1; sweatshop labor and the new United Hebrew Trades; the 1888 mayoral race from Hester Street; who could and couldn't vote | Find Rivka (**the union card**); visit Moishe; hear 2 opinions on the election |
| V. Park Row | ~10 min | Political machines and illegal "repeat" voting; skyscrapers and construction dangers; injured workers with no safety net; Tammany vs. mutual aid | **Advise Giuseppe on Quinn's demand**; ride the elevator; see the fall; **choose the Courier's endorsement** |
| VI. Election Night | ~5 min | Election returns on Park Row; the real result; how each person's week ended | Hear the returns; find 3 friends |
| Wrap-Up B | ~3 min | **Did the growing city and its political machines help newcomers, or take advantage of them?** | Evidence chart; answer; read "What became of them" |

**Six choices** change what happens: Novak's telegram, who to trust at the gate, Sarah's photo, Rivka's union card, Giuseppe and Quinn, and the endorsement. None is "right": every one costs someone something. That makes them strong discussion starters. Consider polling the class: *How many of you printed Sarah's face? Why?*

**If students change computers between days:** the game saves on each computer. On a new computer, Day 2 opens with a "Previously…" card that explains which Day 1 choices the story will assume. Chapter Select can start any chapter.

**Emotional content:** students see a child working, a family cheated, an old man detained and possibly sent back, and a worker hurt in a fall. Nobody dies. Preview the Park Row chapter if you have students who may find an on-screen accident upsetting.

## Evidence-chart columns

The columns are set in `js/data/evidence.js` (`WRAPUPS`). **Edit them to match your paper handout.** The defaults:

- **Part A:** Government · Business & Work · Ordinary People
- **Part B:** Political Machines · City Growth · Daily Life

### Suggested column for each photo (answer key)

**Government:** Liberty, The Fortress, The Physician, The Ledger (1882 Act), The Detained, The Closed Door (Chinese Exclusion), The Guide, The Tenement (1879 law), The Yard, The Coal Sack (ward boss)
**Business & Work:** The Laborer, The Steward, The Bunks, The Promise (steamship ads), The Ration, The Swindler, The Money Changer, The Needle (sweatshop), The Button Girl, The Digger
**Ordinary People:** The Exile, The Widow & Son, The Farmer, The Boarder, The Tailor (chain migration), The Witness (Riis), The Peddler, Many Tongues, The Society, The Synagogue, The Parish, The Merchant, The Handbill, The Neighbor, The Guild

Many photos reasonably fit more than one column. Ask students to justify their choice.

## Curriculum hooks (hidden in game)

- **Item 26 (nativism):** Mrs. Brennan (Zone III), the child of Irish Famine immigrants, repeats the prejudice once aimed at the Irish. *This echoes the Kellys' storyline*, so connect it in discussion. The handbill is a fictional composite of 1880s nativist material.
- **Item 27 (Chinese Exclusion):** the newspaper on the bench (Zone II) and Mr. Lee Fong on Mott Street (Zone III), who explains he opened his own store because white-owned businesses wouldn't hire him. He also notes that Chinese immigrants could not become citizens.
- **Ep 5 (labor):** the sweatshop and piecework scene with Moishe, Chana, and Sarah.
- **Graft (Park Row):** students can walk into the Tweed Courthouse. Framed copies of the Ring's bills hang on the rotunda wall ($133,187 for two days of plastering), and reading them is an optional lead that can be photographed ("The Bills"). Plunkitt's bootblack stand is right there in the rotunda, so students hear "honest graft" a few steps from the evidence of the dishonest kind.
- **6.3 (machines):** Mr. Quinn hands out coal in Day 1. In Day 2 he demands Giuseppe vote under a dead man's name, and either pays the doctor after the fall or abandons him, depending on the student's advice.
- **Hull House:** the Guild volunteer mentions Jane Addams visiting Toynbee Hall in 1888.

## Historical notes and simplifications (for accuracy questions)

- **Fictional people:** Rivka's family, Giuseppe, the Webers, the steward, the doctor, the clerk, Novak, the runners, Miss Carver, all the Lower East Side residents, Mr. Lee Fong, Mrs. Brennan, Mr. Whitcomb, Mr. Quinn, Haskins, the foreman, and the drivers. They are composites built from typical experiences.
- **Real organizations in the story:** the United Hebrew Trades (founded 1888) and Italian mutual aid societies. Mr. Kessler, Esther Lipsky, Signor Bellini, Tomas Novak, and Mr. Quinn are fictional.
- **The 1888 election result** is real: Grant (Tammany) about 114,000 votes, Erhardt about 73,000, Hewitt about 72,000. Hewitt really did refuse to review the 1888 St. Patrick's Day parade.
- **Real people:** Jacob Riis (a Danish immigrant and Tribune police reporter, who began using flash powder in 1887; *How the Other Half Lives* came out in 1890) and **George Washington Plunkitt** (a Tammany district leader who did hold court at a bootblack stand in the County Courthouse). His "honest graft… I seen my opportunities and I took 'em" lines are **paraphrased from *Plunkitt of Tammany Hall* (1905)**, which was published later than 1888.
- **The election:** the game is set in late October 1888, days before the New York mayoral election of November 6. Hugh J. Grant (Tammany Hall) defeated Joel B. Erhardt (Republican) and Mayor Abram Hewitt. The banners use their real names; the wording is invented.
- **The elevator:** the Potter Building (1886) stood next to the Times Building, which was being rebuilt in 1888. The rooftop view and the workers are a reconstruction.
- **Tweed** died in 1878, so he appears only as a legacy (Nast's 1871 cartoon, the courthouse).
- **Ship:** one ship carrying Russian Jews, southern Italians, and Germans together is a simplification. Most sailed from different ports (Hamburg, Bremen, Naples, Liverpool).
- **Castle Garden** inspections were quicker and less medical than the later Ellis Island exams. The game avoids Ellis Island details like chalk marks.
- **Riis's methods:** students are prompted to think about consent. Riis's photos helped bring reform, but his writing included ethnic stereotypes.

## Discussion prompts

1. Rivka's family had a letter with an address. Novak had no one. How did that change what happened at Castle Garden?
2. Who helped newcomers more in your evidence: the government, businesses, or ordinary people?
3. Mrs. Brennan's family faced prejudice too. Why might earlier immigrants turn against newer ones?
4. Plunkitt says Tammany helps people "every day." Is a sack of coal for a vote a fair trade? Who pays for it?
5. Central Park was built "for everyone." Was it?
