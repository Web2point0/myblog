/****************************************************
 * CONFIG SECTION — Customize defaults here
 ****************************************************/
/*
const CONFIG = {
  GAME_MODE: "rs3",       // "rs3" or "osrs"
  DEFAULT_FONT_SIZE: 16,  // starting font size (px)
  MIN_FONT_SIZE: 6,       // smallest font size allowed (px)
  DEFAULT_TEXT_COLOR: "#ffffff" // default text color
};
*/

const GAME_MODE = "osrs"; // options: "rs3" or "osrs"

// ✅ Skill icons mapping
const skillIcons = {
  "Overall": "overall.png",
  "Attack": "https://runescape.wiki/images/archive/20111217064256%21Attack-icon.png",
  "Defence": "https://runescape.wiki/images/archive/20111217063444%21Defence-icon.png",
  "Strength": "https://runescape.wiki/images/archive/20110305005001%21Strength-icon.png?46a31",
  "Hitpoints": "https://runescape.wiki/images/archive/20111122192106%21Hitpoints-icon.png",
  "Ranged": "https://runescape.wiki/images/archive/20111127130541%21Ranged-icon.png",
  "Prayer": "https://runescape.wiki/images/archive/20101220203305%21Prayer-icon.png",
  "Magic": "https://runescape.wiki/images/archive/20110305043123%21Magic-icon.png",
  "Cooking": "https://runescape.wiki/images/archive/20110305013006%21Cooking-icon.png",
  "Woodcutting": "https://runescape.wiki/images/archive/20110305043015%21Woodcutting-icon.png",
  "Fletching": "https://runescape.wiki/images/archive/20091231200715%21Fletching-icon.png",
  "Fishing": "https://runescape.wiki/images/archive/20110305011848%21Fishing-icon.png",
  "Firemaking": "https://runescape.wiki/images/archive/20110305043138%21Firemaking-icon.png",
  "Crafting": "https://runescape.wiki/images/archive/20101103053741%21Crafting-icon.png",
  "Smithing": "https://runescape.wiki/images/archive/20110305005838%21Smithing-icon.png",
  "Mining": "https://runescape.wiki/images/archive/20110305042814%21Mining-icon.png",
  "Herblore": "https://runescape.wiki/images/archive/20091231200715%21Herblore-icon.png",
  "Agility": "https://runescape.wiki/images/archive/20091231200714%21Agility-icon.png",
  "Thieving": "https://runescape.wiki/images/archive/20110305043215%21Thieving-icon.png",
  "Slayer": "https://runescape.wiki/images/archive/20091231200715%21Slayer-icon.png",
  "Farming": "https://runescape.wiki/images/archive/20091231200715%21Farming-icon.png",
  "Runecraft": "https://runescape.wiki/images/archive/20101103053737%21Runecrafting-icon.png",
  "Hunter": "https://runescape.wiki/images/archive/20110305015426%21Hunter-icon.png",
  "Construction": "https://runescape.wiki/images/archive/20091231200715%21Construction-icon.png",
    "Summoning": "https://runescape.wiki/images/archive/20101017213253%21Summoning-icon.png",

  "Dungeoneering": "https://runescape.wiki/images/archive/20101102021928%21Dungeoneering-icon.png",
  "Divination": "https://runescape.wiki/images/archive/20130821174132%21Divination-icon.png",
  "Invention": "https://runescape.wiki/images/Invention-icon.png?ce4a7",
  "Archaeology": "https://runescape.wiki/images/Archaeology-icon.png?48b2f"
};

async function fetchHiscores(username) {
  let proxyURL;
  if (GAME_MODE === "osrs") {
    proxyURL = `https://osrs-hiscore-proxy.myyear.net?player=${encodeURIComponent(username)}`;
  } else {
    proxyURL = `https://osrs-hiscore-proxy.myyear.net?player=${encodeURIComponent(username)}`;
  }

  const response = await fetch(proxyURL);
  if (!response.ok) throw new Error("Failed to fetch stats");

  const text = await response.text();
  const lines = text.split("\n");

  const names = GAME_MODE === "osrs" ? rs3SkillNames : osrsSkillNames;
  const limit = names.length;

  return lines.slice(0, limit).map((line, index) => {
    const [rank, level, xp] = line.split(",");
    return { skill: names[index], level, xp };
  });
}

const rs3SkillNames = [
  "Overall","Attack","Defence","Strength","Hitpoints","Ranged",
  "Prayer","Magic","Cooking","Woodcutting","Fletching","Fishing",
  "Firemaking","Crafting","Smithing","Mining","Herblore","Agility",
  "Thieving","Slayer","Farming","Runecraft","Hunter","Construction"
];

const osrsSkillNames = [
  "Overall","Attack","Defence","Strength","Hitpoints","Ranged",
  "Prayer","Magic","Cooking","Woodcutting","Fletching","Fishing",
  "Firemaking","Crafting","Smithing","Mining","Herblore","Agility",
  "Thieving","Slayer","Farming","Runecraft","Hunter","Construction"
];

function renderBanner(container, username, stats, textColor) {
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "text-wrapper";

  // Username
  const title = document.createElement("div");
  title.className = "banner-username";
  title.textContent = username;
  title.style.color = textColor;
  wrapper.appendChild(title);

  // Skills grid
  const ul = document.createElement("ul");
  ul.className = "skills-grid";
  stats.forEach(stat => {
    const li = document.createElement("li");

    // Tooltip full skill + XP
    li.title = `${stat.skill} — Level: ${stat.level}, XP: ${stat.xp}`;

    const icon = document.createElement("img");
    icon.src = skillIcons[stat.skill] || "";
    icon.alt = stat.skill;
    icon.className = "skill-icon";

    const span = document.createElement("span");
    span.textContent = stat.level;
    span.style.color = textColor;

    li.appendChild(icon);
    li.appendChild(span);
    ul.appendChild(li);
  });
  wrapper.appendChild(ul);

  container.appendChild(wrapper);

  // Scale text to fit wrapper
  fitText(wrapper, container);
}

function fitText(wrapper, container) {
  let size = 16; // default start font size
  wrapper.style.fontSize = size + "px";

  while (
    (wrapper.scrollHeight > container.clientHeight - 8 ||
     wrapper.scrollWidth > container.clientWidth - 8) &&
    size > 6
  ) {
    size--;
    wrapper.style.fontSize = size + "px";
  }
}
