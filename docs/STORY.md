# Story Bible: *The Other Half*

The game runs about **45–50 minutes over two class periods**. Students should finish caring about specific people: Rivka, Giuseppe, old Mr. Novak, little Sarah. They should be angry at a boss, worried about a fall, and invested in an election they cannot change.

## The hero, the purpose, and the shape of the hour

**The hero is the student.** They play a 15-year-old apprentice at the Evening Courier, born in New York to parents who came through Castle Garden. The Editor has put a camera in their hands and given them one week: "Bring me a front page and the job is yours. Come back with nothing, and I find another kid." Rivka is 16 and notices at once that the photographer is no older than she is.

**What the hero wants:** to keep the job. **What stands in the way:** the people they photograph become friends, and the pictures the Editor wants most are the ones that could hurt them.

**The purpose of the game, in one line:** decide what a camera is for. Every big moment asks the same question in a new form: take the picture, or put the camera down and be a person? Jacob Riis faced it. So does anyone with a phone today, which is the bridge to students' own lives.

**The arc (three acts in under an hour):**

| Act | Chapters | What it does |
|---|---|---|
| 1. The assignment | The Crossing, Castle Garden | The hero gets a goal and a deadline, meets the people, and makes the first promises (Rivka's print, Mr. Novak's telegram). |
| 2. The cost | Hester Street, the front page, One Week Later | The first camera-or-person moment (Mr. Kessler docks Chana's pay). The midpoint is the front page: print Sarah's face or keep a promise. Day 2 opens with what that choice did. |
| 3. The test | Park Row, Election Night | The crisis is Giuseppe's fall: the picture every paper wants, or his hand. Then the endorsement, the election nobody can change, and an ending that names who the student became. |

**How students feel their choices:** a short stamp appears the moment a choice lands ("Rivka will remember that."), and the ending lists each promise kept or broken and names their path: **The Witness** (the picture came first), **The Neighbor** (the person came first), or **The Go-Between**. None is the right answer.

**Design rules**
- **Real stakes, no deaths.** People are cheated, fired, hurt, and sent away, but nobody dies.
- **The hero never speaks aloud.** Students speak only through choices, so the feelings stay theirs. People call them "kid."
- **Required dialogue is short.** The emotional beats are written into required scenes, and everything else is optional.
- **Listen, then go.** Conversations play straight through: each person says what matters (the `listen` list on a step in `js/data/dialogue.js`) and points the way (`direct`). Menus of questions are gone. The only conversation choices are the seven decisions in the flag map, plus small offers (`ask`: a pickle, a newspaper, the El).
- **History doesn't bend.** Hugh J. Grant wins on November 6, 1888, whatever students do. Their choices change what happens to the *people*.

---

## The cast and their arcs

| Character | Wants | Fears | Arc across the two days |
|---|---|---|---|
| **Rivka Abramowitz** (16, from near Kiev) | Safety for Mama and Shmuel. Someday, school. | Being sent back. Being nobody. | She arrives clutching a letter, then stands up to a boss. In Day 2 she decides whether to join a union. |
| **Shmuel** (8) | Gold streets. | The doctor. | His cough makes Castle Garden terrifying: will they send him back? |
| **Giuseppe Russo** (24, Calabria) | Land for his mother. | Owing anyone. | He gets a construction job through Tammany. In Day 2 his boss demands an illegal vote, and he falls on the scaffold. |
| **Anton Novak** (72, Bohemia) | To see his son. | Dying alone at sea. | He is detained as a "public charge." Students may pay for his telegram. |
| **Moishe & Chana** | To keep the coat work. | The contractor's anger. | Day 1's photo decision lands on them in Day 2. |
| **Sarah** (10) | School. | Being in trouble. | The face in the front-page photograph, if students print it. |
| **Mr. Kessler** (contractor) | To keep his contract with the manufacturer. | Losing it. | He cheats his workers. He is an immigrant too, squeezed from above, so students can see why without excusing it. |
| **Esther Lipsky** (union organizer) | A union in every shop. | Being arrested. | She asks Rivka to sign. |
| **Mr. Quinn** (Tammany ward boss) | Votes. | The reformers. | He is generous, and he expects something back. |
| **Mrs. Brennan** (Irish neighbor) | Respect for her family. | Being pushed aside. | She supports Grant because Mayor Hewitt insulted the Irish. |
| **Mr. Whitcomb** (Guild volunteer) | Honest government. | Tammany. | He hands out Hewitt leaflets and barely notices who can't vote. |
| **Mr. Lee Fong** | To see his brother. | Nothing more to lose. | He has the quietest line in the game: "The law says I will never vote." |

---

## Day 1: Arrival (about 25 minutes)

### I. The Crossing (about 5 min)
- **Rivka** asks the photographer for a picture "so Bubbe will know we are alive." The photographer promises her a print. *(Payoff in Day 2 if the student photographed her.)*
- **Shmuel coughs.** Mama is terrified the doctors will see.
- **Giuseppe** tosses the photographer a lemon from his mother's tree: "Smell. That is home."
- **Old Mr. Novak** whittles a little wooden horse for Shmuel. "My son Tomas is in Chicago. He doesn't know I'm coming. A surprise."

### II. Castle Garden (about 7 min)
- **Medical check (suspense):** the doctor stops at Shmuel, listens to his chest... "Seasick. Move along." Mama weeps with relief.
- **Novak is held** as "likely to become a public charge."
  - **CHOICE 1: the telegram.** Pay 25 cents of your own money to wire his son. `paid_telegram`
- **CHOICE 2: who to trust at the gate.** Runner, money changer, or the information desk. `swindled` / `shortchanged` / `safe`

### III. Hester Street (about 10 min)
- Moishe's tenement and sweatshop.
- **Mr. Kessler** arrives to collect the coats. He docks Chana for a "crooked seam" that isn't crooked.
- **Sarah** sews buttons. Moishe begs the photographer: "Not my Sarah's face. Kessler reads the papers."
- **Riis** in the yard: "A face makes people care. Without faces, nobody uptown lifts a finger."

### Wrap-Up A (about 3 min)
- **CHOICE 3: the front page.** Print Sarah's face, or leave her out. `printed_sarah`
- Then the evidence chart and the question: *Was America a land of opportunity?*

---

## Day 2: Election Week (about 25 minutes)

*"Previously…" card for students on a new computer:* their Day 1 choices are unknown, so the game assumes the safe defaults (Miss Carver's help, no telegram, Sarah not printed) and says so.

### IV. One Week Later: Hester Street (Monday, November 5, 1888; about 7 min)
- **Consequence of Choice 3:**
  - *If Sarah was printed:* Kessler took the coat work away from Moishe. Moishe is cold to the photographer: "You promised." But a lady from the Guild came with the newspaper, and Sarah now goes to the Guild kindergarten after school instead of sewing. A mixed result.
  - *If she was not:* "You kept your word. We still have the work. And nothing changed."
- **Rivka** now works in **Kessler's shop**. He held back two weeks of pay.
  - **CHOICE 4: the union card.** Esther Lipsky of the brand-new **United Hebrew Trades** (founded 1888) is on a soapbox outside. Rivka asks: "Should I sign?" `rivka_union`
- **The candidates** (the student can only listen; the vote is tomorrow):
  - **Mr. Quinn** on a coal wagon: "Grant is one of US."
  - **Mrs. Brennan:** "Hewitt wouldn't even review the St. Patrick's Day parade."
  - **Mr. Whitcomb:** "Hewitt is honest. He gave the city small parks."
  - **Rivka:** "Women cannot vote. But I can shout."
  - **Mr. Lee:** "The law says I will never vote."
- **Giuseppe** runs by with a lunch pail: "Quinn got me work on the Times Building! Come see me on Park Row!"
- **Novak:**
  - *Telegram paid:* no news yet (a surprise for election night).
  - *Not paid:* a letter arrives, sent back on the steamer: "Do not be sad, photographer. I saw America for two days."
- **The print** (if the student photographed Rivka on the ship): she cries. "Now Bubbe will see."

### V. Park Row (Monday afternoon; about 10 min)
- **Giuseppe at the Times site:** Quinn has told him to vote tomorrow under a dead man's name ("repeating"), or lose the job. He can't vote legally, because he isn't a citizen.
  - **CHOICE 5:** tell him to refuse, go along, or tell the reporter Haskins. `gius_refuse` / `gius_repeat` / `gius_expose`
- **Plunkitt** explains how the machine works, with charm.
- **The elevator to the Potter Building roof.** From there, Giuseppe waves from the open eleventh floor next door. **A plank snaps. He falls** onto the deck below, and the camera shakes. *(He lives.)*
- **The aftermath on the sidewalk:** the foreman docks him ("No pay for an injured man"). Who pays the doctor depends on Choice 5:
  - *Went along:* Quinn arrives with a doctor and holds his job. "Tammany takes care of its own."
  - *Refused:* nobody from the club comes. The **Società di Mutuo Soccorso** (Italian mutual aid society) pays.
  - *Told Haskins:* Haskins runs to print the story, and the Società pays the doctor.
- **The Courier office.** The Editor asks the student to decide.
  - **CHOICE 6: the endorsement.** Grant, Hewitt, or Erhardt. `endorse_grant` / `endorse_hewitt` / `endorse_erhardt`

### VI. Election Night (Tuesday, November 6; about 5 min)
- **Printing House Square at night:** crowds, torches, and returns posted ward by ward on bulletin boards in front of the newspaper offices.
- **The result, as in history:** Grant (Tammany) wins with about 114,000 votes, Erhardt about 73,000, and Mayor Hewitt comes **third** with about 72,000.
- **The characters gather.** Their reactions depend on the student's endorsement and earlier choices:
  - Novak arrives with his son Tomas, *if the telegram was paid*.
  - Giuseppe has his arm in a sling, with Quinn or with the Società man.
  - Rivka arrives with Esther or alone.

### Wrap-Up B (about 3 min)
- The evidence chart, then the printed front page with the **endorsement headline**.
- **"What became of them,"** built from the choices. Each fate ends with a real future event:
  - **Rivka:** the 1909 Uprising of the 20,000 shirtwaist workers.
  - **Sarah:** New York's 1903 child-labor law.
  - **Giuseppe:** stays or goes home.
  - **Novak:** Chicago, or Bohemia.

---

## Choice and flag map (for the teacher)

| # | Where | Flag(s) | Pays off |
|---|---|---|---|
| 1 | Castle Garden: Novak | `paid_telegram` | Day 2 letter, or reunion on election night |
| 2 | Castle Garden: gate | `swindled` / `shortchanged` / `safe` | Moishe's greeting, society loan, family debt in Day 2 |
| 3 | Wrap-Up A: front page | `printed_sarah` | Moishe and Kessler in Day 2; Sarah's epilogue |
| 4 | Hester St: union card | `rivka_union` / `rivka_wait` | Rivka's job, election-night scene, epilogue |
| 5 | Park Row: Quinn's demand | `gius_refuse` / `gius_repeat` / `gius_expose` | Who helps after the fall; epilogue |
| 6 | Courier office | `endorse_grant` / `endorse_hewitt` / `endorse_erhardt` | Headline; characters' reactions on election night |
| 7 | Hester St: Kessler docks Chana | `shot_kessler` / `spoke_kessler` | A photograph ("The Docked Pay") or Chana's ten cents; the ending |
| 8 | Park Row: Giuseppe on the sidewalk | `shot_fall` / `helped_fall` | A photograph ("The Fall") or his hand; the Editor's reaction; the ending |

There are no wrong answers. Every choice costs someone something. That is the discussion.

## Historical notes for this storyline
- **United Hebrew Trades:** founded in New York in October 1888. Esther Lipsky is fictional.
- **The 1888 mayoral race:**
  - Hugh J. Grant (Tammany Democrat) defeated Joel B. Erhardt (Republican) and Mayor Abram Hewitt.
  - In March 1888, Hewitt refused to review the St. Patrick's Day parade and refused to fly the Irish flag over City Hall. Irish voters turned against him.
- **"Repeaters":** men paid to vote more than once, or under the names of dead or absent voters. This was a well-documented machine tactic.
- **Election-night returns:** posted on bulletin boards outside the Park Row newspaper offices to huge crowds. The large projected screens of later elections came a few years after 1888.
- **Mutual aid:** Italian *società di mutuo soccorso* gave sick and injury pay to members.
- **Women** could not vote in New York elections until 1917. **Chinese immigrants** could not become citizens until 1943.
