import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { CreditCard, Truck, Leaf, Shield } from "lucide-react";
import { useLocation } from "wouter";

const checkoutSchema = z.object({
  shippingAddress: z.string().min(10, "Please provide a complete address"),
  paymentMethod: z.enum(["razorpay", "cashfree", "card"], {
    required_error: "Please select a payment method",
  }),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: {
    name: string;
    price: string;
    co2SavedPerUnit: string;
    imageUrl?: string;
  };
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
  });

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "razorpay",
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: CheckoutForm) => {
      const response = await apiRequest("POST", "/api/checkout", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order Placed Successfully!",
        description: `Order #${data.orderId} placed. You earned ${data.pointsEarned} eco points and saved ${data.co2Saved}kg CO2!`,
      });
      navigate("/orders");
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );

  const totalCo2Saved = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.product.co2SavedPerUnit) * item.quantity,
    0
  );

  const pointsToEarn = Math.floor(totalCo2Saved);

  const onSubmit = (data: CheckoutForm) => {
    checkoutMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onCartToggle={() => {}} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onCartToggle={() => {}} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
              <p className="text-gray-600 mb-6">Add some products before proceeding to checkout.</p>
              <Button onClick={() => navigate("/")} className="eco-primary">
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onCartToggle={() => {}} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="shippingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shipping Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your complete shipping address..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold flex items-center">
                            <CreditCard className="h-5 w-5 mr-2" />
                            Payment Method
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="space-y-3"
                            >
                              <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-4">
                                <RadioGroupItem value="razorpay" id="razorpay" />
                                <label htmlFor="razorpay" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Razorpay</div>
                                  <div className="text-sm text-gray-600">UPI, Cards, Net Banking & More</div>
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-4">
                                <RadioGroupItem value="cashfree" id="cashfree" />
                                <label htmlFor="cashfree" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Cashfree</div>
                                  <div className="text-sm text-gray-600">Multiple payment options</div>
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 border border-gray-200 rounded-lg p-4">
                                <RadioGroupItem value="card" id="card" />
                                <label htmlFor="card" className="flex-1 cursor-pointer">
                                  <div className="font-medium">Credit/Debit Card</div>
                                  <div className="text-sm text-gray-600">Direct card payment</div>
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={checkoutMutation.isPending}
                      className="w-full eco-primary text-lg py-3"
                    >
                      {checkoutMutation.isPending ? "Processing..." : `Place Order - $${subtotal.toFixed(2)}`}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Your payment information is secure and encrypted</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={item.product.imageUrl || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.product.name}</div>
                      <div className="text-xs text-gray-600">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-semibold">${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</div>
                  </div>
                ))}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Environmental Impact */}
            <Card className="eco-gradient text-white">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-4">Your Environmental Impact</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-2xl font-bold">{totalCo2Saved.toFixed(1)}kg</div>
                    <div className="text-green-200 text-sm">CO2 You'll Save</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{pointsToEarn}</div>
                    <div className="text-green-200 text-sm">Eco Points You'll Earn</div>
                  </div>
                  <div className="flex items-center justify-center space-x-1 text-xs text-green-100">
                    <Leaf className="h-3 w-3" />
                    <span>Equivalent to planting {Math.ceil(totalCo2Saved / 22)} trees</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
