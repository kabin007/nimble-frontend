import { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { orderAPI, transactionAPI, inventoryAPI, employeeAPI, billAPI } from "@/lib/api";
import { Order, Transaction, InventoryItem, Employee, Bill } from "@/lib/types";
import {
  Package,
  ShoppingCart,
  IndianRupee,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "hsl(220, 60%, 20%)",
  "hsl(38, 92%, 50%)",
  "hsl(142, 71%, 40%)",
  "hsl(210, 100%, 52%)",
  "hsl(0, 72%, 51%)",
];

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, transactionsData, inventoryData, employeesData, billsData] = await Promise.all([
          orderAPI.getAll(),
          transactionAPI.getAll(),
          inventoryAPI.getAll(),
          employeeAPI.getAll(),
          billAPI.getAll(),
        ]);
        // Handle both array and paginated responses
        setOrders(Array.isArray(ordersData) ? ordersData : ordersData.results || []);
        setTransactions(Array.isArray(transactionsData) ? transactionsData : transactionsData.results || []);
        setInventory(Array.isArray(inventoryData) ? inventoryData : inventoryData.results || []);
        setEmployees(Array.isArray(employeesData) ? employeesData : employeesData.results || []);
        setBills(Array.isArray(billsData) ? billsData : billsData.results || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setOrders([]);
        setTransactions([]);
        setInventory([]);
        setEmployees([]);
        setBills([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
  const lowStockItems = inventory.filter((i) => i.quantity <= i.reorderLevel);
  const unpaidBills = bills.filter((b) => b.status !== "paid").reduce((s, b) => s + Number(b.amount), 0);
  const activeEmployees = employees.filter((e) => e.status === "active").length;

  const fmt = (n: number | undefined) => {
    if (n === undefined || n === null) return "₹0";
    return "₹" + Number(n).toLocaleString("en-IN");
  };

  const statusColors: Record<string, string> = {
    pending: "badge-warning",
    processing: "badge-info",
    shipped: "badge-info",
    delivered: "badge-success",
    cancelled: "badge-destructive",
  };

  // Build monthly data by grouping transactions by month
  const monthlyData = (() => {
    const months = new Map<string, { month: string; income: number; expense: number }>();

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      const current = months.get(monthKey) || { month: monthKey, income: 0, expense: 0 };
      if (t.type === "income") current.income += t.amount;
      else current.expense += t.amount;
      months.set(monthKey, current);
    });

    return Array.from(months.values()).slice(-5);
  })();

  const channelData = [
    { name: "Online", value: orders.filter((o) => o.channel === "online").reduce((s, o) => s + o.total, 0) },
    { name: "Physical", value: orders.filter((o) => o.channel === "physical").reduce((s, o) => s + o.total, 0) },
    { name: "Dealer", value: orders.filter((o) => o.channel === "dealer").reduce((s, o) => s + o.total, 0) },
  ];

  const recentOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="page-header bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg p-4 border border-blue-200">

        <div>
          <h1 className="page-title text-blue-600">
            Dashboard
          </h1>

          <p className="page-subtitle text-gray-600">
            Overview of your garment business
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={fmt(totalRevenue)} icon={TrendingUp} trend={{ value: "12% vs last month", positive: true }} />
        <StatCard title="Total Expenses" value={fmt(totalExpenses)} icon={TrendingDown} iconColor="text-destructive" />
        <StatCard title="Pending Orders" value={String(pendingOrders)} icon={Clock} subtitle={`${orders.length} total orders`} iconColor="text-info" />
        <StatCard title="Active Staff" value={String(activeEmployees)} icon={Users} subtitle={`${employees.length} total`} iconColor="text-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue vs Expenses chart */}
        <div className="lg:col-span-2 data-table-wrapper p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 45%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 45%)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => fmt(value)} />
              <Bar dataKey="income" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Channel */}
        <div className="data-table-wrapper p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Sales by Channel</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={channelData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                {channelData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => fmt(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {channelData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <div className="lg:col-span-2 data-table-wrapper">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Recent Orders</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Order</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Channel</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="text-xs font-mono font-medium">{o.orderNumber}</TableCell>
                  <TableCell className="text-xs">{o.customer}</TableCell>
                  <TableCell className="text-xs capitalize">{o.channel}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{fmt(o.total)}</TableCell>
                  <TableCell>
                    <span className={statusColors[o.status]}>{o.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Alerts */}
        <div className="space-y-4">
          <div className="data-table-wrapper p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Low Stock Alerts</h3>
            </div>
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">All items are well stocked</p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{item.name}</span>
                    <span className="badge-destructive">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="data-table-wrapper p-4">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="h-4 w-4 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground">Unpaid Bills</h3>
            </div>
            <p className="text-xl font-bold text-foreground">{fmt(unpaidBills)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {bills.filter((b) => b.status === "overdue").length} overdue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
