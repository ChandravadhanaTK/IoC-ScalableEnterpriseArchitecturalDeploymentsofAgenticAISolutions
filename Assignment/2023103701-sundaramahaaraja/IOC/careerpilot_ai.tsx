import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Upload, Sparkles, AlertTriangle, CheckCircle2, Copy, 
  Download, RefreshCw, Wand2, Layers, ShieldCheck, Eye, Code, 
  Check, ArrowRight, HelpCircle, FileCheck, Sliders, Scissors,
  Cpu, LayoutGrid, FileType, Zap, ChevronRight, AlertCircle, Info
} from 'lucide-react';

const loadPdfJs = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("PDF.js failed to initialize"));
      }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const extractTextFromPdfBuffer = async (arrayBuffer) => {
  try {
    const pdfjs = await loadPdfJs();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let extractedText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items.map(item => item.str);
      
      // Group items into lines based on layout flow
      let line = '';
      textContent.items.forEach((item) => {
        if (item.hasEOL) {
          line += item.str + '\n';
        } else {
          line += item.str + ' ';
        }
      });

      extractedText += (line.trim() ? line : pageStrings.join(' ')) + '\n\n';
    }

    return extractedText.trim();
  } catch (err) {
    console.error("PDF.js extraction error:", err);
    return null;
  }
};

const purgePdfSyntax = (raw) => {
  if (!raw) return '';
  if (!raw.includes('%PDF') && !raw.includes('endobj') && !raw.includes('stream')) {
    return raw; // Not raw PDF code
  }

  // Extract explicit URLs before purging
  const urls = raw.match(/https?:\/\/[^\s()<>]*/gi) || [];
  const linkedin = raw.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi) || [];
  const github = raw.match(/github\.com\/[a-zA-Z0-9_-]+/gi) || [];

  let text = raw;

  // Remove PDF Object blocks, dictionaries, streams, and structural keywords
  text = text.replace(/%PDF-[\d.]+/g, '');
  text = text.replace(/\d+\s+\d+\s+obj[\s\S]*?endobj/g, ' ');
  text = text.replace(/<[\s\S]*?>/g, ' ');
  text = text.replace(/stream[\s\S]*?endstream/g, ' ');
  text = text.replace(/\b(Type|Catalog|Pages|Page|Resources|Font|Encoding|ProcSet|MediaBox|Contents|Group|Tabs|StructParents|FlateDecode|Length|ViewerPreferences|Metadata|Lang|Parent|Kids|Annots|ExtGState|Subtype|BaseFont|DescendantFonts|ToUnicode|CIDFontType2|CIDSystemInfo|FontDescriptor|Widths|Flags|ItalicAngle|Ascent|Descent|CapHeight|AvgWidth|MaxWidth|FontWeight|XHeight|Leading|StemV|FontBBox|FontFile2|WinAnsiEncoding|Identity-H)\b/g, ' ');
  
  // Clean up printable text fragments
  text = text.replace(/[^\x20-\x7E\n\r\t•]/g, ' ');
  text = text.replace(/\b[0-9]{1,3}\s+[0-9]{1,3}\s+R\b/g, ' ');
  text = text.replace(/\s+/g, ' ');

  let reconstructed = [];
  if (linkedin.length > 0) reconstructed.push(`LinkedIn: https://${linkedin[0]}`);
  if (github.length > 0) reconstructed.push(`GitHub: https://${github[0]}`);
  if (urls.length > 0) reconstructed.push(...urls.map(u => `Link: ${u}`));
  
  if (text.trim().length > 20) {
    reconstructed.push(text.trim());
  }

  return reconstructed.join('\n');
};

