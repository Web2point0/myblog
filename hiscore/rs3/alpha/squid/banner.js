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

const GAME_MODE = "rs3"; // options: "rs3" or "osrs"

// ✅ Skill icons mapping
const skillIcons = {
  "Overall": "/hiscore/rs3/icons/overall.png",
  "Attack": "/hiscore/rs3/icons/attack.gif",
  "Defence": "/hiscore/rs3/icons/defence.gif",
  "Strength": "/hiscore/rs3/icons/strength.gif",
  "Hitpoints": "/hiscore/rs3/icons/hitpoints.gif",
  "Ranged": "/hiscore/rs3/icons/ranged.gif",
  "Prayer": "/hiscore/rs3/icons/prayer.gif",
  "Magic": "/hiscore/rs3/icons/magic.gif",
  "Cooking": "/hiscore/rs3/icons/cooking.gif",
  "Woodcutting": "/hiscore/rs3/icons/woodcutting.gif",
  "Fletching": "/hiscore/rs3/icons/fletching.gif",
  "Fishing": "/hiscore/rs3/icons/fishing.gif",
  "Firemaking": "/hiscore/rs3/icons/firemaking.gif",
  "Crafting": "/hiscore/rs3/icons/crafting.gif",
  "Smithing": "/hiscore/rs3/icons/smithing.gif",
  "Mining": "/hiscore/rs3/icons/mining.gif",
  "Herblore": "/hiscore/rs3/icons/herblore.gif",
  "Agility": "/hiscore/rs3/icons/agility.gif",
  "Thieving": "/hiscore/rs3/icons/thieving.gif",
  "Slayer": "/hiscore/rs3/icons/slayer.gif",
  "Farming": "/hiscore/rs3/icons/farming.gif",
  "Runecraft": "/hiscore/rs3/icons/runecraft.gif",
  "Hunter": "/hiscore/rs3/icons/hunter.gif",
  "Construction": "/hiscore/rs3/icons/construction.gif",
  "Summoning": "/hiscore/rs3/icons/Summoning.png",
  "Dungeoneering": "/hiscore/rs3/icons/Dungeoneering.png",
  "Divination": "/hiscore/rs3/icons/Divination.png",
  "Invention": "/hiscore/rs3/icons/Invention.png",
  "Archaeology": "/hiscore/rs3/icons/Archaeology.png"
};

async function fetchHiscores(username) {
  let proxyURL;
  if (GAME_MODE === "rs3") {
    proxyURL = `https://rs-hiscore-proxy.myyear.net?player=${encodeURIComponent(username)}`;
  } else {
    proxyURL = `https://rs-hiscore-proxy.myyear.net?player=${encodeURIComponent(username)}`;
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
