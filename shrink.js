function scaleContainerContent(containerId, padding = 10) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const content = container.querySelector(".content");
  if (!content) return;

  // Reset scaling
  content.style.transform = "scale(1)";
  content.style.width = "auto";

  // Available width inside the container (minus padding)
  const availableWidth = container.clientWidth - padding * 2;

  // Natural width of content
  const contentWidth = content.scrollWidth;

  // If content is too wide, scale it down
  if (contentWidth > availableWidth) {
    const scale = availableWidth / contentWidth;
    content.style.transform = `scale(${scale})`;
    content.style.width = `${contentWidth * scale}px`;
  }
}

// Run on load
window.addEventListener("load", () => scaleContainerContent("myContainer"));

// Run on resize to stay responsive
window.addEventListener("resize", () => scaleContainerContent("myContainer"));
