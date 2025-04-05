
"use client";

import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eraser, Check, Upload } from "lucide-react";

export function SignaturePad({ onSignatureCapture }: any) {
  const signatureRef = useRef<any>(null);
  const [activeTab, setActiveTab] = useState("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [uploadedSignature, setUploadedSignature] = useState(null);
  const [error, setError] = useState("");

  // Clear the drawing pad
  const clearSignature = () => {
    if (signatureRef?.current) {
      signatureRef.current?.clear();
    }
    setError("");
  };

  // Capture the drawn signature
  const captureDrawnSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureDataUrl = signatureRef.current.toDataURL("image/png");
      onSignatureCapture(signatureDataUrl, "drawn");
      setError("");
    } else {
      setError("Please draw your signature");
    }
  };

  // Capture the typed signature
  const captureTypedSignature = () => {
    if (typedSignature.trim()) {
      // Create a canvas to generate an image from the typed text
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = 400;
      canvas.height = 150;

      // Clear canvas
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw text
      ctx.font = "italic 40px cursive";
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

      const signatureDataUrl = canvas.toDataURL("image/png");
      onSignatureCapture(signatureDataUrl, "typed");
      setError("");
    } else {
      setError("Please type your signature");
    }
  };

  // Handle image upload
  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    setError("");

    if (!file) return;

    // Check if file is an image
    if (!file.type.match("image.*")) {
      setError("Please upload an image file");
      return;
    }

    // Size check (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event: any) => {
      setUploadedSignature(event.target?.result);
    };

    reader.readAsDataURL(file);
  };

  // Capture the uploaded signature
  const captureUploadedSignature = () => {
    if (uploadedSignature) {
      onSignatureCapture(uploadedSignature, "uploaded");
      setError("");
    } else {
      setError("Please upload your signature");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Capture Your Signature</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-2 mb-4 rounded-md text-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="type">Type</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          {/* Draw Signature Tab */}
          <TabsContent value="draw" className="mt-4">
            <div className="border border-gray-300 rounded-md">
              <SignatureCanvas
                ref={signatureRef}
                penColor="black"
                canvasProps={{
                  width: 400,
                  height: 400,
                  className: "signature-pad w-full h-40 cursor-crosshair",
                }}
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSignature}
                className="mr-2"
              >
                <Eraser className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={captureDrawnSignature}
              >
                <Check className="h-4 w-4 mr-2" />
                Accept Signature
              </Button>
            </div>
          </TabsContent>

          {/* Type Signature Tab */}
          <TabsContent value="type" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="typed-signature">Type your signature</Label>
                <Input
                  id="typed-signature"
                  placeholder="Your signature"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                />
              </div>

              {typedSignature && (
                <div className="border p-4 flex justify-center items-center h-32 italic text-xl font-signature">
                  {typedSignature}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={captureTypedSignature}
                  disabled={!typedSignature.trim()}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept Signature
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Upload Signature Tab */}
          <TabsContent value="upload" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature-image">Upload signature image</Label>
                <Input
                  id="signature-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>

              {uploadedSignature && (
                <div className="border p-4 flex justify-center items-center">
                  <img
                    src={uploadedSignature}
                    alt="Uploaded signature"
                    className="max-h-32 object-contain"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={captureUploadedSignature}
                  disabled={!uploadedSignature}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept Signature
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default SignaturePad;
