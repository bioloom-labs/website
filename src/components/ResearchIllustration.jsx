export default function ResearchIllustration({ className = "", style = {} }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 700 1050"
      fill="none"
      className={className}
      style={style}
    >
      <defs>
        <clipPath id="gc">
          <circle cx="350" cy="200" r="155" />
        </clipPath>
      </defs>

      {/* ── GLOBE ─────────────────────────────────────────────────── */}
      <g stroke="#34d399">
        <circle cx="350" cy="200" r="155" strokeWidth="1.2" opacity="0.5" />
        {/* Latitude grid */}
        <g clipPath="url(#gc)" strokeWidth="0.55" opacity="0.25">
          <line x1="195" y1="122" x2="505" y2="122" />
          <line x1="195" y1="161" x2="505" y2="161" />
          <line x1="195" y1="200" x2="505" y2="200" />
          <line x1="195" y1="239" x2="505" y2="239" />
          <line x1="195" y1="278" x2="505" y2="278" />
        </g>
        {/* Longitude grid */}
        <g clipPath="url(#gc)" strokeWidth="0.55" opacity="0.22">
          <line x1="350" y1="45" x2="350" y2="355" />
          <ellipse cx="350" cy="200" rx="52" ry="155" />
          <ellipse cx="350" cy="200" rx="100" ry="155" />
          <ellipse cx="350" cy="200" rx="138" ry="155" />
        </g>
        {/* Africa */}
        <path
          d="M300,168 L356,160 L395,162 L436,188 L446,228 L418,278 L362,342 L342,312 L308,258 L302,248 L272,222 L282,198 Z"
          strokeWidth="1" opacity="0.5" fill="rgba(52,211,153,0.07)"
        />
        {/* Europe */}
        <path
          d="M300,165 L314,157 L322,120 L357,92 L382,102 L388,128 L372,138 L362,164 L357,177 L360,188 L347,184 L341,168 L330,157 L316,163 Z"
          strokeWidth="1" opacity="0.45" fill="rgba(52,211,153,0.06)"
        />
        {/* Arabian Peninsula */}
        <path
          d="M398,178 L424,170 L445,192 L446,218 L428,228 L414,212 L402,196 Z"
          strokeWidth="0.8" opacity="0.38" fill="rgba(52,211,153,0.05)"
        />
        {/* Madagascar */}
        <path
          d="M436,270 L451,274 L454,298 L444,308 L433,296 Z"
          strokeWidth="0.8" opacity="0.35" fill="rgba(52,211,153,0.05)"
        />
        {/* Greenland */}
        <path
          d="M224,96 L264,86 L278,104 L262,118 L232,110 Z"
          strokeWidth="0.8" opacity="0.30" fill="rgba(52,211,153,0.04)"
        />
      </g>
      {/* Globe rim */}
      <circle cx="350" cy="200" r="155" stroke="#6ee7b7" strokeWidth="0.6" opacity="0.15" />

      {/* ── ECOLOGY NETWORK LINES ─────────────────────────────────── */}
      <g stroke="#34d399" strokeWidth="0.6" strokeDasharray="3 5" opacity="0.12">
        <path d="M350,355 Q290,440 140,560 Q100,590 92,680" />
        <path d="M350,355 Q420,440 540,540 Q590,578 605,650" />
        <path d="M350,355 Q352,440 354,530 Q354,590 350,650" />
      </g>
      <g fill="#34d399" opacity="0.28">
        <circle cx="210" cy="495" r="3" /><circle cx="140" cy="558" r="2.5" />
        <circle cx="100" cy="592" r="2" /><circle cx="484" cy="468" r="3" />
        <circle cx="544" cy="538" r="2.5" /><circle cx="596" cy="580" r="2" />
        <circle cx="352" cy="455" r="3" /><circle cx="353" cy="535" r="2.5" />
      </g>

      {/* ── LEFT TREE ─────────────────────────────────────────────── */}
      <g stroke="#34d399" strokeLinecap="round">
        <path d="M76,1050 L80,918 Q78,882 86,844 Q92,808 86,764 Q82,742 92,714" strokeWidth="4" opacity="0.45" />
        <path d="M87,844 Q58,808 28,786 Q10,774 4,754" strokeWidth="2.2" opacity="0.40" />
        <path d="M86,764 Q50,738 22,706 Q6,684 0,664" strokeWidth="1.9" opacity="0.38" />
        <path d="M87,844 Q128,816 156,796 Q176,780 192,764" strokeWidth="2.2" opacity="0.40" />
        <path d="M86,764 Q128,742 164,722 Q184,710 200,702" strokeWidth="1.9" opacity="0.38" />
        <path d="M92,714 Q118,682 144,662 Q162,648 176,638 Q192,628 202,614" strokeWidth="1.6" opacity="0.36" />
        <path d="M28,786 Q18,766 10,750" strokeWidth="1.2" opacity="0.30" />
        <path d="M156,796 Q165,778 170,760" strokeWidth="1.2" opacity="0.30" />
        <path d="M144,662 Q136,642 132,622 Q128,606 134,590" strokeWidth="1.2" opacity="0.30" />
        <path d="M144,662 Q156,646 162,630" strokeWidth="1" opacity="0.26" />
        <path d="M200,702 Q210,686 214,670" strokeWidth="1" opacity="0.26" />
      </g>
      {/* Leaf clusters */}
      <g stroke="#34d399" strokeWidth="0.7" opacity="0.22" fill="rgba(52,211,153,0.05)">
        <path d="M176,638 Q187,616 204,612 Q220,608 226,622 Q232,636 222,648 Q212,658 197,656 Q183,654 176,642 Z" />
        <path d="M168,616 Q178,596 195,594 Q210,592 216,606 Q221,620 211,628 Q200,636 185,630 Q172,624 168,616 Z" />
        <path d="M192,592 Q202,574 218,573 Q232,572 236,586 Q240,600 230,607 Q220,614 206,609 Q194,604 192,592 Z" />
        <path d="M0,660 Q6,648 16,646 Q26,644 28,654 Q30,664 22,669 Q14,674 6,668 Q0,664 0,660 Z" />
        <path d="M10,748 Q6,736 14,730 Q22,724 30,730 Q36,738 32,748 Q28,756 18,756 Q10,754 10,748 Z" />
      </g>

      {/* ── RIGHT TREE ────────────────────────────────────────────── */}
      <g stroke="#34d399" strokeLinecap="round">
        <path d="M590,1050 L585,948 Q582,916 588,882" strokeWidth="2.8" opacity="0.30" />
        <path d="M587,918 Q568,900 552,890 Q536,882 524,875" strokeWidth="1.6" opacity="0.28" />
        <path d="M588,882 Q606,862 622,848 Q636,836 646,828" strokeWidth="1.6" opacity="0.28" />
        <path d="M588,882 Q580,858 578,838 Q575,818 580,798" strokeWidth="1.2" opacity="0.24" />
        <path d="M580,798 Q588,778 598,762" strokeWidth="1" opacity="0.20" />
      </g>
      <g stroke="#34d399" strokeWidth="0.7" opacity="0.18" fill="rgba(52,211,153,0.04)">
        <path d="M558,864 Q552,848 560,838 Q568,828 578,832 Q588,836 590,848 Q592,860 584,867 Q574,874 564,869 Z" />
        <path d="M574,836 Q570,820 580,812 Q590,804 600,810 Q608,816 606,828 Q604,840 596,844 Q586,848 578,842 Z" />
      </g>

      {/* ── DNA HELIX ─────────────────────────────────────────────── */}
      <g stroke="#34d399" strokeWidth="0.65" opacity="0.16">
        <path d="M658,400 Q672,422 658,444 Q644,466 658,488 Q672,510 658,532 Q644,554 658,576 Q672,598 658,620" />
        <path d="M676,400 Q662,422 676,444 Q690,466 676,488 Q662,510 676,532 Q690,554 676,576 Q662,598 676,620" />
        {[432,454,476,498,520,542,564,586,608].map(y => (
          <line key={y} x1="658" y1={y} x2="676" y2={y} />
        ))}
      </g>

      {/* ── BIRDS ─────────────────────────────────────────────────── */}
      <g stroke="#34d399" strokeWidth="0.9" strokeLinecap="round" opacity="0.35">
        <path d="M462,432 Q470,426 478,432" /><path d="M470,428 Q478,422 486,428" />
        <path d="M534,392 Q542,386 550,392" />
        <path d="M184,504 Q192,498 200,504" /><path d="M192,500 Q200,494 208,500" />
        <path d="M614,484 Q622,478 630,484" />
        <path d="M120,448 Q128,442 136,448" />
      </g>

      {/* ── DANDELION SEEDS ───────────────────────────────────────── */}
      <g stroke="#34d399" strokeWidth="0.5" strokeLinecap="round" opacity="0.20">
        <circle cx="502" cy="628" r="3.5" fill="rgba(52,211,153,0.22)" />
        <line x1="502" y1="624" x2="500" y2="606" /><path d="M500,606 Q495,599 491,597" />
        <line x1="502" y1="624" x2="504" y2="606" /><path d="M504,606 Q509,599 513,597" />
        <line x1="502" y1="624" x2="508" y2="608" /><path d="M508,608 Q514,603 518,605" />
        <line x1="502" y1="624" x2="494" y2="608" /><path d="M494,608 Q490,604 486,607" />
        <circle cx="479" cy="582" r="1.5" fill="rgba(52,211,153,0.3)" /><path d="M479,580 Q475,572 472,570" />
        <circle cx="528" cy="574" r="1.5" fill="rgba(52,211,153,0.3)" /><path d="M528,572 Q532,564 534,562" />
        <circle cx="512" cy="550" r="1.5" fill="rgba(52,211,153,0.3)" /><path d="M512,548 Q516,540 518,538" />
      </g>

      {/* ── LEAF SKETCHES ─────────────────────────────────────────── */}
      <g stroke="#34d399" strokeWidth="0.7" opacity="0.26" fill="rgba(52,211,153,0.04)">
        <path d="M560,352 Q577,328 598,323 Q618,318 626,334 Q632,350 618,362 Q603,374 583,370 Q565,368 560,352 Z" />
        <path d="M560,352 Q594,345 626,334" strokeWidth="0.5" />
        <path d="M568,360 Q598,351 618,340" strokeWidth="0.4" opacity="0.7" />
      </g>
      <g stroke="#34d399" strokeWidth="0.7" opacity="0.24" fill="rgba(52,211,153,0.04)">
        <path d="M38,604 Q50,582 68,580 Q84,578 88,592 Q90,606 78,614 Q66,622 50,618 Q36,614 38,604 Z" />
        <path d="M38,604 Q64,594 88,592" strokeWidth="0.5" />
      </g>

      {/* ── BUTTERFLY ─────────────────────────────────────────────── */}
      <g stroke="#34d399" strokeWidth="0.8" opacity="0.28" fill="rgba(52,211,153,0.05)">
        <path d="M182,724 Q169,714 166,700 Q164,688 172,684 Q180,680 185,692 Q189,703 187,716 Z" />
        <path d="M182,724 Q171,734 169,748 Q167,760 176,764 Q185,767 188,756 Q191,744 187,732 Z" />
        <path d="M182,724 Q195,714 198,700 Q200,688 192,684 Q184,680 179,692 Q175,703 177,716 Z" />
        <path d="M182,724 Q193,734 195,748 Q197,760 188,764 Q179,767 176,756 Q173,744 177,732 Z" />
        <line x1="182" y1="717" x2="182" y2="731" strokeWidth="1.2" />
        <path d="M182,717 Q176,708 172,702" strokeWidth="0.7" />
        <circle cx="172" cy="701" r="1.5" fill="#34d399" opacity="0.4" />
        <path d="M182,717 Q188,708 192,702" strokeWidth="0.7" />
        <circle cx="192" cy="701" r="1.5" fill="#34d399" opacity="0.4" />
      </g>

      {/* ── FERN ──────────────────────────────────────────────────── */}
      <g stroke="#34d399" strokeWidth="0.7" strokeLinecap="round" opacity="0.32">
        <path d="M46,975 Q50,944 54,914 Q56,897 60,882" />
        <path d="M47,963 Q34,954 27,946" /><path d="M48,947 Q34,938 26,930" />
        <path d="M50,932 Q38,922 32,914" /><path d="M52,916 Q41,907 36,899" />
        <path d="M47,963 Q58,952 65,943" /><path d="M48,947 Q60,936 67,928" />
        <path d="M50,932 Q62,921 68,913" /><path d="M52,916 Q63,906 68,898" />
      </g>

      {/* ── WILDFLOWER ────────────────────────────────────────────── */}
      <g stroke="#34d399" strokeWidth="0.8" strokeLinecap="round" opacity="0.32">
        <path d="M624,1050 L622,958 Q620,938 622,918" />
        <path d="M622,972 Q608,963 602,954" /><path d="M622,972 Q634,963 641,954" />
        <path d="M622,944 Q608,935 602,927" /><path d="M622,944 Q635,935 641,927" />
        <circle cx="622" cy="916" r="7" fill="rgba(52,211,153,0.07)" />
        <g fill="rgba(52,211,153,0.06)">
          {[0,45,90,135,180,225,270,315].map(r => (
            <ellipse key={r} cx="622" cy="906" rx="3.5" ry="8" transform={`rotate(${r} 622 916)`} />
          ))}
        </g>
        <circle cx="622" cy="916" r="4" fill="rgba(52,211,153,0.2)" />
      </g>

      {/* ── FIGURE 1 — researcher pointing ───────────────────────── */}
      <g stroke="#34d399" strokeLinecap="round" strokeLinejoin="round" opacity="0.65">
        <circle cx="290" cy="856" r="14" strokeWidth="1.2" fill="rgba(52,211,153,0.08)" />
        <path d="M278,850 Q281,843 290,843 Q300,843 302,851" strokeWidth="1" />
        <line x1="290" y1="870" x2="290" y2="879" strokeWidth="1.2" />
        <path d="M277,879 Q290,877 303,879 L301,934 Q290,936 279,934 Z" strokeWidth="1.2" fill="rgba(52,211,153,0.05)" />
        <path d="M277,886 Q256,872 242,860" strokeWidth="1.2" />
        <path d="M303,886 Q316,906 313,922" strokeWidth="1.2" />
        <path d="M283,934 Q277,960 274,986" strokeWidth="1.4" />
        <path d="M298,934 Q304,960 314,983" strokeWidth="1.4" />
        <path d="M274,986 Q266,991 270,997" strokeWidth="1.2" />
        <path d="M314,983 Q321,989 317,995" strokeWidth="1.2" />
        <path d="M303,892 Q314,896 318,910 Q316,920 306,916" strokeWidth="0.9" opacity="0.7" />
      </g>

      {/* ── FIGURE 2 — researcher with notepad ───────────────────── */}
      <g stroke="#34d399" strokeLinecap="round" strokeLinejoin="round" opacity="0.58">
        <circle cx="386" cy="853" r="15" strokeWidth="1.2" fill="rgba(52,211,153,0.07)" />
        <line x1="386" y1="868" x2="386" y2="876" strokeWidth="1.2" />
        <path d="M371,876 Q386,874 401,876 L399,931 Q386,934 373,931 Z" strokeWidth="1.2" fill="rgba(52,211,153,0.05)" />
        <path d="M371,882 Q354,901 352,919" strokeWidth="1.2" />
        <path d="M401,882 Q416,897 420,912" strokeWidth="1.2" />
        <path d="M377,931 Q372,957 368,984" strokeWidth="1.4" />
        <path d="M395,931 Q401,958 409,982" strokeWidth="1.4" />
        <path d="M368,984 Q360,990 364,996" strokeWidth="1.2" />
        <path d="M409,982 Q416,988 412,994" strokeWidth="1.2" />
        <path d="M420,909 L426,906 L428,918 L422,921 Z" strokeWidth="0.9" opacity="0.7" />
      </g>

      {/* ── PLANT being examined ──────────────────────────────────── */}
      <g stroke="#34d399" strokeWidth="0.8" strokeLinecap="round" opacity="0.42">
        <path d="M240,992 L238,930 Q236,912 240,896" />
        <path d="M239,962 Q226,954 220,946" /><path d="M239,962 Q250,954 256,946" />
        <path d="M239,942 Q227,933 222,926" /><path d="M239,942 Q250,933 255,926" />
        <circle cx="240" cy="893" r="6.5" fill="rgba(52,211,153,0.09)" />
        <g fill="rgba(52,211,153,0.06)">
          {[0,60,120,180,240,300].map(r => (
            <ellipse key={r} cx="240" cy="883" rx="3" ry="7" transform={`rotate(${r} 240 893)`} />
          ))}
        </g>
        <circle cx="240" cy="893" r="4" fill="rgba(52,211,153,0.18)" />
      </g>

      {/* ── GROUND VEGETATION ─────────────────────────────────────── */}
      <g stroke="#34d399" strokeWidth="0.7" strokeLinecap="round" opacity="0.28">
        {[110,120,132,142,152,445,455,466,477,528,538,549].map(x => (
          <path key={x} d={`M${x},1050 Q${x-2},1030 ${x+2},1010`} />
        ))}
      </g>
      <line x1="0" y1="1004" x2="700" y2="1004" stroke="#34d399" strokeWidth="0.5" opacity="0.14" />

      {/* ── NETWORK CONSTELLATIONS ────────────────────────────────── */}
      <g fill="#34d399" opacity="0.20" stroke="#34d399" strokeWidth="0.45" strokeDasharray="3 3">
        <circle cx="24" cy="298" r="2.5" /><circle cx="58" cy="278" r="2" />
        <circle cx="44" cy="330" r="2" /><circle cx="79" cy="308" r="1.5" />
        <line x1="24" y1="298" x2="58" y2="278" /><line x1="24" y1="298" x2="44" y2="330" />
        <line x1="58" y1="278" x2="79" y2="308" /><line x1="44" y1="330" x2="79" y2="308" />
        <circle cx="654" cy="312" r="2.5" /><circle cx="628" cy="292" r="2" />
        <circle cx="674" cy="282" r="2" /><circle cx="644" cy="338" r="1.5" />
        <line x1="654" y1="312" x2="628" y2="292" /><line x1="654" y1="312" x2="674" y2="282" />
        <line x1="654" y1="312" x2="644" y2="338" /><line x1="674" y1="282" x2="644" y2="338" />
      </g>

      {/* ── SCALE BAR ─────────────────────────────────────────────── */}
      <g stroke="#34d399" strokeWidth="0.7" opacity="0.18">
        <line x1="560" y1="1000" x2="660" y2="1000" />
        <line x1="560" y1="995" x2="560" y2="1005" />
        <line x1="610" y1="995" x2="610" y2="1005" />
        <line x1="660" y1="995" x2="660" y2="1005" />
      </g>
    </svg>
  );
}
