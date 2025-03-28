"use client";
import { useRef, useEffect, useState } from "react";
import SignaturePad from "signature_pad";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  onSave: (signature: string) => void;
}

export function SignaturePadComponent({ onSave }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const pad = new SignaturePad(canvasRef.current, {
        backgroundColor: "rgb(255, 255, 255)",
        penColor: "rgb(0, 0, 0)",
      });
      setSignaturePad(pad);

      const resizeCanvas = () => {
        if (canvasRef.current) {
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          canvasRef.current.width = canvasRef.current.offsetWidth * ratio;
          canvasRef.current.height = canvasRef.current.offsetHeight * ratio;
          canvasRef.current.getContext("2d")?.scale(ratio, ratio);
          pad.clear(); // Clear on resize to avoid artifacts
        }
      };

      window.addEventListener("resize", resizeCanvas);
      resizeCanvas();

      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };
    }
  }, []);

  const handleClear = () => {
    if (signaturePad) {
      signaturePad.clear();
      setSignatureData(null);
    }
  };

  const handleSave = () => {
    if (signaturePad && !signaturePad.isEmpty()) {
      const data = signaturePad.toDataURL("image/png");
      setSignatureData(data);
      onSave(data);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSignatureData(result);
        onSave(result);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-48 bg-white"
          style={{ touchAction: "none" }}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleClear} type="button">
          Clear
        </Button>
        <Button onClick={handleSave} type="button" disabled={!signaturePad?.isEmpty()}>
          Save Signature
        </Button>
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground mb-2">Or upload signature image:</p>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="block w-full text-sm text-muted-foreground
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-primary-foreground
            hover:file:bg-primary/90
          "
        />
      </div>
      {signatureData && (
        <div className="mt-4">
          <p className="text-sm font-medium">Signature Preview:</p>
          <img
            src={signatureData}
            alt="Signature preview"
            className="mt-2 border rounded-md max-h-24"
          />
        </div>
      )}
    </div>
  );
}