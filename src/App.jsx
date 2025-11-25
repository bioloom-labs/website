import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Research from "./pages/Research.jsx";
import People from "./pages/People.jsx";
import Publications from "./pages/Publications.jsx";
import News from "./pages/News.jsx";
import Contact from "./pages/Contact.jsx";
import { fetchJSONC } from "./utils/jsonc.js";

export default function App() {
  const location = useLocation();

  // Preload About page background videos early so they are cached
  // by the time the user scrolls through the scenes.
  useEffect(() => {
    let cancelled = false;

    async function preloadAboutVideos() {
      try {
        const data = await fetchJSONC("/about.jsonc");
        if (cancelled || !data?.videos) return;

        const { videos } = data;
        const urls = new Set();

        if (videos.intro) urls.add(videos.intro);
        if (videos.sections) urls.add(videos.sections);
        if (Array.isArray(videos.narrative)) {
          videos.narrative.forEach((u) => {
            if (u) urls.add(u);
          });
        }

        if (typeof document === "undefined") return;

        urls.forEach((href) => {
          if (!href) return;
          if (
            document.querySelector(`link[data-preload-video="${href}"]`)
          ) {
            return;
          }
          const link = document.createElement("link");
          link.rel = "preload";
          link.as = "video";
          link.href = href;
          link.crossOrigin = "anonymous";
          link.dataset.preloadVideo = href;
          document.head.appendChild(link);
        });
      } catch {
        // Fail silently; About page will still load videos on demand.
      }
    }

    preloadAboutVideos();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_80%_-10%,rgba(16,185,129,0.2),transparent),radial-gradient(800px_400px_at_10%_20%,rgba(4,120,87,0.15),transparent)] bg-brand-950 text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/research" element={<Research />} />
        <Route path="/people" element={<People />} />
        <Route path="/publications" element={<Publications />} />
        <Route path="/news" element={<News />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      {location.pathname === "/about" ? null : <Footer />}
    </div>
  );
}
