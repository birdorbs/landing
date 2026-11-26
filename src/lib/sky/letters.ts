/** Rows 0-1 are ascenders, 2-6 the x-height, and 7-8 descenders; a glyph lists only the rows it reaches. */
const GLYPHS: Record<string, string[]> = {
	a: ['.....', '.....', '.XXX.', '....X', '.XXXX', 'X...X', '.XXXX'],
	b: ['X....', 'X....', 'XXXX.', 'X...X', 'X...X', 'X...X', 'XXXX.'],
	d: ['....X', '....X', '.XXXX', 'X...X', 'X...X', 'X...X', '.XXXX'],
	g: ['.....', '.....', '.XXXX', 'X...X', 'X...X', 'X...X', '.XXXX', '....X', '.XXX.'],
	h: ['X....', 'X....', 'XXXX.', 'X...X', 'X...X', 'X...X', 'X...X'],
	i: ['X', '.', 'X', 'X', 'X', 'X', 'X'],
	k: ['X...', 'X...', 'X..X', 'X.X.', 'XX..', 'X.X.', 'X..X'],
	l: ['X', 'X', 'X', 'X', 'X', 'X', 'X'],
	m: ['.....', '.....', 'XX.X.', 'X.X.X', 'X.X.X', 'X.X.X', 'X.X.X'],
	o: ['.....', '.....', '.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.'],
	q: ['.....', '.....', '.XXXX', 'X...X', 'X...X', 'X...X', '.XXXX', '....X', '....X'],
	r: ['....', '....', 'X.XX', 'XX..', 'X...', 'X...', 'X...'],
	s: ['.....', '.....', '.XXXX', 'X....', '.XXX.', '....X', 'XXXX.'],
	t: ['.X.', '.X.', 'XXX', '.X.', '.X.', '.X.', '..X'],
	u: ['.....', '.....', 'X...X', 'X...X', 'X...X', 'X...X', '.XXXX']
};

export const BASELINE_ROWS = 7;
export const ROWS = 9;
const MAX_CELL = 22;

export interface Point {
	x: number;
	y: number;
}

export interface WordLayout {
	cell: number;
	/** The y just below the lowest row of dots. */
	bottom: number;
	homes: Point[];
}

const glyphsOf = (word: string) => [...word].map((ch) => GLYPHS[ch]);

/** Width of `word` in dot columns. */
export function columnsOf(word: string): number {
	const glyphs = glyphsOf(word);
	return glyphs.reduce((n, g) => n + g[0].length, 0) + glyphs.length - 1;
}

/** Dot positions for `word` with its first column at `left` and row 0 at `top`, in column order. */
export function placeWord(word: string, left: number, top: number, cell: number): Point[] {
	const homes: Point[] = [];
	let column = 0;
	for (const glyph of glyphsOf(word)) {
		for (let c = 0; c < glyph[0].length; c++) {
			for (let r = 0; r < glyph.length; r++) {
				if (glyph[r][c] === 'X') homes.push({ x: left + (column + c) * cell, y: top + r * cell });
			}
		}
		column += glyph[0].length + 1;
	}
	return homes;
}

/** The wordmark, centred across the top of the page, in column order so a reveal can sweep left to right. */
export function layoutWord(word: string, width: number, height: number): WordLayout {
	const columns = columnsOf(word);
	const cell = Math.min((width * 0.88) / columns, (height * 0.2) / BASELINE_ROWS, MAX_CELL);
	const left = (width - (columns - 1) * cell) / 2;
	const top = Math.max(36, height * 0.09) + cell / 2;
	return { cell, bottom: top + (BASELINE_ROWS - 0.5) * cell, homes: placeWord(word, left, top, cell) };
}
