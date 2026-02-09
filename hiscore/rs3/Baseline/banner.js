// banner.js
// Fetch hiscores & render skills with tooltips

async function fetchHiscores(username, game = "rs3") {
  let proxyURL;
  if (game === "rs3") {
    proxyURL = `https://rs-hiscore-proxy.myyear.net/hiscores?player=${encodeURIComponent(username)}`;
  } else {
    proxyURL = `https://rs-hiscore-proxy.myyear.net/hiscores?player=${encodeURIComponent(username)}`;
  }
  const response = await fetch(proxyURL);
  if (!response.ok) throw new Error("Failed to fetch stats");

  const text = await response.text();
  const lines = text.split("\n");

  const names = game === "osrs" ? osrsSkillNames : osrsSkillNames;
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

// Lightweight icons hosted on RS Wiki
const skillIcons = {
  Attack: "/hiscore/Baseline/icons/attack.gif",
  Defence: "/hiscore/Baseline/icons/defence.gif",
  Strength: "/hiscore/Baseline/icons/strength.gif",
  Hitpoints: "/hiscore/Baseline/icons/hitpoints.gif",
  Ranged: "/hiscore/Baseline/icons/ranged.gif",
  Prayer: "/hiscore/Baseline/icons/prayer.gif",
  Magic: "/hiscore/Baseline/icons/magic.gif",
  Cooking: "/hiscore/Baseline/icons/cooking.gif",
  Woodcutting: "/hiscore/Baseline/icons/woodcutting.gif",
  Fletching: "/hiscore/Baseline/icons/fletching.gif",
  Fishing: "/hiscore/Baseline/icons/fishing.gif",
  Firemaking: "/hiscore/Baseline/icons/firemaking.gif",
  Crafting: "/hiscore/Baseline/icons/crafting.gif",
  Smithing: "/hiscore/Baseline/icons/smithing.gif",
  Mining: "/hiscore/Baseline/icons/mining.gif",
  Herblore: "/hiscore/Baseline/icons/herblore.gif",
  Agility: "/hiscore/Baseline/icons/agility.gif",
  Thieving: "/hiscore/Baseline/icons/thieving.gif",
  Slayer: "/hiscore/Baseline/icons/slayer.gif",
  Farming: "/hiscore/Baseline/icons/farming.gif",
  Runecraft: "/hiscore/Baseline/icons/runecraft.gif",
  Hunter: "/hiscore/Baseline/icons/hunter.gif",
  Construction: "/hiscore/Baseline/icons/construction.gif"
};

function abbreviateSkill(name) {
  return name.length > 8 ? name.slice(0, 7) + "." : name;
}

function renderBanner(container, username, stats, textColor, fontFamily, mode) {
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "text-wrapper";
  wrapper.style.fontFamily = fontFamily;

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
    li.title = `${stat.skill} — Level: ${stat.level}, XP: ${stat.xp}`;

    if (mode === "icons" && skillIcons[stat.skill]) {
      const img = document.createElement("img");
      img.src = skillIcons[stat.skill];
      img.alt = stat.skill;
      img.onerror = () => {
        li.textContent = `${stat.skill}: ${stat.level}`;
      };
      li.appendChild(img);

      const span = document.createElement("span");
      span.textContent = stat.level;
      span.style.color = textColor;
      li.appendChild(span);

    } else if (mode === "iconsText" && skillIcons[stat.skill]) {
      const img = document.createElement("img");
      img.src = skillIcons[stat.skill];
      img.alt = stat.skill;
      img.onerror = () => {
        li.textContent = `${stat.skill}: ${stat.level}`;
      };
      li.appendChild(img);

      const span = document.createElement("span");
      span.textContent = `${stat.skill}: ${stat.level}`;
      span.style.color = textColor;
      li.appendChild(span);

    } else {
      const textNode = document.createElement("span");
      textNode.textContent = `${abbreviateSkill(stat.skill)}: ${stat.level}`;
      textNode.style.color = textColor;
      li.appendChild(textNode);
    }

    ul.appendChild(li);
  });
  wrapper.appendChild(ul);

  container.appendChild(wrapper);
  fitText(wrapper, container);
}

function fitText(wrapper, container) {
  let size = 16;
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
