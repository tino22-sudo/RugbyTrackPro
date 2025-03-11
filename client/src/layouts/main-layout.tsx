import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white"> {/* Added bg-white for body background */}
      <header className="border-b py-4 bg-[#19376d]"> {/* Changed header background */}
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-xl font-heading font-bold text-white"> {/* Changed header text color */}Team Manager</h1>
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
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      <footer className="border-t py-6 bg-gray-100"> {/* Added light gray background */}
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Team Manager App
        </div>
      </footer>
    </div>
  );
}