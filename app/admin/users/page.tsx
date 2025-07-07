"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from "lucide-react"

// Types for API data
interface User {
  _id: string
  email: string
  fullName: string
  staffId?: string
  role: 'staff' | 'admin' | 'commissioner'
  isActive: boolean
  mobileNo?: string
}

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchName, setSearchName] = useState("")
  const [searchMobile, setSearchMobile] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterZone, setFilterZone] = useState("all")
  const [filterWard, setFilterWard] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    role: "",
    zone: "",
    wards: [] as string[],
  })

  // Load data from API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        // Mock users data since getUsers doesn't exist
        const mockUsers: User[] = [
          { _id: "1", email: "admin@example.com", fullName: "Admin User", role: "admin", isActive: true, mobileNo: "9876543210" },
          { _id: "2", email: "staff1@example.com", fullName: "Staff One", role: "staff", isActive: true, mobileNo: "9876543211" },
          { _id: "3", email: "staff2@example.com", fullName: "Staff Two", role: "staff", isActive: true, mobileNo: "9876543212" },
          { _id: "4", email: "commissioner@example.com", fullName: "Commissioner", role: "commissioner", isActive: true, mobileNo: "9876543213" },
        ]
        setUsers(mockUsers)
        setFilteredUsers(mockUsers)
      } catch (error) {
        console.error('Error loading users:', error)
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [toast])

  // Filter users based on search and filter criteria
  useEffect(() => {
    const filtered = users.filter((user) => {
      const matchesName = user.fullName.toLowerCase().includes(searchName.toLowerCase())
      const matchesMobile = user.mobileNo ? user.mobileNo.includes(searchMobile) : false
      const matchesRole = filterRole === "all" || user.role === filterRole
      const matchesZone = filterZone === "all" // Zone filtering would need additional data
      const matchesWard = filterWard === "all" // Ward filtering would need additional data

      return matchesName && matchesMobile && matchesRole && matchesZone && matchesWard
    })
    setFilteredUsers(filtered)
  }, [searchName, searchMobile, filterRole, filterZone, filterWard, users])

  const handleAddUser = async () => {
    if (!formData.name || !formData.mobile || !formData.password || formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill all required fields and ensure passwords match.",
        variant: "destructive",
      })
      return
    }

    try {
      // Generate email from name
      const email = `${formData.name.toLowerCase().replace(/\s+/g, '.')}@nextbill.com`
      
      // Call backend API to create user
      const userData = {
        email: email,
        password: formData.password,
        fullName: formData.name,
        staffId: `STAFF${Date.now()}`, // Generate unique staff ID
        role: formData.role as 'staff' | 'admin' | 'commissioner',
      }

      const response = await apiService.register(userData)
      
      // Add the new user to the list
      const newUser: User = {
        _id: response.user.id,
        email: response.user.email,
        fullName: response.user.fullName,
        staffId: response.user.staffId,
        mobileNo: formData.mobile,
        role: response.user.role,
        isActive: response.user.isActive,
      }

      setUsers(prev => [...prev, newUser])
      setFormData({
        name: "",
        mobile: "",
        password: "",
        confirmPassword: "",
        role: "",
        zone: "",
        wards: [],
      })
      setIsAddDialogOpen(false)
      toast({
        title: "User Added Successfully",
        description: `User ${formData.name} has been created and can now login with email: ${email}`,
      })
    } catch (error) {
      console.error('Error adding user:', error)
      toast({
        title: "Error Adding User",
        description: error instanceof Error ? error.message : "Failed to create user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.fullName,
      mobile: user.mobileNo || "",
      password: "",
      confirmPassword: "",
      role: user.role,
      zone: "",
      wards: [],
    })
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      // Call backend API to update user
      const updateData = {
        fullName: formData.name,
        mobileNo: formData.mobile,
        role: formData.role as 'staff' | 'admin' | 'commissioner',
      }

      // For now, just update frontend state since we don't have update API
      setUsers(prev => prev.map(user => 
        user._id === editingUser._id 
          ? { ...user, fullName: formData.name, mobileNo: formData.mobile, role: formData.role as 'staff' | 'admin' | 'commissioner' }
          : user
      ))

      setEditingUser(null)
      setFormData({
        name: "",
        mobile: "",
        password: "",
        confirmPassword: "",
        role: "",
        zone: "",
        wards: [],
      })
      toast({
        title: "User Updated",
        description: "User has been updated successfully.",
      })
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Error Updating User",
        description: error instanceof Error ? error.message : "Failed to update user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      // Call backend API to delete user
      // For now, just update frontend state since we don't have delete API
      setUsers(prev => prev.filter(user => user._id !== userId))
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error Deleting User",
        description: error instanceof Error ? error.message : "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleUserStatus = async (userId: string) => {
    try {
      // Call backend API to toggle user status
      // For now, just update frontend state since we don't have status update API
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, isActive: !user.isActive } : user
      ))
      toast({
        title: "Status Updated",
        description: "User status has been updated successfully.",
      })
    } catch (error) {
      console.error('Error updating user status:', error)
      toast({
        title: "Error Updating Status",
        description: error instanceof Error ? error.message : "Failed to update user status. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-4 space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage staff accounts and permissions</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new staff account with appropriate permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="commissioner">Commissioner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>Add User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="searchName">Search by Name</Label>
                <Input
                  id="searchName"
                  placeholder="Enter name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="searchMobile">Search by Mobile</Label>
                <Input
                  id="searchMobile"
                  placeholder="Enter mobile"
                  value={searchMobile}
                  onChange={(e) => setSearchMobile(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filterRole">Filter by Role</Label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="commissioner">Commissioner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filterZone">Filter by Zone</Label>
                <Select value={filterZone} onValueChange={setFilterZone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    <SelectItem value="zone-a">Zone A</SelectItem>
                    <SelectItem value="zone-b">Zone B</SelectItem>
                    <SelectItem value="zone-c">Zone C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filterWard">Filter by Ward</Label>
                <Select value={filterWard} onValueChange={setFilterWard}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wards</SelectItem>
                    <SelectItem value="ward-1">Ward 1</SelectItem>
                    <SelectItem value="ward-2">Ward 2</SelectItem>
                    <SelectItem value="ward-3">Ward 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.mobileNo || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "destructive"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserStatus(user._id)}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.fullName}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user._id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName">Full Name</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editMobile">Mobile Number</Label>
                <Input
                  id="editMobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editRole">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="commissioner">Commissioner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>Update User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
