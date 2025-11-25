import { useEffect, useState } from "react";
import PersonCard from "../components/PersonCard.jsx";
import { fetchJSONC } from "../utils/jsonc.js";

function categorizeMember(member = {}) {
  const roleText = (member.role || "").toLowerCase();
  if (roleText.includes("principal investigator") || roleText.includes("pi")) {
    return "pi";
  }
  if (
    roleText.includes("postdoc") ||
    roleText.includes("post-doc") ||
    roleText.includes("postdoctoral")
  ) {
    return "postdoc";
  }
  if (roleText.includes("phd") || roleText.includes("doctoral")) {
    return "phd";
  }
  if (
    roleText.includes("undergraduate") ||
    roleText.includes("bsc") ||
    roleText.includes("undergrad")
  ) {
    return "undergrad";
  }
  return "other";
}

function LoadingPen({ label = "Loading…" }) {
  return (
    <div className="mt-12 flex flex-col items-center gap-4 text-white/70">
      <div className="pen-loading-wrapper">
        <svg
          viewBox="0 0 260 70"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 40 C 40 10, 80 10, 110 40 S 180 70, 230 40"
            className="pen-path"
            fill="none"
            stroke="rgba(45, 212, 191, 0.9)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <p className="text-sm tracking-wide uppercase text-white/60">{label}</p>
    </div>
  );
}

function MembersSection({
  title,
  members = [],
  appearOffset = 0,
  showCount = true,
}) {
  const hasMembers = Array.isArray(members) && members.length > 0;
  return (
    <div>
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        {hasMembers && showCount && (
          <span className="pill text-xs text-white/70 bg-white/5 border-white/25">
            {members.length} {members.length === 1 ? "person" : "people"}
          </span>
        )}
      </div>

      {hasMembers ? (
        <div className="mt-6 flex flex-col gap-4">
          {members.map((p, idx) => (
            <PersonCard
              key={`${title}-${p.name}-${idx}`}
              name={p.name}
              role={p.role}
              blurb={p.description}
              photo={p.photo}
              email={p.email}
              website={p.website}
              twitter={p.twitter}
              linkedin={p.linkedin}
              github={p.github}
              links={p.links || []}
              appearOrder={appearOffset + idx}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/60">
          No {title.toLowerCase()} listed yet.
        </p>
      )}
    </div>
  );
}

export default function People() {
  const [data, setData] = useState({ sections: [], previous: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPeople() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchJSONC("/people.jsonc");

        if (Array.isArray(response)) {
          setData({ current: response, previous: [] });
          return;
        }

        const previous = Array.isArray(response?.previous)
          ? response.previous
          : [];

        let sections = [];

        if (Array.isArray(response?.current_sections)) {
          sections = response.current_sections.map((section, idx) => ({
            title: section?.title || `Section ${idx + 1}`,
            members: Array.isArray(section?.members) ? section.members : [],
          }));
        } else {
          const current = Array.isArray(response?.current)
            ? response.current
            : [];

          const categoryOrder = [
            { key: "pi", title: "Principal Investigator" },
            { key: "postdoc", title: "Postdoctoral Fellows" },
            { key: "phd", title: "PhD Researchers" },
            { key: "undergrad", title: "Undergraduate Researchers" },
            { key: "other", title: "Research Collaborators" },
          ];

          sections = categoryOrder
            .map(({ key, title }) => ({
              title,
              members: current.filter(
                (member) => categorizeMember(member) === key
              ),
            }))
            .filter((section) => section.members.length > 0);
        }

        setData({ sections, previous });
      } catch (e) {
        setError(e.message || "Failed to load people");
        setData({ sections: [], previous: [] });
      } finally {
        setLoading(false);
      }
    }

    loadPeople();
  }, []);

  const sections = data.sections || [];
  const previousMembers = data.previous || [];
  const totalCurrentCount = sections.reduce(
    (sum, section) =>
      sum + (Array.isArray(section.members) ? section.members.length : 0),
    0
  );

  return (
    <section className="section">
      <div className="max-w-3xl">
        <h2 className="h2-grad">People</h2>
        <p className="mt-3 max-w-3xl text-white/80">
          BioLoom Labs is led by{" "}
          <span className="text-brand-300 font-medium">
            Dr. Samuel Pironon
          </span>{" "}
          and brings together ecologists, data scientists, and collaborators
          across institutions.
        </p>
      </div>

      {error && (
        <p className="mt-6 text-red-300">Unable to load people: {error}</p>
      )}

      {loading ? (
        <LoadingPen label="Loading people…" />
      ) : (
        <div className="mt-12 space-y-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-semibold text-white">
                Current lab members
              </h3>
              {totalCurrentCount > 0 && (
                <span className="pill text-xs text-white/70 bg-white/5 border-white/25">
                  {totalCurrentCount}{" "}
                  {totalCurrentCount === 1 ? "person" : "people"}
                </span>
              )}
            </div>

            {sections.length ? (
              <div className="space-y-10">
                {(() => {
                  let offset = 0;
                  return sections.map((section, idx) => {
                    const members = Array.isArray(section.members)
                      ? section.members
                      : [];
                    const node = (
                      <MembersSection
                        key={`${section.title || "Section"}-${idx}`}
                        title={section.title || `Section ${idx + 1}`}
                        members={members}
                        appearOffset={offset}
                        showCount={false}
                      />
                    );
                    offset += members.length;
                    return node;
                  });
                })()}
              </div>
            ) : (
              <p className="text-sm text-white/60">
                No current lab members listed yet.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-white">
              Previous lab members
            </h3>
            <MembersSection
              title="Alumni"
              members={previousMembers}
              appearOffset={totalCurrentCount}
            />
          </div>
        </div>
      )}
    </section>
  );
}
