export default function Footer() {
  return (
    <>
      {/* Main footer */}
      <footer className="border-t border-white/10 bg-brand-950/60 backdrop-blur supports-[backdrop-filter]:bg-brand-950/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-10 text-sm text-white/70 md:flex-row md:justify-between">

          {/* Left section */}
          <div className="text-center md:text-left">
            © {new Date().getFullYear()} BioLoom Labs. All rights reserved.
          </div>

          {/* Middle links */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/about" className="hover:text-white">About</a>
            <a href="/research" className="hover:text-white">Research</a>
            <a href="/people" className="hover:text-white">People</a>
            <a href="/publications" className="hover:text-white">Publications</a>
          </div>

          {/* Right section (small partner logos) */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {/* QMUL card */}
            <a
              href="https://www.qmul.ac.uk"
              target="_blank"
              rel="noreferrer"
              className="group rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10 hover:shadow-glow"
              title="Queen Mary University of London"
            >
              <img
                src="/images/logos/qmul.png"
                alt="Queen Mary University of London"
                className="h-8 w-auto opacity-80 transition group-hover:opacity-100"
                style={{ filter: "brightness(0) invert(1)" }}
                loading="lazy"
              />
            </a>

            {/* Kew card */}
            <a
              href="https://www.kew.org"
              target="_blank"
              rel="noreferrer"
              className="group rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10 hover:shadow-glow"
              title="Royal Botanic Gardens, Kew"
            >
              <img
                src="/images/logos/kew.png"
                alt="Royal Botanic Gardens, Kew"
                className="h-8 w-auto opacity-80 transition group-hover:opacity-100"
                style={{ filter: "brightness(0) invert(1)" }}
                loading="lazy"
              />
            </a>
          </div>
        </div>
      </footer>

      {/* Partnered with strip */}
      <section className="border-t border-white/10 bg-white/5 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-10 px-4">
          <div className="text-white/70 text-sm font-medium tracking-wide">
            In collaboration with
          </div>

          <a
            href="https://www.kew.org"
            target="_blank"
            rel="noreferrer"
            className="group transition hover:opacity-100"
            title="Royal Botanic Gardens, Kew"
          >
            <img
              src="/images/logos/kew.png"
              alt="Royal Botanic Gardens, Kew"
              className="h-10 w-auto opacity-80 group-hover:opacity-100 transition"
              style={{ filter: "brightness(0) invert(1)" }}
              loading="lazy"
            />
          </a>

          <a
            href="https://www.qmul.ac.uk"
            target="_blank"
            rel="noreferrer"
            className="group transition hover:opacity-100"
            title="Queen Mary University of London"
          >
            <img
              src="/images/logos/qmul.png"
              alt="Queen Mary University of London"
              className="h-9 w-auto opacity-80 group-hover:opacity-100 transition"
              style={{ filter: "brightness(0) invert(1)" }}
              loading="lazy"
            />
          </a>
        </div>
      </section>
    </>
  );
}
