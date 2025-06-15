import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Leaf, Search, ShoppingCart, User, ChevronDown, Package, Store, LogOut, Building2 } from "lucide-react";
import { Link } from "wouter";

interface HeaderProps {
  onCartToggle: () => void;
}

interface UserStats {
  totalPoints: number;
}

export default function Header({ onCartToggle }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/stats/user"],
    enabled: !!user,
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const cartItemCount = Array.isArray(cartItems) ? cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <Leaf className="text-green-600 h-6 w-6 md:h-8 md:w-8 mr-2" />
              <span className="text-lg md:text-2xl font-bold text-gray-900">
                eco<span className="text-green-600">KART</span>
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Cart Button */}
            <Button
              variant="ghost"
              className="relative p-2"
              onClick={onCartToggle}
            >
              <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>

            {/* Navigation Links - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" asChild size="sm">
                <Link href="/">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Buyer Dashboard
                </Link>
              </Button>
              <Button variant="ghost" asChild size="sm">
                <Link href="/seller">
                  <Store className="mr-2 h-4 w-4" />
                  Seller Dashboard
                </Link>
              </Button>
            </div>

            {user ? (
              <>
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-1 text-gray-700 hover:text-green-600">
                      <User className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="hidden sm:block text-sm">{(user as any)?.firstName || "Account"}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">{(user as any)?.firstName || 'User'} {(user as any)?.lastName || ''}</p>
                      <p className="text-xs text-gray-500">{(user as any)?.email}</p>
                      {userStats && (
                        <p className="text-xs text-green-600 mt-1">
                          {userStats.totalPoints} eco points
                        </p>
                      )}
                    </div>
                    <Link href="/orders">
                      <DropdownMenuItem className="cursor-pointer">
                        <Package className="h-4 w-4 mr-2" />
                        My Orders
                      </DropdownMenuItem>
                    </Link>
                    <div className="md:hidden">
                      <Link href="/">
                        <DropdownMenuItem className="cursor-pointer">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Buyer Dashboard
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/seller">
                        <DropdownMenuItem className="cursor-pointer">
                          <Store className="h-4 w-4 mr-2" />
                          Seller Dashboard
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/company-dashboard">
                        <DropdownMenuItem className="cursor-pointer">
                          <Building2 className="h-4 w-4 mr-2" />
                          Company Dashboard
                        </DropdownMenuItem>
                      </Link>
                    </div>
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Cart */}
                <Button
                  variant="ghost"
                  onClick={onCartToggle}
                  className="relative flex items-center space-x-1 text-gray-700 hover:text-green-600"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                  <span className="hidden sm:block">Cart</span>
                </Button>

                {/* CO2 Points Display */}
                <div className="hidden lg:flex items-center space-x-1 bg-green-100 px-3 py-1 rounded-full">
                  <Leaf className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {userStats?.totalPoints || 0} pts
                  </span>
                </div>
              </>
            ) : (
              <Button onClick={() => window.location.href = "/api/login"} className="eco-primary">
                Login / Sign Up
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
