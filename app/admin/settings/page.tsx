"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { Eye, EyeOff, Save, Settings, DollarSign, Smartphone, MessageSquare } from "lucide-react"

export default function SettingsPage() {
  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Payout configuration state
  const [payoutConfig, setPayoutConfig] = useState({
    ratePerForm: "25",
    excludeCorrected: false,
    onlyCountPaid: true,
  })

  // App settings state
  const [appSettings, setAppSettings] = useState({
    requireGPS: true,
    requirePhoto: true,
    enablePhotoQuality: false,
    enableHelpOverride: true,
  })

  // Announcement state
  const [announcement, setAnnouncement] = useState("Submit all forms by 6 PM today. Contact support for any issues.")

  const handlePasswordChange = () => {
    // Validation
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    // Mock password change
    console.log("Password change:", passwordData)
    setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" })
    setShowOldPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)

    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully",
    })
  }

  const handlePayoutSave = () => {
    if (!payoutConfig.ratePerForm || isNaN(Number(payoutConfig.ratePerForm))) {
      toast({
        title: "Invalid Rate",
        description: "Please enter a valid rate per form",
        variant: "destructive",
      })
      return
    }

    console.log("Payout config saved:", payoutConfig)
    toast({
      title: "Payout Settings Saved",
      description: `Rate set to ₹${payoutConfig.ratePerForm} per form`,
    })
  }

  const handleAppSettingsSave = () => {
    console.log("App settings saved:", appSettings)
    toast({
      title: "App Settings Saved",
      description: "Application settings have been updated",
    })
  }

  const handleAnnouncementSave = () => {
    console.log("Announcement saved:", announcement)
    toast({
      title: "Announcement Saved",
      description: "Staff announcement has been updated",
    })
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuration & Settings</h1>
          <p className="text-muted-foreground">Manage system configuration and announcements</p>
        </div>

        {/* Password Change Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Password Change
            </CardTitle>
            <CardDescription>Update your admin account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="oldPassword">Current Password *</Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOldPassword ? "text" : "password"}
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, oldPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="newPassword">New Password *</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password (min 6 chars)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <Button onClick={handlePasswordChange}>
              <Save className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Payout Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payout Configuration
            </CardTitle>
            <CardDescription>Configure payment rates and calculation rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="ratePerForm">Global Rate per Form (₹) *</Label>
                <Input
                  id="ratePerForm"
                  type="number"
                  value={payoutConfig.ratePerForm}
                  onChange={(e) => setPayoutConfig((prev) => ({ ...prev, ratePerForm: e.target.value }))}
                  placeholder="Enter rate per form"
                  min="0"
                  step="0.01"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Amount paid to staff for each successfully delivered form
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="excludeCorrected">Exclude Corrected Forms</Label>
                    <p className="text-sm text-muted-foreground">Don't pay for forms that required corrections</p>
                  </div>
                  <Switch
                    id="excludeCorrected"
                    checked={payoutConfig.excludeCorrected}
                    onCheckedChange={(checked) => setPayoutConfig((prev) => ({ ...prev, excludeCorrected: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="onlyCountPaid">Only Count 'Paid = Yes'</Label>
                    <p className="text-sm text-muted-foreground">Only include forms where payment was collected</p>
                  </div>
                  <Switch
                    id="onlyCountPaid"
                    checked={payoutConfig.onlyCountPaid}
                    onCheckedChange={(checked) => setPayoutConfig((prev) => ({ ...prev, onlyCountPaid: checked }))}
                  />
                </div>
              </div>
            </div>
            <Button onClick={handlePayoutSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Payout Settings
            </Button>
          </CardContent>
        </Card>

        {/* App Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              App Settings
            </CardTitle>
            <CardDescription>Configure mobile app behavior and requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireGPS">Require GPS for Submission</Label>
                    <p className="text-sm text-muted-foreground">Staff must enable GPS to submit forms</p>
                  </div>
                  <Switch
                    id="requireGPS"
                    checked={appSettings.requireGPS}
                    onCheckedChange={(checked) => setAppSettings((prev) => ({ ...prev, requireGPS: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requirePhoto">Require Photo for Submission</Label>
                    <p className="text-sm text-muted-foreground">Staff must take a photo to submit forms</p>
                  </div>
                  <Switch
                    id="requirePhoto"
                    checked={appSettings.requirePhoto}
                    onCheckedChange={(checked) => setAppSettings((prev) => ({ ...prev, requirePhoto: checked }))}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enablePhotoQuality">Enable Photo Quality Flagging</Label>
                    <p className="text-sm text-muted-foreground">Automatically flag low-quality photos</p>
                  </div>
                  <Switch
                    id="enablePhotoQuality"
                    checked={appSettings.enablePhotoQuality}
                    onCheckedChange={(checked) => setAppSettings((prev) => ({ ...prev, enablePhotoQuality: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableHelpOverride">Enable Help Override Field</Label>
                    <p className="text-sm text-muted-foreground">Allow staff to override help status</p>
                  </div>
                  <Switch
                    id="enableHelpOverride"
                    checked={appSettings.enableHelpOverride}
                    onCheckedChange={(checked) => setAppSettings((prev) => ({ ...prev, enableHelpOverride: checked }))}
                  />
                </div>
              </div>
            </div>
            <Button onClick={handleAppSettingsSave}>
              <Save className="h-4 w-4 mr-2" />
              Save App Settings
            </Button>
          </CardContent>
        </Card>

        {/* Announcement Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Staff Announcement
            </CardTitle>
            <CardDescription>Message displayed to all staff on login and dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="announcement">Announcement Message</Label>
              <Textarea
                id="announcement"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Enter announcement message for staff..."
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground mt-1">
                This message will be visible to all staff members when they log in or view their dashboard
              </p>
            </div>
            <Button onClick={handleAnnouncementSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Announcement
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
