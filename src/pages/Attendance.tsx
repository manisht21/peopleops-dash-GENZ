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

      // Log activity
      await supabase.from("activity_logs").insert([
        {
          user_id: user?.id,
          action: "attendance",
          description: "Checked in for today",
        },
      ]);

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

      // Log activity
      await supabase.from("activity_logs").insert([
        {
          user_id: user?.id,
          action: "attendance",
          description: "Checked out for today",
        },
      ]);

      toast.success("Checked out successfully");
      fetchAttendance();
    } catch (error) {
      console.error("Error checking out:", error);
      toast.error("Failed to check out");
    } finally {
      setMarking(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Tracking</h1>
          <p className="text-muted-foreground">
            Mark your attendance and view history
          </p>
        </div>

        {!isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {todayAttendance?.check_in ? (
                  <>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Check In</p>
                      <p className="text-lg font-semibold">
                        {new Date(todayAttendance.check_in).toLocaleTimeString()}
                      </p>
                    </div>
                    {todayAttendance?.check_out ? (
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Check Out</p>
                        <p className="text-lg font-semibold">
                          {new Date(todayAttendance.check_out).toLocaleTimeString()}
                        </p>
                      </div>
                    ) : (
                      <Button onClick={handleCheckOut} disabled={marking}>
                        {marking ? "Processing..." : "Check Out"}
                      </Button>
                    )}
                  </>
                ) : (
                  <Button onClick={handleCheckIn} disabled={marking}>
                    {marking ? "Processing..." : "Check In"}
                  </Button>
                )}
              </div>
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
