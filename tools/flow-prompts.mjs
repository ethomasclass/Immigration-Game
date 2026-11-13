// Build the Google Flow character-art prompt pack.
//   node tools/flow-prompts.mjs           writes docs/CHARACTER_ART_PROMPTS.md
//   node tools/flow-prompts.mjs --check   exits 1 if the doc on disk is out of date
//
// Every image in the doc is one complete prompt in its own code block, built
// here from shared style text plus one entry per character, so nothing drifts.
// The script reads js/data/characters.js and the CROWD list in
// js/engine/world.js, and stops with an error if any character id has no
// prompt entry (or a prompt entry has no character).
//
// To change the art direction, edit the SHARED TEXT section.
// To change one character, edit that entry in CAST.
// To change who gets expression close-ups, edit EXPRESSIVE and FACES.
import { readFileSync, writeFileSync } from 'node:fs';
import { CHARACTERS } from '../js/data/characters.js';

const OUT = new URL('../docs/CHARACTER_ART_PROMPTS.md', import.meta.url);
const WORLD = new URL('../js/engine/world.js', import.meta.url);

// ============================================================================
// MAIN CHARACTERS WHO GET TWO EXPRESSION CLOSE-UPS
//   portrait_<id>_up.png    their good moment
//   portrait_<id>_down.png  their bad moment
// Each id here needs an entry in FACES below.
// ============================================================================
export const EXPRESSIVE = [
  'rivka', 'mama', 'shmuel', 'giuseppe', 'novak', 'moishe', 'chana', 'girl', 'kessler', // Day 1
  'esther', 'boss', 'brennan', 'lee',                                                    // Day 2
];

// Ids in characters.js that need no art, with the reason.
const NO_ART = {
  narrator: 'voice only; the dialogue box hides the portrait for narration',
};

// The first image generated. Every later full-body prompt can use it as a style guide.
const ANCHOR = 'rivka';

// ============================================================================
// SHARED TEXT (identical in every prompt)
// ============================================================================
const KEY = '#00B140';

const STYLE =
  'Style: a hand-inked illustration like the figure on an 1890s Art Nouveau tarot card, drawn without the card. ' +
  'Confident black ink linework with varied line weight, and one bold, unbroken dark ink outline around the whole silhouette of the figure and anything held. ' +
  'Flat cel-shaded color with soft watercolor texture and fine paper grain inside the figure only. ' +
  'Flowing Art Nouveau curves in the hair and fabric folds. ' +
  'Muted vintage palette: ochre gold, deep teal blue, brick red, brownish olive, warm cream, sepia brown, ink black. ' +
  'Soft, even light with no dramatic shadows.';

const BACKGROUND =
  `Background: one perfectly flat, solid green, hex ${KEY} (green-screen green), exactly the same in every corner. ` +
  'No gradient, texture, scenery, ground line, floor, shadow under the feet or glow around the figure. ' +
  'Nothing on the figure or the held object is bright green.';

const ACCURACY =
  'Accuracy: New York City, 1888. Clothing, hair and objects are correct for this person\'s work and means in that year, with nothing modern (no zippers, no wristwatches). ' +
  'A dignified, humane portrait of one specific person with a believable face and natural proportions; no caricature and no exaggerated ethnic features. ' +
  'Suitable for a middle-school classroom.';

const DO_NOT_ADD =
  'Do not add: any card frame, border, banner, title, numeral, signature, watermark or readable lettering (papers and books show only illegible ink marks); ' +
  'any second person, animal, furniture or scenery.';

const COMPOSITION_BODY =
  'Composition: one person only, standing, turned slightly three-quarters toward the viewer, centered. ' +
  'The whole figure is visible from the top of the head or hat to the soles of the shoes and fills about 85 percent of the image height, with the feet near the bottom and plain background on all four sides; nothing is cut off. ' +
  'The arms and the held object stay close to the body and below the top of the head, with no background showing through gaps between the arms and the body.';

const COMPOSITION_FACE =
  'Composition: a bust portrait from mid-chest up, one person only, head turned slightly three-quarters toward the viewer, centered. ' +
  'The whole head and any hat or headscarf fit inside the image with plain background above and on both sides; only the bottom edge crops the figure, straight across the chest. ' +
  'No hands and no held object. ' +
  'The expression is easy to read at small size but natural, not cartoonish.';

const STYLE_GUIDE_LINE =
  'If a reference image is attached, use it only as a style guide: match its linework, coloring and palette, but draw the different person described here.';

const SAME_PERSON_LINE =
  'Use the attached reference image. It is the approved full-body illustration of this same character: keep the identical face, age, hair, headwear, clothing, colors and drawing style.';

const BACKGROUND_FIGURE_LINE =
  'This is a background figure: a simple, relaxed pose, an everyday expression, and a little less detail than a main character.';

