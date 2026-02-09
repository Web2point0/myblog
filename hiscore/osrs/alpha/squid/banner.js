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
  "Overall": "/hiscore/osrs/icons/overall.png",
  "Attack": "/hiscore/osrs/icons/attack.gif",
  "Defence": "/hiscore/osrs/icons/defence.gif",
  "Strength": "/hiscore/osrs/icons/strength.gif",
  "Hitpoints": "/hiscore/osrs/icons/hitpoints.gif",
  "Ranged": "/hiscore/osrs/icons/ranged.gif",
  "Prayer": "/hiscore/osrs/icons/prayer.gif",
  "Magic": "/hiscore/osrs/icons/magic.gif",
  "Cooking": "/hiscore/osrs/icons/cooking.gif",
  "Woodcutting": "/hiscore/osrs/icons/woodcutting.gif",
  "Fletching": "/hiscore/osrs/icons/fletching.gif",
  "Fishing": "/hiscore/osrs/icons/fishing.gif",
  "Firemaking": "/hiscore/osrs/icons/firemaking.gif",
  "Crafting": "/hiscore/osrs/icons/crafting.gif",
  "Smithing": "/hiscore/osrs/icons/smithing.gif",
  "Mining": "/hiscore/osrs/icons/mining.gif",
  "Herblore": "/hiscore/osrs/icons/herblore.gif",
  "Agility": "/hiscore/osrs/icons/agility.gif",
  "Thieving": "/hiscore/osrs/icons/thieving.gif",
  "Slayer": "/hiscore/osrs/icons/slayer.gif",
  "Farming": "/hiscore/osrs/icons/farming.gif",
  "Runecraft": "/hiscore/osrs/icons/runecraft.gif",
  "Hunter": "/hiscore/osrs/icons/hunter.gif",
  "Construction": "/hiscore/osrs/icons/construction.gif",
  "Summoning": "/hiscore/osrs/icons/Summoning.png",
  "Dungeoneering": "/hiscore/osrs/icons/Dungeoneering.png",
  "Divination": "/hiscore/osrs/icons/Divination.png",
  "Invention": "/hiscore/osrs/icons/Invention.png",
  "Archaeology": "/hiscore/osrs/icons/Archaeology-icon.png"
};

async function fetchHiscores(username, game = "rs3") {
  let proxyURL;
  if (game === "rs3") {
    proxyURL = `https://osrs-hiscore-proxy.myyear.net?player=${encodeURIComponent(username)}`;
  } else {
    proxyURL = `https://osrs-hiscore-proxy.myyear.net?player=${encodeURIComponent(username)}`;
  }
  const response = await fetch(proxyURL);
  if (!response.ok) throw new Error("Failed to fetch stats");

  const text = await response.text();
  const lines = text.split("\n");

  const names = GAME_MODE === "rs3" ? rs3SkillNames : osrsSkillNames;
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
  "Thieving","Slayer","Farming","Runecraft","Hunter","Construction",
  "Summoning","Dungeoneering","Divination","Invention","Archaeology"
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
