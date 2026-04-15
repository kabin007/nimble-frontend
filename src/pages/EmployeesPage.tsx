import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { employeeAPI } from "@/lib/api";
import { Employee } from "@/lib/types";
import { Search, Plus, UserCheck, UserX, Trash2, Upload, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [emps, setEmps] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getAll();
      // Handle both array and paginated response
      const employees = Array.isArray(response) ? response : response.results || [];
      setEmps(employees);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmps([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = emps.filter(
    (e) =>
      e.status !== "deleted" &&
      (e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.role.toLowerCase().includes(search.toLowerCase()) ||
        e.department.toLowerCase().includes(search.toLowerCase()))
  );

  const totalSalary = emps.filter((e) => e.status === "active").reduce((s, e) => s + e.salary, 0);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const data: any = {
        name: fd.get("name"),
        role: fd.get("role"),
        department: fd.get("department"),
        phone: fd.get("phone"),
        salary: fd.get("salary"),
        joinDate: fd.get("joinDate"),
      };
      
      if (profilePicture) {
        const reader = new FileReader();
        data.profilePicture = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(profilePicture);
        });
      }

      const response = await employeeAPI.create(data);
      setEmps([...emps, response]);
      setOpen(false);
      setProfilePicture(null);
      setPreviewUrl("");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Failed to create employee:", error);
    }
  };

  const toggleStatus = async (id: string | number) => {
    const emp = emps.find((e) => String(e.id) === String(id));
    if (!emp) return;
    try {
      const newStatus = emp.status === "active" ? "inactive" : "active";
      const response = await employeeAPI.update(String(id), { status: newStatus });
      setEmps(emps.map((e) => (String(e.id) === String(id) ? response : e)));
    } catch (error) {
      console.error("Failed to update employee status:", error);
    }
  };

  const deleteEmployee = async (id: string | number) => {
    try {
      const response = await employeeAPI.delete(String(id));
      setEmps(emps.map((e) => (String(e.id) === String(id) ? response : e)));
    } catch (error) {
      console.error("Failed to delete employee:", error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">
            {emps.filter((e) => e.status === "active").length} active · Monthly payroll: ₹
            {totalSalary.toLocaleString("en-IN")}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Profile Picture</Label>
                <div className="flex gap-2 items-center">
                  {previewUrl && <img src={previewUrl} alt="Preview" className="h-16 w-16 rounded object-cover" />}
                  <label className="flex-1">
                    <input type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
                    <div className="border-2 border-dashed rounded p-4 cursor-pointer hover:bg-gray-50 text-center">
                      <Upload className="h-4 w-4 mx-auto mb-1" />
                      <span className="text-xs text-muted-foreground">Click to upload</span>
                    </div>
                  </label>
                </div>
              </div>
              <div className="col-span-2">
                <Label>Full Name</Label>
                <Input name="name" required />
              </div>
              <div>
                <Label>Role</Label>
                <Input name="role" required />
              </div>
              <div>
                <Label>Department</Label>
                <Input name="department" required />
              </div>
              <div>
                <Label>Phone</Label>
                <Input name="phone" required />
              </div>
              <div>
                <Label>Salary (₹)</Label>
                <Input name="salary" type="number" required />
              </div>
              <div className="col-span-2">
                <Label>Join Date</Label>
                <Input name="joinDate" type="date" required />
              </div>
              <div className="col-span-2 flex justify-end">
                <Button type="submit" size="sm">
                  Add
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="data-table-wrapper">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Role</TableHead>
              <TableHead className="text-xs">Department</TableHead>
              <TableHead className="text-xs">Phone</TableHead>
              <TableHead className="text-xs text-right">Salary</TableHead>
              <TableHead className="text-xs">Joined</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell
                  className="text-xs font-medium cursor-pointer hover:underline"
                  onClick={() => navigate(`/employees/${emp.id}`)}
                >
                  {emp.name}
                </TableCell>
                <TableCell className="text-xs">{emp.role}</TableCell>
                <TableCell className="text-xs">{emp.department}</TableCell>
                <TableCell className="text-xs font-mono">{emp.phone}</TableCell>
                <TableCell className="text-xs text-right">₹{emp.salary.toLocaleString("en-IN")}</TableCell>
                <TableCell className="text-xs">{emp.joinDate}</TableCell>
                <TableCell>
                  <span
                    className={emp.status === "active" ? "badge-success" : "badge-destructive"}
                  >
                    {emp.status}
                  </span>
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => navigate(`/employees/${emp.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toggleStatus(emp.id)}
                  >
                    {emp.status === "active" ? (
                      <UserX className="h-3.5 w-3.5" />
                    ) : (
                      <UserCheck className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive"
                    onClick={() => deleteEmployee(emp.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
