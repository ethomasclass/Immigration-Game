// Photo subjects. When the player photographs one of these, it becomes a
// "plate" in the journal with this title and caption.
// `col` is the suggested evidence-chart column (used only in the teacher guide;
// students choose the column themselves).
// Art: the tarot-style frame title comes from `title`.
export const SUBJECTS = {
  // ---- Zone 1 ----
  rivka:      { title: 'The Exile', desc: 'Rivka Abramowitz fled the pogroms and May Laws of the Russian Empire.', col: 'people', zone: 'ship' },
  family:     { title: 'The Widow & Son', desc: 'Rivka\'s mother and brother. The family travels without a father.', col: 'people', zone: 'ship' },
  giuseppe:   { title: 'The Laborer', desc: 'Giuseppe Russo left poor, overtaxed southern Italy to earn wages in America.', col: 'business', zone: 'ship' },
  weber:      { title: 'The Farmer', desc: 'Herr Weber, an "old immigrant" from Germany, is following his brother\'s letters to Wisconsin.', col: 'people', zone: 'ship' },
  steward:    { title: 'The Steward', desc: 'A crewman who sees a thousand steerage passengers every crossing.', col: 'business', zone: 'ship' },
  bunks:      { title: 'The Bunks', desc: 'Crowded two-high bunks in steerage. The crossing took 10 to 14 days.', col: 'business', zone: 'ship' },
  poster:     { title: 'The Promise', desc: 'A steamship poster selling cheap fares. Companies advertised all over Europe.', col: 'business', zone: 'ship' },
  food:       { title: 'The Ration', desc: 'Steerage food: thin stew and hard bread.', col: 'business', zone: 'ship' },
  // ---- Zone 2 ----
  statue:     { title: 'Liberty', desc: 'The Statue of Liberty, dedicated in 1886, still copper brown, seen from Castle Garden.', col: 'government', zone: 'castle' },
  castle:     { title: 'The Fortress', desc: 'Castle Garden, an old fort used as New York\'s immigrant station from 1855 to 1890.', col: 'government', zone: 'castle' },
  doctor:     { title: 'The Physician', desc: 'A doctor checks each immigrant for disease in a few seconds.', col: 'government', zone: 'castle' },
  clerk:      { title: 'The Ledger', desc: 'A clerk asks the questions required by the Immigration Act of 1882.', col: 'government', zone: 'castle' },
  novak:      { title: 'The Detained', desc: 'Anton Novak is held as "likely to become a public charge."', col: 'government', zone: 'castle' },
  newspaper:  { title: 'The Closed Door', desc: 'A newspaper about the Chinese Exclusion Act of 1882.', col: 'government', zone: 'castle' },
  runner:     { title: 'The Swindler', desc: 'A runner outside the gate who cheats newcomers.', col: 'business', zone: 'castle' },
  changer:    { title: 'The Money Changer', desc: 'A street money changer who gives bad rates.', col: 'business', zone: 'castle' },
  agent:      { title: 'The Guide', desc: 'Castle Garden\'s information desk helped protect immigrants.', col: 'government', zone: 'castle' },
  // ---- Zone 3 ----
  tenement:   { title: 'The Tenement', desc: 'A crowded tenement on Hester Street, built under the 1879 tenement law, with air shafts and a yard privy.', col: 'government', zone: 'les' },
  sweatshop:  { title: 'The Needle', desc: 'A family sews coats at home for piecework pay.', col: 'business', zone: 'les' },
  girl:       { title: 'The Button Girl', desc: 'Ten-year-old Sarah sews buttons after school.', col: 'business', zone: 'les' },
  boarder:    { title: 'The Boarder', desc: 'Yankel pays a dollar a week to sleep on two chairs.', col: 'people', zone: 'les' },
  moishe:     { title: 'The Tailor', desc: 'Cousin Moishe came first and sent for his family: chain migration.', col: 'people', zone: 'les' },
  privy:      { title: 'The Yard', desc: 'One privy for a whole building, in a crowded back yard.', col: 'government', zone: 'les' },
  riis:       { title: 'The Witness', desc: 'Jacob Riis photographs the tenements with flash powder.', col: 'people', zone: 'les' },
  pushcart:   { title: 'The Peddler', desc: 'Mrs. Gold sells from a pushcart: a way to earn money with no boss.', col: 'people', zone: 'les' },
  newsboy:    { title: 'Many Tongues', desc: 'Newspapers in Yiddish, Italian, German, and more.', col: 'people', zone: 'les' },
  society:    { title: 'The Society', desc: 'A landsmanshaft (hometown society) helps members with sick pay, loans, and burials.', col: 'people', zone: 'les' },
  synagogue:  { title: 'The Synagogue', desc: 'A synagogue: a place of worship and community.', col: 'people', zone: 'les' },
  parish:     { title: 'The Parish', desc: 'A Catholic parish that serves Irish and Italian immigrants.', col: 'people', zone: 'les' },
  giuseppe2:  { title: 'The Digger', desc: 'Giuseppe lives with men from his village and digs streets for a dollar a day.', col: 'business', zone: 'les' },
  lee:        { title: 'The Merchant', desc: 'Mr. Lee opened his own shop on Mott Street because white-owned businesses would not hire him.', col: 'people', zone: 'les' },
  handbill:   { title: 'The Handbill', desc: 'A nativist handbill: "America for Americans!"', col: 'people', zone: 'les' },
  brennan:    { title: 'The Neighbor', desc: 'Mrs. Brennan, the child of Irish Famine immigrants, resents the newcomers.', col: 'people', zone: 'les' },
  guild:      { title: 'The Guild', desc: 'The Neighborhood Guild (1886), America\'s first settlement house.', col: 'people', zone: 'les' },
  boss:       { title: 'The Coal Sack', desc: 'A man from the Tammany club hands out free coal before an election.', col: 'government', zone: 'les' },
  banner:     { title: 'The Banner', desc: 'A Tammany banner for the 1888 mayoral election hangs over Hester Street.', col: 'government', zone: 'les' },
  club:       { title: 'The Club', desc: 'A Tammany district club offers jobs, coal, and help with citizenship papers.', col: 'government', zone: 'les' },
  // ---- Zone 4 ----
  nast:       { title: 'The Cartoon', desc: 'Thomas Nast\'s 1871 cartoon of the Tweed Ring.', col: 'machine', zone: 'city' },
  courthouse: { title: 'The Courthouse', desc: 'The "Tweed Courthouse," where the Tweed Ring stole millions.', col: 'machine', zone: 'city' },
  plunkitt:   { title: 'The Boss', desc: 'Tammany leader George Washington Plunkitt at his bootblack-stand "office."', col: 'machine', zone: 'city' },
  oldrep:     { title: 'The Old Reporter', desc: 'A reporter who saw the newspapers bring down Boss Tweed.', col: 'machine', zone: 'city' },
  tribune:    { title: 'The Tower', desc: 'The Tribune Building (1875), one of the tallest in New York.', col: 'growth', zone: 'city' },
  frame:      { title: 'The Builders', desc: 'Immigrant workers raise the new 13-story Times Building around the old one.', col: 'growth', zone: 'city' },
  bridge:     { title: 'The Bridge', desc: 'The Brooklyn Bridge, opened in 1883.', col: 'growth', zone: 'city' },
  horsecar:   { title: 'The Horsecar', desc: 'A horse-drawn streetcar on rails.', col: 'growth', zone: 'city' },
  el:         { title: 'The Iron Road', desc: 'The elevated railway ("the El") runs steam trains above the street.', col: 'growth', zone: 'city' },
  rooftop:    { title: 'The View', desc: 'Lower Manhattan from eleven stories up, reached by elevator.', col: 'growth', zone: 'city' },
  hodcarrier: { title: 'The Hod Carrier', desc: 'Giuseppe carries bricks up eleven stories of ladders, with no rope or net, for $1.50 a day.', col: 'growth', zone: 'city' },
  esther:     { title: 'The Organizer', desc: 'Esther Lipsky of the United Hebrew Trades calls on shop girls to join the union.', col: 'people', zone: 'les2' },
  banner2:    { title: 'The Campaign', desc: 'Election banners for mayor on Park Row, November 1888.', col: 'machine', zone: 'city' },
  park:       { title: 'The Green', desc: 'Central Park, designed by Olmsted and Vaux as "lungs" for the city.', col: 'life', zone: 'city' },
  parkrules:  { title: 'The Rule', desc: '"Keep Off the Grass": park rules that kept the park "proper."', col: 'life', zone: 'city' },
  sunday:     { title: 'Sunday', desc: 'A tenement family on their one day off, visiting the park.', col: 'life', zone: 'city' },
  keeper:     { title: 'The Keeper', desc: 'A park keeper enforcing the rules.', col: 'life', zone: 'city' },
};

// Evidence charts for the two wrap-ups.
// EDIT THESE to match your paper handout's columns.
export const WRAPUPS = {
  A: {
    zones: ['ship', 'castle', 'les'],
    question: 'Was America a land of opportunity for newcomers?',
    columns: [
      { key: 'government', title: 'Government', hint: 'Laws, inspectors, and officials' },
      { key: 'business', title: 'Business & Work', hint: 'Jobs, companies, bosses, and swindlers' },
      { key: 'people', title: 'Ordinary People', hint: 'Families, neighbors, and communities' },
    ],
    stances: ['Yes', 'No', 'For some people, not others'],
  },
  B: {
    zones: ['les2', 'city'],
    question: 'Did the growing city and its political machines help newcomers, or take advantage of them?',
    columns: [
      { key: 'machine', title: 'Political Machines', hint: 'Tammany, bosses, and favors' },
      { key: 'growth', title: 'City Growth', hint: 'Buildings, bridges, and transit' },
      { key: 'life', title: 'Daily Life', hint: 'Parks, neighborhoods, and families' },
    ],
    stances: ['Helped them', 'Took advantage of them', 'Both'],
  },
};
