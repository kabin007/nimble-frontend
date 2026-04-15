import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Employee, Attendance, EmployeeAdvance } from "@/lib/types";
import { employeeAPI, attendanceAPI, advanceAPI } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, Mail, Phone, MapPin, Calendar, Briefcase, Building2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function EmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [advances, setAdvances] = useState<EmployeeAdvance[]>([]);
  const [openAdvance, setOpenAdvance] = useState(false);
  const [openAttendance, setOpenAttendance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch employee first
        const empData = await employeeAPI.getById(employeeId);
        setEmployee(empData);
        
        // Fetch attendance and advances separately so they don't block employee loading
        try {
          const attendanceData = await attendanceAPI.getAll();
          const attendance = Array.isArray(attendanceData) ? attendanceData : attendanceData.results || [];
          setAttendance(attendance.filter((a) => String(a.employeeId) === String(employeeId)));
        } catch (err) {
          console.error("Failed to fetch attendance data:", err);
          setAttendance([]);
        }
        
        try {
          const advancesData = await advanceAPI.getAll();
          const advances = Array.isArray(advancesData) ? advancesData : advancesData.results || [];
          setAdvances(advances.filter((a) => String(a.employeeId) === String(employeeId)));
        } catch (err) {
          console.error("Failed to fetch advances data:", err);
          setAdvances([]);
        }
      } catch (err) {
        console.error("Failed to fetch employee data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employeeId]);

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{loading ? "Loading..." : "Employee not found"}</p>
      </div>
    );
  }

  const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);
  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

  const handleAddAdvance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const newAdvance = await advanceAPI.create({
        employeeId: employee.id,
        amount: Number(fd.get("amount")),
        date: fd.get("date") as string,
        reason: (fd.get("reason") as string) || undefined,
      });
      setAdvances([...advances, newAdvance]);
      setOpenAdvance(false);
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      console.error("Failed to add advance:", err);
    }
  };

  const handleAddAttendance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const newAttendance = await attendanceAPI.create({
        employeeId: employee.id,
        date: fd.get("date") as string,
        status: fd.get("status") as "present" | "absent" | "leave",
        notes: (fd.get("notes") as string) || undefined,
      });
      setAttendance([...attendance, newAttendance]);
      setOpenAttendance(false);
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      console.error("Failed to add attendance:", err);
    }
  };

  const deleteAdvance = async (id: string) => {
    try {
      await advanceAPI.delete(id);
      setAdvances(advances.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete advance:", err);
    }
  };

  const deleteAttendance = async (id: string) => {
    try {
      await attendanceAPI.delete(id);
      setAttendance(attendance.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete attendance:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/employees")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>

      {/* Profile Header Card - Social Media Style */}
      <Card className="overflow-hidden border-0 shadow-lg">
        {/* Background Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        <CardContent className="relative px-6 pb-6">
          {/* Profile Picture - Circular */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 mb-6">
            <div className="relative">
              {employee.profilePicture ? (
                <img 
                  src={employee.profilePicture} 
                  alt={employee.name}
                  className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {employee.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white ${employee.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>

            {/* Name and Main Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-1">{employee.name}</h1>
              <p className="text-lg text-muted-foreground font-semibold mb-2">{employee.role}</p>
              <div className="flex flex-wrap gap-2">
                <Badge className={employee.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}>
                  {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact & Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <Phone className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-semibold text-sm">{employee.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <Briefcase className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-semibold text-sm">{employee.department}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <Calendar className="h-5 w-5 text-orange-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Join Date</p>
                <p className="font-semibold text-sm">{employee.joinDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <Award className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Tenure</p>
                <p className="font-semibold text-sm">
                  {Math.floor((new Date().getTime() - new Date(employee.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <span className="text-2xl">💰</span> Monthly Salary
            </p>
            <p className="text-3xl font-bold text-blue-600">{fmt(employee.salary)}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <span className="text-2xl">📊</span> Total Advances
            </p>
            <p className="text-3xl font-bold text-red-600">{fmt(totalAdvances)}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <span className="text-2xl">✓</span> Remaining Balance
            </p>
            <p className="text-3xl font-bold text-green-600">{fmt(employee.salary - totalAdvances)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Advances Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Advances & Deductions</CardTitle>
          <Dialog open={openAdvance} onOpenChange={setOpenAdvance}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Advance</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Advance</DialogTitle></DialogHeader>
              <form onSubmit={handleAddAdvance} className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Amount (₹)</Label><Input name="amount" type="number" required /></div>
                <div className="col-span-2"><Label>Date</Label><Input name="date" type="date" required /></div>
                <div className="col-span-2"><Label>Reason</Label><Input name="reason" placeholder="Optional" /></div>
                <div className="col-span-2 flex justify-end">
                  <Button type="submit" size="sm">Add</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="data-table-wrapper">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Reason</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">
                      No advances recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  advances.map((adv) => (
                    <TableRow key={adv.id}>
                      <TableCell className="text-xs">{adv.date}</TableCell>
                      <TableCell className="text-xs font-medium">{fmt(adv.amount)}</TableCell>
                      <TableCell className="text-xs">{adv.reason || "—"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive"
                          onClick={() => deleteAdvance(adv.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Attendance Records</CardTitle>
          <Dialog open={openAttendance} onOpenChange={setOpenAttendance}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Mark Attendance</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Mark Attendance</DialogTitle></DialogHeader>
              <form onSubmit={handleAddAttendance} className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Date</Label><Input name="date" type="date" required /></div>
                <div className="col-span-2">
                  <Label>Status</Label>
                  <select name="status" className="w-full border border-input rounded-md h-9 px-3 text-sm bg-background" required>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="leave">Leave</option>
                  </select>
                </div>
                <div className="col-span-2"><Label>Notes</Label><Input name="notes" placeholder="Optional" /></div>
                <div className="col-span-2 flex justify-end">
                  <Button type="submit" size="sm">Mark</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="data-table-wrapper">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Notes</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">
                      No attendance records
                    </TableCell>
                  </TableRow>
                ) : (
                  attendance
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((att) => (
                      <TableRow key={att.id}>
                        <TableCell className="text-xs">{att.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              att.status === "present"
                                ? "default"
                                : att.status === "absent"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {att.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{att.notes || "—"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive"
                            onClick={() => deleteAttendance(att.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
