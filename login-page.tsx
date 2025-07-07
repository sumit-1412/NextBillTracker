"use client"

import { useState } from "react"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  // Login form state
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState("")

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotStep, setForgotStep] = useState(1)
  const [identifier, setIdentifier] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isOtpLoading, setIsOtpLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [otpError, setOtpError] = useState("")

  const { toast } = useToast()

  // Validation states
  const [errors, setErrors] = useState({
    username: "",
    password: "",
    role: "",
    identifier: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Login form validation
  const validateLogin = () => {
    const newErrors = { ...errors }

    if (!username.trim()) {
      newErrors.username = "Username is required"
    } else {
      newErrors.username = ""
    }

    if (!password.trim()) {
      newErrors.password = "Password is required"
    } else {
      newErrors.password = ""
    }

    if (!role) {
      newErrors.role = "Please select a user role"
    } else {
      newErrors.role = ""
    }

    setErrors(newErrors)
    return !newErrors.username && !newErrors.password && !newErrors.role
  }

  // Handle login
  const handleLogin = async () => {
    if (!validateLogin()) return

    setIsLoggingIn(true)
    setLoginError("")

    // Mock login logic
    setTimeout(() => {
      // Simulate different responses
      const mockResponses = [
        { success: true },
        { success: false, error: "Invalid credentials" },
        { success: false, error: "Inactive account" },
      ]

      const response = mockResponses[0] // Change index to test different responses

      if (response.success) {
        console.log("Logging in", { username, password, role })
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        })
      } else {
        setLoginError(response.error || "Login failed")
      }

      setIsLoggingIn(false)
    }, 2000)
  }

  // Handle OTP send
  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      setErrors({ ...errors, identifier: "Mobile number or Email is required" })
      return
    }

    setIsOtpLoading(true)
    setErrors({ ...errors, identifier: "" })

    // Mock OTP send
    setTimeout(() => {
      setIsOtpLoading(false)
      setForgotStep(2)
      setOtpTimer(60)

      // Start countdown
      const countdown = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${identifier}`,
      })
    }, 1500)
  }

  // Handle OTP verification
  const handleVerifyOtp = () => {
    if (!otp.trim() || otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP")
      return
    }

    // Mock OTP verification
    if (otp === "123456") {
      setOtpError("")
      setForgotStep(3)
      toast({
        title: "OTP Verified",
        description: "Please set your new password",
      })
    } else {
      setOtpError("Invalid OTP. Please try again.")
    }
  }

  // Handle password reset
  const handlePasswordReset = async () => {
    const newErrors = { ...errors }

    if (!newPassword.trim()) {
      newErrors.newPassword = "Password is required"
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters"
    } else {
      newErrors.newPassword = ""
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    } else {
      newErrors.confirmPassword = ""
    }

    setErrors(newErrors)

    if (newErrors.newPassword || newErrors.confirmPassword) return

    setIsPasswordLoading(true)

    // Mock password reset
    setTimeout(() => {
      setIsPasswordLoading(false)
      toast({
        title: "Password Updated",
        description: "Password updated successfully. Please login.",
      })

      // Reset forgot password flow
      setShowForgotPassword(false)
      setForgotStep(1)
      setIdentifier("")
      setOtp("")
      setNewPassword("")
      setConfirmPassword("")
      setOtpError("")
    }, 2000)
  }

  // Handle resend OTP
  const handleResendOtp = () => {
    if (otpTimer > 0) return

    setOtpTimer(60)
    const countdown = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    toast({
      title: "OTP Resent",
      description: `New verification code sent to ${identifier}`,
    })
  }

  const isLoginDisabled = !username.trim() || !password.trim() || !role || isLoggingIn

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowForgotPassword(false)
                  setForgotStep(1)
                  setIdentifier("")
                  setOtp("")
                  setNewPassword("")
                  setConfirmPassword("")
                  setOtpError("")
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
            </div>
            <CardDescription>
              {forgotStep === 1 && "Enter your mobile number or email to receive OTP"}
              {forgotStep === 2 && "Enter the verification code sent to your device"}
              {forgotStep === 3 && "Create a new password for your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {forgotStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="identifier">Mobile Number or Email</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="Enter mobile number or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full"
                  />
                  {errors.identifier && <p className="text-sm text-destructive">{errors.identifier}</p>}
                </div>
                <Button onClick={handleSendOtp} disabled={!identifier.trim() || isOtpLoading} className="w-full">
                  {isOtpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send OTP
                </Button>
              </>
            )}

            {forgotStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  {otpError && <p className="text-sm text-destructive">{otpError}</p>}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sent to: {identifier}</span>
                  {otpTimer > 0 ? (
                    <span className="text-muted-foreground">Resend in {otpTimer}s</span>
                  ) : (
                    <Button variant="link" size="sm" onClick={handleResendOtp} className="p-0 h-auto">
                      Resend OTP
                    </Button>
                  )}
                </div>

                <Button onClick={handleVerifyOtp} disabled={!otp.trim() || otp.length !== 6} className="w-full">
                  Verify OTP
                </Button>
              </>
            )}

            {forgotStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full"
                  />
                  {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full"
                  />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>

                <Button
                  onClick={handlePasswordReset}
                  disabled={!newPassword.trim() || !confirmPassword.trim() || isPasswordLoading}
                  className="w-full"
                >
                  {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Bill Tracker</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loginError && (
            <Alert variant="destructive">
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full"
            />
            {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">User Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="commissioner">Commissioner</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
          </div>

          <Button onClick={handleLogin} disabled={isLoginDisabled} className="w-full">
            {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Forgot Password?
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
