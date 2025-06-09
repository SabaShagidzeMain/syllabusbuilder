export function autoResize(textarea) {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
}

export function isValidContent(content) {
    if (!Array.isArray(content)) return false;
    return content.every(
        (section) =>
            section &&
            Array.isArray(section.cells) &&
            section.cells.every(
                (row) =>
                    Array.isArray(row) && row.every((cell) => typeof cell === "object")
            )
    );
}

export function getGlobalRowIndex(rowIndex, sectionIndex, sections) {
    let globalIndex = 0;
    for (let i = 0; i < sectionIndex; i++) {
        globalIndex += sections[i].cells.length;
    }
    return globalIndex + rowIndex;
}
