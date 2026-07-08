import Image from 'next/image';

export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2 p-4 bg-gray-100 rounded-lg max-w-xs">
      <Image
        src="/logo/homy_brand_purple.svg"
        alt="Homy"
        width={16}
        height={16}
        className="select-none"
      />
      <span className="text-gray-600 text-sm">Homy is typing</span>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
