let pending = 0;
let waiting = [];

export async function fetchJSONC(path) {
  pending++;
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    const text = await res.text();
    const noBlock = text.replace(/\/\*[\s\S]*?\*\//g, '');         // remove /* ... */ comments
    const noLine = noBlock.replace(/(^|\s)\/\/.*$/gm, '$1');       // remove // comments
    return JSON.parse(noLine);
  } finally {
    pending--;
    if (!pending) {
      waiting.forEach((resolve) => resolve());
      waiting = [];
    }
  }
}

// Resolves once no fetchJSONC call is in flight.
export async function dataSettled() {
  while (pending) await new Promise((resolve) => waiting.push(resolve));
}
