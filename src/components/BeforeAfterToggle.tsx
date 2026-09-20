import React from 'react';
import { Columns, Eye } from 'lucide-react';
import { useGradeStore } from '../store/gradeStore';

export const BeforeAfterToggle: React.FC = () => {
  const splitX = useGradeStore((s) => s.splitX);
  const showOriginal = useGradeStore((s) => s.showOriginal);
  const setSplitX = useGradeStore((s) => s.setSplitX);
  const setShowOriginal = useGradeStore((s) => s.setShowOriginal);

  const isSplitActive = splitX >= 0;

  return (
    <div className="flex items-center gap-2">
      {/* Split Screen Toggle */}
      <button
        onClick={() => setSplitX(isSplitActive ? -1.0 : 0.5)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-all ${
          isSplitActive
            ? 'bg-cyan-950/50 text-cyan-300 border-cyan-700 shadow-[0_0_10px_rgba(0,242,254,0.2)]'
            : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-zinc-200 hover:bg-zinc-700/80'
        }`}
        title="Toggle split-screen before/after comparison"
      >
        <Columns className="w-3.5 h-3.5" />
        <span>Split View</span>
      </button>

      {/* Hold to Compare Button */}
      <button
        onMouseDown={() => setShowOriginal(true)}
        onMouseUp={() => setShowOriginal(false)}
        onMouseLeave={() => setShowOriginal(false)}
        onTouchStart={() => setShowOriginal(true)}
        onTouchEnd={() => setShowOriginal(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-all ${
          showOriginal
            ? 'bg-amber-950/50 text-amber-300 border-amber-700 shadow-[0_0_10px_rgba(246,173,85,0.2)]'
            : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-zinc-200 hover:bg-zinc-700/80'
        }`}
        title="Press and hold to preview original un-graded footage"
      >
        <Eye className="w-3.5 h-3.5" />
        <span>Hold Compare</span>
      </button>
    </div>
  );
};
