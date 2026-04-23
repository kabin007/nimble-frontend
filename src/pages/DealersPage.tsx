import { useState, useEffect } from "react";
import { Dealer } from "@/lib/types";
import { dealerAPI } from "@/lib/api";
import { Search, Plus, Trash2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        setLoading(true);
        const data = await dealerAPI.getAll();
        // Handle both array and paginated response
        const dealers = Array.isArray(data) ? data : data.results || [];
        setDealers(dealers);
      } catch (err) {
        console.error("Failed to fetch dealers:", err);
        setDealers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDealers();
  }, []);

  const filtered = dealers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.company.toLowerCase().includes(search.toLowerCase()) || d.region.toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = dealers.reduce((s, d) => s + d.outstandingBalance, 0);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const newDealer = await dealerAPI.create({
        company: fd.get("company") as string,
        name: (fd.get("name") as string) || undefined,
        phone: (fd.get("phone") as string) || undefined,
        email: (fd.get("email") as string) || undefined,
        address: (fd.get("region") as string) || undefined,
      });
      setDealers([...dealers, newDealer]);
      setOpen(false);
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      console.error("Failed to add dealer:", err);
    }
  };

  const deleteDealer = async (id: string | number) => {
    try {
      await dealerAPI.delete(String(id));
      setDealers((prev) => prev.filter((d) => String(d.id) !== String(id)));
    } catch (err) {
      console.error("Failed to delete dealer:", err);
    }
  };

  const handleEditOpen = (dealer: Dealer) => {
    setEditingDealer(dealer);
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDealer) return;
    const fd = new FormData(e.currentTarget);
    try {
      const updated = await dealerAPI.update(String(editingDealer.id), {
        company: fd.get("company") as string,
        name: (fd.get("name") as string) || undefined,
        phone: (fd.get("phone") as string) || undefined,
        email: (fd.get("email") as string) || undefined,
        address: (fd.get("region") as string) || undefined,
      });
      setDealers((prev) => prev.map((d) => (String(d.id) === String(editingDealer.id) ? updated : d)));
      setEditOpen(false);
      setEditingDealer(null);
    } catch (err) {
      console.error("Failed to update dealer:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dealers</h1>
          <p className="page-subtitle">{dealers.length} dealers · Total outstanding: ₹{dealers.reduce((s, d) => s + (d.outstandingBalance || 0), 0).toLocaleString("en-IN")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={loading}><Plus className="h-4 w-4 mr-1" /> Add Dealer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Dealer</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
              <div><Label>Contact Name</Label><Input name="name" required /></div>
              <div><Label>Company</Label><Input name="company" required /></div>
              <div><Label>Phone</Label><Input name="phone" /></div>
              <div><Label>Email</Label><Input name="email" type="email" /></div>
              <div className="col-span-2"><Label>Address/Region</Label><Input name="region" /></div>
              <div className="col-span-2 flex justify-end">
                <Button type="submit" size="sm">Add Dealer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search dealers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="data-table-wrapper">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">Loading dealers...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Company</TableHead>
                <TableHead className="text-xs">Contact</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Address</TableHead>
                <TableHead className="text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dealers
                .filter((d) =>
                  (d.company || "").toLowerCase().includes(search.toLowerCase()) ||
                  (d.contact || "").toLowerCase().includes(search.toLowerCase()) ||
                  (d.address || "").toLowerCase().includes(search.toLowerCase())
                )
                .map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-xs font-medium">{d.name}</TableCell>
                    <TableCell className="text-xs">{d.contact || "—"}</TableCell>
                    <TableCell className="text-xs font-mono">{d.phone || "—"}</TableCell>
                    <TableCell className="text-xs">{d.email || "—"}</TableCell>
                    <TableCell className="text-xs">{d.address || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleEditOpen(d)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive"
                          onClick={() => deleteDealer(d.id)}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Dealer</DialogTitle></DialogHeader>
          {editingDealer ? (
            <form onSubmit={handleEdit} className="grid grid-cols-2 gap-3">
              <div><Label>Contact Name</Label><Input name="name" defaultValue={editingDealer.name || editingDealer.contact || ""} required /></div>
              <div><Label>Company</Label><Input name="company" defaultValue={editingDealer.company || ""} required /></div>
              <div><Label>Phone</Label><Input name="phone" defaultValue={editingDealer.phone || ""} /></div>
              <div><Label>Email</Label><Input name="email" type="email" defaultValue={editingDealer.email || ""} /></div>
              <div className="col-span-2"><Label>Address/Region</Label><Input name="region" defaultValue={editingDealer.address || editingDealer.region || ""} /></div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm">Save Changes</Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