// ============================================================================
// THE CAST
//   who:   who they are and what they wear, head to feet (no held object here,
//          because the close-ups reuse this text)
//   pose:  how they stand (optional)
//   holds: the one symbolic object (optional; background passersby have none)
//   real:  true for a real historical person
// ============================================================================
const CAST = {
  // ---------------------------------------------------------------- Day 1 main characters
  rivka: {
    who: 'Rivka Abramowitz, a 16-year-old Jewish girl from a small town near Kiev in the Russian Empire, just arrived in steerage. Slim, with a thoughtful oval face, dark brown eyes and dark brown hair in one long braid under a faded brick-red and ochre kerchief tied beneath her chin. She wears a plain cream cotton blouse buttoned to the neck, a gray hand-knitted shawl crossed over her shoulders, a long plum-brown wool skirt to her ankles and worn black lace-up boots.',
    pose: 'She stands straight and looks directly at the viewer, tired but determined.',
    holds: 'She holds a folded letter pressed to her chest with both hands.',
  },
  mama: {
    who: 'Mrs. Abramowitz, a Jewish widow in her mid-40s from the Russian Empire, Rivka\'s mother. A kind, lined face with dark eyes; a married woman\'s dark headscarf covers all of her hair. She wears a dark high-necked bodice, a long black wool skirt to the ground, a heavy fringed charcoal shawl and worn black boots.',
    pose: 'She stands a little stooped, gentle and anxious.',
    holds: 'She cradles a brass Sabbath candlestick, half wrapped in a cream cloth, against her chest.',
  },
  shmuel: {
    who: 'Shmuel Abramowitz, an 8-year-old Jewish boy from the Russian Empire, small and thin with a young child\'s proportions. Round brown eyes, and brown hair poking out from under a cloth cap that is too big for him. He wears a short brown wool jacket with sleeves a little too long, knee-length trousers, long dark stockings and scuffed ankle boots.',
    pose: 'He stands with his feet together, looking up at the viewer with open curiosity.',
    holds: 'He hugs a small hand-carved wooden toy horse to his chest.',
  },
  giuseppe: {
    who: 'Giuseppe Russo, a 24-year-old laborer from Calabria in southern Italy. Strong and lean, with warm sun-browned skin, dark curly hair, a thick dark mustache and brown eyes. He wears a soft brown felt hat pushed back on his head, a brick-red neckerchief, a collarless cream shirt open at the neck, a brown corduroy vest and trousers, and sturdy work boots.',
    pose: 'He stands with easy, cheerful confidence, grinning.',
    holds: 'He holds up one ripe yellow lemon, without leaves, in his right hand at chest height, as if about to toss it to the viewer.',
  },
  novak: {
    who: 'Anton Novak, a dignified 72-year-old weaver from Bohemia. Thin and slightly bent, with a long lined face, a full white mustache, white hair and gray eyes. He wears an old round-crowned black felt hat, a worn black wool coat buttoned high, a dark knitted scarf, dark trousers and cracked but carefully polished boots.',
    pose: 'He stands quietly with his shoulders a little hunched, as if cold, with a patient, sad look.',
    holds: 'In both hands, close to his chest, he holds a small half-carved wooden horse.',
  },
  moishe: {
    who: 'Moishe Abramowitz, a 34-year-old Jewish tailor on Hester Street. Thin and overworked, with hollow cheeks, kind tired eyes, a short dark beard and a black skullcap. He wears a collarless cream shirt with the sleeves rolled to the elbow, a dark charcoal vest, a cloth tape measure hanging around his neck, dark trousers and worn shoes.',
    pose: 'He stands with shoulders slightly rounded from years at the sewing machine, with a small welcoming smile.',
    holds: 'He holds a large pair of iron tailor\'s shears, closed and pointing down, in one hand against his vest.',
  },
  chana: {
    who: 'Chana Abramowitz, a 32-year-old Jewish garment finisher, Moishe\'s wife. Quick, practical and tired, with sharp dark eyes; a dark headscarf knotted at the back covers her hair. She wears a wine-red blouse with the sleeves pushed up, a long dark skirt to the ankles, a long cream work apron with pins stuck along the bib, and black boots.',
    pose: 'She stands upright and alert, as if she has only a moment to spare.',
    holds: 'A half-finished dark wool coat sleeve is draped over her left forearm, and her right hand holds a threaded needle against it.',
  },
  girl: {
    who: 'Sarah, a shy 10-year-old Jewish girl, the daughter of a Hester Street tailor, small with a child\'s proportions. Large dark eyes and two neat dark braids tied with scraps of ribbon. She wears a faded gray-blue pinafore dress over a cream blouse, dark stockings and black button boots.',
    pose: 'She stands with her feet together and her head slightly ducked, with a shy half-smile.',
    holds: 'She holds a small card of sewn-on buttons in both hands in front of her.',
  },
  kessler: {
    who: 'Mr. Kessler, a garment contractor in his mid-40s, a Jewish immigrant who arrived in 1872 and worked his way up from the sewing table. Stocky, with a tired, guarded face, pouches under his eyes and a trimmed dark beard going gray. He wears a black derby hat, a dark charcoal overcoat with a worn velvet collar, a waistcoat with a plain watch chain, dark trousers and sturdy shoes: better dressed than his workers, but not rich.',
    pose: 'He stands squarely, brusque and impatient, but human, not a villain.',
    holds: 'He carries a stack of three folded dark wool coats over one forearm.',
  },
  riis: {
    real: true,
    who: 'Jacob Riis, the Danish-born New York police reporter and photographer, aged about 39, drawn from his archival photographs: an oval face with a high forehead, light brown hair, a thick drooping mustache and small round wire-rimmed spectacles. He wears a black derby hat, a brown wool sack suit with a waistcoat, a stiff white collar with a dark tie, and sturdy walking shoes.',
    pose: 'He leans forward a little, energetic and earnest.',
    holds: 'He holds a wooden box camera with a brass lens in both hands at chest height.',
  },

  // ---------------------------------------------------------------- Day 1, Chapter I: Steerage
  steward: {
    who: 'Mr. Pryce, a gruff 45-year-old Welsh steward on an 1880s transatlantic steamship. Weathered face, short graying beard, steady eyes. He wears a peaked navy cap, a navy double-breasted jacket with brass buttons, dark trousers and heavy black shoes.',
    pose: 'He stands with his feet apart, as if on a moving deck.',
    holds: 'He holds a brass oil lantern by its top, close against his side.',
  },
  weber: {
    who: 'Herr Weber, a serious 55-year-old farmer from Pomerania in Germany. Broad and weathered, with gray side-whiskers and a gray beard, and large work-worn hands. He wears a low-crowned black felt hat, a dark blue wool coat, a waistcoat with a watch chain, dark trousers and heavy boots.',
    pose: 'He stands stiff and upright, slow and a little stubborn.',
    holds: 'He holds a small sheaf of ripe golden wheat, tied with twine, against his chest.',
  },
  fraweber: {
    who: 'Frau Weber, a 50-year-old German farm wife from Pomerania. A plain, sensible face; gray-blond hair in a tight bun under a black bonnet tied at the chin. She wears a long brown wool dress to the ground, a cream apron, a dark knitted shawl and black boots.',
    pose: 'She stands calmly with her elbows tucked in.',
    holds: 'She holds a round loaf of dark rye bread, wrapped in a cloth, in both hands.',
  },

  // ---------------------------------------------------------------- Day 1, Chapter II: Castle Garden
  doctor: {
    who: 'Dr. Hale, a brisk 55-year-old American physician inspecting immigrants at Castle Garden. Bareheaded, with thinning gray hair, a neat gray mustache and pince-nez spectacles. He wears a black frock coat, a white shirt with a stiff collar, a dark cravat, dark trousers and black shoes.',
    pose: 'He stands straight and official, looking the viewer over.',
    holds: 'He holds a small brass hand lens in one hand at chest height.',
  },
  clerk: {
    who: 'Mr. Briggs, a tired 30-year-old New York registration clerk. Bareheaded, with center-parted brown hair, a small mustache and ink-stained fingers. He wears a white shirt with sleeve garters, a dark waistcoat, a narrow tie, dark trousers and black shoes.',
    pose: 'He stands a little slumped, fast-moving but not unkind.',
    holds: 'He holds a large open ledger against his chest with one arm and a steel dip pen in the other hand.',
  },
  agent: {
    who: 'Miss Carver, a patient 32-year-old American woman who runs the information desk at Castle Garden. A calm, clear-eyed face; brown hair pinned up under a small dark bonnet. She wears a high-collared navy dress with a bustle and long sleeves, a small ribbon brooch at the throat, and black boots just visible under the hem.',
    pose: 'She stands composed and attentive.',
    holds: 'She holds a folded hand-drawn street map in both hands in front of her.',
  },
  runner: {
    who: '"Smiling" Jack Doyle, a 30-year-old boardinghouse runner who preys on new arrivals at the dock. A too-wide grin, quick eyes, slicked hair. He wears a derby hat tilted back, a loud checked suit in ochre and brown, a brick-red waistcoat with a flashy watch chain, and pointed shoes.',
    pose: 'He leans slightly toward the viewer, overly friendly.',
    holds: 'He holds a fan of small blank boardinghouse cards in one hand at chest height.',
  },
  changer: {
    who: 'A slick street money changer of about 40 who works outside the gate of Castle Garden. Oiled dark hair, a thin mustache and a smooth half-smile. He wears a black derby hat, a long mustard-brown overcoat, a dark waistcoat, striped trousers and polished shoes.',
    pose: 'He stands close and confiding, head tilted.',
    holds: 'He holds out a cupped palm full of mixed foreign coins at chest height.',
  },

  // ---------------------------------------------------------------- Day 1, Chapter III: The Lower East Side
  boarder: {
    who: 'Yankel, a sleepy 20-year-old Jewish baker\'s apprentice who boards with a tailor\'s family. Heavy-lidded eyes, a wispy first beard, flour dusting his sleeves. He wears a cloth cap, a rumpled cream shirt, suspenders, dark trousers and worn shoes.',
    pose: 'He stands drowsily, shoulders loose, in the middle of a small yawn.',
    holds: 'He hugs a round loaf of bread against his chest with one arm.',
  },
  peddler: {
    who: 'Mrs. Leah Gold, a loud, funny 45-year-old Jewish pushcart peddler on Hester Street. A broad, lively face with sharp, humorous eyes; a patterned headscarf in brick red and cream covers her hair. She wears a dark blouse with the sleeves rolled up, layered long skirts, a work apron with a leather money pouch at the waist, and sturdy boots.',
    pose: 'She stands planted and confident, chin up, in the middle of calling out her prices.',
    holds: 'She holds up a short braided string of golden-brown onions in one hand, close to her shoulder.',
  },
  peddler2: {
    who: 'Herschel, a 55-year-old Jewish pushcart peddler who was a teacher in the old country. A gentle, scholarly face, a long gray beard and small spectacles. He wears a round black hat, a long dark coat, dark trousers and worn boots.',
    pose: 'He stands a little bowed, patient and mild.',
    holds: 'He holds a short stack of nested tin pots against his chest with both hands.',
  },
  newsboy: {
    who: 'Tony, an 11-year-old Italian-American newsboy in New York, wiry with a child\'s proportions. A big gap-toothed grin, dark hair and quick dark eyes. He wears an oversized cloth cap pushed back, a patched brown jacket, knee-length trousers, dark stockings and scuffed boots.',
    pose: 'He stands on the balls of his feet, mouth open in the middle of a shout.',
    holds: 'He clutches a thick bundle of folded newspapers under one arm, against his side.',
  },
  rabbi: {
    who: 'Mr. Kaplan, the warm, formal 65-year-old secretary of a Jewish mutual aid society. Kind eyes and a full white beard. He wears a black wide-brimmed hat, a long black frock coat, a dark waistcoat, dark trousers and black shoes.',
    pose: 'He stands with quiet dignity, head inclined in welcome.',
    holds: 'He holds a small leather-bound dues book against his chest with both hands.',
  },
  priest: {
    who: 'Father Morelli, a gentle 55-year-old Italian Catholic priest in a parish on Mott Street. Bareheaded, with graying dark hair and a mild, thoughtful face. He wears a long black cassock with a row of small buttons down the front, a white clerical collar and black shoes.',
    pose: 'He stands calmly with his hands together in front of him.',
    holds: 'A rosary of dark wooden beads hangs from his joined hands, lying against his cassock.',
  },
  lee: {
    who: 'Mr. Lee Fong, a calm, careful 45-year-old Chinese merchant who keeps a shop on Mott Street. A composed, intelligent face; his hair is worn in a long queue (a single braid down the back) under a round black silk cap. He wears a dark blue silk jacket with knotted cloth buttons, loose dark trousers, white socks and black cloth shoes.',
    pose: 'He stands upright and still, courteous and a little guarded.',
    holds: 'He holds a small round tin tea canister in both hands at waist height.',
  },
  brennan: {
    who: 'Mrs. Brennan, a proud, sharp-tongued 55-year-old Irish-American woman, the daughter of Famine immigrants. A strong face with a firm mouth; graying red hair under a black bonnet tied at the chin. She wears a long dark slate-blue dress to the ground, a plaid shawl in brick red, cream and black, and black boots.',
    pose: 'She stands with her chin raised and her arms folded tightly across her chest.',
    holds: 'A rolled-up paper handbill is tucked in the crook of her folded arm.',
  },
  guild: {
    who: 'Mr. Whitcomb, an earnest 24-year-old college-educated volunteer at a settlement house. Bareheaded, clean-shaven, with neatly parted light brown hair and round spectacles. He wears a brown tweed suit, a waistcoat, a high starched white collar with a dark tie, and polished brown shoes.',
    pose: 'He stands tall and eager, leaning in slightly to listen.',
    holds: 'He holds a small stack of three books against his side under one arm.',
  },
  boss: {
    who: 'Mr. Quinn, a booming 45-year-old Irish-American ward boss for the Tammany Hall political machine. Big, broad and heavy-set, with red cheeks and a large walrus mustache. He wears a black derby hat, a black frock coat, a waistcoat stretched over a large belly with a gold watch chain across it, dark trousers and polished shoes.',
    pose: 'He stands wide and jovial, with a generous grin, as if greeting a crowd.',
    holds: 'He holds out a small burlap sack of coal in one hand at waist height, offering it to the viewer.',
  },

  // ---------------------------------------------------------------- Day 2, Chapter IV: One Week Later
  esther: {
    who: 'Esther Lipsky, a 19-year-old Jewish garment worker and union organizer. A strong, open face with dark eyes; bareheaded, with dark hair pinned up in a loose bun and a few strands escaping. She wears a cream high-collared shirtwaist, a short brick-red wool jacket, a long dark skirt to the ankles and black lace-up boots.',
    pose: 'She stands tall with her chin lifted, speaking to a crowd.',
    holds: 'She holds up a small paper union card in one hand, beside her shoulder.',
  },

  // ---------------------------------------------------------------- Day 2, Chapter V: Park Row
  oldrep: {
    who: 'Mr. Haskins, a dry-humored 62-year-old newspaper reporter with thirty years on Park Row. A lined, skeptical face, a gray mustache and one raised eyebrow. He wears a brown derby hat with a pencil tucked behind his ear, a rumpled brown suit, a loosened tie and scuffed shoes.',
    pose: 'He stands slouched and unhurried, with a knowing look.',
    holds: 'He holds a folded newspaper against his chest with one hand.',
  },
  plunkitt: {
    real: true,
    who: 'George Washington Plunkitt, the Tammany Hall district leader, aged about 46, drawn respectfully from his archival photographs: a stout, broad-shouldered Irish-American man with a square face, a thick mustache and shrewd, good-humored eyes. He wears a black silk top hat, a black frock coat, a waistcoat with a gold watch chain, a high white collar with a dark cravat, dark trousers and polished shoes.',
    pose: 'He stands relaxed and folksy, with a confident half-smile, pleased with his own joke.',
    holds: 'He holds an unlit cigar between two fingers of one hand at chest height.',
  },
  foreman: {
    who: 'Mr. Halvorsen, a loud, proud 45-year-old Norwegian construction foreman. Tall and solid, with a blond beard going gray and a wind-reddened face. He wears a flat cloth cap, a tan canvas work coat over a dark vest, heavy trousers and mud-caked boots.',
    pose: 'He stands with his feet apart, in charge.',
    holds: 'He holds a rolled building plan in one hand against his chest.',
  },
  hodcarrier: {
    who: 'Dominic, an Italian hod carrier in his 30s on a tall building site. Wiry and strong, with dark stubble, a wry tired smile and brick dust on his clothes. He wears a flat cloth cap, a collarless cream shirt with the sleeves rolled, a worn tan vest, patched trousers and heavy boots.',
    pose: 'He stands braced under the weight, a little out of breath.',
    holds: 'On one shoulder he balances a wooden brick hod (a V-shaped trough on a short pole) loaded with red bricks, held tight against his neck and no higher than the top of his cap.',
  },
  elevator: {
    who: 'A cheerful 18-year-old elevator operator in a new office tower. Fresh-faced and eager, with neatly combed brown hair. He wears a round plum-colored uniform cap, a short plum-colored uniform jacket with two rows of brass buttons, dark trousers, white gloves and polished black shoes.',
    pose: 'He stands at attention with a practiced smile.',
    holds: 'He raises one gloved hand in front of his chest with the index finger pointing up, as if calling "Going up".',
  },
  societa: {
    who: 'Signor Bellini, a calm, fatherly man in his 50s from southern Italy, an officer of an Italian mutual aid society. Warm sun-browned skin, a gray mustache and dark hair graying at the temples. He wears a soft black felt hat, a carefully brushed dark brown suit with a waistcoat, a small brick-red and cream ribbon rosette pinned to his lapel, and polished black shoes.',
    pose: 'He stands steady and reassuring.',
    holds: 'He holds a small leather coin purse in both hands in front of him.',
  },
  editor: {
    who: 'The editor of a New York evening newspaper, a heavyset man in his 50s, gruff but warm. Bareheaded, with iron-gray hair, a trimmed gray beard and spectacles pushed up on his forehead. He wears a white shirt with the sleeves rolled up and black sleeve protectors, a dark waistcoat, a loosened cravat, dark trousers and black shoes; his fingers are smudged with ink.',
    pose: 'He stands solidly, studying the viewer with a measured look.',
    holds: 'He holds a long printed proof sheet in one hand against his chest.',
  },
  driver: {
    who: 'Mike, an impatient, funny 32-year-old Irish-American horsecar driver. A ruddy, wind-chapped face and reddish-brown side-whiskers. He wears a wool cap with a small brass badge, a heavy dark blue coat, a knitted scarf, thick gloves, dark trousers and boots.',
    pose: 'He stands with his weight on one leg, grinning sideways.',
    holds: 'He holds a short leather driving whip upright against his shoulder, no higher than his cap.',
  },
  elguard: {
    who: 'A gruff elevated-railway guard of about 35. A square jaw and a dark mustache. He wears a peaked dark blue cap with a brass badge, a dark blue uniform coat with brass buttons, dark trousers and black boots.',
    pose: 'He stands with his mouth open, calling out the next stop, one hand cupped beside his mouth.',
    holds: 'In his other hand he holds a railway signal lantern low against his side.',
  },
  keeper: {
    who: 'A 55-year-old Scottish keeper in Central Park, strict but kind. A gray beard and watchful eyes. He wears a gray uniform cap with a small brass badge, a long gray uniform coat with brass buttons, gray trousers and black boots.',
    pose: 'He stands very straight, with one hand behind his back.',
    holds: 'He holds a brass whistle on a cord in front of his chest, ready to blow it.',
  },

  // ---------------------------------------------------------------- Day 2, Chapter VI: Election Night
  bulletin: {
    who: 'A theatrical man in his 30s who calls out the election returns to the crowd outside the newspaper offices. A big chest, a booming open mouth and a waxed mustache. He wears a brown derby hat, a brown checked suit, an ochre waistcoat, a bow tie and polished shoes.',
    pose: 'He stands with his chest out, in the middle of a shout.',
    holds: 'He holds a large tin megaphone in both hands at chest height, just lowered from his mouth, so that his face is fully visible.',
  },
  tomas: {
    who: 'Tomas Novak, a very tall, lean Czech-American man in his 40s who has just arrived from Chicago after two days on a train. A gentle, overwhelmed face, a red mustache and red-brown hair. He wears a soft dark felt hat, a travel-creased brown overcoat over a plain work suit, a wool scarf and dusty boots.',
    pose: 'He stands slightly stooped, as tall men do, looking tired and deeply relieved.',
    holds: 'He holds a crumpled telegram form against his chest with one hand.',
  },

  // ---------------------------------------------------------------- Background figures
  worker0: {
    background: true,
    who: 'A bricklayer of about 30 on an 1888 building site. He wears a flat cloth cap, a tan canvas jacket spattered with mortar, a collarless shirt, patched trousers and heavy boots.',
    holds: 'He holds a mason\'s trowel in one hand, flat against his thigh.',
  },
  worker1: {
    background: true,
    who: 'An ironworker of about 35 on an 1888 building site, broad-shouldered. He wears a flat cloth cap, a gray work jacket over a collarless shirt, a leather apron, heavy trousers and boots.',
    holds: 'He holds a heavy iron hammer in both hands across the front of his body.',
  },
  lamplighter: {
    background: true,
    who: 'A New York City lamplighter of about 40 who lights the gas street lamps at dusk. He wears a flat cloth cap, a dark blue-gray wool coat, a scarf, dark trousers and boots.',
    holds: 'A short wooden ladder is slung flat against his back and side, so that his coat shows between the rungs, and in one hand he holds a brass-tipped lighting pole upright against his shoulder, reaching no higher than his cap.',
  },
  child0: {
    background: true,
    who: 'A boy of about 8 playing in the street, small with a young child\'s proportions and a bright, friendly face. He wears a cloth cap, a patched brown jacket, knee-length trousers, dark stockings and scuffed boots.',
    holds: 'He holds a small wooden spinning top and its string in both hands in front of him.',
  },
  crowd0: {
    background: true,
    who: 'A working man of about 35 walking along a Lower East Side street. He wears a flat cloth cap, a worn brown wool jacket, a collarless shirt, dark trousers and scuffed boots. His hands hang at his sides.',
  },
  crowd1: {
    background: true,
    who: 'A woman of about 40 out shopping on a Lower East Side street. A dark headscarf covers her hair. She wears a dark shawl, a long dark skirt to the ankles and worn boots, and carries a covered wicker basket held against her front with both arms.',
  },
  crowd2: {
    background: true,
    who: 'An Italian laborer of about 30 with a dark mustache and warm sun-browned skin. He wears a soft dark felt hat, a dark gray vest over a collarless cream shirt, a neckerchief, dark trousers and work boots. His hands hang at his sides.',
  },
  crowd3: {
    background: true,
    who: 'A woman of about 60 with gray hair under a black bonnet tied at the chin. She wears a long brown dress to the ground, a dark shawl and black boots. Her hands are clasped in front of her.',
  },
  crowd4: {
    background: true,
    who: 'An office clerk of about 30, clean-shaven. He wears a black derby hat, a dark suit with a waistcoat, a stiff white collar with a narrow tie, and polished black shoes. His hands hang at his sides.',
  },
  crowd5: {
    background: true,
    who: 'A street child of about 9, small with a child\'s proportions and a watchful, friendly face. The child wears a cloth cap, a ragged brown jacket that is too big, and knee-length trousers, and is barefoot. The hands are tucked into the jacket pockets.',
  },
  crowd6: {
    background: true,
    who: 'A young working woman of about 22, bareheaded, with brown hair pinned up. She wears a plain long dress in muted plum with a high collar and long sleeves, and black boots. Her hands are clasped in front of her.',
  },
  crowd7: {
    background: true,
    who: 'A bearded man of about 50 with a tired, thoughtful face. He wears a flat cloth cap, a long gray wool coat buttoned to the neck, dark trousers and worn boots. His hands are in his coat pockets.',
  },
};

