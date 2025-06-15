import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Users, TreePine, Leaf, Mail, Plus, Award, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Company {
  id: number;
  name: string;
  domain: string;
  industry?: string;
  logoUrl?: string;
  totalPoints: number;
  totalCo2Saved: string;
}

interface Employee {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  totalPoints: number;
  totalCo2Saved: string;
  orderCount: number;
}

interface CompanyStats {
  totalEmployees: number;
  totalOrders: number;
  totalCo2Saved: string;
  totalPoints: number;
  pointsRedeemed: number;
}

interface PointsHistory {
  id: number;
  action: string;
  points: number;
  description: string;
  createdAt: string;
}

export default function CompanyDashboard() {
  const [timeRange, setTimeRange] = useState("month");
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const { toast } = useToast();

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["/api/company/profile"],
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/company/employees", timeRange],
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/company/stats", timeRange],
  });

  const { data: pointsHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/company/points-history"],
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest(`/api/company/employees`, "POST", { email });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee added successfully",
      });
      setNewEmployeeEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const redeemPointsMutation = useMutation({
    mutationFn: async (points: number) => {
      return apiRequest(`/api/company/redeem-points`, "POST", { points, action: "plant_trees" });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Points redeemed successfully! Trees will be planted on your behalf.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/points-history"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddEmployee = () => {
    if (!newEmployeeEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    addEmployeeMutation.mutate(newEmployeeEmail.trim());
  };

  const handleRedeemPoints = () => {
    const availablePoints = (company as Company)?.totalPoints || 0;
    if (availablePoints < 100) {
      toast({
        title: "Insufficient Points",
        description: "You need at least 100 points to plant trees",
        variant: "destructive",
      });
      return;
    }
    redeemPointsMutation.mutate(100);
  };

  if (companyLoading || !company) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const companyData = company as Company;
  const employeeData = employees as Employee[] || [];
  const statsData = stats as CompanyStats || {};
  const historyData = pointsHistory as PointsHistory[] || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{companyData.name}</h1>
          <p className="text-gray-600">Company Environmental Dashboard</p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-200">
          <Building2 className="h-4 w-4 mr-1" />
          {companyData.industry || "Technology"}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employee Stats</TabsTrigger>
          <TabsTrigger value="points">Points Management</TabsTrigger>
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground">
                  by {statsData.totalEmployees || 0} employees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CO2 Saved</CardTitle>
                <Leaf className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {statsData.totalCo2Saved || companyData.totalCo2Saved} kg
                </div>
                <p className="text-xs text-muted-foreground">
                  Environmental impact
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                <TreePine className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {statsData.totalPoints || companyData.totalPoints}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available for redemption
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employees</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {statsData.totalEmployees || employeeData.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active users
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Environmental Impact Summary</CardTitle>
              <CardDescription>
                Your company's contribution to sustainability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <TreePine className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Trees Equivalent</p>
                    <p className="text-sm text-green-600">
                      ~{Math.round(parseFloat(statsData.totalCo2Saved || companyData.totalCo2Saved) / 22)} trees saved
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {statsData.totalCo2Saved || companyData.totalCo2Saved} kg CO2
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Employee CO2 Statistics</h3>
              <p className="text-sm text-muted-foreground">
                Environmental impact by team member
              </p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>CO2 Saved</TableHead>
                  <TableHead>Points Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeData.map((employee: Employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {employee.firstName && employee.lastName
                            ? `${employee.firstName} ${employee.lastName}`
                            : employee.email.split('@')[0]}
                        </p>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{employee.orderCount}</TableCell>
                    <TableCell className="text-green-600">
                      {employee.totalCo2Saved} kg
                    </TableCell>
                    <TableCell className="text-blue-600">
                      {employee.totalPoints} pts
                    </TableCell>
                  </TableRow>
                ))}
                {employeeData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No employee data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="points" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Points</CardTitle>
                <CardDescription>
                  Redeem points to make a positive environmental impact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-blue-600">
                  {companyData.totalPoints} pts
                </div>
                <Button 
                  onClick={handleRedeemPoints}
                  disabled={companyData.totalPoints < 100 || redeemPointsMutation.isPending}
                  className="w-full"
                >
                  <TreePine className="h-4 w-4 mr-2" />
                  {redeemPointsMutation.isPending ? "Redeeming..." : "Redeem 100 pts to Plant Trees"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Each 100 points plants approximately 5 trees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Points History</CardTitle>
                <CardDescription>Recent points activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {historyData.map((history: PointsHistory) => (
                    <div key={history.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{history.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(history.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={history.action === 'earned' ? 'default' : 'secondary'}>
                        {history.action === 'earned' ? '+' : '-'}{history.points} pts
                      </Badge>
                    </div>
                  ))}
                  {historyData.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No points history available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>
                  Manage your company information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <Input value={companyData.name} disabled />
                </div>
                <div>
                  <Label>Industry</Label>
                  <Input value={companyData.industry || "Technology"} disabled />
                </div>
                <div>
                  <Label>Email Domain</Label>
                  <Input value={`@${companyData.domain}`} disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Employee</CardTitle>
                <CardDescription>
                  Add team members by email address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="employee-email">Employee Email</Label>
                  <Input
                    id="employee-email"
                    type="email"
                    placeholder="employee@company.com"
                    value={newEmployeeEmail}
                    onChange={(e) => setNewEmployeeEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleAddEmployee}
                  disabled={addEmployeeMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addEmployeeMutation.isPending ? "Adding..." : "Add Employee"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Employee must have an account with this email to be added
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}