const SAMPLE_RESUMES = {
  multiColumn: {
    title: "Jumbled Multi-Column PDF (Sidebar + Main)",
    raw: `ALEX R. MORGAN                       EXPERIENCE
Email: alex.m@techcorp.io | 555-019-2831     Lead Software Engineer | Apex Systems
LinkedIn: linkedin.com/in/alexmorgan         2021 - Present | San Francisco, CA
SKILLS                                       • Spearheaded microservices architecture migration,
• React / Next.js    • Python / FastAPI       reducing latency by 42% across 12 services.
• PostgreSQL         • AWS & Docker          • Managed a cross-functional team of 8 engineers
• GraphQL            • CI/CD Pipelines       using Agile/Scrum methodologies.
EDUCATION                                    Senior Frontend Developer | TechCorp Inc.
B.S. Computer Science                        2018 - 2021 | San Jose, CA
UC Berkeley, 2018                            • Built high-traffic SaaS dashboard handling 5M+
GPA: 3.8 / 4.0                               daily active users using React and Tailwind CSS.
SUMMARY
Passionate engineer with 6+ years building scalable cloud applications and high-performance frontend interfaces.`
  },
  brokenPdf: {
    title: "PDF Extraction with Broken Line-Wraps & Ligatures",
    raw: `J O H N   D O E
Email: john.doeﬁrst@gmail.com || Tel: +1 (555) 987-6543 || Loc: New York, NY

PR O FE S SI O N A L  SU M M A R Y
Results-driven Soft-
ware Engineer with extensive ex-
perience in high-fre-
quency trading platforms and full-
stack web development. Proven track record of op-
timizing database queries and refac-
toring legacy monoliths.

TE C H N I C A L  SK I L L S
▪ Java, C++, Python, TypeScript, SQL, Redis
▪ Kubernetes, Terraform, AWS (EC2, S3, Lambda)
▪ Microservices, REST APIs, GraphQL, gRPC

WO R K  EX P E R I E N C E
Software Engineer II -- FinTech Solutions (2020 - 2024)
* Engineered low-latency order execution engine processing 10k transactions/sec.
* Decreased database query execution time by 35% through indexing optimizations.
Page 1 of 2 -- Confidential Resume`
  },
  cleanStandard: {
    title: "Standard Single-Column Clean Text",
    raw: `SARAH JENKINS
New York, NY | sarah.jenkins@email.com | (555) 234-5678 | linkedin.com/in/sjenkins

SUMMARY
Dynamic Product Marketing Manager with 5+ years of experience leading cross-functional teams to launch B2B SaaS products. Adept at customer research, go-to-market strategies, and data analytics.

WORK EXPERIENCE
Senior Product Marketing Manager | CloudScale Inc. | 2022 - Present
• Led launch strategy for enterprise AI feature, driving $1.4M ARR within first two quarters.
• Designed end-to-end customer onboarding funnels, improving activation rate by 28%.

Product Marketing Specialist | GrowthMetrics | 2019 - 2022
• Managed email marketing campaigns reaching 250,000+ subscribers with 24% open rate.
• Conducted competitor research and developed sales enablement decks used by 40+ reps.

EDUCATION
B.A. in Marketing | New York University | Graduated 2019`
  }
};

