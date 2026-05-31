/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";

interface BookCoverProps {
  url?: string;
  title: string;
  author?: string;
  className?: string;
  noteCount?: number;
  overrideSrc?: string | null;
}

const tiltSpring = {
  damping: 30,
  stiffness: 120,
  mass: 1.4,
};

export default function BookCover({ url, title, author = "佚名", className = "w-full h-full", noteCount, overrideSrc }: BookCoverProps) {
  const [imageError, setImageError] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const coverRef = useRef<HTMLDivElement | null>(null);
  const rotateX = useSpring(useMotionValue(0), tiltSpring);
  const rotateY = useSpring(useMotionValue(0), tiltSpring);
  const scale = useSpring(1, tiltSpring);
  const glossX = useMotionValue(50);
  const glossY = useMotionValue(50);
  const glossBackground = useMotionTemplate`radial-gradient(circle at ${glossX}% ${glossY}%, rgba(255,255,255,0.34), rgba(255,255,255,0.08) 34%, transparent 66%)`;

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || !coverRef.current) return;

    const rect = coverRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;
    const rotateAmplitude = rect.width < 42 || rect.height < 58 ? 12 : 22;

    rotateX.set((offsetY / (rect.height / 2)) * -rotateAmplitude);
    rotateY.set((offsetX / (rect.width / 2)) * rotateAmplitude);
    glossX.set(((event.clientX - rect.left) / rect.width) * 100);
    glossY.set(((event.clientY - rect.top) / rect.height) * 100);
  };

  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    scale.set(1.13);
  };

  const handlePointerLeave = () => {
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    glossX.set(50);
    glossY.set(50);
  };

  // Derive a solid, high-fidelity color profile deterministically based on book title
  const getDeterministicLayout = (name: string) => {
    const gradients = [
      "from-[#3E4A3D] to-[#252F24] text-[#E3EDE2]", // Muted Sage Green
      "from-[#8B4A3E] to-[#5C2B22] text-[#F9EBE8]", // Terracotta / Crimson rust
      "from-[#2D4256] to-[#172535] text-[#EAF2F8]", // Prussian Indigo
      "from-[#4F443E] to-[#2A221E] text-[#F3EFEF]", // Warm Clay
      "from-[#604E69] to-[#3B2E42] text-[#F5EEF6]", // Royal Violet
      "from-[#3F545B] to-[#213137] text-[#EAF0F2]", // Slate Teal
    ];
    const index = Math.abs(name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % gradients.length;
    return gradients[index];
  };

  useEffect(() => {
    setImageError(false);
    if (overrideSrc) {
      setSrc(overrideSrc);
    } else if (url) {
      // Use proxycover
      setSrc(`/api/weread/proxy-cover?url=${encodeURIComponent(url)}`);
    } else {
      setSrc(null);
    }
  }, [url, overrideSrc]);

  const coverShellClassName = `book-cover-tilt group/cover relative ${className} select-none`;
  const coverMotionStyle = {
    rotateX,
    rotateY,
    scale,
    perspective: 800,
    overflow: "visible",
    transformStyle: "preserve-3d" as const,
  };
  const coverContentClassName = "relative h-full w-full overflow-hidden bg-gray-50 border border-[#2C2C26]/5 rounded-[inherit] shadow-sm";
  const glossStyle = {
    background: glossBackground,
    transform: "translateZ(28px)",
  };

  if ((!url && !overrideSrc) || imageError || !src) {
    // Elegant typographic fallback matching full-book binding aesthetics
    const themeGradient = getDeterministicLayout(title);
    return (
      <motion.div
        ref={coverRef}
        className={coverShellClassName}
        id={`fallback-cover-${title.replace(/\s+/g, "-")}`}
        style={coverMotionStyle}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <div
          className={`relative h-full w-full bg-gradient-to-br ${themeGradient} flex flex-col justify-between p-2 shadow-sm border border-[#2C2C26]/10 overflow-hidden rounded-[inherit] group/fallback`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Book spine simulation overlay */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/20 shadow-[1px_0_3px_rgba(0,0,0,0.3)]"></div>
          <div className="absolute left-1.5 top-0 bottom-0 w-[1px] bg-white/5"></div>

          {/* Top title */}
          <div className="pl-1 pt-1 flex-1 flex flex-col justify-start" style={{ transform: "translateZ(18px)" }}>
            <span className="font-serif font-bold text-[10px] md:text-xs leading-tight tracking-wide line-clamp-3">
              {title}
            </span>
          </div>

          {/* Bottom Metadata */}
          <div className="pl-1 text-right mt-1" style={{ transform: "translateZ(18px)" }}>
            <p className="text-[7px] md:text-[8px] font-mono opacity-80 truncate" title={author}>
              {author.replace(/\[.*?\]/, "").trim()}
            </p>
            {noteCount && noteCount > 0 ? (
              <span className="inline-block mt-0.5 text-[7px] bg-white/15 px-1 py-0.2 rounded font-mono">
                📝{noteCount}
              </span>
            ) : null}
          </div>
          <motion.div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/fallback:opacity-100" style={glossStyle}></motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={coverRef}
      className={coverShellClassName}
      style={coverMotionStyle}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <div className={coverContentClassName} style={{ transformStyle: "preserve-3d" }}>
        <img
          src={src}
          alt={title}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <motion.div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/cover:opacity-100" style={glossStyle}></motion.div>
        {noteCount && noteCount > 0 ? (
          <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-[#2C2C26]/80 backdrop-blur-xs text-white text-[9px] font-mono rounded leading-none" style={{ transform: "translateZ(24px)" }}>
            📝 {noteCount}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
