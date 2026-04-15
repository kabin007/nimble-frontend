import { useState, useEffect } from "react";
import { Attendance, Employee } from "@/lib/types";
import { attendanceAPI, employeeAPI } from "@/lib/api";
import { Search, Calendar, Check, X, Clock, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  present: { bg: "bg-green-100 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", icon: "✓" },
  absent: { bg: "bg-red-100 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", icon: "✗" },
  leave: { bg: "bg-blue-100 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", icon: "◆" },
};

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingStatus, setEditingStatus] = useState<"present" | "absent" | "leave">("present");
  const [editingNotes, setEditingNotes] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attendanceData, employeesData] = await Promise.all([
        attendanceAPI.getAll(),
        employeeAPI.getAll(),
      ]);
      // Handle both array and paginated responses
      const attendance = Array.isArray(attendanceData) ? attendanceData : attendanceData.results || [];
      const employees = Array.isArray(employeesData) ? employeesData : employeesData.results || [];
      setAttendance(attendance);
      setEmployees(employees);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setAttendance([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const activeEmployees = employees.filter((e) => e.status === "active" && e.name.toLowerCase().includes(search.toLowerCase()));

  const todayAttendance = attendance.filter((a) => a.date === selectedDate);

  const getAttendanceForEmployee = (empId: string | number) => {
    return todayAttendance.find((a) => String(a.employeeId) === String(empId));
  };

  const handleMarkAttendance = async (empId: string | number, status: "present" | "absent" | "leave") => {
    try {
      // Check if already marked
      const existing = getAttendanceForEmployee(empId);
      if (existing) {
        // Update existing
        const updated = await attendanceAPI.update(existing.id, { status });
        setAttendance(attendance.map((a) => (a.id === existing.id ? updated : a)));
      } else {
        // Create new
        const newAtt = await attendanceAPI.create({
          employeeId: String(empId),
          date: selectedDate,
          status,
        });
        setAttendance([...attendance, newAtt]);
      }
    } catch (err) {
      console.error("Failed to mark attendance:", err);
    }
  };

  const handleUpdateAttendance = async (id: string | number) => {
    try {
      const updated = await attendanceAPI.update(id, { 
        status: editingStatus,
        notes: editingNotes || undefined 
      });
      setAttendance(attendance.map((a) => (a.id === id ? updated : a)));
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update attendance:", err);
    }
  };

  const handleDeleteAttendance = async (id: string | number) => {
    try {
      await attendanceAPI.delete(id);
      setAttendance(attendance.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete attendance:", err);
    }
  };

  const stats = {
    present: todayAttendance.filter((a) => a.status === "present").length,
    absent: todayAttendance.filter((a) => a.status === "absent").length,
    leave: todayAttendance.filter((a) => a.status === "leave").length,
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Manager</h1>
          <p className="page-subtitle">Quick daily attendance marking for all employees</p>
        </div>
      </div>

      {/* Date Selector Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex gap-2 items-center flex-1">
              <Calendar className="h-5 w-5 text-blue-600" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-44 border-blue-200 focus:border-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search employees..."
                  className="pl-9 w-full sm:w-60"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">✓ Present</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.present}</p>
              </div>
              <div className="text-4xl opacity-20">✓</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">✗ Absent</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.absent}</p>
              </div>
              <div className="text-4xl opacity-20">✗</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">◆ On Leave</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.leave}</p>
              </div>
              <div className="text-4xl opacity-20">◆</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Grid */}
      <div>
        {activeEmployees.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-12 pb-12">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium">No active employees found</p>
                <p className="text-sm mt-1">No employees matching "{search}" found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeEmployees.map((emp) => {
              const att = getAttendanceForEmployee(emp.id);
              const isPresent = att?.status === "present";
              const isAbsent = att?.status === "absent";
              const isLeave = att?.status === "leave";

              return (
                <Card
                  key={emp.id}
                  className={`relative overflow-hidden shadow-sm hover:shadow-lg transition-all border-l-4 ${
                    isPresent
                      ? "bg-green-50 dark:bg-green-950/25 border-l-green-500"
                      : isAbsent
                      ? "bg-red-50 dark:bg-red-950/25 border-l-red-500"
                      : isLeave
                      ? "bg-blue-50 dark:bg-blue-950/25 border-l-blue-500"
                      : "bg-gray-50 dark:bg-gray-950/20 border-l-gray-400"
                  }`}
                >
                  <CardContent className="p-5">
                    {/* Employee Header */}
                    <div className="mb-4 pb-4 border-b border-gray-300 dark:border-gray-700">
                      <p className="font-bold text-base text-gray-900 dark:text-white leading-tight">{emp.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 space-x-1">
                        <span>{emp.role}</span>
                        <span>•</span>
                        <span>{emp.department}</span>
                      </p>
                    </div>

                    {/* Status Display or Action Buttons */}
                    {editingId === att?.id ? (
                      <Dialog open={true} onOpenChange={(open) => !open && setEditingId(null)}>
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle className="text-base">Edit Attendance</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">Employee: <span className="text-blue-600">{emp.name}</span></Label>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Status</Label>
                              <select
                                value={editingStatus}
                                onChange={(e) => setEditingStatus(e.target.value as "present" | "absent" | "leave")}
                                className="w-full border border-input rounded-md h-9 px-3 text-sm bg-background mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="present">Present ✓</option>
                                <option value="absent">Absent ✗</option>
                                <option value="leave">Leave ◆</option>
                              </select>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Notes (optional)</Label>
                              <Input
                                value={editingNotes}
                                onChange={(e) => setEditingNotes(e.target.value)}
                                placeholder="Add notes..."
                                className="mt-2"
                              />
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleUpdateAttendance(att!.id)}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : att ? (
                      <div className="space-y-3">
                        {/* Status Badge */}
                        <div
                          className={`w-full p-3 rounded-lg text-center font-bold text-sm transition-all duration-200 ${
                            isPresent
                              ? "bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100 shadow-sm"
                              : isAbsent
                              ? "bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100 shadow-sm"
                              : "bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 shadow-sm"
                          }`}
                        >
                          {att.status.toUpperCase()} {STATUS_COLORS[att.status]?.icon}
                        </div>

                        {/* Notes */}
                        {att.notes && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 italic bg-gray-100 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                            📝 {att.notes}
                          </p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-9 text-xs font-semibold border-gray-300 dark:border-gray-600"
                            onClick={() => {
                              setEditingId(att.id);
                              setEditingStatus(att.status);
                              setEditingNotes(att.notes || "");
                            }}
                          >
                            <Edit2 className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1 h-9 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                            onClick={() => handleDeleteAttendance(att.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide">Mark Attendance:</p>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            size="sm"
                            disabled={loading}
                            onClick={() => handleMarkAttendance(emp.id, "present")}
                            className={`h-10 font-semibold text-xs transition-all duration-200 ${
                              isPresent
                                ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                                : "bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 dark:bg-green-950 dark:hover:bg-green-900 dark:text-green-300 dark:border-green-800"
                            }`}
                          >
                            <Check className="h-4 w-4 mr-1" /> Present
                          </Button>
                          <Button
                            size="sm"
                            disabled={loading}
                            onClick={() => handleMarkAttendance(emp.id, "absent")}
                            className={`h-10 font-semibold text-xs transition-all duration-200 ${
                              isAbsent
                                ? "bg-red-600 hover:bg-red-700 text-white shadow-md"
                                : "bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-300 dark:border-red-800"
                            }`}
                          >
                            <X className="h-4 w-4 mr-1" /> Absent
                          </Button>
                          <Button
                            size="sm"
                            disabled={loading}
                            onClick={() => handleMarkAttendance(emp.id, "leave")}
                            className={`h-10 font-semibold text-xs transition-all duration-200 ${
                              isLeave
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                                : "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
                            }`}
                          >
                            <Clock className="h-4 w-4 mr-1" /> Leave
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