// ============================================================================
// EXPRESSIONS for the EXPRESSIVE cast, taken from what happens to each
// character in docs/STORY.md and js/data/dialogue.js.
//   up:   the good moment     down: the bad moment
// ============================================================================
const FACES = {
  rivka: {
    up: 'The moment she is handed the photograph of her family and knows her grandmother will see they are alive. A wide, relieved, slightly disbelieving smile, eyes bright and wet with happy tears, chin lifted, looking at the viewer.',
    down: 'The moment she admits her boss has held back two weeks of pay, and that signing a union card could cost her the job that feeds her family. Brows drawn together, lips pressed tight, tired shadows under her eyes; her gaze is worried but steady on the viewer. Afraid, but stubborn, and not crying.',
  },
  mama: {
    up: 'The moment the doctor at Castle Garden waves her coughing son through. She weeps with relief: eyes squeezed half shut and brimming, a trembling open smile, brows lifted, all the fear leaving her face.',
    down: 'The night on the ship when she begs the photographer not to tell anyone about her son\'s cough. Frightened and pleading: brows raised and knotted, eyes wide and fixed on the viewer, lips parted in the middle of a whisper.',
  },
  shmuel: {
    up: 'The moment he shows off his new wooden horse and asks whether the streets in America are really made of gold. A huge gap-toothed grin, eyebrows high, eyes wide with wonder, looking up at the viewer.',
    down: 'The moment he coughs in front of the inspecting doctor and looks to his mother. Frightened: eyes wide and glassy, lips pressed shut as he tries to hold the cough in, chin tucked down, shoulders hunched up toward his ears. Close to tears, but not crying.',
  },
  giuseppe: {
    up: 'The moment he shouts down from the eleventh floor of the building he is helping to raise, "I am a big man in America now!" A big open laughing grin under his mustache, eyes crinkled, head tipped back a little; proud and full of joy.',
    down: 'The moment he sits on the sidewalk after his fall from the scaffold, his arm broken, and hears there is no pay for an injured man. His face is pale and tight with pain, jaw clenched, brows knotted, eyes anxious and searching the viewer\'s face; brick dust on his hat and shoulders and one small scrape on his cheekbone. Hurt and scared; no blood.',
  },
  novak: {
    up: 'Election night, when he stands in the crowd holding the arm of the son he crossed the ocean to find. Pure delight: eyes crinkled almost shut, a broad smile under his white mustache, cheeks lifted, in the middle of a laugh.',
    down: 'The detention bench at Castle Garden, each time the door opens and it is not his son. Quiet, patient sorrow: his eyes look away to one side, as if toward a door, brows gently raised in the middle, mouth closed and still. Dignified; no tears.',
  },
  moishe: {
    up: 'Election night, just after he has voted for the first time in his life as a new citizen. Beaming with pride: chin up, eyes shining, a wide amazed smile lighting his tired face.',
    down: 'The moment he begs the photographer not to print his daughter\'s face in the newspaper, because the family could lose its work. Worried and wounded: brows drawn, eyes fixed on the viewer, mouth tight; a man asking for something he fears he will not get.',
  },
  chana: {
    up: 'A rare Sunday in Central Park, watching her daughter run free. A soft, unguarded smile, eyes warm and relaxed, face lifted to the sun; for a moment the tiredness is gone.',
    down: 'The moment the contractor docks her pay for a "crooked" seam that is perfectly straight, and she has to stay silent to keep the work. Swallowed fury: lips pressed white, nostrils flared, jaw set, eyes lowered to one side and bright with angry tears she will not let fall.',
  },
  girl: {
    up: 'The moment she proudly shows how many buttons she has already sewn after school. A shy, pleased smile, eyebrows lifted, eyes bright, head slightly ducked as she looks up at the viewer.',
    down: 'The moment she thinks she may be in trouble with the grown-ups. Anxious: large uncertain eyes looking up from under her brows, lower lip caught between her teeth, shoulders drawn in. Worried, but not crying.',
  },
  kessler: {
    up: 'A rare unguarded moment, when he remembers arriving in 1872 with nothing and sewing in a tenement room for nine years himself. A weary, rueful half-smile, eyes softened and tired, eyebrows slightly raised, his guard down.',
    down: 'The moment he defends holding back his workers\' pay: "You want a villain for your newspaper?" Defensive and angry: brows pulled low, eyes hard and narrowed at the viewer, mouth open in the middle of an argument, jaw pushed forward. A cornered, tired man, not a cartoon villain.',
  },
  esther: {
    up: 'On her soapbox, calling out to the garment workers, "Alone, they cheat us one by one. Together, they cannot!" Fierce, joyful conviction: mouth open in the middle of a shout, eyes blazing, chin high, brows lifted. Inspiring, not angry.',
    down: 'Speaking quietly, one to one, when she admits she is afraid of arrest and talks about her mother\'s hands, ruined by thirty years of sewing. Somber: eyes lowered and a little wet, brows drawn softly together, lips pressed closed, the fire banked.',
  },
  boss: {
    up: 'Handing out free coal before the election, and later celebrating a win in every ward. An enormous booming grin under his walrus mustache, round red cheeks, twinkling eyes, head thrown back a little: a man everybody likes.',
    down: 'The moment he tells the photographer, very quietly, that Tammany has a long memory. The smile is gone: his face is cold and still, eyes narrowed and fixed on the viewer, head lowered a little, jaw set. A quiet threat, not shouting.',
  },
  brennan: {
    up: 'Election night, when the son of Irish immigrants has just been elected mayor. Beaming triumph: chin lifted, eyes shining, a broad proud smile, delighted and a little smug.',
    down: 'The moment she is asked whether people once said the same hard things about the Irish that she now says about the newcomers. Stung and defensive: lips pursed tight, chin raised, eyes narrowed and sliding away from the viewer, a flush on her cheeks; pride covering an old hurt.',
  },
  lee: {
    up: 'Welcoming a customer into his shop. A small, courteous smile, eyes calm and attentive on the viewer, head inclined slightly; warm but reserved.',
    down: 'The moment he says the law will never let him vote, and that he has not seen his brother in twenty years. Very still, composed grief: eyes lowered and distant, brows barely drawn, mouth closed in a level line. Dignity holding back sorrow; no tears.',
  },
};

