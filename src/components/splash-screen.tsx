"use client";

import { useEffect, useRef, useState } from "react";

async function getGifDuration(url: string): Promise<number> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch failed");
  const buffer = await res.arrayBuffer();
  const view = new DataView(buffer);
  if (view.getUint8(0) !== 0x47 || view.getUint8(1) !== 0x49 || view.getUint8(2) !== 0x46) {
    throw new Error("not a gif");
  }
  let offset = 6;
  const packed = view.getUint8(10);
  offset += 7;
  if (packed & 0x80) {
    offset += 3 * (2 ** ((packed & 0x07) + 1));
  }
  let totalMs = 0;
  let sawFrame = false;
  while (offset + 1 < view.byteLength) {
    const block = view.getUint8(offset);
    if (block === 0x3b) break;
    if (block === 0x21) {
      const label = view.getUint8(offset + 1);
      offset += 2;
      if (label === 0xf9) {
        const size = view.getUint8(offset);
        if (size >= 4 && size === 4) {
          const delayCs = view.getUint16(offset + 2, true);
          const delayMs = delayCs * 10;
          totalMs += delayMs > 0 ? delayMs : 100;
        } else if (size >= 4) {
          const delayCs = view.getUint16(offset + 2, true);
          totalMs += delayCs > 0 ? delayCs * 10 : 100;
        }
        offset += size + 1;
      }
      while (offset < view.byteLength) {
        const size = view.getUint8(offset);
        offset += 1;
        if (size === 0) break;
        offset += size;
      }
    } else if (block === 0x2c) {
      sawFrame = true;
      offset += 9;
      offset += 1;
      while (offset < view.byteLength) {
        const size = view.getUint8(offset);
        offset += 1;
        if (size === 0) break;
        offset += size;
      }
    } else {
      offset += 1;
    }
  }
  if (!sawFrame) throw new Error("no frames");
  return totalMs > 0 ? totalMs : 3000;
}

export function SplashScreen({ onDone }: { onDone?: () => void }) {
  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      setHidden(true);
      doneRef.current?.();
    };
    getGifDuration("/img/icons/introder.gif")
      .then((duration) => {
        timer = setTimeout(finish, duration);
      })
      .catch(() => {
        timer = setTimeout(finish, 3000);
      });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isMobile]);

  if (hidden || !isMobile) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black" style={{ pointerEvents: "none" }}>
      <img
        src="/img/icons/introder.gif"
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}