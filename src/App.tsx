import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  FolderCode,
  Download,
  Play,
  FileCheck,
  Smartphone,
  Copy,
  Check,
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Key,
  HelpCircle,
  Maximize2,
  RefreshCw,
  Image as ImageIcon,
  Sliders,
  Award
} from 'lucide-react';
import { PROJECT_FILES, generateAndroidZip, FileEntry } from './projectData';
import { simulateTargetCompression, simulateQualityCompression } from './compressionEngine';
import { CompressionResult } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'github' | 'admob' | 'troubleshoot'>('simulator');
  const [selectedFileIndex, setSelectedFileIndex] = useState(8); // Default to ImageCompressor.kt
  const [copiedFile, setCopiedFile] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Simulator state
  const [simFile, setSimFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [targetSizeKB, setTargetSizeKB] = useState(100);
  const [qualityMode, setQualityMode] = useState<'target' | 'quality'>('target');
  const [qualitySlider, setQualitySlider] = useState(80);
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger sample image for quick testing
  const loadSampleImage = async () => {
    try {
      const response = await fetch('https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&q=90');
      const blob = await response.blob();
      const file = new File([blob], 'sample_art.jpg', { type: 'image/jpeg' });
      setSimFile(file);
      setPreviewSrc(URL.createObjectURL(file));
      setResult(null);
    } catch (_e) {
      // Fallback
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 1600, 1200);
        gradient.addColorStop(0, '#4F46E5');
        gradient.addColorStop(0.5, '#06B6D4');
        gradient.addColorStop(1, '#EC4899');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1600, 1200);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 64px sans-serif';
        ctx.fillText('Sample Test Photograph', 100, 300);
        canvas.toBlob((b) => {
          if (b) {
            const file = new File([b], 'test_pattern.jpg', { type: 'image/jpeg' });
            setSimFile(file);
            setPreviewSrc(URL.createObjectURL(file));
          }
        });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSimFile(file);
      setPreviewSrc(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleRunCompression = async () => {
    if (!simFile) return;
    setIsCompressing(true);
    setProgress(10);
    try {
      let res: CompressionResult;
      if (qualityMode === 'target') {
        res = await simulateTargetCompression(simFile, targetSizeKB, format, (p) => setProgress(p));
      } else {
        res = await simulateQualityCompression(simFile, qualitySlider, format);
      }
      setResult(res);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } catch (err: any) {
      alert('Compression error: ' + err.message);
    } finally {
      setIsCompressing(false);
      setProgress(100);
    }
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zipBlob = await generateAndroidZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ImageCompressor-Android-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      alert('Failed to generate ZIP');
    } finally {
      setIsZipping(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const filteredFiles = PROJECT_FILES.filter((f) => {
    const matchesCat = activeCategory === 'All' || f.category === activeCategory;
    const matchesSearch = f.path.toLowerCase().includes(searchQuery.toLowerCase()) || f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const currentFile = PROJECT_FILES[selectedFileIndex] || PROJECT_FILES[0];

  const formatSize = (bytes: number) => {
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(1)} KB`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Image Compressor & Converter
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Native Android 14 (API 34)
              </span>
            </div>
            <p className="text-xs text-slate-400">Jetpack Compose • Room • AdMob • Binary Search</p>
          </div>
        </div>

        {/* Global Action: 1-Click ZIP Download */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isZipping ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Android Project (.ZIP)
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-slate-800 bg-slate-900/40 px-4 lg:px-8 flex overflow-x-auto gap-2 py-2">
        {[
          { id: 'simulator', label: 'Live Compression Simulator', icon: Play },
          { id: 'code', label: 'Android Source Files (28 Files)', icon: FolderCode },
          { id: 'github', label: 'GitHub CI/CD & APK Guide', icon: FileCheck },
          { id: 'admob', label: 'AdMob & Keystore Setup', icon: ShieldCheck },
          { id: 'troubleshoot', label: 'Troubleshooting & FAQ', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab 1: Live Interactive Simulator */}
      {activeTab === 'simulator' && (
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                1. Select Image
              </h2>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {previewSrc ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video flex items-center justify-center group">
                  <img src={previewSrc} alt="Selected" className="max-h-full max-w-full object-contain" />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Change Photo
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-slate-900/90 px-2.5 py-1 rounded text-xs text-slate-300">
                    {simFile?.name} ({simFile ? formatSize(simFile.size) : ''})
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-950/40"
                >
                  <ImageIcon className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-200">Click to upload photo</p>
                  <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP, HEIC</p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={loadSampleImage}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load Sample Art Photo
                </button>
                {simFile && (
                  <button
                    onClick={() => {
                      setSimFile(null);
                      setPreviewSrc('');
                      setResult(null);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Algorithm Settings */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                2. Compression Algorithm
              </h2>

              {/* Mode switch */}
              <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  onClick={() => setQualityMode('target')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    qualityMode === 'target'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🎯 Target Size (KB)
                </button>
                <button
                  onClick={() => setQualityMode('quality')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    qualityMode === 'quality'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🎚️ Manual Quality %
                </button>
              </div>

              {qualityMode === 'target' ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-300">Target Size:</label>
                    <span className="text-sm font-extrabold text-cyan-400 font-mono">
                      {targetSizeKB >= 1024 ? `${(targetSizeKB / 1024).toFixed(1)} MB` : `${targetSizeKB} KB`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={1000}
                    step={10}
                    value={targetSizeKB}
                    onChange={(e) => setTargetSizeKB(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="grid grid-cols-5 gap-1.5 mt-2">
                    {[50, 100, 200, 500, 1024].map((kb) => (
                      <button
                        key={kb}
                        onClick={() => setTargetSizeKB(kb)}
                        className={`py-1 text-xs rounded border transition-all cursor-pointer ${
                          targetSizeKB === kb
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {kb >= 1024 ? '1 MB' : `${kb}K`}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-300">Quality Percentage:</label>
                    <span className="text-sm font-extrabold text-indigo-400 font-mono">{qualitySlider}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={qualitySlider}
                    onChange={(e) => setQualitySlider(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>10% (Maximum compression)</span>
                    <span>100% (High fidelity)</span>
                  </div>
                </div>
              )}

              {/* Format selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Output Format:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'jpeg', label: 'JPEG', desc: 'Standard' },
                    { id: 'webp', label: 'WEBP', desc: 'Optimal' },
                    { id: 'png', label: 'PNG', desc: 'Lossless' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setFormat(fmt.id as any)}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        format === fmt.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs">{fmt.label}</div>
                      <div className="text-[10px] text-slate-500">{fmt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Run Action */}
              <button
                onClick={handleRunCompression}
                disabled={!simFile || isCompressing}
                className="mt-2 w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCompressing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Compressing ({progress}%)…</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Execute Compression Algorithm</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results & Inspection Column */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {result ? (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-400" />
                      Target Size Met!
                    </h3>
                    <p className="text-xs text-slate-400">
                      Processed via binary search in {result.processingTimeMs}ms ({result.iterations} scale passes)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Saved {(((result.originalSize - result.compressedSize) / result.originalSize) * 100).toFixed(1)}%
                    </span>
                    <a
                      href={result.compressedUrl}
                      download={`compressed_${targetSizeKB}kb.${result.format}`}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Save
                    </a>
                  </div>
                </div>

                {/* Side-by-side Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-400">Original</span>
                      <span className="font-mono text-slate-300 font-bold">{formatSize(result.originalSize)}</span>
                    </div>
                    <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                      <img src={result.originalUrl} alt="Original" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Dimensions: {result.originalWidth} × {result.originalHeight} px
                    </div>
                  </div>

                  {/* Compressed */}
                  <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-3 flex flex-col gap-2 shadow-lg shadow-indigo-500/5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-400">Compressed ({result.format.toUpperCase()})</span>
                      <span className="font-mono text-emerald-400 font-bold">{formatSize(result.compressedSize)}</span>
                    </div>
                    <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                      <img src={result.compressedUrl} alt="Compressed" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">{result.compressedWidth} × {result.compressedHeight} px</span>
                      <span className="text-cyan-400 font-bold">Quality Q{result.quality}</span>
                    </div>
                  </div>
                </div>

                {/* Android Implementation Reference Banner */}
                <div className="p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl flex items-start gap-3">
                  <Layers className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="font-bold text-indigo-200">How the Native Android Kotlin Engine Operates:</p>
                    <p className="text-slate-400 leading-relaxed">
                      In the Android code (<code className="text-indigo-300 font-mono">ImageCompressor.kt</code>), this algorithm runs on{' '}
                      <code className="text-indigo-300 font-mono">Dispatchers.IO</code>, extracts EXIF orientation headers via{' '}
                      <code className="text-indigo-300 font-mono">ExifInterface</code>, and iterates a binary search over quality{' '}
                      <code className="text-indigo-300 font-mono">1..100</code> followed by <code className="text-indigo-300 font-mono">0.8x</code> downsampling.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[380px]">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <Play className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-base font-bold text-slate-200">Compression Engine Ready</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                  Select or upload an image and click "Execute Compression Algorithm" to preview the side-by-side results and test target size limits.
                </p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Tab 2: Android Source Code Explorer */}
      {activeTab === 'code' && (
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6">
          {/* File Tree Sidebar */}
          <div className="w-full lg:w-80 shrink-0 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col h-[750px]">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category filter pills */}
            <div className="flex flex-wrap gap-1 mb-3">
              {['All', 'Root Config', 'App Module', 'Kotlin Source', 'Resources', 'CI/CD Workflow'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredFiles.map((file) => {
                const actualIndex = PROJECT_FILES.findIndex((f) => f.path === file.path);
                const isSelected = actualIndex === selectedFileIndex;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFileIndex(actualIndex)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="font-mono font-medium truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      {file.path}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{file.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col h-[750px] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-100">{currentFile.path}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
                    {currentFile.language}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{currentFile.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(currentFile.content)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedFile ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs text-slate-300 leading-relaxed custom-scrollbar selection:bg-indigo-600/30">
              <pre className="whitespace-pre">{currentFile.content}</pre>
            </div>
          </div>
        </main>
      )}

      {/* Tab 3: GitHub Actions & APK Guide */}
      {activeTab === 'github' && (
        <main className="flex-1 p-4 lg:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mb-2">
              <FileCheck className="w-6 h-6 text-indigo-400" />
              Step-by-Step: Build APK with GitHub Actions
            </h2>
            <p className="text-sm text-slate-400">
              You do not need Android Studio installed locally! GitHub Actions will compile your APK on Ubuntu runners in under 3 minutes.
            </p>

            <div className="mt-6 space-y-6">
              {/* Step 1 */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950">
                <div className="flex items-center gap-2 mb-2 font-bold text-indigo-300 text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
                  Create GitHub Repository & Push Files
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Click the <strong>Download Android Project (.ZIP)</strong> button above, unzip it, and run:
                </p>
                <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-slate-300 space-y-1">
                  <div>git init</div>
                  <div>git add .</div>
                  <div>git commit -m "Initial commit: Production Android Image Compressor"</div>
                  <div>git branch -M main</div>
                  <div>git remote add origin https://github.com/YOUR_USERNAME/image-compressor.git</div>
                  <div>git push -u origin main</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950">
                <div className="flex items-center gap-2 mb-2 font-bold text-cyan-300 text-sm">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-xs">2</span>
                  Watch GitHub Actions Trigger Automatically
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Go to your repository on GitHub and click the <strong className="text-slate-200">Actions</strong> tab. You will see the{' '}
                  <strong className="text-indigo-400">"Build Android APK"</strong> workflow running automatically. It executes:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-400 mt-2 space-y-1 pl-2">
                  <li>JDK 17 setup with Gradle caching</li>
                  <li>Android SDK 34 installation & license auto-acceptance</li>
                  <li>Automatic gradle wrapper generation (<code className="text-slate-300 font-mono">gradle wrapper --gradle-version 8.7</code>)</li>
                  <li><code className="text-slate-300 font-mono">./gradlew assembleDebug</code> compilation</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950">
                <div className="flex items-center gap-2 mb-2 font-bold text-emerald-300 text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                  Download & Install APK on Android Phone
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Once the workflow completes with a green checkmark, scroll down to the <strong className="text-slate-200">Artifacts</strong> section at the bottom of the page.
                </p>
                <div className="mt-3 p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Click <strong>app-debug-apk</strong> to download the zip containing your compiled APK!</span>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Transfer the APK to your phone via USB or WhatsApp/Telegram, open it, and when prompted, click <strong className="text-slate-200">"Settings → Allow from this source"</strong>.
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Tab 4: AdMob & Keystore Setup */}
      {activeTab === 'admob' && (
        <main className="flex-1 p-4 lg:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mb-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              AdMob Integration & Play Store Signing
            </h2>
            <p className="text-sm text-slate-400">
              The project is configured with Google's official verified test Ad Unit IDs. Follow these steps to switch to your real monetized ads and generate release signatures.
            </p>

            <div className="mt-6 space-y-6">
              {/* AdMob Configuration */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950">
                <h3 className="font-bold text-sm text-indigo-300 mb-2">Replacing AdMob Test IDs with Real IDs</h3>
                <ol className="list-decimal list-inside text-xs text-slate-400 space-y-2">
                  <li>Log in to your <strong>Google AdMob Console</strong> (admob.google.com).</li>
                  <li>Click <strong>Apps → Add App → Android</strong>.</li>
                  <li>Create two Ad Units: one <strong>Banner</strong> and one <strong>Interstitial</strong>.</li>
                  <li>
                    Open <code className="text-indigo-300 font-mono">app/src/main/java/com/example/imagecompressor/util/Constants.kt</code> and replace:
                    <div className="bg-slate-900 p-2.5 rounded mt-1 font-mono text-[11px] text-slate-300">
                      const val TEST_ADMOB_BANNER_ID = "ca-app-pub-YOUR_ID/XXXXX"<br />
                      const val TEST_ADMOB_INTERSTITIAL_ID = "ca-app-pub-YOUR_ID/YYYYY"
                    </div>
                  </li>
                  <li>
                    Open <code className="text-indigo-300 font-mono">app/src/main/AndroidManifest.xml</code> and update the metadata:
                    <div className="bg-slate-900 p-2.5 rounded mt-1 font-mono text-[11px] text-slate-300">
                      &lt;meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-YOUR_ID~ZZZZZ" /&gt;
                    </div>
                  </li>
                </ol>
              </div>

              {/* Keystore */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950">
                <h3 className="font-bold text-sm text-cyan-300 mb-2">Generating Signed Release APK / AAB for Play Store</h3>
                <p className="text-xs text-slate-400 mb-2">
                  To sign your APK with a production key for Google Play upload, generate a keystore:
                </p>
                <div className="bg-slate-900 p-3 rounded font-mono text-xs text-slate-300">
                  keytool -genkey -v -keystore release.keystore -alias imagecompressor -keyalg RSA -keysize 2048 -validity 10000
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  In GitHub Actions, you can encode this keystore as base64 and store it in <strong>Settings → Secrets and variables → Actions</strong> as <code className="font-mono text-indigo-300">KEYSTORE_FILE</code>, <code className="font-mono text-indigo-300">KEYSTORE_PASSWORD</code>, and <code className="font-mono text-indigo-300">KEY_ALIAS</code>.
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Tab 5: Troubleshooting & FAQ */}
      {activeTab === 'troubleshoot' && (
        <main className="flex-1 p-4 lg:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mb-4">
              <HelpCircle className="w-6 h-6 text-indigo-400" />
              Common Issues & Solutions
            </h2>

            <div className="space-y-4">
              {[
                {
                  q: "Gradle wrapper missing or './gradlew: No such file or directory'",
                  a: "Our GitHub Actions workflow automatically checks for gradlew and executes 'gradle wrapper --gradle-version 8.7' before running. If building locally, install gradle on your machine once and run 'gradle wrapper --gradle-version 8.7'."
                },
                {
                  q: "Failed to install the following Android SDK packages as some licences have not been accepted",
                  a: "The workflow includes 'yes | sdkmanager --licenses || true' to automatically accept all licenses on headless CI runners."
                },
                {
                  q: "OutOfMemoryError (OOM) when selecting massive 50MP camera photos",
                  a: "In ImageCompressor.kt, we implemented 2-stage bitmap loading: inJustDecodeBounds calculates dimensions first, and if either dimension exceeds 4096px, it calculates optimal inSampleSize power-of-two downsampling before allocating memory."
                },
                {
                  q: "AdMob banner or interstitial not displaying on device",
                  a: "Ensure the device has an active internet connection. On real devices, test ads require Google Play Services. When using test IDs, ads load instantly. When switching to real IDs, newly created AdMob ad units take 2 to 24 hours to begin serving ads."
                },
                {
                  q: "Permission Denied when saving to Gallery on Android 13+",
                  a: "Android 10+ (API 29+) uses the MediaStore API with scoped storage, which requires ZERO storage permissions to insert images into Pictures/ImageCompressor! Legacy permissions are scoped with maxSdkVersion=28."
                }
              ].map((item, idx) => (
                <div key={idx} className="border border-slate-800 rounded-xl p-4 bg-slate-950">
                  <h4 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center text-xs">?</span>
                    {item.q}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed pl-7">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-4 text-center text-xs text-slate-500">
        Production Native Android Project • Jetpack Compose • Material 3 • Kotlin 1.9.23 • Android 14 SDK 34
      </footer>
    </div>
  );
}