// ============================================================================
// ORDER OF THE DOC (the teacher can stop after any part)
// ============================================================================
const START = ['rivka', 'mama', 'shmuel', 'giuseppe', 'novak', 'moishe', 'chana', 'girl', 'kessler', 'riis'];
const crowdIds = readCrowdIds();

const PARTS = [
  {
    title: 'Part 1. Start here: the Day 1 main characters',
    intro: 'Ten full-body images. These are the people the Day 1 story is about, so with only this part done the first class period already looks finished. Make Rivka first: she becomes the style guide for everyone else.',
    groups: [{ ids: START }],
  },
  {
    title: 'Part 2. Faces for the Day 1 main characters',
    intro: 'Two close-ups each: the character\'s good moment (`_up`) and bad moment (`_down`). The game shows them in the dialogue box when the story turns. For each one, attach **only** that character\'s approved full-body image from Part 1.',
    faces: EXPRESSIVE.filter((id) => START.includes(id)),
  },
  {
    title: 'Part 3. The rest of Day 1',
    intro: 'Everyone else students can meet on the first day, chapter by chapter.',
    groups: [
      { title: 'Chapter I: Steerage', ids: ['steward', 'weber', 'fraweber'] },
      { title: 'Chapter II: Castle Garden', ids: ['doctor', 'clerk', 'agent', 'runner', 'changer'] },
      { title: 'Chapter III: The Lower East Side', ids: ['boarder', 'peddler', 'peddler2', 'newsboy', 'rabbi', 'priest', 'lee', 'brennan', 'guild', 'boss'] },
    ],
  },
  {
    title: 'Part 4. Day 2: Election Week',
    intro: 'The people who first appear on the second day.',
    groups: [
      { title: 'Chapter IV: One Week Later', ids: ['esther'] },
      { title: 'Chapter V: Park Row', ids: ['oldrep', 'plunkitt', 'foreman', 'hodcarrier', 'elevator', 'societa', 'editor', 'driver', 'elguard', 'keeper'] },
      { title: 'Chapter VI: Election Night', ids: ['bulletin', 'tomas'] },
    ],
  },
  {
    title: 'Part 5. Faces for the Day 2 main characters',
    intro: 'Two close-ups each, made the same way as Part 2. Attach **only** that character\'s approved full-body image.',
    faces: EXPRESSIVE.filter((id) => !START.includes(id)),
  },
  {
    title: 'Part 6. Background figures',
    intro: 'Workers, children and passersby with no dialogue. The eight `crowd` figures are reused on every street, so they are worth doing even though they are last.',
    groups: [
      { title: 'Named background figures', ids: ['worker0', 'worker1', 'lamplighter', 'child0'] },
      { title: 'Passersby', ids: crowdIds },
    ],
  },
];

