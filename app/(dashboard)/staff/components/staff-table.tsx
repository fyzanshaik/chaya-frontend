"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { EditStaffDialog } from "./edit-staff-dialog";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Search,
  UserCircle,
  Calendar,
  Mail,
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import { formatDate, getTimeSince } from "../lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/auth-provider";

interface User {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  isEnabled: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt?: string | Date;
}

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export function StaffTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useAuth();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/users");
      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch staff members.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.role.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const refreshUsers = async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveEdit = async (updatedUserData: Partial<User>) => {
    if (!editingUser) return;
    try {
      const response = await axios.put(
        `/api/users/${editingUser.id}`,
        updatedUserData,
        { withCredentials: true }
      );
      toast.success("Staff member updated successfully.");
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === editingUser.id ? { ...u, ...response.data.user } : u
        )
      );
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (error: unknown) {
      console.error("Error updating user:", error);
      let errorMessage = "Failed to update staff member.";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object") {
        const err = error as { response?: { data?: { message?: string } } };
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      }

      toast.error(errorMessage);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await axios.delete(`/api/users/${userToDelete.id}`, {
        withCredentials: true,
      });
      toast.success("Staff member deleted successfully.");
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== userToDelete.id)
      );
    } catch (error: unknown) {
      const errorMessage =
        (error as ErrorResponse)?.response?.data?.message ||
        "Failed to delete staff member.";
      console.error("Error deleting user:", error);
      toast.error(errorMessage);
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const toggleUserStatus = async (userToToggle: User) => {
    const originalUsers = users.map((u) => ({ ...u }));

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userToToggle.id ? { ...u, isEnabled: !u.isEnabled } : u
      )
    );

    try {
      const response = await axios.patch(
        `/api/users/${userToToggle.id}/toggle-status`,
        { withCredentials: true }
      );
      toast.success("Staff member status updated successfully.");
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userToToggle.id ? { ...u, ...response.data.user } : u
        )
      );
    } catch (error: unknown) {
      const errorMessage =
        (error as ErrorResponse)?.response?.data?.message ||
        "Failed to update staff member status.";
      console.error("Error toggling user status:", error);
      setUsers(originalUsers);
      toast.error(errorMessage);
    }
  };

  const renderTableContent = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map(() => (
        <TableRow
          key={`loading-skeleton-${crypto.randomUUID()}`}
          className="animate-pulse"
        >
          <TableCell>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gray-200"></div>
              <div className="space-y-1">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-3 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
          </TableCell>
          <TableCell>
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
          </TableCell>
          <TableCell>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </TableCell>
          <TableCell>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </TableCell>
          <TableCell>
            <div className="h-8 w-8 bg-gray-200 rounded float-right"></div>
          </TableCell>
        </TableRow>
      ));
    }

    if (filteredUsers.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8">
            {searchQuery
              ? "No staff members match your search"
              : "No staff members found"}
          </TableCell>
        </TableRow>
      );
    }

    return filteredUsers.map((user) => (
      <TableRow key={user.id} className="hover:bg-gray-50">
        <TableCell>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <Mail className="h-3 w-3 mr-1" />
                {user.email}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge
            variant={user.role === "ADMIN" ? "default" : "outline"}
            className={
              user.role === "ADMIN" ? "bg-primary text-primary-foreground" : ""
            }
          >
            {user.role}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            <Switch
              checked={user.isEnabled}
              disabled={user.role === "ADMIN"}
              onCheckedChange={() => toggleUserStatus(user)}
            />
            <span
              className={user.isEnabled ? "text-green-600" : "text-red-600"}
            >
              {user.isEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span>{formatDate(user.lastLoginAt)}</span>
            {user.lastLoginAt && (
              <span className="text-xs text-muted-foreground flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {getTimeSince(user.lastLoginAt)}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>{formatDate(user.createdAt)}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteUser(user)}
                disabled={user.role === "ADMIN"}
                className={
                  user.role === "ADMIN" ? "opacity-50" : "text-red-600"
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search staff members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshUsers}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="relative overflow-x-auto rounded-md">
        <Table className="border">
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[250px]">Staff Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderTableContent()}</TableBody>
        </Table>
      </div>

      {editingUser && (
        <EditStaffDialog
          user={editingUser}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSaveEdit}
        />
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the staff member account for{" "}
              <span className="font-semibold">{userToDelete?.name}</span>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
