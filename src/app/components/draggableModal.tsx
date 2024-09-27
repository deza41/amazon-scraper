'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { X, Copy, RefreshCw, ArrowUpRight } from 'lucide-react'

interface DraggableModalProps {
  isOpen: boolean
  onClose: () => void
  initialUrl: string
}

export default function DraggableModal({ isOpen, onClose, initialUrl }: DraggableModalProps) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl)
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const resizeRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      setSize(prevSize => ({
        width: Math.max(300, e.clientX - dragRef.current!.getBoundingClientRect().left),
        height: Math.max(200, e.clientY - dragRef.current!.getBoundingClientRect().top)
      }))
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleResize)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      window.addEventListener('mousemove', handleResize)
      window.addEventListener('mouseup', handleMouseUp)
    }

    const resizeElement = resizeRef.current
    if (resizeElement) {
      resizeElement.addEventListener('mousedown', handleMouseDown)
    }

    return () => {
      if (resizeElement) {
        resizeElement.removeEventListener('mousedown', handleMouseDown)
      }
    }
  }, [])

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
      ref={dragRef}
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed z-50 bg-white rounded-lg overflow-hidden shadow-2xl"
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
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
            onLoad={(e) => {
              var iframe = e.target as HTMLIFrameElement
              setCurrentUrl(iframe.contentWindow?.location?.href || initialUrl)
            }}
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
        ref={resizeRef}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, #718096 50%)'
        }}
      />
    </motion.div>
  )
}