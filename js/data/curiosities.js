// ============================================================================
// CURIOSITIES: small period objects hidden in each chapter. They glint when
// you are close. Walk up and press E to look. Optional; they never block a goal.
// zone: which chapter holds it (les covers both visits to the Lower East Side).
// Optional art: assets/art/curio_<id>.png (shown in the journal).
// ============================================================================
export const CURIOS = {
  // ---- I. Steerage ----
  tin:     { zone: 'ship', glyph: '🥣', name: 'A tin plate and cup', text: 'There is no dining room in steerage. Each passenger carries a tin plate, a cup, and a spoon, lines up when the stewards bring the pans, and eats wherever there is room to sit.' },
  cork:    { zone: 'ship', glyph: '🛟', name: 'A cork life preserver', text: 'Every berth has one. Hardly anyone expects to need it in the water, so on most nights it does a different job: it is the pillow.' },
  cards:   { zone: 'ship', glyph: '🃏', name: 'A worn deck of cards', text: 'A steamship crosses the Atlantic in about a week to ten days. A generation ago, under sail, the same trip took a month or more. There is still a great deal of time to fill.' },
  // ---- II. Castle Garden ----
  check:   { zone: 'castle', glyph: '🏷️', name: 'A brass baggage check', text: 'A trunk left at the baggage room gets a numbered brass tag, and its owner gets the matching one. Lose the tag and you may lose everything you carried across the ocean.' },
  ticket:  { zone: 'castle', glyph: '🎫', name: 'An emigrant train ticket', text: 'Many newcomers never see more of New York than this building. Railroad agents sell tickets right here for the slow, cheap "emigrant trains" to Chicago, Milwaukee, and the farms beyond.' },
  flag:    { zone: 'castle', glyph: '🇺🇸', name: 'A flag with 38 stars', text: 'Count them: thirty-eight, one for each state in 1888. Colorado was the last to join, in 1876. Within two years the flag will need five more.' },
  // ---- III / IV. Lower East Side ----
  paper:   { zone: 'les', glyph: '📰', name: 'A Yiddish newspaper', text: 'The Yidishes Tageblatt, printed a few blocks away since 1885, is the first Yiddish daily newspaper in America. For many readers here it is how they learn what America is.' },
  ash:     { zone: 'les', glyph: '🗑️', name: 'An ash barrel', text: 'Every coal stove makes ashes, and every building puts them out in barrels. The city is supposed to cart them away. On these blocks the barrels often sit for days and spill into the street.' },
  mezuzah: { zone: 'les', glyph: '📜', name: 'A mezuzah on the doorpost', text: 'A small case holding a scroll of scripture, fixed to the doorpost of a Jewish home. Rivka\'s family touched one like it every day in the old country. Here is one in New York.' },
  // ---- V. Park Row and Central Park ----
  wire:    { zone: 'city', glyph: '⚡', name: 'A fallen telegraph wire', text: 'In March 1888 a great blizzard buried the city and pulled down thousands of overhead wires. The city has now ordered them moved underground. Look up: most are still there.' },
  ribbon:  { zone: 'city', glyph: '🎗️', name: 'A campaign ribbon', text: 'Voters show their side with silk ribbons and brass tokens. The pin-on campaign button has not been invented yet; it arrives in 1896.' },
  brake:   { zone: 'city', glyph: '🛗', name: 'A plate reading "Otis"', text: 'In 1854 Elisha Otis showed a brake that catches an elevator if its rope breaks. Without it, nobody would rent an office ten floors up, and nobody would build one.' },
  dairy:   { zone: 'city', glyph: '🥛', name: 'A cup from the Dairy', text: 'Milk sold in poor neighborhoods is often watered down or spoiled. The park\'s Dairy was built so that city children could drink a cup of fresh milk, safely.' },
};
export const curiosIn = (zoneId) => Object.entries(CURIOS).filter(([, c]) => c.zone === (zoneId === 'les2' ? 'les' : zoneId)).map(([id]) => id);
