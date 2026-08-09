import React, { useState } from 'react';
import { User } from 'lucide-react';

export interface AvatarItem {
  id: string;
  name: string;
  url: string;
  bg: string;
  border: string;
  fallbackColor: string;
}

export const AVATAR_PRESETS: AvatarItem[] = [
  {
    id: 'av_alex',
    name: 'Alex',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&eyewear=glasses&hairColor=2c1b18&backgroundColor=0284c7',
    bg: 'bg-cyan-900/60',
    border: 'border-cyan-400',
    fallbackColor: '#0284c7'
  },
  {
    id: 'av_zoe',
    name: 'Zoe',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&eyewear=glasses&hairColor=d6b370&backgroundColor=7c3aed',
    bg: 'bg-purple-900/60',
    border: 'border-purple-400',
    fallbackColor: '#7c3aed'
  },
  {
    id: 'av_leo',
    name: 'Leo',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&eyewear=sunglasses&hairColor=f59e0b&backgroundColor=059669',
    bg: 'bg-emerald-900/60',
    border: 'border-emerald-400',
    fallbackColor: '#059669'
  },
  {
    id: 'av_maya',
    name: 'Maya',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya&eyewear=glasses&hairColor=10b981&backgroundColor=dc2626',
    bg: 'bg-rose-900/60',
    border: 'border-rose-400',
    fallbackColor: '#dc2626'
  },
  {
    id: 'av_sam',
    name: 'Sam',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&eyewear=glasses&hairColor=4b5563&backgroundColor=d97706',
    bg: 'bg-amber-900/60',
    border: 'border-amber-400',
    fallbackColor: '#d97706'
  },
  {
    id: 'av_ruby',
    name: 'Ruby',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ruby&eyewear=glasses&hairColor=a855f7&backgroundColor=2563eb',
    bg: 'bg-blue-900/60',
    border: 'border-blue-400',
    fallbackColor: '#2563eb'
  },
  {
    id: 'av_oliver',
    name: 'Oliver',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&eyewear=glasses&hairColor=1e293b&backgroundColor=9333ea',
    bg: 'bg-violet-900/60',
    border: 'border-violet-400',
    fallbackColor: '#9333ea'
  },
  {
    id: 'av_luna',
    name: 'Luna',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&eyewear=glasses&hairColor=0284c7&backgroundColor=db2777',
    bg: 'bg-pink-900/60',
    border: 'border-pink-400',
    fallbackColor: '#db2777'
  },
  {
    id: 'av_felix',
    name: 'Felix',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&eyewear=glasses&hairColor=ea580c&backgroundColor=0284c7',
    bg: 'bg-cyan-900/60',
    border: 'border-cyan-400',
    fallbackColor: '#0284c7'
  },
  {
    id: 'av_chloe',
    name: 'Chloe',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe&eyewear=glasses&hairColor=eab308&backgroundColor=7c3aed',
    bg: 'bg-purple-900/60',
    border: 'border-purple-400',
    fallbackColor: '#7c3aed'
  },
  {
    id: 'av_jax',
    name: 'Jax',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jax&eyewear=sunglasses&hairColor=10b981&backgroundColor=059669',
    bg: 'bg-emerald-900/60',
    border: 'border-emerald-400',
    fallbackColor: '#059669'
  },
  {
    id: 'av_aria',
    name: 'Aria',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria&eyewear=glasses&hairColor=78350f&backgroundColor=dc2626',
    bg: 'bg-rose-900/60',
    border: 'border-rose-400',
    fallbackColor: '#dc2626'
  }
];

export const RenderAvatar: React.FC<{ avatarId: string; className?: string; size?: number }> = ({
  avatarId,
  className = 'w-9 h-9 rounded-2xl',
  size = 18
}) => {
  const [imgError, setImgError] = useState(false);
  const preset = AVATAR_PRESETS.find((a) => a.id === avatarId);

  if (preset && !imgError) {
    return (
      <div className={`${className} ${preset.bg} border ${preset.border} overflow-hidden flex items-center justify-center shadow-md shrink-0 select-none relative group`}>
        <img
          src={preset.url}
          alt={preset.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-110"
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback if image load fails or if it's a legacy letter avatar
  return (
    <div className={`${className} bg-gradient-to-tr from-cyan-600 to-purple-600 border border-cyan-400/50 flex items-center justify-center text-white font-black text-xs uppercase shadow-md shrink-0 select-none`}>
      {avatarId && avatarId.length <= 2 ? avatarId : <User size={size} />}
    </div>
  );
};
