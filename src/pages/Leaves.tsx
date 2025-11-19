import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Check, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Leave {
  id: string;
  type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  review_notes: string | null;
  created_at: string;
  profiles: {
    name: string;
  };
}

const Leaves = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!roleData);

      // Fetch leaves based on role
      let query = supabase
        .from("leaves")
        .select(`
          id,
          type,
          start_date,
          end_date,
          reason,
          status,
          review_notes,
          created_at,
          profiles!leaves_user_id_fkey(name)
        `)
        .order("created_at", { ascending: false });

      if (!roleData) {
        query = query.eq("user_id", user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLeaves((data as any) || []);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      toast.error("Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeaves();
    }
  }, [user]);

  const handleSubmitLeave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const leaveData = {
      user_id: user?.id,
      type: formData.get("type") as "sick" | "vacation" | "personal" | "other",
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      reason: formData.get("reason") as string,
    };

      try {
        const { error } = await supabase.from("leaves").insert([leaveData]);

        if (error) throw error;

        toast.success("Leave request submitted successfully");
        setDialogOpen(false);
        fetchLeaves();
    } catch (error) {
      console.error("Error submitting leave:", error);
      toast.error("Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    try {
      const { error } = await supabase
        .from("leaves")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", leaveId);

      if (error) throw error;

      toast.success("Leave approved");
      fetchLeaves();
    } catch (error) {
      console.error("Error approving leave:", error);
      toast.error("Failed to approve leave");
    }
  };

  const handleReject = async (leaveId: string) => {
    try {
      const { error } = await supabase
        .from("leaves")
        .update({
          status: "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", leaveId);

      if (error) throw error;

      toast.success("Leave rejected");
      fetchLeaves();
    } catch (error) {
      console.error("Error rejecting leave:", error);
      toast.error("Failed to reject leave");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success text-success-foreground";
      case "rejected":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-warning text-warning-foreground";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leave Management</h1>
            <p className="text-muted-foreground">
              Request and manage leave applications
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmitLeave}>
                <DialogHeader>
                  <DialogTitle>Request Leave</DialogTitle>
                  <DialogDescription>
                    Submit a new leave request for approval
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Leave Type</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="vacation">Vacation</SelectItem>
                        <SelectItem value="personal">Personal Leave</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input id="end_date" name="end_date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      name="reason"
                      placeholder="Brief reason for leave"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : leaves.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No leave requests found
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isAdmin && <TableHead>Employee</TableHead>}
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.map((leave) => (
                      <TableRow key={leave.id}>
                        {isAdmin && (
                          <TableCell className="font-medium">
                            {leave.profiles.name}
                          </TableCell>
                        )}
                        <TableCell className="capitalize">{leave.type}</TableCell>
                        <TableCell>
                          {new Date(leave.start_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(leave.end_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {leave.reason}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(leave.status)}>
                            {leave.status}
                          </Badge>
                        </TableCell>
                        {isAdmin && leave.status === "pending" && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleApprove(leave.id)}
                              >
                                <Check className="h-4 w-4 text-success" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReject(leave.id)}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
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

export default Leaves;
