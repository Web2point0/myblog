// banner.js
async function fetchHiscores(username, game = "rs3") {
  const url = `https://rs-hiscore-proxy.myyear.net/hiscores?player=${encodeURIComponent(username)}&game=${game}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch hiscores");
  const text = await res.text();
  return parseHiscores(text, game);
}

function parseHiscores(csv, game) {
  const lines = csv.trim().split("\n");
  const skills = [];

  const RS3_SKILLS = [
    "Attack","Defence","Strength","Constitution","Ranged","Prayer","Magic",
    "Cooking","Woodcutting","Fletching","Fishing","Firemaking","Crafting","Smithing",
    "Mining","Herblore","Agility","Thieving","Slayer","Farming","Runecrafting",
    "Hunter","Construction","Summoning","Dungeoneering","Divination","Invention","Archaeology"
  ];

  const OSRS_SKILLS = [
    "Overall","Attack","Defence","Strength","Hitpoints","Ranged","Prayer","Magic",
    "Cooking","Woodcutting","Fletching","Fishing","Firemaking","Crafting","Smithing",
    "Mining","Herblore","Agility","Thieving","Slayer","Farming","Runecrafting",
    "Hunter","Construction"
  ];

  const skillNames = game === "rs3" ? RS3_SKILLS : OSRS_SKILLS;
  const max = Math.min(skillNames.length, lines.length);

  let totalLevel = 0;
  let totalXp = 0;

  for (let i = 0; i < max; i++) {
    const parts = lines[i].split(",");
    if (parts.length < 3) continue;
    const [rank, level, xp] = parts;
    totalLevel += parseInt(level, 10) || 0;
    totalXp += parseInt(xp, 10) || 0;
    skills.push({ name: skillNames[i], rank, level, xp });
  }

  // 🔹 Add synthetic Overall row for RS3
  if (game === "rs3") {
    skills.unshift({
      name: "Overall",
      rank: "-",
      level: totalLevel,
      xp: totalXp
    });
  }

  return skills;
}

const ICON_MAP_RS3 = {
  Overall: "overall.png",
  Attack: "https://oldschool.runescape.wiki/images/Attack_icon.png",
  Defence: "https://oldschool.runescape.wiki/images/Defence_icon.png",
  Strength: "https://oldschool.runescape.wiki/images/Strength_icon.png",
  Constitution: "https://oldschool.runescape.wiki/images/Hitpoints_icon.png",
  Ranged: "https://oldschool.runescape.wiki/images/Ranged_icon.png",
  Prayer: "https://oldschool.runescape.wiki/images/Prayer_icon.png",
  Magic: "https://oldschool.runescape.wiki/images/Magic_icon.png",
  Cooking: "https://oldschool.runescape.wiki/images/Cooking_icon.png",
  Woodcutting: "https://oldschool.runescape.wiki/images/Woodcutting_icon.png",
  Fletching: "https://oldschool.runescape.wiki/images/Fletching_icon.png",
  Fishing: "https://oldschool.runescape.wiki/images/Fishing_icon.png",
  Firemaking: "https://oldschool.runescape.wiki/images/Firemaking_icon.png",
  Crafting: "https://oldschool.runescape.wiki/images/Crafting_icon.png",
  Smithing: "https://oldschool.runescape.wiki/images/Smithing_icon.png",
  Mining: "https://oldschool.runescape.wiki/images/Mining_icon.png",
  Herblore: "https://oldschool.runescape.wiki/images/Herblore_icon.png",
  Agility: "https://oldschool.runescape.wiki/images/Agility_icon.png",
  Thieving: "https://oldschool.runescape.wiki/images/Thieving_icon.png",
  Slayer: "https://oldschool.runescape.wiki/images/Slayer_icon.png",
  Farming: "https://oldschool.runescape.wiki/images/Farming_icon.png",
  Runecrafting: "https://oldschool.runescape.wiki/images/Runecraft_icon.png",
  Hunter: "https://oldschool.runescape.wiki/images/Hunter_icon.png",
  Construction: "https://oldschool.runescape.wiki/images/Construction_icon.png",
  Summoning: "https://runescape.wiki/images/Summoning_icon.png",
  Dungeoneering: "https://runescape.wiki/images/Dungeoneering_icon.png",
  Divination: "https://runescape.wiki/images/Divination_icon.png",
  Invention: "https://runescape.wiki/images/Invention_icon.png",
  Archaeology: "https://runescape.wiki/images/Archaeology_icon.png"
};

const ICON_MAP_OSRS = {
  Overall: "overall.png",
  Attack: "https://oldschool.runescape.wiki/images/Attack_icon.png",
  Defence: "https://oldschool.runescape.wiki/images/Defence_icon.png",
  Strength: "https://oldschool.runescape.wiki/images/Strength_icon.png",
  Hitpoints: "https://oldschool.runescape.wiki/images/Hitpoints_icon.png",
  Ranged: "https://oldschool.runescape.wiki/images/Ranged_icon.png",
  Prayer: "https://oldschool.runescape.wiki/images/Prayer_icon.png",
  Magic: "https://oldschool.runescape.wiki/images/Magic_icon.png",
  Cooking: "https://oldschool.runescape.wiki/images/Cooking_icon.png",
  Woodcutting: "https://oldschool.runescape.wiki/images/Woodcutting_icon.png",
  Fletching: "https://oldschool.runescape.wiki/images/Fletching_icon.png",
  Fishing: "https://oldschool.runescape.wiki/images/Fishing_icon.png",
  Firemaking: "https://oldschool.runescape.wiki/images/Firemaking_icon.png",
  Crafting: "https://oldschool.runescape.wiki/images/Crafting_icon.png",
  Smithing: "https://oldschool.runescape.wiki/images/Smithing_icon.png",
  Mining: "https://oldschool.runescape.wiki/images/Mining_icon.png",
  Herblore: "https://oldschool.runescape.wiki/images/Herblore_icon.png",
  Agility: "https://oldschool.runescape.wiki/images/Agility_icon.png",
  Thieving: "https://oldschool.runescape.wiki/images/Thieving_icon.png",
  Slayer: "https://oldschool.runescape.wiki/images/Slayer_icon.png",
  Farming: "https://oldschool.runescape.wiki/images/Farming_icon.png",
  Runecrafting: "https://oldschool.runescape.wiki/images/Runecraft_icon.png",
  Hunter: "https://oldschool.runescape.wiki/images/Hunter_icon.png",
  Construction: "https://oldschool.runescape.wiki/images/Construction_icon.png"
};

function renderSkills(skills, container, mode = "text", game = "rs3") {
  container.innerHTML = "";
  const ICON_MAP = game === "rs3" ? ICON_MAP_RS3 : ICON_MAP_OSRS;

  skills.forEach(skill => {
    const li = document.createElement("li");

    if (mode === "icons") {
      const img = document.createElement("img");
      img.src = ICON_MAP[skill.name] || "";
      img.alt = skill.name;
      img.title = `${skill.name}: Lv ${skill.level} (${skill.xp} XP)`;
      li.appendChild(img);

      const span = document.createElement("span");
      span.textContent = skill.level;
      li.appendChild(span);
    } else {
      li.textContent = `${skill.name} ${skill.level}`;
      li.title = `${skill.name}: Lv ${skill.level} (${skill.xp} XP)`;
    }

    container.appendChild(li);
  });
}
