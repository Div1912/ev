import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  onScan: (tokenId: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    if (!containerRef.current) return;

    try {
      setError(null);
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Extract token ID from QR code content
          // Expected format: URL with tokenId param or just the token ID
          let tokenId = decodedText;
          
          try {
            const url = new URL(decodedText);
            const paramTokenId = url.searchParams.get('tokenId');
            if (paramTokenId) {
              tokenId = paramTokenId;
            }
          } catch {
            // Not a URL, use as-is (might be just the token ID)
            tokenId = decodedText.replace(/\D/g, ''); // Extract numbers only
          }

          if (tokenId) {
            scanner.stop().then(() => {
              setIsScanning(false);
              onScan(tokenId);
            });
          }
        },
        (errorMessage) => {
          // Ignore scanning errors (no QR found in frame)
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card p-6 w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Scan QR Code
            </h3>
            <button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <div
              id="qr-reader"
              ref={containerRef}
              className="rounded-xl overflow-hidden bg-black/20"
              style={{ minHeight: '300px' }}
            />
            
            {!isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                  <p>Starting camera...</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-3">
                <CameraOff className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-destructive">{error}</p>
                  <button
                    onClick={startScanner}
                    className="text-sm text-primary hover:underline mt-2"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center mt-4">
            Point your camera at a student's credential QR code
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QRScanner;
