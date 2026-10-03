import { Chess } from "chess.js";

const GLYPH: Record<string, string> = {
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

export function Board({ fen, flipped, lastMove }: { fen: string; flipped?: boolean; lastMove?: { from: string; to: string } | undefined }) {
  const board = new Chess(fen).board();
  const rows = flipped ? [...board].reverse().map((r) => [...r].reverse()) : board;
  const files = flipped ? "hgfedcba" : "abcdefgh";
  const ranks = flipped ? "12345678" : "87654321";
  return (
    <div className="grid aspect-square w-full grid-cols-8 overflow-hidden rounded-lg border border-border shadow-board">
      {rows.flatMap((row, r) =>
        row.map((sq, c) => {
          const name = files[c]! + ranks[r]!;
          const light = (r + c) % 2 === 0;
          const hl = lastMove && (lastMove.from === name || lastMove.to === name);
          return (
            <div
              key={name}
              className={`relative flex items-center justify-center ${light ? "bg-square-light" : "bg-square-dark"} ${hl ? "after:absolute after:inset-0 after:bg-highlight/45" : ""}`}
            >
              {c === 0 && <span className="absolute left-1 top-0.5 text-[10px] font-semibold text-square-label">{ranks[r]}</span>}
              {r === 7 && <span className="absolute bottom-0.5 right-1 text-[10px] font-semibold text-square-label">{files[c]}</span>}
              {sq && (
                <span
                  className={`relative z-10 select-none text-[min(8vw,3.4rem)] leading-none ${sq.color === "w" ? "piece-white" : "piece-black"}`}
                >
                  {GLYPH[sq.type]}
                </span>
              )}
            </div>
          );
        }),
      )}
    </div>
  );
}
