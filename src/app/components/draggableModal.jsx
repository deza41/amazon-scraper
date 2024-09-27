'use client'

import React, { useState, useRef } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { X, Copy, RefreshCw, ArrowUpRight } from 'lucide-react'

export default function DraggableModal({ isOpen, onClose, initialUrl }) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl)
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef(null)

  const mWidth = useMotionValue(800)  // Motion value for width
  const mHeight = useMotionValue(600) // Motion value for height
  const [isResizing, setIsResizing] = useState(false)

  const handleResize = (event, info) => {
    const newWidth = mWidth.get() + info.delta.x
    const newHeight = mHeight.get() + info.delta.y
    if (newWidth > 300 && newWidth < 1200) {
      mWidth.set(newWidth)
    }
    if (newHeight > 200 && newHeight < 800) {
      mHeight.set(newHeight)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const refreshIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  const openInNewTab = () => {
    window.open(currentUrl, '_blank')
  }

  if (!isOpen) return null

  return (
    <motion.div
      drag={!isResizing} // Disable dragging when resizing
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed z-50 bg-white rounded-lg overflow-hidden shadow-2xl"
      style={{
        width: mWidth,  // Dynamic width
        height: mHeight, // Dynamic height
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b bg-gray-100 cursor-move">
          <h3 className="text-lg font-semibold">Amazon Browser</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-grow relative">
          <iframe
            ref={iframeRef}
            src={`https://api.allorigins.win/raw?url=${encodeURIComponent(initialUrl)}`}
            className="w-full h-full border-none"
            title="Amazon Website"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            target="_top"
            onLoad={setCurrentUrl(initialUrl)}
          />
        </div>
        <div className="p-4 border-t bg-gray-100">
          <div className="flex items-center mb-2">
            <input
              type="text"
              value={currentUrl}
              readOnly
              className="flex-grow p-2 border rounded mr-2 text-sm"
            />
            <Button onClick={copyToClipboard} size="sm">
              <Copy className="mr-2 h-4 w-4" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button onClick={refreshIframe} size="sm" className="ml-2">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={openInNewTab} size="sm" className="ml-2">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, #718096 50%)'
        }}
      >
        <motion.div
          drag
          dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
          dragElastic={0}
          dragMomentum={true}
          onDrag={handleResize}
          onDragStart={() => setIsResizing(true)}
          onDragEnd={() => setIsResizing(false)}
          className="w-full h-full"
        />
      </div>
    </motion.div>
  )
}
