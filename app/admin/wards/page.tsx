"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, MapPin, Users, Building } from "lucide-react"

// Types for API data
interface Zone {
  _id: string
  corporateName: string
  wards: Ward[]
}

interface Ward {
  _id: string
  corporateName: string
  wardName: string
  mohallas: string[]
}

export default function WardsPage() {
  const { toast } = useToast()
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)

  // Section collapse states
  const [zonesOpen, setZonesOpen] = useState(true)
  const [wardsOpen, setWardsOpen] = useState(true)
  const [mohallasOpen, setMohallasOpen] = useState(true)

  // Form states
  const [newZoneName, setNewZoneName] = useState("")
  const [newWardName, setNewWardName] = useState("")
  const [selectedZoneForWard, setSelectedZoneForWard] = useState("")
  const [newMohallaName, setNewMohallaName] = useState("")
  const [selectedWardForMohalla, setSelectedWardForMohalla] = useState("")

  // Filter states
  const [wardZoneFilter, setWardZoneFilter] = useState("all")
  const [mohallaWardFilter, setMohallaWardFilter] = useState("all")

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const response = await apiService.getWards()
        
        // Group wards by corporate name (zones)
        const zoneMap = new Map<string, Zone>()
        response.forEach((ward: any) => {
          const zoneName = ward.corporateName
          if (!zoneMap.has(zoneName)) {
            zoneMap.set(zoneName, {
              _id: zoneName,
              corporateName: zoneName,
              wards: []
            })
          }
          zoneMap.get(zoneName)!.wards.push(ward)
        })
        
        setZones(Array.from(zoneMap.values()))
        
        toast({
          title: "Wards Loaded",
          description: `Loaded ${response.length} wards across ${zoneMap.size} zones.`,
        })
      } catch (error) {
        console.error('Error loading wards:', error)
        toast({
          title: "Error",
          description: "Failed to load wards data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Helper functions
  const getWardCount = (zoneName: string) => {
    const zone = zones.find(z => z.corporateName === zoneName)
    return zone ? zone.wards.length : 0
  }

  const getMohallaCount = (ward: Ward) => {
    return ward.mohallas.length
  }

  const addZone = () => {
    if (!newZoneName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a zone name.",
        variant: "destructive",
      })
      return
    }

    const newZone: Zone = {
      _id: newZoneName,
      corporateName: newZoneName,
      wards: []
    }

    setZones(prev => [...prev, newZone])
    setNewZoneName("")
    toast({
      title: "Zone Added",
      description: `Zone "${newZoneName}" has been added successfully.`,
    })
  }

  const addWard = () => {
    if (!newWardName.trim() || !selectedZoneForWard) {
      toast({
        title: "Error",
        description: "Please enter a ward name and select a zone.",
        variant: "destructive",
      })
      return
    }

    const newWard: Ward = {
      _id: `${selectedZoneForWard}-${newWardName}`,
      corporateName: selectedZoneForWard,
      wardName: newWardName,
      mohallas: []
    }

    setZones(prev => prev.map(zone => 
      zone.corporateName === selectedZoneForWard 
        ? { ...zone, wards: [...zone.wards, newWard] }
        : zone
    ))

    setNewWardName("")
    setSelectedZoneForWard("")
    toast({
      title: "Ward Added",
      description: `Ward "${newWardName}" has been added to "${selectedZoneForWard}".`,
    })
  }

  const addMohalla = () => {
    if (!newMohallaName.trim() || !selectedWardForMohalla) {
      toast({
        title: "Error",
        description: "Please enter a mohalla name and select a ward.",
        variant: "destructive",
      })
      return
    }

    setZones(prev => prev.map(zone => ({
      ...zone,
      wards: zone.wards.map(ward => 
        ward._id === selectedWardForMohalla
          ? { ...ward, mohallas: [...ward.mohallas, newMohallaName] }
          : ward
      )
    })))

    setNewMohallaName("")
    setSelectedWardForMohalla("")
    toast({
      title: "Mohalla Added",
      description: `Mohalla "${newMohallaName}" has been added successfully.`,
    })
  }

  const deleteZone = (zoneName: string) => {
    setZones(prev => prev.filter(zone => zone.corporateName !== zoneName))
    toast({
      title: "Zone Deleted",
      description: `Zone "${zoneName}" has been deleted.`,
    })
  }

  const deleteWard = (zoneName: string, wardName: string) => {
    setZones(prev => prev.map(zone => 
      zone.corporateName === zoneName
        ? { ...zone, wards: zone.wards.filter(ward => ward.wardName !== wardName) }
        : zone
    ))
    toast({
      title: "Ward Deleted",
      description: `Ward "${wardName}" has been deleted from "${zoneName}".`,
    })
  }

  const deleteMohalla = (wardId: string, mohallaName: string) => {
    setZones(prev => prev.map(zone => ({
      ...zone,
      wards: zone.wards.map(ward => 
        ward._id === wardId
          ? { ...ward, mohallas: ward.mohallas.filter(m => m !== mohallaName) }
          : ward
      )
    })))
    toast({
      title: "Mohalla Deleted",
      description: `Mohalla "${mohallaName}" has been deleted.`,
    })
  }

  // Get all wards for dropdown
  const allWards = zones.flatMap(zone => zone.wards)

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Wards & Zones Management</h1>
              <p className="text-muted-foreground">Manage zones, wards, and mohallas</p>
            </div>
          </div>

          {/* Zones Section */}
          <Card>
            <Collapsible open={zonesOpen} onOpenChange={setZonesOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Zones ({zones.length})
                    </CardTitle>
                    {zonesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {/* Add Zone Form */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter zone name"
                      value={newZoneName}
                      onChange={(e) => setNewZoneName(e.target.value)}
                    />
                    <Button onClick={addZone}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Zone
                    </Button>
                  </div>

                  {/* Zones Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zone Name</TableHead>
                        <TableHead>Wards Count</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {zones.map((zone) => (
                        <TableRow key={zone._id}>
                          <TableCell className="font-medium">{zone.corporateName}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{getWardCount(zone.corporateName)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteZone(zone.corporateName)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Wards Section */}
          <Card>
            <Collapsible open={wardsOpen} onOpenChange={setWardsOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Wards ({zones.flatMap(z => z.wards).length})
                    </CardTitle>
                    {wardsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {/* Add Ward Form */}
                  <div className="flex gap-2">
                    <Select value={selectedZoneForWard} onValueChange={setSelectedZoneForWard}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone._id} value={zone.corporateName}>
                            {zone.corporateName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Enter ward name"
                      value={newWardName}
                      onChange={(e) => setNewWardName(e.target.value)}
                    />
                    <Button onClick={addWard}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Ward
                    </Button>
                  </div>

                  {/* Wards Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zone</TableHead>
                        <TableHead>Ward Name</TableHead>
                        <TableHead>Mohallas Count</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {zones.flatMap(zone => zone.wards).map((ward) => (
                        <TableRow key={ward._id}>
                          <TableCell>{ward.corporateName}</TableCell>
                          <TableCell className="font-medium">{ward.wardName}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{getMohallaCount(ward)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteWard(ward.corporateName, ward.wardName)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Mohallas Section */}
          <Card>
            <Collapsible open={mohallasOpen} onOpenChange={setMohallasOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Mohallas ({zones.flatMap(z => z.wards).flatMap(w => w.mohallas).length})
                    </CardTitle>
                    {mohallasOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {/* Add Mohalla Form */}
                  <div className="flex gap-2">
                    <Select value={selectedWardForMohalla} onValueChange={setSelectedWardForMohalla}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select Ward" />
                      </SelectTrigger>
                      <SelectContent>
                        {allWards.map((ward) => (
                          <SelectItem key={ward._id} value={ward._id}>
                            {ward.corporateName} - {ward.wardName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Enter mohalla name"
                      value={newMohallaName}
                      onChange={(e) => setNewMohallaName(e.target.value)}
                    />
                    <Button onClick={addMohalla}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Mohalla
                    </Button>
                  </div>

                  {/* Mohallas Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zone</TableHead>
                        <TableHead>Ward</TableHead>
                        <TableHead>Mohalla Name</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {zones.flatMap(zone => zone.wards).flatMap(ward => 
                        ward.mohallas.map(mohalla => ({
                          zone: ward.corporateName,
                          ward: ward.wardName,
                          wardId: ward._id,
                          mohalla
                        }))
                      ).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.zone}</TableCell>
                          <TableCell>{item.ward}</TableCell>
                          <TableCell className="font-medium">{item.mohalla}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteMohalla(item.wardId, item.mohalla)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
