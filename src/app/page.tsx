// landing page for the Djombi app - i.e entry point for users
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [currentSection, setCurrentSection] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Initialize refs for each section
  useEffect(() => {
    sectionRefs.current = [
      document.getElementById("landing-section"),
      document.getElementById("tools-section"),
      document.getElementById("footer-section")
    ];

    // Set up scroll event listener
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      // Determine which section is currently in view
      sectionRefs.current.forEach((section, index) => {
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionBottom = sectionTop + section.offsetHeight;

          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            setCurrentSection(index);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Function to scroll to specific section
  const scrollToSection = (index: number) => {
    const section = sectionRefs.current[index];
    if (section) {
      window.scrollTo({
        top: section.offsetTop,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="flex flex-col font-[family-name:var(--font-geist-sans)]">

      {/* First section - Landing image */}
      <section
        id="landing-section"
        className="min-h-screen flex items-center justify-center relative w-full"
      >
        <Image
          src="/assets/landing.png" // Update this path to match your asset location
          fill
          className="object-cover"
          priority
          alt="Djombi - The everything app for work"
        />
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center p-8">
          <Image
            src="/icons/djombi-white.png"
            width={700}
            height={200}
            alt="Djombi"
            className="mb-6"
          />
          <p className="text-2xl md:text-3xl text-white max-w-2xl mt-4">
            The everything app for work
          </p>
          <Link href="/auth/login">
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600 text-white mt-12 px-8 py-6 text-lg"
            >
              Try Dashboard
            </Button>
          </Link>
        </div>
      </section>
      
    </div>
  );
}