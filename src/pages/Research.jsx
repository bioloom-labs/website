import { useEffect, useState } from "react";
import { Card } from "../components/Card.jsx";
import { fetchJSONC } from "../utils/jsonc.js";

export default function Research() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  // For fade-in animation
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchJSONC("/research.jsonc")
      .then((data) => {
        setItems(data);
        setTimeout(() => setLoaded(true), 50); // small delay for stagger fade-in
      })
      .catch((e) =>
        setError(e?.message || "Failed to load research topics")
      );
  }, []);

  return (
    <section className="section">
      <h2 className="h2-grad">Research Topics</h2>

      {error && (
        <p className="mt-4 text-red-300">
          Error: {error}
        </p>
      )}

      <div
        className={`
          mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 transition-opacity duration-700 
          ${loaded ? "opacity-100" : "opacity-0"}
        `}
      >
        {items.map((it, i) => (
          <Card key={it.id ?? i} title={it.title}>
            {it.image && (
              <img
                src={it.image}
                alt={it.title}
                className="img-research rounded-xl mb-3"
                loading="lazy"
              />
            )}
            <p className="text-zinc-300 leading-relaxed">{it.text}</p>
          </Card>
        ))}
      </div>

      {!error && items.length === 0 && (
        <p className="mt-4 text-zinc-400">
          No research topics found.
        </p>
      )}
    </section>
  );
}
