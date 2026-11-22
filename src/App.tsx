import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Konva from 'konva'
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import Localized from './Localized'
import { languages, translate, type Language } from './i18n'
import './App.css'

type PresetId = 'small' | 'one' | 'large-one' | 'one-and-half' | 'small-two' | 'two' | 'custom'
type TabId = 'crop' | 'adjust' | 'layout'
type SizeUnit = 'mm' | 'cm' | 'px'
type PaperId = '5' | '6' | '7' | 'a4' | 'custom'
type PaperOrientation = 'portrait' | 'landscape'
type PhotoPreset = {
  id: PresetId
  name: string
  width: number
  height: number
  pixelWidth: number
  pixelHeight: number
  usage: string
}
type Adjustments = { hue: number; warmth: number; brightness: number; contrast: number }
type RGB = { r: number; g: number; b: number }
type EraserStroke = { paths: number[][]; width: number }
type EraserCursor = { x: number; y: number; visible: boolean }
type EditorSnapshot = {
  imageUrl: string
  imageName: string
  activeTab: TabId
  presetId: PresetId
  customWidth: number
  customHeight: number
  sizeUnit: SizeUnit
  frameScale: number
  zoom: number
  rotation: number
  imagePosition: { x: number; y: number }
  adjustments: Adjustments
  background: string
  keyColor: RGB | null
  tolerance: number
  eraserStrokes: EraserStroke[]
  cropCommitted: boolean
}

