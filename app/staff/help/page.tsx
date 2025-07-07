"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { StaffLayout } from "@/components/staff-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  HelpCircle,
  Search,
  Edit,
  Camera,
  Send,
  History,
  BarChart3,
  Phone,
  MessageCircle,
  ExternalLink,
  ArrowRight,
  CheckCircle,
  Info,
} from "lucide-react"

export default function StaffHelp() {
  const router = useRouter()
  const { toast } = useToast()

  // State for tracking opened accordion items
  const [openItems, setOpenItems] = useState<string[]>([])

  const handleCallSupport = () => {
    const phoneNumber = "+919876543210"
    window.open(`tel:${phoneNumber}`, "_self")
    toast({
      title: "Calling Support",
      description: "Opening phone dialer...",
    })
  }

  const handleWhatsAppSupport = () => {
    const phoneNumber = "919876543210"
    const message = "Hello, I need help with the Bill Tracker app."
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
    toast({
      title: "Opening WhatsApp",
      description: "Redirecting to WhatsApp support...",
    })
  }

  const navigateToTab = (tab: string) => {
    router.push(`/staff/${tab}`)
    toast({
      title: "Navigating",
      description: `Opening ${tab} tab...`,
    })
  }

  const handleFeedback = () => {
    toast({
      title: "Feedback",
      description: "Thank you for your interest! Feedback form coming soon.",
    })
    console.log("Open feedback form")
  }

  const handleVideoTutorial = () => {
    toast({
      title: "Video Tutorial",
      description: "Video tutorials will be available soon.",
    })
    console.log("Open video tutorial")
  }

  const helpTopics = [
    {
      id: "search-property",
      title: "✅ How to Search for a Property",
      icon: <Search className="h-4 w-4" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Use the search feature to quickly find existing properties in the database:
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">1</span>
              <p className="text-sm">
                Enter the <strong>Property ID</strong> or <strong>Owner Name</strong> in the search fields
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">2</span>
              <p className="text-sm">
                Optionally filter by <strong>Zone</strong>, <strong>Ward</strong>, or <strong>Mohalla</strong>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">3</span>
              <p className="text-sm">
                Tap <strong>"Search Property"</strong> to find matching records
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-mono">✓</span>
              <p className="text-sm">If found, the form will auto-fill with existing data</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToTab("home")}
            className="w-full mt-3 bg-transparent"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Try Searching Now
          </Button>
        </div>
      ),
    },
    {
      id: "manual-entry",
      title: "✍️ How to Fill Data Manually",
      icon: <Edit className="h-4 w-4" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            When a property is not found in the database, you can enter details manually:
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">📝</span>
              <p className="text-sm">
                Fill in <strong>Property ID</strong> (required)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">👤</span>
              <p className="text-sm">
                Enter <strong>Owner Name</strong> (required)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">🏠</span>
              <p className="text-sm">
                Add <strong>Address</strong> and mobile numbers (optional)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">📍</span>
              <p className="text-sm">
                Select <strong>Zone → Ward → Mohalla</strong> (required)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">💰</span>
              <p className="text-sm">
                Toggle <strong>Payment Status</strong> (Paid/Unpaid)
              </p>
            </div>
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Tip:</strong> Select Zone first to load available Wards, then select Ward to load Mohallas.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "photo-gps",
      title: "📸 How to Capture Photo & GPS",
      icon: <Camera className="h-4 w-4" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Every delivery requires a photo and GPS location for verification:
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">📷</span>
              <p className="text-sm">
                Tap <strong>"Capture Photo"</strong> to take a picture of the property
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">🌍</span>
              <p className="text-sm">
                GPS location is <strong>automatically captured</strong> when you open the form
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">🔄</span>
              <p className="text-sm">
                If GPS fails, tap <strong>"Retry Location"</strong> to try again
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">✅</span>
              <p className="text-sm">
                Both photo and GPS are <strong>required</strong> before submission
              </p>
            </div>
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Note:</strong> Make sure location services are enabled on your device for accurate GPS capture.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "submit-form",
      title: "📤 How to Submit the Form",
      icon: <Send className="h-4 w-4" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Follow these steps to successfully submit your delivery form:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-mono">1</span>
              <p className="text-sm">
                Complete all <strong>required fields</strong> (marked with *)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-mono">2</span>
              <p className="text-sm">
                Ensure <strong>photo is captured</strong> and <strong>GPS location</strong> is available
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-mono">3</span>
              <p className="text-sm">
                Tap <strong>"Submit Form"</strong> button (enabled when form is complete)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">⏳</span>
              <p className="text-sm">
                Wait for <strong>loading spinner</strong> and success message
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">🔄</span>
              <p className="text-sm">
                Form will <strong>automatically reset</strong> for next entry
              </p>
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-xs text-green-800">
              <CheckCircle className="h-3 w-3 inline mr-1" />
              <strong>Success!</strong> Your delivery has been recorded and will appear in your dashboard and history.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "submission-history",
      title: "🕓 Where to See Submission History",
      icon: <History className="h-4 w-4" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Track all your submitted deliveries in the History tab:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">📋</span>
              <p className="text-sm">
                Go to <strong>"History"</strong> tab to see all past records
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">🔍</span>
              <p className="text-sm">
                Filter by <strong>Property ID</strong>, <strong>Owner Name</strong>, or <strong>Date Range</strong>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">💰</span>
              <p className="text-sm">
                Filter by <strong>Payment Status</strong> (Paid/Unpaid)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">✏️</span>
              <p className="text-sm">
                See which entries were <strong>corrected</strong> after submission
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">👁️</span>
              <p className="text-sm">
                Tap any record to view <strong>full details</strong> with photo and GPS
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToTab("history")}
            className="w-full mt-3 bg-transparent"
          >
            <History className="h-4 w-4 mr-2" />
            View My History
          </Button>
        </div>
      ),
    },
    {
      id: "dashboard-info",
      title: "📊 What's in the Dashboard",
      icon: <BarChart3 className="h-4 w-4" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your dashboard shows a complete overview of your delivery performance:
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">📈</span>
              <p className="text-sm">
                <strong>Total Deliveries</strong> - All forms you've submitted
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">✅</span>
              <p className="text-sm">
                <strong>Paid Deliveries</strong> - Properties where payment was received
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">❌</span>
              <p className="text-sm">
                <strong>Unpaid Deliveries</strong> - Properties with pending payments
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">✏️</span>
              <p className="text-sm">
                <strong>Corrected Entries</strong> - Forms that needed updates
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">💰</span>
              <p className="text-sm">
                <strong>Total Earnings</strong> - Your payment based on deliveries (₹10 each)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">📅</span>
              <p className="text-sm">
                <strong>Date Filters</strong> - View stats for Today, This Week, or This Month
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToTab("dashboard")}
            className="w-full mt-3 bg-transparent"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View My Dashboard
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AuthGuard allowedRoles={["staff"]}>
      <StaffLayout>
        <div className="p-4 space-y-4 pb-20 overflow-y-auto h-full">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-foreground">Help & Guide</h2>
          </div>

          {/* Usage Guide - Accordion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📚 Usage Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {helpTopics.map((topic) => (
                  <AccordionItem key={topic.id} value={topic.id}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex items-center gap-2">
                        {topic.icon}
                        <span className="text-sm font-medium">{topic.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">{topic.content}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🚀 Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleVideoTutorial}>
                <ExternalLink className="h-4 w-4 mr-3" />
                Watch Video Tutorial
              </Button>

              <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleFeedback}>
                <MessageCircle className="h-4 w-4 mr-3" />
                Send Feedback
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => navigateToTab("profile")}
              >
                <ArrowRight className="h-4 w-4 mr-3" />
                View My Profile
              </Button>
            </CardContent>
          </Card>

          {/* Support Contact */}
          <Card className="text-center mt-6">
            <CardHeader>
              <CardTitle className="text-lg">📞 Need More Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">For any issues or questions, contact your supervisor:</p>

              <div className="space-y-3">
                <Button variant="default" className="w-full" onClick={handleCallSupport}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call Support: +91 98765 43210
                </Button>

                <Button variant="outline" className="w-full bg-transparent" onClick={handleWhatsAppSupport}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp Support
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">Support Hours: Monday to Saturday, 9:00 AM - 6:00 PM</p>
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6 text-center">
              <p className="text-xs text-muted-foreground">Bill Tracker App v1.0 • Field Staff Portal</p>
              <p className="text-xs text-muted-foreground mt-1">Built for efficient property delivery management</p>
            </CardContent>
          </Card>
        </div>
      </StaffLayout>
    </AuthGuard>
  )
}
