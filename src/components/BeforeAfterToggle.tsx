import React from 'react';
import { useGradeStore } from '../store/gradeStore';

export const BeforeAfterToggle: React.FC = () => {
  const splitX = useGradeStore((s) => s.splitX);
  const showOriginal = useGradeStore((s) => s.showOriginal);
  const setSplitX = useGradeStore((s) => s.setSplitX);
  const setShowOriginal = useGradeStore((s) => s.setShowOriginal);

  const isSplitActive = splitX >= 0;

  return (
    <div className="flex items-center gap-1.5">
      {/* Split Screen Toggle (Teal Accent) */}
      <button
        onClick={() => setSplitX(isSplitActive ? -1.0 : 0.5)}
        className={`px-2.5 py-1 text-xs font-normal rounded-[2px] border transition-colors cursor-pointer ${
          isSplitActive
            ? 'bg-[#5FB3A8]/15 text-[#5FB3A8] border-[#5FB3A8]/50'
            : 'bg-[#15161A] text-zinc-400 border-white/[0.08] hover:text-[#E8E6E1] hover:border-white/[0.15]'
        }`}
        title="Toggle split-screen comparison"
      >
        Split
      </button>

      {/* Hold to Compare Button (Amber Accent) */}
      <button
        onMouseDown={() => setShowOriginal(true)}
        onMouseUp={() => setShowOriginal(false)}
        onMouseLeave={() => setShowOriginal(false)}
        onTouchStart={() => setShowOriginal(true)}
        onTouchEnd={() => setShowOriginal(false)}
        className={`px-2.5 py-1 text-xs font-normal rounded-[2px] border transition-colors cursor-pointer ${
          showOriginal
            ? 'bg-[#D9822B]/15 text-[#D9822B] border-[#D9822B]/50'
            : 'bg-[#15161A] text-zinc-400 border-white/[0.08] hover:text-[#E8E6E1] hover:border-white/[0.15]'
        }`}
        title="Hold to view original footage"
      >
        Compare
      </button>
    </div>
  );
};