const cleanResumeText = (rawText, settings) => {
  if (!rawText) return { cleanText: '', diagnostics: [], stats: {} };

  // First check if rawText contains raw PDF source code syntax and purge it
  let text = purgePdfSyntax(rawText);
  const diagnostics = [];
  let originalLength = rawText.length;

  if (rawText.includes('%PDF') || rawText.includes('endobj')) {
    diagnostics.push({ 
      type: 'warning', 
      message: 'Detected binary PDF stream markup. Purged PDF dictionary objects, stream structures, and metadata tags.' 
    });
  }

  // 1. Fix Broken Unicode Ligatures & Weird Encoding
  if (settings.fixLigatures) {
    const ligatureMap = {
      'ﬁ': 'fi', 'ﬂ': 'fl', 'æ': 'ae', 'œ': 'oe', '©': '', '®': '', 
      '™': '', '“': '"', '”': '"', '‘': "'", '’': "'", '–': '-', '—': '-'
    };
    let fixedCount = 0;
    Object.keys(ligatureMap).forEach(key => {
      if (text.includes(key)) {
        const regex = new RegExp(key, 'g');
        const matches = text.match(regex);
        if (matches) fixedCount += matches.length;
        text = text.replace(regex, ligatureMap[key]);
      }
    });
    if (fixedCount > 0) {
      diagnostics.push({ type: 'success', message: `Repaired ${fixedCount} broken ligatures & non-standard encoding artifacts.` });
    }
  }

  // 2. Untangle Multi-Column Side-by-Side Layouts
  if (settings.untangleColumns) {
    const lines = text.split('\n');
    let hasSideBySide = false;
    const processedLines = [];
    
    lines.forEach(line => {
      const spaceGapMatch = line.match(/^(.{15,45})\s{5,}(.{15,})$/);
      if (spaceGapMatch) {
        hasSideBySide = true;
      }
    });

    if (hasSideBySide) {
      const colLeft = [];
      const colRight = [];

      lines.forEach(line => {
        const gapMatch = line.match(/^(.{15,45})\s{5,}(.{15,})$/);
        if (gapMatch) {
          colLeft.push(gapMatch[1].trim());
          colRight.push(gapMatch[2].trim());
        } else {
          if (colLeft.length > 0) {
            processedLines.push(...colLeft);
            colLeft.length = 0;
          }
          if (colRight.length > 0) {
            processedLines.push(...colRight);
            colRight.length = 0;
          }
          processedLines.push(line);
        }
      });

      if (colLeft.length > 0) processedLines.push(...colLeft);
      if (colRight.length > 0) processedLines.push(...colRight);

      text = processedLines.join('\n');
      diagnostics.push({ type: 'warning', message: 'Detected side-by-side multi-column layout. Untangled sidebar into sequential ATS narrative flow.' });
    }
  }

  // 3. Fix Broken Word Hyphenation across Lines
  if (settings.fixHyphenation) {
    const hyphenMatches = text.match(/\b([a-zA-Z]{2,})-\s*\n\s*([a-zA-Z]{2,})\b/g);
    if (hyphenMatches) {
      text = text.replace(/\b([a-zA-Z]{2,})-\s*\n\s*([a-zA-Z]{2,})\b/g, '$1$2');
      diagnostics.push({ type: 'success', message: `Rejoined ${hyphenMatches.length} hyphenated split words across lines.` });
    }
  }

  // 4. Standardize Bullet Points
  if (settings.standardizeBullets) {
    const nonStandardBulletRegex = /^[\s]*[▪■◆➢*+o–-]\s+/gm;
    const bulletMatches = text.match(nonStandardBulletRegex);
    if (bulletMatches) {
      text = text.replace(nonStandardBulletRegex, '• ');
      diagnostics.push({ type: 'success', message: `Standardized ${bulletMatches.length} bullet point markers to bullet symbol (•).` });
    }
  }

  // 5. Remove Page Headers / Footers / Page Numbers
  if (settings.removeHeadersFooters) {
    const headerFooterRegex = /^(Page \d+ of \d+|Curriculum Vitae|Confidential Resume|Page \d+|\d+\s*\|\s*P a g e).*$/gmi;
    const hfMatches = text.match(headerFooterRegex);
    if (hfMatches) {
      text = text.replace(headerFooterRegex, '');
      diagnostics.push({ type: 'info', message: `Stripped ${hfMatches.length} page header/footer/number artifacts.` });
    }
  }

  // 6. Clean Whitespace & Line Breaks
  if (settings.normalizeSpaces) {
    text = text
      .split('\n')
      .map(line => line.replace(/[ \t]+/g, ' ').trim())
      .filter((line, idx, arr) => {
        if (line === '' && idx > 0 && arr[idx - 1] === '') return false;
        return true;
      })
      .join('\n');
  }

  const hasContact = /@/.test(text) || /linkedin\.com/.test(text) || /\d{3}/.test(text);
  const hasSections = /(EXPERIENCE|EDUCATION|SKILLS|SUMMARY|WORK|PROJECTS)/i.test(text);
  const noGarbage = !text.includes('%PDF-') && !text.includes('endobj');
  const bulletCount = (text.match(/•/g) || []).length;

  let atsScore = 50;
  if (hasContact) atsScore += 20;
  if (hasSections) atsScore += 15;
  if (noGarbage) atsScore += 10;
  if (bulletCount >= 2) atsScore += 5;
  atsScore = Math.min(100, atsScore);

  return {
    cleanText: text.trim(),
    diagnostics,
    stats: {
      originalChars: originalLength,
      cleanChars: text.length,
      lines: text.split('\n').filter(Boolean).length,
      bulletCount,
      atsScore
    }
  };
};

