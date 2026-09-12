import React, { useState } from 'react';

const CHAIN_BLOCKS = [
  {
    index: 48280,
    label: 'BLOCK #48280',
    type: 'PREV_BLOCK',
    hash: '0x8f3c49e28ba709320e1d',
    fullHash: '0x8f3c49e28ba709320e1d88921cf89b31d0442387',
    merkleRoot: '0x3a19e4f0...bc2',
    status: 'SEALED',
    timestamp: '11:41:55',
    color: 'tertiary'
  },
  {
    index: 48281,
    label: 'BLOCK #48281',
    type: 'CURRENT_LEDGER',
    hash: '0x4ea94dfb19a3d9dc8c7e',
    fullHash: '0x4ea94dfb19a3d9dc8c7ec78912d0912fa834c90e',
    merkleRoot: '0x4ea94dfb...9a1',
    status: 'VERIFIED',
    timestamp: '11:42:01',
    color: 'tertiary',
    active: true
  },
  {
    index: 48282,
    label: 'BLOCK #48282',
    type: 'INBOUND_STAGE',
    hash: '0xc29d18b4fa8001a4e9b9',
    fullHash: '0xc29d18b4fa8001a4e9b98a3e71239ab77d4021e5',
    merkleRoot: '0x992fa83...77e',
    status: 'LINKING',
    timestamp: '11:42:04',
    color: 'secondary'
  }
];

export function CryptoChain3D({ fallbackBlock = '48281', force2D = false }) {
  const [hoveredBlock, setHoveredBlock] = useState(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between font-mono text-[11px] pb-2 border-b border-border-muted">
        <span className="text-tertiary font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
          <span>IMMUTABLE LEDGER // 3-BLOCK CHAIN</span>
        </span>
        <span className="text-text-dim text-[10px]">
          {force2D ? 'SHA-256 VERIFIED' : 'HOVER CUBE TO ROTATE'}
        </span>
      </div>

      {/* 3D or 2D Linked Chain Container */}
      <div
        className="relative py-4 px-2 flex flex-col gap-3 items-center justify-center"
        style={force2D ? {} : { perspective: '1000px' }}
      >
        {CHAIN_BLOCKS.map((block, idx) => {
          const isHovered = !force2D && hoveredBlock === block.index;
          const isCurrent = block.index === Number(fallbackBlock) || block.active;

          return (
            <React.Fragment key={block.index}>
              {/* Dimensional Block Cube (or Flat in 2D Mode) */}
              <div
                onMouseEnter={() => !force2D && setHoveredBlock(block.index)}
                onMouseLeave={() => !force2D && setHoveredBlock(null)}
                className="w-full relative cursor-pointer group"
                style={
                  force2D
                    ? {}
                    : {
                        transformStyle: 'preserve-3d',
                        transform: isHovered
                          ? 'rotateY(-18deg) rotateX(8deg) translateZ(12px)'
                          : 'rotateY(0deg) rotateX(0deg) translateZ(0px)',
                        transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
                      }
                }
              >
                {/* 3D Shadow Plate behind the block */}
                <div
                  className="absolute inset-0 rounded-xl bg-black/40 blur-md pointer-events-none transition-opacity duration-300"
                  style={{
                    transform: 'translateZ(-15px)',
                    opacity: isHovered ? 0.8 : 0.4
                  }}
                />

                {/* Main Front Face */}
                <div
                  className={`p-3.5 rounded-xl border font-mono text-xs transition-all relative z-10 backdrop-blur-md ${
                    isCurrent
                      ? 'bg-surface-dim/95 border-tertiary shadow-[0_0_20px_rgba(78,222,163,0.2)]'
                      : 'bg-surface-dim/80 border-border-muted hover:border-tertiary/50'
                  }`}
                  style={{
                    transform: 'translateZ(6px)'
                  }}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-border-muted text-[10px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          block.status === 'VERIFIED'
                            ? 'bg-tertiary animate-ping'
                            : 'bg-secondary'
                        }`}
                      />
                      <span className="font-bold text-text-primary">{block.label}</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold text-[9px] border ${
                        block.status === 'VERIFIED'
                          ? 'text-tertiary bg-tertiary/15 border-tertiary/30'
                          : 'text-secondary bg-secondary/15 border-secondary/30'
                      }`}
                    >
                      {block.status}
                    </span>
                  </div>

                  {/* Hash & Merkle Data revealed dynamically */}
                  <div className="pt-2 flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-text-dim text-[10px]">SHA-256:</span>
                      <span
                        className={`truncate font-bold font-mono transition-colors ${
                          isHovered ? 'text-tertiary' : 'text-text-muted'
                        }`}
                        title={block.fullHash}
                      >
                        {isHovered ? block.fullHash.slice(0, 24) + '...' : block.hash + '...'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-text-dim">MERKLE ROOT:</span>
                      <span className="text-secondary font-mono truncate">{block.merkleRoot}</span>
                    </div>

                    {isHovered && (
                      <div className="mt-1 pt-1 border-t border-border-muted/60 flex items-center justify-between text-[9px] text-tertiary font-bold animate-in fade-in duration-200">
                        <span>INTEGRITY: 100% UNBROKEN</span>
                        <span>{block.timestamp} UTC</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3D Connector Link between blocks */}
              {idx < CHAIN_BLOCKS.length - 1 && (
                <div
                  className="flex flex-col items-center justify-center my-[-2px] relative z-0"
                  style={{
                    transform: 'translateZ(0px)'
                  }}
                >
                  <div className="w-[3px] h-4 bg-gradient-to-b from-tertiary via-secondary to-tertiary rounded-full shadow-[0_0_8px_rgba(78,222,163,0.5)] animate-pulse" />
                  <span className="material-symbols-outlined text-[14px] text-tertiary/70 my-[-5px]">
                    link
                  </span>
                  <div className="w-[3px] h-4 bg-gradient-to-b from-tertiary via-secondary to-tertiary rounded-full shadow-[0_0_8px_rgba(78,222,163,0.5)] animate-pulse" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
