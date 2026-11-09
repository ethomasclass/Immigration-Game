// Every person in the game. `voice` is a casting note for ElevenLabs.
// Art: assets/art/portrait_<id>.png, a full-body 2D figure on a transparent
// background (see docs/CHARACTER_ART_PROMPTS.md). Optional animated sprite
// strip: assets/art/anim_<id>.png (`frames` frames side by side).
// `coat`, `skin`, `hat` only drive the placeholder silhouette.
// `anim`: idle = breathe | sway | bounce | fidget | rock | shiver | still
//         talk = nod | gesture | bounce | lean      speed = 1 is normal
export const CHARACTERS = {
  narrator:  { name: 'The Editor', role: 'Narrator', voice: 'Warm, measured adult narrator. 1880s newspaper editor reading a letter.', coat: '#333', skin: '#d9b08c' },

  // ---- Zone 1: Steerage ----
  rivka:     { name: 'Rivka Abramowitz', role: 'Passenger from the Russian Empire', voice: 'Girl, about 16. Jewish, from near Kiev. Light Yiddish/Russian accent. Brave but tired.', coat: '#5a3e5d', skin: '#e3c09c', height: 1.55, hat: 'scarf', anim: { idle: 'breathe', talk: 'nod' } },
  mama:      { name: 'Mrs. Abramowitz', role: 'Rivka\'s mother', voice: 'Woman, 40s, Yiddish accent, worried and gentle.', coat: '#3d3346', skin: '#ddb894', height: 1.58, hat: 'scarf', anim: { idle: 'rock', talk: 'nod', speed: 0.6 } },
  shmuel:    { name: 'Shmuel', role: 'Rivka\'s little brother', voice: 'Boy, about 8.', coat: '#5b5a40', skin: '#e6c4a0', height: 1.15, hat: 'cap', anim: { idle: 'bounce', talk: 'bounce', speed: 1.3 } },
  giuseppe:  { name: 'Giuseppe Russo', role: 'Laborer from Calabria, Italy', voice: 'Man, 20s, southern Italian accent, cheerful and proud, a little homesick.', coat: '#6a4a2c', skin: '#c99a70', height: 1.72, hat: 'cap', anim: { idle: 'sway', talk: 'gesture', speed: 1.2 } },
  weber:     { name: 'Herr Weber', role: 'Farmer from Pomerania, Germany', voice: 'Man, 50s, German accent, slow and serious, a bit stubborn.', coat: '#2f3f52', skin: '#e8c4a8', height: 1.8, hat: 'hat', anim: { idle: 'still', talk: 'nod', speed: 0.6 } },
  fraweber:  { name: 'Frau Weber', role: 'Herr Weber\'s wife', voice: 'Woman, 50s, German accent.', coat: '#4a3a2a', skin: '#ecc8ab', height: 1.62, hat: 'bonnet', anim: { idle: 'breathe', talk: 'nod', speed: 0.7 } },
  steward:   { name: 'Mr. Pryce', role: 'Ship\'s steward', voice: 'Man, 40s, Welsh/English sailor, gruff, matter-of-fact.', coat: '#1f2a3a', skin: '#d8a888', height: 1.76, hat: 'cap', anim: { idle: 'sway', talk: 'nod', speed: 0.8 } },

  // ---- Zone 2: Castle Garden ----
  doctor:    { name: 'Dr. Hale', role: 'Inspecting doctor', voice: 'Man, 50s, American, brisk and official.', coat: '#2b2b2b', skin: '#e6c2a4', height: 1.78, hat: 'none', anim: { idle: 'still', talk: 'nod', speed: 1.4 } },
  clerk:     { name: 'Mr. Briggs', role: 'Registration clerk', voice: 'Man, 30s, New York accent, tired, fast-talking but not unkind.', coat: '#3b3328', skin: '#e2bd9c', height: 1.74, hat: 'none', anim: { idle: 'fidget', talk: 'nod', speed: 1.4 } },
  novak:     { name: 'Anton Novak', role: 'Passenger held for questioning', voice: 'Elderly man, 70s, Czech/Bohemian accent, quiet and dignified.', coat: '#4c4c44', skin: '#d9b89a', height: 1.66, hat: 'hat', anim: { idle: 'shiver', talk: 'nod', speed: 0.5 } },
  runner:    { name: '"Smiling" Jack Doyle', role: 'Boardinghouse runner', voice: 'Man, 30s, fast, overly friendly New York hustler.', coat: '#6b2a2a', skin: '#e4bea0', height: 1.75, hat: 'bowler', anim: { idle: 'bounce', talk: 'gesture', speed: 1.5 } },
  changer:   { name: 'Money Changer', role: 'Street money changer', voice: 'Man, 40s, slick, smooth-talking.', coat: '#3d4a2a', skin: '#d8b08a', height: 1.7, hat: 'bowler', anim: { idle: 'fidget', talk: 'lean', speed: 1.2 } },
  agent:     { name: 'Miss Carver', role: 'Castle Garden information desk', voice: 'Woman, 30s, American, patient and clear.', coat: '#28354a', skin: '#e8c6a8', height: 1.64, hat: 'bonnet', anim: { idle: 'breathe', talk: 'nod' } },

  // ---- Zone 3: Lower East Side ----
  moishe:    { name: 'Cousin Moishe', role: 'Tailor on Hester Street', voice: 'Man, 30s, Yiddish accent, kind, overworked, coughs a little.', coat: '#2e2e3a', skin: '#e0bc98', height: 1.7, hat: 'cap', anim: { idle: 'breathe', talk: 'gesture', speed: 0.9 } },
  chana:     { name: 'Chana', role: 'Moishe\'s wife, finisher', voice: 'Woman, 30s, Yiddish accent, practical and quick.', coat: '#4b2f3a', skin: '#e2bd9a', height: 1.6, hat: 'scarf', anim: { idle: 'fidget', talk: 'nod', speed: 1.4 } },
  boarder:   { name: 'Yankel', role: 'Boarder', voice: 'Young man, 20, Yiddish accent, sleepy.', coat: '#4a4a3a', skin: '#ddb894', height: 1.68, hat: 'cap', anim: { idle: 'rock', talk: 'nod', speed: 0.4 } },
  riis:      { name: 'Jacob Riis', role: 'Police reporter, New York Tribune', voice: 'Man, about 40, Danish accent, energetic, passionate about reform.', coat: '#3a2f25', skin: '#e6c2a2', height: 1.78, hat: 'hat', anim: { idle: 'fidget', talk: 'gesture', speed: 1.3 } },
  peddler:   { name: 'Mrs. Leah Gold', role: 'Pushcart peddler', voice: 'Woman, 40s, Yiddish accent, loud, funny, sharp businesswoman.', coat: '#5e3b2a', skin: '#ddb590', height: 1.58, hat: 'scarf', anim: { idle: 'sway', talk: 'gesture', speed: 1.3 } },
  peddler2:  { name: 'Herschel', role: 'Pushcart peddler', voice: 'Man, 50s, Yiddish accent.', coat: '#3a3a2a', skin: '#d8b08c', height: 1.7, hat: 'hat', anim: { idle: 'breathe', talk: 'nod', speed: 0.7 } },
  newsboy:   { name: 'Tony the Newsboy', role: 'Newsboy', voice: 'Boy, about 11, New York street accent, fast.', coat: '#5a4a32', skin: '#d6a982', height: 1.3, hat: 'cap', anim: { idle: 'bounce', talk: 'bounce', speed: 1.6 } },
  rabbi:     { name: 'Mr. Kaplan', role: 'Secretary of the Kiever Society', voice: 'Man, 60s, Yiddish accent, warm and formal.', coat: '#1f1f26', skin: '#e2c09e', height: 1.68, hat: 'hat', anim: { idle: 'rock', talk: 'nod', speed: 0.5 } },
  priest:    { name: 'Father Morelli', role: 'Priest of a Catholic parish', voice: 'Man, 50s, Italian accent, gentle.', coat: '#151515', skin: '#d4a882', height: 1.72, hat: 'none', anim: { idle: 'breathe', talk: 'nod', speed: 0.7 } },
  lee:       { name: 'Mr. Lee Fong', role: 'Shopkeeper on Mott Street', voice: 'Man, 40s, Cantonese accent, calm, careful, a little guarded.', coat: '#23324a', skin: '#e0b88c', height: 1.68, hat: 'cap', anim: { idle: 'still', talk: 'nod', speed: 0.6 } },
  brennan:   { name: 'Mrs. Brennan', role: 'Irish neighbor', voice: 'Woman, 50s, Irish accent, sharp-tongued, proud, defensive.', coat: '#3a4a3a', skin: '#efcfb6', height: 1.62, hat: 'bonnet', anim: { idle: 'fidget', talk: 'lean', speed: 1.1 } },
  guild:     { name: 'Mr. Whitcomb', role: 'Volunteer, the Neighborhood Guild', voice: 'Young man, 20s, educated American, earnest.', coat: '#3a3a4a', skin: '#ecccb0', height: 1.8, hat: 'none', anim: { idle: 'breathe', talk: 'gesture' } },
  boss:      { name: 'Mr. Quinn', role: 'A man handing out coal', voice: 'Man, 40s, Irish-New York accent, booming and friendly. Fictional Tammany ward boss.', coat: '#202020', skin: '#e8bfa0', height: 1.84, hat: 'bowler', anim: { idle: 'sway', talk: 'gesture', speed: 0.9 } },
  girl:      { name: 'Sarah', role: 'Girl sewing buttons', voice: 'Girl, about 10, Yiddish accent, shy.', coat: '#5a4a5a', skin: '#e4c2a0', height: 1.25, hat: 'scarf', anim: { idle: 'fidget', talk: 'nod', speed: 1.2 } },

  // ---- Zone 4: The City ----
  plunkitt:  { name: 'George Washington Plunkitt', role: 'Tammany Hall leader', voice: 'Man, mid-40s, Irish-New York accent, folksy, proud, chuckles at his own jokes.', coat: '#1d1d24', skin: '#e9c3a4', height: 1.8, hat: 'hat', anim: { idle: 'rock', talk: 'gesture', speed: 0.8 } },
  oldrep:    { name: 'Mr. Haskins', role: 'Old newspaper reporter', voice: 'Man, 60s, American, dry humor, a bit cynical.', coat: '#3b3a33', skin: '#e3c0a2', height: 1.72, hat: 'bowler', anim: { idle: 'still', talk: 'lean', speed: 0.7 } },
  foreman:   { name: 'Mr. Halvorsen', role: 'Construction foreman', voice: 'Man, 40s, Norwegian accent, loud over noise, proud of the work.', coat: '#4a3a24', skin: '#ecc6a6', height: 1.84, hat: 'cap', anim: { idle: 'sway', talk: 'gesture', speed: 1.2 } },
  driver:    { name: 'Mike', role: 'Horsecar driver', voice: 'Man, 30s, Irish-New York accent, impatient and funny.', coat: '#2a3a4a', skin: '#e8c0a0', height: 1.74, hat: 'cap', anim: { idle: 'fidget', talk: 'gesture', speed: 1.3 } },
  elguard:   { name: 'El Guard', role: 'Elevated railway guard', voice: 'Man, 30s, gruff New Yorker, shouting over the trains.', coat: '#22304a', skin: '#d8b090', height: 1.76, hat: 'cap', anim: { idle: 'sway', talk: 'bounce' } },
  kessler:   { name: 'Mr. Kessler', role: 'Garment contractor', voice: 'Man, 40s, Yiddish-German accent, brusque and defensive, tired; not a cartoon villain.', coat: '#2a2a30', skin: '#e0bc98', height: 1.7, hat: 'bowler', anim: { idle: 'fidget', talk: 'gesture', speed: 1.1 } },
  esther:    { name: 'Esther Lipsky', role: 'Organizer, United Hebrew Trades', voice: 'Young woman, 19, Yiddish accent, fiery speaker, warm one-on-one.', coat: '#5a2a2a', skin: '#e4c2a0', height: 1.6, hat: 'none', anim: { idle: 'sway', talk: 'gesture', speed: 1.3 } },
  societa:   { name: 'Signor Bellini', role: 'Società di Mutuo Soccorso (Italian mutual aid society)', voice: 'Man, 50s, southern Italian accent, calm, fatherly.', coat: '#3a3428', skin: '#c99a70', height: 1.7, hat: 'hat', anim: { idle: 'still', talk: 'nod' } },
  editor:    { name: 'The Editor', role: 'The Evening Courier', voice: 'Same voice as the narrator: warm, measured, a little gruff in person.', coat: '#2a2a2a', skin: '#e6c2a4', height: 1.76, hat: 'none', anim: { idle: 'still', talk: 'nod' } },
  bulletin:  { name: 'Bulletin Man', role: 'Calling the returns through a megaphone', voice: 'Man, 30s, booming New York voice, theatrical.', coat: '#3a2a1c', skin: '#e2bf9c', height: 1.78, hat: 'bowler', anim: { idle: 'sway', talk: 'bounce' } },
  tomas:     { name: 'Tomas Novak', role: 'Mr. Novak\'s son, from Chicago', voice: 'Man, 40s, Czech-American accent, gentle, overwhelmed.', coat: '#4a4038', skin: '#e8c4a8', height: 1.88, hat: 'hat', anim: { idle: 'breathe', talk: 'nod', speed: 0.8 } },
  hodcarrier:{ name: 'Dominic', role: 'Hod carrier on the new Times Building', voice: 'Man, 30s, Italian accent, out of breath, wry.', coat: '#6a5a44', skin: '#c99a70', height: 1.7, hat: 'cap', anim: { idle: 'breathe', talk: 'gesture', speed: 1.2 } },
  elevator:  { name: 'Elevator Operator', role: 'Potter Building', voice: 'Young man, 18, New York accent, cheerful, rehearsed patter.', coat: '#3a2a4a', skin: '#e6c2a4', height: 1.68, hat: 'cap', anim: { idle: 'still', talk: 'nod' } },
  // Background figures with their own art (no dialogue)
  worker0:   { name: 'Bricklayer', role: 'Background', coat: '#7a6a54', skin: '#d6a982', height: 1.72, hat: 'cap', anim: { idle: 'fidget' } },
  worker1:   { name: 'Ironworker', role: 'Background', coat: '#4a4a46', skin: '#e0bc98', height: 1.78, hat: 'cap', anim: { idle: 'sway' } },
  lamplighter:{ name: 'Lamplighter', role: 'Background (carries a ladder and pole)', coat: '#2e3440', skin: '#e2bf9c', height: 1.74, hat: 'cap', anim: { idle: 'still' } },
  child0:    { name: 'Child playing', role: 'Background', coat: '#5b4a3a', skin: '#e2bf9c', height: 1.15, hat: 'cap', anim: { idle: 'bounce' } },
  keeper:    { name: 'Park Keeper', role: 'Central Park keeper', voice: 'Man, 50s, Scottish accent, strict but kind.', coat: '#2c3b2a', skin: '#e9c7aa', height: 1.78, hat: 'cap', anim: { idle: 'still', talk: 'nod', speed: 0.8 } },
};
