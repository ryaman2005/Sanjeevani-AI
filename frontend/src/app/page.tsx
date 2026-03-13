import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black font-sans relative overflow-hidden">
      {/* Background gradients mirroring the image */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[5%] -left-[10%] w-[50%] h-[60%] rounded-full bg-[#f3e8ff] blur-[100px] opacity-70" />
        <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-[#fae8ff] blur-[100px] opacity-50" />
      </div>

      {/* Header */}
      <header className="container mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Logo icon */}
          <div className="w-6 h-6 rounded flex justify-center items-center text-gray-700">
             <span className="text-xl">🩺</span>
          </div>
          <span className="font-medium text-lg tracking-widest text-gray-800 uppercase">Sanjeevani</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-600">
          <Link href="/" className="text-black font-bold">Home</Link>
          <Link href="#about" className="hover:text-black transition">About</Link>
          <Link href="#contact" className="hover:text-black transition">Contact Us</Link>
        </nav>

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black">
            Login
          </Link>
          <Link href="/chat" className="px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition">
            Try model ↗
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <main className="container mx-auto px-6 pt-32 pb-32 flex flex-col items-center text-center">
        <div className="mb-8 px-4 py-1.5 rounded-full bg-white/50 border border-gray-200 shadow-sm text-xs font-medium text-gray-500 flex items-center gap-2">
          Meet Sanjeevani AI <Link href="/about" className="text-indigo-600 font-semibold hover:underline">Read more →</Link>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 max-w-4xl mb-8 leading-[1.1]">
          Your Intelligent Medical<br />Assistant.
        </h1>

        <p className="text-gray-400 max-w-2xl mb-12 text-lg">
          Sanjeevani AI helps you understand symptoms, get medical insights, and access health information instantly using advanced AI.
        </p>

        <div className="flex items-center justify-center gap-6">
          <Link 
            href="/chat" 
            className="px-8 py-3.5 bg-[#6366f1] text-white rounded-lg font-medium hover:bg-indigo-600 transition shadow-sm"
          >
            Get started
          </Link>
          <Link 
            href="#learn" 
            className="px-8 py-3.5 text-gray-600 font-medium hover:text-black transition flex items-center gap-2"
          >
            Learn more
          </Link>
        </div>
      </main>
    </div>
  )
}
