"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { FileText, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Header() {
  const { user } = useUser();

  return (
    <header className="bg-nishta-cream dark:bg-nishta-charcoal border-b border-nishta-sand dark:border-nishta-espresso shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <FileText className="h-7 w-7 text-nishta-mocha dark:text-nishta-kraft" />
                <MessageSquare className="h-3 w-3 text-nishta-espresso dark:text-nishta-sand absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-2xl font-serif text-nishta-charcoal dark:text-nishta-cream tracking-wider">DOCUMIND</h1>
                <p className="text-xs font-space-mono text-nishta-espresso dark:text-nishta-taupe uppercase tracking-wider">AI Assistant</p>
              </div>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex bg-nishta-sand dark:bg-nishta-espresso text-nishta-espresso dark:text-nishta-cream font-space-mono text-xs">
              Powered by AI
            </Badge>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {user && (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-serif text-nishta-charcoal dark:text-nishta-cream">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs font-space-mono text-nishta-espresso dark:text-nishta-taupe">
                    {user.emailAddresses?.[0]?.emailAddress}
                  </p>
                </div>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "h-10 w-10 ring-2 ring-nishta-mocha dark:ring-nishta-kraft"
                    }
                  }}
                />
              </div>
            )}
            
            {/* Mobile user button */}
            <div className="sm:hidden">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9 ring-2 ring-nishta-mocha dark:ring-nishta-kraft"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 