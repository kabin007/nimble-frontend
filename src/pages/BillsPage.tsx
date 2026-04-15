import { useState, useEffect } from "react";
import { Bill, Dealer } from "@/lib/types";
import { billAPI, dealerAPI } from "@/lib/api";
import { Search, Plus, Trash2, Upload, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { FileText, AlertTriangle, CheckCircle } from "lucide-react";
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

const statusColors: Record<string, string> = {
  paid: "badge-success",
  unpaid: "badge-warning",
  overdue: "badge-destructive",
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [dealerDialogOpen, setDealerDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [activeBillImage, setActiveBillImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedDealer, setSelectedDealer] = useState<string>("");
  const [billImage, setBillImage] = useState<File | null>(null);
  const [billImagePreview, setBillImagePreview] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [billsData, dealersData] = await Promise.all([billAPI.getAll(), dealerAPI.getAll()]);
        // Handle both array and paginated responses
        const bills = Array.isArray(billsData) ? billsData : billsData.results || [];
        const dealers = Array.isArray(dealersData) ? dealersData : dealersData.results || [];
        setBills(bills);
        setDealers(dealers);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setBills([]);
        setDealers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const markPaid = async (id: string | number) => {
    try {
      const updated = await billAPI.update(String(id), { status: "paid" });
      setBills(bills.map((b) => (String(b.id) === String(id) ? updated : b)));
    } catch (err) {
      console.error("Failed to mark bill as paid:", err);
    }
  };

  const deleteBill = async (id: string | number) => {
    try {
      await billAPI.delete(String(id));
      setBills(bills.filter((b) => String(b.id) !== String(id)));
    } catch (err) {
      console.error("Failed to delete bill:", err);
    }
  };

  const viewBillImage = (src: string) => {
    setActiveBillImage(src);
    setImageDialogOpen(true);
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const billData: any = {
        vendor: selectedDealer,
        amount: Number(fd.get("amount")),
        dueDate: fd.get("dueDate") as string,
        status: "unpaid",
        items: [{ description: fd.get("description") as string, amount: Number(fd.get("amount")) }],
      };

      // Handle image upload
      if (billImage) {
        const reader = new FileReader();
        billData.billImage = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(billImage);
        });
      }

      const newBill = await billAPI.create(billData);
      setBills([...bills, newBill]);
      setOpen(false);
      setSelectedDealer("");
      setBillImage(null);
      setBillImagePreview("");
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      console.error("Failed to add bill:", err);
    }
  };

  const handleBillImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      setBillImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBillImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDealer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const newDealer = await dealerAPI.create({
        name: fd.get("name") as string,
        phone: fd.get("phone") as string,
        email: fd.get("email") as string,
        address: fd.get("address") as string,
        dealerType: fd.get("dealerType") as string,
      });
      setDealers([...dealers, newDealer]);
      setSelectedDealer(newDealer.id);
      setDealerDialogOpen(false);
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      console.error("Failed to add dealer:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bills</h1>
          <p className="page-subtitle">Manage vendor bills and payments</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dealerDialogOpen} onOpenChange={setDealerDialogOpen}>
            {/* <DialogTrigger asChild>
              <Button variant="outline" size="sm">+ New Dealer</Button>
            </DialogTrigger> */}
            <DialogContent>
              <DialogHeader><DialogTitle>Add Dealer</DialogTitle></DialogHeader>
              <form onSubmit={handleAddDealer} className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Dealer Name</Label><Input name="name" placeholder="Supplier or Vendor name" required /></div>
                <div><Label>Phone</Label><Input name="phone" placeholder="+91..." /></div>
                <div><Label>Email</Label><Input name="email" type="email" /></div>
                <div className="col-span-2"><Label>Address</Label><Input name="address" placeholder="Street address" /></div>
                <div className="col-span-2"><Label>Type</Label>
                  <Select defaultValue="" onValueChange={(val) => {const input = document.querySelector('input[name="dealerType"]') as HTMLInputElement; if(input) input.value = val;}}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="stakeholder">Stakeholder</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input name="dealerType" type="hidden" />
                </div>
                <div className="col-span-2 flex justify-end"><Button type="submit" size="sm">Add Dealer</Button></div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={loading}><Plus className="h-4 w-4 mr-1" /> Add Bill</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Bill</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Bill Image (optional)</Label>
                  <div className="flex gap-2 items-start">
                    {billImagePreview && <img src={billImagePreview} alt="Preview" className="h-20 w-20 rounded object-cover" />}
                    <label className="flex-1">
                      <input type="file" accept="image/*" onChange={handleBillImageChange} className="hidden" />
                      <div className="border-2 border-dashed rounded p-3 cursor-pointer hover:bg-gray-50 text-center">
                        <Upload className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-xs text-muted-foreground">Click to upload bill image</span>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Dealer/Vendor</Label>
                  <Select value={selectedDealer} onValueChange={setSelectedDealer}>
                    <SelectTrigger><SelectValue placeholder={dealers.length === 0 ? "No dealers available" : "Select dealer"} /></SelectTrigger>
                    <SelectContent>
                      {dealers.map(d => (
                        <SelectItem key={String(d.id)} value={String(d.id)}>
                          {d.name || d.company || `Dealer #${d.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Description</Label><Input name="description" required /></div>
                <div><Label>Amount (₹)</Label><Input name="amount" type="number" required /></div>
                <div><Label>Due Date</Label><Input name="dueDate" type="date" required /></div>
                <div className="col-span-2 flex justify-end">
                  <Button type="submit" size="sm">Add Bill</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Paid" value={"₹" + bills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0).toLocaleString("en-IN")} icon={CheckCircle} iconColor="text-success" />
        <StatCard title="Unpaid Amount" value={"₹" + bills.filter((b) => b.status !== "paid").reduce((s, b) => s + b.amount, 0).toLocaleString("en-IN")} icon={FileText} iconColor="text-warning" />
        <StatCard title="Overdue Bills" value={String(bills.filter((b) => b.status === "overdue").length)} icon={AlertTriangle} iconColor="text-destructive" />
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search bills..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="data-table-wrapper">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">Loading bills...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Bill #</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Vendor</TableHead>
                <TableHead className="text-xs">Due Date</TableHead>
                <TableHead className="text-xs">Image</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Transaction</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills
                .filter((b) => {
                  const dealerName = dealers.find(d => String(d.id) === String(b.vendor))?.name || b.vendor;
                  const matchSearch = dealerName.toLowerCase().includes(search.toLowerCase()) || b.billNumber.toLowerCase().includes(search.toLowerCase());
                  const matchStatus = filterStatus === "all" || b.status === filterStatus;
                  return matchSearch && matchStatus;
                })
                .map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-xs font-mono font-medium">{b.billNumber}</TableCell>
                    <TableCell className="text-xs">{b.date}</TableCell>
                    <TableCell className="text-xs">{dealers.find(d => String(d.id) === String(b.vendor))?.name || b.vendor}</TableCell>
                    <TableCell className="text-xs">{b.dueDate}</TableCell>
                    <TableCell className="text-xs">
                      {b.billImage ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => viewBillImage(b.billImage!)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium">₹{b.amount.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-xs">
                      {b.transactionId ? (
                        <span className="text-blue-600 font-medium">
                          {transactions.find(t => String(t.id) === String(b.transactionId))?.category || "—"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell><span className={statusColors[b.status]}>{b.status}</span></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {b.status !== "paid" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markPaid(b.id)}>
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive"
                          onClick={() => deleteBill(b.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog
        open={imageDialogOpen}
        onOpenChange={(v) => {
          setImageDialogOpen(v);
          if (!v) setActiveBillImage("");
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Bill Image</DialogTitle></DialogHeader>
          {activeBillImage ? (
            <img src={activeBillImage} alt="Bill" className="w-full rounded border object-contain max-h-[70vh]" />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
