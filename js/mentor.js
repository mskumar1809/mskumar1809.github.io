/* Mentor: the champion's favourite cricketer becomes their guide. */
const Mentor = (() => {
  // Themed emoji avatars for popular cricketers (photos can't be bundled for
  // licensing reasons — a bold emoji avatar stands in for the idol).
  // Stylized cartoon avatar params per popular cricketer (caricature — not a
  // photo, so no image rights issue). Shared template: jersey colour, cap,
  // beard, shirt number.
  const AV = (jersey, beard, number, cap, skin, hair) => ({ jersey, beard, number, cap: cap || '#14603a', skin: skin || '#f2c49b', hair: hair || '#2b1d12' });

  const CATALOG = {
    'virat kohli':   { emoji: '👑', title: 'The King', avatar: AV('#d23b3b', true, 18) },
    'virat':         { emoji: '👑', title: 'The King', avatar: AV('#d23b3b', true, 18) },
    'rohit sharma':  { emoji: '💥', title: 'The Hitman', avatar: AV('#2f6fd8', false, 45) },
    'rohit':         { emoji: '💥', title: 'The Hitman', avatar: AV('#2f6fd8', false, 45) },
    'ms dhoni':      { emoji: '🧊', title: 'Captain Cool', avatar: AV('#f0c541', false, 7) },
    'dhoni':         { emoji: '🧊', title: 'Captain Cool', avatar: AV('#f0c541', false, 7) },
    'sachin':        { emoji: '🙏', title: 'The Master', avatar: AV('#2f6fd8', false, 10) },
    'sachin tendulkar': { emoji: '🙏', title: 'The Master', avatar: AV('#2f6fd8', false, 10) },
    'bumrah':        { emoji: '🎯', title: 'The Yorker King', avatar: AV('#2f6fd8', true, 93, '#14603a', '#8a5a2b') },
    'jasprit bumrah': { emoji: '🎯', title: 'The Yorker King', avatar: AV('#2f6fd8', true, 93, '#14603a', '#f2c49b', '#8a5a2b') },
    'ab de villiers': { emoji: '🦇', title: 'Mr. 360', avatar: AV('#0e7a3c', false, 17) },
    'abd':           { emoji: '🦇', title: 'Mr. 360', avatar: AV('#0e7a3c', false, 17) },
    'ben stokes':    { emoji: '🦁', title: 'The Warrior', avatar: AV('#205295', true, 55, '#205295', '#f2c49b', '#c9a04a') },
    'steve smith':   { emoji: '🧩', title: 'The Puzzle Master', avatar: AV('#f0c541', false, 49, '#f0c541') },
    'kane williamson': { emoji: '🧠', title: 'The Thinker', avatar: AV('#111827', false, 22) },
    'joe root':      { emoji: '🌹', title: 'The Classic', avatar: AV('#14421f', false, 66) },
    'ravindra jadeja': { emoji: '⚔️', title: 'The All-Rounder', avatar: AV('#2f6fd8', true, 8) },
    'jadeja':        { emoji: '⚔️', title: 'The All-Rounder', avatar: AV('#2f6fd8', true, 8) },
    'hardik pandya': { emoji: '⚡', title: 'The Powerhouse', avatar: AV('#2f6fd8', true, 33) },
    'kl rahul':      { emoji: '🎩', title: 'The Stylist', avatar: AV('#2f6fd8', true, 1) },
    'smriti mandhana': { emoji: '🌸', title: 'The Smile Assassin', avatar: AV('#2f8fd8', false, 18, '#c2417c', '#f2c49b', '#2b1d12') },
    'harmanpreet kaur': { emoji: '🔥', title: 'The Blaze', avatar: AV('#2f8fd8', false, 7, '#c2417c') },
    'mithali raj':   { emoji: '🧭', title: 'The Legend', avatar: AV('#2f8fd8', false, 3, '#c2417c') },
    'adam gilchrist': { emoji: '🧤', title: 'The Keeper-Basher', avatar: AV('#f0c541', false, 99, '#f0c541') },
    'ricky ponting': { emoji: '🏆', title: 'Punter', avatar: AV('#f0c541', false, 14, '#f0c541') },
    'brian lara':    { emoji: '🎻', title: 'The Maestro', avatar: AV('#7a1f1f', false, 9, '#7a1f1f') },
    'shane warne':   { emoji: '🌀', title: 'The Spin King', avatar: AV('#f0c541', true, 23, '#f0c541', '#f2c49b', '#c9a04a') }
  };

  const SUGGESTIONS = ['Virat Kohli', 'Rohit Sharma', 'MS Dhoni', 'Sachin Tendulkar', 'Jasprit Bumrah', 'AB de Villiers', 'Smriti Mandhana', 'Ben Stokes'];

  function lookup(name) {
    if (!name) return null;
    return CATALOG[name.trim().toLowerCase()] || null;
  }

  // Current mentor display info based on the player's favourite cricketer.
  function current() {
    const fav = (App.state?.player?.favCricketer || '').trim();
    if (!fav) return { name: 'Cheeku', emoji: null, avatar: null, title: 'Coach' };
    const hit = lookup(fav);
    return {
      name: fav,
      emoji: hit ? hit.emoji : '🏏',
      avatar: hit ? hit.avatar : null,
      title: hit ? hit.title : 'Your Hero'
    };
  }

  // Cartoon caricature avatar (animated with CSS): jersey, cap, beard, number.
  function avatarSVG(a) {
    if (!a) return null;
    return `
    <svg class="mascot-img" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 110 L25 88 Q25 74 40 70 L60 70 Q75 74 75 88 L75 110 Z" fill="${a.jersey}"/>
      <text x="50" y="103" text-anchor="middle" font-size="16" font-weight="bold" fill="#fff" opacity="0.9">${a.number}</text>
      <rect x="46" y="70" width="8" height="12" rx="3" fill="${a.skin}"/>
      <path d="M42 70 L50 78 L58 70 Z" fill="#fff"/>
      <path d="M27 78 Q14 84 12 96" stroke="${a.jersey}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M73 78 Q86 84 88 96" stroke="${a.jersey}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <circle cx="12" cy="97" r="6" fill="${a.skin}"/>
      <circle cx="88" cy="97" r="6" fill="${a.skin}"/>
      <path d="M88 90 L94 84" stroke="#8a5a2b" stroke-width="3" stroke-linecap="round"/>
      <circle cx="50" cy="42" r="24" fill="${a.skin}"/>
      <circle cx="26" cy="44" r="5" fill="${a.skin}"/>
      <circle cx="74" cy="44" r="5" fill="${a.skin}"/>
      ${a.beard
        ? `<path d="M30 44 Q30 66 50 66 Q70 66 70 44 L70 50 Q70 62 50 62 Q30 62 30 50 Z" fill="${a.hair}"/>`
        : ''}
      <path d="M26 34 Q26 16 50 16 Q74 16 74 34 L74 34 Q74 30 50 30 Q26 30 26 34 Z" fill="${a.cap}"/>
      <path d="M26 33 Q14 34 10 40 Q22 42 30 38 Z" fill="${a.cap}"/>
      ${a.beard ? '' : `<path d="M32 30 Q50 22 68 30 L68 34 Q50 27 32 34 Z" fill="${a.hair}"/>`}
      <circle cx="42" cy="44" r="3" fill="#221"/>
      <circle cx="58" cy="44" r="3" fill="#221"/>
      <circle cx="43" cy="43" r="1" fill="#fff"/>
      <circle cx="59" cy="43" r="1" fill="#fff"/>
      <path d="M38 38 Q42 36 46 38" stroke="${a.hair}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M54 38 Q58 36 62 38" stroke="${a.hair}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M42 54 Q50 61 58 54" stroke="#a0522d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="36" cy="51" r="3" fill="#f4a988" opacity="0.7"/>
      <circle cx="64" cy="51" r="3" fill="#f4a988" opacity="0.7"/>
    </svg>`;
  }

  return { lookup, current, avatarSVG, SUGGESTIONS };
})();
