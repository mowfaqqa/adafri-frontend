"use client";

import { useEffect } from "react";
import Hotjar from "@hotjar/browser";

export function HotjarInitializer() {
  useEffect(() => {
    const siteId = 5351234;
    const hotjarVersion = 6;

    try {
      Hotjar.init(siteId, hotjarVersion);
    } catch (error) {
      console.error("Failed to initialize Hotjar:", error);
    }
  }, []);

  return null;
}
