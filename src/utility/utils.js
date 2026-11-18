export const autoResize = (textarea) => {
  if (!textarea) return;

  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
};

export function isValidContent(content) {
  if (!Array.isArray(content)) return false;

  return content.every((section) => {
    if (!section || typeof section !== "object") return false;

    // Custom two-cell layout
    if (
      section.type === "custom-layout" ||
      section.tableId === "custom-layout"
    ) {
      if (!Array.isArray(section.content)) return false;

      return section.content.every((block) => {
        if (!block || typeof block !== "object") return false;

        if (block.type === "text") {
          return true;
        }

        if (block.type === "table") {
          return (
            Array.isArray(block.rows) &&
            block.rows.every(
              (row) =>
                Array.isArray(row) &&
                row.every((cell) => cell && typeof cell === "object"),
            )
          );
        }

        return false;
      });
    }

    // Existing predefined table layout
    return (
      Array.isArray(section.cells) &&
      section.cells.every(
        (row) =>
          Array.isArray(row) &&
          row.every((cell) => cell && typeof cell === "object"),
      )
    );
  });
}

export function getGlobalRowIndex(rowIndex, sectionIndex, sections) {
  let globalIndex = 0;

  for (let i = 0; i < sectionIndex; i++) {
    globalIndex += sections[i]?.cells?.length || 0;
  }

  return globalIndex + rowIndex;
}
