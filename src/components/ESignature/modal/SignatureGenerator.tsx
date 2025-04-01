import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';

// Function to generate a signature from text using HTML5 Canvas
const generateSignature = (name: string, width: number = 300, height: number = 100): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';

  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Set up signature style
  ctx.font = 'italic 40px "Brush Script MT", cursive';
  ctx.fillStyle = 'black';
  
  // Center the text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw the signature
  ctx.fillText(name, width / 2, height / 2);
  
  // Add some signature-like flourish
  ctx.beginPath();
  ctx.moveTo(width / 4, height * 0.75);
  ctx.lineTo(width * 0.75, height * 0.75);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.stroke();

  return canvas.toDataURL();
};

interface SignatureGeneratorModalProps {
  onSignatureGenerate: (signatureDataUrl: string) => void;
}

const SignatureGenerator: React.FC<SignatureGeneratorModalProps> = ({ onSignatureGenerate }) => {
  const [name, setName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGenerateSignature = () => {
    if (!name.trim()) {
      alert('Please enter a name');
      return;
    }

    const newSignatureDataUrl = generateSignature(name);
    setSignatureDataUrl(newSignatureDataUrl);
  };

  const handleConfirmSignature = () => {
    if (signatureDataUrl) {
      onSignatureGenerate(signatureDataUrl);
      setIsOpen(false);
    }
  };

  // Render signature to canvas when data URL changes
  useEffect(() => {
    if (signatureDataUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Clear previous content
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create image and draw
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = signatureDataUrl;
    }
  }, [signatureDataUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center">
          <Pencil className="mr-2 h-4 w-4" /> Create Signature
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Your Signature</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
            <Button 
              onClick={handleGenerateSignature}
              variant="secondary"
            >
              Generate
            </Button>
          </div>

          {signatureDataUrl && (
            <div className="flex flex-col items-center space-y-4">
              <canvas 
                ref={canvasRef}
                width={300}
                height={100}
                className="border rounded-lg shadow-md"
              />
              <div className="text-sm text-muted-foreground">
                Preview of your signature
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSignature}
            disabled={!signatureDataUrl}
          >
            Confirm Signature
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureGenerator;