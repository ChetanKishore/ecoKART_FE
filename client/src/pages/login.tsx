import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Leaf, Mail, Phone, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { z } from "zod";

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

const emailRegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const phoneRegisterSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type EmailRegisterForm = z.infer<typeof emailRegisterSchema>;
type PhoneRegisterForm = z.infer<typeof phoneRegisterSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const emailRegisterForm = useForm<EmailRegisterForm>({
    resolver: zodResolver(emailRegisterSchema),
  });

  const phoneRegisterForm = useForm<PhoneRegisterForm>({
    resolver: zodResolver(phoneRegisterSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      return apiRequest("/auth/login", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Login successful!",
      });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const emailRegisterMutation = useMutation({
    mutationFn: async (data: Omit<EmailRegisterForm, "confirmPassword">) => {
      return apiRequest("/auth/register", "POST", {
        ...data,
        authProvider: "email",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Registration successful! Please check your email for verification.",
      });
      setActiveTab("login");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const phoneRegisterMutation = useMutation({
    mutationFn: async (data: Omit<PhoneRegisterForm, "confirmPassword">) => {
      return apiRequest("/auth/register", "POST", {
        ...data,
        authProvider: "phone",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Registration successful! Please check your phone for verification code.",
      });
      setActiveTab("login");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onEmailRegister = (data: EmailRegisterForm) => {
    const { confirmPassword, ...registerData } = data;
    emailRegisterMutation.mutate(registerData);
  };

  const onPhoneRegister = (data: PhoneRegisterForm) => {
    const { confirmPassword, ...registerData } = data;
    phoneRegisterMutation.mutate(registerData);
  };

  // Google OAuth removed for now

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Leaf className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">EcoMarket</span>
          </div>
          <CardTitle>Welcome to Sustainable Shopping</CardTitle>
          <CardDescription>
            Join our eco-friendly marketplace and make a positive impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailOrPhone">Email or Phone Number</Label>
                  <Input
                    id="emailOrPhone"
                    placeholder="Enter your email or phone number"
                    {...loginForm.register("emailOrPhone")}
                  />
                  {loginForm.formState.errors.emailOrPhone && (
                    <p className="text-sm text-red-600">
                      {loginForm.formState.errors.emailOrPhone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...loginForm.register("password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-600">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="space-y-4">


                <div className="text-center text-sm">
                  <Link href="/forgot-password" className="text-green-600 hover:underline">
                    Forgot your password?
                  </Link>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-6">
              <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email" className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>Phone</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4 mt-4">
                  <form onSubmit={emailRegisterForm.handleSubmit(onEmailRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          {...emailRegisterForm.register("firstName")}
                        />
                        {emailRegisterForm.formState.errors.firstName && (
                          <p className="text-sm text-red-600">
                            {emailRegisterForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          {...emailRegisterForm.register("lastName")}
                        />
                        {emailRegisterForm.formState.errors.lastName && (
                          <p className="text-sm text-red-600">
                            {emailRegisterForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        {...emailRegisterForm.register("email")}
                      />
                      {emailRegisterForm.formState.errors.email && (
                        <p className="text-sm text-red-600">
                          {emailRegisterForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registerPassword">Password</Label>
                      <Input
                        id="registerPassword"
                        type="password"
                        placeholder="Minimum 8 characters"
                        {...emailRegisterForm.register("password")}
                      />
                      {emailRegisterForm.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {emailRegisterForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Repeat your password"
                        {...emailRegisterForm.register("confirmPassword")}
                      />
                      {emailRegisterForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-600">
                          {emailRegisterForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={emailRegisterMutation.isPending}
                    >
                      {emailRegisterMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="phone" className="space-y-4 mt-4">
                  <form onSubmit={phoneRegisterForm.handleSubmit(onPhoneRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneFirstName">First Name</Label>
                        <Input
                          id="phoneFirstName"
                          placeholder="John"
                          {...phoneRegisterForm.register("firstName")}
                        />
                        {phoneRegisterForm.formState.errors.firstName && (
                          <p className="text-sm text-red-600">
                            {phoneRegisterForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneLastName">Last Name</Label>
                        <Input
                          id="phoneLastName"
                          placeholder="Doe"
                          {...phoneRegisterForm.register("lastName")}
                        />
                        {phoneRegisterForm.formState.errors.lastName && (
                          <p className="text-sm text-red-600">
                            {phoneRegisterForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+1234567890"
                        {...phoneRegisterForm.register("phoneNumber")}
                      />
                      {phoneRegisterForm.formState.errors.phoneNumber && (
                        <p className="text-sm text-red-600">
                          {phoneRegisterForm.formState.errors.phoneNumber.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phonePassword">Password</Label>
                      <Input
                        id="phonePassword"
                        type="password"
                        placeholder="Minimum 8 characters"
                        {...phoneRegisterForm.register("password")}
                      />
                      {phoneRegisterForm.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {phoneRegisterForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneConfirmPassword">Confirm Password</Label>
                      <Input
                        id="phoneConfirmPassword"
                        type="password"
                        placeholder="Repeat your password"
                        {...phoneRegisterForm.register("confirmPassword")}
                      />
                      {phoneRegisterForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-600">
                          {phoneRegisterForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={phoneRegisterMutation.isPending}
                    >
                      {phoneRegisterMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>


            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center text-sm text-gray-600">
            By signing up, you agree to our terms of service and privacy policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
}