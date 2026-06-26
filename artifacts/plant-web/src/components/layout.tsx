import { Link, useLocation } from "wouter";
import { Leaf, BarChart2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Leaf, label: "Garden" },
    { href: "/stats", icon: BarChart2, label: "Stats" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-serif font-medium text-xl tracking-tight text-foreground">Flora</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline-block">{item.label}</span>
                </Link>
              );
            })}
            <Link
              href="/plants/new"
              className="ml-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline-block">Add Plant</span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
