import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";

export default function QRScanner({ onScanSuccess, onClose }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 }, // better than just number
    });

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
        scanner.clear().catch(() => {}); // stop scanning after success
      },
      (errorMessage) => {
        // Avoid spamming console with decode errors
        // console.warn("QR Scan Error:", errorMessage);
      }
    );

    return () => {
      scanner.clear().catch(() => {}); // cleanup on unmount
    };
  }, [onScanSuccess]);

  return (
    <div className="mb-4">
      <div id="qr-reader" style={{ width: "100%" }} />
      <button
        onClick={onClose}
        className="mt-2 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
      >
        Stop Scanner
      </button>
    </div>
  );
}
