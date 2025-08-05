export function parseTableFromText(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const table = lines.map(line => line.split(/\t+|\s{2,}/)); // split by tabs or 2+ spaces
    return table;
}
