import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b py-4 bg-[#19376d]">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-xl font-heading font-bold text-white">Team Manager</h1>
          <nav className="hidden md:flex space-x-4">
            <Link href="/">
              <a className="text-white hover:text-gray-200 transition-colors">Home</a>
            </Link>
            <Link href="/team-management">
              <a className="text-white hover:text-gray-200 transition-colors">Teams</a>
            </Link>
            <Link href="/player-pool">
              <a className="text-white hover:text-gray-200 transition-colors">Players</a>
            </Link>
            <Link href="/game-history">
              <a className="text-white hover:text-gray-200 transition-colors">Games</a>
            </Link>
            <Link href="/fixture-management">
              <a className="text-white hover:text-gray-200 transition-colors">Fixtures</a>
            </Link>
          </nav>
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="text-darkblue"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b p-4 shadow-md">
          <nav className="flex flex-col space-y-3">
            <Link href="/">
              <a className="text-darkblue hover:text-blue-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>Home</a>
            </Link>
            <Link href="/team-management">
              <a className="text-darkblue hover:text-blue-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>Teams</a>
            </Link>
            <Link href="/player-pool">
              <a className="text-darkblue hover:text-blue-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>Players</a>
            </Link>
            <Link href="/game-history">
              <a className="text-darkblue hover:text-blue-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>Games</a>
            </Link>
            <Link href="/fixture-management">
              <a className="text-darkblue hover:text-blue-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>Fixtures</a>
            </Link>
          </nav>
        </div>
      )}

      <footer className="border-t py-6 bg-gray-100">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Team Manager App
        </div>
      </footer>
    </div>
  );
}