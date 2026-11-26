const GLYPHS: Record<string, string[]> = {
	b: ['X....', 'X....', 'XXXX.', 'X...X', 'X...X', 'X...X', 'XXXX.'],
	i: ['X', '.', 'X', 'X', 'X', 'X', 'X'],
	r: ['....', '....', 'X.XX', 'XX..', 'X...', 'X...', 'X...'],
	d: ['....X', '....X', '.XXXX', 'X...X', 'X...X', 'X...X', '.XXXX'],
	o: ['.....', '.....', '.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.'],
	s: ['.....', '.....', '.XXXX', 'X....', '.XXX.', '....X', 'XXXX.']
};

const ROWS = 7;
const MAX_CELL = 22;

export interface WordLayout {
	cell: number;
	homes: { x: number; y: number }[];
}

/** Dot positions for `word`, centred horizontally, in column order so a reveal can sweep left to right. */
export function layoutWord(word: string, width: number, height: number): WordLayout {
	const glyphs = [...word].map((ch) => GLYPHS[ch]);
	const columns = glyphs.reduce((n, g) => n + g[0].length, 0) + glyphs.length - 1;
	const cell = Math.min((width * 0.88) / columns, (height * 0.2) / ROWS, MAX_CELL);
	const left = (width - (columns - 1) * cell) / 2;
	const top = height * 0.56 - ((ROWS - 1) * cell) / 2;

	const homes: WordLayout['homes'] = [];
	let column = 0;
	for (const glyph of glyphs) {
		for (let c = 0; c < glyph[0].length; c++) {
			for (let r = 0; r < ROWS; r++) {
				if (glyph[r][c] === 'X') homes.push({ x: left + (column + c) * cell, y: top + r * cell });
			}
		}
		column += glyph[0].length + 1;
	}
	return { cell, homes };
}
