import { Link, useNavigate } from "@tanstack/react-router";
import { ChefHat, ShoppingBag, LogOut, LayoutDashboard, Flame, ConciergeBell } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function SiteHeader() {
  const { count } = useCart();
  const { user, loading, isAdmin, hasRole, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <ChefHat className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-black tracking-wide text-gold-gradient">
            CHEFSTATION
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/menu" className="transition-colors hover:text-primary" activeProps={{ className: "text-primary" }}>
            Menu
          </Link>
          <Link to="/reserve" className="transition-colors hover:text-primary" activeProps={{ className: "text-primary" }}>
            Reserve a Table
          </Link>
          <Link to="/orders" className="transition-colors hover:text-primary" activeProps={{ className: "text-primary" }}>
            Track Order
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="relative border-border bg-transparent"
            onClick={() => navigate({ to: "/menu", search: { cart: "open" } })}
            aria-label="Open cart"
          >
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Button>

          {!loading && !user && (
            <Button
              className="bg-primary font-bold text-primary-foreground btn-glow"
              onClick={() => navigate({ to: "/login" })}
            >
              Sign In
            </Button>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer border border-primary/40">
                  <AvatarFallback className="bg-accent text-sm font-bold text-primary">
                    {(user.email ?? "G").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-popover">
                <DropdownMenuItem onClick={() => navigate({ to: "/orders" })}>
                  My Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/reserve" })}>
                  My Reservations
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Dashboard
                    </DropdownMenuItem>
                  </>
                )}
                {hasRole("kitchen_staff") && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/kds" })}>
                    <Flame className="mr-2 h-4 w-4" /> Kitchen Display
                  </DropdownMenuItem>
                )}
                {hasRole("waiter") && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/waiter" })}>
                    <ConciergeBell className="mr-2 h-4 w-4" /> Waiter Terminal
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
