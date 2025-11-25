export async function fetchJSONC(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  const text = await res.text();
  const noBlock = text.replace(/\/\*[\s\S]*?\*\//g, '');         // remove /* ... */ comments
  const noLine = noBlock.replace(/(^|\s)\/\/.*$/gm, '$1');       // remove // comments
  return JSON.parse(noLine);
}