"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  requestId: string;
}

export default function QRCodeDisplay({ requestId }: QRCodeDisplayProps) {
  // Generate a URL pointing to the public verification page
  const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${requestId}`;

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg inline-block">
      <QRCodeSVG 
        value={verifyUrl} 
        size={150}
        level="H"
        includeMargin={true}
      />
    </div>
  );
}
