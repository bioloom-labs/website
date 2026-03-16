const VIDEO = "/images/videos/about/1080p_beereddahlia.mp4";

const LEVELS = [
  { label: "Frost 0",         bg: "bg-white/10",        blur: "backdrop-blur-none",    border: "border-white/30"         },
  { label: "Frost 2px",       bg: "bg-white/10",        blur: "backdrop-blur-[2px]",   border: "border-white/30"         },
  { label: "Frost 4px",       bg: "bg-white/10",        blur: "backdrop-blur-[4px]",   border: "border-white/30"         },
  { label: "Frost 0 — green", bg: "bg-emerald-500/10",  blur: "backdrop-blur-none",    border: "border-emerald-300/40"   },
  { label: "Frost 2px — green", bg: "bg-emerald-500/10",blur: "backdrop-blur-[2px]",   border: "border-emerald-300/40"   },
  { label: "Frost 4px — green", bg: "bg-emerald-500/10",blur: "backdrop-blur-[4px]",   border: "border-emerald-300/40"   },
];

function Cell({ label, bg, blur = "backdrop-blur-none", border = "border-white/20" }) {
  return (
    <div className="relative overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={VIDEO}
        muted
        loop
        playsInline
        autoPlay
      />
      {/* centre the card */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div
          className={[
            bg,
            blur,
            border,
            "w-full max-w-xs rounded-[2rem] border px-7 py-8",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.35)]",
            "space-y-2",
          ].join(" ")}
        >
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-emerald-50/50">{label}</p>
          <h3 className="text-lg font-semibold text-emerald-300 leading-snug">
            The quick brown fox
          </h3>
          <p className="text-emerald-50/90 text-sm leading-relaxed">
            The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TransparencyTest() {
  return (
    <div
      className="fixed inset-0 grid"
      style={{ gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 1fr)" }}
    >
      {LEVELS.map(({ label, bg, blur, border }) => (
        <Cell key={label} label={label} bg={bg} blur={blur} border={border} />
      ))}
    </div>
  );
}
