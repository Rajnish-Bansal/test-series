import { Link } from 'react-router-dom';
import { BookOpen, Target, Brain, ArrowRight } from 'lucide-react';

export default function Home() {
    return (
        <div className="flex flex-col items-center py-12 text-center max-w-5xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-upsc-blue-dark tracking-tight mb-4 mt-8">
                UPSC Prelims Performance Engine
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mb-12">
                A professional mock exam environment with authentic 1/3rd negative marking, 3-round marker strategy, and an intelligent error vault for targeted revision.
            </p>

            <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 bg-upsc-blue text-white rounded-lg font-bold text-lg hover:bg-upsc-blue-light transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mb-16"
            >
                Login to Dashboard <ArrowRight className="h-5 w-5" />
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-12">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <div className="h-12 w-12 bg-blue-100 text-upsc-blue rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">3-Round Strategy</h3>
                    <p className="text-sm text-slate-500 text-center">
                        Mark questions as Sure, 50-50, or Guess to analyze your risk-taking accuracy.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <div className="h-12 w-12 bg-blue-100 text-upsc-blue rounded-full flex items-center justify-center mb-4">
                        <Target className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Micro-Topic Analysis</h3>
                    <p className="text-sm text-slate-500 text-center">
                        Detailed breakdown of your performance across Polity, Economy, History, and more.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <div className="h-12 w-12 bg-blue-100 text-upsc-blue rounded-full flex items-center justify-center mb-4">
                        <Brain className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">The Error Vault</h3>
                    <p className="text-sm text-slate-500 text-center">
                        Automatically stores incorrectly answered questions for focused revision later.
                    </p>
                </div>
            </div>
        </div>
    );
}
