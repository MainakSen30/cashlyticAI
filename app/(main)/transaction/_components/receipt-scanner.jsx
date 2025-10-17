"use client";

import { scanReceipt } from '@/actions/transaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useFetch from '@/hooks/use-fetch';
import { Camera, Loader2 } from 'lucide-react';
import React, { useEffect, useRef } from 'react'
import { toast } from 'sonner';

const ReceiptScanner = ({ onScanComplete }) => {
  const fileInputRef = useRef();
  const {
    loading: scanReceiptLoading,
    fn: scanReceiptFn,
    data: scannedData,
  } = useFetch(scanReceipt);
  const handleReceiptScan = async(file) => {
    if(file.size > 5 * 1024 * 1024) {
      toast.error("File size too large, please upload file with size less than 5mb.");
      return;
    }
    await scanReceiptFn(file);
  }
  useEffect(() => {
    if(scannedData && !scanReceiptLoading) {
      onScanComplete(scannedData);
      toast.success("Receipt scanned successfully");
    }
  }, [ scanReceiptLoading, scannedData ]);
  
  return (
    <div>
      <Input 
        type="file" 
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if(file) handleReceiptScan(file);
        }}
      />
      <Button 
        type='button'
        variant='outline'
        className="w-full h-12 rounded-2xl bg-gradient-to-br hover:shadow-lg hover:opacity-90 duration-300 transition-all from-teal-400 via-teal-600 to-teal-800 animate-gradient text-white hover:text-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanReceiptLoading}
      >
        {scanReceiptLoading? 
          (
            <>
              <Loader2 className='mr-2 animate-spin'/>
              <span>Scanning Receipt...</span>
            </>
          ) : (
            <>
              <Camera className='mr-2'/>
              <span>Scan Receipt with AI</span>
            </>
          )
        }
      </Button>
    </div>
  )
}

export default ReceiptScanner;