"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/properties", label: "Properties" },
    { href: "/landlords", label: "Landlords" },
    { href: "/tenants", label: "Tenants" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white shadow-md py-3"
          : "bg-white/95 backdrop-blur-sm py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo — left aligned, no dot */}
          <Link href="/" className="flex items-center gap-2">
            <span
              className="text-xl font-bold tracking-tight"
              style={{ color: "#0a1f44" }}
            >
              House of Lettings
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: "#0a1f44" }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/properties"
              className="px-5 py-2 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#0a1f44" }}
            >
              View Properties
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-md"
            style={{ color: "#0a1f44" }}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 flex flex-col gap-1.5">
              <span
                className={`block h-0.5 bg-current transition-all duration-300 ${
                  isOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`block h-0.5 bg-current transition-all duration-300 ${
                  isOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 bg-current transition-all duration-300 ${
                  isOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100">
            <div className="flex flex-col gap-1 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover:bg-gray-50"
                  style={{ color: "#0a1f44" }}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/properties"
                className="mt-2 px-4 py-2.5 rounded-md text-sm font-semibold text-white text-center transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#0a1f44" }}
                onClick={() => setIsOpen(false)}
              >
                View Properties
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
