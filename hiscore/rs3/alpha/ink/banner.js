// banner.js
// Fetch hiscores & render skills with tooltips

async function fetchHiscores(username, game = "rs3") {
  let proxyURL;
  if (game === "rs3") {
    proxyURL = `https://rs-hiscore-proxy.myyear.net?player=${encodeURIComponent(username)}`;
  } else {
    proxyURL = `https://rs-hiscore-proxy.myyear.net?player=${encodeURIComponent(username)}`;
  }

  const response = await fetch(proxyURL);
  if (!response.ok) throw new Error("Failed to fetch stats");

  const text = await response.text();
  const lines = text.split("\n");

  const names = game === "rs3" ? rs3SkillNames : osrsSkillNames;
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
  Attack: "https://static.wikia.nocookie.net/2007scape/images/1/15/Attack_icon.png",
  Defence: "https://static.wikia.nocookie.net/2007scape/images/5/5d/Defence_icon.png",
  Strength: "https://static.wikia.nocookie.net/2007scape/images/6/60/Strength_icon.png",
  Hitpoints: "https://static.wikia.nocookie.net/2007scape/images/f/fc/Hitpoints_icon.png",
  Ranged: "https://static.wikia.nocookie.net/2007scape/images/8/87/Ranged_icon.png",
  Prayer: "https://static.wikia.nocookie.net/2007scape/images/f/fb/Prayer_icon.png",
  Magic: "https://static.wikia.nocookie.net/2007scape/images/b/b5/Magic_icon.png",
  Cooking: "https://static.wikia.nocookie.net/2007scape/images/7/70/Cooking_icon.png",
  Woodcutting: "https://static.wikia.nocookie.net/2007scape/images/d/d1/Woodcutting_icon.png",
  Fletching: "https://static.wikia.nocookie.net/2007scape/images/7/79/Fletching_icon.png",
  Fishing: "https://static.wikia.nocookie.net/2007scape/images/6/65/Fishing_icon.png",
  Firemaking: "https://static.wikia.nocookie.net/2007scape/images/4/4a/Firemaking_icon.png",
  Crafting: "https://static.wikia.nocookie.net/2007scape/images/d/d9/Crafting_icon.png",
  Smithing: "https://static.wikia.nocookie.net/2007scape/images/e/e6/Smithing_icon.png",
  Mining: "https://static.wikia.nocookie.net/2007scape/images/0/0c/Mining_icon.png",
  Herblore: "https://static.wikia.nocookie.net/2007scape/images/0/05/Herblore_icon.png",
  Agility: "https://static.wikia.nocookie.net/2007scape/images/3/30/Agility_icon.png",
  Thieving: "https://static.wikia.nocookie.net/2007scape/images/4/4a/Thieving_icon.png",
  Slayer: "https://static.wikia.nocookie.net/2007scape/images/5/56/Slayer_icon.png",
  Farming: "https://static.wikia.nocookie.net/2007scape/images/d/d2/Farming_icon.png",
  Runecraft: "https://static.wikia.nocookie.net/2007scape/images/8/8b/Runecraft_icon.png",
  Hunter: "https://static.wikia.nocookie.net/2007scape/images/f/f9/Hunter_icon.png",
  Construction: "https://static.wikia.nocookie.net/2007scape/images/6/6d/Construction_icon.png"
  
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

    // Tooltip with full skill name + level + XP
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
