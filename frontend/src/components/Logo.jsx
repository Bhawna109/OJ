export default function Logo({ size = 'md' }) {
  const isLg = size === 'lg';
  return (
    <div className={`flex items-center gap-${isLg ? '4' : '2'}`}>
      <div className={`${isLg ? 'w-16 h-16 rounded-xl text-2xl' : 'w-10 h-10 rounded-lg text-sm'} bg-blue-900 flex flex-col items-center justify-center text-white font-bold flex-shrink-0 relative overflow-hidden`}>
        <span className={`${isLg ? 'text-2xl' : 'text-base'} font-serif italic`}>B</span>
        <span className={`${isLg ? 'text-xs' : 'text-[8px]'} font-mono`}>{'{✓}'}</span>
      </div>
      <div className="flex flex-col">
        <span className={`${isLg ? 'text-4xl' : 'text-lg'} font-extrabold text-blue-900 leading-tight tracking-tight`}>BhawnaOJ</span>
        <span className={`${isLg ? 'text-base' : 'text-[10px]'} text-gray-500 font-medium tracking-wide`}>Online Judge Platform</span>
      </div>
    </div>
  );
}
