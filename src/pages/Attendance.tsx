import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Attendance {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  profiles: {
    name: string;
  };
}

interface TodayAttendance {
  check_in: string | null;
  check_out: string | null;
}

const Attendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [marking, setMarking] = useState(false);
  const [employees, setEmployees] = useState<Array<{id: string; name: string}>>([]);

  const fetchAttendance = async () => {
    try {
      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!roleData);

      // Fetch all employees if admin
      if (roleData) {
        const { data: empData } = await supabase
          .from("profiles")
          .select("id, name")
          .order("name");
        setEmployees(empData || []);
      }

      // Fetch today's attendance for current user
      const today = new Date().toISOString().split("T")[0];
      const { data: todayData } = await supabase
        .from("attendance")
        .select("check_in, check_out")
        .eq("user_id", user?.id)
        .eq("date", today)
        .single();

      setTodayAttendance(todayData);

      // Fetch attendance records
      let query = supabase
        .from("attendance")
        .select(`
          id,
          date,
          check_in,
          check_out,
          profiles(name)
        `)
        .order("date", { ascending: false })
        .limit(30);

      if (!roleData) {
        query = query.eq("user_id", user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAttendance((data as any) || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAttendance();
    }
  }, [user]);

  const handleCheckIn = async () => {
    if (!isAdmin) {
      toast.error("Only administrators can mark attendance");
      return;
    }
    setMarking(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();

      const { error } = await supabase.from("attendance").insert([
        {
          user_id: user?.id,
          date: today,
          check_in: now,
        },
      ]);

      if (error) throw error;

      toast.success("Checked in successfully");
      fetchAttendance();
    } catch (error: any) {
      console.error("Error checking in:", error);
      if (error.code === "23505") {
        toast.error("You have already checked in today");
      } else {
        toast.error("Failed to check in");
      }
    } finally {
      setMarking(false);
    }
  };

  const handleCheckOut = async () => {
    if (!isAdmin) {
      toast.error("Only administrators can mark attendance");
      return;
    }
    setMarking(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("attendance")
        .update({ check_out: now })
        .eq("user_id", user?.id)
        .eq("date", today);

      if (error) throw error;

      toast.success("Checked out successfully");
      fetchAttendance();
    } catch (error) {
      console.error("Error checking out:", error);
      toast.error("Failed to check out");
    } finally {
      setMarking(false);
    }
  };

  const handleMarkAttendance = async (employeeId: string, employeeName: string, action: 'in' | 'out') => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();

      if (action === 'in') {
        const { error } = await supabase.from("attendance").insert([
          {
            user_id: employeeId,
            date: today,
            check_in: now,
          },
        ]);

        if (error) {
          if (error.code === "23505") {
            toast.error(`${employeeName} has already checked in today`);
          } else {
            throw error;
          }
          return;
        }

        toast.success(`Checked in ${employeeName}`);
      } else {
        const { error } = await supabase
          .from("attendance")
          .update({ check_out: now })
          .eq("user_id", employeeId)
          .eq("date", today);

        if (error) throw error;

        toast.success(`Checked out ${employeeName}`);
      }

      fetchAttendance();
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Tracking</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Mark and manage employee attendance" : "View your attendance records"}
          </p>
        </div>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Mark Employee Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {employees.map((emp) => {
                    const today = new Date().toISOString().split('T')[0];
                    const todayRecord = attendance.find(
                      a => a.date === today && 
                      a.profiles && 'name' in a.profiles && 
                      a.profiles.name === emp.name
                    );

                    return (
                      <div key={emp.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{emp.name}</span>
                        <div className="flex gap-2">
                          {!todayRecord?.check_in ? (
                            <Button
                              size="sm"
                              onClick={() => handleMarkAttendance(emp.id, emp.name, 'in')}
                            >
                              Check In
                            </Button>
                          ) : !todayRecord?.check_out ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                In at {new Date(todayRecord.check_in).toLocaleTimeString()}
                              </span>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleMarkAttendance(emp.id, emp.name, 'out')}
                              >
                                Check Out
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground p-4">
                Only administrators can mark attendance. Your attendance will be marked by an admin.
              </div>
              {todayAttendance?.check_in && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Check In:</span>
                    <span className="text-sm">
                      {new Date(todayAttendance.check_in).toLocaleTimeString()}
                    </span>
                  </div>
                  {todayAttendance.check_out && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Check Out:</span>
                      <span className="text-sm">
                        {new Date(todayAttendance.check_out).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : attendance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No attendance records found
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isAdmin && <TableHead>Employee</TableHead>}
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => {
                      const checkIn = record.check_in
                        ? new Date(record.check_in)
                        : null;
                      const checkOut = record.check_out
                        ? new Date(record.check_out)
                        : null;
                      const hours =
                        checkIn && checkOut
                          ? ((checkOut.getTime() - checkIn.getTime()) /
                              (1000 * 60 * 60)).toFixed(2)
                          : "—";

                      return (
                        <TableRow key={record.id}>
                          {isAdmin && (
                            <TableCell className="font-medium">
                              {record.profiles.name}
                            </TableCell>
                          )}
                          <TableCell>
                            {new Date(record.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {checkIn ? checkIn.toLocaleTimeString() : "—"}
                          </TableCell>
                          <TableCell>
                            {checkOut ? checkOut.toLocaleTimeString() : "—"}
                          </TableCell>
                          <TableCell>{hours}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
