import { useState, useEffect } from "react";
import { Transaction, Dealer } from "@/lib/types";
import { transactionAPI, dealerAPI } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { TrendingUp, TrendingDown, Wallet, Plus, Search, Trash2, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const INCOME_CATEGORIES = [
  "Online Sales", "Physical Store Sales", "Dealer Orders", "Wholesale", "Bulk Orders",
  "Service Income", "Returns & Refunds Recovered", "Interest Income", "Miscellaneous Income", "Other"
];

const EXPENSE_CATEGORIES = [
  "Salary & Wages", "Rent", "Utilities", "Transportation", "Raw Materials",
  "Marketing & Advertising", "Office Supplies", "Insurance", "Maintenance",
  "Equipment Purchase", "Tax & Compliance", "Bank Charges", "Miscellaneous Expense", "Other"
];

// Detailed category mappings for each transaction type
const TRANSACTION_TYPE_CATEGORIES: Record<string, string[]> = {
  sales: ["Online Sales", "Physical Store Sales", "Dealer Orders", "Wholesale", "Bulk Orders"],
  asset: ["Equipment Purchase", "Furniture & Fixtures", "Vehicles", "Computer & IT Equipment", "Building/Property"],
  capital: ["Loan Repayment", "Owner Capital Contribution", "Retained Earnings", "Debt Financing", "Equity Investment"],
  salary: ["Salary & Wages", "Bonus & Incentives", "Benefits & Allowances", "Payroll Taxes", "Employee Benefits"],
  operating: ["Rent", "Utilities", "Transportation", "Maintenance", "Office Supplies", "Insurance", "Bank Charges"],
  material: ["Raw Materials", "Fabric & Textiles", "Packaging Materials", "Dyeing & Chemicals", "Inventory Stock"],
  other_income: ["Interest Income", "Returns & Refunds Recovered", "Miscellaneous Income", "Rental Income"],
  other_expense: ["Miscellaneous Expense", "Contingency Fund", "Repairs & Maintenance", "Professional Fees", "Donations"],
};

const CHART_COLORS = ["hsl(220, 60%, 20%)", "hsl(38, 92%, 50%)", "hsl(142, 71%, 40%)", "hsl(210, 100%, 52%)", "hsl(0, 72%, 51%)", "hsl(280, 85%, 60%)", "hsl(180, 70%, 45%)"];

export default function FinancePage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [typeSelectOpen, setTypeSelectOpen] = useState(false);
  const [selectedTxnType, setSelectedTxnType] = useState<string>("");
  const [dealerDialogOpen, setDealerDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [deletingTxnId, setDeletingTxnId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [txnsData, dealersData] = await Promise.all([
          transactionAPI.getAll(),
          dealerAPI.getAll(),
        ]);
        // Handle both array and paginated responses
        const txns = Array.isArray(txnsData) ? txnsData : txnsData.results || [];
        const dealers = Array.isArray(dealersData) ? dealersData : dealersData.results || [];
        setTxns(txns);
        setDealers(dealers);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setTxns([]);
        setDealers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const income = txns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const profit = income - expense;

  const filtered = txns
    .filter((t) => {
      const matchType = filterType === "all" || t.type === filterType;
      const matchCategory = filterCategory === "all" || t.category === filterCategory;
      const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
      const txDate = new Date(t.date);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      const matchDate = (!fromDate || txDate >= fromDate) && (!toDate || txDate <= toDate);
      return matchType && matchCategory && matchSearch && matchDate && t.status !== "deleted";
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const categoryBreakdown = (() => {
    const map = new Map<string, number>();
    filtered.forEach((t) => {
      const current = map.get(t.category) || 0;
      map.set(t.category, current + Number(t.amount));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  })();

  const monthlyData = (() => {
    const map = new Map<string, { month: string; income: number; expense: number }>();
    txns.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      const current = map.get(monthKey) || { month: monthKey, income: 0, expense: 0 };
      if (t.type === "income") current.income += t.amount;
      else current.expense += t.amount;
      map.set(monthKey, current);
    });
    return Array.from(map.values()).slice(-6);
  })();

  const filteredCategory = filterType === "all" 
    ? [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]
    : filterType === "income"
    ? INCOME_CATEGORIES
    : EXPENSE_CATEGORIES;

  const TRANSACTION_TYPES = [
    { id: "sales", label: "Sales/Revenue", type: "income", icon: "💰", description: "Track all sales and revenue" },
    { id: "asset", label: "Asset Purchase", type: "expense", icon: "🏢", description: "Equipment, furniture, vehicles" },
    { id: "capital", label: "Capital Investment", type: "expense", icon: "💼", description: "Business capital and loans" },
    { id: "salary", label: "Salary & Wages", type: "expense", icon: "👥", description: "Employee salaries and benefits" },
    { id: "operating", label: "Operating Expense", type: "expense", icon: "⚙️", description: "Rent, utilities, maintenance" },
    { id: "material", label: "Material Purchase", type: "expense", icon: "📦", description: "Raw materials and inventory" },
    { id: "other_income", label: "Other Income", type: "income", icon: "📊", description: "Interest, returns, miscellaneous" },
    { id: "other_expense", label: "Other Expense", type: "expense", icon: "📋", description: "Miscellaneous expenses" },
  ];

  // Get categories based on selected transaction type in the dialog - SPECIFIC categories for each type
  const dialogCategories = selectedTxnType 
    ? (TRANSACTION_TYPE_CATEGORIES[selectedTxnType] || [])
    : [];

  const fmt = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN");

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const newTxn = await transactionAPI.create({
        type: fd.get("type") as Transaction["type"],
        category: fd.get("category") as string,
        description: fd.get("description") as string,
        amount: Number(fd.get("amount")),
        date: fd.get("date") as string,
        reference: (fd.get("reference") as string) || undefined,
        source: (fd.get("source") as string) || undefined,
      });
      setTxns([...txns, newTxn]);
      setOpen(false);
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      console.error("Failed to add transaction:", err);
    }
  };

  const handleAddDealer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const newDealer = await dealerAPI.create({
        name: fd.get("name") as string,
        company: fd.get("company") as string,
        phone: (fd.get("phone") as string) || undefined,
        email: (fd.get("email") as string) || undefined,
        address: (fd.get("address") as string) || undefined,
        dealerType: fd.get("dealerType") as string,
      });
      setDealers([...dealers, newDealer]);
      setDealerDialogOpen(false);
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      console.error("Failed to add dealer:", err);
    }
  };

  const deleteTransaction = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingTxnId(String(id));
      await transactionAPI.delete(String(id));
      setTxns(txns.filter((t) => String(t.id) !== String(id)));
    } catch (err) {
      console.error("Failed to delete transaction:", err);
      alert("Failed to delete transaction. Please try again.");
    } finally {
      setDeletingTxnId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Finance & Accounting</h1>
          <p className="page-subtitle">Comprehensive financial tracking and analysis</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dealerDialogOpen} onOpenChange={setDealerDialogOpen}>
            {/* <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> New Dealer</Button>
            </DialogTrigger> */}
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Dealer</DialogTitle></DialogHeader>
              <form onSubmit={handleAddDealer} className="space-y-3">
                <div><Label>Company Name</Label><Input name="company" required /></div>
                <div><Label>Contact Name (optional)</Label><Input name="name" placeholder="Name of contact person" /></div>
                <div><Label>Dealer Type</Label>
                  <select name="dealerType" className="w-full border border-input rounded-md h-9 px-3 text-sm bg-background">
                    <option value="supplier">Supplier</option>
                    <option value="buyer">Buyer</option>
                    <option value="stakeholder">Stakeholder</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div><Label>Phone (optional)</Label><Input name="phone" /></div>
                <div><Label>Email (optional)</Label><Input name="email" type="email" /></div>
                <div><Label>Address (optional)</Label><Input name="address" /></div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setDealerDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm">Add Dealer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Step 1: Transaction Type Selector */}
          <Dialog open={typeSelectOpen} onOpenChange={setTypeSelectOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={loading}><Plus className="h-4 w-4 mr-1" /> Add Transaction</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader><DialogTitle>Select Transaction Type</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                {TRANSACTION_TYPES.map((txnType) => (
                  <button
                    key={txnType.id}
                    onClick={() => {
                      setSelectedTxnType(txnType.id);
                      setTypeSelectOpen(false);
                      setOpen(true);
                    }}
                    className="p-4 border border-input rounded-lg hover:bg-accent hover:border-primary transition-all text-left"
                  >
                    <div className="text-2xl mb-2">{txnType.icon}</div>
                    <div className="font-semibold text-sm">{txnType.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{txnType.description}</div>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Step 2: Transaction Form */}
          <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) setSelectedTxnType("");
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Record {TRANSACTION_TYPES.find(t => t.id === selectedTxnType)?.label || "Transaction"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
                {/* Hidden field for type */}
                <input 
                  type="hidden" 
                  name="type" 
                  value={TRANSACTION_TYPES.find(t => t.id === selectedTxnType)?.type || ""} 
                />
                
                <div>
                  <Label>Category *</Label>
                  <select name="category" className="w-full border border-input rounded-md h-9 px-3 text-sm bg-background" required>
                    <option value="">Select category</option>
                    {dialogCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                
                <div>
                  <Label>Amount (₹) *</Label>
                  <Input name="amount" type="number" step="0.01" required placeholder="0.00" />
                </div>
                
                <div className="col-span-2">
                  <Label>Description *</Label>
                  <Input 
                    name="description" 
                    required 
                    placeholder={`Describe this ${TRANSACTION_TYPES.find(t => t.id === selectedTxnType)?.label?.toLowerCase() || "transaction"}`}
                  />
                </div>
                
                <div>
                  <Label>Date *</Label>
                  <Input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                
                <div>
                  <Label>Reference (Invoice/Bill #)</Label>
                  <Input name="reference" placeholder="e.g., INV-001" />
                </div>
                
                <div className="col-span-2">
                  <Label>Related Dealer (optional)</Label>
                  <select name="source" className="w-full border border-input rounded-md h-9 px-3 text-sm bg-background">
                    <option value="">None</option>
                    {dealers.map((dealer) => (
                      <option key={String(dealer.id)} value={String(dealer.id)}>
                        {dealer.company || dealer.name} ({dealer.dealerType || "partner"})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-2 flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setOpen(false);
                      setSelectedTxnType("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">Record Transaction</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={fmt(income)} icon={TrendingUp} iconColor="text-success" trend={{ value: `${txns.filter(t => t.type === "income").length} transactions`, positive: true }} />
        <StatCard title="Total Expenses" value={fmt(expense)} icon={TrendingDown} iconColor="text-destructive" trend={{ value: `${txns.filter(t => t.type === "expense").length} transactions`, positive: false }} />
        <StatCard title="Net Profit/Loss" value={fmt(profit)} icon={Wallet} iconColor={profit >= 0 ? "text-success" : "text-destructive"} trend={{ value: profit >= 0 ? "Profitable" : "Loss", positive: profit >= 0 }} />
        <StatCard title="Profit Margin" value={income > 0 ? ((profit / income) * 100).toFixed(1) + "%" : "0%"} icon={Zap} iconColor="text-info" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="data-table-wrapper p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Income vs Expenses</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 45%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 45%)" tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Bar dataKey="income" fill="hsl(142, 71%, 40%)" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="data-table-wrapper p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {filterType === "income" ? "Income" : filterType === "expense" ? "Expense" : "Transaction"} by Category
              </h3>
              {categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => fmt(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </div>
          </div>

          <div className="data-table-wrapper">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Category Summary</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs text-right">Count</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                  <TableHead className="text-xs text-right">Average</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryBreakdown.map((item) => {
                  const count = filtered.filter(t => t.category === item.name).length;
                  const avg = count > 0 ? item.value / count : 0;
                  return (
                    <TableRow key={item.name}>
                      <TableCell className="text-xs font-medium">{item.name}</TableCell>
                      <TableCell className="text-xs text-right">{count}</TableCell>
                      <TableCell className="text-xs text-right font-semibold">{fmt(item.value)}</TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">{fmt(avg)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Transaction Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income Only</SelectItem>
                    <SelectItem value="expense">Expense Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {filteredCategory.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">From Date</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">To Date</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by description..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="data-table-wrapper">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Loading transactions...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No transactions found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs">Reference</TableHead>
                    <TableHead className="text-xs">Related To</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs font-medium">{new Date(t.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={t.type === "income" ? "badge-success" : "badge-destructive"}>{t.type}</span>
                      </TableCell>
                      <TableCell className="text-xs">{t.category}</TableCell>
                      <TableCell className="text-xs">{t.description}</TableCell>
                      <TableCell className="text-xs font-mono">{t.reference || "—"}</TableCell>
                      <TableCell className="text-xs">{t.source ? dealers.find((d) => String(d.id) === String(t.source))?.company || "—" : "—"}</TableCell>
                      <TableCell className={`text-xs text-right font-semibold ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" 
                          onClick={() => deleteTransaction(t.id)}
                          disabled={deletingTxnId === String(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="data-table-wrapper">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Income Statement</h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Income</span>
                  <span className="font-semibold text-success">{fmt(income)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Expenses</span>
                  <span className="font-semibold text-destructive">- {fmt(expense)}</span>
                </div>
                <div className="border-t border-border my-2" />
                <div className="flex justify-between text-base font-bold">
                  <span>Net Profit/Loss</span>
                  <span className={profit >= 0 ? "text-success" : "text-destructive"}>{fmt(profit)}</span>
                </div>
              </div>
            </div>

            <div className="data-table-wrapper">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Financial Metrics</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Profit Margin</div>
                  <div className="text-2xl font-bold">{income > 0 ? ((profit / income) * 100).toFixed(1) : "0"}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Expense Ratio</div>
                  <div className="text-2xl font-bold">{income > 0 ? ((expense / income) * 100).toFixed(1) : "0"}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Average Transaction</div>
                  <div className="text-2xl font-bold">{txns.length > 0 ? fmt((income + expense) / txns.length) : "—"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="data-table-wrapper">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Top Categories by Amount</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryBreakdown.sort((a, b) => b.value - a.value).slice(0, 10).map((item) => {
                  const txType = txns.find(t => t.category === item.name)?.type || "—";
                  const totalAmount = income + expense;
                  const percentage = totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) : "0";
                  return (
                    <TableRow key={item.name}>
                      <TableCell className="text-xs font-medium">{item.name}</TableCell>
                      <TableCell className="text-xs"><span className={txType === "income" ? "badge-success" : "badge-destructive"}>{txType}</span></TableCell>
                      <TableCell className="text-xs text-right font-semibold">{fmt(item.value)}</TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">{percentage}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="data-table-wrapper p-6">
              <div className="text-xs text-muted-foreground mb-2">Outstanding Receivables</div>
              <div className="text-3xl font-bold text-success">
                {fmt(txns.filter(t => t.type === "income" && t.reference && !t.source).reduce((s, t) => s + t.amount, 0))}
              </div>
            </div>
            <div className="data-table-wrapper p-6">
              <div className="text-xs text-muted-foreground mb-2">Outstanding Payables</div>
              <div className="text-3xl font-bold text-destructive">
                {fmt(txns.filter(t => t.type === "expense" && t.reference && !t.source).reduce((s, t) => s + t.amount, 0))}
              </div>
            </div>
            <div className="data-table-wrapper p-6">
              <div className="text-xs text-muted-foreground mb-2">Cash Balance</div>
              <div className="text-3xl font-bold" style={{ color: profit >= 0 ? "hsl(142, 71%, 40%)" : "hsl(0, 72%, 51%)" }}>
                {fmt(profit)}
              </div>
            </div>
          </div>

          <div className="data-table-wrapper">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Transactions Pending Reconciliation</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txns.filter(t => t.reference && t.status === "active").slice(0, 20).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{new Date(t.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs">{t.description}</TableCell>
                    <TableCell className="text-xs">{t.category}</TableCell>
                    <TableCell className={`text-xs text-right font-semibold ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                      {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                    </TableCell>
                    <TableCell><span className="badge-info">Pending</span></TableCell>
                  </TableRow>
                ))}
                {txns.filter(t => t.reference && t.status === "active").length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">All transactions reconciled</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
