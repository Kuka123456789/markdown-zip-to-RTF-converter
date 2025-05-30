"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, FileText, Download, CheckCircle, Search, Filter, Eye, ChevronUp, ArrowUpDown } from "lucide-react"
import JSZip from "jszip"

interface MarkdownFile {
  name: string
  content: string
  size: number
  path: string
  selected: boolean
}

type SortOption = "name" | "size" | "path"
type SortDirection = "asc" | "desc"

export default function MarkdownToRTFConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [markdownFiles, setMarkdownFiles] = useState<MarkdownFile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [previewFile, setPreviewFile] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [customFilename, setCustomFilename] = useState("combined-markdown")
  const [enableOptimization, setEnableOptimization] = useState(true)
  const [optimizationStats, setOptimizationStats] = useState<{
    originalSize: number
    optimizedSize: number
    reduction: number
  } | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/zip") {
      setFile(selectedFile)
      setError(null)
      setResult(null)
      setMarkdownFiles([])
    } else {
      setError("Please select a valid ZIP file")
      setFile(null)
    }
  }

  const extractFiles = async () => {
    if (!file) return

    setIsExtracting(true)
    setError(null)

    try {
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(file)

      const mdFiles: MarkdownFile[] = []
      const fileNames = Object.keys(zipContent.files).filter(
        (name) => name.endsWith(".md") && !zipContent.files[name].dir,
      )

      if (fileNames.length === 0) {
        throw new Error("No Markdown files found in the ZIP archive")
      }

      for (let i = 0; i < fileNames.length; i++) {
        const fileName = fileNames[i]
        const fileContent = await zipContent.files[fileName].async("text")
        const fileSize = new Blob([fileContent]).size

        mdFiles.push({
          name: fileName.replace(/^.*\//, "").replace(".md", ""),
          content: fileContent,
          size: fileSize,
          path: fileName,
          selected: true, // Default to selected
        })

        setProgress(((i + 1) / fileNames.length) * 100)
      }

      setMarkdownFiles(mdFiles)
      setProgress(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while extracting files")
    } finally {
      setIsExtracting(false)
    }
  }

  const filteredAndSortedFiles = useMemo(() => {
    const filtered = markdownFiles.filter(
      (file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.path.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "size":
          comparison = a.size - b.size
          break
        case "path":
          comparison = a.path.localeCompare(b.path)
          break
      }
      return sortDirection === "asc" ? comparison : -comparison
    })

    return filtered
  }, [markdownFiles, searchTerm, sortBy, sortDirection])

  const selectedFiles = markdownFiles.filter((file) => file.selected)

  const toggleFileSelection = (index: number) => {
    const updatedFiles = [...markdownFiles]
    const fileIndex = markdownFiles.findIndex((f) => f.path === filteredAndSortedFiles[index].path)
    updatedFiles[fileIndex].selected = !updatedFiles[fileIndex].selected
    setMarkdownFiles(updatedFiles)
  }

  const selectAll = () => {
    const updatedFiles = markdownFiles.map((file) => ({ ...file, selected: true }))
    setMarkdownFiles(updatedFiles)
  }

  const selectNone = () => {
    const updatedFiles = markdownFiles.map((file) => ({ ...file, selected: false }))
    setMarkdownFiles(updatedFiles)
  }

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(option)
      setSortDirection("asc")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const optimizeRTFContent = (rtfContent: string): { optimized: string; stats: any } => {
    const originalSize = new Blob([rtfContent]).size

    let optimized = rtfContent

    // 1. Remove excessive whitespace and empty paragraphs
    optimized = optimized.replace(/\\par\\par\\par+/g, "\\par\\par") // Max 2 consecutive paragraph breaks
    optimized = optimized.replace(/\s+/g, " ") // Normalize whitespace
    optimized = optimized.replace(/\\par\s+/g, "\\par") // Remove spaces after paragraph breaks

    // 2. Optimize RTF control words - use shorter equivalents
    optimized = optimized.replace(/\\paragraph/g, "\\par")
    optimized = optimized.replace(/\\line/g, "\\par")

    // 3. Remove redundant formatting resets
    optimized = optimized.replace(/\\plain\\plain/g, "\\plain")
    optimized = optimized.replace(/\\b\\b0\\b/g, "\\b")

    // 4. Optimize font switching - avoid unnecessary font changes
    optimized = optimized.replace(/\\f0\\f0/g, "\\f0")
    optimized = optimized.replace(/\\f1\\f1/g, "\\f1")

    // 5. Compress repeated paragraph formatting
    optimized = optimized.replace(/(\\par){3,}/g, "\\par\\par")

    // 6. Remove trailing spaces before RTF control words
    optimized = optimized.replace(/\s+\\/g, "\\")

    // 7. Optimize bullet points - use more efficient RTF
    optimized = optimized.replace(/\\bullet\s+/g, "\\bullet ")

    // 8. Remove empty formatting groups
    optimized = optimized.replace(/\{\}/g, "")
    optimized = optimized.replace(/\{\\[^}]*\}/g, (match) => {
      // Keep only non-empty formatting groups
      const content = match.slice(1, -1).replace(/^\\[^\\s]+\s*/, "")
      return content.trim() ? match : ""
    })

    // 9. Optimize font size declarations - remove redundant ones
    optimized = optimized.replace(/(\\fs\d+)(\\fs\d+)/g, "$2")

    // 10. Final cleanup
    optimized = optimized.replace(/\s+}/g, "}") // Remove spaces before closing braces
    optimized = optimized.replace(/{\s+/g, "{") // Remove spaces after opening braces

    const optimizedSize = new Blob([optimized]).size
    const reduction = ((originalSize - optimizedSize) / originalSize) * 100

    return {
      optimized,
      stats: {
        originalSize,
        optimizedSize,
        reduction: Math.round(reduction * 100) / 100,
      },
    }
  }

  const deduplicateContent = (files: MarkdownFile[]): MarkdownFile[] => {
    // Simple deduplication - remove files with identical content
    const seen = new Set<string>()
    return files.filter((file) => {
      const contentHash = file.content.trim()
      if (seen.has(contentHash)) {
        return false
      }
      seen.add(contentHash)
      return true
    })
  }

  const optimizeMarkdownContent = (content: string): string => {
    // Remove excessive empty lines (more than 2 consecutive)
    content = content.replace(/\n\n\n+/g, "\n\n")

    // Remove trailing whitespace from lines
    content = content.replace(/[ \t]+$/gm, "")

    // Remove excessive spaces in text (but preserve code blocks)
    const lines = content.split("\n")
    const optimizedLines = lines.map((line) => {
      // Don't optimize code blocks
      if (line.trim().startsWith("```") || line.trim().startsWith("    ")) {
        return line
      }
      // Normalize multiple spaces to single space
      return line.replace(/\s+/g, " ")
    })

    return optimizedLines.join("\n").trim()
  }

  const markdownToRTF = (markdown: string, title = ""): string => {
    let rtf = ""

    if (title) {
      rtf += `{\\b\\fs28 ${title}}\\par\\par`
    }

    const lines = markdown.split("\n")

    for (let line of lines) {
      line = line.trim()

      if (line.startsWith("# ")) {
        rtf += `{\\b\\fs24 ${line.substring(2)}}\\par\\par`
      } else if (line.startsWith("## ")) {
        rtf += `{\\b\\fs20 ${line.substring(3)}}\\par\\par`
      } else if (line.startsWith("### ")) {
        rtf += `{\\b\\fs18 ${line.substring(4)}}\\par\\par`
      } else if (line.includes("**")) {
        line = line.replace(/\*\*(.*?)\*\*/g, "{\\b $1}")
        rtf += `${line}\\par`
      } else if (line.includes("*")) {
        line = line.replace(/\*(.*?)\*/g, "{\\i $1}")
        rtf += `${line}\\par`
      } else if (line.startsWith("```")) {
        rtf += `{\\f1\\fs16 ${line}}\\par`
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        rtf += `\\bullet ${line.substring(2)}\\par`
      } else if (/^\d+\.\s/.test(line)) {
        rtf += `${line}\\par`
      } else if (line === "") {
        rtf += "\\par"
      } else {
        rtf += `${line}\\par`
      }
    }

    return rtf + "\\par\\par"
  }

  const processSelectedFiles = async () => {
    let filesToProcess = markdownFiles.filter((file) => file.selected)

    if (filesToProcess.length === 0) {
      setError("Please select at least one file to convert")
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      // Apply content optimization if enabled
      if (enableOptimization) {
        // Remove duplicate files
        const originalCount = filesToProcess.length
        filesToProcess = deduplicateContent(filesToProcess)

        if (filesToProcess.length < originalCount) {
          console.log(`Removed ${originalCount - filesToProcess.length} duplicate files`)
        }

        // Optimize markdown content
        filesToProcess = filesToProcess.map((file) => ({
          ...file,
          content: optimizeMarkdownContent(file.content),
        }))
      }

      let rtfContent = "{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}{\\f1 Courier New;}}\\f0\\fs24"

      rtfContent += "{\\b\\fs32 Combined Markdown Document}\\par\\par"
      rtfContent += `{\\i Generated from ${filesToProcess.length} selected markdown files}\\par\\par\\par`

      for (let i = 0; i < filesToProcess.length; i++) {
        const { name, content } = filesToProcess[i]
        rtfContent += markdownToRTF(content, name)
        if (i < filesToProcess.length - 1) {
          rtfContent += "\\page"
        }
        setProgress(((i + 1) / filesToProcess.length) * 90) // Leave 10% for optimization
      }

      rtfContent += "}"

      // Apply RTF optimization if enabled
      if (enableOptimization) {
        const { optimized, stats } = optimizeRTFContent(rtfContent)
        rtfContent = optimized
        setOptimizationStats(stats)
        setProgress(100)
      } else {
        setOptimizationStats(null)
        setProgress(100)
      }

      setResult(rtfContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while processing the files")
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadRTF = () => {
    if (!result) return

    // Sanitize filename and ensure .rtf extension
    const sanitizeFilename = (filename: string) => {
      // Remove invalid characters and trim
      let sanitized = filename.replace(/[<>:"/\\|?*]/g, "").trim()

      // If empty, use default
      if (!sanitized) {
        sanitized = "combined-markdown"
      }

      // Add .rtf extension if not present
      if (!sanitized.toLowerCase().endsWith(".rtf")) {
        sanitized += ".rtf"
      }

      return sanitized
    }

    const filename = sanitizeFilename(customFilename)

    const blob = new Blob([result], { type: "application/rtf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetApp = () => {
    setFile(null)
    setMarkdownFiles([])
    setResult(null)
    setError(null)
    setSearchTerm("")
    setPreviewFile(null)
    setShowPreview(false)
    setCustomFilename("combined-markdown")
    setEnableOptimization(true)
    setOptimizationStats(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Markdown to RTF Converter</h1>
          <p className="text-lg text-gray-600">
            Upload a ZIP file with Markdown files and convert selected ones to a single RTF document
          </p>
        </div>

        {/* Upload Section */}
        {!markdownFiles.length && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload ZIP File
              </CardTitle>
              <CardDescription>Select a ZIP file containing one or more Markdown (.md) files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zip-file">ZIP File</Label>
                <Input id="zip-file" type="file" accept=".zip" onChange={handleFileChange} disabled={isExtracting} />
              </div>

              {file && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={extractFiles} disabled={!file || isExtracting} className="w-full">
                {isExtracting ? "Extracting Files..." : "Extract and Preview Files"}
              </Button>

              {isExtracting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Extracting markdown files...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* File Selection Section */}
        {markdownFiles.length > 0 && !result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Select Files to Convert
                      </CardTitle>
                      <CardDescription>
                        {selectedFiles.length} of {markdownFiles.length} files selected
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={selectAll}>
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={selectNone}>
                        Select None
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and Sort Controls */}
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSort("name")}
                        className="flex items-center gap-1"
                      >
                        Name
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSort("size")}
                        className="flex items-center gap-1"
                      >
                        Size
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Filename Input */}
                  <div className="space-y-2">
                    <Label htmlFor="filename">Output Filename</Label>
                    <div className="flex gap-2">
                      <Input
                        id="filename"
                        placeholder="Enter filename..."
                        value={customFilename}
                        onChange={(e) => setCustomFilename(e.target.value)}
                        className="flex-1"
                      />
                      <div className="flex items-center px-3 py-2 bg-gray-100 border rounded-md text-sm text-gray-600">
                        .rtf
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      The filename will be sanitized and .rtf extension will be added automatically
                    </p>
                  </div>

                  {/* Optimization Settings */}
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="optimization"
                        checked={enableOptimization}
                        onCheckedChange={setEnableOptimization}
                      />
                      <Label htmlFor="optimization" className="text-sm font-medium">
                        Enable file size optimization
                      </Label>
                    </div>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p>• Removes duplicate content and excessive whitespace</p>
                      <p>• Optimizes RTF formatting codes for smaller file size</p>
                      <p>• Preserves all valuable content and formatting</p>
                    </div>
                  </div>

                  {/* File List */}
                  <ScrollArea className="h-96 w-full border rounded-md">
                    <div className="p-4 space-y-2">
                      {filteredAndSortedFiles.map((file, index) => (
                        <div
                          key={file.path}
                          className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox checked={file.selected} onCheckedChange={() => toggleFileSelection(index)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <Badge variant="secondary" className="text-xs">
                                {formatFileSize(file.size)}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{file.path}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPreviewFile(file.content)
                              setShowPreview(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="flex justify-between items-center pt-4">
                    <Button variant="outline" onClick={resetApp}>
                      Upload Different File
                    </Button>
                    <Button
                      onClick={processSelectedFiles}
                      disabled={selectedFiles.length === 0 || isProcessing}
                      className="min-w-32"
                    >
                      {isProcessing ? "Converting..." : `Convert ${selectedFiles.length} Files`}
                    </Button>
                  </div>

                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Converting selected files to RTF...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-1">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">File Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {showPreview && previewFile ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Content Preview</span>
                        <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                      </div>
                      <ScrollArea className="h-64 w-full border rounded p-3">
                        <pre className="text-xs whitespace-pre-wrap text-gray-700">
                          {previewFile.substring(0, 1000)}
                          {previewFile.length > 1000 && "..."}
                        </pre>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Click the eye icon next to any file to preview its content</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Success Section */}
        {result && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Conversion Complete!</span>
              </div>
              <p className="text-sm text-green-600">
                Successfully converted {selectedFiles.length} markdown files to RTF format.
              </p>

              {/* Optimization Stats */}
              {optimizationStats && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Optimization Results:</h4>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-green-600">Original:</span>
                      <p className="font-medium">{(optimizationStats.originalSize / 1024).toFixed(1)} KB</p>
                    </div>
                    <div>
                      <span className="text-green-600">Optimized:</span>
                      <p className="font-medium">{(optimizationStats.optimizedSize / 1024).toFixed(1)} KB</p>
                    </div>
                    <div>
                      <span className="text-green-600">Reduced by:</span>
                      <p className="font-medium text-green-700">{optimizationStats.reduction}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Filename input in success section */}
              <div className="space-y-2">
                <Label htmlFor="download-filename">Download as:</Label>
                <div className="flex gap-2">
                  <Input
                    id="download-filename"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center px-3 py-2 bg-gray-100 border rounded-md text-sm text-gray-600">
                    .rtf
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={downloadRTF} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download RTF File
                </Button>
                <Button variant="outline" onClick={resetApp}>
                  Convert Another File
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                1
              </div>
              <p>Upload a ZIP file containing your Markdown (.md) files</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                2
              </div>
              <p>Review and select which files to include in the conversion</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                3
              </div>
              <p>Use search and sorting to manage large numbers of files efficiently</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                4
              </div>
              <p>Preview file contents before conversion</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                5
              </div>
              <p>Download the combined RTF file with only your selected content</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
