"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { apiService } from "@/lib/api"
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Trash2,
  Eye,
  Loader2,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react"

interface UploadRecord {
  _id: string
  filename: string
  uploadedBy: string
  total: number
  success: number
  failed: number
  duplicate: number
  timestamp: string
  status: "Success" | "Partial" | "Failed"
  errors?: string[]
}

interface UploadSummary {
  total: number
  success: number
  duplicate: number
  failed: number
}

export default function AdminUploads() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUpload, setSelectedUpload] = useState<UploadRecord | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load upload history on component mount
  useEffect(() => {
    loadUploadHistory()
  }, [])

  const loadUploadHistory = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getUploadHistory()
      setUploadHistory(response.uploads)
    } catch (error) {
      console.error('Error loading upload history:', error)
      toast.error("Failed to load upload history")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]
      if (validTypes.includes(file.type) || file.name.endsWith(".csv") || file.name.endsWith(".xlsx")) {
        setSelectedFile(file)
        toast.success(`File "${file.name}" selected successfully`)
      } else {
        toast.error("Please select a valid CSV or Excel file")
        setSelectedFile(null)
      }
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]
      if (validTypes.includes(file.type) || file.name.endsWith(".csv") || file.name.endsWith(".xlsx")) {
        setSelectedFile(file)
        toast.success(`File "${file.name}" selected successfully`)
      } else {
        toast.error("Please select a valid CSV or Excel file")
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    toast.info("Processing file upload...")

    try {
      const response = await apiService.uploadProperties(selectedFile)
      
      setUploadSummary(response.summary)
      setShowSummary(true)
      
      // Reload upload history
      await loadUploadHistory()

      if (response.summary.status === 'Success') {
        toast.success("File uploaded successfully!")
      } else if (response.summary.status === 'Failed') {
        toast.error("Upload failed - please check your file format")
      } else {
        toast.warning("Upload completed with some errors")
      }

      // Reset file selection
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadErrors = (upload: UploadRecord) => {
    if (upload.errors && upload.errors.length > 0) {
      // Create and download error CSV
      const csvContent = "Row,Error\n" + upload.errors.map((error, index) => `${index + 1},"${error}"`).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${upload.filename.replace(/\.[^/.]+$/, '')}_errors.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success("Error report downloaded successfully")
    } else {
      toast.info("No errors to download")
    }
  }

  const handleViewSummary = (upload: UploadRecord) => {
    setSelectedUpload(upload)
  }

  const handleDeleteUpload = async (uploadId: string) => {
    try {
      await apiService.deleteUploadRecord(uploadId)
      setUploadHistory((prev) => prev.filter((upload) => upload._id !== uploadId))
      setShowDeleteDialog(null)
      toast.success("Upload record deleted successfully")
    } catch (error) {
      console.error('Delete error:', error)
      toast.error("Failed to delete upload record")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Success
          </Badge>
        )
      case "Partial":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Partial
          </Badge>
        )
      case "Failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="p-4 space-y-6 bg-background text-foreground">
          {/* Page Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Upload Master Data</h1>
            <p className="text-muted-foreground">Upload property master files and manage bulk data imports</p>
          </div>

          {/* Section 1: File Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Master Property File
              </CardTitle>
              <CardDescription>Upload CSV or Excel files containing property master data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select File</Label>
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Drag and drop your file here, or click to browse</p>
                      <Input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mt-2">
                        Browse Files
                      </Button>
                    </div>
                  </div>
                  {selectedFile && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </div>
                <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full sm:w-auto">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Upload Result Summary */}
          {showSummary && uploadSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Upload Result Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Total Records:</span>
                    <Badge variant="outline">{uploadSummary.total}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Successfully Imported:</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {uploadSummary.success} ✅
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Duplicate Entries:</span>
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      {uploadSummary.duplicate} 🟡
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Invalid Rows:</span>
                    <Badge variant="destructive">{uploadSummary.failed} ❌</Badge>
                  </div>
                </div>
                {uploadSummary.failed > 0 && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => toast.info("Downloading error CSV...")}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Error CSV
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Section 3: Upload History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
              <CardDescription>View and manage previous file uploads</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : uploadHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No uploads yet</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filename</TableHead>
                        <TableHead>Uploaded By</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Success/Failed/Duplicate</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadHistory.map((upload) => (
                        <TableRow key={upload._id}>
                          <TableCell className="font-medium">{upload.filename}</TableCell>
                          <TableCell>{upload.uploadedBy}</TableCell>
                          <TableCell>{upload.total}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 text-xs">
                              <span className="text-green-600">{upload.success}</span>
                              <span>/</span>
                              <span className="text-red-600">{upload.failed}</span>
                              <span>/</span>
                              <span className="text-yellow-600">{upload.duplicate}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{upload.timestamp}</TableCell>
                          <TableCell>{getStatusBadge(upload.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleViewSummary(upload)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {upload.failed > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => handleDownloadErrors(upload)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(upload._id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 4: Schema Expectation Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                File Format Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="schema">
                  <AccordionTrigger>Expected Columns Format</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Required Fields (in exact order):</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">A</span>
                              <code>S.No</code> - Serial Number
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">B</span>
                              <code>Property ID</code> - Unique identifier (mandatory)
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">C</span>
                              <code>Corporate Ward No.</code> - Corporate ward number
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">D</span>
                              <code>Corporate Name</code> - Corporate entity name
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">E</span>
                              <code>Ward</code> - Administrative ward
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">F</span>
                              <code>Corporate Mohalla</code> - Corporate mohalla name
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">G</span>
                              <code>Property Type</code> - Type of property
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">H</span>
                              <code>Property Category</code> - Category classification
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">I</span>
                              <code>Owner Name</code> - Property owner name
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">J</span>
                              <code>House No.</code> - House/building number
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">K</span>
                              <code>Address</code> - Complete address
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-muted px-2 py-1 rounded text-xs">L</span>
                              <code>Popular Name</code> - Popular/known name (optional)
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Sample Data Format:</h4>
                        <div className="bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto">
                          <div className="grid grid-cols-12 gap-1 mb-2 font-bold">
                            <span>S.No</span>
                            <span>Property ID</span>
                            <span>Corp Ward</span>
                            <span>Corp Name</span>
                            <span>Ward</span>
                            <span>Corp Mohalla</span>
                            <span>Prop Type</span>
                            <span>Prop Category</span>
                            <span>Owner Name</span>
                            <span>House No</span>
                            <span>Address</span>
                            <span>Popular Name</span>
                          </div>
                          <div className="grid grid-cols-12 gap-1 text-muted-foreground">
                            <span>1</span>
                            <span>092330530...</span>
                            <span>53</span>
                            <span>MANTOLA</span>
                            <span>Chatta</span>
                            <span>HING KI MANDI</span>
                            <span>C</span>
                            <span></span>
                            <span>NITIN AGARWAL</span>
                            <span>S/18/4/1-4</span>
                            <span>8/4/1-4/8/26/2-7</span>
                            <span>Hing ki mandi</span>
                          </div>
                        </div>
                      </div>

                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Important:</strong> The file must contain all columns in the exact order shown above.
                          Missing columns or incorrect order will result in import errors. Property ID must be unique
                          across all records.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* View Summary Dialog */}
          <Dialog open={!!selectedUpload} onOpenChange={() => setSelectedUpload(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Summary</DialogTitle>
                <DialogDescription>Detailed information about the upload</DialogDescription>
              </DialogHeader>
              {selectedUpload && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Filename:</span>
                      <p className="text-muted-foreground">{selectedUpload.filename}</p>
                    </div>
                    <div>
                      <span className="font-medium">Uploaded By:</span>
                      <p className="text-muted-foreground">{selectedUpload.uploadedBy}</p>
                    </div>
                    <div>
                      <span className="font-medium">Total Records:</span>
                      <p className="text-muted-foreground">{selectedUpload.total}</p>
                    </div>
                    <div>
                      <span className="font-medium">Timestamp:</span>
                      <p className="text-muted-foreground">{selectedUpload.timestamp}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                      <div className="text-2xl font-bold text-green-600">{selectedUpload.success}</div>
                      <div className="text-xs text-green-600">Success</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                      <div className="text-2xl font-bold text-yellow-600">{selectedUpload.duplicate}</div>
                      <div className="text-xs text-yellow-600">Duplicates</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                      <div className="text-2xl font-bold text-red-600">{selectedUpload.failed}</div>
                      <div className="text-xs text-red-600">Failed</div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Upload Record</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this upload record? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => showDeleteDialog && handleDeleteUpload(showDeleteDialog)}>
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
