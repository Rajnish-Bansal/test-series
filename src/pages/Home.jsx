import { Link } from 'react-router-dom';
import { BookOpen, Target, Brain, ArrowRight, Play } from 'lucide-react';

export default function Home() {
    return (
        <div className="flex flex-col items-center py-12 text-center max-w-5xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-upsc-blue-dark tracking-tight mb-4 mt-8">
                UPSC Prelims Performance Engine
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mb-12">
                A professional mock exam environment with authentic 1/3rd negative marking, 3-round marker strategy, and an intelligent error vault for targeted revision.
            </p>



            <div className="mb-14">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">Ready to improve your Prelims score?</h3>
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-upsc-blue text-white rounded-lg font-bold text-lg hover:bg-upsc-blue-light transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                    Start Your Assessment <Play className="h-5 w-5 fill-white" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-20">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center group hover:border-blue-200 transition-all">
                    <div className="h-12 w-12 bg-blue-100 text-upsc-blue rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">3-Round Strategy</h3>
                    <p className="text-sm text-slate-500 text-center">
                        Mark questions as Sure, 50-50, or Guess to analyze your risk-taking accuracy.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center group hover:border-blue-200 transition-all">
                    <div className="h-12 w-12 bg-blue-100 text-upsc-blue rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Target className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Micro-Topic Analysis</h3>
                    <p className="text-sm text-slate-500 text-center">
                        Detailed breakdown of your performance across Polity, Economy, History, and more.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center group hover:border-blue-200 transition-all">
                    <div className="h-12 w-12 bg-blue-100 text-upsc-blue rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Brain className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">The Error Vault</h3>
                    <p className="text-sm text-slate-500 text-center">
                        Automatically stores incorrectly answered questions for focused revision later.
                    </p>
                </div>
            </div>

            {/* How it Works Section */}
            <div className="w-full bg-slate-50 rounded-3xl p-10 sm:p-16 mb-20">
                <h2 className="text-3xl font-black text-slate-800 mb-12">How it Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
                    <div className="relative">
                        <div className="text-6xl font-black text-blue-100/40 mb-4 absolute -top-6 -left-4 z-0 pointer-events-none select-none">01</div>
                        <div className="relative z-10 pl-2">
                            <h4 className="font-bold text-slate-800 text-lg mb-2">Take a Free Test</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">Choose a subject like Polity and experience the professional UPSC mock environment immediately.</p>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="text-6xl font-black text-blue-100/40 mb-4 absolute -top-6 -left-4 z-0 pointer-events-none select-none">02</div>
                        <div className="relative z-10 pl-2">
                            <h4 className="font-bold text-slate-800 text-lg mb-2">See Your Gaps</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">Our engine analyzes your performance specifically identifying micro-topics where you are losing marks.</p>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="text-6xl font-black text-blue-100/40 mb-4 absolute -top-6 -left-4 z-0 pointer-events-none select-none">03</div>
                        <div className="relative z-10 pl-2">
                            <h4 className="font-bold text-slate-800 text-lg mb-2">Bridge the Weakness</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">Review your mistakes in the Error Vault and improve your scores through targeted, data-driven revision.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
