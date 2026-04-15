import { useState, useEffect } from "react";
import { Order } from "@/lib/types";
import { orderAPI } from "@/lib/api";
import { Search, Plus, Trash2 } from "lucide-react";
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

const statusColors: Record<string, string> = {
  pending: "badge-warning",
  processing: "badge-info",
  delivered: "badge-success",
  completed: "badge-success",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCompany, setIsCompany] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await orderAPI.getAll();
        // Handle both array and paginated response
        const orders = Array.isArray(data) ? data : data.results || [];
        setOrders(orders);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.orderNumber.toLowerCase().includes(search.toLowerCase());
    const matchChannel = filterChannel === "all" || o.channel === filterChannel;
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchChannel && matchStatus && o.status !== "deleted";
  });

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const customerName = isCompany 
        ? fd.get("companyName") as string
        : fd.get("personName") as string;

      const orderData: any = {
        customer: customerName,
        channel: fd.get("channel") as Order["channel"],
        items: [{ name: fd.get("itemName") as string, qty: Number(fd.get("qty")), price: Number(fd.get("price")) }],
        total: Number(fd.get("qty")) * Number(fd.get("price")),
        status: "pending",
      };

      // Add optional customer details
      if (isCompany) {
        orderData.companyName = fd.get("companyName");
        orderData.vatNumber = fd.get("vatNumber");
        orderData.panNumber = fd.get("panNumber");
      } else {
        orderData.personName = fd.get("personName");
      }

      orderData.contactNo = fd.get("contactNo");
      orderData.address = fd.get("address");
      orderData.email = fd.get("email");

      const newOrder = await orderAPI.create(orderData);
      setOrders([...orders, newOrder]);
      setOpen(false);
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      console.error("Failed to create order:", err);
    }
  };

  const updateStatus = async (id: string | number, status: Order["status"]) => {
    try {
      const updated = await orderAPI.update(String(id), { status });
      setOrders(orders.map((o) => (String(o.id) === String(id) ? updated : o)));
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const deleteOrder = async (id: string | number) => {
    try {
      await orderAPI.delete(String(id));
      setOrders(orders.filter((o) => String(o.id) !== String(id)));
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  const fmt = (n: number | undefined) => {
    if (n === undefined || n === null) return "₹0";
    return "₹" + Number(n).toLocaleString("en-IN");
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{orders.filter((o) => {
            const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.orderNumber.toLowerCase().includes(search.toLowerCase());
            const matchChannel = filterChannel === "all" || o.channel === filterChannel;
            const matchStatus = filterStatus === "all" || o.status === filterStatus;
            return matchSearch && matchChannel && matchStatus;
          }).length} orders · Total: ₹{orders.filter((o) => {
            const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.orderNumber.toLowerCase().includes(search.toLowerCase());
            const matchChannel = filterChannel === "all" || o.channel === filterChannel;
            const matchStatus = filterStatus === "all" || o.status === filterStatus;
            return matchSearch && matchChannel && matchStatus;
          }).reduce((s, o) => s + Number(o.total), 0).toLocaleString("en-IN")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={loading}><Plus className="h-4 w-4 mr-1" /> New Order</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create New Order</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              
              {/* Customer Type Selection */}
              <div className="col-span-2">
                <Label className="text-base font-semibold mb-3 block">Customer Type</Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCompany(true)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      isCompany 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <span className="font-semibold">🏢 Company</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCompany(false)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      !isCompany 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <span className="font-semibold">👤 Individual</span>
                  </button>
                </div>
              </div>

              {/* Company Fields */}
              {isCompany ? (
                <>
                  <div className="col-span-2">
                    <Label>Company Name *</Label>
                    <Input name="companyName" placeholder="Business name" required />
                  </div>
                  <div>
                    <Label>VAT Number (optional)</Label>
                    <Input name="vatNumber" placeholder="VAT ID" />
                  </div>
                  <div>
                    <Label>PAN Number (optional)</Label>
                    <Input name="panNumber" placeholder="PAN ID" />
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2">
                    <Label>Full Name *</Label>
                    <Input name="personName" placeholder="Customer name" required />
                  </div>
                </>
              )}

              {/* Common Customer Fields */}
              <div>
                <Label>Contact No *</Label>
                <Input name="contactNo" placeholder="+91 XXXXX XXXXX" required />
              </div>
              <div>
                <Label>Email (optional)</Label>
                <Input name="email" type="email" placeholder="customer@example.com" />
              </div>

              <div className="col-span-2">
                <Label>Address (optional)</Label>
                <Input name="address" placeholder="Street address, City, State, Zip" />
              </div>

              {/* Order Details */}
              <div className="col-span-2 pt-3 border-t">
                <Label className="text-base font-semibold">Order Details</Label>
              </div>

              <div className="col-span-2">
                <Label>Channel *</Label>
                <select name="channel" className="w-full border border-input rounded-md h-9 px-3 text-sm bg-background" required>
                  <option value="">Select channel</option>
                  <option value="online">📱 Online</option>
                  <option value="physical">🏪 Physical Store</option>
                  <option value="dealer">🤝 Dealer</option>
                </select>
              </div>

              <div className="col-span-2">
                <Label>Item Name *</Label>
                <Input name="itemName" placeholder="Product name" required />
              </div>

              <div>
                <Label>Quantity *</Label>
                <Input name="qty" type="number" placeholder="1" required />
              </div>

              <div>
                <Label>Price per unit (₹) *</Label>
                <Input name="price" type="number" placeholder="0.00" required />
              </div>

              {/* Action Buttons */}
              <div className="col-span-2 flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">Create Order</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterChannel} onValueChange={setFilterChannel}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="physical">Physical</SelectItem>
            <SelectItem value="dealer">Dealer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="data-table-wrapper">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">Loading orders...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Order #</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Channel</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders
                .filter((o) => {
                  const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.orderNumber.toLowerCase().includes(search.toLowerCase());
                  const matchChannel = filterChannel === "all" || o.channel === filterChannel;
                  const matchStatus = filterStatus === "all" || o.status === filterStatus;
                  return matchSearch && matchChannel && matchStatus;
                })
                .map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-xs font-mono font-medium">{o.orderNumber}</TableCell>
                    <TableCell className="text-xs">{o.date}</TableCell>
                    <TableCell className="text-xs">{o.customer}</TableCell>
                    <TableCell className="text-xs capitalize">{o.channel}</TableCell>
                    <TableCell className="text-xs text-right font-medium">₹{Number(o.total).toLocaleString("en-IN")}</TableCell>
                    <TableCell><span className={statusColors[o.status]}>{o.status}</span></TableCell>
                    <TableCell>
                      <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as Order["status"])}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive"
                        onClick={() => deleteOrder(o.id)}
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
    </div>
  );
}
