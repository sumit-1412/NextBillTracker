"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { StaffLayout } from "@/components/staff-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Camera,
  MapPin,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Home,
  FileText,
  User,
  Building,
  Navigation,
  Clock,
} from "lucide-react"
import { apiService } from "@/lib/api"

// Types for API data
interface Property {
  _id: string
  propertyId: string
  ward: {
    _id: string
    corporateName: string
    wardName: string
    mohallas: string[]
  }
  mohalla: string
  ownerName: string
  fatherName?: string
  address: string
  houseNo?: string
  mobileNo?: string
  propertyType?: string
  deliveryStatus: 'Pending' | 'Delivered' | 'Not Found'
}

// Updated interface to match new file format
interface PropertyData {
  sno: number
  property_id: string
  corporate_ward_no: string
  corporate_name: string
  ward: string
  corporate_mohalla: string
  property_type: string
  property_category: string
  owner_name: string
  house_no: string
  address: string
  popular_name: string
}

// Mock property data with new structure
const mockProperties: PropertyData[] = [
  {
    sno: 1,
    property_id: "092330530204384AN",
    corporate_ward_no: "53",
    corporate_name: "MANTOLA",
    ward: "Chatta",
    corporate_mohalla: "HING KI MANDI",
    property_type: "C",
    property_category: "",
    owner_name: "NITIN AGARWAL",
    house_no: "S/18/4/1-4",
    address: "8/4/1-4/8/26/2-7",
    popular_name: "Hing ki mandi",
  },
  {
    sno: 2,
    property_id: "092330530204384N",
    corporate_ward_no: "53",
    corporate_name: "MANTOLA",
    ward: "Chatta",
    corporate_mohalla: "HING KI MANDI",
    property_type: "C",
    property_category: "",
    owner_name: "SHALINI AGARWAL",
    house_no: "S/4/3-4",
    address: "8/4/1-4/8/26/2-7",
    popular_name: "Hing ki mandi",
  },
  {
    sno: 3,
    property_id: "NA181014",
    corporate_ward_no: "37",
    corporate_name: "NAGLA AJEETA",
    ward: "Loha Mandi",
    corporate_mohalla: "NAGLA AJEETA",
    property_type: "C",
    property_category: "",
    owner_name: "KENDRIY KARAGAR",
    house_no: "45/32K",
    address: "45/32K, Block - 45, Loha Mandi North",
    popular_name: "",
  },
  {
    sno: 4,
    property_id: "06/16/349/1",
    corporate_ward_no: "94",
    corporate_name: "BAGH FARJANA",
    ward: "Hari Parvat",
    corporate_mohalla: "KHANDARI ROAD",
    property_type: "C",
    property_category: "Degree College",
    owner_name: "BALWANT EDUCATI",
    house_no: "",
    address: "Mar-49 KHANDARI AGRA",
    popular_name: "",
  },
  {
    sno: 5,
    property_id: "73/04/261C",
    corporate_ward_no: "72",
    corporate_name: "NAGLA DEWATI",
    ward: "Taj Ganj",
    corporate_mohalla: "FATEHABAAD ROAD",
    property_type: "C",
    property_category: "Hotels up to 3 Star",
    owner_name: "HOTEL RAMADA PL",
    house_no: "43/261C/2",
    address: "FATEHABAAD ROAD TAJGANJ AGRA",
    popular_name: "HOTEL",
  },
]

// Corporate names and their corresponding wards/mohallas
const corporateData = {
  MANTOLA: {
    wards: ["Chatta"],
    mohallas: ["HING KI MANDI"],
  },
  "NAGLA AJEETA": {
    wards: ["Loha Mandi"],
    mohallas: ["NAGLA AJEETA"],
  },
  "BAGH FARJANA": {
    wards: ["Hari Parvat"],
    mohallas: ["KHANDARI ROAD"],
  },
  "NAGLA DEWATI": {
    wards: ["Taj Ganj"],
    mohallas: ["FATEHABAAD ROAD"],
  },
  EDGAH: {
    wards: ["Taj Ganj"],
    mohallas: ["EDGAH ROAD"],
  },
}

