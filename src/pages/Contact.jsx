"use client";
import { useState } from "react";

export default function Contact() {
    const [name, setName] = useState("");
    const [fromEmail, setFromEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSend = (e) => {
        e.preventDefault();
        const to = "s.pironon@qmul.ac.uk";
        const subject = encodeURIComponent(
            `General enquiry${name ? ` from ${name}` : ""}`
        );
        const body = encodeURIComponent(
            [
                message,
                "",
                "--",
                `Name: ${name || "N/A"}`,
                `Email: ${fromEmail || "N/A"}`
            ].join("\n")
        );
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    };

    return (
        <section className="section">
            <h2 className="h2-grad">Contact</h2>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Left: General enquiries with message form */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <div className="text-sm text-white/70 mb-2">General enquiries</div>
                    <a
                        href="mailto:s.pironon@qmul.ac.uk"
                        className="text-brand-200/90 block mb-4 break-all"
                    >
                        s.pironon@qmul.ac.uk
                    </a>

                    <form onSubmit={handleSend} className="space-y-3">
                        <input
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-sm outline-none focus:border-brand-300"
                        />
                        <input
                            type="email"
                            placeholder="Your email"
                            value={fromEmail}
                            onChange={(e) => setFromEmail(e.target.value)}
                            className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-sm outline-none focus:border-brand-300"
                        />
                        <textarea
                            placeholder="Your message"
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-sm outline-none focus:border-brand-300"
                        />
                        <button type="submit" className="btn-primary w-full">
                            Send message
                        </button>
                    </form>
                </div>

                {/* Middle: Address + Google Map embed */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <div className="text-sm text-white/80">
                        G.E Fogg 5.03
                        <br />
                        Queen Mary University of London,
                        <br />
                        Mile End Road,
                        <br />
                        London E1 4DQ,
                        <br />
                        United Kingdom
                    </div>
                    <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1241.230786325812!2d-0.0424528!3d51.5230934!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761d28e6df513b%3A0x18bbe65eb28ce876!2sG.E.%20Fogg%20Building!5e0!3m2!1sen!2suk!4v1762772892075!5m2!1sen!2suk"
                            width="100%"
                            height="260"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          title="BioLoom Labs Location"
                        />
                    </div>
                </div>

                {/* Right: Social links */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <div className="text-sm text-white/70 mb-3">Connect with us</div>
                    <div className="social-row">
                        <a
                            className="social"
                            href="https://x.com/pirononlab"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            @pirononlab
                        </a>
                        <a
                            className="social"
                            href="https://github.com/pirononlab"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            github.com/pirononlab
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