// ============================================================================
// CHECKS: stop loudly if the cast and the prompts have drifted apart
// ============================================================================
function readCrowdIds() {
  const src = readFileSync(WORLD, 'utf8');
  const m = src.match(/const CROWD = \[([\s\S]*?)\n\];/);
  if (!m) fail(['Could not find the CROWD array in js/engine/world.js.']);
  const n = (m[1].match(/^\s*\{/gm) || []).length;
  if (!n) fail(['The CROWD array in js/engine/world.js looks empty.']);
  return Array.from({ length: n }, (_, i) => 'crowd' + i);
}

function fail(problems) {
  console.error('\nflow-prompts: cannot build the prompt pack.\n');
  for (const p of problems) console.error('  - ' + p);
  console.error('\nFix tools/flow-prompts.mjs (CAST, FACES, EXPRESSIVE or PARTS) and run it again.\n');
  process.exit(1);
}

function validate() {
  const problems = [];
  const needed = [...Object.keys(CHARACTERS).filter((id) => !(id in NO_ART)), ...crowdIds];

  for (const id of needed) if (!CAST[id]) problems.push(`Character id "${id}" has no prompt entry in CAST.`);
  for (const id of Object.keys(CAST)) if (!needed.includes(id)) problems.push(`CAST has an entry "${id}" that is not a character id in js/data/characters.js or a crowd id in js/engine/world.js.`);
  for (const id of Object.keys(NO_ART)) {
    if (!CHARACTERS[id]) problems.push(`NO_ART lists "${id}", which is not in js/data/characters.js.`);
    if (CAST[id]) problems.push(`"${id}" is in both NO_ART and CAST.`);
  }

  const placed = PARTS.flatMap((p) => (p.groups || []).flatMap((g) => g.ids));
  for (const id of needed) {
    const n = placed.filter((x) => x === id).length;
    if (CAST[id] && n !== 1) problems.push(`"${id}" appears ${n} times in PARTS (it must appear exactly once).`);
  }
  for (const id of placed) if (!CAST[id]) problems.push(`PARTS lists "${id}", which has no entry in CAST.`);

  if (new Set(EXPRESSIVE).size !== EXPRESSIVE.length) problems.push('EXPRESSIVE lists an id twice.');
  for (const id of EXPRESSIVE) {
    if (!CAST[id]) problems.push(`EXPRESSIVE lists "${id}", which has no entry in CAST.`);
    else if (CAST[id].background) problems.push(`EXPRESSIVE lists "${id}", which is a background figure.`);
    if (!FACES[id] || !FACES[id].up || !FACES[id].down) problems.push(`"${id}" is in EXPRESSIVE but FACES has no up and down expression for it.`);
  }
  for (const id of Object.keys(FACES)) if (!EXPRESSIVE.includes(id)) problems.push(`FACES has "${id}", which is not in EXPRESSIVE.`);
  if (!CAST[ANCHOR] || START[0] !== ANCHOR) problems.push(`The style anchor "${ANCHOR}" must be the first id in START.`);

  // Nothing in the cast may be described as green (the background color), and
  // every piece of text should end as a sentence.
  const texts = [];
  for (const [id, c] of Object.entries(CAST)) for (const k of ['who', 'pose', 'holds']) if (c[k]) texts.push([`CAST.${id}.${k}`, c[k]]);
  for (const [id, f] of Object.entries(FACES)) for (const k of ['up', 'down']) if (f[k]) texts.push([`FACES.${id}.${k}`, f[k]]);
  for (const [where, t] of texts) {
    if (/green|grass|pickle|emerald|lime\b/i.test(t)) problems.push(`${where} mentions something green. The background is green, so nothing on the figure may be.`);
    if (!/[.!?"]$/.test(t.trim())) problems.push(`${where} should end with a full stop.`);
    if (t.includes('`')) problems.push(`${where} contains a backtick, which would break the code block.`);
  }
  for (const [id, c] of Object.entries(CAST)) if (!c.who) problems.push(`CAST.${id} has no "who" description.`);

  if (problems.length) fail(problems);
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================
const fileFor = (id, mood) => `portrait_${id}${mood ? '_' + mood : ''}.png`;

function displayName(id) {
  if (CHARACTERS[id]) return CHARACTERS[id].name;
  return 'Passerby ' + (Number(id.replace('crowd', '')) + 1);
}
function displayRole(id) {
  if (!CHARACTERS[id]) return 'Background';
  return CHARACTERS[id].role;
}

function bodyPrompt(id) {
  const c = CAST[id];
  const subject = [c.who, c.pose, c.holds, c.background ? BACKGROUND_FIGURE_LINE : ''].filter(Boolean).join(' ');
  return [
    'A vertical 9:16 full-body character illustration for a history game.' + (id === ANCHOR ? '' : ' ' + STYLE_GUIDE_LINE),
    'Character: ' + subject,
    COMPOSITION_BODY,
    STYLE,
    BACKGROUND,
    ACCURACY,
    DO_NOT_ADD,
  ].join('\n\n');
}

function facePrompt(id, mood) {
  const c = CAST[id];
  return [
    'A vertical 3:4 head-and-shoulders close-up for a history game. ' + SAME_PERSON_LINE,
    'Character: ' + c.who,
    'Expression (the only thing that changes from the reference image): ' + FACES[id][mood],
    COMPOSITION_FACE,
    STYLE,
    BACKGROUND,
    ACCURACY,
    DO_NOT_ADD,
  ].join('\n\n');
}

const MASTER_BRIEF = [
  'I am making character art for a classroom history game called "The Other Half", set in New York City in 1888. I will send one prompt at a time, and each prompt describes one image. Follow the rules below for every image in this project. Use each of my prompts as written: do not add scenery, borders, text or extra people, and do not change the art style.',
  STYLE,
  BACKGROUND + ' The background will be removed by software, so it must stay flat and clean.',
  'Two kinds of image. (1) Full-body: vertical 9:16, one person standing, slightly three-quarters toward the viewer, centered, visible from the top of the head or hat to the soles of the shoes, feet near the bottom, plain background on all four sides, nothing cut off, arms and the held object close to the body. (2) Close-up: vertical 3:4, one person from mid-chest up, the whole head and hat inside the image, no hands.',
  'Reference images. When I attach an image with a full-body prompt, it is a style guide only: match its linework, coloring and palette, but draw the different person I describe. When I attach an image with a close-up prompt, it is the approved full-body illustration of that same character: keep the identical face, age, hair, headwear, clothing and colors, and change only the expression.',
  ACCURACY,
  DO_NOT_ADD,
  'This message is the project brief only. Do not make an image from this message.',
].join('\n\n');

// ============================================================================
// THE DOC
// ============================================================================
function build() {
  const F = '```';
  const out = [];
  const checklist = [];
  const total = PARTS.reduce((n, p) => n + (p.groups || []).reduce((m, g) => m + g.ids.length, 0) + (p.faces || []).length * 2, 0);
  const bodies = PARTS.reduce((n, p) => n + (p.groups || []).reduce((m, g) => m + g.ids.length, 0), 0);
  let n = 0;

  const block = (file, info, prompt, partNo) => {
    n++;
    out.push(`#### \`${file}\``, '', `Image ${n} of ${total} · ${info}`, '', F, prompt, F, '');
    checklist.push([n, file, partNo]);
  };

  out.push(
    '<!-- Generated by tools/flow-prompts.mjs. Do not edit this file by hand: edit the script, then run  node tools/flow-prompts.mjs -->',
    '',
    '# Character Art Prompts (Google Flow)',
    '',
    `This page has **${total} ready-to-paste prompts**, one for every character image in the game: ${bodies} full-body figures and ${total - bodies} expression close-ups. Each prompt is complete on its own. Copy one grey box, paste it into Google Flow, generate, and save the picture under the file name printed above the box.`,
    '',
    'The characters appear in the game as flat illustrated cutouts standing in the 3D world, like a paper theater. The same picture also appears in the dialogue box.',
    '',
    '## How to use',
    '',
    '1. **Open Google Flow and start one new project** for this game. Keep every character in that one project, so your approved pictures are always at hand.',
    '2. **Choose image creation, not video.** In the image settings, pick the tall **9:16** shape for full-body figures. For the close-ups in Parts 2 and 5, pick **3:4**. If your Flow does not offer 3:4, use any tall shape: the game trims the picture to the figure by itself. If Flow lets you choose how many results to make, 2 to 4 per prompt gives you more to choose from.',
    '3. **Optional: paste the master brief once.** If the prompt box has an **Agent** switch, turn it on, open **Agent Instructions**, choose **Add instruction**, paste the master brief from the next section, and click **Done**. The Agent then follows those rules for the whole project, as long as the Agent switch stays on. It may ask you to confirm before it draws each picture; say yes. If you do not see an Agent switch, skip this step. Every prompt below already contains all the rules.',
    `4. **Make Rivka first** (\`${fileFor(ANCHOR)}\`, the first prompt in Part 1). Generate until you have one you love. This picture is your **style guide** for the whole cast.`,
    '5. **For every other full-body figure,** attach your approved Rivka picture to the prompt box before you paste the prompt. You can drag it in from the project, or use the add button under the prompt box, or type `@` and pick it by name. The prompts already tell Flow to copy her drawing style and not her face. If you cannot attach a picture, the prompt still works; the cast will just match a little less closely.',
    '6. **For every close-up,** attach only that character\'s own approved full-body picture (not Rivka\'s, unless it is Rivka\'s close-up). The line above each prompt tells you which file to attach.',
    '7. **Check the picture** against the short list below, then download it.',
    '8. **Save it as a PNG with exactly the file name shown above the prompt,** in the game\'s `assets/art/` folder. If Flow gives you another file type, open it in any picture app and save it as PNG.',
    '9. **Do not remove the background.** Every prompt asks for a flat green background, and the game clears it automatically and trims the picture to the figure. No Canva, no background-removal site, no cropping.',
    '10. **Refresh the game.** The character appears. Tick it off in the checklist at the bottom of this page.',
    '',
    'You can stop after any part. Characters without art keep their plain placeholder shape until you add a picture.',
    '',
    '### Before you save a picture',
    '',
    '- The **whole person** is inside the picture (for close-ups: the whole head and hat), with green on every side.',
    '- The background is **one flat green**: no shading, no floor, no shadow under the feet. The exact shade does not matter, as long as it is the same everywhere.',
    '- There is **no frame, border, title or writing** anywhere.',
    '- **Nothing on the person is green,** and there is a dark ink line all the way around the figure.',
    '- Hands, faces and the held object look right (count the fingers).',
    '',
    '*About Google Flow:* the buttons named in these steps (Agent, Agent Instructions, attaching pictures to a prompt) were checked against Google\'s Flow help pages in November 2026. Flow changes often. If a button has moved or is missing, carry on: the prompts do not depend on it. Generating pictures may use credits from your Google plan; Flow shows the cost before you generate.',
    '',
    '## Master brief (optional, paste once per project)',
    '',
    'Paste this into **Agent Instructions** (step 3). If your Flow has an Agent chat but no Agent Instructions, you can paste it as your first chat message instead. Do not paste it into the ordinary prompt box, because Flow would try to draw it.',
    '',
    F, MASTER_BRIEF, F,
    '',
    '## Who gets expression close-ups',
    '',
    `These ${EXPRESSIVE.length} main characters each get two extra close-ups, a good moment and a bad moment, chosen from what happens to them in the story:`,
    '',
    '| Character | File id | Good moment (`_up`) | Bad moment (`_down`) |',
    '|---|---|---|---|',
    ...EXPRESSIVE.map((id) => `| ${displayName(id)} | \`${id}\` | ${firstSentence(FACES[id].up)} | ${firstSentence(FACES[id].down)} |`),
    '',
    'Everyone else needs only the full-body picture.',
    '',
    '---',
    '',
    '## The prompts',
    '',
  );

  PARTS.forEach((part, pi) => {
    const partNo = pi + 1;
    out.push(`### ${part.title}`, '', part.intro, '');
    for (const g of part.groups || []) {
      if (g.title) out.push(`**${g.title}**`, '');
      for (const id of g.ids) {
        const c = CAST[id];
        const attach = id === ANCHOR
          ? 'Attach: nothing (this picture becomes your style guide)'
          : `Attach: your approved \`${fileFor(ANCHOR)}\` as a style guide`;
        const real = c.real ? ' · Real person: compare with archival photographs before you approve it' : '';
        block(fileFor(id), `**${displayName(id)}** (${displayRole(id)}) · Shape: 9:16 · ${attach}${real}`, bodyPrompt(id), partNo);
      }
    }
    for (const id of part.faces || []) {
      for (const mood of ['up', 'down']) {
        block(
          fileFor(id, mood),
          `**${displayName(id)}**, ${mood === 'up' ? 'good moment' : 'bad moment'} · Shape: 3:4 · Attach: your approved \`${fileFor(id)}\` (needed)`,
          facePrompt(id, mood),
          partNo,
        );
      }
    }
  });

  out.push(
    '---',
    '',
    '## Troubleshooting',
    '',
    '**The characters do not match each other.** Attach your approved Rivka picture every time (step 5) and generate again. If one figure still looks different, add this line to the end of the prompt:',
    '',
    F, 'Match the attached reference image exactly in line thickness, flat coloring, paper texture and color palette. Change only the person.', F,
    '',
    '**A close-up does not look like the same person.** Check that only that character\'s full-body picture is attached, then add:',
    '',
    F, 'This must be the same person as in the attached reference image: same face shape, same hair, same headwear, same clothes and colors. Only the expression changes.', F,
    '',
    '**Flow added a card frame, a border, a title or writing.** Generate again with this line added to the end of the prompt. If your Flow lets you edit a picture by typing a request, you can type the same line there instead:',
    '',
    F, 'Remove every border, frame, banner, title, numeral and piece of lettering. The picture is only the figure on the flat green background, with nothing else.', F,
    '',
    '**The background is not flat** (shading, a floor, a shadow, a glow, a paper texture):',
    '',
    F, `The background must be one single flat green, ${KEY}, with no shading, no texture, no floor line and no shadow anywhere, like a green screen. Keep the figure exactly as it is.`, F,
    '',
    '**Part of the figure is cut off, or the figure is very small.**',
    '',
    F, 'Zoom out so the whole figure, including the hat, the shoes and the held object, is inside the image with green background on all four sides. The figure fills about 85 percent of the image height.', F,
    '',
    '**Something on the person is green, or part of the person disappears in the game.** The game treats green as background. Generate again with:',
    '',
    F, 'Nothing on the figure is green. Use brick red, ochre, teal blue, brown, cream, gray or black for every piece of clothing and every object.', F,
    '',
    '**A patch of green is left inside the figure in the game** (for example in the gap between an arm and the body, or inside a handle). The game clears the green that reaches the outside of the picture, so a closed-in pocket can stay. Generate again with:',
    '',
    F, 'Keep the arms and the held object flat against the body, with no gaps or loops where the background shows through.', F,
    '',
    '**Hands or the held object look wrong** (extra fingers, a melted object, the object floating). Generate again first; hands vary a lot from one try to the next. If it keeps happening, add:',
    '',
    F, 'Draw both hands carefully, with five fingers each, in a simple relaxed grip. The held object is small, clearly drawn and firmly in the hand.', F,
    '',
    '**Flow says a prompt is too long.** Put the master brief into Agent Instructions (step 3). Then, for that one prompt, you can leave out the four paragraphs that begin "Style:", "Background:", "Accuracy:" and "Do not add:", because the master brief already says the same things.',
    '',
    '**Flow will not draw Jacob Riis or George Washington Plunkitt** because they are real people. Delete the name from the "Character:" line and leave the rest of the description. The description alone is enough.',
    '',
    '**Period accuracy checks (1888).** Before you approve a picture, look for these:',
    '',
    '- Men wear hats outdoors almost always. Women\'s skirts reach the ankle or the ground, and married Jewish women cover their hair.',
    '- No wristwatches (pocket watches on chains only), no zippers, no T-shirts, no sneakers, no plastic, no modern eyeglass frames.',
    '- No electric lights, telephones or cars. Lanterns burn oil or gas.',
    '- Children wear smaller versions of adult working clothes, not modern children\'s clothes.',
    '- Newspapers and papers should show only scribbled lines. If you can read a word, generate again.',
    '- **Real people:** compare Jacob Riis and George Washington Plunkitt with their photographs on the Library of Congress site (loc.gov). The surviving photographs of Plunkitt show him as an older man; in 1888 he was in his mid-40s.',
    '- **Dignity:** every person should look like someone you could meet, with a natural face and body. If a picture exaggerates a nose, eyes, skin color or any other feature, do not use it. Generate again.',
    '',
    '## Checklist',
    '',
    'Save every file in `assets/art/`. Tick each one off as you save it.',
    '',
    '| # | File name | Part | Done |',
    '|---|---|---|---|',
    ...checklist.map(([i, file, partNo]) => `| ${i} | \`${file}\` | ${partNo} | ☐ |`),
    '',
  );

  return { text: out.join('\n'), total, bodies, faces: total - bodies };
}

// The first sentence of a text, without stopping at a full stop inside a quotation.
function firstSentence(t) {
  let inQuote = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i], next = t[i + 1];
    const atBreak = next === undefined || next === ' ';
    if (ch === '"') {
      inQuote = !inQuote;
      if (!inQuote && /[.!?]/.test(t[i - 1]) && atBreak) return t.slice(0, i + 1).replace(/\|/g, '/');
    } else if (!inQuote && /[.!?]/.test(ch) && atBreak) return t.slice(0, i + 1).replace(/\|/g, '/');
  }
  return t.replace(/\|/g, '/');
}

// ============================================================================
validate();
const { text, total, bodies, faces } = build();

if (process.argv.includes('--check')) {
  let onDisk = '';
  try { onDisk = readFileSync(OUT, 'utf8'); } catch { /* missing */ }
  if (onDisk !== text) {
    console.error('docs/CHARACTER_ART_PROMPTS.md is out of date. Run: node tools/flow-prompts.mjs');
    process.exit(1);
  }
  console.log('docs/CHARACTER_ART_PROMPTS.md is up to date.');
} else {
  writeFileSync(OUT, text);
  const longest = Math.max(...text.split('```').filter((_, i) => i % 2).map((b) => b.trim().length));
  console.log(`Wrote docs/CHARACTER_ART_PROMPTS.md: ${total} prompts (${bodies} full-body, ${faces} close-ups).`);
  console.log(`Expression close-ups for: ${EXPRESSIVE.join(', ')}`);
  console.log(`Longest prompt: ${longest} characters.`);
}