const parseStructuredData = (text) => {
  if (!text) return null;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  const linkedinMatch = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = text.match(/(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+/i);

  let name = "Name Not Detected";
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const candidate = lines[i];
    if (
      candidate &&
      !candidate.startsWith('%') &&
      !candidate.includes('@') &&
      !candidate.toLowerCase().includes('resume') &&
      !candidate.toLowerCase().includes('linkedin') &&
      candidate.length < 40
    ) {
      name = candidate;
      break;
    }
  }

  const sections = {
    Summary: [],
    Experience: [],
    Education: [],
    Skills: [],
    Other: []
  };

  let currentSection = 'Other';
  
  lines.forEach(line => {
    const upper = line.toUpperCase();
    if (upper.includes('SUMMARY') || upper.includes('PROFILE') || upper.includes('OBJECTIVE')) {
      currentSection = 'Summary';
    } else if (upper.includes('EXPERIENCE') || upper.includes('WORK HISTORY') || upper.includes('EMPLOYMENT')) {
      currentSection = 'Experience';
    } else if (upper.includes('EDUCATION') || upper.includes('ACADEMIC')) {
      currentSection = 'Education';
    } else if (upper.includes('SKILLS') || upper.includes('TECHNICAL SKILLS') || upper.includes('COMPETENCIES')) {
      currentSection = 'Skills';
    } else {
      sections[currentSection].push(line);
    }
  });

  return {
    contact: {
      name,
      email: emailMatch ? emailMatch[0] : 'Not Found',
      phone: phoneMatch ? phoneMatch[0] : 'Not Found',
      linkedin: linkedinMatch ? linkedinMatch[0] : 'Not Found',
      github: githubMatch ? githubMatch[0] : 'Not Found'
    },
    sections
  };
};

