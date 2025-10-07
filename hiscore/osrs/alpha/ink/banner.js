/****************************************************
 * CONFIG SECTION — Customize defaults here
 * (Uncomment + edit values if needed)
 ****************************************************/
/*
const CONFIG = {
  GAME_MODE: "rs3",       // "rs3" or "osrs"
  DEFAULT_FONT_SIZE: 16,  // starting font size (px)
  MIN_FONT_SIZE: 6,       // smallest font size allowed (px)
  DEFAULT_TEXT_COLOR: "#ffffff", // default text color
  WRAPPER_PADDING: 0.9    // % of container used for text wrapper
};
*/

// Default game mode (edit manually here if needed)
const GAME_MODE = "rs3"; // options: "rs3" or "osrs"

async function fetchHiscores(username) {
  let proxyURL;
  if (GAME_MODE === "rs3") {
    proxyURL = `https://osrs-hiscore-proxy.clip-devious-turf.workers.dev?player=${encodeURIComponent(username)}`;
  } else {
    proxyURL = `https://osrs-hiscore-proxy.clip-devious-turf.workers.dev?player=${encodeURIComponent(username)}`;
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

function abbreviateSkill(name) {
  return name.length > 8 ? name.slice(0, 7) + "." : name;
}

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

    li.textContent = `${abbreviateSkill(stat.skill)}: ${stat.level}`;
    li.style.color = textColor;

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