interface DeliveryFormData {
  // Property Information
  sno: string
  property_id: string
  corporate_ward_no: string
  corporate_name: string
  ward: string
  corporate_mohalla: string
  property_type: string
  property_category: string
  owner_name: string
  house_no: string
  address: string
  popular_name: string

  // Delivery Information
  delivery_status: "delivered" | "undelivered" | "locked"
  data_source: "owner" | "family" | "tenant"
  contact_name: string
  contact_mobile: string
  relationship: string
  mobile1: string
  mobile2: string
  paid: boolean
  remarks: string

  // Location & Photo
  photo: File | null
  gps_lat: string
  gps_lng: string
}

export default function StaffHome() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState<DeliveryFormData>({
    sno: "",
    property_id: "",
    corporate_ward_no: "",
    corporate_name: "",
    ward: "",
    corporate_mohalla: "",
    property_type: "",
    property_category: "",
    owner_name: "",
    house_no: "",
    address: "",
    popular_name: "",
    delivery_status: "delivered",
    data_source: "owner",
    contact_name: "",
    contact_mobile: "",
    relationship: "",
    mobile1: "",
    mobile2: "",
    paid: false,
    remarks: "",
    photo: null,
    gps_lat: "",
    gps_lng: "",
  })

  // UI state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<PropertyData[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [gpsLoading, setGpsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [filteredProperties, setFilteredProperties] = useState<PropertyData[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Load data from API
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true)
        const response = await apiService.getProperties()
        
        // Transform properties to match the expected format
        const transformedProperties = response.properties.map((property: Property, index: number) => ({
          sno: index + 1,
          property_id: property.propertyId,
          corporate_ward_no: property.ward.wardName,
          corporate_name: property.ward.corporateName,
          ward: property.ward.wardName,
          corporate_mohalla: property.mohalla,
          property_type: property.propertyType || "R",
          property_category: "",
          owner_name: property.ownerName,
          house_no: property.houseNo || "",
          address: property.address,
          popular_name: "",
        }))

        setProperties(transformedProperties)
        setFilteredProperties(transformedProperties)
      } catch (error) {
        console.error('Error loading properties:', error)
        toast({
          title: "Error",
          description: "Failed to load properties. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProperties()
  }, [toast])

  // Get current location
  const getCurrentLocation = () => {
    setGpsLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            gps_lat: position.coords.latitude.toFixed(6),
            gps_lng: position.coords.longitude.toFixed(6),
          }))
          setGpsLoading(false)
          toast({
            title: "Location Captured",
            description: "GPS coordinates have been recorded successfully.",
          })
        },
        (error) => {
          setGpsLoading(false)
          toast({
            title: "Location Error",
            description: "Unable to get your current location. Please enable GPS.",
            variant: "destructive",
          })
        },
      )
    } else {
      setGpsLoading(false)
      toast({
        title: "GPS Not Supported",
        description: "Your device doesn't support GPS location.",
        variant: "destructive",
      })
    }
  }

  // Auto-capture GPS on component mount
  useEffect(() => {
    getCurrentLocation()
  }, [])

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.search-container')) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Search properties with debouncing
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    if (query.length >= 3) {
      // Set loading state
      setSearchLoading(true)
      
      // Debounce the search
      const timeout = setTimeout(async () => {
        try {
          const response = await apiService.getProperties({ 
            search: query,
            limit: 20 // Limit results for better performance
          })
          
          // Transform properties to match the expected format
          const transformedResults = response.properties.map((property: Property, index: number) => ({
            sno: index + 1,
            property_id: property.propertyId,
            corporate_ward_no: property.ward.wardName,
            corporate_name: property.ward.corporateName,
            ward: property.ward.wardName,
            corporate_mohalla: property.mohalla,
            property_type: property.propertyType || "R",
            property_category: "",
            owner_name: property.ownerName,
            house_no: property.houseNo || "",
            address: property.address,
            popular_name: "",
          }))

          setSearchResults(transformedResults)
          setShowSearchResults(true)
        } catch (error) {
          console.error('Error searching properties:', error)
          toast({
            title: "Search Error",
            description: "Failed to search properties. Please try again.",
            variant: "destructive",
          })
        } finally {
          setSearchLoading(false)
        }
      }, 300) // 300ms debounce delay
      
      setSearchTimeout(timeout)
    } else {
      setShowSearchResults(false)
      setSearchLoading(false)
    }
  }

  // Select property from search results
  const selectProperty = (property: PropertyData) => {
    setFormData((prev) => ({
      ...prev,
      sno: property.sno.toString(),
      property_id: property.property_id,
      corporate_ward_no: property.corporate_ward_no,
      corporate_name: property.corporate_name,
      ward: property.ward,
      corporate_mohalla: property.corporate_mohalla,
      property_type: property.property_type,
      property_category: property.property_category,
      owner_name: property.owner_name,
      house_no: property.house_no,
      address: property.address,
      popular_name: property.popular_name,
    }))
    setShowSearchResults(false)
    setSearchQuery("")
    toast({
      title: "Property Selected",
      description: `Property ${property.property_id} has been loaded.`,
    })
  }

  // Get available wards based on corporate name
  const getAvailableWards = () => {
    if (!formData.corporate_name || !corporateData[formData.corporate_name as keyof typeof corporateData]) {
      return []
    }
    return corporateData[formData.corporate_name as keyof typeof corporateData].wards
  }

  // Get available mohallas based on corporate name
  const getAvailableMohallas = () => {
    if (!formData.corporate_name || !corporateData[formData.corporate_name as keyof typeof corporateData]) {
      return []
    }
    return corporateData[formData.corporate_name as keyof typeof corporateData].mohallas
  }

  // Handle form field changes
  const handleInputChange = (field: keyof DeliveryFormData, value: string | boolean | File | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }

    // Reset dependent fields when corporate name changes
    if (field === "corporate_name") {
      setFormData((prev) => ({
        ...prev,
        ward: "",
        corporate_mohalla: "",
      }))
    }
  }

  // Handle photo capture
  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please select a photo smaller than 10MB.",
          variant: "destructive",
        })
        return
      }
      setFormData((prev) => ({ ...prev, photo: file }))
      toast({
        title: "Photo Captured",
        description: "Delivery photo has been attached successfully.",
      })
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required property fields
    if (!formData.property_id.trim()) newErrors.property_id = "Property ID is required"
    if (!formData.corporate_name.trim()) newErrors.corporate_name = "Corporate Name is required"
    if (!formData.ward.trim()) newErrors.ward = "Ward is required"
    if (!formData.corporate_mohalla.trim()) newErrors.corporate_mohalla = "Corporate Mohalla is required"
    if (!formData.owner_name.trim()) newErrors.owner_name = "Owner Name is required"
    if (!formData.address.trim()) newErrors.address = "Address is required"

    // Required delivery fields
    if (!formData.mobile1.trim()) newErrors.mobile1 = "Primary mobile number is required"
    if (formData.mobile1 && !/^\d{10}$/.test(formData.mobile1)) {
      newErrors.mobile1 = "Mobile number must be 10 digits"
    }
    if (formData.mobile2 && !/^\d{10}$/.test(formData.mobile2)) {
      newErrors.mobile2 = "Mobile number must be 10 digits"
    }

    // Contact information for non-owner data sources
    if (formData.data_source !== "owner") {
      if (!formData.contact_name.trim()) newErrors.contact_name = "Contact name is required"
      if (!formData.contact_mobile.trim()) newErrors.contact_mobile = "Contact mobile is required"
      if (formData.contact_mobile && !/^\d{10}$/.test(formData.contact_mobile)) {
        newErrors.contact_mobile = "Contact mobile must be 10 digits"
      }
      if (!formData.relationship.trim()) newErrors.relationship = "Relationship is required"
    }

    // Photo and GPS validation
    if (!formData.photo) newErrors.photo = "Delivery photo is required"
    if (!formData.gps_lat || !formData.gps_lng) newErrors.gps = "GPS location is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // First, upload the photo if it exists
      let photoUrl = ""
      if (formData.photo) {
        try {
          const photoResponse = await apiService.uploadDeliveryPhoto(formData.photo)
          photoUrl = photoResponse.photoUrl
        } catch (photoError) {
          console.error('Photo upload error:', photoError)
          toast({
            title: "Photo Upload Error",
            description: "Failed to upload photo. Please try again.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      // Find the property ID from the backend
      const propertyResponse = await apiService.getProperties({ 
        search: formData.property_id,
        limit: 1
      })
      
      if (propertyResponse.properties.length === 0) {
        throw new Error("Property not found")
      }

      const property = propertyResponse.properties[0]

      // Prepare delivery data
      const deliveryData = {
        property: property._id,
        dataSource: formData.data_source,
        receiverName: formData.data_source !== "owner" ? formData.contact_name : undefined,
        receiverMobile: formData.data_source !== "owner" ? formData.contact_mobile : formData.mobile1,
        photoUrl: photoUrl,
        location: {
          type: "Point",
          coordinates: [parseFloat(formData.gps_lng), parseFloat(formData.gps_lat)] // [longitude, latitude]
        },
        remarks: formData.remarks || undefined
      }

      // Create delivery
      const delivery = await apiService.createDelivery(deliveryData)

      toast({
        title: "Delivery Submitted Successfully!",
        description: `Property ${formData.property_id} delivery has been recorded.`,
      })

      // Reset form
      resetForm()
    } catch (error) {
      console.error('Submission error:', error)
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "Failed to submit delivery. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      sno: "",
      property_id: "",
      corporate_ward_no: "",
      corporate_name: "",
      ward: "",
      corporate_mohalla: "",
      property_type: "",
      property_category: "",
      owner_name: "",
      house_no: "",
      address: "",
      popular_name: "",
      delivery_status: "delivered",
      data_source: "owner",
      contact_name: "",
      contact_mobile: "",
      relationship: "",
      mobile1: "",
      mobile2: "",
      paid: false,
      remarks: "",
      photo: null,
      gps_lat: "",
      gps_lng: "",
    })
    setErrors({})
    setSearchQuery("")
    setShowSearchResults(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    getCurrentLocation() // Re-capture GPS for new form
  }

  return (
    <AuthGuard allowedRoles={["staff"]}>
      <StaffLayout>
        <div className="p-4 space-y-4 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Property Delivery Form</h1>
            <p className="text-muted-foreground">Record property delivery information</p>
          </div>

          {/* Property Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Property
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative search-container">
                <div className="relative">
                  <Input
                    placeholder="Search by Property ID, Owner Name, Address, or House No..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pr-10"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {searchLoading ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                        Searching properties...
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((property) => (
                        <div
                          key={property.property_id}
                          className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                          onClick={() => selectProperty(property)}
                        >
                          <div className="font-medium">{property.property_id}</div>
                          <div className="text-sm text-muted-foreground">{property.owner_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {property.corporate_name} • {property.ward} • {property.address}
                          </div>
                        </div>
                      ))
                    ) : searchQuery.length >= 3 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No properties found matching "{searchQuery}"
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sno">Serial Number</Label>
                  <Input
                    id="sno"
                    value={formData.sno}
                    onChange={(e) => handleInputChange("sno", e.target.value)}
                    placeholder="Enter serial number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="property_id">
                    Property ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="property_id"
                    value={formData.property_id}
                    onChange={(e) => handleInputChange("property_id", e.target.value)}
                    placeholder="Enter property ID"
                    className={errors.property_id ? "border-red-500" : ""}
                  />
                  {errors.property_id && <p className="text-red-500 text-sm">{errors.property_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="corporate_ward_no">Corporate Ward No.</Label>
                  <Input
                    id="corporate_ward_no"
                    value={formData.corporate_ward_no}
                    onChange={(e) => handleInputChange("corporate_ward_no", e.target.value)}
                    placeholder="Enter corporate ward number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="corporate_name">
                    Corporate Name <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.corporate_name}
                    onValueChange={(value) => handleInputChange("corporate_name", value)}
                  >
                    <SelectTrigger className={errors.corporate_name ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select corporate name" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(corporateData).map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.corporate_name && <p className="text-red-500 text-sm">{errors.corporate_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ward">
                    Ward <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.ward}
                    onValueChange={(value) => handleInputChange("ward", value)}
                    disabled={!formData.corporate_name}
                  >
                    <SelectTrigger className={errors.ward ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableWards().map((ward) => (
                        <SelectItem key={ward} value={ward}>
                          {ward}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.ward && <p className="text-red-500 text-sm">{errors.ward}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="corporate_mohalla">
                    Corporate Mohalla <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.corporate_mohalla}
                    onValueChange={(value) => handleInputChange("corporate_mohalla", value)}
                    disabled={!formData.corporate_name}
                  >
                    <SelectTrigger className={errors.corporate_mohalla ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select mohalla" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableMohallas().map((mohalla) => (
                        <SelectItem key={mohalla} value={mohalla}>
                          {mohalla}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.corporate_mohalla && <p className="text-red-500 text-sm">{errors.corporate_mohalla}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="property_type">Property Type</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) => handleInputChange("property_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="Multi">Multi</SelectItem>
                      <SelectItem value="Mix">Mix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="property_category">Property Category</Label>
                  <Input
                    id="property_category"
                    value={formData.property_category}
                    onChange={(e) => handleInputChange("property_category", e.target.value)}
                    placeholder="Enter property category"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_name">
                    Owner Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="owner_name"
                    value={formData.owner_name}
                    onChange={(e) => handleInputChange("owner_name", e.target.value)}
                    placeholder="Enter owner name"
                    className={errors.owner_name ? "border-red-500" : ""}
                  />
                  {errors.owner_name && <p className="text-red-500 text-sm">{errors.owner_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="house_no">House No.</Label>
                  <Input
                    id="house_no"
                    value={formData.house_no}
                    onChange={(e) => handleInputChange("house_no", e.target.value)}
                    placeholder="Enter house number"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Enter complete address"
                    className={errors.address ? "border-red-500" : ""}
                    rows={2}
                  />
                  {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="popular_name">Popular Name</Label>
                  <Input
                    id="popular_name"
                    value={formData.popular_name}
                    onChange={(e) => handleInputChange("popular_name", e.target.value)}
                    placeholder="Enter popular name (if any)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_status">Delivery Status</Label>
                  <Select
                    value={formData.delivery_status}
                    onValueChange={(value) => handleInputChange("delivery_status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="undelivered">Undelivered</SelectItem>
                      <SelectItem value="locked">Locked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_source">Data Source</Label>
                  <Select
                    value={formData.data_source}
                    onValueChange={(value) => handleInputChange("data_source", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Owner
                        </div>
                      </SelectItem>
                      <SelectItem value="family">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Family Member
                        </div>
                      </SelectItem>
                      <SelectItem value="tenant">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Tenant
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.data_source !== "owner" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="contact_name">
                        Contact Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contact_name"
                        value={formData.contact_name}
                        onChange={(e) => handleInputChange("contact_name", e.target.value)}
                        placeholder="Enter contact person name"
                        className={errors.contact_name ? "border-red-500" : ""}
                      />
                      {errors.contact_name && <p className="text-red-500 text-sm">{errors.contact_name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_mobile">
                        Contact Mobile <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contact_mobile"
                        value={formData.contact_mobile}
                        onChange={(e) => handleInputChange("contact_mobile", e.target.value)}
                        placeholder="Enter contact mobile number"
                        className={errors.contact_mobile ? "border-red-500" : ""}
                        maxLength={10}
                      />
                      {errors.contact_mobile && <p className="text-red-500 text-sm">{errors.contact_mobile}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="relationship">
                        Relationship <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.relationship}
                        onValueChange={(value) => handleInputChange("relationship", value)}
                      >
                        <SelectTrigger className={errors.relationship ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Father">Father</SelectItem>
                          <SelectItem value="Mother">Mother</SelectItem>
                          <SelectItem value="Wife">Wife</SelectItem>
                          <SelectItem value="Husband">Husband</SelectItem>
                          <SelectItem value="Son">Son</SelectItem>
                          <SelectItem value="Daughter">Daughter</SelectItem>
                          <SelectItem value="Brother">Brother</SelectItem>
                          <SelectItem value="Sister">Sister</SelectItem>
                          <SelectItem value="Tenant">Tenant</SelectItem>
                          <SelectItem value="Caretaker">Caretaker</SelectItem>
                          <SelectItem value="Security">Security</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.relationship && <p className="text-red-500 text-sm">{errors.relationship}</p>}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="mobile1">
                    Primary Mobile <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mobile1"
                    value={formData.mobile1}
                    onChange={(e) => handleInputChange("mobile1", e.target.value)}
                    placeholder="Enter primary mobile number"
                    className={errors.mobile1 ? "border-red-500" : ""}
                    maxLength={10}
                  />
                  {errors.mobile1 && <p className="text-red-500 text-sm">{errors.mobile1}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile2">Secondary Mobile</Label>
                  <Input
                    id="mobile2"
                    value={formData.mobile2}
                    onChange={(e) => handleInputChange("mobile2", e.target.value)}
                    placeholder="Enter secondary mobile number"
                    className={errors.mobile2 ? "border-red-500" : ""}
                    maxLength={10}
                  />
                  {errors.mobile2 && <p className="text-red-500 text-sm">{errors.mobile2}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch checked={formData.paid} onCheckedChange={(checked) => handleInputChange("paid", checked)} />
                    <span className="text-sm">{formData.paid ? "Paid" : "Unpaid"}</span>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => handleInputChange("remarks", e.target.value)}
                    placeholder="Enter any additional remarks or notes"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photo & Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photo & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="photo">
                    Delivery Photo <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoCapture}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full ${errors.photo ? "border-red-500" : ""}`}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {formData.photo ? "Change Photo" : "Take Photo"}
                    </Button>
                    {formData.photo && (
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Photo captured: {formData.photo.name}
                      </div>
                    )}
                    {errors.photo && <p className="text-red-500 text-sm">{errors.photo}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    GPS Location <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      disabled={gpsLoading}
                      className="w-full bg-transparent"
                    >
                      {gpsLoading ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4 mr-2" />
                          {formData.gps_lat && formData.gps_lng ? "Update Location" : "Get Location"}
                        </>
                      )}
                    </Button>
                    {formData.gps_lat && formData.gps_lng && (
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location: {formData.gps_lat}, {formData.gps_lng}
                      </div>
                    )}
                    {errors.gps && <p className="text-red-500 text-sm">{errors.gps}</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-4">
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Submit Delivery
                </>
              )}
            </Button>
            <Button variant="outline" onClick={resetForm} disabled={isSubmitting} className="flex-1 bg-transparent">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Form
            </Button>
          </div>

          {/* Validation Summary */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please fix the following errors before submitting:
                <ul className="list-disc list-inside mt-2">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </StaffLayout>
    </AuthGuard>
  )
}
