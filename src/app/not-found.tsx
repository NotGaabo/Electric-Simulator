"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-8">
      <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-between gap-16">
        {/* Left content */}
        <div className="flex-1 max-w-md">
          <p className="text-purple-600 text-sm font-semibold mb-4 tracking-wide">
            404 error
          </p>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Page not found
          </h1>
          <p className="text-gray-500 text-base mb-8 leading-relaxed">
            Sorry, the page you are looking for doesn&apos;t exist.
            <br />
            Here are some helpful links:
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Go back
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Take me home
            </Link>
          </div>
        </div>

        {/* Right illustration */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-80 h-80">
            {/* Floating animation via inline style */}
            <style>{`
              @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(-6deg); }
                50% { transform: translateY(-18px) rotate(-3deg); }
              }
              @keyframes spin-slow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              .astronaut { animation: float 4s ease-in-out infinite; }
              .orbit { animation: spin-slow 10s linear infinite; }
            `}</style>

            {/* Background planet */}
            <div className="absolute rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner"
              style={{ width: 200, height: 200, top: 60, left: 50 }}
            />
            {/* Planet ring */}
            <div className="absolute border-4 border-gray-200 rounded-full"
              style={{ width: 260, height: 80, top: 120, left: 16, borderRadius: "50%", opacity: 0.5 }}
            />

            {/* Decorative stars */}
            {[
              { top: 10, left: 20, size: 5 },
              { top: 30, right: 10, size: 4 },
              { top: 70, right: 20, size: 3 },
              { bottom: 20, left: 10, size: 4 },
              { bottom: 40, right: 30, size: 5 },
              { top: 50, left: 5, size: 3 },
            ].map((s, i) => (
              <div key={i} className="absolute rounded-full bg-purple-300"
                style={{ width: s.size, height: s.size, ...s, opacity: 0.6 }}
              />
            ))}

            {/* Astronaut SVG */}
            <div className="astronaut absolute" style={{ top: 20, left: 80, width: 130, height: 160 }}>
              <svg viewBox="0 0 130 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Helmet */}
                <ellipse cx="65" cy="48" rx="32" ry="34" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2"/>
                {/* Visor */}
                <ellipse cx="65" cy="46" rx="20" ry="22" fill="#c4b5fd" opacity="0.5"/>
                <ellipse cx="65" cy="46" rx="20" ry="22" fill="none" stroke="#a78bfa" strokeWidth="1.5"/>
                {/* Reflection on visor */}
                <ellipse cx="55" cy="38" rx="5" ry="7" fill="white" opacity="0.3" transform="rotate(-15 55 38)"/>
                {/* Body suit */}
                <rect x="38" y="78" width="54" height="52" rx="14" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2"/>
                {/* Chest panel */}
                <rect x="51" y="88" width="28" height="18" rx="5" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1.5"/>
                <circle cx="57" cy="97" r="3" fill="#a78bfa"/>
                <circle cx="65" cy="97" r="3" fill="#7c3aed"/>
                <circle cx="73" cy="97" r="3" fill="#a78bfa"/>
                {/* Left arm */}
                <rect x="18" y="80" width="22" height="14" rx="7" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2" transform="rotate(20 18 80)"/>
                {/* Right arm */}
                <rect x="90" y="80" width="22" height="14" rx="7" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2" transform="rotate(-20 112 80)"/>
                {/* Left glove */}
                <ellipse cx="25" cy="97" rx="9" ry="7" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.5"/>
                {/* Right glove */}
                <ellipse cx="105" cy="97" rx="9" ry="7" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.5"/>
                {/* Left leg */}
                <rect x="44" y="126" width="18" height="28" rx="9" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2"/>
                {/* Right leg */}
                <rect x="68" y="126" width="18" height="28" rx="9" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2"/>
                {/* Boots */}
                <ellipse cx="53" cy="156" rx="11" ry="6" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.5"/>
                <ellipse cx="77" cy="156" rx="11" ry="6" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.5"/>
                {/* Helmet connector */}
                <rect x="52" y="78" width="26" height="6" rx="3" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1.5"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}