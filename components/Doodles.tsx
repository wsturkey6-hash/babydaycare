/**
 * 手繪風裝飾插畫。簽名元素：「大腳印牽小腳印」——
 * 大人與寶寶的腳印並肩走，親子意象貫穿標題、空狀態與地圖占位畫面。
 * 全部為裝飾性 SVG（aria-hidden），只用插畫色（蜜杏/燕麥/淡櫻），不碰語意色。
 */

/** 單一腳印：腳掌 + 三顆腳趾 */
function Print({
  x,
  y,
  scale = 1,
  rotate = 0,
  fill,
  opacity = 1,
}: {
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  fill: string;
  opacity?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
      fill={fill}
      opacity={opacity}
    >
      <ellipse cx="0" cy="2.4" rx="3.1" ry="4.4" />
      <circle cx="-2.4" cy="-3.4" r="1.15" />
      <circle cx="0" cy="-4.3" r="1.3" />
      <circle cx="2.4" cy="-3.4" r="1.15" />
    </g>
  );
}

/** 標題旁的一小段腳印：一大一小往右走 */
export function Footprints({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 28"
      className={className}
      aria-hidden
      focusable="false"
    >
      {/* 大人腳印（蜜杏） */}
      <Print x={10} y={18} rotate={78} fill="var(--apricot)" opacity={0.75} />
      <Print x={34} y={9} rotate={100} fill="var(--apricot)" opacity={0.85} />
      <Print x={58} y={18} rotate={78} fill="var(--apricot)" opacity={0.95} />
      {/* 寶寶腳印（燕麥，走在旁邊） */}
      <Print x={24} y={23} scale={0.55} rotate={85} fill="#cfa96f" opacity={0.8} />
      <Print x={44} y={19} scale={0.55} rotate={95} fill="#cfa96f" opacity={0.9} />
      <Print x={70} y={23} scale={0.55} rotate={85} fill="#cfa96f" />
    </svg>
  );
}

/** 地圖占位畫面的插畫：兩串腳印越過山丘，走向一間有愛心的小房子 */
export function NestScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 132"
      className={className}
      aria-hidden
      focusable="false"
    >
      {/* 太陽與雲 */}
      <circle cx="52" cy="30" r="14" fill="#f6c983" />
      <g fill="#fff" opacity="0.9">
        <ellipse cx="130" cy="26" rx="20" ry="8" />
        <ellipse cx="146" cy="21" rx="14" ry="7" />
        <ellipse cx="262" cy="34" rx="17" ry="7" />
      </g>
      {/* 山丘 */}
      <path
        d="M-4 132 Q 90 74 200 108 L 200 132 Z"
        fill="var(--blush)"
      />
      <path
        d="M120 132 Q 250 66 364 112 L 364 132 Z"
        fill="var(--oat)"
      />
      {/* 小房子（托嬰中心的家） */}
      <g transform="translate(276 58)">
        <rect x="-24" y="8" width="48" height="36" rx="4" fill="var(--panel)" stroke="var(--apricot)" strokeWidth="2.5" />
        <path d="M-30 10 L0 -14 L30 10 Z" fill="var(--blush)" stroke="var(--apricot)" strokeWidth="2.5" strokeLinejoin="round" />
        {/* 門 */}
        <path d="M-7 44 L-7 26 Q0 18 7 26 L7 44 Z" fill="var(--oat)" stroke="var(--apricot)" strokeWidth="2" />
        {/* 山牆上的愛心 */}
        <path
          d="M0 4.6 C -1.4 1.6 -5.4 1.4 -5.4 -1.6 C -5.4 -3.5 -3.9 -4.6 -2.4 -4.6 C -1.2 -4.6 -0.4 -3.9 0 -3 C 0.4 -3.9 1.2 -4.6 2.4 -4.6 C 3.9 -4.6 5.4 -3.5 5.4 -1.6 C 5.4 1.4 1.4 1.6 0 4.6 Z"
          fill="var(--apricot)"
        />
      </g>
      {/* 大腳印牽小腳印，走向家 */}
      <Print x={26} y={112} rotate={62} fill="var(--apricot)" opacity={0.55} />
      <Print x={62} y={99} rotate={78} fill="var(--apricot)" opacity={0.65} />
      <Print x={100} y={104} rotate={64} fill="var(--apricot)" opacity={0.75} />
      <Print x={138} y={92} rotate={80} fill="var(--apricot)" opacity={0.85} />
      <Print x={176} y={97} rotate={66} fill="var(--apricot)" opacity={0.95} />
      <Print x={212} y={88} rotate={76} fill="var(--apricot)" />
      <Print x={42} y={122} scale={0.55} rotate={70} fill="#cfa96f" opacity={0.6} />
      <Print x={78} y={112} scale={0.55} rotate={82} fill="#cfa96f" opacity={0.7} />
      <Print x={116} y={115} scale={0.55} rotate={70} fill="#cfa96f" opacity={0.8} />
      <Print x={152} y={105} scale={0.55} rotate={84} fill="#cfa96f" opacity={0.9} />
      <Print x={190} y={108} scale={0.55} rotate={72} fill="#cfa96f" />
      <Print x={224} y={100} scale={0.55} rotate={80} fill="#cfa96f" />
    </svg>
  );
}