const presets: PhotoPreset[] = [
  { id: 'small', name: '小一寸', width: 2.2, height: 3.2, pixelWidth: 259, pixelHeight: 377, usage: '某些学籍照、报名' },
  { id: 'one', name: '标准一寸', width: 2.5, height: 3.5, pixelWidth: 295, pixelHeight: 413, usage: '身份证、学生证、银行卡' },
  { id: 'large-one', name: '大一寸', width: 3.3, height: 4.8, pixelWidth: 390, pixelHeight: 567, usage: '港澳通行证、某些签证' },
  { id: 'one-and-half', name: '1.5寸', width: 3.3, height: 4.8, pixelWidth: 390, pixelHeight: 567, usage: '通用证件照规格' },
  { id: 'small-two', name: '小二寸', width: 3.5, height: 4.5, pixelWidth: 413, pixelHeight: 531, usage: '中国护照' },
  { id: 'two', name: '标准二寸', width: 3.5, height: 4.9, pixelWidth: 413, pixelHeight: 579, usage: '驾驶证、某些报名用' },
]
const paperPresets: Record<Exclude<PaperId, 'custom'>, { name: string; width: number; height: number }> = {
  '5': { name: '5 寸相纸', width: 127, height: 89 },
  '6': { name: '6 寸相纸', width: 152.4, height: 101.6 },
  '7': { name: '7 寸相纸', width: 177.8, height: 127 },
  a4: { name: 'A4 纸', width: 210, height: 297 },
}
const PRINT_DPI = 300
const backgroundColors = [
  { name: '白色', value: '#ffffff' },
  { name: '蓝色', value: '#438edb' },
  { name: '红色', value: '#e64b53' },
  { name: '浅蓝', value: '#9dc8ec' },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const mmPerUnit = (unit: SizeUnit) => (unit === 'cm' ? 10 : unit === 'px' ? 25.4 / PRINT_DPI : 1)
const getPresetWidth = (item: PhotoPreset, unit: SizeUnit) => (unit === 'px' ? item.pixelWidth : unit === 'cm' ? item.width : item.width * 10)
const getPresetHeight = (item: PhotoPreset, unit: SizeUnit) => (unit === 'px' ? item.pixelHeight : unit === 'cm' ? item.height : item.height * 10)
const cssFilter = (adjustments: Adjustments) =>
  `hue-rotate(${adjustments.hue}deg) brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) sepia(${Math.max(0, adjustments.warmth)}%)`

function adjustRgb(red: number, green: number, blue: number, adjustments: Adjustments) {
  const angle = (adjustments.hue * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const r =
    red * (0.213 + cos * 0.787 - sin * 0.213) +
    green * (0.715 - cos * 0.715 - sin * 0.715) +
    blue * (0.072 - cos * 0.072 + sin * 0.928)
  const g =
    red * (0.213 - cos * 0.213 + sin * 0.143) +
    green * (0.715 + cos * 0.285 + sin * 0.14) +
    blue * (0.072 - cos * 0.072 - sin * 0.283)
  const b =
    red * (0.213 - cos * 0.213 - sin * 0.787) +
    green * (0.715 - cos * 0.715 + sin * 0.715) +
    blue * (0.072 + cos * 0.928 + sin * 0.072)
  const contrast = adjustments.contrast - 100
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
  const warmth = adjustments.warmth * 1.35
  return [
    clamp((factor * (r - 128) + 128) * (adjustments.brightness / 100) + warmth, 0, 255),
    clamp((factor * (g - 128) + 128) * (adjustments.brightness / 100) + warmth * 0.12, 0, 255),
    clamp((factor * (b - 128) + 128) * (adjustments.brightness / 100) - warmth, 0, 255),
  ]
}

function rgbToLab(red: number, green: number, blue: number) {
  const linearize = (value: number) => {
    const channel = value / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }
  const r = linearize(red)
  const g = linearize(green)
  const b = linearize(blue)
  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175
  const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883
  const curve = (value: number) => value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116
  const fx = curve(x)
  const fy = curve(y)
  const fz = curve(z)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

function colorize(
  pixels: ImageData,
  adjustments: Adjustments,
  keyColor: RGB | null,
  background: string,
  tolerance: number,
) {
  const data = pixels.data
  const adjustedKey = keyColor ? adjustRgb(keyColor.r, keyColor.g, keyColor.b, adjustments) : null
  const key = adjustedKey ? rgbToLab(adjustedKey[0], adjustedKey[1], adjustedKey[2]) : null
  const target = keyColor ? background.match(/[0-9a-f]{2}/gi)?.map((part) => parseInt(part, 16)) : null
  const threshold = Math.min(tolerance * 1.8, 24)
  const width = pixels.width
  const height = pixels.height
  const pixelCount = width * height
  const candidates = key && target ? new Uint8Array(pixelCount) : null
  let candidateCount = 0
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = adjustRgb(data[i], data[i + 1], data[i + 2], adjustments)
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    if (key && target) {
      const lab = rgbToLab(r, g, b)
      const distance = Math.hypot(lab[0] - key[0], lab[1] - key[1], lab[2] - key[2])
      if (distance <= threshold) {
        candidates![i / 4] = 1
        candidateCount += 1
      }
    }
  }
  if (!key || !target || !candidates || candidateCount === 0) return

  const queue = new Uint32Array(candidateCount)
  let queueEnd = 0
  const addCandidate = (index: number) => {
    if (candidates[index] !== 1) return
    candidates[index] = 2
    queue[queueEnd] = index
    queueEnd += 1
  }
  for (let x = 0; x < width; x += 1) {
    addCandidate(x)
    if (height > 1) addCandidate((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y += 1) {
    addCandidate(y * width)
    if (width > 1) addCandidate(y * width + width - 1)
  }
  for (let cursor = 0; cursor < queueEnd; cursor += 1) {
    const index = queue[cursor]
    const x = index % width
    if (x > 0) addCandidate(index - 1)
    if (x + 1 < width) addCandidate(index + 1)
    if (index >= width) addCandidate(index - width)
    if (index + width < pixelCount) addCandidate(index + width)
  }

  for (let index = 0; index < pixelCount; index += 1) {
    if (candidates[index] !== 2) continue
    const offset = index * 4
    const lab = rgbToLab(data[offset], data[offset + 1], data[offset + 2])
    const distance = Math.hypot(lab[0] - key[0], lab[1] - key[1], lab[2] - key[2])
    const blend = clamp((distance - threshold * 0.7) / Math.max(threshold * 0.3, 1), 0, 1)
    data[offset] = data[offset] * blend + (target[0] ?? 255) * (1 - blend)
    data[offset + 1] = data[offset + 1] * blend + (target[1] ?? 255) * (1 - blend)
    data[offset + 2] = data[offset + 2] * blend + (target[2] ?? 255) * (1 - blend)
  }
}

function photoFilter(this: Konva.Node, imageData: ImageData) {
  const adjustments = {
    hue: this.getAttr('photoHue') ?? 0,
    warmth: this.getAttr('photoWarmth') ?? 0,
    brightness: this.getAttr('photoBrightness') ?? 100,
    contrast: this.getAttr('photoContrast') ?? 100,
  }
  const keyColor = this.getAttr('photoKeyColor') as RGB | null
  colorize(
    imageData,
    adjustments,
    keyColor,
    this.getAttr('photoBackground') ?? '#ffffff',
    this.getAttr('photoTolerance') ?? 18,
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Icon({ name }: { name: 'image' | 'crop' | 'sliders' | 'grid' | 'download' | 'upload' | 'spark' | 'undo' | 'language' }) {
  const paths: Record<typeof name, string> = {
    image: 'M4 5h16v14H4z M8 10h.01 M20 15l-5-5L5 19',
    crop: 'M7 3v14a2 2 0 0 0 2 2h12 M17 21V7a2 2 0 0 0-2-2H3',
    sliders: 'M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3 M2 14h4m4-6h4m4 8h4',
    grid: 'M3 3h8v8H3z M13 3h8v8h-8z M3 13h8v8H3z M13 13h8v8h-8z',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
    upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
    spark: 'm12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3z M19 14l1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14z',
    undo: 'M3 7v6h6 M4.5 13a8 8 0 1 0 2.3-5.7L3 13',
    language: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  }
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  )
}

function App() {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const savedLanguage = window.localStorage.getItem('photo-id-maker-language')
      return languages.find((item) => item.code === savedLanguage)?.code ?? 'zh-CN'
    } catch {
      return 'zh-CN'
    }
  })
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageName, setImageName] = useState('')
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null)
  const [canvasZoom, setCanvasZoom] = useState(1)
  const [activeTab, setActiveTab] = useState<TabId>('crop')
  const [presetId, setPresetId] = useState<PresetId>('one')
  const [customWidth, setCustomWidth] = useState(25)
  const [customHeight, setCustomHeight] = useState(35)
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>('mm')
  const [frameScale, setFrameScale] = useState(0.82)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [adjustments, setAdjustments] = useState<Adjustments>({
    hue: 0,
    warmth: 0,
    brightness: 100,
    contrast: 100,
  })
  const [background, setBackground] = useState('#ffffff')
  const [keyColor, setKeyColor] = useState<RGB | null>(null)
  const [tolerance, setTolerance] = useState(18)
  const [eraserStrokes, setEraserStrokes] = useState<EraserStroke[]>([])
  const [eraserEnabled, setEraserEnabled] = useState(false)
  const [eraserSize, setEraserSize] = useState(24)
  const [eraserCursor, setEraserCursor] = useState<EraserCursor>({ x: 0, y: 0, visible: false })
  const eraserDrawingRef = useRef(false)
  const eraserPointerInsideRef = useRef(false)
  const [pickingColor, setPickingColor] = useState(false)
  const [paperSize, setPaperSize] = useState<PaperId>('6')
  const [paperOrientation, setPaperOrientation] = useState<PaperOrientation>('landscape')
  const [customPaperWidth, setCustomPaperWidth] = useState(152.4)
  const [customPaperHeight, setCustomPaperHeight] = useState(101.6)
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('jpeg')
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [stageSize, setStageSize] = useState({ width: 840, height: 520 })
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [cropCommitted, setCropCommitted] = useState(false)
  const [history, setHistory] = useState<EditorSnapshot[]>([])
  const historyRef = useRef<EditorSnapshot[]>([])
  const createdUrlsRef = useRef(new Set<string>())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const languageMenuRef = useRef<HTMLDivElement>(null)
  const languageButtonRef = useRef<HTMLButtonElement>(null)
  const stageContainerRef = useRef<HTMLDivElement>(null)
  const imageNodeRef = useRef<Konva.Image>(null)
  const stageRef = useRef<Konva.Stage>(null)

  useEffect(() => {
    document.documentElement.lang = language
    document.title = translate(language, '照相馆 · 证件照工坊')
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (description) {
      description.content = translate(language, '在浏览器中制作证件照：裁剪尺寸、调整色彩、替换底色、相纸排版并高清导出。')
    }
    try {
      window.localStorage.setItem('photo-id-maker-language', language)
    } catch {
      // The selected language still applies for this session when storage is unavailable.
    }
  }, [language])

  useEffect(() => {
    if (!isLanguageMenuOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !languageMenuRef.current?.contains(event.target)) {
        setIsLanguageMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [isLanguageMenuOpen])

  useEffect(() => {
    if (isLanguageMenuOpen) {
      languageMenuRef.current?.querySelector<HTMLButtonElement>('[role="menuitemradio"][aria-checked="true"]')?.focus()
    }
  }, [isLanguageMenuOpen])

  const preset = useMemo<PhotoPreset>(() => {
    const selected = presets.find((item) => item.id === presetId)
    if (!selected) {
      const customMmWidth = customWidth * mmPerUnit(sizeUnit)
      const customMmHeight = customHeight * mmPerUnit(sizeUnit)
      return {
        id: 'custom',
        name: '自定义',
        width: customWidth,
        height: customHeight,
        pixelWidth: Math.round((customMmWidth / 25.4) * PRINT_DPI),
        pixelHeight: Math.round((customMmHeight / 25.4) * PRINT_DPI),
        usage: '自定义证件照尺寸',
      }
    }
    return {
      ...selected,
      width: sizeUnit === 'px' ? selected.pixelWidth : getPresetWidth(selected, sizeUnit),
      height: sizeUnit === 'px' ? selected.pixelHeight : getPresetHeight(selected, sizeUnit),
    }
  }, [presetId, customWidth, customHeight, sizeUnit])

  const currentSnapshot: EditorSnapshot = {
    imageUrl,
    imageName,
    activeTab,
    presetId,
    customWidth,
    customHeight,
    sizeUnit,
    frameScale,
    zoom,
    rotation,
    imagePosition,
    adjustments,
    background,
    keyColor,
    tolerance,
    eraserStrokes,
    cropCommitted,
  }
  const snapshotRef = useRef(currentSnapshot)
  useEffect(() => {
    snapshotRef.current = currentSnapshot
  })

  const pushHistory = useCallback(() => {
    if (!snapshotRef.current.imageUrl) return
    const next = [...historyRef.current, snapshotRef.current].slice(-30)
    historyRef.current = next
    setHistory(next)
  }, [])

  const clearHistory = () => {
    historyRef.current = []
    setHistory([])
  }

  const restoreSnapshot = (snapshot: EditorSnapshot) => {
    if (imageUrl !== snapshot.imageUrl) {
      setSourceImage(null)
      setImageUrl(snapshot.imageUrl)
    }
    setImageName(snapshot.imageName)
    setActiveTab(snapshot.activeTab)
    setPresetId(snapshot.presetId)
    setCustomWidth(snapshot.customWidth)
    setCustomHeight(snapshot.customHeight)
    setSizeUnit(snapshot.sizeUnit)
    setFrameScale(snapshot.frameScale)
    setZoom(snapshot.zoom)
    setRotation(snapshot.rotation)
    setImagePosition(snapshot.imagePosition)
    setAdjustments(snapshot.adjustments)
    setBackground(snapshot.background)
    setKeyColor(snapshot.keyColor)
    setTolerance(snapshot.tolerance)
    setEraserStrokes(snapshot.eraserStrokes)
    setCropCommitted(snapshot.cropCommitted)
    setPickingColor(false)
    setEraserEnabled(false)
    setErrorMessage('')
    setStatusMessage('')
  }

  const undo = () => {
    const previous = historyRef.current.at(-1)
    if (!previous) return
    const next = historyRef.current.slice(0, -1)
    historyRef.current = next
    setHistory(next)
    restoreSnapshot(previous)
  }

  useEffect(() => {
    const container = stageContainerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect && rect.width > 0 && rect.height > 0) {
        const height = Math.round(rect.height)
        setStageSize({ width: Math.round(rect.width), height })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!imageUrl) return
    let cancelled = false
    const image = new window.Image()
    image.onload = () => {
      if (!cancelled) setSourceImage(image)
    }
    image.onerror = () => {
      if (!cancelled) setErrorMessage('图片无法读取，请选择其他图片格式重试。')
    }
    image.src = imageUrl
    return () => {
      cancelled = true
    }
  }, [imageUrl])

  useEffect(() => {
    const revokeCreatedUrls = () => {
      createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      createdUrlsRef.current.clear()
    }
    window.addEventListener('pagehide', revokeCreatedUrls)
    return () => window.removeEventListener('pagehide', revokeCreatedUrls)
  }, [])

  const radians = (rotation * Math.PI) / 180
  const absCos = Math.abs(Math.cos(radians))
  const absSin = Math.abs(Math.sin(radians))
  const ratio = preset.width / preset.height
  const maxFrameHeight = Math.min(stageSize.height * 0.76, (stageSize.width * 0.72) / ratio)
  const frameHeight = maxFrameHeight * frameScale
  const frameWidth = frameHeight * ratio
  const frame = {
    x: (stageSize.width - frameWidth) / 2,
    y: (stageSize.height - frameHeight) / 2,
    width: frameWidth,
    height: frameHeight,
  }
  const rotatedSourceWidth = sourceImage
    ? sourceImage.width * absCos + sourceImage.height * absSin
    : 0
  const rotatedSourceHeight = sourceImage
    ? sourceImage.width * absSin + sourceImage.height * absCos
    : 0
  const fitScale = sourceImage
    ? activeTab === 'crop'
      ? Math.min((stageSize.width * 0.86) / sourceImage.width, (stageSize.height * 0.86) / sourceImage.height)
      : Math.min((stageSize.width * 0.86) / rotatedSourceWidth, (stageSize.height * 0.86) / rotatedSourceHeight)
    : 1
  const minimumZoom =
    sourceImage && fitScale > 0
      ? Math.max(
          1,
          (frame.width * absCos + frame.height * absSin) / (sourceImage.width * fitScale),
          (frame.width * absSin + frame.height * absCos) / (sourceImage.height * fitScale),
        )
      : 1
  const effectiveZoom = activeTab === 'crop' ? Math.max(zoom, minimumZoom) : 1
  const drawnWidth = sourceImage ? sourceImage.width * fitScale * effectiveZoom : 0
  const drawnHeight = sourceImage ? sourceImage.height * fitScale * effectiveZoom : 0
  const rotatedWidth = drawnWidth * absCos + drawnHeight * absSin
  const rotatedHeight = drawnWidth * absSin + drawnHeight * absCos
  const clampImagePosition = useCallback(
    (next: { x: number; y: number }) => ({
      x:
        activeTab === 'crop'
          ? clamp(next.x, frame.x + frame.width - rotatedWidth / 2, frame.x + rotatedWidth / 2)
          : next.x,
      y:
        activeTab === 'crop'
          ? clamp(next.y, frame.y + frame.height - rotatedHeight / 2, frame.y + rotatedHeight / 2)
          : next.y,
    }),
    [activeTab, frame.x, frame.y, frame.width, frame.height, rotatedWidth, rotatedHeight],
  )
  const imageBaseX = stageSize.width / 2 - drawnWidth / 2 + (activeTab === 'crop' ? imagePosition.x : 0)
  const imageBaseY = stageSize.height / 2 - drawnHeight / 2 + (activeTab === 'crop' ? imagePosition.y : 0)
  const boundedImagePosition = clampImagePosition({ x: imageBaseX + drawnWidth / 2, y: imageBaseY + drawnHeight / 2 })
  const imageX = boundedImagePosition.x - drawnWidth / 2
  const imageY = boundedImagePosition.y - drawnHeight / 2
  const cropState = { ...frame, imageX, imageY, drawnWidth, drawnHeight }

  useEffect(() => {
    const node = imageNodeRef.current
    if (!node || !sourceImage) return
    node.setAttr('photoHue', adjustments.hue)
    node.setAttr('photoWarmth', adjustments.warmth)
    node.setAttr('photoBrightness', adjustments.brightness)
    node.setAttr('photoContrast', adjustments.contrast)
    node.setAttr('photoKeyColor', keyColor)
    node.setAttr('photoBackground', background)
    node.setAttr('photoTolerance', tolerance)
    node.clearCache()
    node.cache({ pixelRatio: 1 })
    node.getLayer()?.batchDraw()
  }, [sourceImage, adjustments, keyColor, background, tolerance, drawnWidth, drawnHeight])

  const setPhotoFile = (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('请选择 JPG、PNG 或 WebP 图片文件。')
      return
    }
    const url = URL.createObjectURL(file)
    createdUrlsRef.current.add(url)
    setErrorMessage('')
    setStatusMessage('')
    setSourceImage(null)
    setImageName(file.name.replace(/\.[^.]+$/, '') || '证件照')
    setImageUrl(url)
    setCanvasZoom(1)
    setActiveTab('crop')
    setPresetId('one')
    setCustomWidth(25)
    setCustomHeight(35)
    setSizeUnit('mm')
    setFrameScale(0.82)
    setZoom(1)
    setRotation(0)
    setImagePosition({ x: 0, y: 0 })
    setAdjustments({ hue: 0, warmth: 0, brightness: 100, contrast: 100 })
    setBackground('#ffffff')
    setKeyColor(null)
    setTolerance(18)
    setEraserStrokes([])
    setEraserEnabled(false)
    setCropCommitted(false)
    clearHistory()
  }

  const openFilePicker = () => fileInputRef.current?.click()

  const updateZoom = (value: number) => {
    setZoom(clamp(value, minimumZoom, 4))
    setCropCommitted(false)
  }

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault()
    if (!sourceImage || activeTab !== 'crop') return
    if (!event.evt.ctrlKey) pushHistory()
    updateZoom(zoom + (event.evt.deltaY < 0 ? 0.08 : -0.08))
  }

  const changeCanvasZoom = (value: number) => setCanvasZoom(clamp(value, 0.5, 2))

  const sampleBackground = () => {
    const stage = stageRef.current
    if (!sourceImage || !stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const centerX = imageX + drawnWidth / 2
    const centerY = imageY + drawnHeight / 2
    const dx = pointer.x - centerX
    const dy = pointer.y - centerY
    const sourceX = Math.floor(((dx * Math.cos(radians) + dy * Math.sin(radians) + drawnWidth / 2) / drawnWidth) * sourceImage.width)
    const sourceY = Math.floor(((-dx * Math.sin(radians) + dy * Math.cos(radians) + drawnHeight / 2) / drawnHeight) * sourceImage.height)
    if (sourceX < 0 || sourceY < 0 || sourceX >= sourceImage.width || sourceY >= sourceImage.height) return
    const sampleCanvas = document.createElement('canvas')
    sampleCanvas.width = 1
    sampleCanvas.height = 1
    const context = sampleCanvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      setErrorMessage('浏览器无法读取图片像素，背景取色暂不可用。')
      return
    }
    pushHistory()
    context.drawImage(sourceImage, sourceX, sourceY, 1, 1, 0, 0, 1, 1)
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data
    setKeyColor({ r, g, b })
    setPickingColor(false)
    setStatusMessage('背景颜色已采样，可在右侧选择替换底色。')
  }

  const startEraserStroke = () => {
    if (!eraserEnabled || activeTab !== 'adjust' || !sourceImage || drawnWidth <= 0 || drawnHeight <= 0) return
    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer) return
    const dx = pointer.x - (imageX + drawnWidth / 2)
    const dy = pointer.y - (imageY + drawnHeight / 2)
    const localX = dx * Math.cos(radians) + dy * Math.sin(radians) + drawnWidth / 2
    const localY = -dx * Math.sin(radians) + dy * Math.cos(radians) + drawnHeight / 2
    if (localX < 0 || localX > drawnWidth || localY < 0 || localY > drawnHeight) return
    pushHistory()
    eraserDrawingRef.current = true
    eraserPointerInsideRef.current = true
    setEraserStrokes((strokes) => [
      ...strokes,
      { paths: [[localX / drawnWidth, localY / drawnHeight]], width: eraserSize / drawnWidth },
    ])
  }

  const updateEraserCursor = (event: React.MouseEvent<HTMLDivElement>) => {
    const container = stageContainerRef.current
    const canvas = container?.querySelector('canvas')
    if (!eraserEnabled || !container || !canvas || drawnWidth <= 0 || drawnHeight <= 0) {
      setEraserCursor((current) => current.visible ? { ...current, visible: false } : current)
      return
    }
    const canvasBounds = canvas.getBoundingClientRect()
    if (canvasBounds.width === 0 || canvasBounds.height === 0) return
    const pointer = {
      x: ((event.clientX - canvasBounds.left) / canvasBounds.width) * stageSize.width,
      y: ((event.clientY - canvasBounds.top) / canvasBounds.height) * stageSize.height,
    }
    const dx = pointer.x - (imageX + drawnWidth / 2)
    const dy = pointer.y - (imageY + drawnHeight / 2)
    const localX = dx * Math.cos(radians) + dy * Math.sin(radians) + drawnWidth / 2
    const localY = -dx * Math.sin(radians) + dy * Math.cos(radians) + drawnHeight / 2
    const bounds = container.getBoundingClientRect()
    setEraserCursor({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      visible: localX >= 0 && localX <= drawnWidth && localY >= 0 && localY <= drawnHeight,
    })
  }

  const continueEraserStroke = () => {
    if (!eraserDrawingRef.current || drawnWidth <= 0 || drawnHeight <= 0) return
    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer) return
    const dx = pointer.x - (imageX + drawnWidth / 2)
    const dy = pointer.y - (imageY + drawnHeight / 2)
    const localX = dx * Math.cos(radians) + dy * Math.sin(radians) + drawnWidth / 2
    const localY = -dx * Math.sin(radians) + dy * Math.cos(radians) + drawnHeight / 2
    const inside = localX >= 0 && localX <= drawnWidth && localY >= 0 && localY <= drawnHeight
    if (!inside) {
      eraserPointerInsideRef.current = false
      return
    }
    const point = [localX / drawnWidth, localY / drawnHeight]
    if (!eraserPointerInsideRef.current) {
      eraserPointerInsideRef.current = true
      setEraserStrokes((strokes) => {
        const last = strokes.at(-1)
        if (!last) return strokes
        return [...strokes.slice(0, -1), { ...last, paths: [...last.paths, point] }]
      })
      return
    }
    setEraserStrokes((strokes) => {
      const last = strokes.at(-1)
      if (!last || last.paths.length === 0) return strokes
      const lastPath = last.paths[last.paths.length - 1]
      const nextPath = [...lastPath, ...point]
      return [...strokes.slice(0, -1), { ...last, paths: [...last.paths.slice(0, -1), nextPath] }]
    })
  }

  const finishEraserStroke = () => {
    eraserDrawingRef.current = false
    eraserPointerInsideRef.current = false
  }

  const getOutputCanvas = (width: number, height: number, crop: boolean, applyEdits = true) => {
    if (!sourceImage) throw new Error('请先打开一张图片。')
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('浏览器无法创建图像画布。')
    context.fillStyle = background
    context.fillRect(0, 0, width, height)
    if (crop) {
      const scaleX = width / cropState.width
      const scaleY = height / cropState.height
      context.setTransform(scaleX, 0, 0, scaleY, -cropState.x * scaleX, -cropState.y * scaleY)
      context.translate(cropState.imageX + cropState.drawnWidth / 2, cropState.imageY + cropState.drawnHeight / 2)
      context.rotate(radians)
      context.drawImage(sourceImage, -cropState.drawnWidth / 2, -cropState.drawnHeight / 2, cropState.drawnWidth, cropState.drawnHeight)
      context.setTransform(1, 0, 0, 1, 0, 0)
    } else {
      context.drawImage(sourceImage, 0, 0, width, height)
    }
    if (applyEdits) {
      const pixels = context.getImageData(0, 0, width, height)
      colorize(pixels, adjustments, keyColor, background, tolerance)
      context.putImageData(pixels, 0, 0)
      context.fillStyle = background
      context.strokeStyle = background
      context.lineCap = 'round'
      context.lineJoin = 'round'
      for (const stroke of eraserStrokes) {
        context.lineWidth = stroke.width * width
        for (const path of stroke.paths) {
          if (path.length === 2) {
            context.beginPath()
            context.arc(path[0] * width, path[1] * height, context.lineWidth / 2, 0, Math.PI * 2)
            context.fill()
            continue
          }
          context.beginPath()
          context.moveTo(path[0] * width, path[1] * height)
          for (let point = 2; point < path.length; point += 2) {
            context.lineTo(path[point] * width, path[point + 1] * height)
          }
          context.stroke()
        }
      }
    }
    return canvas
  }

  const confirmCrop = async () => {
    try {
      setErrorMessage('')
      setStatusMessage('')
      const width = preset.pixelWidth
      const height = preset.pixelHeight
      const canvas = getOutputCanvas(width, height, true, false)
      const blob = await canvasToBlob(canvas, 'image/png', 1)
      const url = URL.createObjectURL(blob)
      createdUrlsRef.current.add(url)
      pushHistory()
      setImageUrl(url)
      setSourceImage(null)
      setCropCommitted(true)
      setZoom(1)
      setRotation(0)
      setImagePosition({ x: 0, y: 0 })
      setEraserStrokes([])
      setEraserEnabled(false)
      setActiveTab('adjust')
      setStatusMessage(`裁剪完成，当前照片为 ${width} × ${height}px。`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '裁剪失败，请重试。')
    }
  }

  const canvasToBlob = (canvas: HTMLCanvasElement, mime: string, quality: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('图片导出失败，请尝试 PNG 格式。'))), mime, quality)
    })

  const saveSinglePhoto = async () => {
    try {
      setErrorMessage('')
      setStatusMessage('')
      const width = preset.pixelWidth
      const height = preset.pixelHeight
      const canvas = getOutputCanvas(width, height, activeTab === 'crop')
      const mime = format === 'jpeg' ? 'image/jpeg' : `image/${format}`
      const blob = await canvasToBlob(canvas, mime, 0.94)
      const photoName = imageName || translate(language, '证件照')
      downloadBlob(blob, `${photoName}-${translate(language, preset.name)}.${format === 'jpeg' ? 'jpg' : format}`)
      setStatusMessage(`已导出 ${preset.name}（${width} × ${height}px）。`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '导出失败，请重试。')
    }
  }

  const baseSheet = paperSize === 'custom'
    ? { name: '自定义相纸', width: customPaperWidth, height: customPaperHeight }
    : paperPresets[paperSize]
  const sheet = paperOrientation === 'landscape'
    ? { name: baseSheet.name, width: Math.max(baseSheet.width, baseSheet.height), height: Math.min(baseSheet.width, baseSheet.height) }
    : { name: baseSheet.name, width: Math.min(baseSheet.width, baseSheet.height), height: Math.max(baseSheet.width, baseSheet.height) }
  const gap = 2
  const photoWidthMm = sizeUnit === 'px' ? (preset.pixelWidth * 25.4) / PRINT_DPI : preset.width * mmPerUnit(sizeUnit)
  const photoHeightMm = sizeUnit === 'px' ? (preset.pixelHeight * 25.4) / PRINT_DPI : preset.height * mmPerUnit(sizeUnit)
  const presetWidthMm = photoWidthMm
  const presetHeightMm = photoHeightMm
  const photoWidthPx = preset.pixelWidth
  const photoHeightPx = preset.pixelHeight
  const columns = Math.max(1, Math.floor((sheet.width + gap) / (photoWidthMm + gap)))
  const rows = Math.max(1, Math.floor((sheet.height + gap) / (photoHeightMm + gap)))
  const printCount = columns * rows
  const packedWidthMm = columns * photoWidthMm + (columns - 1) * gap
  const packedHeightMm = rows * photoHeightMm + (rows - 1) * gap
  const gridWidthPercent = (packedWidthMm / sheet.width) * 100
  const gridHeightPercent = (packedHeightMm / sheet.height) * 100

  const savePhotoSheet = async () => {
    try {
      setErrorMessage('')
      setStatusMessage('')
      const dpi = PRINT_DPI
      const canvas = document.createElement('canvas')
      canvas.width = Math.round((sheet.width / 25.4) * dpi)
      canvas.height = Math.round((sheet.height / 25.4) * dpi)
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('浏览器无法创建排版画布。')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      const photoWidth = photoWidthPx
      const photoHeight = photoHeightPx
      const gapPx = Math.round((gap / 25.4) * dpi)
      const packedWidthPx = columns * photoWidth + (columns - 1) * gapPx
      const packedHeightPx = rows * photoHeight + (rows - 1) * gapPx
      const startX = Math.floor((canvas.width - packedWidthPx) / 2)
      const startY = Math.floor((canvas.height - packedHeightPx) / 2)
      const photo = getOutputCanvas(photoWidth, photoHeight, false)
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          context.drawImage(photo, startX + column * (photoWidth + gapPx), startY + row * (photoHeight + gapPx))
        }
      }
      const mime = format === 'jpeg' ? 'image/jpeg' : `image/${format}`
      const blob = await canvasToBlob(canvas, mime, 0.94)
      const photoName = imageName || translate(language, '证件照')
      const orientation = paperOrientation === 'landscape' ? '横向' : '纵向'
      downloadBlob(blob, `${photoName}-${translate(language, sheet.name)}-${translate(language, orientation)}-${translate(language, '排版')}.${format === 'jpeg' ? 'jpg' : format}`)
      setStatusMessage(`已导出${sheet.name}${paperOrientation === 'landscape' ? '横向' : '纵向'}排版，共 ${printCount} 张。`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '排版导出失败，请重试。')
    }
  }

  const resetAdjustments = () => {
    pushHistory()
    setAdjustments({ hue: 0, warmth: 0, brightness: 100, contrast: 100 })
    setKeyColor(null)
    setBackground('#ffffff')
    setTolerance(18)
    setEraserStrokes([])
    setEraserEnabled(false)
  }

  const updateAdjustment = (key: keyof Adjustments, value: number) =>
    setAdjustments((current) => ({ ...current, [key]: value }))

  const selectTab = (tab: TabId) => {
    if (sourceImage && tab !== 'crop' && !cropCommitted) {
      setErrorMessage('请先在“裁剪尺寸”中点击“确定裁剪”，再进行照片调整或相纸排版。')
      return
    }
    setErrorMessage('')
    setActiveTab(tab)
    setPickingColor(false)
    setEraserEnabled(false)
  }

  const changeSizeUnit = (unit: SizeUnit) => {
    if (unit === sizeUnit) return
    pushHistory()
    const conversion = mmPerUnit(sizeUnit) / mmPerUnit(unit)
    const precision = unit === 'px' ? 0 : unit === 'mm' ? 1 : 2
    setCustomWidth((value) => Math.max(1, Number((value * conversion).toFixed(precision))))
    setCustomHeight((value) => Math.max(1, Number((value * conversion).toFixed(precision))))
    setSizeUnit(unit)
    setCropCommitted(false)
  }

  const changePreset = (id: PresetId) => {
    if (presetId !== id) pushHistory()
    setPresetId(id)
    if (id !== presetId) setCropCommitted(false)
  }

  const handleImageDragStart = () => {
    pushHistory()
    setCropCommitted(false)
  }

  const handleImageDrag = (event: KonvaEventObject<DragEvent>) => {
    setImagePosition({
      x: event.target.x() - stageSize.width / 2,
      y: event.target.y() - stageSize.height / 2,
    })
  }

  const handleRangeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) pushHistory()
  }

  const handleLanguageMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setIsLanguageMenuOpen(false)
      languageButtonRef.current?.focus()
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || !(event.target instanceof HTMLButtonElement)) return

    const items = Array.from(languageMenuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])
    const currentIndex = items.indexOf(event.target)
    if (currentIndex < 0 || items.length === 0) return
    event.preventDefault()
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
    items[nextIndex]?.focus()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDraggingFile(false)
    setPhotoFile(event.dataTransfer.files[0])
  }

  const tabButtons: { id: TabId; label: string; icon: 'crop' | 'sliders' | 'grid' }[] = [
    { id: 'crop', label: '裁剪尺寸', icon: 'crop' },
    { id: 'adjust', label: '照片调整', icon: 'sliders' },
    { id: 'layout', label: '相纸排版', icon: 'grid' },
  ]

  return (
    <Localized language={language}>
      <div className="app-shell">
        <header className="topbar">
          <a className="brand" href="#" aria-label="证件照工坊首页">
            <span className="brand-mark"><Icon name="image" /></span>
            <span>照相<span className="brand-light">馆</span></span>
            <span className="brand-divider" />
            <span className="brand-caption">证件照工坊</span>
          </a>
          <div className="header-note"><span className="privacy-dot" /> 图片仅在本地处理，不会上传</div>
          <div className="header-actions">
            <div className="language-menu" ref={languageMenuRef} onKeyDown={handleLanguageMenuKeyDown}>
              <button
                ref={languageButtonRef}
                className="language-trigger"
                type="button"
                aria-label="选择语言"
                aria-haspopup="menu"
                aria-expanded={isLanguageMenuOpen}
                aria-controls="language-menu"
                onClick={() => setIsLanguageMenuOpen((open) => !open)}
              >
                <Icon name="language" />
              </button>
              {isLanguageMenuOpen && (
                <div className="language-options" id="language-menu" role="menu" aria-label="选择语言">
                  {languages.map((item) => (
                    <button
                      key={item.code}
                      className="language-option"
                      type="button"
                      role="menuitemradio"
                      aria-checked={language === item.code}
                      onClick={() => {
                        setLanguage(item.code)
                        setIsLanguageMenuOpen(false)
                        languageButtonRef.current?.focus()
                      }}
                    >
                      <span>{item.label}</span>
                      {language === item.code && <span className="language-check" aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="header-open" type="button" onClick={openFilePicker}>
              <Icon name="upload" /> 打开照片
            </button>
          </div>
        </header>

      <main className="main-content">
        <section className="workspace">
          <div className="workspace-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> STUDIO <span>·</span> 证件照制作</div>
              <h1>把日常照片，变成<span>专业证件照</span></h1>
              <p>选照片、调尺寸、换底色，一张照片轻松搞定。</p>
            </div>
            <div className="step-indicator">
              <span className="step-active">01 <small>编辑</small></span><i />
              <span>02 <small>排版</small></span><i />
              <span>03 <small>下载</small></span>
            </div>
          </div>

          <div className={`editor-card ${isDraggingFile ? 'dragging-file' : ''}`} onDragOver={(event) => { event.preventDefault(); setIsDraggingFile(true) }} onDragLeave={() => setIsDraggingFile(false)} onDrop={handleDrop}>
            <div className="editor-toolbar">
              <div className="toolbar-tabs" role="tablist" aria-label="编辑工具">
                {tabButtons.map((tab) => (
                  <button key={tab.id} className={`toolbar-tab ${activeTab === tab.id ? 'selected' : ''}`} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => selectTab(tab.id)}>
                    <Icon name={tab.icon} /> {tab.label}
                  </button>
                ))}
              </div>
              <div className="canvas-hint"><span className="hint-dot" />{!sourceImage ? '等待添加照片' : eraserEnabled ? '在照片上拖动以擦除背景' : pickingColor ? '点击照片背景取色' : activeTab === 'crop' ? '拖动照片调整位置 · 滚轮缩放' : '在右侧调整照片与背景'}</div>
            </div>

            <div className="editor-body">
              <div className="canvas-column">
                <div
                  className="canvas-wrap"
                  ref={stageContainerRef}
                  style={{ cursor: eraserEnabled ? 'none' : pickingColor ? 'crosshair' : undefined }}
                  onMouseMove={eraserEnabled ? updateEraserCursor : undefined}
                  onMouseLeave={eraserEnabled ? () => setEraserCursor((current) => current.visible ? { ...current, visible: false } : current) : undefined}
                >
                  <div className="canvas-zoom-controls" aria-label="画布缩放">
                    <button type="button" aria-label="缩小画布" onClick={() => changeCanvasZoom(canvasZoom - 0.25)} disabled={canvasZoom <= 0.5}>−</button>
                    <select aria-label="画布缩放比例" value={canvasZoom} onChange={(event) => changeCanvasZoom(Number(event.target.value))}>
                      <option value={0.5}>50%</option>
                      <option value={0.75}>75%</option>
                      <option value={1}>100%</option>
                      <option value={1.25}>125%</option>
                      <option value={1.5}>150%</option>
                      <option value={2}>200%</option>
                    </select>
                    <button type="button" aria-label="放大画布" onClick={() => changeCanvasZoom(canvasZoom + 0.25)} disabled={canvasZoom >= 2}>＋</button>
                  </div>
                  {sourceImage ? (
                    <div className="canvas-stage-zoom" style={{ transform: `scale(${canvasZoom})` }}>
                      <Stage
                        ref={stageRef}
                        width={stageSize.width}
                        height={stageSize.height}
                        onWheel={handleWheel}
                        onClick={pickingColor ? sampleBackground : undefined}
                        onTap={pickingColor ? sampleBackground : undefined}
                        onMouseDown={startEraserStroke}
                        onMouseMove={continueEraserStroke}
                        onMouseUp={finishEraserStroke}
                        onMouseLeave={() => {
                          finishEraserStroke()
                          setEraserCursor((current) => current.visible ? { ...current, visible: false } : current)
                        }}
                        onTouchStart={startEraserStroke}
                        onTouchMove={continueEraserStroke}
                        onTouchEnd={finishEraserStroke}
                      >
                        <Layer>
                        <KonvaImage
                          ref={imageNodeRef}
                          image={sourceImage}
                          x={imageX + drawnWidth / 2}
                          y={imageY + drawnHeight / 2}
                          width={drawnWidth}
                          height={drawnHeight}
                          offsetX={drawnWidth / 2}
                          offsetY={drawnHeight / 2}
                          rotation={rotation}
                          filters={[photoFilter]}
                          draggable={!pickingColor && activeTab === 'crop'}
                          dragBoundFunc={clampImagePosition}
                          onDragStart={handleImageDragStart}
                          onDragMove={handleImageDrag}
                          onDragEnd={handleImageDrag}
                        />
                        {activeTab !== 'crop' && (
                          <Group
                            x={imageX + drawnWidth / 2}
                            y={imageY + drawnHeight / 2}
                            rotation={rotation}
                            clipX={-drawnWidth / 2}
                            clipY={-drawnHeight / 2}
                            clipWidth={drawnWidth}
                            clipHeight={drawnHeight}
                            listening={false}
                          >
                            {eraserStrokes.flatMap((stroke, strokeIndex) => stroke.paths.map((path, pathIndex) => {
                              const points = path.reduce<number[]>((mapped, value, pointIndex) => {
                                if (pointIndex % 2 === 0) mapped.push(-drawnWidth / 2 + value * drawnWidth)
                                else mapped.push(-drawnHeight / 2 + value * drawnHeight)
                                return mapped
                              }, [])
                              const strokeWidth = stroke.width * drawnWidth
                              return points.length === 2 ? (
                                <Circle key={`erase-${strokeIndex}-${pathIndex}`} x={points[0]} y={points[1]} radius={strokeWidth / 2} fill={background} listening={false} />
                              ) : (
                                <Line key={`erase-${strokeIndex}-${pathIndex}`} points={points} stroke={background} strokeWidth={strokeWidth} lineCap="round" lineJoin="round" listening={false} />
                              )
                            }))}
                          </Group>
                        )}
                        {activeTab === 'crop' && (
                          <>
                            <Rect x={0} y={0} width={stageSize.width} height={frame.y} fill="rgba(13, 17, 26, 0.58)" listening={false} />
                            <Rect x={0} y={frame.y + frame.height} width={stageSize.width} height={stageSize.height - frame.y - frame.height} fill="rgba(13, 17, 26, 0.58)" listening={false} />
                            <Rect x={0} y={frame.y} width={frame.x} height={frame.height} fill="rgba(13, 17, 26, 0.58)" listening={false} />
                            <Rect x={frame.x + frame.width} y={frame.y} width={stageSize.width - frame.x - frame.width} height={frame.height} fill="rgba(13, 17, 26, 0.58)" listening={false} />
                            {Math.abs(rotation) > 0.01 && (
                              <>
                                {[1, 2].map((part) => (
                                  <Fragment key={`grid-${part}`}>
                                    <Line points={[frame.x + (frame.width * part) / 3, frame.y, frame.x + (frame.width * part) / 3, frame.y + frame.height]} stroke="rgba(255,255,255,.65)" strokeWidth={1} dash={[5, 4]} listening={false} />
                                    <Line points={[frame.x, frame.y + (frame.height * part) / 3, frame.x + frame.width, frame.y + (frame.height * part) / 3]} stroke="rgba(255,255,255,.65)" strokeWidth={1} dash={[5, 4]} listening={false} />
                                  </Fragment>
                                ))}
                              </>
                            )}
                            <Rect x={frame.x} y={frame.y} width={frame.width} height={frame.height} stroke="#ffffff" strokeWidth={2} shadowColor="#142033" shadowBlur={8} listening={false} />
                            <Rect x={frame.x + 5} y={frame.y + 5} width={frame.width - 10} height={frame.height - 10} stroke="rgba(255,255,255,.55)" strokeWidth={1} dash={[5, 5]} listening={false} />
                          </>
                        )}
                        </Layer>
                      </Stage>
                    </div>
                  ) : (
                    <button className="empty-upload" type="button" onClick={openFilePicker}>
                      <span className="upload-illustration"><Icon name="image" /><span><Icon name="spark" /></span></span>
                      <strong>从电脑中选择一张照片</strong>
                      <span>或将照片拖到这里</span>
                      <span className="upload-formats">支持 JPG、PNG、WebP</span>
                    </button>
                  )}
                  {eraserEnabled && eraserCursor.visible && (
                    <div
                      className="eraser-cursor"
                      aria-hidden="true"
                      style={{
                        left: eraserCursor.x,
                        top: eraserCursor.y,
                        width: eraserSize * canvasZoom,
                        height: eraserSize * canvasZoom,
                      }}
                    />
                  )}
                  {pickingColor && sourceImage && <div className="sample-tip">点击照片背景取色 <button type="button" onClick={() => setPickingColor(false)}>取消</button></div>}
                </div>
                <div className="canvas-footer">
                  <span>{sourceImage ? <><span className="status-dot" />{imageName}</> : '图片在你的设备中安全处理'}</span>
                  {sourceImage && <span>{sourceImage.naturalWidth} × {sourceImage.naturalHeight}px <b>·</b> {activeTab === 'crop' ? '裁剪预览' : '当前裁剪照片'} {preset.width} × {preset.height} {sizeUnit}</span>}
                </div>
              </div>

              <aside className="side-panel">
                {activeTab === 'crop' && (
                  <div className="panel-content">
                    <div className="panel-title-row"><div><h2>选择证件照尺寸</h2><p>常用规格，精准裁切</p></div><span className="panel-step">01</span></div>
                    <div className="unit-picker" role="group" aria-label="尺寸单位">
                      <span>尺寸单位</span>
                      <div>
                        <button className={sizeUnit === 'mm' ? 'active' : ''} type="button" onClick={() => changeSizeUnit('mm')}>mm</button>
                        <button className={sizeUnit === 'cm' ? 'active' : ''} type="button" onClick={() => changeSizeUnit('cm')}>cm</button>
                        <button className={sizeUnit === 'px' ? 'active' : ''} type="button" onClick={() => changeSizeUnit('px')}>pixel</button>
                      </div>
                    </div>
                    <div className="preset-grid">
                      {presets.map((item) => (
                        <button className={`preset-card ${presetId === item.id ? 'active' : ''}`} type="button" key={item.id} onClick={() => changePreset(item.id)}>
                          <span className={`preset-silhouette ${item.id}`} />
                          <span className="preset-label">{item.name}</span>
                          <span className="preset-size">{sizeUnit === 'px' ? item.pixelWidth : getPresetWidth(item, sizeUnit)} × {sizeUnit === 'px' ? item.pixelHeight : getPresetHeight(item, sizeUnit)} {sizeUnit}</span>
                          {presetId === item.id && <span className="preset-check">✓</span>}
                        </button>
                      ))}
                    </div>
                    <div className="preset-usage"><strong>{preset.name}</strong><span>{preset.usage}</span><small>{(presetWidthMm / 10).toFixed(1)} × {(presetHeightMm / 10).toFixed(1)} cm · {preset.pixelWidth} × {preset.pixelHeight} px</small></div>
                    <button className={`custom-size-toggle ${presetId === 'custom' ? 'active' : ''}`} type="button" onClick={() => changePreset('custom')}>
                      <span className="custom-icon">＋</span><span>自定义尺寸</span><span className="custom-arrow">›</span>
                    </button>
                    {presetId === 'custom' && (
                      <div className="custom-fields">
                        <label>宽度<input type="number" min="1" step={sizeUnit === 'px' ? 1 : 'any'} max={sizeUnit === 'px' ? 5000 : sizeUnit === 'cm' ? 10 : 100} value={customWidth} onFocus={pushHistory} onChange={(event) => { setCustomWidth(clamp(Number(event.target.value) || 1, 1, sizeUnit === 'px' ? 5000 : sizeUnit === 'cm' ? 10 : 100)); setCropCommitted(false) }} /> <span>{sizeUnit}</span></label>
                        <label>高度<input type="number" min="1" step={sizeUnit === 'px' ? 1 : 'any'} max={sizeUnit === 'px' ? 7000 : sizeUnit === 'cm' ? 14 : 140} value={customHeight} onFocus={pushHistory} onChange={(event) => { setCustomHeight(clamp(Number(event.target.value) || 1, 1, sizeUnit === 'px' ? 7000 : sizeUnit === 'cm' ? 14 : 140)); setCropCommitted(false) }} /> <span>{sizeUnit}</span></label>
                      </div>
                    )}
                    <div className="control-block">
                      <div className="control-label"><span>裁剪区域</span><strong>{preset.width} × {preset.height} <small>{sizeUnit}</small></strong></div>
                      <input className="range-input" aria-label="裁剪框大小" type="range" min="0.55" max="1" step="0.01" value={frameScale} onPointerDown={pushHistory} onKeyDown={handleRangeKeyDown} onChange={(event) => { setFrameScale(Number(event.target.value)); setCropCommitted(false) }} />
                      <div className="range-ends"><span>较小</span><span>较大</span></div>
                    </div>
                    <div className="control-block zoom-control">
                      <div className="control-label"><span>照片缩放</span><strong>{Math.round((effectiveZoom / minimumZoom) * 100)}%</strong></div>
                      <input className="range-input" aria-label="照片缩放" type="range" min={minimumZoom} max={Math.max(minimumZoom + 0.01, 4)} step="0.01" value={effectiveZoom} onPointerDown={pushHistory} onKeyDown={handleRangeKeyDown} onChange={(event) => updateZoom(Number(event.target.value))} disabled={!sourceImage} />
                      <div className="range-ends"><span>−</span><span>＋</span></div>
                    </div>
                    <div className="control-block rotation-control">
                      <div className="control-label"><span>旋转微调</span><strong>{rotation > 0 ? '+' : ''}{rotation.toFixed(1)}°</strong></div>
                      <input className="range-input" aria-label="旋转角度" type="range" min="-15" max="15" step="0.1" value={rotation} onPointerDown={pushHistory} onKeyDown={handleRangeKeyDown} onChange={(event) => { setRotation(Number(event.target.value)); setCropCommitted(false) }} disabled={!sourceImage} />
                      <div className="range-ends"><span>−15°</span><button type="button" onClick={() => { pushHistory(); setRotation(0); setCropCommitted(false) }}>归零</button><span>+15°</span></div>
                    </div>
                    <div className="panel-tip"><span>✦</span> 拖动照片调整构图；旋转时显示网格辅助对齐。</div>
                  </div>
                )}

                {activeTab === 'adjust' && (
                  <div className="panel-content">
                    <div className="panel-title-row"><div><h2>照片精细调整</h2><p>自然肤色，清晰呈现</p></div><span className="panel-step">02</span></div>
                    <div className="adjustment-controls">
                      {([
                        { key: 'hue', label: '色相', min: -180, max: 180, value: adjustments.hue, unit: '°' },
                        { key: 'warmth', label: '色温', min: -50, max: 50, value: adjustments.warmth, unit: '' },
                        { key: 'brightness', label: '亮度', min: 50, max: 150, value: adjustments.brightness, unit: '%' },
                        { key: 'contrast', label: '色阶 / 对比度', min: 50, max: 150, value: adjustments.contrast, unit: '%' },
                      ] as const).map((control) => (
                        <div className="control-block adjust-control" key={control.key}>
                          <div className="control-label"><span>{control.label}</span><strong>{control.value}{control.unit}</strong></div>
                          <input className="range-input" aria-label={control.label} type="range" min={control.min} max={control.max} value={control.value} onPointerDown={pushHistory} onKeyDown={handleRangeKeyDown} onChange={(event) => updateAdjustment(control.key, Number(event.target.value))} disabled={!sourceImage} />
                          <div className="range-ends"><span>{control.key === 'warmth' ? '冷色' : control.key === 'hue' ? '−' : '−'}</span><span>{control.key === 'warmth' ? '暖色' : '+'}</span></div>
                        </div>
                      ))}
                    </div>
                    <div className="panel-divider" />
                    <div className="panel-title-row background-title"><div><h2>证件照底色</h2><p>采样原背景后替换为标准底色</p></div></div>
                    <div className="background-swatches">
                      {backgroundColors.map((color) => (
                        <button key={color.value} className={`swatch-option ${background === color.value ? 'active' : ''}`} type="button" onClick={() => { pushHistory(); setBackground(color.value) }} disabled={!sourceImage} aria-label={`${color.name}背景`}>
                          <span style={{ backgroundColor: color.value }} />{color.name}
                        </button>
                      ))}
                      <label className={`swatch-option custom-swatch ${backgroundColors.some((color) => color.value === background) ? '' : 'active'}`}>
                        <span style={{ backgroundColor: background }} />
                        自定义
                        <input
                          type="color"
                          aria-label="自定义背景颜色"
                          value={background}
                          onPointerDown={pushHistory}
                          onKeyDown={pushHistory}
                          onChange={(event) => setBackground(event.target.value)}
                          disabled={!sourceImage}
                        />
                      </label>
                    </div>
                    <button className={`sample-button ${pickingColor ? 'active' : ''}`} type="button" onClick={() => { setEraserEnabled(false); setPickingColor(true); setActiveTab('adjust') }} disabled={!sourceImage}>
                      <svg aria-hidden="true" className="eyedropper" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m14 6 4 4M4 20l5.2-1.1L19 9.1a2.1 2.1 0 0 0-3-3L6.2 15.9 4 20Z" />
                      </svg>{pickingColor ? '请点击照片中的背景' : keyColor ? '重新采样背景颜色' : '点击照片，采样原背景'} <span>↗</span>
                    </button>
                    {keyColor && (
                      <div className="tolerance-control">
                        <div className="control-label"><span>背景识别宽容度</span><strong>{tolerance}</strong></div>
                        <input className="range-input" aria-label="背景识别宽容度" type="range" min="1" max="60" value={tolerance} onPointerDown={pushHistory} onKeyDown={handleRangeKeyDown} onChange={(event) => setTolerance(Number(event.target.value))} />
                        <p className="fine-print">仅替换与照片边缘连通的背景区域，并限制最大识别色差；调高可包含光照不均的背景。</p>
                      </div>
                    )}
                    <div className="manual-erase">
                      <button
                        className={`erase-button ${eraserEnabled ? 'active' : ''}`}
                        type="button"
                        aria-pressed={eraserEnabled}
                        onClick={() => { setPickingColor(false); setEraserEnabled((enabled) => !enabled) }}
                        disabled={!sourceImage}
                      >
                        <span className="erase-icon">⌁</span>{eraserEnabled ? '结束手动擦除' : '手动擦除背景'}
                      </button>
                      {eraserEnabled && (
                        <div className="eraser-options">
                          <div className="control-label"><span>画笔大小</span><strong>{eraserSize} px</strong></div>
                          <input className="range-input" aria-label="手动擦除画笔大小" type="range" min="8" max="80" step="1" value={eraserSize} onChange={(event) => setEraserSize(Number(event.target.value))} />
                          <p className="fine-print">在照片上拖动，涂抹区域将替换为当前证件照底色。</p>
                        </div>
                      )}
                      {eraserStrokes.length > 0 && (
                        <button className="clear-erase-button" type="button" onClick={() => { pushHistory(); setEraserStrokes([]) }}>清除手动擦除</button>
                      )}
                    </div>
                    <button className="reset-button" type="button" onClick={resetAdjustments}>恢复默认调整</button>
                  </div>
                )}

                {activeTab === 'layout' && (
                  <div className="panel-content layout-panel">
                    <div className="panel-title-row"><div><h2>相纸自动排版</h2><p>打印前预览，一张多用</p></div><span className="panel-step">03</span></div>
                    <div className="field-label">选择相纸规格</div>
                    <div className="paper-select">
                      {([
                        { id: '5' as const, label: '5 寸相纸', dimensions: '127 × 89 mm' },
                        { id: '6' as const, label: '6 寸相纸', dimensions: '152 × 102 mm' },
                        { id: '7' as const, label: '7 寸相纸', dimensions: '178 × 127 mm' },
                        { id: 'a4' as const, label: 'A4 纸', dimensions: '210 × 297 mm' },
                        { id: 'custom' as const, label: '自定义', dimensions: '自设纸张尺寸' },
                      ]).map((paper) => (
                        <button className={paperSize === paper.id ? 'active' : ''} type="button" key={paper.id} onClick={() => setPaperSize(paper.id)}>
                          <span className={`paper-icon ${paper.id}`} />
                          <span><strong>{paper.label}</strong><small>{paper.dimensions}</small></span>
                          {paperSize === paper.id && <i>✓</i>}
                        </button>
                      ))}
                    </div>
                    {paperSize === 'custom' && (
                      <div className="paper-custom-fields">
                        <label>宽<input type="number" min="30" max="300" value={customPaperWidth} onChange={(event) => setCustomPaperWidth(clamp(Number(event.target.value) || 30, 30, 300))} />mm</label>
                        <label>高<input type="number" min="30" max="300" value={customPaperHeight} onChange={(event) => setCustomPaperHeight(clamp(Number(event.target.value) || 30, 30, 300))} />mm</label>
                      </div>
                    )}
                    <div className="orientation-picker" role="group" aria-label="相纸方向">
                      <span>相纸方向</span>
                      <div>
                        <button className={paperOrientation === 'landscape' ? 'active' : ''} type="button" onClick={() => setPaperOrientation('landscape')}>横向</button>
                        <button className={paperOrientation === 'portrait' ? 'active' : ''} type="button" onClick={() => setPaperOrientation('portrait')}>纵向</button>
                      </div>
                    </div>
                    <div className="paper-preview-wrap">
                      <div className="paper-preview" style={{ aspectRatio: `${sheet.width} / ${sheet.height}` }}>
                        <div
                          className="paper-photos"
                          style={{
                            width: `${gridWidthPercent}%`,
                            height: `${gridHeightPercent}%`,
                            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                            columnGap: `${(gap / sheet.width) * 100}%`,
                            rowGap: `${(gap / sheet.height) * 100}%`,
                          }}
                        >
                          {Array.from({ length: printCount }).map((_, index) => (
                            <span key={index} className="paper-photo" style={{ aspectRatio: `${preset.width} / ${preset.height}` }}>
                              {sourceImage && <img src={imageUrl} alt="" style={{ filter: cssFilter(adjustments) }} />}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="preview-caption">{sheet.name} · {paperOrientation === 'landscape' ? '横向' : '纵向'}预览</span>
                    </div>
                    <div className="layout-summary"><span>自动排列</span><strong>{translate(language, `${columns} 列 × ${rows} 行 · 共 ${printCount} 张`)}</strong></div>
                    <div className="layout-summary"><span>照片间距</span><strong>{gap} mm <i>·</i> 整体居中</strong></div>
                    <div className="panel-tip"><span>✦</span> 像素按 300 DPI 计算，冲印时请使用“实际尺寸”。</div>
                  </div>
                )}
              </aside>
            </div>

            <div className="editor-bottom">
              <div className="export-options">
                {(activeTab === 'crop' || activeTab === 'adjust') && (
                  <button className="undo-button" type="button" onClick={undo} disabled={history.length === 0} title="撤销上一步">
                    <Icon name="undo" />撤销
                  </button>
                )}
                <span>导出格式</span>
                <select aria-label="图片导出格式" value={format} onChange={(event) => setFormat(event.target.value as 'png' | 'jpeg' | 'webp')}>
                  <option value="png">PNG</option><option value="jpeg">JPG</option><option value="webp">WebP</option>
                </select>
                <span className="export-separator" />
                <span className="resolution-tag">高清 · 按 300 DPI 计算</span>
              </div>
              <div className="export-actions">
                {(activeTab === 'crop' || activeTab === 'layout') && (
                  <button className="secondary-button" type="button" onClick={saveSinglePhoto} disabled={!sourceImage}><Icon name="download" />下载证件照</button>
                )}
                <button className="primary-button" type="button" onClick={activeTab === 'crop' ? confirmCrop : activeTab === 'layout' ? savePhotoSheet : saveSinglePhoto} disabled={!sourceImage}>
                  {activeTab === 'crop' ? '确定裁剪' : activeTab === 'layout' ? '下载排版照片' : '下载证件照'}<span>→</span>
                </button>
              </div>
            </div>
          </div>

          {(errorMessage || statusMessage) && (
            <div className={`notice ${errorMessage ? 'error' : 'success'}`} role={errorMessage ? 'alert' : 'status'}>
              <span>{errorMessage ? '!' : '✓'}</span>{errorMessage || statusMessage}
              <button type="button" aria-label="关闭提示" onClick={() => { setErrorMessage(''); setStatusMessage('') }}>×</button>
            </div>
          )}

          <div className="trust-row">
            <span><b>✳</b> 本地处理，照片不上传</span><i />
            <span><b>⌁</b> 支持常用图片格式</span><i />
            <span><b>◎</b> 按 300 DPI 计算像素尺寸</span>
          </div>
        </section>
      </main>

      <footer className="footer"><span>照相馆 <b>·</b> 让每一张证件照都刚刚好</span><span>免费使用 <b>·</b> 无需注册</span></footer>
        <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setPhotoFile(event.target.files?.[0]); event.currentTarget.value = '' }} />
      </div>
    </Localized>
  )
}

export default App
