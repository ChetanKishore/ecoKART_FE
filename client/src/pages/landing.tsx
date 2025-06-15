import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, ShoppingBag, Users, TrendingUp } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Leaf className="text-green-600 h-8 w-8 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                eco<span className="text-green-600">KART</span>
              </span>
            </div>
            <Button onClick={handleLogin} className="eco-primary">
              Login / Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Shop <span className="text-green-600">Sustainably</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Every purchase helps reduce CO2 emissions and supports eco-friendly businesses. 
            Join thousands of eco-warriors making a difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button onClick={handleLogin} size="lg" className="eco-primary text-lg px-8 py-4">
              Start Shopping
            </Button>
            <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full">
              <Leaf className="text-green-600 h-5 w-5" />
              <span className="text-sm font-medium text-green-800">12,847 kg CO2 saved this month</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose ecoKART?</h2>
            <p className="text-lg text-gray-600">Making sustainable shopping accessible for everyone</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Leaf className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">CO2 Impact Tracking</h3>
                <p className="text-gray-600">
                  See exactly how much CO2 you're saving with every purchase and track your environmental impact.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Eco-Certified Products</h3>
                <p className="text-gray-600">
                  All products are verified for their environmental credentials and sustainability practices.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-amber-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Rewards & Points</h3>
                <p className="text-gray-600">
                  Earn points for every kg of CO2 saved and donate them to plant trees around the world.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 eco-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">12,847</div>
              <div className="text-green-200">kg CO2 Saved</div>
              <div className="text-sm text-green-100 mt-1">This Month</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">543</div>
              <div className="text-green-200">Trees Planted</div>
              <div className="text-sm text-green-100 mt-1">Through Your Points</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2,156</div>
              <div className="text-green-200">Eco Warriors</div>
              <div className="text-sm text-green-100 mt-1">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Make a Difference?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join our community of eco-conscious shoppers and sellers making the world more sustainable, one purchase at a time.
          </p>
          <Button onClick={handleLogin} size="lg" className="eco-primary text-lg px-8 py-4">
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Leaf className="text-green-500 h-8 w-8 mr-2" />
              <span className="text-2xl font-bold">
                eco<span className="text-green-500">KART</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Making sustainable shopping accessible for everyone. Every purchase makes a difference.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              © 2024 ecoKART. All rights reserved. | Built for a sustainable future.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
