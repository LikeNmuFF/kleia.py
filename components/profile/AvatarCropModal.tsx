'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, Check, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<File | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const size = Math.max(pixelCrop.width, pixelCrop.height)
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(null); return }

      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.clip()

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        size,
        size,
      )

      canvas.toBlob((blob) => {
        if (!blob) { resolve(null); return }
        resolve(new File([blob], 'avatar.jpg', { type: 'image/jpeg', lastModified: Date.now() }))
      }, 'image/jpeg', 0.9)
    }
    image.onerror = () => resolve(null)
    image.src = imageSrc
  })
}

interface AvatarCropModalProps {
  imageSrc: string
  onCropComplete: (file: File, preview: string) => void
  onCancel: () => void
}

export default function AvatarCropModal({ imageSrc, onCropComplete, onCancel }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropCompleteInternal = useCallback((_: unknown, areaPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleApply = async () => {
    if (!croppedAreaPixels) return
    setProcessing(true)
    const file = await getCroppedImg(imageSrc, croppedAreaPixels)
    if (file) {
      const preview = URL.createObjectURL(file)
      onCropComplete(file, preview)
    }
    setProcessing(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

        <motion.div
          className="relative z-10 w-full max-w-md mx-4 rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Crop your photo</h3>
            <button onClick={onCancel} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          {/* Cropper */}
          <div className="relative w-full aspect-square bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropCompleteInternal}
            />
          </div>

          {/* Zoom Slider */}
          <div className="px-5 py-3">
            <label className="block text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border transition-colors hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={processing}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-medium transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Apply
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