export default function App() {
  const [rawInput, setRawInput] = useState(SAMPLE_RESUMES.multiColumn.raw);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'clean', 'structured', 'diagnostics'
  const [toastMessage, setToastMessage] = useState(null);
  const [fileName, setFileName] = useState('uploaded_resume.pdf');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reference for file input element
  const fileInputRef = useRef(null);

  // Sanitization Toggle Settings
  const [settings, setSettings] = useState({
    untangleColumns: true,
    fixLigatures: true,
    fixHyphenation: true,
    standardizeBullets: true,
    removeHeadersFooters: true,
    normalizeSpaces: true
  });

  // Helper toast notifier
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Calculate clean text output & structured insights from current input & settings
  const { cleanText, diagnostics, stats } = cleanResumeText(rawInput, settings);
  const structuredData = parseStructuredData(cleanText);

  // Handle File Upload with PDF.js parsing
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);

    if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const extractedText = await extractTextFromPdfBuffer(arrayBuffer);
        
        if (extractedText && extractedText.trim().length > 0) {
          setRawInput(extractedText);
          showToast(`Successfully parsed PDF "${file.name}" with PDF.js engine!`);
        } else {
          // Fallback to text reader if PDF.js returned empty string
          const reader = new FileReader();
          reader.onload = (event) => {
            setRawInput(event.target.result);
            showToast(`Loaded raw stream from "${file.name}"`);
          };
          reader.readAsText(file);
        }
      } catch (err) {
        console.error("PDF upload error:", err);
        const reader = new FileReader();
        reader.onload = (event) => {
          setRawInput(event.target.result);
        };
        reader.readAsText(file);
      } finally {
        setIsProcessing(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRawInput(event.target.result);
        setIsProcessing(false);
        showToast(`Loaded text file "${file.name}"`);
      };
      reader.readAsText(file);
    }
  };

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  const handleDownloadClean = () => {
    const blob = new Blob([cleanText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Clean_ATS_${fileName.replace(/\.[^/.]+$/, "")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded clean text resume file!");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-slate-900">
      
      {}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-cyan-500 text-slate-950 px-4 py-2.5 rounded-lg shadow-xl font-medium flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-between p-2 shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-full h-full text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                CareerPilot AI
              </h1>
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs px-2 py-0.5 rounded-full font-mono font-medium">
                Raw Text Decoded v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400">ATS Resume Raw Text Extraction & Untangler Studio</p>
          </div>
        </div>

        {/* Preset Sample Quick Buttons */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 px-2 font-medium flex items-center">
            <Info className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Samples:
          </span>
          <button
            onClick={() => { setRawInput(SAMPLE_RESUMES.multiColumn.raw); setFileName("multi_column_sample.pdf"); }}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Multi-Column Mess
          </button>
          <button
            onClick={() => { setRawInput(SAMPLE_RESUMES.brokenPdf.raw); setFileName("broken_pdf_sample.pdf"); }}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Broken Ligatures
          </button>
          <button
            onClick={() => { setRawInput(SAMPLE_RESUMES.cleanStandard.raw); setFileName("clean_standard.txt"); }}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Standard Clean
          </button>
        </div>
      </header>

      {}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          
          {/* Upload Box */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Resume File Input</span>
              <FileType className="w-4 h-4 text-cyan-400" />
            </h2>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.docx,.txt,.rtf"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-900/50 hover:bg-slate-900 rounded-xl p-6 text-center cursor-pointer transition group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-cyan-500/10 flex items-center justify-center mx-auto mb-3 transition">
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-cyan-400" />
              </div>
              <p className="text-sm font-medium text-slate-300 group-hover:text-cyan-300">
                Click to upload resume file
              </p>
              <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, TXT, RTF</p>
            </div>

            {/* Active File Banner */}
            <div className="mt-4 flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs">
              <div className="flex items-center space-x-2 overflow-hidden">
                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate text-slate-300 font-mono">{fileName}</span>
              </div>
              <button
                onClick={() => setRawInput('')}
                className="text-slate-500 hover:text-red-400 transition ml-2"
                title="Clear input"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Engine Customization Toggles */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center">
                <Sliders className="w-4 h-4 text-cyan-400 mr-2" />
                Sanitizer Engine Rules
              </h2>
              <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded font-mono">
                Active
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { id: 'untangleColumns', label: 'Untangle Multi-Column Layouts', desc: 'Fixes side-by-side sidebar text bleed' },
                { id: 'fixLigatures', label: 'Fix Broken PDF Ligatures & Chars', desc: 'Converts "fi", "fl", smart quotes to clean ASCII' },
                { id: 'fixHyphenation', label: 'Rejoin Line-Break Split Words', desc: 'Connects hyphenated words broken across lines' },
                { id: 'standardizeBullets', label: 'Standardize Bullet Characters', desc: 'Replaces odd glyphs with uniform bullet points' },
                { id: 'removeHeadersFooters', label: 'Strip Headers, Footers & Page #s', desc: 'Removes repetitive document meta noise' },
                { id: 'normalizeSpaces', label: 'Normalize Whitespace & Linebreaks', desc: 'Consolidates blank lines & multiple spaces' }
              ].map(rule => (
                <label key={rule.id} className="flex items-start justify-between cursor-pointer group p-2 rounded-lg hover:bg-slate-900/80 transition">
                  <div className="pr-2">
                    <div className="font-medium text-slate-200 group-hover:text-cyan-300">{rule.label}</div>
                    <div className="text-[11px] text-slate-500">{rule.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings[rule.id]}
                    onChange={(e) => setSettings({ ...settings, [rule.id]: e.target.checked })}
                    className="mt-1 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* ATS Health Metric Card */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ATS Parsing Score</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white">{stats.atsScore || 0}%</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                stats.atsScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                stats.atsScore >= 60 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {stats.atsScore >= 80 ? 'ATS Ready' : stats.atsScore >= 60 ? 'Moderate Noise' : 'Parsing Blocked'}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div 
                className={`h-full transition-all duration-500 ${
                  stats.atsScore >= 80 ? 'bg-emerald-400' :
                  stats.atsScore >= 60 ? 'bg-amber-400' : 'bg-red-500'
                }`}
                style={{ width: `${stats.atsScore || 0}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              Calculated based on entity detection, standard bullet formatting, unicode cleanliness, and structural linear flow.
            </p>
          </div>

        </div>

        {}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Output Toolbar / View Tabs */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center space-x-1.5 ${
                  viewMode === 'split' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>

              <button
                onClick={() => setViewMode('clean')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center space-x-1.5 ${
                  viewMode === 'clean' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Clean Output</span>
              </button>

              <button
                onClick={() => setViewMode('structured')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center space-x-1.5 ${
                  viewMode === 'structured' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Structured JSON</span>
              </button>

              <button
                onClick={() => setViewMode('diagnostics')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center space-x-1.5 relative ${
                  viewMode === 'diagnostics' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Diagnostics ({diagnostics.length})</span>
              </button>
            </div>

            {/* Quick Action Export Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopyText(cleanText, "Clean Resume Text")}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium transition flex items-center space-x-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Clean</span>
              </button>

              <button
                onClick={handleDownloadClean}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition flex items-center space-x-1.5 shadow-lg shadow-cyan-500/10"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export TXT</span>
              </button>
            </div>
          </div>

          {}
          <div className="flex-1 min-h-[500px]">

            {/* 1. SIDE BY SIDE VIEW */}
            {viewMode === 'split' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Raw Input Box */}
                <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                  <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-400 flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Raw Uncleaned Text Stream
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">{rawInput.length} chars</span>
                  </div>
                  <textarea
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    placeholder="Paste raw unformatted resume text here..."
                    className="flex-1 p-4 bg-slate-950 text-slate-300 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-slate-700"
                  />
                </div>

                {/* Clean Sanitized Output Box */}
                <div className="flex flex-col bg-slate-950 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-xl shadow-cyan-950/20">
                  <div className="px-4 py-2.5 bg-cyan-950/30 border-b border-cyan-500/20 flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-400 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Decoded ATS Clean Text
                    </span>
                    <span className="text-[11px] text-cyan-300 font-mono">{cleanText.length} chars</span>
                  </div>
                  <pre className="flex-1 p-4 bg-slate-950/90 text-cyan-50 font-mono text-xs leading-relaxed overflow-auto whitespace-pre-wrap selection:bg-cyan-500/30">
                    {cleanText || "No clean output generated yet..."}
                  </pre>
                </div>
              </div>
            )}

            {/* 2. CLEAN OUTPUT FULL VIEW */}
            {viewMode === 'clean' && (
              <div className="h-full bg-slate-950 border border-cyan-500/30 rounded-2xl overflow-hidden flex flex-col">
                <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-slate-200">ATS Optimized Clean Plain Text Output</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{stats.lines} Lines | {stats.bulletCount} Bullets</span>
                </div>
                <div className="p-6 flex-1 overflow-auto bg-slate-950">
                  <textarea
                    readOnly
                    value={cleanText}
                    className="w-full h-full bg-transparent text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 3. STRUCTURED JSON / ENTITY VIEW */}
            {viewMode === 'structured' && structuredData && (
              <div className="h-full bg-slate-950 border border-slate-800 rounded-2xl p-5 overflow-auto space-y-6">
                
                {/* Contact Card Extraction */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1.5" /> Extracted Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(structuredData.contact).map(([key, val]) => (
                      <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide block font-semibold">{key}</span>
                        <span className="text-xs font-mono text-slate-200 truncate block mt-1">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extracted Sections Preview */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center">
                    <Layers className="w-4 h-4 mr-1.5" /> Detected Resume Sections
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(structuredData.sections).map(([sectionName, lines]) => {
                      if (lines.length === 0) return null;
                      return (
                        <div key={sectionName} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2 flex items-center">
                            <ChevronRight className="w-3.5 h-3.5 text-cyan-400 mr-1" />
                            {sectionName} ({lines.length} entries)
                          </h4>
                          <div className="bg-slate-950 rounded-lg p-3 text-xs font-mono text-slate-300 space-y-1 max-h-40 overflow-auto">
                            {lines.map((l, i) => (
                              <div key={i} className="truncate">{l}</div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* 4. DIAGNOSTICS & AUDIT LOG */}
            {viewMode === 'diagnostics' && (
              <div className="h-full bg-slate-950 border border-slate-800 rounded-2xl p-5 overflow-auto space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">Decoded Text Repair Log</h3>
                    <p className="text-xs text-slate-400">Automated fixes applied by the raw text untangler pipeline.</p>
                  </div>
                  <span className="text-xs font-mono bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full">
                    {diagnostics.length} Events Detected
                  </span>
                </div>

                {diagnostics.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/50 mb-2" />
                    <p className="text-sm font-medium">Clean Text Stream</p>
                    <p className="text-xs mt-1">No structural issues or unicode artifacts detected in raw input.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {diagnostics.map((diag, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-xl border text-xs flex items-start space-x-3 ${
                          diag.type === 'warning' ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' :
                          diag.type === 'success' ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' :
                          'bg-blue-950/20 border-blue-500/30 text-blue-200'
                        }`}
                      >
                        {diag.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                        {diag.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                        {diag.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <p className="font-mono text-xs leading-relaxed">{diag.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </main>

      {}
      <footer className="border-t border-slate-800 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-500">
        <p>CareerPilot AI • Clean Resume Text Stream & ATS Pre-Parser • Engineered for 100% Parsing Accuracy</p>
      </footer>

    </div>
  );
}