import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

interface AdminReferralCardProps {
  referralCode: string;
}

export default function AdminReferralCard({ referralCode }: AdminReferralCardProps) {
  const [showQR, setShowQR] = useState(false);

  const registrationUrl = `${window.location.origin}/?ref=${referralCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied!');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(registrationUrl);
    toast.success('Registration link copied!');
  };

  const downloadQR = () => {
    const svg = document.getElementById('admin-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 0, 0, 400, 400);
      }
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `QR-${referralCode}.png`;
      link.href = pngUrl;
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] -mr-16 -mt-16" />

      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <h3 className="text-white font-bold text-lg">Your Referral Code</h3>
      </div>

      <p className="text-slate-400 text-xs mb-4">Share this code or QR with users. They will automatically be linked to your organization.</p>

      {/* Referral Code */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-white font-mono font-bold text-lg tracking-wider">{referralCode}</span>
          <button
            onClick={copyCode}
            className="text-blue-400 hover:text-blue-300 transition-colors ml-3"
            title="Copy code"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Registration Link */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 text-xs font-bold uppercase tracking-wider hover:bg-blue-600/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Copy Registration Link
        </button>
        <button
          onClick={() => setShowQR(!showQR)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
            showQR
              ? 'bg-purple-600/30 border-purple-500/30 text-purple-300'
              : 'bg-purple-600/20 border-purple-500/30 text-purple-400 hover:bg-purple-600/30'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          {showQR ? 'Hide QR' : 'Show QR'}
        </button>
      </div>

      {/* QR Code */}
      {showQR && (
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <QRCodeSVG
            id="admin-qr-code"
            value={registrationUrl}
            size={200}
            level="H"
            includeMargin
            bgColor="#ffffff"
            fgColor="#0f172a"
          />
          <p className="text-slate-600 text-xs text-center font-medium">
            Scan to register under your organization
          </p>
          <button
            onClick={downloadQR}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download QR
          </button>
        </div>
      )}
    </div>
  );
}
