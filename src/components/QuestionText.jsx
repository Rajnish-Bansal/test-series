/**
 * QuestionText — renders UPSC question text cleanly.
 * Automatically splits numbered statements (1. 2. 3. …) onto separate lines
 * so questions stored as a single paragraph display correctly.
 */
export default function QuestionText({ text, className = '' }) {
    if (!text) return null;

    // Split on patterns like " 1. ", double newlines, or key UPSC context phrases
    // We group phrases and use word boundaries to avoid splitting mid-sentence unless it's a known separator
    const parts = text.split(/(?=\s\d+\.\s|\n\n|\b(?:With reference to|Which of the statements|Which of the following|How many of|Consider the following statements))/i);

    // Filter out empty or whitespace-only blocks
    const activeBlocks = parts.map(p => p.trim()).filter(p => p.length > 0);

    if (activeBlocks.length <= 1) {
        // No special formatting needed
        return <span className={`whitespace-pre-wrap ${className}`}>{text}</span>;
    }

    return (
        <span className={className}>
            {activeBlocks.map((block, i) => (
                <span key={i} className="block mb-2 last:mb-0">
                    {block}
                </span>
            ))}
        </span>
    );
}
