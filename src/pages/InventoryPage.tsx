import { useState, useEffect } from "react";
import { InventoryItem } from "@/lib/types";
import { inventoryAPI } from "@/lib/api";
import { Package, Search, Plus, Trash2, Pencil } from "lucide-react";
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

const categoryLabels: Record<string, string> = {
  fabric: "Fabric",
  garment: "Garment",
  accessory: "Accessory",
  raw_material: "Raw Material",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await inventoryAPI.getAll();
        // Handle both array and paginated response
        const items = Array.isArray(data) ? data : data.results || [];
        setItems(items);
      } catch (err) {
        console.error("Failed to fetch inventory:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const filtered = items.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || i.category === filterCat;
    return matchSearch && matchCat && i.status !== "deleted";
  });

  const totalValue = filtered.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const newItem = await inventoryAPI.create({
        name: fd.get("name") as string,
        category: fd.get("category") as InventoryItem["category"],
        sku: fd.get("sku") as string,
        quantity: Number(fd.get("quantity")),
        unit: fd.get("unit") as string,
        unitPrice: Number(fd.get("unitPrice")),
        reorderLevel: Number(fd.get("reorderLevel")),
        supplier: fd.get("supplier") as string,
      });
      setItems([...items, newItem]);
      setOpen(false);
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      console.error("Failed to add inventory item:", err);
    }
  };

  const deleteItem = async (id: string | number) => {
    try {
      await inventoryAPI.delete(String(id));
      setItems(items.filter((i) => String(i.id) !== String(id)));
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const handleEditOpen = (item: InventoryItem) => {
    setEditingItem(item);
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    const fd = new FormData(e.currentTarget);
    try {
      const updated = await inventoryAPI.update(String(editingItem.id), {
        name: fd.get("name") as string,
        category: fd.get("category") as InventoryItem["category"],
        sku: fd.get("sku") as string,
        quantity: Number(fd.get("quantity")),
        unit: fd.get("unit") as string,
        unitPrice: Number(fd.get("unitPrice")),
        reorderLevel: Number(fd.get("reorderLevel")),
        supplier: fd.get("supplier") as string,
      });
      setItems((prev) => prev.map((i) => (String(i.id) === String(editingItem.id) ? updated : i)));
      setEditOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error("Failed to update inventory item:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">
            {items.filter((i) => {
              const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
              const matchCat = filterCat === "all" || i.category === filterCat;
              return matchSearch && matchCat;
            }).length} items · Total value: ₹{items.filter((i) => {
              const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
              const matchCat = filterCat === "all" || i.category === filterCat;
              return matchSearch && matchCat;
            }).reduce((s, i) => s + i.quantity * Number(i.unitPrice), 0).toLocaleString("en-IN")}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={loading}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Name</Label><Input name="name" required /></div>
              <div><Label>SKU</Label><Input name="sku" required /></div>
              <div>
                <Label>Category</Label>
                <select name="category" className="w-full border border-input rounded-md h-9 px-3 text-sm bg-background" required>
                  <option value="fabric">Fabric</option>
                  <option value="garment">Garment</option>
                  <option value="accessory">Accessory</option>
                  <option value="raw_material">Raw Material</option>
                </select>
              </div>
              <div><Label>Quantity</Label><Input name="quantity" type="number" required /></div>
              <div><Label>Unit</Label><Input name="unit" required placeholder="pcs, meters..." /></div>
              <div><Label>Unit Price (₹)</Label><Input name="unitPrice" type="number" required /></div>
              <div><Label>Reorder Level</Label><Input name="reorderLevel" type="number" required /></div>
              <div className="col-span-2"><Label>Supplier</Label><Input name="supplier" required /></div>
              <div className="col-span-2 flex justify-end">
                <Button type="submit" size="sm">Add Item</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search items..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="fabric">Fabric</SelectItem>
            <SelectItem value="garment">Garment</SelectItem>
            <SelectItem value="accessory">Accessory</SelectItem>
            <SelectItem value="raw_material">Raw Material</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="data-table-wrapper">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">Loading inventory...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">SKU</TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs text-right">Qty</TableHead>
                <TableHead className="text-xs text-right">Unit Price</TableHead>
                <TableHead className="text-xs text-right">Value</TableHead>
                <TableHead className="text-xs">Supplier</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items
                .filter((i) => {
                  const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
                  const matchCat = filterCat === "all" || i.category === filterCat;
                  return matchSearch && matchCat;
                })
                .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs font-mono">{item.sku}</TableCell>
                    <TableCell className="text-xs font-medium">{item.name}</TableCell>
                    <TableCell className="text-xs">{categoryLabels[item.category]}</TableCell>
                    <TableCell className="text-xs text-right">{item.quantity} {item.unit}</TableCell>
                    <TableCell className="text-xs text-right">₹{Number(item.unitPrice).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-xs text-right font-medium">₹{(item.quantity * Number(item.unitPrice)).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-xs">{item.supplier}</TableCell>
                    <TableCell>
                      {item.quantity <= item.reorderLevel ? (
                        <span className="badge-destructive">Low Stock</span>
                      ) : (
                        <span className="badge-success">In Stock</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleEditOpen(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive"
                          onClick={() => deleteItem(item.id)}
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
          <DialogHeader><DialogTitle>Edit Inventory Item</DialogTitle></DialogHeader>
          {editingItem ? (
            <form onSubmit={handleEdit} className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Name</Label><Input name="name" defaultValue={editingItem.name} required /></div>
              <div><Label>SKU</Label><Input name="sku" defaultValue={editingItem.sku} required /></div>
              <div>
                <Label>Category</Label>
                <select name="category" className="w-full border border-input rounded-md h-9 px-3 text-sm bg-background" defaultValue={editingItem.category} required>
                  <option value="fabric">Fabric</option>
                  <option value="garment">Garment</option>
                  <option value="accessory">Accessory</option>
                  <option value="raw_material">Raw Material</option>
                </select>
              </div>
              <div><Label>Quantity</Label><Input name="quantity" type="number" defaultValue={editingItem.quantity} required /></div>
              <div><Label>Unit</Label><Input name="unit" defaultValue={editingItem.unit} required /></div>
              <div><Label>Unit Price (₹)</Label><Input name="unitPrice" type="number" defaultValue={editingItem.unitPrice} required /></div>
              <div><Label>Reorder Level</Label><Input name="reorderLevel" type="number" defaultValue={editingItem.reorderLevel} required /></div>
              <div className="col-span-2"><Label>Supplier</Label><Input name="supplier" defaultValue={editingItem.supplier} required /></div>
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
