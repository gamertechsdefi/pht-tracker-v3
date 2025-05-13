'use client'

import Link from "next/link";
import { useState } from "react";

export default function Header() {

    const [isMenuOpen, setIsMenuOpen] = useState(false);
  
    const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };
  
    return (
      <header className="sticky top-4 z-50 mx-4 px-4 py-4 rounded-md bg-white text-neutral-900">
        <nav className="flex flex-row justify-between items-center">
          <h1 className="font-bold">TOKEN TRACKER</h1>
  
          {/* Desktop Menu */}
          <div className="hidden md:flex flex-row gap-8">
            <Link href="#" className="hover:text-neutral-700 transition-colors duration-200">Home</Link>
            <Link href="#" className="hover:text-neutral-700 transition-colors duration-200">Burns</Link>
            <Link href="https://www.phoenixtoken.community" className="hover:text-neutral-700 transition-colors duration-200">Token</Link>
          </div>
  
          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex items-center px-3 py-2 border border-neutral-300 rounded text-neutral-700"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            Menu
          </button>
        </nav>
  
        {/* Mobile Menu */}
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} bg-white border-t border-neutral-200 mt-2`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="#"
              className="block px-3 py-2 rounded-md text-base font-medium text-neutral-900 hover:text-neutral-700 hover:bg-neutral-100"
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link
              href="#"
              className="block px-3 py-2 rounded-md text-base font-medium text-neutral-900 hover:text-neutral-700 hover:bg-neutral-100"
              onClick={toggleMenu}
            >
              Burns
            </Link>
            <Link
              href="https://www.phoenixtoken.community"
              className="block px-3 py-2 rounded-md text-base font-medium text-neutral-900 hover:text-neutral-700 hover:bg-neutral-100"
              onClick={toggleMenu}
            >
              Phoenix Token
            </Link>
          </div>
        </div>
      </header>
    );
  }