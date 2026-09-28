import React from 'react';

interface BladyLogoProps {
  className?: string;
  size?: number | string;
  showSubtitle?: boolean;
}

export const BladyLogo: React.FC<BladyLogoProps> = ({ 
  className = "w-10 h-10", 
  size,
  showSubtitle = false 
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg 
      viewBox="0 0 500 500" 
      className={`shrink-0 select-none ${className}`}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SNC KHODJA & CO. Blady Sustainable Culinary Heritage Logo"
    >
      <defs>
        {/* Metallic Gold Gradients */}
        <linearGradient id="goldRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eed283" />
          <stop offset="25%" stopColor="#bf9337" />
          <stop offset="50%" stopColor="#fff2be" />
          <stop offset="75%" stopColor="#9e721d" />
          <stop offset="100%" stopColor="#d8ab48" />
        </linearGradient>

        <radialGradient id="goldRadialGrad" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#fff8d6" />
          <stop offset="40%" stopColor="#dfb752" />
          <stop offset="80%" stopColor="#a37822" />
          <stop offset="100%" stopColor="#7a5511" />
        </radialGradient>

        <linearGradient id="oliveLeafGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9e721d" />
          <stop offset="50%" stopColor="#dfb752" />
          <stop offset="100%" stopColor="#fff2be" />
        </linearGradient>

        <linearGradient id="innerBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#faf7ed" />
          <stop offset="100%" stopColor="#f3ecdb" />
        </linearGradient>

        {/* Text Curvature Paths */}
        {/* Top Outer Arc for SNC KHODJA & CO. */}
        <path id="topArcSnc" d="M 82,250 A 168,168 0 0,1 418,250" fill="none" />
        
        {/* Top Inner Arc for SUSTAINABLE CULINARY HERITAGE */}
        <path id="topArcSub" d="M 112,250 A 138,138 0 0,1 388,250" fill="none" />

        {/* Bottom Arc for LOCALLY OWNED AND OPERATED (drawn counter-clockwise to keep text upright) */}
        <path id="bottomArcOperated" d="M 414,250 A 164,164 0 0,1 86,250" fill="none" />

        {/* Shadow filter for 3D medal depth */}
        <filter id="medalShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.35" />
        </filter>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* TOP LAUREL / OLIVE CROWN LEAVES (Extending above the medal) */}
      <g id="topCrownLeaves" fill="url(#oliveLeafGrad)" filter="url(#softGlow)">
        {/* Central top leaf pair */}
        <path d="M 250,58 C 248,32 238,20 250,14 C 262,20 252,32 250,58 Z" />
        {/* Left branching leaves */}
        <path d="M 246,55 C 230,42 208,35 204,26 C 218,24 235,36 246,55 Z" />
        <path d="M 242,62 C 220,54 195,50 186,42 C 200,38 222,46 242,62 Z" />
        <path d="M 238,70 C 210,66 182,68 170,62 C 182,54 210,58 238,70 Z" />
        <path d="M 232,80 C 200,80 172,86 160,82 C 170,72 200,72 232,80 Z" />
        <path d="M 224,94 C 192,98 168,108 156,104 C 164,94 194,90 224,94 Z" />

        {/* Right branching leaves */}
        <path d="M 254,55 C 270,42 292,35 296,26 C 282,24 265,36 254,55 Z" />
        <path d="M 258,62 C 280,54 305,50 314,42 C 300,38 278,46 258,62 Z" />
        <path d="M 262,70 C 290,66 318,68 330,62 C 318,54 290,58 262,70 Z" />
        <path d="M 268,80 C 300,80 328,86 340,82 C 330,72 300,72 268,80 Z" />
        <path d="M 276,94 C 308,98 332,108 344,104 C 336,94 306,90 276,94 Z" />

        {/* Sparkle highlight at the very crown tip */}
        <circle cx="250" cy="56" r="3.5" fill="#ffffff" opacity="0.9" />
      </g>

      {/* MAIN CIRCULAR MEDAL BODY */}
      <g filter="url(#medalShadow)">
        {/* Outermost rim */}
        <circle cx="250" cy="250" r="198" fill="url(#goldRimGrad)" stroke="#7a5511" strokeWidth="2" />
        
        {/* Inner concentric ring highlight */}
        <circle cx="250" cy="250" r="192" fill="none" stroke="#fff7d6" strokeWidth="2.5" opacity="0.75" />
        
        {/* Ring background for text banner */}
        <circle cx="250" cy="250" r="185" fill="url(#goldRadialGrad)" />

        {/* Inner thin golden boundary */}
        <circle cx="250" cy="250" r="138" fill="none" stroke="#68470a" strokeWidth="2.5" />
        <circle cx="250" cy="250" r="135" fill="none" stroke="#ffe599" strokeWidth="1.5" />
        
        {/* Center parchment background */}
        <circle cx="250" cy="250" r="133" fill="url(#innerBgGrad)" />
      </g>

      {/* CURVED TYPOGRAPHY ON THE GOLD MEDAL */}
      <g fill="#433008" fontFamily="'Cinzel', 'Playfair Display', 'Times New Roman', Georgia, serif">
        {/* SNC KHODJA & CO. */}
        <text fontSize="29" fontWeight="900" letterSpacing="3.5">
          <textPath href="#topArcSnc" startOffset="50%" textAnchor="middle">
            SNC KHODJA &amp; CO.
          </textPath>
        </text>

        {/* SUSTAINABLE CULINARY HERITAGE */}
        <text fontSize="13" fontWeight="800" letterSpacing="2.8" fill="#543e0a">
          <textPath href="#topArcSub" startOffset="50%" textAnchor="middle">
            SUSTAINABLE CULINARY HERITAGE
          </textPath>
        </text>

        {/* LOCALLY OWNED AND OPERATED */}
        <text fontSize="17.5" fontWeight="900" letterSpacing="3" fill="#433008">
          <textPath href="#bottomArcOperated" startOffset="50%" textAnchor="middle">
            LOCALLY OWNED AND OPERATED
          </textPath>
        </text>
      </g>

      {/* SIDE DIVIDER STARS (Left and Right) */}
      {/* Left Star at 9 o'clock */}
      <polygon 
        points="70,250 74,242 83,242 76,247 79,255 70,250 62,255 65,247 58,242 67,242" 
        fill="#433008" 
        stroke="#ffd56b" 
        strokeWidth="0.8" 
      />
      {/* Right Star at 3 o'clock */}
      <polygon 
        points="430,250 434,242 443,242 436,247 439,255 430,250 422,255 425,247 418,242 427,242" 
        fill="#433008" 
        stroke="#ffd56b" 
        strokeWidth="0.8" 
      />

      {/* CENTERPIECE: OLIVE TREE, BLADY CALLIGRAPHY, HARVESTERS & BASKETS */}
      <g id="centerpiece" transform="translate(0, 0)">
        {/* Ground Mound / Orchard Hill */}
        <path 
          d="M 124,332 C 160,320 210,314 250,314 C 290,314 340,320 376,332 A 133,133 0 0,1 124,332 Z" 
          fill="#586b20" 
        />

        {/* Grand Olive Tree Silhouette */}
        <g fill="#586b20">
          {/* Main Trunk and stout limbs */}
          <path d="M 235,315 C 233,285 240,265 230,245 C 220,230 205,215 190,205 C 196,204 205,208 214,215 C 224,223 234,238 238,248 C 242,230 248,220 252,215 C 256,220 262,230 266,248 C 270,238 280,223 290,215 C 299,208 308,204 314,205 C 299,215 284,230 274,245 C 264,265 271,285 269,315 Z" />
          
          {/* Left Root & Base flair */}
          <path d="M 235,315 C 230,305 224,295 215,290 C 218,298 222,308 228,318 Z" />
          <path d="M 269,315 C 274,305 280,295 289,290 C 286,298 282,308 276,318 Z" />

          {/* Lush Foliage Canopy Clustered Blobs */}
          {/* Left Canopy */}
          <circle cx="165" cy="200" r="28" />
          <circle cx="185" cy="180" r="26" />
          <circle cx="150" cy="225" r="22" />
          <circle cx="170" cy="235" r="24" />
          <circle cx="195" cy="225" r="20" />
          <circle cx="140" cy="205" r="18" />

          {/* Top Canopy */}
          <circle cx="215" cy="165" r="28" />
          <circle cx="245" cy="155" r="32" />
          <circle cx="275" cy="158" r="28" />
          <circle cx="230" cy="145" r="22" />
          <circle cx="265" cy="142" r="24" />
          <circle cx="250" cy="135" r="20" />

          {/* Right Canopy */}
          <circle cx="315" cy="175" r="26" />
          <circle cx="335" cy="195" r="28" />
          <circle cx="310" cy="220" r="24" />
          <circle cx="345" cy="225" r="20" />
          <circle cx="360" cy="210" r="18" />
          <circle cx="330" cy="235" r="22" />

          {/* Small leaf details and olive clusters hanging */}
          <ellipse cx="132" cy="220" rx="6" ry="12" transform="rotate(-30 132 220)" />
          <ellipse cx="145" cy="242" rx="6" ry="12" transform="rotate(-45 145 242)" />
          <ellipse cx="178" cy="254" rx="6" ry="11" transform="rotate(-20 178 254)" />
          <ellipse cx="320" cy="252" rx="6" ry="11" transform="rotate(20 320 252)" />
          <ellipse cx="355" cy="242" rx="6" ry="12" transform="rotate(45 355 242)" />
          <ellipse cx="368" cy="220" rx="6" ry="12" transform="rotate(30 368 220)" />

          {/* Foliage Leaf negative cutouts for organic texture */}
          <g fill="#faf7ed">
            <ellipse cx="170" cy="195" rx="4" ry="9" transform="rotate(25 170 195)" />
            <ellipse cx="185" cy="215" rx="3.5" ry="8" transform="rotate(-30 185 215)" />
            <ellipse cx="220" cy="175" rx="4" ry="10" transform="rotate(15 220 175)" />
            <ellipse cx="280" cy="170" rx="4" ry="10" transform="rotate(-15 280 170)" />
            <ellipse cx="320" cy="195" rx="4" ry="9" transform="rotate(-25 320 195)" />
            <ellipse cx="340" cy="215" rx="3.5" ry="8" transform="rotate(30 340 215)" />
          </g>
        </g>

        {/* Central Branch with Two Olives (one green, one black) */}
        <g id="twoOlives">
          {/* Stem */}
          <path d="M 250,225 Q 248,235 244,242" stroke="#485918" strokeWidth="2" fill="none" />
          <path d="M 250,225 Q 252,235 256,242" stroke="#485918" strokeWidth="2" fill="none" />
          {/* Leaves above olives */}
          <ellipse cx="242" cy="222" rx="4" ry="11" transform="rotate(-50 242 222)" fill="#78932b" />
          <ellipse cx="258" cy="222" rx="4" ry="11" transform="rotate(50 258 222)" fill="#78932b" />
          {/* Dark Purple / Black Olive on Left */}
          <ellipse cx="243" cy="245" rx="6.5" ry="9.5" fill="#2b2326" stroke="#48383e" strokeWidth="0.8" />
          <ellipse cx="241" cy="242" rx="1.5" ry="3.5" fill="#ffffff" opacity="0.45" />
          {/* Green Olive on Right */}
          <ellipse cx="257" cy="245" rx="6.5" ry="9.5" fill="#7d962d" stroke="#5b701c" strokeWidth="0.8" />
          <ellipse cx="255" cy="242" rx="1.5" ry="3.5" fill="#ffffff" opacity="0.5" />
        </g>

        {/* ARABIC SCRIPT "بلادي" (Curved in the upper foliage) */}
        <g fill="#edd68b" stroke="#3b4812" strokeWidth="0.8">
          <text 
            x="250" 
            y="172" 
            textAnchor="middle" 
            fontFamily="'Traditional Arabic', 'Scheherazade New', 'Amiri', serif" 
            fontSize="26" 
            fontWeight="bold"
            direction="rtl"
            letterSpacing="1"
          >
            بلادي
          </text>
        </g>

        {/* CURSIVE SCRIPT "Blady" (Flowing in the center of the tree) */}
        <g fill="#eed78e">
          <text 
            x="248" 
            y="210" 
            textAnchor="middle" 
            fontFamily="'Brush Script MT', 'Dancing Script', 'Great Vibes', 'Allura', cursive, serif" 
            fontSize="48" 
            fontWeight="bold" 
            fontStyle="italic"
            stroke="#3a4812" 
            strokeWidth="1.2"
            letterSpacing="1"
          >
            Blady
          </text>
        </g>

        {/* HARVESTER ON LEFT (Silhouette of farmer with pole harvesting tree) */}
        <g fill="#586b20" id="farmerLeft">
          {/* Cap / Head */}
          <circle cx="180" cy="266" r="6" />
          <path d="M 174,264 Q 170,265 168,266 Q 174,268 181,267 Z" /> {/* Cap visor */}
          {/* Torso & arms */}
          <path d="M 174,272 L 186,272 L 184,295 L 176,295 Z" />
          {/* Extended arms holding long pole */}
          <path d="M 183,275 L 195,268 L 200,250" stroke="#586b20" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* The long pole reaching into tree canopy */}
          <line x1="170" y1="316" x2="216" y2="225" stroke="#3d4a13" strokeWidth="2.8" strokeLinecap="round" />
          {/* Legs & Boots */}
          <path d="M 176,295 L 173,322 L 169,324" stroke="#586b20" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 184,295 L 187,322 L 193,323" stroke="#586b20" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>

        {/* HARVEST BASKETS AND FARMER ON RIGHT */}
        <g fill="#586b20" id="farmerRight">
          {/* Two Woven Olive Baskets on ground */}
          {/* Basket 1 */}
          <path d="M 278,310 L 291,310 L 289,324 L 280,324 Z" stroke="#3d4a13" strokeWidth="1" />
          <line x1="277" y1="310" x2="292" y2="310" stroke="#3d4a13" strokeWidth="2" strokeLinecap="round" />
          {/* Basket 2 */}
          <path d="M 298,312 L 311,312 L 309,325 L 300,325 Z" stroke="#3d4a13" strokeWidth="1" />
          <line x1="297" y1="312" x2="312" y2="312" stroke="#3d4a13" strokeWidth="2" strokeLinecap="round" />

          {/* Bending Harvester collecting olives */}
          {/* Head */}
          <circle cx="334" cy="304" r="5" />
          {/* Bending back & Torso */}
          <path d="M 330,307 Q 324,312 320,317 L 317,322" stroke="#586b20" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          {/* Arms reaching down to ground/basket */}
          <path d="M 326,310 L 320,318 L 318,324" stroke="#586b20" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Kneeling/Bending Legs */}
          <path d="M 320,317 Q 328,318 333,325" stroke="#586b20" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
};
