var BLOCKED$1 = /* @__PURE__ */ new Set([
	"3,2",
	"4,2",
	"3,5",
	"4,5"
]);
var SETUP_ROWS = {
	H: [
		5,
		6,
		7
	],
	AI: [
		0,
		1,
		2
	]
};
var BAL = {
	RSI_EVERY: 6,
	MAX_STR: 10,
	COPIES: 2,
	MAX_ROUNDS: 100,
	AGI: 8,
	ASI: 10,
	SPY_MIN: 8,
	SPY_MAX: 9,
	BOOST_MIN: 5,
	BOOST_MAX: 6,
	DRAIN: 1,
	BACKUP: 7
};
var onDC = (s, r, c) => !!s.dc && s.dc[0] === r && s.dc[1] === c;
var BOOSTS = (p) => p.side === "AI" && p.type === "X" && p.str >= BAL.BOOST_MIN && p.str <= BAL.BOOST_MAX;
var ARMIES = {
	H: [
		["F", 0],
		["T", 0],
		["T", 0],
		["T", 0],
		["S", 1],
		["S", 1],
		["S", 1],
		["M", 3],
		["M", 3],
		["M", 3],
		["A", 1],
		["C", 2],
		["C", 2],
		["X", 5],
		["X", 5],
		["X", 6],
		["X", 6],
		["X", 6],
		["X", 7],
		["X", 7],
		["X", 8],
		["X", 9]
	],
	AI: [
		["F", 0],
		["T", 0],
		["T", 0],
		["T", 0],
		["S", 1],
		["S", 1],
		["S", 1],
		["M", 3],
		["M", 3],
		["M", 3],
		["I", 2],
		["A", 1],
		["C", 2],
		["C", 2],
		["K", 0],
		["X", 5],
		["X", 5],
		["X", 6],
		["X", 6],
		["X", 7],
		["X", 7],
		["X", 8]
	]
};
var LEVELS_UP = (t) => t !== "F" && t !== "T" && t !== "K";
var COPYABLE = (t) => ![
	"F",
	"T",
	"R",
	"I"
].includes(t);
var PLACE = {
	X: (p) => p.str,
	K: () => 3,
	S: () => 1,
	M: () => 2,
	A: () => 4,
	C: () => 3,
	R: () => 4,
	P: () => 3,
	I: () => 6
};
function rng(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function shuffle(arr, r) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(r() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}
var FORMATIONS = {
	H: [
		{
			name: "Fortress",
			hint: "The Internet in a corner, walled in.",
			rows: [
				"FT89C67S",
				"T7MA6MC5",
				"S56.MTS."
			]
		},
		{
			name: "Keep",
			hint: "The Internet mid-row, big numbers around.",
			rows: [
				"S5TF798T",
				"6M7TSACM",
				"5C.6M6.S"
			]
		},
		{
			name: "Spearhead",
			hint: "Top agents up front. Attack early.",
			rows: [
				"FT9C5ST5",
				"T6CM6MSA",
				".6877MS."
			]
		},
		{
			name: "Wall",
			hint: "Honeypots across the back, two fake flags.",
			rows: [
				"TFT98S7T",
				"M7MC6ACS",
				"65S.5M6."
			]
		},
		{
			name: "Bluff",
			hint: "Traps where the flag would be.",
			rows: [
				"T6S8C9TF",
				"5M7ACM6T",
				"S56.MS7."
			]
		}
	],
	AI: [
		{
			name: "Fortress",
			hint: "Kill switch in the corner, walled in.",
			rows: [
				"FT8IC67S",
				"T7MA6MCK",
				"S5M.5TS."
			]
		},
		{
			name: "Keep",
			hint: "Kill switch mid-row, big numbers around.",
			rows: [
				"S8TFTI7C",
				"6M6T7ACK",
				"5S.5MM.S"
			]
		},
		{
			name: "Spearhead",
			hint: "Top agents up front. Attack early.",
			rows: [
				"FT5CMSTI",
				"T6KM6ASS",
				".877C5M."
			]
		},
		{
			name: "Wall",
			hint: "Backdoors across the back, two fake switches.",
			rows: [
				"TFTSIC8T",
				"M7MC6A7S",
				"65S.KM5."
			]
		},
		{
			name: "Bluff",
			hint: "Traps where the switch would be.",
			rows: [
				"T6S8CITF",
				"KM7ACM6T",
				"S5M.5S7."
			]
		}
	]
};
var FORM_ROWS = (side) => side === "H" ? [
	7,
	6,
	5
] : [
	0,
	1,
	2
];
function formationSpots(side, f, mine, mirror) {
	const pool = mine.slice(), spots = /* @__PURE__ */ new Map(), digits = [];
	f.rows.forEach((row, i) => [...row].forEach((ch, c) => {
		if (ch === ".") return;
		const sq = [FORM_ROWS(side)[i], mirror ? 7 - c : c];
		if (/\d/.test(ch)) {
			digits.push({
				n: +ch,
				sq
			});
			return;
		}
		const k = pool.findIndex((p) => p.type === ch);
		if (k < 0) throw new Error("lineup " + f.name + ": no " + ch + " left");
		spots.set(pool.splice(k, 1)[0], sq);
	}));
	if (pool.some((p) => p.type !== "X") || pool.length !== digits.length) throw new Error("lineup " + f.name + ": piece count");
	for (const exact of [true, false]) for (const d of digits) {
		if (d.done) continue;
		let bi = -1, bd = 99;
		pool.forEach((p, k) => {
			const dd = Math.abs(p.str - d.n);
			if (dd < bd && (!exact || dd === 0)) {
				bd = dd;
				bi = k;
			}
		});
		if (bi >= 0) {
			spots.set(pool.splice(bi, 1)[0], d.sq);
			d.done = true;
		}
	}
	return spots;
}
function randomSpots(side, mine, r) {
	const spots = /* @__PURE__ */ new Map();
	const rows = SETUP_ROWS[side];
	const back = side === "H" ? 7 : 0;
	const front = side === "H" ? Math.min(...rows) : Math.max(...rows);
	const gapCols = shuffle([
		0,
		1,
		2,
		3,
		4,
		5,
		6,
		7
	], r).slice(0, 2);
	const squares = [];
	for (const row of rows) for (let c = 0; c < 8; c++) if (!(row === front && gapCols.includes(c))) squares.push([row, c]);
	shuffle(squares, r);
	const flagSq = squares.find((sq) => sq[0] === back);
	const rest = squares.filter((sq) => sq !== flagSq);
	const fwd = side === "H" ? -1 : 1;
	const near = rest.filter((sq) => Math.abs(sq[0] - flagSq[0]) + Math.abs(sq[1] - flagSq[1]) === 1).sort((a, b) => (b[0] - flagSq[0]) * fwd - (a[0] - flagSq[0]) * fwd);
	const far = rest.filter((sq) => !near.includes(sq));
	const depth = ([row]) => Math.abs(row - back);
	far.sort((a, b) => depth(a) + r() * 1.3 - (depth(b) + r() * 1.3));
	const flag = mine.find((p) => p.type === "F"), traps = mine.filter((p) => p.type === "T");
	const others = mine.filter((p) => p.type !== "F" && p.type !== "T").sort((a, b) => PLACE[b.type](b) + r() * 1.5 - (PLACE[a.type](a) + r() * 1.5));
	spots.set(flag, flagSq);
	traps.forEach((t, k) => spots.set(t, near[k] || far.shift()));
	const key = side === "H" ? others.reduce((m, p) => p.type === "X" && (!m || p.str > m.str) ? p : m, null) : others.find((p) => p.type === "I");
	if (key) {
		const bi = far.findIndex((sq) => sq[0] === back);
		if (bi >= 0) {
			spots.set(key, far.splice(bi, 1)[0]);
			others.splice(others.indexOf(key), 1);
		}
	}
	others.forEach((p, k) => spots.set(p, far[k]));
	return spots;
}
function layoutSide(s, side, form, r) {
	const mine = s.pieces.filter((p) => p.side === side), mirror = r() < .5;
	const spots = form == null ? randomSpots(side, mine, r) : formationSpots(side, FORMATIONS[side][form], mine, mirror);
	for (const [p, [row, c]] of spots) {
		p.r = row;
		p.c = c;
	}
	if (side === "H") {
		const free = [];
		for (const row of SETUP_ROWS.H) for (let c = 0; c < 8; c++) if (!mine.some((p) => p.r === row && p.c === c)) free.push([row, c]);
		free.sort((a, b) => Math.abs(a[1] - 3.5) - Math.abs(b[1] - 3.5) || a[0] - b[0]);
		const back = 7, mid = (p) => Math.abs(p.c - 3.5);
		const step = mine.filter((p) => p.r === back && p.type !== "F" && p.type !== "T" && !(p.type === "X" && p.str === 9)).sort((a, b) => PLACE[a.type](a) - PLACE[b.type](b) || mid(a) - mid(b))[0];
		if (step && free.length) {
			s.dc = [back, step.c];
			[step.r, step.c] = free[0];
		} else s.dc = free[0];
	}
	s.forms[side] = form;
	s.mirror[side] = mirror;
	return s;
}
function newGame(seed, forms = {}) {
	const r = rng(seed);
	const pieces = [];
	let id = 0;
	for (const side of ["H", "AI"]) for (const [type, str] of ARMIES[side]) pieces.push({
		id: id++,
		side,
		type,
		str,
		revealed: false,
		r: -1,
		c: -1
	});
	const s = {
		pieces,
		turn: "H",
		round: 1,
		copies: {
			H: BAL.COPIES,
			AI: BAL.COPIES
		},
		winner: null,
		rsi: true,
		agi: false,
		asi: false,
		cut: false,
		log: "Humans to move.",
		last: null,
		seed,
		events: [],
		history: [],
		pass: false,
		needSetup: null,
		forms: {},
		mirror: {},
		dc: null
	};
	for (const side of ["H", "AI"]) layoutSide(s, side, forms[side] === void 0 ? Math.floor(r() * FORMATIONS[side].length) : forms[side], r);
	return s;
}
for (const side of ["H", "AI"]) FORMATIONS[side].forEach((f, k) => formationSpots(side, f, ARMIES[side].map(([type, str], id) => ({
	id,
	side,
	type,
	str
})), k % 2 === 1));
var at$1 = (s, r, c) => s.pieces.find((p) => p.r === r && p.c === c);
var inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8 && !BLOCKED$1.has(r + "," + c);
var DIRS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1]
];
var other = (side) => side === "H" ? "AI" : "H";
var sqName = (r, c) => "abcdefgh"[c] + (r + 1);
var neighbours = (s, p) => DIRS.map(([dr, dc]) => at$1(s, p.r + dr, p.c + dc)).filter(Boolean);
function copySource(s, p) {
	return neighbours(s, p).filter((q) => q.side === p.side && COPYABLE(q.type)).sort((a, b) => b.str - a.str)[0] || null;
}
function legalMoves(s, p) {
	if (p.type === "F" || p.type === "T") return [];
	const out = [];
	const canCopy = p.type === "R" && s.copies[p.side] > 0 && copySource(s, p);
	for (const [dr, dc] of DIRS) {
		let r = p.r + dr, c = p.c + dc;
		while (inb(r, c)) {
			const q = at$1(s, r, c);
			if (q) {
				if (q.side !== p.side) out.push({ to: [r, c] });
				break;
			}
			out.push({ to: [r, c] });
			if (canCopy) out.push({
				to: [r, c],
				copy: true
			});
			if (p.type !== "S") break;
			r += dr;
			c += dc;
		}
	}
	return out;
}
var brainOf = (s) => s.pieces.find((x) => x.type === "I" && x.side === "AI");
var isSuper = (p) => p.type === "I" && p.str >= BAL.ASI;
var isFragile = (p) => p.type === "I" && p.str <= 0;
var isCTO = (p) => p.side === "H" && homeSide(p) === "H" && p.type === "X" && (p.base ?? p.str) === 9;
var drainable = (s) => {
	const b = brainOf(s);
	return !!b && s.asi && b.str > 0;
};
var isBackup = (p) => p.side === "H" && p.type === "X" && p.str >= BAL.BACKUP;
var canDrain = (s, p) => isCTO(p) || isBackup(p) && !s.pieces.some(isCTO);
function drainer(s) {
	const c = s.pieces.find(isCTO);
	if (c) return c;
	if (!s.dc) return null;
	const d = (p) => Math.abs(p.r - s.dc[0]) + Math.abs(p.c - s.dc[1]);
	return s.pieces.filter(isBackup).sort((a, b) => d(a) - d(b) || a.r - b.r || a.c - b.c)[0] || null;
}
var draining = (s) => drainable(s) && s.pieces.some((p) => canDrain(s, p) && onDC(s, p.r, p.c));
function sideMoves(s, side) {
	const out = [];
	for (const p of s.pieces) if (p.side === side) for (const m of legalMoves(s, p)) out.push({
		p,
		...m
	});
	return out;
}
function clone(s) {
	return {
		...s,
		pieces: s.pieces.map((p) => ({ ...p })),
		copies: { ...s.copies },
		events: [],
		history: s.history.slice(-40)
	};
}
var snap = (x) => ({
	id: x.id,
	side: x.side,
	type: x.type,
	str: x.str,
	base: x.base,
	hidden: !x.revealed
});
function apply(s0, move) {
	const s = clone(s0);
	const p = s.pieces.find((x) => x.id === move.p.id);
	const side = p.side;
	const [r, c] = move.to;
	const q = at$1(s, r, c);
	const kill = (x) => {
		s.pieces = s.pieces.filter((y) => y.id !== x.id);
	};
	const convert = (x, to) => {
		x.side = to;
		x.revealed = false;
		delete x.spot;
		x.seen = true;
	};
	const from = sqName(p.r, p.c), to = sqName(r, c);
	let line = "";
	if (move.copy) {
		const src = copySource(s, p);
		s.copies[side]--;
		s.pieces.push({
			id: Math.max(...s.pieces.map((x) => x.id)) + 1,
			side,
			type: src.type,
			str: src.str,
			revealed: false,
			r,
			c
		});
		p.revealed = true;
		delete p.spot;
		line = `${who(side)} replicator copied the piece next to it.`;
		s.events.push({
			kind: "copy",
			r,
			c
		});
		s.history.push({
			round: s.round,
			side,
			text: line
		});
	} else if (!q) {
		p.r = r;
		p.c = c;
		s.history.push({
			round: s.round,
			side,
			text: `${side === "H" || p.revealed ? name(p) : "AI piece"} ${from} → ${to}`,
			mv: {
				from,
				to,
				open: !!p.revealed
			}
		});
	} else {
		const ev = {
			kind: "fight",
			r,
			c,
			a: snap(p),
			d: snap(q),
			result: "",
			line: ""
		};
		p.seen = true;
		q.seen = true;
		if (q.type === "F") {
			kill(q);
			p.r = r;
			p.c = c;
			s.winner = side;
			ev.result = "flag";
			line = side === "H" ? "Humans hit the kill switch." : "The AI got out onto the Internet.";
		} else if (q.type === "T") {
			if (p.type === "M") {
				kill(q);
				p.r = r;
				p.c = c;
				ev.result = "defuse";
				line = `${name(p)} removed the ${roleName(q)}.`;
			} else if (isSuper(p)) {
				kill(q);
				p.r = r;
				p.c = c;
				ev.result = "defuse";
				line = `${name(p)} saw through the ${roleName(q)} and removed it.`;
			} else {
				const was = name(p);
				kill(q);
				p.r = r;
				p.c = c;
				convert(p, q.side);
				ev.result = "trapped";
				line = `${was} fell into a ${roleName(q)} and switched sides: ${name(p).replace(/^\S+ /, "")}.`;
			}
		} else if (isFragile(p) || isFragile(q)) {
			if (isFragile(q)) {
				kill(q);
				p.r = r;
				p.c = c;
				ev.result = "win";
				line = `${name(p)} found the fragile 🧠 and took it out.`;
			} else {
				kill(p);
				ev.result = "lose";
				line = `The fragile 🧠 attacked ${name(q)} and fell.`;
			}
		} else if ((p.type === "K" || q.type === "K") && !isSuper(p.type === "K" ? q : p)) {
			const fake = p.type === "K" ? p : q, real = fake === p ? q : p;
			kill(p);
			kill(q);
			ev.result = "tie";
			ev.mirror = real.str;
			line = `${name(fake)} copied ${name(real)}; both fell.`;
		} else if (p.type === "A") {
			if (q.str >= BAL.SPY_MIN && q.str <= BAL.SPY_MAX && LEVELS_UP(q.type)) {
				kill(q);
				p.r = r;
				p.c = c;
				ev.result = "win";
				line = `${name(p)} took out ${name(q)}.`;
			} else {
				kill(p);
				ev.result = "lose";
				line = `${name(p)} lost: ${name(q)} isn't an ${BAL.SPY_MIN} or ${BAL.SPY_MAX}.`;
			}
		} else if (p.str > q.str) {
			if (p.type === "P") {
				convert(q, side);
				ev.result = "convert";
				line = `${name(p)} turned ${name(q)}.`;
			} else {
				kill(q);
				p.r = r;
				p.c = c;
				ev.result = "win";
				line = `${name(p)} beats ${name(q)}.`;
			}
		} else if (p.str === q.str) {
			kill(p);
			kill(q);
			ev.result = "tie";
			line = `${name(p)} and ${name(q)} both fall.`;
		} else {
			kill(p);
			ev.result = "lose";
			line = `${name(p)} loses to ${name(q)}.`;
		}
		ev.line = line;
		s.events.push(ev);
		s.history.push({
			round: s.round,
			side,
			text: line,
			a: ev.a,
			d: ev.d,
			result: ev.result,
			at: to
		});
	}
	for (const e of s.pieces) if (e.spot && !neighbours(s, e).some((sc) => sc.type === "C" && sc.side !== e.side)) {
		e.revealed = false;
		delete e.spot;
	}
	for (const sc of s.pieces) if (sc.type === "C") {
		for (const e of neighbours(s, sc)) if (e.side !== sc.side && !e.revealed) {
			e.revealed = true;
			e.spot = true;
			e.seen = true;
			s.events.push({
				kind: "reveal",
				r: e.r,
				c: e.c
			});
			s.history.push({
				round: s.round,
				side: sc.side,
				text: `${who(sc.side)} ${roleName(sc)} spotted ${name(e)} at ${sqName(e.r, e.c)}.`
			});
		}
	}
	const mover = s.pieces.find((x) => x.id === move.p.id);
	if (mover && !s.cut && BOOSTS(mover) && !mover.boosted && onDC(s, mover.r, mover.c) && mover.str < BAL.MAX_STR) {
		const was = mover.str;
		mover.base = mover.base ?? was;
		mover.str++;
		mover.boosted = true;
		const t = `${who(mover.side)} ${roleName(mover)} took power from the datacenter: ${was} → ${mover.str}.`;
		s.events.push({
			kind: "boost",
			r: mover.r,
			c: mover.c,
			id: mover.id,
			from: was,
			to: mover.str
		});
		s.history.push({
			round: s.round,
			side: mover.side,
			text: `${t} (Fighters 5–6 get +1, once.)`
		});
		line = line ? `${line} 🏢 ${was} → ${mover.str}.` : t;
	}
	s.last = {
		from: [move.p.r, move.p.c],
		to: [r, c],
		side
	};
	const hadRsi = s.rsi;
	s.rsi = !!brainOf(s);
	if (hadRsi && !s.rsi && !s.winner) {
		line += " The 🧠 is gone.";
		s.history.push({
			round: s.round,
			side: "H",
			text: "The AI's self-improver is gone. The AI stops growing."
		});
	}
	s.log = line || (side === "H" ? "AI to move." : "Humans to move.");
	if (!s.winner && side === "H" && draining(s)) {
		const b = brainOf(s), was = b.str, first = !s.cut;
		b.str = Math.max(0, b.str - BAL.DRAIN);
		s.cut = true;
		const t = b.str > 0 ? `Power draining: the 🧠 drops to ${b.str}.` : "Power out: the 🧠 is at 0 and fragile. Any piece that finds it kills it.";
		s.events.push({
			kind: "drain",
			from: was,
			to: b.str,
			first
		});
		s.history.push({
			round: s.round,
			side,
			text: first ? `${t} It stops growing for good, and the 🏢 gives no more +1s.` : t,
			mile: first || b.str === 0
		});
		s.log = line ? `${line} 🧠 ${was} → ${b.str}.` : t;
	}
	if (!s.winner) {
		if (side === "AI") {
			s.round++;
			if (s.rsi) {
				const brain = brainOf(s);
				if ((s.round - 1) % BAL.RSI_EVERY === 0 && brain.str < BAL.MAX_STR && !s.cut) {
					brain.str++;
					s.events.push({ kind: "rsi" });
					s.log = "The self-improver grew.";
					s.history.push({
						round: s.round,
						side: "AI",
						text: "The 🧠 self-improver grew."
					});
				}
			}
			const top = brainOf(s);
			if (top && !s.agi && top.str >= BAL.AGI) {
				s.agi = true;
				s.events.push({ kind: "agi" });
				s.log = "The AI has reached AGI.";
				s.history.push({
					round: s.round,
					side: "AI",
					text: "The AI has reached AGI.",
					mile: true
				});
			}
			if (top && !s.asi && top.str >= BAL.ASI) {
				s.asi = true;
				s.events.push({ kind: "asi" });
				s.log = "The AI has reached superintelligence.";
				s.history.push({
					round: s.round,
					side: "AI",
					text: "The AI has reached superintelligence.",
					mile: true
				});
			}
			if (s.round > BAL.MAX_ROUNDS) {
				s.winner = "D";
				s.log = `Round ${BAL.MAX_ROUNDS} is over and nobody got through. A draw.`;
			}
		}
		s.turn = other(side);
		if (!s.winner && sideMoves(s, s.turn).length === 0) {
			s.winner = other(s.turn);
			s.log = s.turn === "H" ? "The humans have nothing left that can move." : "The AI has nothing left that can move.";
		}
	}
	s.drainOn = !s.winner && s.cut && draining(s) && (side === "H" || !!s.drainOn);
	return s;
}
var who = (side) => side === "H" ? "Human" : "AI";
var homeSide = (p) => p.home || (p.id == null ? p.side : p.id < ARMIES.H.length ? "H" : "AI");
var isTurned = (p) => p.side !== homeSide(p);
var charSide = (p) => !isTurned(p) || p.type === "X" && !CHARS[p.side][p.base ?? p.str] ? homeSide(p) : p.side;
var CHARS = {
	H: {
		5: "researcher",
		6: "regulator",
		7: "operative",
		8: "general",
		9: "CTO"
	},
	AI: {
		5: "swarm",
		6: "bot",
		7: "mech",
		8: "rogue agent"
	}
};
var roleName = (p, as = charSide(p)) => p.type === "X" ? CHARS[as][p.base ?? p.str] || "agent" : ROLE[as][p.type];
var ROLE = {
	H: {
		S: "drone",
		M: "engineer",
		A: "whistleblower",
		C: "scanner",
		R: "replicator",
		P: "persuader",
		I: "self-improver",
		K: "deepfake",
		X: "agent",
		T: "honeypot",
		F: "Internet"
	},
	AI: {
		S: "crawler",
		M: "hacker",
		A: "virus",
		C: "scanner",
		R: "replicator",
		P: "persuader",
		I: "self-improver",
		K: "deepfake",
		X: "agent",
		T: "backdoor",
		F: "kill switch"
	}
};
var ICON = {
	H: {
		F: "🌐",
		T: "🍯",
		S: "🚁",
		M: "🧑‍🔧",
		A: "📢",
		C: "📡",
		R: "🧬",
		P: "🗣",
		I: "🧠",
		K: "🎭",
		X: ""
	},
	AI: {
		F: "🛑",
		T: "🚪",
		S: "🕷",
		M: "💻",
		A: "🦠",
		C: "📡",
		R: "🧬",
		P: "🗣",
		I: "🧠",
		K: "🎭",
		X: ""
	}
};
var CHAR = {
	H: {
		5: "🧑‍🔬",
		6: "🧑‍⚖️",
		7: "🕵️",
		8: "🪖",
		9: "🤵"
	},
	AI: {
		5: "🐝",
		6: "🤖",
		7: "🦾",
		8: "👾"
	}
};
var iconOf = (p, as = charSide(p)) => p.type === "X" ? CHAR[as][p.base ?? p.str] || "⚔️" : ICON[as][p.type];
function name(p) {
	const n = LEVELS_UP(p.type) ? ` ${p.str}` : "";
	if (!isTurned(p)) return `${who(p.side)} ${roleName(p)}${n}`;
	const now = `${iconOf(p)} ${roleName(p)}`, was = `${iconOf(p, homeSide(p))} ${roleName(p, homeSide(p))}`;
	return `${who(p.side)} turned ${now}${n}${now === was ? "" : ` (was ${was})`}`;
}
var known = (q) => q.revealed || q.seen;
function botMove(s, side, r) {
	const moves = sideMoves(s, side);
	if (!moves.length) return null;
	const fwd = side === "H" ? -1 : 1;
	const enemyBack = side === "H" ? 0 : 7;
	const brain = brainOf(s), high = drainable(s) ? brain : null, drainNow = draining(s);
	const dr = drainer(s), isDrainer = (p) => !!dr && dr.id === p.id;
	const ctoLives = s.pieces.some(isCTO), virusFor = (q) => known(q) ? q.str >= BAL.SPY_MIN && q.str <= BAL.SPY_MAX : ctoLives;
	const toDC = (rr, cc) => s.dc ? Math.abs(rr - s.dc[0]) + Math.abs(cc - s.dc[1]) : 0;
	let best = null, bestScore = -Infinity;
	for (const m of moves) {
		const p = m.p, [tr, tc] = m.to, q = at$1(s, tr, tc);
		let sc = r() * 2;
		if (high) {
			if (isDrainer(p)) sc += (toDC(p.r, p.c) - toDC(tr, tc)) * 20 + (onDC(s, tr, tc) ? 40 : 0) - (onDC(s, p.r, p.c) ? 120 : 0);
			if (side === "AI" && q && onDC(s, tr, tc) && (isSuper(p) || p.type === "A" && virusFor(q))) sc += 40;
		}
		if (side === "AI" && drainNow && (p.type === "A" || p.type === "K" || p.type === "I" && p.str >= 9)) {
			const dq = at$1(s, s.dc[0], s.dc[1]), go = p.type !== "A" || dq && virusFor(dq);
			if (go && q && onDC(s, tr, tc)) sc += p.type === "A" && !known(q) ? 350 : 60;
			else if (go && !q) sc += (toDC(p.r, p.c) - toDC(tr, tc)) * 4;
		}
		if (side === "AI" && !s.cut && BOOSTS(p) && !p.boosted) {
			if (onDC(s, tr, tc)) sc += 30;
			else sc += (toDC(p.r, p.c) - toDC(tr, tc)) * .6;
		}
		if (side === "AI" && isFragile(p)) {
			if (q) sc -= 300;
			for (const [dr, dc] of DIRS) {
				const e = at$1(s, tr + dr, tc + dc);
				if (e && e.side !== side) sc -= 40;
			}
		}
		if (side === "H" && brain && isFragile(brain) && q && !known(q)) sc += 6;
		if (m.copy) {
			const src = copySource(s, p);
			sc += s.round >= 4 ? 10 + src.str * 4 : -50;
		} else if (q) {
			if (p.type === "K" && !(known(q) && (q.type === "F" || q.type === "T"))) sc += known(q) ? isSuper(q) ? -120 : q.str * 6 - 10 : 8;
			else if (p.type === "A") sc += known(q) && q.str >= BAL.SPY_MIN && q.str <= BAL.SPY_MAX && LEVELS_UP(q.type) ? 200 : -150;
			else if (known(q)) {
				if (q.type === "F") sc += 1e3;
				else if (q.type === "T") sc += p.type === "M" || isSuper(p) ? 80 : -1e3;
				else if (q.type === "K") sc += isSuper(p) ? 80 : 10 - p.str * 4;
				else if (q.type === "I" && p.str > q.str) sc += 300;
				else if (p.str > q.str) sc += 60 + q.str * 4 + (p.type === "P" ? 25 : 0);
				else if (p.str === q.str) sc += -4;
				else sc += -120;
			} else {
				sc += p.type === "S" ? 8 : (p.str - 3) * 6;
				if (tr === enemyBack) sc += 12;
				if (p.str >= 5 || p.type === "R" || p.type === "P") sc -= 8;
				if (p.type === "M") sc += 4;
				if (isSuper(p)) sc += 40;
			}
		} else {
			if (p.type === "A" || p.type === "C") sc -= 2;
			if (p.type === "I" && !isSuper(p)) sc -= 30;
			sc += (tr - p.r) * fwd * 3;
			if (p.type === "S" && Math.abs(tr - p.r) + Math.abs(tc - p.c) > 1) sc -= 2;
			for (const [dr, dc] of DIRS) {
				const e = at$1(s, tr + dr, tc + dc);
				if (e && e.side !== side && known(e) && (p.type === "K" ? false : e.type === "K" ? p.str >= 5 : LEVELS_UP(e.type) && e.str > p.str)) sc -= 15;
			}
			if (p.type === "R" && s.copies[side] > 0) {
				let bestN = 0;
				for (const [dr, dc] of DIRS) {
					const e = at$1(s, tr + dr, tc + dc);
					if (e && e.side === side && COPYABLE(e.type)) bestN = Math.max(bestN, e.str);
				}
				sc += bestN * 2;
			}
			if (s.last && s.last.side === side && s.last.to[0] === p.r && s.last.to[1] === p.c && s.last.from[0] === tr && s.last.from[1] === tc) sc -= 10;
		}
		if (sc > bestScore) {
			bestScore = sc;
			best = m;
		}
	}
	return best;
}
function simulate(games, seed0 = 1) {
	let h = 0, ai = 0, draws = 0, rounds = 0, agi = 0, asi = 0, rsiDead = 0, cuts = 0, boosts = 0;
	for (let g = 0; g < games; g++) {
		let s = newGame(seed0 + g);
		const r = rng(seed0 * 7919 + g);
		while (!s.winner) {
			const m = botMove(s, s.turn, r);
			if (!m) break;
			s = apply(s, m);
			if (s.events.some((e) => e.kind === "boost")) boosts++;
		}
		if (s.winner === "H") h++;
		else if (s.winner === "D") draws++;
		else ai++;
		rounds += s.round;
		if (s.agi) agi++;
		if (s.asi) asi++;
		if (!s.rsi) rsiDead++;
		if (s.cut) cuts++;
	}
	return {
		games,
		humanWins: h,
		aiWins: ai,
		draws,
		avgRounds: Math.round(rounds / games),
		agiGames: agi,
		asiGames: asi,
		brainKilled: rsiDead,
		powerDrained: cuts,
		boostsPerGame: +(boosts / games).toFixed(2)
	};
}
// web/src/bots.js
var BOT_LEVELS = [
	"easy",
	"medium",
	"hard"
];
var BOT_NAME = {
	easy: "Easy",
	medium: "Medium",
	hard: "Hard"
};
var toLevel = (v) => BOT_LEVELS.includes(v) ? v : "medium";
function levelBot(level) {
	const mem = {};
	return level === "easy" ? (s, side, r) => easyMove(s, side, r) : level === "hard" ? (s, side, r) => hardMove(s, side, r, mem) : botMove;
}
function botSetup(s, side, level, r) {
	if (level === "hard") layoutSide(s, side, HARD.FORMS[side][Math.floor(r() * HARD.FORMS[side].length)], r);
	if (level !== "easy") return s;
	layoutSide(s, side, null, r);
	const flag = s.pieces.find((p) => p.side === side && p.type === "F");
	const mid = s.pieces.filter((p) => p.side === side && p.r === SETUP_ROWS[side][1] && p.type !== "T");
	const swap = mid[Math.floor(r() * mid.length)];
	if (swap) {
		const t = [flag.r, flag.c];
		flag.r = swap.r;
		flag.c = swap.c;
		swap.r = t[0];
		swap.c = t[1];
	}
	return s;
}
var EASY = {
	SHARP: .5,
	SPOT: .25
};
function easyMove(s, side, r) {
	const moves = sideMoves(s, side);
	if (!moves.length) return null;
	if (r() < EASY.SHARP) {
		const m = botMove(s, side, r), q = at$1(s, m.to[0], m.to[1]);
		if (!(q && known(q) && q.type === "F") || r() < EASY.SPOT) return m;
	}
	const fwd = side === "H" ? -1 : 1;
	let best = null, bs = -Infinity;
	for (const m of moves) {
		if (m.copy) continue;
		const p = m.p, q = at$1(s, m.to[0], m.to[1]);
		let sc = r() * 10 + (m.to[0] - p.r) * fwd * 3 + (q ? 3 : 0);
		if (q && known(q) && q.type === "F" && r() > EASY.SPOT) sc -= 50;
		if (p.type === "I" && !isSuper(p)) sc -= 6;
		if (s.last && s.last.side === side && s.last.to[0] === p.r && s.last.to[1] === p.c && s.last.from[0] === m.to[0] && s.last.from[1] === m.to[1]) sc -= 5;
		if (sc > bs) {
			bs = sc;
			best = m;
		}
	}
	return best || moves[0];
}
var HARD = {
	FLAG: 400,
	CTO_LEAD: 10,
	CTO_RISK: 30,
	BRAIN: -2,
	GUARD: {
		H: 6,
		AI: 3
	},
	TOP: 25,
	WORLDS: 12,
	LOOK: 10,
	GATE_MINE: 40,
	GATE_THEIRS: 20,
	FORMS: {
		H: [0, 2],
		AI: [0, 3]
	}
};
var HV = {
	F: 0,
	T: 4,
	S: 2,
	M: 4.5,
	A: 5,
	C: 3.5,
	K: 6,
	R: 4,
	P: 4
};
var XV = {
	1: 1,
	2: 2,
	3: 3,
	4: 4,
	5: 5,
	6: 6.5,
	7: 8.5,
	8: 11,
	9: 14,
	10: 16
};
function hardVal(s, p) {
	if (p.type === "X") return (XV[p.str] || p.str) + (canDrain(s, p) && brainOf(s) && brainOf(s).str > 0 ? 6 : 0);
	if (p.type === "I") return isFragile(p) ? 2 : 14 + p.str * 2;
	return HV[p.type];
}
function fightOf(s, a, d) {
	if (d.type === "F") return "flag";
	if (d.type === "T") return a.type === "M" || isSuper(a) ? "defuse" : "trapped";
	if (isFragile(a) || isFragile(d)) return isFragile(d) ? "win" : "lose";
	if ((a.type === "K" || d.type === "K") && !isSuper(a.type === "K" ? d : a)) return "tie";
	if (a.type === "A") return d.str >= BAL.SPY_MIN && d.str <= BAL.SPY_MAX && LEVELS_UP(d.type) ? "win" : "lose";
	return a.str > d.str ? "win" : a.str === d.str ? "tie" : "lose";
}
var bySquare = (a, b) => a.r - b.r || a.c - b.c;
function hardOdds(s, side, mem) {
	const foe = other(side), hidden = s.pieces.filter((q) => q.side === foe && !known(q)).sort(bySquare);
	const pool = /* @__PURE__ */ new Map();
	for (const q of hidden) {
		const k = q.type + q.str;
		const e = pool.get(k);
		if (e) e.n++;
		else pool.set(k, {
			type: q.type,
			str: q.str,
			side: foe,
			n: 1
		});
	}
	const kinds = [...pool.values()].sort((a, b) => a.type < b.type ? -1 : a.type > b.type ? 1 : a.str - b.str), back = foe === "H" ? 7 : 0;
	const W = hidden.map((q) => kinds.map((k) => {
		const moved = mem.moved.has(q.id), depth = Math.abs(q.r - back);
		if (mem.slid.has(q.id)) return k.type === "S" ? 1 : 0;
		if (k.type === "F" || k.type === "T") return moved ? 0 : depth === 0 ? 3 : depth === 1 ? 1 : .3;
		if (k.type === "I") return moved ? isSuper(k) ? 1 : .15 : depth === 0 ? 3 : .4;
		return moved ? 1.2 : 1;
	}));
	for (let it = 0; it < 4; it++) {
		kinds.forEach((k, j) => {
			let t = 0;
			for (const row of W) t += row[j];
			if (t > 0) for (const row of W) row[j] *= k.n / t;
		});
		for (const row of W) {
			let t = 0;
			for (const x of row) t += x;
			if (t > 0) for (let j = 0; j < row.length; j++) row[j] /= t;
		}
	}
	const odds = /* @__PURE__ */ new Map();
	hidden.forEach((q, i) => odds.set(q.id, kinds.map((k, j) => ({
		type: k.type,
		str: k.str,
		side: foe,
		w: W[i][j]
	})).filter((x) => x.w > .001)));
	return odds;
}
function hardNote(s, side, mem) {
	if (mem.seed !== s.seed || !mem.moved || s.round < (mem.round || 0)) {
		mem.seed = s.seed;
		mem.moved = /* @__PURE__ */ new Set();
		mem.slid = /* @__PURE__ */ new Set();
		mem.seen = null;
	}
	mem.round = s.round;
	const L = s.last;
	if (L && L.side !== side && L !== mem.seen) {
		mem.seen = L;
		const q = at$1(s, L.to[0], L.to[1]);
		if (q && q.side === L.side && !(L.from[0] === L.to[0] && L.from[1] === L.to[1])) {
			mem.moved.add(q.id);
			if (Math.abs(L.from[0] - L.to[0]) + Math.abs(L.from[1] - L.to[1]) > 1) mem.slid.add(q.id);
		}
	}
}
function hardMove(s, side, r, mem) {
	hardNote(s, side, mem);
	const moves = sideMoves(s, side);
	if (!moves.length) return null;
	const foe = other(side), fwd = side === "H" ? -1 : 1;
	const odds = hardOdds(s, side, mem);
	const brain = brainOf(s), ten = brain && isSuper(brain) ? brain : null, high = drainable(s), drainNow = draining(s);
	const outed = (q) => drainNow && q.side === "H" && onDC(s, q.r, q.c);
	const exact = (q) => [{
		type: q.type,
		str: q.str,
		side: q.side,
		w: 1,
		base: q.base,
		id: q.id
	}];
	const ctoLives = s.pieces.some(isCTO);
	const kinds = (q) => {
		if (known(q)) return exact(q);
		if (!outed(q)) return odds.get(q.id) || [];
		if (ctoLives) return exact(q);
		const all = odds.get(q.id) || [], ok = all.filter((k) => k.type === "X" && k.str >= BAL.BACKUP), t = ok.reduce((a, k) => a + k.w, 0);
		return t > 0 ? ok.map((k) => ({
			...k,
			w: k.w / t
		})) : all;
	};
	const myFlag = s.pieces.find((p) => p.side === side && p.type === "F");
	const dist = (a, b, c, d) => Math.abs(a - c) + Math.abs(b - d);
	const toDC = (rr, cc) => s.dc ? dist(rr, cc, s.dc[0], s.dc[1]) : 0;
	const dr = drainer(s), isDrainer = (p) => !!dr && dr.id === p.id, drainerLeft = !!dr;
	const foes = s.pieces.filter((q) => q.side === foe).sort(bySquare);
	const pOf = (q, t) => known(q) ? q.type === t ? 1 : 0 : (odds.get(q.id) || []).reduce((a, k) => a + (k.type === t ? k.w : 0), 0);
	const flagOdds = foes.map((q) => [q, pOf(q, "F")]).filter((x) => x[1] > .02).sort((a, b) => b[1] - a[1]).slice(0, 4);
	const goals = side === "H" && brain && !isSuper(brain) ? foes.map((q) => [q, pOf(q, "F") + HARD.BRAIN * pOf(q, "I")]).filter((x) => x[1] > .02).sort((a, b) => b[1] - a[1]).slice(0, 4) : flagOdds;
	const shown = (p) => p.revealed || p.seen;
	function risk(p, rr, cc, isKnown, skip) {
		let worst = 0;
		for (const [dr, dc] of DIRS) {
			const e = at$1(s, rr + dr, cc + dc);
			if (!e || e.side !== foe || e.id === skip) continue;
			let lose = 0, gain = 0;
			for (const k of kinds(e)) {
				if (k.type === "F" || k.type === "T") continue;
				const f = fightOf(s, k, p), v = hardVal(s, p);
				if (f === "win" || f === "flag") lose += k.w * v;
				else if (f === "tie") lose += k.w * (v - hardVal(s, k));
				else if (f === "defuse") lose += k.w * v;
				else if (f === "lose") gain += k.w * hardVal(s, k);
			}
			const go = isKnown ? .9 : .35;
			worst = Math.max(worst, go * lose - go * .3 * gain);
		}
		return worst;
	}
	const mobile = (e) => known(e) ? e.type === "F" || e.type === "T" ? 0 : 1 : 1 - pOf(e, "F") - pOf(e, "T");
	const slider = (e) => known(e) ? e.type === "S" ? 1 : 0 : mem.slid.has(e.id) ? 1 : pOf(e, "S");
	function flagThreat(fr, fc, tr, tc, mover, enemyThere) {
		if (!myFlag) return 0;
		const occ = (rr, cc) => rr === fr && cc === fc ? null : rr === tr && cc === tc ? enemyThere || mover : at$1(s, rr, cc);
		let t = 0;
		for (const [dr, dc] of DIRS) {
			let rr = myFlag.r + dr, cc = myFlag.c + dc, d = 1;
			while (inb(rr, cc)) {
				const e = occ(rr, cc);
				if (e) {
					if (e.side === foe) t += d === 1 ? mobile(e) : slider(e);
					break;
				}
				if (d === 1) for (const [er, ec] of DIRS) {
					const e2 = occ(rr + er, cc + ec);
					if (e2 && e2.side === foe && !(rr + er === myFlag.r && cc + ec === myFlag.c)) t += .3 * mobile(e2);
				}
				rr += dr;
				cc += dc;
				d++;
			}
		}
		return t;
	}
	const scored = [];
	for (const m of moves) {
		const p = m.p, [tr, tc] = m.to, q = at$1(s, tr, tc);
		let sc = r();
		if (!m.copy && myFlag) {
			let pWin = 1, pTrap = 0;
			if (q) {
				pWin = 0;
				for (const k of kinds(q)) {
					const f = fightOf(s, p, k);
					if (f === "win" || f === "defuse" || f === "flag") pWin += k.w;
					else if (f === "trapped") pTrap += k.w;
				}
			}
			const turned = {
				...p,
				side: foe,
				seen: true
			};
			const t = (pWin > 0 ? pWin * flagThreat(p.r, p.c, tr, tc, p, null) : 0) + (pTrap > 0 ? pTrap * flagThreat(p.r, p.c, tr, tc, p, turned) : 0) + (pWin + pTrap < 1 ? (1 - pWin - pTrap) * flagThreat(p.r, p.c, tr, tc, p, q) : 0);
			sc -= t * HARD.FLAG;
		}
		if (m.copy) {
			const src = copySource(s, p);
			sc += s.round >= 4 ? 4 + src.str : -50;
		} else if (q) {
			let ev = 0, pWin = 0;
			for (const k of kinds(q)) {
				const f = fightOf(s, p, k), vq = hardVal(s, k), vp = hardVal(s, p);
				let v = 0;
				if (f === "flag") v = 5e3;
				else if (f === "defuse") v = HV.T + 3;
				else if (f === "trapped") v = -1.8 * vp + HV.T;
				else if (f === "win") v = vq;
				else if (f === "tie") v = vq - vp;
				else v = -vp;
				if (f === "win" || f === "defuse" || f === "flag") pWin += k.w;
				ev += k.w * v;
			}
			sc += ev * 10;
			if (!known(q) && !outed(q)) sc += 4 + flagOdds.reduce((a, [x, w]) => a + (x.id === q.id ? w * 30 : 0), 0);
			if (pWin > 0) sc -= pWin * risk(p, tr, tc, true, q.id) * 10;
			sc += risk(p, p.r, p.c, shown(p)) * 10 * .5;
			if (myFlag) {
				const d = dist(tr, tc, myFlag.r, myFlag.c);
				if (d <= 2) sc += (d === 1 ? 60 : 25) * pWin;
			}
			if (isDrainer(p) && brain && brain.str > 0 && !known(q)) sc -= HARD.CTO_RISK;
			if (isDrainer(p) && drainNow) sc -= 100;
			if ((ten || drainNow) && side === "AI" && onDC(s, tr, tc)) sc += 200 * pWin;
			if (side === "AI" && !s.cut && BOOSTS(p) && !p.boosted && onDC(s, tr, tc)) sc += 30 * pWin;
		} else {
			sc += (risk(p, p.r, p.c, shown(p)) - risk(p, tr, tc, shown(p))) * 10;
			const step = (tr - p.r) * fwd;
			const pr = p.type === "I" && !isSuper(p);
			if (pr) sc -= 25;
			else if (p.type === "X" || p.type === "K") sc += step * 2;
			else if (p.type === "M" || p.type === "C") sc += step * 2.5;
			else if (p.type === "S") sc += step * .5;
			else if (p.type === "A") sc += step * .8;
			if (!pr && !isDrainer(p) && goals.length) {
				const g = p.type === "M" ? 6 : p.type === "X" && p.str >= 6 ? 2 : p.type === "C" ? 2 : 1;
				for (const [x, w] of goals) sc += (dist(p.r, p.c, x.r, x.c) - dist(tr, tc, x.r, x.c)) * g * w * 2;
			}
			for (const e of foes) {
				if (!known(e)) continue;
				const d0 = dist(p.r, p.c, e.r, e.c), d1 = dist(tr, tc, e.r, e.c);
				if (d0 > 4) continue;
				const f = fightOf(s, p, e);
				if (f === "win" || f === "defuse" || f === "flag") sc += (d0 - d1) * Math.min(20, hardVal(s, e)) * .6;
			}
			if (isDrainer(p) && brain && brain.str > 0 && (high || !s.asi)) {
				const eta = (BAL.ASI - brain.str) * BAL.RSI_EVERY, w = high || eta <= toDC(p.r, p.c) * 2 + HARD.CTO_LEAD ? 25 : 4;
				sc += (toDC(p.r, p.c) - toDC(tr, tc)) * w + (onDC(s, tr, tc) ? 60 : 0) - (onDC(s, p.r, p.c) ? 80 : 0) - step * 2;
			}
			if (ten) {
				if (side === "AI" && p === ten && drainerLeft) sc += (toDC(p.r, p.c) - toDC(tr, tc)) * 12;
			}
			if (side === "AI" && drainNow && (p.type === "A" || p.type === "K" || p.type === "I" && p.str >= 9)) sc += (toDC(p.r, p.c) - toDC(tr, tc)) * 12;
			if (side === "AI" && !s.cut && BOOSTS(p) && !p.boosted) {
				if (onDC(s, tr, tc)) sc += 30;
				else sc += (toDC(p.r, p.c) - toDC(tr, tc)) * 1.5;
			}
			if (side === "AI" && isFragile(p)) sc -= 10;
			if (s.last && s.last.side === side && s.last.to[0] === p.r && s.last.to[1] === p.c && s.last.from[0] === tr && s.last.from[1] === tc) sc -= 8;
			if (myFlag && dist(p.r, p.c, myFlag.r, myFlag.c) === 1 && p.type !== "S") sc -= HARD.GUARD[side];
		}
		scored.push({
			m,
			sc
		});
	}
	scored.sort((a, b) => b.sc - a.sc);
	const top = scored.slice(0, HARD.TOP);
	if (top.length > 1 && HARD.WORLDS > 0) {
		const worlds = [];
		const wOdds = new Map(odds);
		for (const q of foes) if (!known(q) && outed(q)) wOdds.set(q.id, kinds(q));
		for (let w = 0; w < HARD.WORLDS; w++) worlds.push(hardWorld(s, foe, wOdds, r));
		const rr = rng(Math.floor(r() * 4294967296));
		for (const t of top) {
			let tot = 0;
			for (const ws of worlds) {
				const s1 = apply(ws, t.m);
				if (s1.winner) {
					tot += hardEval(s1, side);
					continue;
				}
				const reply = botMove(s1, foe, rr);
				tot += hardEval(reply ? apply(s1, reply) : s1, side);
			}
			t.sc += tot / worlds.length * HARD.LOOK;
		}
		top.sort((a, b) => b.sc - a.sc);
	}
	return top[0].m;
}
function hardWorld(s, foe, odds, r) {
	const w = clone(s), left = /* @__PURE__ */ new Map();
	w.pieces.sort(bySquare);
	const hidden = w.pieces.filter((q) => q.side === foe && !known(q));
	for (const q of hidden) {
		const k = q.type + "," + q.str;
		left.set(k, (left.get(k) || 0) + 1);
	}
	shuffle(hidden, r);
	for (const q of hidden) {
		const opts = (odds.get(q.id) || []).filter((k) => left.get(k.type + "," + k.str) > 0);
		let pick = null;
		if (opts.length) {
			let t = 0;
			for (const k of opts) t += k.w;
			let x = r() * t;
			for (const k of opts) {
				x -= k.w;
				if (x <= 0) {
					pick = k;
					break;
				}
			}
			pick = pick || opts[opts.length - 1];
		} else {
			const k = [...left.keys()].sort().find((k) => left.get(k) > 0).split(",");
			pick = {
				type: k[0],
				str: +k[1]
			};
		}
		const key = pick.type + "," + pick.str;
		left.set(key, left.get(key) - 1);
		q.type = pick.type;
		q.str = pick.str;
		delete q.base;
	}
	return w;
}
function hardEval(s, side) {
	if (s.winner) return s.winner === side ? 1e3 : s.winner === "D" ? 0 : -1e3;
	let v = 0;
	for (const p of s.pieces) {
		const mine = p.side === side;
		v += (mine ? 1 : -1) * hardVal(s, p);
		if (p.type !== "F") continue;
		for (const [dr, dc] of DIRS) {
			let rr = p.r + dr, cc = p.c + dc, d = 1;
			while (inb(rr, cc)) {
				const e = at$1(s, rr, cc);
				if (e) {
					if (e.side !== p.side && e.type !== "F" && e.type !== "T" && (d === 1 || e.type === "S")) v += (mine ? -1 : 1) * (mine ? HARD.GATE_MINE : HARD.GATE_THEIRS);
					break;
				}
				rr += dr;
				cc += dc;
				d++;
			}
		}
	}
	return v;
}
function endTitle(s, me) {
	if (s.winner === "D") return "TIME'S UP · DRAW";
	const loser = other(s.winner);
	return (!!s.pieces.some((p) => p.type === "F" && p.side === loser) ? "NO MOVES" : s.winner === "AI" ? "IT GOT OUT" : "SHUT DOWN") + (s.winner === me ? " · YOU WIN" : " · YOU LOSE");
}
// web/src/ui/text.js
var NEW_ICON = {
	"🌐": "🌍",
	"🚁": "🛸",
	"🧑‍🔧": "🔧"
};
Object.assign(ICON.H, {
	F: "🌍",
	S: "🛸",
	M: "🔧"
});
var OLD_GLYPHS = new RegExp(Object.keys(NEW_ICON).join("|"), "gu");
var reglyph = (t) => t.replace(OLD_GLYPHS, (g) => NEW_ICON[g]);
var cap$1 = (s) => s[0].toUpperCase() + s.slice(1);
var BACKUPS = (faces) => "a " + [...new Set(ARMIES.H.filter(([t, n]) => t === "X" && n >= BAL.BACKUP && n < 9).map((x) => x[1]))].sort((a, b) => a - b).map((n) => faces ? `${CHAR.H[n]} ${n}` : n).join(" or ");
var ABOUT = {
	X: (p, s) => isCTO(p) ? `Higher wins. At 🧠${BAL.ASI}, park on 🏢: −${BAL.DRAIN} a turn.` : s && isBackup(p) && !s.pieces.some(isCTO) ? `Higher wins. CTO dead: at 🧠${BAL.ASI}, park on 🏢: −${BAL.DRAIN} a turn.` : BOOSTS(p) && !p.boosted && !(s && s.cut) ? "Higher number wins; same, both fall. +1 once on the 🏢." : "Higher number wins a fight; the same number, both fall.",
	S: (p) => `${charSide(p) === "H" ? "Flies" : "Scuttles"} any distance in a straight line.`,
	M: (p) => p.side === "H" ? "Fights as a 3, and removes a backdoor safely." : "Fights as a 3, and removes a honeypot safely.",
	A: (p) => `Takes out an ${BAL.SPY_MIN} or ${BAL.SPY_MAX} it attacks; loses any other attack.`,
	C: () => "Shows the enemies next to it, only while they stay next to it.",
	T: (p) => p.side === "H" ? "Can't move. An AI piece that attacks it joins the humans." : "Can't move. A human piece that attacks it joins the AI.",
	F: (p) => p.side === "H" ? "Can't move. If the AI reaches it, it gets out onto the Internet." : "Can't move. If the humans reach it, the AI is shut down.",
	R: () => "Copies the AI piece next to it onto an empty square, twice a game.",
	I: (p, s) => s && s.cut ? p.str > 0 ? `Drained to ${p.str}: fights as a ${p.str} and never grows again.` : "Drained to 0: fragile, any piece that finds it kills it." : `Grows +1 every ${BAL.RSI_EVERY} rounds; at ${BAL.ASI} it beats everything. The CTO on 🏢 (once it's dead, a ${BAL.BACKUP}+) drains it.`,
	K: () => `Copies the number of whatever it fights, so both fall. Not a 🧠 at ${BAL.ASI}.`
};
// web/src/ui/sound.js
var SFX = {
	ctx: null,
	on: true
};
try {
	SFX.on = localStorage.getItem("ks-sound") !== "off";
} catch (e) {}
var SILENT_WAV = "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";
function mediaChannel() {
	try {
		if (navigator.audioSession && navigator.audioSession.type !== "playback") navigator.audioSession.type = "playback";
	} catch (e) {}
	try {
		if (!SFX.tag) {
			const a = SFX.tag = document.createElement("audio");
			a.src = SILENT_WAV;
			a.loop = true;
			a.preload = "auto";
			a.setAttribute("playsinline", "");
			a.setAttribute("x-webkit-airplay", "deny");
		}
		if (SFX.tag.paused && !document.hidden) {
			const pr = SFX.tag.play();
			if (pr && pr.catch) pr.catch(() => {});
		}
	} catch (e) {}
}
function audioCtx() {
	if (!SFX.ctx) {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return null;
		SFX.ctx = new AC();
	}
	if (SFX.ctx.state !== "running" && SFX.ctx.resume) SFX.ctx.resume().catch(() => {});
	return SFX.ctx;
}
function unlockAudio() {
	if (!SFX.on) return;
	mediaChannel();
	try {
		const ctx = audioCtx();
		if (!ctx || SFX.unlocked) return;
		const src = ctx.createBufferSource();
		src.buffer = ctx.createBuffer(1, 1, 22050);
		src.connect(ctx.destination);
		src.start(0);
		SFX.unlocked = ctx.state === "running";
	} catch (e) {}
}
for (const ev of [
	"pointerdown",
	"pointerup",
	"touchend",
	"click",
	"keydown"
]) document.addEventListener(ev, unlockAudio, {
	capture: true,
	passive: true
});
document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		if (SFX.tag) SFX.tag.pause();
	} else if (SFX.ctx && SFX.on) audioCtx();
});
window.addEventListener("pageshow", () => {
	if (SFX.ctx && SFX.on) audioCtx();
});
function tone(freq, dur, type = "square", gain = .08, when = 0, slide = null) {
	if (!SFX.on) return;
	try {
		const ctx = audioCtx();
		if (!ctx) return;
		const t0 = ctx.currentTime + when;
		const o = ctx.createOscillator(), g = ctx.createGain();
		o.type = type;
		o.frequency.setValueAtTime(freq, t0);
		if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
		g.gain.setValueAtTime(1e-4, t0);
		g.gain.exponentialRampToValueAtTime(gain, t0 + .01);
		g.gain.exponentialRampToValueAtTime(1e-4, t0 + dur);
		o.connect(g);
		g.connect(ctx.destination);
		o.start(t0);
		o.stop(t0 + dur + .02);
	} catch (e) {}
}
var sfx = {
	tap: () => tone(660, .05, "square", .04),
	move: () => tone(440, .07, "triangle", .06, 0, 520),
	hit: () => {
		tone(120, .18, "sawtooth", .12, 0, 50);
		tone(900, .04, "square", .05);
	},
	win: () => {
		tone(523, .08, "square", .06);
		tone(784, .12, "square", .06, .08);
	},
	lose: () => {
		tone(330, .1, "square", .06);
		tone(220, .18, "square", .06, .1);
	},
	reveal: () => tone(880, .12, "sine", .07, 0, 1320),
	level: () => {
		tone(392, .1, "triangle", .07);
		tone(494, .14, "triangle", .07, .1);
	},
	big: () => {
		tone(196, .5, "sawtooth", .09);
		tone(233, .5, "sawtooth", .07, .05);
		tone(294, .6, "sawtooth", .07, .1);
	},
	gameWin: () => [
		523,
		659,
		784,
		1047
	].forEach((f, i) => tone(f, .18, "square", .07, i * .12)),
	gameLose: () => {
		tone(220, .6, "sawtooth", .09, 0, 110);
		tone(165, .8, "sawtooth", .07, .1, 80);
	}
};
window.sfx = sfx;
var CODE_OK = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;
function myGames() {
	try {
		const g = JSON.parse(localStorage.getItem("ks-games") || "[]");
		return Array.isArray(g) ? g.filter((x) => x && CODE_OK.test(x.code) && typeof x.token === "string") : [];
	} catch (e) {
		return [];
	}
}
function saveGames(list) {
	try {
		localStorage.setItem("ks-games", JSON.stringify(list.slice(0, 20)));
	} catch (e) {}
}
function rememberGame(code, fields) {
	const list = myGames();
	saveGames([{
		...list.find((x) => x.code === code) || {},
		...fields,
		code,
		at: Date.now()
	}, ...list.filter((x) => x.code !== code)]);
	unhideGame(code);
}
function forgetGame(code) {
	saveGames(myGames().filter((x) => x.code !== code));
}
function hiddenGames() {
	try {
		const h = JSON.parse(localStorage.getItem("ks-hidden") || "[]");
		return new Set(Array.isArray(h) ? h.filter((c) => CODE_OK.test(c)) : []);
	} catch (e) {
		return /* @__PURE__ */ new Set();
	}
}
function saveHidden(set) {
	try {
		localStorage.setItem("ks-hidden", JSON.stringify([...set].slice(-50)));
	} catch (e) {}
}
function hideGame(code) {
	const h = hiddenGames();
	h.delete(code);
	h.add(code);
	saveHidden(h);
}
function unhideGame(code) {
	const h = hiddenGames();
	if (h.delete(code)) saveHidden(h);
}
// web/src/stats.js
var KEY$1 = "ks-stats";
var V = 1;
var LEVELS = [
	"easy",
	"medium",
	"hard"
];
var SIDES = ["H", "AI"];
var ENDS = [
	"killswitch",
	"internet",
	"nomoves",
	"rounds"
];
var MAX_GAMES = 50;
var MAX_SEEN = 200;
var rec = () => ({
	played: 0,
	won: 0,
	lost: 0,
	drawn: 0
});
var bySide = () => ({
	H: rec(),
	AI: rec()
});
function blankStats() {
	return {
		v: V,
		solo: Object.fromEntries(LEVELS.map((l) => [l, bySide()])),
		streak: 0,
		best: 0,
		ends: Object.fromEntries(ENDS.map((e) => [e, 0])),
		friend: bySide(),
		games: [],
		seen: []
	};
}
var num = (x) => Number.isInteger(x) && x >= 0 ? x : 0;
var int = (x) => Number.isInteger(x) ? x : 0;
var recOf = (r) => {
	const o = rec();
	if (r && typeof r === "object") for (const k of Object.keys(o)) o[k] = num(r[k]);
	return o;
};
function normalize(raw) {
	const s = blankStats();
	if (!raw || typeof raw !== "object" || raw.v !== V) return s;
	for (const l of LEVELS) for (const side of SIDES) s.solo[l][side] = recOf(raw.solo && raw.solo[l] && raw.solo[l][side]);
	for (const side of SIDES) s.friend[side] = recOf(raw.friend && raw.friend[side]);
	for (const e of ENDS) s.ends[e] = num(raw.ends && raw.ends[e]);
	s.streak = int(raw.streak);
	s.best = num(raw.best);
	s.games = (Array.isArray(raw.games) ? raw.games : []).filter((g) => g && typeof g.key === "string" && SIDES.includes(g.side) && [
		"won",
		"lost",
		"drawn"
	].includes(g.result)).map((g) => ({
		key: g.key,
		at: num(g.at),
		side: g.side,
		result: g.result,
		rounds: num(g.rounds)
	})).slice(0, MAX_GAMES);
	s.seen = (Array.isArray(raw.seen) ? raw.seen : []).filter((k) => typeof k === "string").slice(0, MAX_SEEN);
	return s;
}
var defaultStore = () => {
	try {
		return localStorage;
	} catch (e) {
		return null;
	}
};
function statsAvailable(store = defaultStore()) {
	try {
		if (!store) return false;
		store.setItem(KEY$1 + "-probe", "1");
		store.removeItem(KEY$1 + "-probe");
		return true;
	} catch (e) {
		return false;
	}
}
function loadStats(store = defaultStore()) {
	if (!statsAvailable(store)) return null;
	try {
		return normalize(JSON.parse(store.getItem("ks-stats") || "null"));
	} catch (e) {
		return blankStats();
	}
}
function saveStats(s, store = defaultStore()) {
	try {
		if (!store) return false;
		store.setItem(KEY$1, JSON.stringify(s));
		return true;
	} catch (e) {
		return false;
	}
}
var DEVICE_KEY = "ks-device";
function resetStats(store = defaultStore()) {
	try {
		if (!store) return false;
		store.removeItem(KEY$1);
		store.removeItem(DEVICE_KEY);
		return true;
	} catch (e) {
		return false;
	}
}
function endReason(state) {
	if (!state || !state.winner) return null;
	if (state.winner === "D") return "rounds";
	const loser = state.winner === "H" ? "AI" : "H";
	if (state.pieces.some((p) => p.type === "F" && p.side === loser)) return "nomoves";
	return state.winner === "H" ? "killswitch" : "internet";
}
var resultOf = (winner, side) => winner === "D" ? "drawn" : winner === side ? "won" : "lost";
var tally = (r, result) => {
	r.played++;
	r[result]++;
};
function recordSolo(s, { level, side, winner, reason }) {
	if (!LEVELS.includes(level) || !SIDES.includes(side) || ![
		"H",
		"AI",
		"D"
	].includes(winner)) return s;
	const result = resultOf(winner, side);
	tally(s.solo[level][side], result);
	if (ENDS.includes(reason)) s.ends[reason]++;
	s.streak = result === "won" ? Math.max(0, s.streak) + 1 : result === "lost" ? Math.min(0, s.streak) - 1 : 0;
	s.best = Math.max(s.best, s.streak);
	return s;
}
function recordFriend(s, { key, side, winner, rounds, at = Date.now() }) {
	if (typeof key !== "string" || !SIDES.includes(side) || ![
		"H",
		"AI",
		"D"
	].includes(winner) || s.seen.includes(key)) return false;
	const result = resultOf(winner, side);
	tally(s.friend[side], result);
	s.games = [{
		key,
		at,
		side,
		result,
		rounds: num(rounds)
	}, ...s.games].slice(0, MAX_GAMES);
	s.seen = [key, ...s.seen].slice(0, MAX_SEEN);
	return true;
}
function updateStats(fn, store = defaultStore()) {
	const s = loadStats(store);
	if (!s) return false;
	if (fn(s) === false) return false;
	return saveStats(s, store);
}
var sumRecs = (list) => list.reduce((a, r) => ({
	played: a.played + r.played,
	won: a.won + r.won,
	lost: a.lost + r.lost,
	drawn: a.drawn + r.drawn
}), rec());
var soloTotal = (s) => sumRecs(LEVELS.flatMap((l) => SIDES.map((side) => s.solo[l][side])));
var friendTotal = (s) => sumRecs(SIDES.map((side) => s.friend[side]));
var winPct = (r) => r.played ? Math.round(100 * r.won / r.played) : null;
var SIDE_LABEL$1 = {
	H: "🕵️ Humans",
	AI: "🧠 AI"
};
var SIDE_CLS$1 = {
	H: "h",
	AI: "ai"
};
var LEVEL_LABEL = {
	easy: "Easy",
	medium: "Medium",
	hard: "Hard"
};
var END_LABEL = {
	killswitch: "🛑 Kill switch hit",
	internet: "🌍 AI got out",
	nomoves: "⛔ No moves left",
	rounds: "⏱ Round limit (draw)"
};
var RESULT_LABEL$1 = {
	won: "WON",
	lost: "LOST",
	drawn: "DRAW"
};
var pctText = (r) => {
	const p = winPct(r);
	return p == null ? "–" : p + "%";
};
var head$1 = (first) => `<div class="st-row st-head"><span>${first}</span><span title="played">P</span><span title="won">W</span><span title="lost">L</span><span title="drawn">D</span><span title="win %">Win</span></div>`;
var row$1 = (label, cls, r) => `<div class="st-row${r.played ? "" : " zero"}"><span class="${cls}">${label}</span><span>${r.played}</span><span>${r.won}</span><span>${r.lost}</span><span>${r.drawn}</span><span>${pctText(r)}</span></div>`;
var tile$1 = (n, label, cls = "") => `<div class="st-tile ${cls}"><b>${n}</b><span>${label}</span></div>`;
var streakText$1 = (n) => n > 0 ? `${n}W` : n < 0 ? `${-n}L` : "–";
var dateText$1 = (at) => {
	const d = new Date(at);
	return isNaN(d) || !at ? "–" : d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric"
	});
};
function soloHtml(s) {
	const t = soloTotal(s);
	if (!t.played) return `<p class="st-empty">No solo games yet. Finish a game against the bot and it shows here.</p>`;
	return `<div class="st-tiles">${tile$1(t.played, "games")}${tile$1(streakText$1(s.streak), "streak", s.streak > 0 ? "up" : s.streak < 0 ? "down" : "")}${tile$1(s.best, "best streak")}</div>
    ${LEVELS.map((l) => `<div class="st-table" data-level="${l}">${head$1(LEVEL_LABEL[l])}${SIDES.map((side) => row$1(SIDE_LABEL$1[side], SIDE_CLS$1[side], s.solo[l][side])).join("")}</div>`).join("")}
    <div class="st-table">${head$1("All levels")}${row$1("Total", "", t)}</div>
    <div class="eyebrow">How games ended</div>
    <div class="st-ends">${ENDS.map((e) => `<div class="st-end" data-end="${e}"><span>${END_LABEL[e]}</span><b>${s.ends[e]}</b></div>`).join("")}</div>`;
}
function friendsHtml(s) {
	const t = friendTotal(s);
	if (!t.played) return `<p class="st-empty">No friend games yet. Play a friend and each finished game shows here.</p>`;
	const games = s.games.map((g) => {
		const them = g.side === "H" ? "AI" : "H";
		return `<div class="st-game ${g.result}"><span class="gd">${dateText$1(g.at)}</span><span class="${SIDE_CLS$1[g.side]}">${SIDE_LABEL$1[g.side]}</span><b>${RESULT_LABEL$1[g.result]}</b><span class="gv" title="vs ${them === "H" ? "the Humans" : "the AI"}">vs ${SIDE_LABEL$1[them].split(" ")[0]}</span><span class="gr">R${g.rounds}</span></div>`;
	}).join("");
	return `<div class="st-tiles">${tile$1(t.played, "games")}${tile$1(t.won, "won", "up")}${tile$1(t.lost, "lost", "down")}${tile$1(t.drawn, "drawn")}</div>
    <div class="st-table">${head$1("By side")}${SIDES.map((side) => row$1(SIDE_LABEL$1[side], SIDE_CLS$1[side], s.friend[side])).join("")}${row$1("Total", "", t)}</div>
    <div class="eyebrow">Games · newest first${s.games.length >= MAX_GAMES ? ` · the last ${MAX_GAMES}` : ""}</div>
    <div class="st-games">${games}</div>`;
}
var esc$2 = (t) => String(t).replace(/[&<>"']/g, (c) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[c]);
function statsHtml(s, tab = "solo", confirm = false, acct = null) {
	const tabs = `<div class="seg st-tabs" role="tablist" aria-label="Stats"><button id="st-solo" role="tab" aria-selected="${tab === "solo"}" aria-pressed="${tab === "solo"}">SOLO</button><button id="st-friends" role="tab" aria-selected="${tab === "friends"}" aria-pressed="${tab === "friends"}">FRIENDS</button></div>`;
	const back = `<button class="ghost" id="st-back">BACK</button>`;
	if (!s) return `<div class="eyebrow">Stats</div><h1>STATS</h1><p class="st-empty" id="st-off">Stats aren't available here: this browser won't let the game save anything on this device (private browsing, or storage is blocked). Games still play; they just aren't counted.</p>${back}`;
	const any = soloTotal(s).played + friendTotal(s).played > 0;
	if (acct) return `<div class="eyebrow" id="st-acct">${esc$2(acct.label)} · on every device</div><h1>STATS</h1>${tabs}${acct.note ? `<p class="st-note" id="st-note">${esc$2(acct.note)}</p>` : ""}<div class="st-body" id="st-body" data-tab="${tab}">${tab === "friends" ? friendsHtml(s) : soloHtml(s)}</div>${back}`;
	const reset = !any ? "" : confirm ? `<div class="st-confirm" id="st-confirm"><p>Reset all stats, solo and friends? This can't be undone.</p><div class="row2"><button class="ghost" id="st-cancel">CANCEL</button><button class="ghost danger" id="st-yes">RESET</button></div></div>` : `<button class="ghost st-reset" id="st-reset">RESET STATS</button>`;
	return `<div class="eyebrow">Kept on this device</div><h1>STATS</h1>${tabs}<div class="st-body" id="st-body" data-tab="${tab}">${tab === "friends" ? friendsHtml(s) : soloHtml(s)}</div>${back}${reset}`;
}
var statsParts = {
	head: head$1,
	row: row$1,
	tile: tile$1,
	streakText: streakText$1,
	dateText: dateText$1,
	esc: esc$2,
	SIDE_LABEL: SIDE_LABEL$1,
	SIDE_CLS: SIDE_CLS$1,
	RESULT_LABEL: RESULT_LABEL$1
};
// web/src/account.js
var KEY = "ks-acct";
var INFO = "ks-acct-info";
var DEVICE = DEVICE_KEY;
var MERGE_RETRY_MS = 600;
var store = () => {
	try {
		return localStorage;
	} catch (e) {
		return null;
	}
};
var read = (k) => {
	try {
		const s = store();
		return s ? JSON.parse(s.getItem(k) || "null") : null;
	} catch (e) {
		return null;
	}
};
var write = (k, v) => {
	try {
		const s = store();
		if (!s) return false;
		if (v == null) s.removeItem(k);
		else s.setItem(k, JSON.stringify(v));
		return true;
	} catch (e) {
		return false;
	}
};
var rand = (n = 16) => {
	const a = new Uint8Array(n);
	crypto.getRandomValues(a);
	return [...a].map((x) => x.toString(16).padStart(2, "0")).join("");
};
var SERVER = "";
function setServer(url) {
	SERVER = url;
}
function info() {
	const i = read(INFO);
	return i && i.server === SERVER ? i.accounts : null;
}
async function refreshInfo() {
	const r = await api("/", { timeout: 6e3 });
	if (r && r.status === 200 && r.body && typeof r.body === "object" && "engine" in r.body) write(INFO, {
		server: SERVER,
		at: Date.now(),
		accounts: r.body.accounts || null
	});
	return info();
}
function current() {
	const a = read(KEY);
	if (!a || a.v !== 1 || a.server !== SERVER || !a.user || typeof a.session !== "string") return null;
	a.stats = normalize(a.stats);
	a.queue = Array.isArray(a.queue) ? a.queue : [];
	return a;
}
var save = (a) => write(KEY, a);
var signedIn = () => {
	const a = current();
	return !!(a && !a.expired);
};
function deviceId() {
	let d = null;
	try {
		d = store() && store().getItem(DEVICE);
	} catch (e) {}
	if (!d || !/^[A-Za-z0-9-]{8,64}$/.test(d)) {
		d = "d-" + rand(12);
		try {
			store() && store().setItem(DEVICE, d);
		} catch (e) {}
	}
	return d;
}
async function api(path, { method = "GET", body, session, timeout = 9e3 } = {}) {
	if (!SERVER) return null;
	const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), timeout), headers = {};
	if (body !== void 0) headers["Content-Type"] = "application/json";
	if (session) headers.Authorization = "Bearer " + session;
	try {
		const res = await fetch(SERVER + path, {
			method,
			headers,
			body: body === void 0 ? void 0 : JSON.stringify(body),
			signal: ctl.signal
		});
		return {
			status: res.status,
			body: await res.json().catch(() => ({}))
		};
	} catch (e) {
		return null;
	} finally {
		clearTimeout(t);
	}
}
function expire() {
	const a = current();
	if (a) {
		a.expired = true;
		save(a);
	}
}
async function authed(path, opts = {}) {
	const a = current();
	if (!a || a.expired) return {
		status: 401,
		body: {}
	};
	const r = await api(path, {
		...opts,
		session: a.session
	});
	if (r && r.status === 401) expire();
	return r;
}
var cap = () => {
	const C = window.Capacitor;
	return C && typeof C.isNativePlatform === "function" && C.isNativePlatform() ? C : null;
};
var platform = () => {
	const C = cap();
	return C ? C.getPlatform() : "web";
};
function providers(i = info()) {
	if (!i) return [];
	const p = platform(), out = [];
	if (i.apple && (p === "ios" ? i.apple.native : p === "android" ? i.apple.androidRedirect : i.apple.web)) out.push("apple");
	if (i.google && (p === "ios" ? i.google.ios : i.google.web)) out.push("google");
	if (i.stub) out.push("stub");
	return out;
}
var loadScript = (src) => new Promise((ok, no) => {
	if (document.querySelector(`script[src="${src}"]`)) return ok();
	const s = document.createElement("script");
	s.src = src;
	s.async = true;
	s.onload = () => ok();
	s.onerror = () => no(/* @__PURE__ */ new Error("offline"));
	document.head.appendChild(s);
});
var SignInError = class extends Error {
	constructor(code) {
		super(code);
		this.code = code;
	}
};
async function newNonce() {
	const r = await api("/auth/nonce", {
		method: "POST",
		body: {}
	});
	if (!r) throw new SignInError("offline");
	if (r.status !== 200 || !r.body.nonce) throw new SignInError(r.status === 503 ? "off" : "failed");
	return r.body.nonce;
}
var nativeReady = null;
async function nativeToken(provider, nonce) {
	const C = cap(), SL = C && C.Plugins && C.Plugins.SocialLogin, i = info();
	if (!SL) throw new SignInError("failed");
	if (!nativeReady) {
		const p = platform(), cfg = {};
		if (i.apple) cfg.apple = p === "ios" ? { clientId: "com.franknowinski.killswitch" } : {
			clientId: i.apple.web,
			redirectUrl: i.apple.androidRedirect
		};
		if (i.google) cfg.google = p === "ios" ? {
			iOSClientId: i.google.ios,
			iOSServerClientId: i.google.web || void 0,
			mode: "online"
		} : {
			webClientId: i.google.web,
			mode: "online"
		};
		nativeReady = SL.initialize(cfg).catch((e) => {
			nativeReady = null;
			throw e;
		});
	}
	await nativeReady;
	let res;
	try {
		res = await SL.login({
			provider,
			options: provider === "apple" ? {
				scopes: [],
				nonce
			} : {
				nonce,
				forcePrompt: true
			}
		});
	} catch (e) {
		throw new SignInError(/cancel/i.test(String(e && (e.message || e.code))) ? "cancelled" : "failed");
	}
	const t = res && res.result && res.result.idToken;
	if (!t) throw new SignInError("failed");
	const r = res.result, code = provider === "apple" && platform() === "ios" ? r.authorizationCode || r.accessToken && r.accessToken.token : null;
	return {
		idToken: t,
		code: typeof code === "string" && code ? code : void 0
	};
}
async function appleWebToken(nonce) {
	const i = info();
	try {
		await loadScript("https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js");
	} catch (e) {
		throw new SignInError("offline");
	}
	const redirectUri = location.origin + location.pathname;
	window.AppleID.auth.init({
		clientId: i.apple.web,
		scope: "",
		redirectURI: redirectUri,
		usePopup: true,
		nonce,
		state: rand(8)
	});
	try {
		const r = await window.AppleID.auth.signIn();
		return {
			idToken: r.authorization.id_token,
			code: r.authorization.code || void 0,
			redirectUri
		};
	} catch (e) {
		throw new SignInError(e && /popup_closed|user_cancelled/.test(e.error) ? "cancelled" : "failed");
	}
}
async function renderGoogleButton(el, onToken, onError) {
	const i = info();
	let nonce;
	try {
		nonce = await newNonce();
		await loadScript("https://accounts.google.com/gsi/client");
	} catch (e) {
		return onError(e instanceof SignInError ? e : new SignInError("offline"));
	}
	window.google.accounts.id.initialize({
		client_id: i.google.web,
		nonce,
		callback: (r) => onToken(r.credential, nonce),
		use_fedcm_for_button: true,
		auto_select: false
	});
	window.google.accounts.id.renderButton(el, {
		type: "standard",
		theme: "filled_black",
		shape: "pill",
		size: "large",
		text: "signin_with",
		width: Math.min(el.clientWidth || 300, 400)
	});
}
var googleOnWeb = () => platform() === "web";
async function signIn(provider, opts = {}) {
	let nonce = opts.nonce, idToken = opts.idToken, extra = {};
	if (!idToken) {
		nonce = await newNonce();
		if (provider === "stub") {
			const r = await api("/auth/stub/token", {
				method: "POST",
				body: {
					sub: opts.sub,
					nonce
				}
			});
			if (!r) throw new SignInError("offline");
			idToken = r.body.idToken;
		} else {
			const got = cap() ? await nativeToken(provider, nonce) : provider === "apple" ? await appleWebToken(nonce) : null;
			if (got) {
				idToken = got.idToken;
				if (got.code) extra = {
					code: got.code,
					redirectUri: got.redirectUri
				};
			}
		}
		if (!idToken) throw new SignInError("failed");
	}
	const r = await api("/auth/signin", {
		method: "POST",
		body: {
			provider,
			idToken,
			nonce,
			...extra
		}
	});
	if (!r) throw new SignInError("offline");
	if (r.status !== 200 || !r.body.session) throw new SignInError(r.status === 503 ? "off" : "failed");
	const old = current();
	const queue = old && old.user.id === r.body.user.id ? old.queue : [];
	save({
		v: 1,
		server: SERVER,
		session: r.body.session,
		user: r.body.user,
		stats: normalize(r.body.stats),
		queue,
		expired: false
	});
	await mergeThisDevice();
	await flush();
	return current();
}
async function mergeThisDevice() {
	const local = loadStats();
	if (!local) return;
	let r;
	for (let i = 0; i < 3; i++) {
		if (i) await new Promise((ok) => setTimeout(ok, MERGE_RETRY_MS * i));
		r = await authed("/me/merge", {
			method: "POST",
			body: {
				device: deviceId(),
				stats: local
			}
		});
		if (!(r && r.status === 503 && r.body && r.body.error === "busy")) break;
	}
	if (r && r.status === 200) {
		const a = current();
		if (a) {
			a.stats = applyQueue(normalize(r.body.stats), a.queue);
			save(a);
		}
	}
}
async function saveProfile(fields) {
	const r = await authed("/me", {
		method: "PATCH",
		body: fields
	});
	if (!r) return { error: "offline" };
	if (r.status === 401) return { error: "expired" };
	if (r.status !== 200) return { error: r.body && r.body.error || "failed" };
	const a = current();
	if (a) {
		a.user = r.body.user;
		save(a);
	}
	return { ok: true };
}
async function signOut() {
	const a = current();
	if (a && !a.expired) await api("/auth/signout", {
		method: "POST",
		body: {},
		session: a.session,
		timeout: 4e3
	});
	write(KEY, null);
	const C = cap(), SL = C && C.Plugins && C.Plugins.SocialLogin;
	if (SL && a && a.user.provider !== "stub") try {
		await SL.logout({ provider: a.user.provider });
	} catch (e) {}
}
async function deleteAccount() {
	const r = await authed("/me", { method: "DELETE" });
	if (!r) return { error: "offline" };
	if (r.status === 401) return { error: "expired" };
	if (r.status !== 200) return { error: "failed" };
	write(KEY, null);
	return { ok: true };
}
function applyReport(s, g) {
	if (g.kind === "solo") recordSolo(s, g);
	else if (g.kind === "friend") recordFriend(s, g);
	return s;
}
var applyQueue = (s, queue) => {
	for (const g of queue) applyReport(s, g);
	return s;
};
function record(game) {
	const a = current();
	if (!a) return false;
	const g = {
		...game,
		id: game.kind === "friend" ? "f-" + game.key : "s-" + rand(8),
		at: Date.now()
	};
	if (g.kind === "friend" && (a.queue.some((x) => x.id === g.id) || a.stats.seen.includes(g.key))) return true;
	applyReport(a.stats, g);
	a.queue.push(g);
	save(a);
	flush();
	return true;
}
var flushing = null;
function flush() {
	if (flushing) return flushing.then(() => {
		const a = current();
		if (a && a.queue.length && !a.expired) return flush();
	});
	flushing = (async () => {
		const a = current();
		if (!a || a.expired || !a.queue.length) return;
		const sent = a.queue.slice(0, 50);
		const r = await authed("/me/games", {
			method: "POST",
			body: { games: sent }
		});
		if (!r || r.status !== 200) return;
		const now = current();
		if (!now || now.user.id !== a.user.id) return;
		const done = new Set(sent.map((g) => g.id));
		now.queue = now.queue.filter((g) => !done.has(g.id));
		now.stats = applyQueue(normalize(r.body.stats), now.queue);
		save(now);
	})().finally(() => {
		flushing = null;
	});
	return flushing;
}
async function sync() {
	const a = current();
	if (!a || a.expired) return a;
	await flush();
	const r = await authed("/me");
	if (r && r.status === 200) {
		const now = current();
		if (now) {
			now.user = r.body.user;
			now.stats = applyQueue(normalize(r.body.stats), now.queue);
			save(now);
		}
	}
	return current();
}
// web/src/profile.js
var HANDLE_RE = /^[A-Za-z0-9_]{3,15}$/;
var BLOCKED = [
	"fuck",
	"shit",
	"cunt",
	"bitch",
	"whore",
	"slut",
	"nigg",
	"fagg",
	"retard",
	"nazi",
	"hitler",
	"kike",
	"chink",
	"tranny",
	"twat",
	"pussy",
	"penis",
	"vagina",
	"porn",
	"jizz",
	"dildo",
	"molest",
	"paedo",
	"pedophil"
];
var RESERVED = [
	"admin",
	"administrator",
	"mod",
	"moderator",
	"support",
	"help",
	"official",
	"killswitch",
	"kill_switch",
	"system",
	"server",
	"null",
	"undefined",
	"anonymous",
	"deleted",
	"foxroad"
];
var LEET = {
	0: "o",
	1: "i",
	3: "e",
	4: "a",
	5: "s",
	7: "t",
	8: "b",
	9: "g"
};
var squash = (h) => h.toLowerCase().replace(/_/g, "").replace(/[0-9]/g, (d) => LEET[d] || d);
function handleProblem(h) {
	if (typeof h !== "string") return "chars";
	if (h.length < 3 || h.length > 15) return "length";
	if (!HANDLE_RE.test(h)) return "chars";
	const s = squash(h);
	if (RESERVED.includes(h.toLowerCase()) || RESERVED.includes(s) || BLOCKED.some((w) => s.includes(w))) return "blocked";
	return null;
}
var HANDLE_TEXT = {
	length: "3 to 15 characters.",
	chars: "Letters, numbers and _ only.",
	blocked: "That handle isn't allowed. Try another.",
	taken: "That handle is taken. Try another."
};
var AVATARS = [
	"🕵️",
	"🪖",
	"🤵",
	"🧑‍🔬",
	"🧑‍⚖️",
	"🛸",
	"🔧",
	"📢",
	"📡",
	"🍯",
	"🌍",
	"🗣",
	"🧠",
	"🤖",
	"🦾",
	"👾",
	"🐝",
	"🕷",
	"💻",
	"🦠",
	"🧬",
	"🛑",
	"🎭",
	"🚪"
];
// web/src/friends.js
var { head, row, tile, streakText, dateText, esc: esc$1, SIDE_LABEL, SIDE_CLS, RESULT_LABEL } = statsParts;
async function call(path, opts) {
	const r = await authed(path, opts);
	if (!r) return { error: "offline" };
	if (r.status === 401) return { error: "expired" };
	if (r.status !== 200) return { error: r.body && r.body.error || "failed" };
	return r.body;
}
var at = (h) => "/me/friends/" + encodeURIComponent(h);
var friendsApi = {
	rooms: () => call("/me/rooms"),
	list: () => call("/me/friends"),
	add: (handle) => call("/me/friends", {
		method: "POST",
		body: { handle }
	}),
	remove: (handle) => call(at(handle), { method: "DELETE" }),
	h2h: (handle) => call(at(handle)),
	challenge: (handle, side) => call("/me/challenges", {
		method: "POST",
		body: {
			handle,
			side
		}
	}),
	decline: (code) => call("/me/challenges/" + code, { method: "DELETE" })
};
var ERR$1 = {
	offline: "Can't reach the server. Check the internet and try again.",
	expired: "Your sign-in ran out. Sign in again: nothing is lost.",
	no_such: "There's no player with that handle.",
	self: "That's you.",
	not_friend: "Add them as a friend first.",
	too_many: "You have 20 challenges waiting. Wait for some answers first.",
	accepted: "Already accepted: the game is on. It's in My games.",
	failed: "That didn't work. Try again."
};
var errText = (e) => ERR$1[e] || ERR$1.failed;
var SIDES3 = [
	[
		"H",
		"<i>🕵️</i>HUMANS",
		"h"
	],
	[
		"AI",
		"<i>🧠</i>THE AI",
		"ai"
	],
	[
		"random",
		"<i>🎲</i>RANDOM",
		"rnd"
	]
];
var wld = (f) => `<span class="fr-w">${f.won}</span>–<span class="fr-l">${f.lost}</span>–${f.drawn}`;
var cache = null;
function summaryHtml(data) {
	if (!data || data.error) return data && data.error === "offline" ? `<p class="acct-note">Friends need the internet.</p>` : "";
	const r = data.record, top = data.friends.filter((f) => f.played).slice(0, 3);
	return `<div class="eyebrow">Friend games</div>
    ${r.played ? `<div class="st-tiles">${tile(r.played, "games")}${tile(r.won, "won", "up")}${tile(r.lost, "lost", "down")}${tile(r.drawn, "drawn")}</div>` : `<p class="acct-note">No friend games yet. Challenge a friend, or play one by code signed in.</p>`}
    ${top.length ? `<div class="eyebrow">Most played</div><div class="fr-list">${top.map(rowHtml).join("")}</div>` : ""}`;
}
function rowHtml(f) {
	return `<button class="fr-row" data-h="${esc$1(f.handle)}"><span class="fr-av">${esc$1(f.avatar)}</span><span class="fr-name">@${esc$1(f.handle)}</span><span class="fr-rec">${f.played ? wld(f) : "no games yet"}</span><span class="fr-go" aria-hidden="true">›</span></button>`;
}
async function loadSummary() {
	const d = await friendsApi.list();
	if (!d.error) cache = d;
	return d.error && cache ? cache : d;
}
var cachedSummary = () => cache;
function friendScreens({ app, sfx, home, profile, play, expired }) {
	let view = "list", err = "", note = "", busy = false, draft = "";
	let origin = "home", friendBack = "list";
	let cur = null, h2h = null, side = "H", confirmRemove = false;
	try {
		const s = localStorage.getItem("ks-chal-side");
		if (s === "H" || s === "AI" || s === "random") side = s;
	} catch (e) {}
	const here = () => !!app.querySelector(".card.friends");
	const goBack = (to) => to === "profile" ? profile() : home();
	function openList(back) {
		if (back) origin = back;
		view = "list";
		err = "";
		note = "";
		busy = false;
		render();
		refreshList();
	}
	function openFriend(handle, back) {
		friendBack = back || "list";
		view = "friend";
		cur = handle;
		h2h = null;
		err = "";
		note = "";
		busy = false;
		confirmRemove = false;
		render();
		loadFriend();
	}
	async function refreshList() {
		const d = await friendsApi.list();
		if (d.error === "expired") return expired();
		if (d.error) {
			if (!cache) err = errText(d.error);
		} else cache = d;
		if (here() && view === "list") render();
	}
	async function loadFriend() {
		const want = cur, d = await friendsApi.h2h(want);
		if (d.error === "expired") return expired();
		if (cur !== want) return;
		h2h = d;
		if (d.error) err = errText(d.error);
		if (here() && view === "friend") render();
	}
	function listHtml() {
		const a = current(), list = cache && cache.friends;
		const body = !list ? err ? "" : `<p class="acct-busy">Loading<span class="dots"><i>.</i><i>.</i><i>.</i></span></p>` : !list.length ? `<p class="st-empty" id="fr-empty">No friends yet. Add someone by their @handle, or play a friend game while you're both signed in: they're added after it.</p>` : `<div class="fr-head eyebrow"><span>Most played</span><span>W–L–D</span></div><div class="fr-list" id="fr-list">${list.map(rowHtml).join("")}</div>`;
		return `<div class="eyebrow">${a && a.user.handle ? `${esc$1(a.user.avatar)} @${esc$1(a.user.handle)}` : "Signed in"}</div><h1>FRIENDS</h1>
      <form class="fr-add" id="fr-addform"><label class="hd-in"><span>@</span><input id="fr-handle" value="${esc$1(draft)}" maxlength="16" placeholder="their handle" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Friend's handle"></label><button class="ghost" id="fr-add"${busy ? " disabled" : ""}>ADD</button></form>
      <p class="acct-err" id="fr-err" role="alert"${err ? "" : " hidden"}>${esc$1(err)}</p><p class="acct-note" id="fr-note"${note ? "" : " hidden"}>${esc$1(note)}</p>
      ${body}
      <p class="acct-fine">A friend can challenge you and you them. Nothing else is shared.</p>
      <button class="ghost" id="fr-back">BACK</button>`;
	}
	function friendHtml() {
		const top = `<div class="eyebrow">Friend</div>`;
		if (!h2h || h2h.error) {
			const f = cache && cache.friends.find((x) => x.handle.toLowerCase() === String(cur).toLowerCase());
			return `${top}<div class="me"><span class="me-av">${esc$1(f ? f.avatar : "?")}</span><h1>@${esc$1(cur)}</h1></div>
        ${h2h ? `<p class="acct-err" role="alert">${esc$1(err)}</p>` : `<p class="acct-busy">Loading<span class="dots"><i>.</i><i>.</i><i>.</i></span></p>`}
        <button class="ghost" id="fr-back">BACK</button>`;
		}
		const f = h2h.friend, t = h2h.total, s = h2h.streak;
		const sideRow = (side) => {
			const r = h2h.record[side];
			return row(SIDE_LABEL[side], SIDE_CLS[side], {
				...r,
				played: r.won + r.lost + r.drawn
			});
		};
		const games = h2h.games.map((g) => {
			const them = g.side === "H" ? "AI" : "H";
			return `<div class="st-game ${g.result}"><span class="gd">${dateText(g.at)}</span><span class="${SIDE_CLS[g.side]}">${SIDE_LABEL[g.side]}</span><b>${RESULT_LABEL[g.result]}</b><span class="gv" title="vs ${them === "H" ? "the Humans" : "the AI"}">vs ${SIDE_LABEL[them].split(" ")[0]}</span><span class="gr">R${g.rounds}</span></div>`;
		}).join("");
		const remove = !f.friend ? `<button class="ghost" id="fr-readd">ADD FRIEND</button>` : confirmRemove ? `<div class="st-confirm" id="fr-confirm"><p>Remove <b>@${esc$1(f.handle)}</b> from your friends? Your games together stay in your record. A new game together adds them back.</p>
          <div class="row2"><button class="ghost" id="fr-cancel">CANCEL</button><button class="ghost danger" id="fr-yes"${busy ? " disabled" : ""}>REMOVE</button></div></div>` : `<button class="ghost danger acct-del" id="fr-remove">REMOVE FRIEND</button>`;
		return `${top}<div class="me"><span class="me-av" id="fr-av">${esc$1(f.avatar)}</span><h1 id="fr-handle-h">@${esc$1(f.handle)}</h1></div>
      <div class="st-tiles" id="fr-tiles">${tile(t.won, "won", "up")}${tile(t.lost, "lost", "down")}${tile(t.drawn, "drawn")}${tile(streakText(s), "streak", s > 0 ? "up" : s < 0 ? "down" : "")}</div>
      ${t.played ? `<div class="st-table">${head("You as")}${sideRow("H")}${sideRow("AI")}</div>` : `<p class="st-empty">No games together yet.</p>`}
      ${f.friend ? `<div class="eyebrow">Challenge · you play</div>
      <div class="seg fr-sides" role="group" aria-label="Your side">${SIDES3.map(([k, label, cls]) => `<button class="${cls}" id="fr-side-${k}" aria-pressed="${side === k}">${label}</button>`).join("")}</div>
      <button class="primary" id="fr-challenge"${busy ? " disabled" : ""}>${busy ? "SENDING…" : "CHALLENGE"}</button>` : ""}
      <p class="acct-err" id="fr-err" role="alert"${err ? "" : " hidden"}>${esc$1(err)}</p>
      ${games ? `<div class="eyebrow">Games · newest first</div><div class="st-games" id="fr-games">${games}</div>` : ""}
      ${remove}
      <button class="ghost" id="fr-back">BACK</button>`;
	}
	function render() {
		app.innerHTML = `<div class="overlay"><div class="card friends acct-card" data-view="${view}">${view === "friend" ? friendHtml() : listHtml()}</div></div>`;
		wire();
	}
	const on = (id, fn, ev = "click") => {
		const el = document.getElementById(id);
		if (el) el.addEventListener(ev, fn);
	};
	function wire() {
		on("fr-back", () => {
			sfx.tap();
			if (view === "friend") return friendBack === "list" ? openList() : goBack(friendBack);
			goBack(origin);
		});
		app.querySelectorAll(".fr-row").forEach((b) => b.addEventListener("click", () => {
			sfx.tap();
			openFriend(b.dataset.h);
		}));
		if (view === "list") {
			const input = document.getElementById("fr-handle");
			input.addEventListener("input", () => {
				draft = input.value;
			});
			on("fr-addform", async (e) => {
				e.preventDefault();
				sfx.tap();
				const h = input.value.trim().replace(/^@/, "");
				draft = input.value;
				if (!h) return input.focus();
				if (handleProblem(h) && handleProblem(h) !== "blocked") {
					err = ERR$1.no_such;
					note = "";
					return render();
				}
				busy = true;
				err = "";
				note = "";
				render();
				const r = await friendsApi.add(h);
				busy = false;
				if (r.error === "expired") return expired();
				if (r.error) {
					err = errText(r.error);
					return render();
				}
				draft = "";
				note = `@${r.friend.handle} is on your friends list.`;
				sfx.win();
				render();
				refreshList();
			}, "submit");
		}
		if (view === "friend") {
			for (const [k] of SIDES3) on("fr-side-" + k, () => {
				sfx.tap();
				side = k;
				try {
					localStorage.setItem("ks-chal-side", k);
				} catch (e) {}
				for (const [j] of SIDES3) document.getElementById("fr-side-" + j).setAttribute("aria-pressed", j === k);
			});
			on("fr-challenge", async () => {
				sfx.win();
				busy = true;
				err = "";
				render();
				const r = await friendsApi.challenge(h2h.friend.handle, side);
				busy = false;
				if (r.error === "expired") return expired();
				if (r.error) {
					err = errText(r.error);
					return render();
				}
				play(r.code, r.token);
			});
			on("fr-remove", () => {
				sfx.tap();
				confirmRemove = true;
				render();
			});
			on("fr-cancel", () => {
				sfx.tap();
				confirmRemove = false;
				render();
			});
			on("fr-yes", async () => {
				sfx.tap();
				busy = true;
				render();
				const r = await friendsApi.remove(h2h.friend.handle);
				busy = false;
				confirmRemove = false;
				if (r.error === "expired") return expired();
				if (r.error) {
					err = errText(r.error);
					return render();
				}
				if (cache) cache = {
					...cache,
					friends: cache.friends.filter((x) => x.handle !== h2h.friend.handle)
				};
				openList();
			});
			on("fr-readd", async () => {
				sfx.tap();
				const r = await friendsApi.add(h2h.friend.handle);
				if (r.error === "expired") return expired();
				if (r.error) {
					err = errText(r.error);
					return render();
				}
				h2h = {
					...h2h,
					friend: {
						...h2h.friend,
						friend: true
					}
				};
				render();
				refreshList();
			});
		}
	}
	return {
		openList,
		openFriend,
		render,
		get view() {
			return view;
		}
	};
}
// web/src/account-ui.js
var esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[c]);
var ERR = {
	offline: "Can't reach the server. Check the internet and try again. You can play on without signing in.",
	off: "Sign-in isn't available right now. You can play on without it.",
	failed: "Sign-in didn't work. Try again.",
	expired: "Your sign-in ran out. Sign in again: nothing is lost.",
	avatar: "Pick one of the avatars.",
	cancelled: ""
};
var PROVIDER_NAME = {
	apple: "Apple",
	google: "Google",
	stub: "a test account"
};
var APPLE_LOGO = `<svg aria-hidden="true" viewBox="0 0 814 1000" width="15" height="18"><path fill="currentColor" d="M788 341c-6 4-108 62-108 190 0 148 130 200 134 202-1 3-21 72-69 142-43 62-88 124-156 124s-86-40-165-40c-77 0-104 41-166 41s-106-57-156-127C44 791 0 671 0 557c0-183 119-280 236-280 62 0 114 41 153 41 37 0 95-43 166-43 27 0 124 2 188 94zM553 169c29-35 50-83 50-131 0-7-1-14-2-19-48 2-104 32-138 71-27 30-52 78-52 127 0 7 1 15 2 17 3 1 8 1 13 1 43 0 97-29 127-66z"/></svg>`;
var GOOGLE_LOGO = `<svg aria-hidden="true" viewBox="0 0 48 48" width="18" height="18"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.2C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.4 0 20.1 0 24s1 7.6 2.7 10.8l7.8-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.2C6.6 42.6 14.6 48 24 48z"/></svg>`;
function accountScreens({ app, sfx, home, stats, friends = () => {}, friend = () => {}, privacyUrl = "privacy.html" }) {
	let view = "signin", err = "", busy = false, confirmDelete = false;
	let draft = null;
	function buttonHtml() {
		const a = current();
		if (!a && !providers().length) return "";
		const label = !a ? "SIGN IN" : a.expired ? "SIGN IN AGAIN" : !a.user.handle ? "PICK A HANDLE" : `<span class="av">${esc(a.user.avatar)}</span><span class="hd">@${esc(a.user.handle)}</span>`;
		const ready = a && !a.expired && a.user.handle;
		return `<div class="acctbar">${ready ? `<button class="acct fr" id="friends-btn" aria-label="Friends">👥 FRIENDS</button>` : ""}<button class="acct${ready ? " in" : ""}" id="profile" aria-label="${a ? "Your profile" : "Sign in"}">${label}</button></div>`;
	}
	function open() {
		const a = current();
		err = "";
		busy = false;
		confirmDelete = false;
		if (!a || a.expired) {
			view = "signin";
			if (a && a.expired) err = ERR.expired;
		} else if (!a.user.handle) startPicker(true);
		else view = "profile";
	}
	function startPicker(first) {
		const a = current();
		draft = {
			handle: a && a.user.handle || "",
			avatar: a && a.user.avatar || AVATARS[0],
			first,
			err: ""
		};
		view = "handle";
	}
	function signinHtml() {
		const list = providers();
		const btn = (p) => p === "apple" ? `<button class="sso apple" id="si-apple"${busy ? " disabled" : ""}>${APPLE_LOGO}<span>Sign in with Apple</span></button>` : p === "google" ? googleOnWeb() ? `<div class="sso-g" id="si-google-web" aria-label="Sign in with Google"></div>` : `<button class="sso google" id="si-google"${busy ? " disabled" : ""}>${GOOGLE_LOGO}<span>Sign in with Google</span></button>` : `<form class="stub" id="si-stubform"><input id="si-stub" placeholder="test user" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Test user"><button class="ghost" id="si-stubgo"${busy ? " disabled" : ""}>TEST SIGN-IN</button></form>`;
		return `<div class="eyebrow">Optional</div><h1>SIGN IN</h1>
      <p>Keep a <b>@handle</b> and your stats on every device. You never need an account to play.</p>
      ${list.length ? `<div class="sso-list">${list.map(btn).join("")}</div>` : ""}
      ${busy ? `<p class="acct-busy" id="acct-busy">Signing in<span class="dots"><i>.</i><i>.</i><i>.</i></span></p>` : ""}
      <p class="acct-err" id="acct-err" role="alert"${err || !list.length ? "" : " hidden"}>${esc(err || (list.length ? "" : ERR.off))}</p>
      <p class="acct-fine">We keep your handle, avatar and stats, never your email or name. <a href="${privacyUrl}" target="_blank" rel="noopener">Privacy</a></p>
      <button class="ghost" id="acct-back">BACK</button>`;
	}
	function pickerHtml() {
		const d = draft, problem = d.handle ? handleProblem(d.handle) : null;
		const hint = d.err || (problem && d.handle.length >= 3 ? HANDLE_TEXT[problem] : "");
		return `<div class="eyebrow">${d.first ? "Welcome" : "Your profile"}</div><h1>${d.first ? "PICK A HANDLE" : "EDIT PROFILE"}</h1>
      ${d.first ? `<p>Your name in the game: 3 to 15 letters, numbers or _.</p>` : ""}
      <label class="hd-in"><span>@</span><input id="hd" value="${esc(d.handle)}" maxlength="15" placeholder="handle" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Handle" aria-describedby="hd-err"></label>
      <p class="acct-err" id="hd-err" role="alert"${hint ? "" : " hidden"}>${esc(hint)}</p>
      <div class="eyebrow">Avatar</div>
      <div class="av-grid" role="group" aria-label="Avatar">${AVATARS.map((a, i) => `<button id="av-${i}" aria-pressed="${a === d.avatar}" aria-label="Avatar ${a}">${a}</button>`).join("")}</div>
      <button class="primary" id="hd-save"${busy ? " disabled" : ""}>${busy ? "SAVING…" : "SAVE"}</button>
      <button class="ghost" id="hd-back">${d.first ? "LATER" : "CANCEL"}</button>`;
	}
	function profileHtml() {
		const a = current(), u = a.user;
		const pending = a.queue.length ? `<p class="acct-note" id="acct-pending">${a.queue.length} game${a.queue.length > 1 ? "s" : ""} waiting to sync.</p>` : "";
		const del = confirmDelete ? `<div class="st-confirm" id="del-confirm"><p>Delete <b>@${esc(u.handle)}</b>? This removes your account, its stats and every sign-in from our server. Stats kept on this device stay. It can't be undone.</p>
          <div class="row2"><button class="ghost" id="del-cancel"${busy ? " disabled" : ""}>CANCEL</button><button class="ghost danger" id="del-yes"${busy ? " disabled" : ""}>${busy ? "DELETING…" : "DELETE"}</button></div></div>` : `<button class="ghost danger acct-del" id="acct-delete">DELETE ACCOUNT</button>`;
		return `<div class="eyebrow">Signed in with ${PROVIDER_NAME[u.provider] || u.provider}</div>
      <div class="me"><span class="me-av" id="me-av">${esc(u.avatar)}</span><h1 id="me-handle">@${esc(u.handle)}</h1></div>
      ${pending}<p class="acct-err" id="acct-err" role="alert"${err ? "" : " hidden"}>${esc(err)}</p>
      <div class="me-friends" id="me-friends">${summaryHtml(cachedSummary())}</div>
      <button class="ghost" id="acct-friends">👥 FRIENDS</button>
      <div class="row2"><button class="ghost" id="acct-edit">EDIT PROFILE</button><button class="ghost" id="acct-stats">STATS</button></div>
      <button class="ghost" id="acct-signout">SIGN OUT</button>
      ${del}
      <button class="ghost" id="acct-back">BACK</button>`;
	}
	function render() {
		const a = current();
		if (view === "profile" && (!a || a.expired || !a.user.handle)) open();
		const body = view === "handle" ? pickerHtml() : view === "profile" ? profileHtml() : signinHtml();
		app.innerHTML = `<div class="overlay"><div class="card acct-card" data-view="${view}">${body}</div></div>`;
		wire();
	}
	const on = (id, fn, ev = "click") => {
		const el = document.getElementById(id);
		if (el) el.addEventListener(ev, fn);
	};
	async function doSignIn(provider, opts) {
		busy = true;
		err = "";
		render();
		try {
			const a = await signIn(provider, opts);
			busy = false;
			if (!a.user.handle) startPicker(true);
			else view = "profile";
			sfx.win();
		} catch (e) {
			busy = false;
			err = ERR[e && e.code] ?? ERR.failed;
		}
		render();
	}
	function wire() {
		on("acct-back", () => {
			sfx.tap();
			home();
		});
		if (view === "signin") {
			on("si-apple", () => {
				sfx.tap();
				doSignIn("apple");
			});
			on("si-google", () => {
				sfx.tap();
				doSignIn("google");
			});
			on("si-stubform", (e) => {
				e.preventDefault();
				const sub = document.getElementById("si-stub").value.trim();
				if (sub) doSignIn("stub", { sub });
			}, "submit");
			const g = document.getElementById("si-google-web");
			if (g && !busy) renderGoogleButton(g, (idToken, nonce) => doSignIn("google", {
				idToken,
				nonce
			}), (e) => {
				err = ERR[e.code] ?? ERR.failed;
				const p = document.getElementById("acct-err");
				if (p) {
					p.textContent = err;
					p.hidden = !err;
				}
			});
		}
		if (view === "handle") {
			const input = document.getElementById("hd");
			input.addEventListener("input", () => {
				draft.handle = input.value;
				draft.err = "";
				const p = handleProblem(draft.handle), msg = document.getElementById("hd-err");
				const hint = p && draft.handle.length >= 3 ? HANDLE_TEXT[p] : "";
				msg.textContent = hint;
				msg.hidden = !hint;
			});
			AVATARS.forEach((a, i) => on("av-" + i, () => {
				sfx.tap();
				draft.avatar = a;
				draft.handle = input.value;
				AVATARS.forEach((_, k) => document.getElementById("av-" + k).setAttribute("aria-pressed", k === i));
			}));
			on("hd-save", async () => {
				draft.handle = input.value.trim();
				const p = handleProblem(draft.handle);
				if (p) {
					draft.err = HANDLE_TEXT[p];
					sfx.tap();
					return render();
				}
				busy = true;
				render();
				const u = current().user, fields = { avatar: draft.avatar };
				if (draft.handle !== u.handle) fields.handle = draft.handle;
				const r = await saveProfile(fields);
				busy = false;
				if (r.ok) {
					sfx.win();
					view = "profile";
					return render();
				}
				if (r.error === "expired") {
					view = "signin";
					err = ERR.expired;
					return render();
				}
				draft.err = HANDLE_TEXT[r.error] || ERR[r.error] || ERR.failed;
				render();
			});
			on("hd-back", () => {
				sfx.tap();
				if (draft.first) home();
				else {
					view = "profile";
					render();
				}
			});
		}
		if (view === "profile") {
			const wireTop = () => document.querySelectorAll("#me-friends .fr-row").forEach((b) => b.addEventListener("click", () => {
				sfx.tap();
				friend(b.dataset.h);
			}));
			wireTop();
			loadSummary().then((d) => {
				const el = document.getElementById("me-friends");
				if (!el || view !== "profile") return;
				if (d.error === "expired") {
					open();
					return render();
				}
				el.innerHTML = summaryHtml(d);
				wireTop();
			});
			on("acct-friends", () => {
				sfx.tap();
				friends();
			});
			on("acct-edit", () => {
				sfx.tap();
				startPicker(false);
				render();
			});
			on("acct-stats", () => {
				sfx.tap();
				stats();
			});
			on("acct-signout", async () => {
				sfx.tap();
				await signOut();
				home();
			});
			on("acct-delete", () => {
				sfx.tap();
				confirmDelete = true;
				err = "";
				render();
			});
			on("del-cancel", () => {
				sfx.tap();
				confirmDelete = false;
				render();
			});
			on("del-yes", async () => {
				sfx.tap();
				busy = true;
				render();
				const r = await deleteAccount();
				busy = false;
				if (r.ok) {
					confirmDelete = false;
					return home();
				}
				err = r.error === "offline" ? "Can't reach the server, so nothing was deleted. Try again when you're online." : r.error === "expired" ? "Sign in again to delete your account." : "That didn't work. Try again.";
				if (r.error === "expired") {
					view = "signin";
					confirmDelete = false;
				}
				render();
			});
		}
	}
	return {
		buttonHtml,
		open,
		render,
		startPicker,
		get view() {
			return view;
		}
	};
}
// web/src/main.js
var app = document.getElementById("app");
{
	const ua = navigator.userAgent, v = /Version\/(\d+)/.exec(ua);
	if (/iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua) && v && +v[1] >= 26 && !navigator.standalone) document.documentElement.classList.add("ios-bar");
	if (navigator.standalone || matchMedia("(display-mode: standalone)").matches) document.documentElement.classList.add("standalone");
}
var params = new URLSearchParams(location.search);
if (params.has("sim")) {
	const res = simulate(Number(params.get("sim")) || 200);
	app.innerHTML = `<pre>${JSON.stringify({
		...res,
		BAL
	}, null, 2)}</pre>`;
} else {
	let dcPick = false;
	let state, phase = "intro", sel = null, copyMode = false, info$1 = null, busy = false;
	let me = "H";
	let gameLevel = "medium", levelMove = botMove;
	let mode = "solo";
	const SIDE_WORD = {
		H: "Human",
		AI: "AI"
	};
	const theirs = () => SIDE_WORD[other(me)];
	const PUBLIC_URL = "https://franknowinski.github.io/kill-switch/";
	let shown = /* @__PURE__ */ new Set();
	let prevSides = /* @__PURE__ */ new Map();
	const seed = Number(params.get("seed")) || Date.now() % 1e9;
	const bot = rng(seed ^ 48879);
	const FAST = params.has("over") || params.has("fast");
	let ptr = null, dragEl = null, holdTouch = false;
	const mid = (el) => {
		const q = el.getBoundingClientRect();
		return {
			x: q.left + q.width / 2,
			y: q.top + q.height / 2,
			w: q.width,
			h: q.height
		};
	};
	const DRAG = {
		snap: {
			touch: .85,
			mouse: .6
		},
		edge: .4,
		lift: 1.1,
		scale: 1.3
	};
	function measureBoard() {
		return [...app.querySelectorAll(".sq")].map((q) => {
			const b = q.getBoundingClientRect();
			return {
				q,
				x: b.left + b.width / 2,
				y: b.top + b.height / 2,
				w: b.width,
				h: b.height
			};
		});
	}
	function dropTarget(from, x, y) {
		let g = from.geo;
		if (!g || !g.length || !g[0].q.isConnected) g = from.geo = measureBoard();
		const src = g.find((m) => +m.q.dataset.r === from.r && +m.q.dataset.c === from.c);
		if (!src) return null;
		from.home = src;
		const lit = phase === "setup" ? ((m) => !m.q.disabled && SETUP_ROWS[me].includes(+m.q.dataset.r)) : ((m) => m.q.classList.contains("can") || m.q.classList.contains("copy"));
		const dist = (m) => Math.hypot((x - m.x) / m.w, (y - m.y) / m.h);
		let edge = Infinity, best = null, bd = Infinity;
		for (const m of g) {
			edge = Math.min(edge, Math.max(Math.abs(x - m.x) / m.w, Math.abs(y - m.y) / m.h) - .5);
			if (m !== src && !lit(m)) continue;
			const d = dist(m);
			if (d < bd) {
				bd = d;
				best = m;
			}
		}
		if (edge > DRAG.edge) return null;
		if (best && best !== src) return bd <= DRAG.snap[from.touch ? "touch" : "mouse"] ? best.q : null;
		const vx = x - from.x, vy = y - from.y, vl = Math.hypot(vx, vy);
		if (vl < Math.max(8, src.w * .4)) return null;
		best = null;
		bd = Infinity;
		for (const m of g) {
			if (m === src || !lit(m)) continue;
			const ux = m.x - src.x, uy = m.y - src.y, ul = Math.hypot(ux, uy);
			if ((vx * ux + vy * uy) / (vl * ul) < Math.cos(40 * Math.PI / 180)) continue;
			const d = dist(m);
			if (d < bd) {
				bd = d;
				best = m;
			}
		}
		return best && best.q;
	}
	const noSlide = /* @__PURE__ */ new Set();
	let floater = null;
	function lightMoves() {
		app.querySelectorAll(".sq.sel,.sq.can,.sq.copy").forEach((q) => q.classList.remove("sel", "can", "copy"));
		const src = app.querySelector(`.sq[data-r="${sel.r}"][data-c="${sel.c}"]`);
		if (src) src.classList.add("sel");
		app.querySelectorAll(".sq.fight").forEach((q) => q.classList.remove("fight"));
		(phase === "setup" ? [...app.querySelectorAll(".sq")].filter((q) => !q.disabled && !q.dataset.id && SETUP_ROWS[me].includes(+q.dataset.r)) : legalMoves(state, sel).map((m) => app.querySelector(`.sq[data-r="${m.to[0]}"][data-c="${m.to[1]}"]`))).forEach((q) => {
			if (!q) return;
			q.classList.add("can");
			if (phase !== "setup" && q.dataset.id) q.classList.add("fight");
		});
		const msg = app.querySelector(".msg");
		if (msg && info$1) msg.innerHTML = info$1;
	}
	function sqAt(e) {
		let best = null, bd = Infinity;
		for (const q of app.querySelectorAll(".sq")) {
			const r = q.getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY);
			if ((e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom || d < r.width * .75) && d < bd) {
				bd = d;
				best = q;
			}
		}
		return best;
	}
	function bindPointer() {
		const board = document.getElementById("board");
		if (!board) return;
		board.addEventListener("touchstart", (e) => {
			if (e.touches.length > 1) return;
			const sq = sqAt(e.touches[0]);
			holdTouch = !!sq && sq.matches(".grab,.can,.copy,.own");
		}, { passive: true });
		board.addEventListener("touchmove", (e) => {
			if (holdTouch && e.cancelable) e.preventDefault();
		}, { passive: false });
		board.addEventListener("pointerdown", (e) => {
			if (e.button !== 0) return;
			const sq = sqAt(e);
			if (!sq || sq.disabled || busy) return;
			ptr = {
				r: +sq.dataset.r,
				c: +sq.dataset.c,
				x: e.clientX,
				y: e.clientY,
				id: e.pointerId,
				moved: false,
				touch: e.pointerType !== "mouse"
			};
		});
	}
	const floatAt = (d, x, y) => d.touch ? [
		x,
		y - d.h * DRAG.lift,
		DRAG.scale
	] : [
		d.cx + x - d.x,
		d.cy + y - d.y,
		1.15
	];
	const place = (f, [x, y, k]) => {
		f.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${k})`;
	};
	function paint(d) {
		d.raf = 0;
		if (!floater || ptr !== d) return;
		place(floater, floatAt(d, d.fx, d.fy));
		const t = dropTarget(d, d.fx, d.fy);
		if (t !== d.over) {
			if (d.over) d.over.classList.remove("over", "swap");
			if (t) {
				t.classList.add("over");
				if (phase === "setup" && t.dataset.id && t !== d.home.q) t.classList.add("swap");
			}
			d.over = t;
		}
	}
	function endDrag(back) {
		const f = floater, d = dragEl;
		floater = null;
		dragEl = null;
		if (renderLater) queueMicrotask(() => {
			if (renderLater) render();
		});
		const done = () => {
			if (f) f.remove();
			if (d) d.classList.remove("drag");
		};
		if (!back || !f || reduce || FAST) return done();
		fin(f.animate([{ transform: `translate3d(${back.x}px,${back.y}px,0) translate(-50%,-50%) scale(1)` }], {
			duration: 180,
			easing: "cubic-bezier(.3,.7,.4,1)",
			fill: "forwards"
		}), 180).then(done);
	}
	function liftPiece(src, html, cl) {
		floater = document.createElement("div");
		floater.className = "floater";
		floater.innerHTML = `<div class="blk ${cl}">${html}</div>`;
		const m = ptr.geo.find((g) => g.q === src) || mid(src);
		ptr.cx = m.x;
		ptr.cy = m.y;
		ptr.h = m.h;
		Object.assign(floater.style, {
			width: m.w - 6 + "px",
			height: m.h - 6 + "px",
			fontSize: getComputedStyle(src).fontSize
		});
		place(floater, floatAt(ptr, ptr.fx, ptr.fy));
		document.body.appendChild(floater);
		sfx.tap();
	}
	window.addEventListener("pointermove", (e) => {
		if (!ptr || e.pointerId !== ptr.id) return;
		if (!ptr.touch && e.buttons !== 1) return cancelPtr();
		const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
		if (!ptr.moved) {
			if (Math.hypot(dx, dy) < 8) return;
			if (ptr.still) return;
			if (dcPick && phase === "setup") {
				ptr.still = true;
				return;
			}
			const p = at$1(state, ptr.r, ptr.c), setupOpen = phase === "setup" && !(mode === "live" && LIVE.ready[me]);
			const can = p && p.side === me && (setupOpen || phase === "play" && state.turn === me);
			ptr.fx = e.clientX;
			ptr.fy = e.clientY;
			if (!p && setupOpen && me === "H" && onDC(state, ptr.r, ptr.c)) {
				ptr.moved = true;
				ptr.dc = true;
				sel = null;
				dcPick = true;
				app.querySelectorAll(".sq.sel,.sq.can").forEach((q) => q.classList.remove("sel", "can"));
				const src = app.querySelector(`.sq[data-r="${ptr.r}"][data-c="${ptr.c}"]`);
				src.classList.add("pick");
				app.querySelectorAll(".sq").forEach((q) => {
					if (!q.disabled && SETUP_ROWS.H.includes(+q.dataset.r) && q !== src) q.classList.add("can");
				});
				ptr.geo = measureBoard();
				liftPiece(src, `<span class="ic">🏢</span>`, "h");
			} else if (!can) {
				ptr.still = true;
				return;
			} else {
				ptr.moved = true;
				if (!sel || sel.id !== p.id) {
					sel = p;
					copyMode = false;
					info$1 = null;
					lightMoves();
				}
				const src = app.querySelector(`.sq[data-id="${p.id}"]`);
				dragEl = src.querySelector(".pz");
				if (dragEl) dragEl.classList.add("drag");
				ptr.geo = measureBoard();
				liftPiece(src, faceHtml(face(p)), shape(p.side));
			}
		}
		if (floater) {
			ptr.fx = e.clientX;
			ptr.fy = e.clientY;
			if (!ptr.raf) {
				const d = ptr;
				d.raf = requestAnimationFrame(() => paint(d));
			}
		}
		e.preventDefault();
	}, { passive: false });
	const unlight = (d) => {
		if (d.raf) cancelAnimationFrame(d.raf);
		d.raf = 0;
		if (d.over) d.over.classList.remove("over", "swap");
		d.over = null;
	};
	window.addEventListener("pointerup", (e) => {
		if (!ptr || e.pointerId !== ptr.id) return;
		const was = ptr;
		ptr = null;
		if (!was.moved) return was.still && Math.hypot(e.clientX - was.x, e.clientY - was.y) > 28 ? void 0 : tap(was.r, was.c);
		unlight(was);
		const t = dropTarget(was, e.clientX, e.clientY);
		if (t && sel) noSlide.add(String(sel.id));
		const home = was.home && was.home.q.isConnected ? was.home : null;
		endDrag(t || !home ? null : {
			x: home.x,
			y: home.y
		});
		if (was.dc) {
			if (t) tap(+t.dataset.r, +t.dataset.c);
			else {
				dcPick = Math.hypot(e.clientX - was.x, e.clientY - was.y) < 28;
				render();
			}
			return;
		}
		if (t) tap(+t.dataset.r, +t.dataset.c);
	});
	function cancelPtr() {
		const was = ptr;
		ptr = null;
		if (was) unlight(was);
		endDrag();
		if (was && was.dc) {
			dcPick = false;
			render();
		}
	}
	window.addEventListener("pointercancel", cancelPtr);
	window.addEventListener("contextmenu", () => {
		if (ptr && !ptr.touch) cancelPtr();
	});
	const remeasure = () => {
		const d = ptr;
		if (!d || !d.geo) return;
		d.geo = null;
		if (floater && !d.raf) d.raf = requestAnimationFrame(() => paint(d));
	};
	window.addEventListener("scroll", remeasure, {
		passive: true,
		capture: true
	});
	window.addEventListener("resize", remeasure, { passive: true });
	function dropDrag() {
		if (!floater) return;
		const d = ptr;
		ptr = null;
		if (d) {
			unlight(d);
			if (d.dc) dcPick = false;
		}
		endDrag();
	}
	function start(m = "solo", side = "H") {
		mode = m;
		me = side;
		document.body.classList.toggle("me-ai", me === "AI");
		counts = mode === "solo";
		state = newGame(seed + Math.floor(Math.random() * 1e6));
		phase = "setup";
		sel = null;
		dcPick = false;
		copyMode = false;
		busy = false;
		shown = /* @__PURE__ */ new Set();
		prevSides = /* @__PURE__ */ new Map();
		lastFight = null;
		engage = null;
		brainSeen = null;
		keyPick = null;
		if (mode === "solo") {
			gameLevel = soloLevel;
			levelMove = levelBot(gameLevel);
			botSetup(state, other(me), gameLevel, bot);
		}
		render();
	}
	function begin() {
		dcPick = false;
		sfx.win();
		if (mode === "live") {
			LIVE.ready[me] = true;
			sel = null;
			if (!send({
				t: "setup",
				pos: state.pieces.filter((p) => p.side === me).map((p) => [
					p.id,
					p.r,
					p.c
				]),
				form: state.forms[me],
				dc: me === "H" ? state.dc : null
			})) {
				LIVE.ready[me] = false;
				info$1 = "Not connected to the game server. Reconnecting… then START again.";
			}
			return render();
		}
		phase = "play";
		render();
		if (state.turn !== me) setTimeout(botTurn, 500);
	}
	const cls = (s) => s === "H" ? "h" : "ai";
	const shape = (s) => s === "H" ? "h" : "a";
	function chip(x) {
		return `<span class="pc ${cls(x.side)}">${iconOf(x)}${LEVELS_UP(x.type) ? x.str : ""}${x.id != null ? turnedHtml(x) : ""}</span>`;
	}
	function faceHtml(p) {
		const n = LEVELS_UP(p.type) ? p.str : p.mirror;
		return n != null ? `<span class="ic up">${iconOf(p)}</span><b class="n">${n}</b>` : `<span class="ic">${iconOf(p)}</span>`;
	}
	const blockHtml = (inner, side, hid) => `<div class="blk ${shape(side)}${hid ? " hid" : ""}">${inner}</div>`;
	const face = (p) => p;
	const turnedHtml = (p) => isTurned(p) ? `<i class="trn ${cls(homeSide(p))}" title="turned">↺</i>` : "";
	function pieceHtml(p, show) {
		return `<div class="pz">${blockHtml((show ? faceHtml(p) : `<span class="q">?</span>`) + (p.boosted ? `<i class="bst">↑</i>` : "") + (show ? turnedHtml(p) : ""), p.side, !show)}</div>`;
	}
	const tokenHtml = (side, p) => `<div class="pz">${blockHtml(p ? faceHtml(p) : `<span class="q">?</span>`, side, !p)}</div>`;
	const color = (t) => reglyph(t).replace(new RegExp("\\b" + SIDE_WORD[me] + "\\b", "g"), (w, at, str) => str.slice(Math.max(0, at - 4), at) === "The " ? w : `<span class="you">${at === 0 ? "Your" : "your"}</span>`).replace(new RegExp("\\b" + theirs() + "\\b", "g"), "<b>" + theirs() + "</b>");
	const lostOf = (ev) => {
		const r = ev.result;
		return {
			a: r === "lose" || r === "tie",
			d: r === "win" || r === "flag" || r === "defuse" || r === "tie" || r === "trapped"
		};
	};
	const W_NAME = (p) => `${cap$1(roleName(p))}${LEVELS_UP(p.type) ? " " + p.str : ""}`;
	function cmpOf(a, d, ev) {
		const num = (p) => p.type === "K" && ev.mirror != null ? ev.mirror : LEVELS_UP(p.type) ? p.str : iconOf(p);
		const r = ev.result, aWon = [
			"win",
			"flag",
			"defuse",
			"convert",
			"trapped"
		].includes(r);
		return ev.mirror != null || r === "tie" ? `${num(a)} = ${num(d)}` : r === "trapped" ? "↺" : r === "flag" ? iconOf(d) : `${num(a)} ${aWon ? "›" : "‹"} ${num(d)}`;
	}
	function fightRow(ev) {
		const x = lostOf(ev);
		const verb = ev.mirror != null ? "copied" : {
			tie: "tied",
			lose: "fell to",
			trapped: "fell into",
			defuse: "removed",
			convert: "turned",
			flag: "took"
		}[ev.result] || "beat";
		const tile = (p, lost, k) => `<span class="ftl ${k}${lost ? " x" : ""}">${tokenHtml(p.side, p)}</span>`;
		const nm = (p) => `<span class="${p.side === me ? "you" : "them"}">${W_NAME(p)}</span>`;
		return `<button class="fline" id="fline" aria-label="Last fight: open the log"><small class="lf">LAST FIGHT</small><span class="go">LOG ›</span>${tile(ev.a, x.a, "fa")}<span class="cmp">${cmpOf(ev.a, ev.d, ev)}</span>${tile(ev.d, x.d, "fd")}<span class="fs"><b>${ev.round ? "R" + ev.round : "—"}</b> · ${nm(ev.a)} ${verb} ${nm(ev.d)}</span></button>`;
	}
	let engage = null;
	const NAME_OF = (p) => cap$1(roleName(p));
	function engageHtml(a, d, ev, stage) {
		const masked = (p) => stage === "meet" && p.side !== me && !p.revealed;
		const num = (p) => p.type === "K" && ev.mirror != null ? ev.mirror : LEVELS_UP(p.type) ? p.str : iconOf(p);
		const show = (p) => p.type === "K" && ev.mirror != null && stage !== "meet" ? {
			...p,
			mirror: ev.mirror
		} : p;
		const lost = stage === "done" ? lostOf(ev) : {
			a: false,
			d: false
		};
		const r = ev.result, aWon = [
			"win",
			"flag",
			"defuse",
			"convert",
			"trapped"
		].includes(r);
		const tile = (p, l, k) => `<div class="tile ${k}${l ? " lost" : ""}">${tokenHtml(p.side, masked(p) ? null : show(p))}</div>`;
		const side = (p, dir) => `${p.side === "H" ? "HUMANS" : "AI"} ${dir}`;
		const early = (p) => masked(p) ? "?" : p.type === "K" ? iconOf(p) : num(p);
		const mid = stage === "meet" ? `${early(a)} › ${early(d)}` : cmpOf(a, d, ev);
		const tag = stage === "meet" ? "FIGHT" : r === "trapped" ? "TRAPPED" : r === "defuse" ? "REMOVED" : r === "flag" ? d.side === "AI" ? "SHUT DOWN" : "IT GOT OUT" : "FIGHT";
		let v;
		if (stage !== "done") v = [
			"wait",
			"REVEALING…",
			"Higher number wins"
		];
		else {
			const winSide = r === "tie" ? null : r === "trapped" ? d.side : aWon ? a.side : d.side, cl = winSide == null ? "t" : winSide === "H" ? "" : "l";
			const W = (p) => `${roleName(p).toUpperCase()}${LEVELS_UP(p.type) ? " " + p.str : ""}`;
			if (ev.mirror != null) v = [
				"t",
				"🎭 BOTH FALL",
				"It copies the number"
			];
			else if (r === "tie") v = [
				"t",
				"= BOTH FALL",
				"Same number, both fall"
			];
			else if (r === "trapped") v = [
				cl,
				"↺ SWITCHED SIDES",
				`Now ${d.side === me ? "yours" : "theirs"}`
			];
			else if (r === "defuse") v = [
				cl,
				`✓ ${roleName(d).toUpperCase()} REMOVED`,
				"Removed safely"
			];
			else if (r === "convert") v = [
				cl,
				`↺ ${roleName(d).toUpperCase()} TURNED`,
				"It joins the other side"
			];
			else if (r === "flag") v = [
				cl,
				d.side === "AI" ? "✓ KILL SWITCH HIT" : "✕ IT GOT OUT",
				d.side === "AI" ? "The AI is shut down" : "The AI reached the Internet"
			];
			else {
				const w = aWon ? a : d, l = aWon ? d : a;
				v = [
					cl,
					l.type === "I" ? "✓ THE 🧠 IS GONE" : `${w.side === me ? "✓" : "✕"} ${W(w)} WINS`,
					l.type === "I" ? "The AI stops growing" : w.type === "A" ? "Takes out an 8 or 9" : "Higher number wins"
				];
			}
		}
		return `<div class="eng-h"><span>ENGAGEMENT · ${sqName(a.r, a.c).toUpperCase()} → ${sqName(ev.r, ev.c).toUpperCase()}</span><span class="ft">${tag}</span></div>
      <div class="eng-row">${tile(a, lost.a, "ta")}<div class="ia"><div class="side">${side(a, "▸ ATK")}</div><div class="who">${masked(a) ? "Hidden" : NAME_OF(a)}</div></div>
      <div class="vs">VS<small>${mid}</small></div>
      <div class="id r-side"><div class="side">${side(d, "◂ DEF")}</div><div class="who">${masked(d) ? "Hidden" : NAME_OF(d)}</div></div>${tile(d, lost.d, "td")}</div>
      <div class="verdict ${v[0]}"><b>${v[1]}</b><span>${v[2]}</span></div>`;
	}
	function setConsole(html) {
		const c = app.querySelector(".console");
		if (!c) return;
		c.className = "console eng";
		c.innerHTML = html;
	}
	function snapshotRects() {
		const m = /* @__PURE__ */ new Map();
		app.querySelectorAll(".sq[data-id]").forEach((el) => m.set(el.dataset.id, {
			left: el.offsetLeft,
			top: el.offsetTop,
			width: el.offsetWidth
		}));
		return m;
	}
	const soundBtn = () => `<button class="pill snd" id="sound" aria-label="${SFX.on ? "Sound on" : "Sound off"}" aria-pressed="${SFX.on}">${SFX.on ? "🔊" : "🔇"}</button>`;
	const homeBtn = () => {
		const t = mode === "live" && phase !== "over" ? "Home (your game is saved in My games)" : "Home";
		return `<button class="ghost sm" id="restart" aria-label="${t}" title="${t}">🏠</button>`;
	};
	let renderLater = false;
	function render(opts = {}) {
		if (phase === "intro" || phase === "lobby" || phase === "joining" || phase === "stats" || phase === "account" || phase === "friends") dropDrag();
		else if (floater && ptr && ptr.moved) {
			renderLater = true;
			return;
		}
		renderLater = false;
		if (phase === "intro") return renderIntro();
		if (phase === "stats") return renderStats();
		if (phase === "account") return screens.render();
		if (phase === "friends") return friendScr.render();
		if (phase === "lobby" || phase === "joining") return renderLobby();
		const prev = snapshotRects();
		const over = phase === "over", setupOpen = phase === "setup" && !(mode === "live" && LIVE.ready[me]), myTurn = phase === "play" && state.turn === me && !state.winner;
		const brain = brainOf(state);
		const live = !!(brain && isSuper(brain)) && !state.cut;
		const drainNow = phase === "play" && !state.winner && !!state.drainOn;
		const turnPill = phase === "setup" ? `<span class="pill on turn${me === "AI" ? " ai" : ""}" id="turnpill">SET UP</span>` : phase === "play" && !state.winner ? state.turn === me ? `<span class="pill on turn mine${me === "AI" ? " ai" : ""}" id="turnpill">YOUR MOVE</span>` : `<span class="pill wait turn" id="turnpill">THEIR MOVE</span>` : "";
		let html = `<div class="left${setupOpen ? " setup" : ""}"><div class="hud"><span class="pill">R${Math.min(state.round, BAL.MAX_ROUNDS)}</span>${turnPill}${mode === "solo" ? `<span class="pill r lvl">VS ${BOT_NAME[gameLevel].toUpperCase()} BOT</span>` : ""}${soundBtn()}</div>`;
		html += meterHtml(brain, drainNow);
		let bhtml = `<div class="boardwrap"><div class="board" id="board">`;
		const cans = sel ? legalMoves(state, sel) : [];
		const nowShown = /* @__PURE__ */ new Set(), nowSides = /* @__PURE__ */ new Map(), flips = [], turns = [];
		const grab = (p, r, c) => p ? p.side === me && (setupOpen || myTurn) : setupOpen && me === "H" && onDC(state, r, c);
		const rowOrder = me === "H" ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
		const L = phase === "setup" ? null : state.last, theirLast = L && L.side !== me, lmc = L ? L.side === "H" ? "h" : "a" : "";
		const fin = over && L ? L.to : null;
		for (const r of rowOrder) for (let c = 0; c < 8; c++) {
			const p = at$1(state, r, c);
			const k = ["sq"];
			if (BLOCKED$1.has(r + "," + c)) k.push("block");
			let inner = c === 0 ? `<span class="rk">${sqName(r, 0).slice(1)}</span>` : "", idAttr = "";
			if (onDC(state, r, c)) {
				k.push("dc");
				if (drainNow) k.push("drain");
				else if (live) k.push("live");
				else if (state.cut) k.push("off");
				if (dcPick && phase === "setup") k.push("pick");
				inner += p ? `<span class="dcm">🏢</span>` : `<span class="dci">🏢<b>DC</b></span>`;
			}
			if (p) {
				k.push(cls(p.side));
				const show = p.side === me || p.revealed || over;
				if (!show) k.push("hid");
				else if (p.side !== me && p.revealed && !over) k.push("spot");
				if (p.side === "AI" && (p.revealed || p.side === me) && p.str >= BAL.ASI) k.push("asi");
				inner += pieceHtml(face(p), show);
				idAttr = ` data-id="${p.id}"`;
				if (show) {
					nowShown.add(String(p.id));
					if (!shown.has(String(p.id)) && prev.has(String(p.id))) flips.push(String(p.id));
				}
				nowSides.set(String(p.id), p.side);
				if (prevSides.has(String(p.id)) && prevSides.get(String(p.id)) !== p.side) turns.push(String(p.id));
			}
			if (grab(p, r, c)) k.push("grab");
			if (p && p.side === me && !over) k.push("own");
			if (sel && sel.r === r && sel.c === c) k.push("sel");
			if (phase === "setup" && sel && !p && SETUP_ROWS[me].includes(r) && !BLOCKED$1.has(r + "," + c)) k.push("can");
			if (phase === "setup" && dcPick && me === "H" && SETUP_ROWS.H.includes(r) && !BLOCKED$1.has(r + "," + c) && !onDC(state, r, c)) k.push("can");
			const mv = cans.filter((m) => m.to[0] === r && m.to[1] === c);
			if (mv.length) {
				k.push(mv.some((m) => m.copy) && copyMode ? "copy" : "can");
				if (p && p.side !== me && !copyMode) k.push("fight");
			}
			if (L && L.to[0] === r && L.to[1] === c) {
				if (theirLast) {
					k.push("opt", "op" + lmc);
					inner += `<i class="lm ${lmc}"></i>`;
				} else if (!over) k.push("last");
			}
			if (L && theirLast && L.from[0] === r && L.from[1] === c) inner += `<i class="lmf ${lmc}"></i>`;
			if (fin && fin[0] === r && fin[1] === c) k.push("final", L.side === "AI" ? "fai" : "fh");
			bhtml += `<button class="${k.join(" ")}" data-r="${r}" data-c="${c}"${idAttr} ${BLOCKED$1.has(r + "," + c) ? "disabled" : ""}>${inner}</button>`;
		}
		bhtml += `</div><div class="fx" id="fx"></div><div class="toasts" id="toasts"></div></div><div class="files">${[...Array(8).keys()].map((c) => `<span>${sqName(0, c)[0]}</span>`).join("")}</div>`;
		html += bhtml;
		const fl = lastFight || (state.winner ? lastFightIn(state) : null);
		const fline = fl && phase !== "setup" ? fightRow(fl) : `<div class="fline none"><span class="nf">${state.winner && !hadFight(state) ? "No fights this game" : phase === "setup" || state.round <= 1 ? "No fights yet" : "The last fight shows here"}</span></div>`;
		let logHtml;
		if (phase === "setup" && mode === "live" && LIVE.ready[me]) logHtml = `<span class="you">Your side is set.</span> Waiting for the other player to finish setting up<span class="dots"><i>.</i><i>.</i><i>.</i></span>`;
		else if (phase === "setup" && dcPick && me === "H") logHtml = `<span class="you">🏢 picked up.</span> Tap a lit square for it; a piece there swaps with it.`;
		else if (phase === "setup") {
			const lf = state.forms[me] == null ? null : FORMATIONS[me][state.forms[me]];
			logHtml = `<span class="you">${lf ? lf.name : "Random"}.</span> ${lf ? lf.hint : "A random spread."} Tap two pieces to swap them${me === "H" ? " (🏢 too)" : ""}.`;
		} else if (info$1) logHtml = info$1;
		else if (state.turn !== me && !state.winner) logHtml = mode === "live" ? `Waiting for <b>${SIDE_NAME[other(me)]}</b><span class="dots"><i>.</i><i>.</i><i>.</i></span>${LIVE.online[LIVE.host ? "guest" : "host"] ? "" : " They're away; your friend sees the board when they're back."}` : `<b>${theirs()}</b> is thinking<span class="dots"><i>.</i><i>.</i><i>.</i></span>`;
		else if (!state.winner && state.turn === me && me === "H" && drainNow && !(lastFight && lastFight.line && state.log === lastFight.line)) {
			const cto = state.pieces.some(isCTO) ? "CTO" : "backup";
			logHtml = `<span class="you">Your ${cto} is on 🏢.</span> The 🧠 is ${brain.str}: it drops ${BAL.DRAIN} each turn you end with the ${cto} there.`;
		} else if (!state.winner && (/to move\.$/.test(state.log) || lastFight && lastFight.line && state.log === lastFight.line)) logHtml = `<span class="you">Your move.</span>${theirMove()}`;
		else logHtml = color(state.log);
		const note = mode === "live" && LIVE.note && !over;
		if (note) logHtml = `<b class="recon">${LIVE.note}</b> Your game is safe on the server.`;
		if (over) {
			const win = state.winner === me, draw = state.winner === "D";
			const lm = !state.last ? "" : `Last move: ${state.last.side === me ? "you" : theirs()}, ${sqName(...state.last.from)} → ${sqName(...state.last.to)}.`;
			html += `<div class="console end"><div class="msg over ${draw ? "" : win ? "win" : "lose"}"><h1>${endTitle(state, me)}</h1><div>${color(state.log)}</div><div class="eyebrow">${lm} Round ${Math.min(state.round, BAL.MAX_ROUNDS)}${mode === "solo" ? ` · vs ${BOT_NAME[gameLevel]} bot` : ""}${mode === "live" && !LIVE.online[LIVE.host ? "guest" : "host"] ? ` · <span class="lvnote" id="friendleft">Your friend left.</span>` : ""}</div></div>${fline}</div>`;
		} else if (setupOpen) html += `<div class="setupbox"><div class="msg">${logHtml}</div>${lineupsHtml()}</div>`;
		else if (engage && phase === "play" && !note) html += `<div class="console eng">${engage}</div>`;
		else html += `<div class="console"><div class="msg">${logHtml}</div>${fline}</div>`;
		const bar = (cls, inner) => `<div class="actions${cls}">${inner}</div>`;
		if (setupOpen) html += bar(" home", `${homeBtn()}<button class="primary" id="go">START</button>`);
		else if (phase === "setup") html += bar(" home", `${homeBtn()}<button class="ghost" disabled>WAITING…</button>`);
		else if (phase === "play") {
			const copy = sel && sel.type === "R" && state.copies[me] > 0 && copySource(state, sel);
			html += bar("", `${homeBtn()}<button class="ghost" id="rules">PIECES ↓</button>${copy ? `<button class="ghost" id="copybtn" aria-pressed="${copyMode}">COPY (${state.copies[me]})</button>` : `<button class="ghost" id="log">LOG</button>`}`);
		} else if (over) html += bar(" end", `${homeBtn()}<button class="primary" id="again">PLAY AGAIN</button><button class="ghost" id="rules">PIECES ↓</button>`);
		html += `</div><div class="right" id="rulesbox">` + listHtml() + `</div>`;
		const lus = app.querySelector("#lineups"), lusX = lus ? lus.scrollLeft : null;
		app.innerHTML = html;
		const lus2 = app.querySelector("#lineups");
		if (lus2) {
			if (lusX != null) lus2.scrollLeft = lusX;
			else {
				const pk = lus2.querySelector(".lu.on");
				if (pk && pk.offsetLeft + pk.offsetWidth > lus2.clientWidth) lus2.scrollLeft = pk.offsetLeft - 10;
			}
		}
		if (!FAST && prev.size) {
			app.querySelectorAll(".sq[data-id]").forEach((el) => {
				const id = el.dataset.id, was = prev.get(id);
				if (!was || opts.skip && opts.skip.has(id) || noSlide.has(id)) return;
				const now = {
					left: el.offsetLeft,
					top: el.offsetTop,
					width: el.offsetWidth
				};
				const dx = was.left - now.left, dy = was.top - now.top;
				if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
				const dist = Math.hypot(dx, dy) / now.width;
				el.querySelector(".pz").animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], {
					duration: Math.min(420, 140 + dist * 70),
					easing: "cubic-bezier(.2,.8,.2,1)"
				});
			});
			for (const id of flips) {
				const el = app.querySelector(`.sq[data-id="${id}"] .blk`);
				if (el) el.classList.add("reveal");
			}
			for (const id of turns) {
				const el = app.querySelector(`.sq[data-id="${id}"]`);
				if (el) el.classList.add("turned");
			}
		}
		shown = nowShown;
		prevSides = nowSides;
		noSlide.clear();
		bindPointer();
		const on = (id, fn) => {
			const el = document.getElementById(id);
			if (el) el.addEventListener("click", fn);
		};
		app.querySelectorAll(".lu").forEach((el) => el.addEventListener("click", () => {
			if (phase !== "setup" || mode === "live" && LIVE.ready[me]) return;
			sfx.tap();
			dcPick = false;
			layoutSide(state, me, el.dataset.form === "" ? null : +el.dataset.form, Math.random);
			sel = null;
			render();
		}));
		on("go", begin);
		on("again", () => {
			if (mode === "live") {
				sfx.tap();
				if (!send({ t: "again" })) info$1 = "Not connected. Reconnecting…";
				return;
			}
			phase = "intro";
			render();
		});
		on("restart", () => {
			dropDrag();
			if (mode === "live") leaveLive();
			counts = false;
			dcPick = false;
			phase = "intro";
			render();
		});
		on("rules", () => {
			sfx.tap();
			document.getElementById("rulesbox").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
		});
		on("fline", () => {
			sfx.tap();
			showLog();
		});
		on("log", () => {
			sfx.tap();
			showLog();
		});
		on("copybtn", () => {
			sfx.tap();
			copyMode = !copyMode;
			render();
		});
		app.querySelectorAll(".kr").forEach((el) => el.addEventListener("click", () => {
			const k = `${el.dataset.side}:${el.dataset.type}:${el.dataset.str}`;
			sfx.tap();
			keyPick = keyPick === k ? null : k;
			render();
		}));
		on("sound", () => {
			SFX.on = !SFX.on;
			try {
				localStorage.setItem("ks-sound", SFX.on ? "on" : "off");
			} catch (e) {}
			if (SFX.on) unlockAudio();
			else if (SFX.tag) SFX.tag.pause();
			sfx.tap();
			render();
		});
	}
	const RANDOM_MINI = "dmbtdmbmddmdbtmdmdbdmdbm";
	function lineupsHtml() {
		const pick = state.forms[me], tone = (ch) => ch === "." ? "e" : ch === "F" ? "f" : ch === "T" ? "t" : ch === "8" || ch === "9" ? "b" : /[567]/.test(ch) ? "m" : "d";
		const cell = (t, n = "") => `<i class="${t}">${n}</i>`;
		const card = (form, name, hint, cells) => `<button class="lu${pick === form ? " on" : ""}" data-form="${form == null ? "" : form}" aria-pressed="${pick === form}"><span class="lun">${name}<b>${pick === form ? "✓" : ""}</b></span><span class="lum">${cells}</span><span class="luh">${hint}</span></button>`;
		const rnd = card(null, "Random", "A new random spread each tap.", [...RANDOM_MINI].map((t) => cell(t)).join(""));
		const forms = FORMATIONS[me].map((f, k) => card(k, f.name, f.hint, [
			f.rows[2],
			f.rows[1],
			f.rows[0]
		].flatMap((r) => [...r]).map((ch) => cell(tone(ch), ch === "8" || ch === "9" ? ch : "")).join("")));
		const sw = (t, l) => `<span><i class="${t}"></i>${l}</span>`;
		return `<div class="luhd"><b>LINEUP</b><span>swipe for more →</span></div><div class="lus" id="lineups">${rnd}${forms.join("")}</div>
      <div class="lul">${sw("b", "8–9")}${sw("m", "5–7")}${sw("d", "1–3")}${sw("t", me === "H" ? "honeypot" : "backdoor")}${sw("f", me === "H" ? "Internet" : "kill switch")}</div>`;
	}
	let brainSeen = null;
	function meterHtml(brain, drainNow) {
		if (brain) brainSeen = brain.str;
		const v = brain ? brain.str : brainSeen, rounds = BAL.RSI_EVERY - (state.round - 1) % BAL.RSI_EVERY;
		let st, nx;
		if (!brain || !state.rsi) {
			st = "stopped";
			nx = "STOPPED";
		} else if (state.cut) {
			st = v <= 0 ? "frag" : drainNow ? "drain" : "held";
			nx = v <= 0 ? "0 · FRAGILE" : drainNow ? `⚡ DRAINING −${BAL.DRAIN} A TURN` : "HELD · NO MORE +1s";
		} else if (v >= BAL.ASI) {
			st = "asi";
			nx = "SUPERINTELLIGENCE";
		} else {
			st = v >= BAL.AGI ? "agi" : "grow";
			const next = v + 1 === BAL.AGI ? " → AGI" : v + 1 === BAL.ASI ? " → ASI" : "";
			nx = `${v >= BAL.AGI ? "AGI · " : ""}+1 IN ${rounds} RND${rounds === 1 ? "" : "S"}${next}`;
		}
		if (phase === "over") nx = "GAME OVER";
		const vals = [];
		for (let x = 2; x <= BAL.MAX_STR; x++) vals.push(x);
		const tier = (x) => x >= BAL.ASI ? "asi" : x >= BAL.AGI ? "agi" : "";
		const bars = vals.map((x) => {
			const k = [tier(x)];
			if (st === "stopped") k.push("off");
			else if (v != null && x <= v) k.push("f");
			else if (st === "drain" || st === "held" || st === "frag") k.push("dr");
			return `<i class="${k.join(" ")}"></i>`;
		}).join("");
		const lbl = vals.map((x) => `<span class="${tier(x)}">${x === BAL.AGI ? "AGI" : x === BAL.ASI ? "ASI" : x}</span>`).join("");
		return `<div class="meter ${st === "grow" ? "" : st === "held" ? "drain" : st}" id="meter"><div class="mt"><span>🧠<span class="lb"> SELF-IMPROVER</span><span class="v">${v == null ? "–" : v}</span></span><span class="nx">${nx}</span></div><div class="bars">${bars}</div><div class="lbls">${lbl}</div></div>`;
	}
	function theirMove() {
		const h = state.history[state.history.length - 1];
		if (!h || !h.mv || h.side === me || !state.last || state.last.side === me) return "";
		return " " + color(logText(h)) + ".";
	}
	const logText = (h) => h.mv && h.side !== me && !h.mv.open ? `${SIDE_WORD[h.side]} piece ${h.mv.from} → ${h.mv.to}` : h.text;
	let keyPick = null;
	const NOTE = (side, t, str) => {
		if (t === "C") return "Once an enemy moves away, or the scanner moves or falls, it is hidden again.";
		if (side === "H" && t === "X" && str === 9) return "The drain pauses while it is off the 🏢. While the CTO lives, only the CTO drains.";
		if (side === "H" && t === "X" && str >= BAL.BACKUP) return state.pieces.some(isCTO) ? `Once the CTO is dead, any human ${BAL.BACKUP}+ on the 🏢 drains the 🧠 the same way; the drain pauses while none stands there.` : "The drain pauses while none stands there.";
		if (side === "AI" && t === "X" && !BOOSTS({
			side,
			type: t,
			str
		})) return "Never gets the +1 on the 🏢.";
		if (side === "AI" && t === "I") {
			const b = brainOf(state);
			if (state.cut && b && b.str <= 0) return "";
			return `${state.cut ? "" : `Below ${BAL.ASI} it fights with its number like any piece: `}as an 8 or 9 it falls to the 📢, and the 🎭 trades with it. At 0 it is fragile (still hidden): any piece that finds it kills it.`.replace(/^as/, "As");
		}
		return "";
	};
	function listHtml() {
		const alive = (side, t, str) => state.pieces.filter((p) => p.side === side && homeSide(p) === side && p.type === t && (str == null || (p.base ?? p.str) === str)).length;
		const total = (side, t, str) => ARMIES[side].filter(([tt, ss]) => tt === t && (str == null || ss === str)).length;
		const lvlOf = (side, t, str) => t === "X" ? str : t === "I" ? (brainOf(state) || {}).str ?? brainSeen ?? ARMIES[side].find(([tt]) => tt === t)[1] : ARMIES[side].find(([tt]) => tt === t)[1];
		const tile = (side, t, str) => {
			const n = alive(side, t, str), m = total(side, t, str), lvl = lvlOf(side, t, str), key = `${side}:${t}:${str == null ? "" : str}`;
			const boost = t === "X" && !state.cut && BOOSTS({
				side,
				type: t,
				str
			});
			return `<button class="kr ${cls(side)}${n ? "" : " gone"}${keyPick === key ? " on" : ""}" data-side="${side}" data-type="${t}" data-str="${str == null ? "" : str}" aria-pressed="${keyPick === key}"><span class="k">${tokenHtml(side, {
				side,
				home: side,
				type: t,
				str: lvl
			})}${n ? "" : `<i class="ks"></i>`}${boost ? `<i class="kb" title="+1 at the 🏢, once">↑🏢</i>` : ""}</span><span class="kn">${cap$1(roleName({
				side,
				home: side,
				type: t,
				str: lvl
			}))}</span><span class="kc">×${n}<i> /${m}</i></span></button>`;
		};
		const detail = (side) => {
			if (!keyPick || !keyPick.startsWith(side + ":")) return side === me ? "" : `<p class="ktip">Tap a piece for what it does.</p>`;
			const [, t, s] = keyPick.split(":"), str = s ? +s : null, note = NOTE(side, t, str);
			return `<div class="kd">${explain({
				side,
				home: side,
				type: t,
				str: lvlOf(side, t, str),
				seen: true
			})}${note ? ` ${note}` : ""}</div>`;
		};
		const ranks = (side) => [...new Set(ARMIES[side].filter(([t]) => t === "X").map(([, n]) => n))].sort((a, b) => b - a);
		const specials = (side) => [
			"S",
			"M",
			"A",
			"C",
			"I",
			"K",
			"R",
			"T",
			"F"
		].filter((t) => ARMIES[side].some(([tt]) => tt === t));
		const grid = (side) => `<div class="kg">${ranks(side).map((n) => tile(side, "X", n)).join("")}${specials(side).map((t) => tile(side, t)).join("")}</div>${detail(side)}`;
		const head = (side, label, left, more) => `<div class="kh ${cls(side) === "h" ? "b" : "a"}${more ? " more" : ""}"><h2>${label}</h2><span class="kc"><b>${left}</b> of ${ARMIES[side].length} left</span></div>`;
		const aiSeen = state.pieces.filter((p) => p.side !== me && p.type === "X").filter((p) => p.revealed && homeSide(p) !== me).sort((a, b) => b.str - a.str);
		const byStr = (a, b) => b.str - a.str;
		const joinedMe = state.pieces.filter((p) => p.side === me && isTurned(p)).sort(byStr), joinedThem = state.pieces.filter((p) => p.side !== me && homeSide(p) === me).sort(byStr);
		const chips = (list) => list.length ? list.map(chip).join("") : `<span class="none">none</span>`;
		const turned = joinedMe.length || joinedThem.length ? `<div class="seen trnd"><b>↺ TURNED</b><span>now theirs: ${chips(joinedThem)}</span><span>now yours: ${chips(joinedMe)}</span></div>` : "";
		return `<div class="key">
      <section class="ksec">${head(other(me), "Their pieces", state.pieces.filter((p) => p.side !== me && homeSide(p) !== me).length, true)}${grid(other(me))}${aiSeen.length ? `<div class="seen">Spotted: ${aiSeen.map(chip).join("")}</div>` : ""}</section>
      <section class="ksec">${head(me, "Your pieces", state.pieces.filter((p) => p.side === me && homeSide(p) === me).length)}${grid(me)}</section>
      ${turned}
      ${rulesHtml()}
    </div>`;
	}
	function rulesHtml() {
		const H = me === "H", deepfake = ARMIES.AI.some(([t]) => t === "K");
		const spy = `${BAL.SPY_MIN} or ${BAL.SPY_MAX}`, boost = `${BAL.BOOST_MIN} or ${BAL.BOOST_MAX}`;
		const grows = `+1 every ${BAL.RSI_EVERY} rounds. AGI at ${BAL.AGI}. At ${BAL.ASI} it beats everything and ignores honeypots and the 📢.`;
		const drain = `each turn it stays, the 🧠 loses ${BAL.DRAIN}, and it never grows again. It fights at what’s left; at 0 anything kills it. CTO dead? ${cap$1(BACKUPS())} can.`;
		const you = H ? [
			[
				"🛑",
				"Win",
				"Reach the AI’s 🛑 kill switch."
			],
			[
				"🏢",
				"Drain the 🧠",
				`Once the 🧠 hits ${BAL.ASI}, park your CTO on your 🏢: ${drain}`
			],
			[
				"📢",
				"Whistleblower",
				`Attacks an ${spy} and wins. Loses to anything else.`
			],
			[
				"🍯",
				"Honeypots",
				"An AI piece that attacks one joins your side."
			]
		] : [
			[
				"🌍",
				"Win",
				"Reach the humans’ 🌍 Internet."
			],
			[
				"🧠",
				"Your 🧠 grows",
				grows
			],
			[
				"🐝",
				"Boost",
				`Your ${boost} that reaches their 🏢 gets +1, once, until the drain starts.`
			],
			[
				"🦠",
				"Virus",
				`Attacks an ${spy} and wins. Loses to anything else.`
			],
			deepfake && [
				"🎭",
				"Deepfake",
				"Copies the number of whatever it fights: both fall."
			],
			[
				"🚪",
				"Backdoors",
				"A human piece that attacks one joins your side."
			]
		];
		const them = H ? [
			[
				"🧠",
				"The 🧠 grows",
				grows
			],
			[
				"🐝",
				"Boost",
				`An AI ${boost} that reaches your 🏢 gets +1, once, until the drain starts.`
			],
			[
				"🦠",
				"Virus",
				`Kills your ${spy} if it attacks them.`
			],
			deepfake && [
				"🎭",
				"Deepfake",
				"Copies your number in a fight: both fall."
			],
			[
				"🚪",
				"Backdoors",
				"Attack one and your piece joins the AI."
			]
		] : [
			[
				"🏢",
				"The drain",
				`Once your 🧠 hits ${BAL.ASI}, each turn their CTO stays on their 🏢 your 🧠 loses ${BAL.DRAIN}, and it never grows again. It fights at what’s left; at 0 anything kills it. CTO dead? ${cap$1(BACKUPS())} can.`
			],
			[
				"📢",
				"Whistleblower",
				`Kills your ${spy} if it attacks them.`
			],
			[
				"🍯",
				"Honeypots",
				`Attack one and your piece joins the humans (not at ${BAL.ASI}).`
			]
		];
		const basics = [[
			"⚔️",
			"Fight",
			"Move onto an enemy. Higher number wins; the same number, both fall."
		], [
			"📡",
			"Scanner",
			"Shows the enemies next to it while they stay there."
		]];
		const group = (k, head, sub, cards) => `<section class="rg ${k}"><div class="rgh"><h2>${head}</h2><span>${sub}</span></div>${cards.filter(Boolean).map(([ic, h, t]) => `<div class="rc"><span class="ri">${ic}</span><div><h3>${h}</h3><p>${t}</p></div></div>`).join("")}</section>`;
		return `<div class="rcs">${group(H ? "h" : "a", "You", H ? "Humans" : "The AI", you)}${group("w", "Watch out", H ? "what the AI can do" : "what the humans can do", them)}${group("n", "Basics", "both sides", basics)}</div>`;
	}
	let soloSide = "H";
	try {
		if (localStorage.getItem("ks-side") === "AI") soloSide = "AI";
	} catch (e) {}
	let soloLevel = "medium";
	try {
		soloLevel = toLevel(localStorage.getItem("ks-level"));
	} catch (e) {}
	if (params.has("level")) soloLevel = toLevel(params.get("level"));
	const icon = (side, emoji) => `<div class="pz">${blockHtml(`<span class="ic">${emoji}</span>`, side)}</div>`;
	function introRules(side) {
		return (side === "H" ? [
			[
				"AI",
				"🛑",
				"WIN",
				"win",
				"Reach the AI’s kill switch"
			],
			[
				"AI",
				"🧠",
				"IT GROWS",
				"grow",
				`+1 every ${BAL.RSI_EVERY} rounds. At ${BAL.ASI} it beats all`
			],
			[
				"H",
				"🏢",
				"DRAIN IT",
				"drain",
				`Put your 🤵 CTO on the 🏢, take ${BAL.DRAIN} from the 🧠`
			]
		] : [
			[
				"H",
				"🌍",
				"WIN",
				"win",
				"Reach the humans’ Internet"
			],
			[
				"AI",
				"🧠",
				"YOU GROW",
				"grow",
				`+1 every ${BAL.RSI_EVERY} rounds. At ${BAL.ASI} you beat all`
			],
			[
				"H",
				"🏢",
				"WATCH OUT",
				"warn",
				"Their 🤵 CTO on the 🏢 drains your 🧠"
			]
		]).map(([s, e, h, c, t]) => `<div class="rb"><div class="k">${icon(s, e)}</div><b class="r-${c}">${h}</b><p>${t}</p></div>`).join(`<i class="chev" aria-hidden="true">›</i>`);
	}
	const HERO_BG = (() => {
		return `<div class="herobg" aria-hidden="true"><div><svg viewBox="-200 0 790 460" width="790" height="460" focusable="false"><defs><linearGradient id="hbf" gradientUnits="userSpaceOnUse" x1="0" y1="288" x2="0" y2="440"><stop offset="0" stop-color="#3A7FB8" stop-opacity=".32"/><stop offset=".5" stop-color="#2A5E8C" stop-opacity=".14"/><stop offset="1" stop-color="#1B3550" stop-opacity="0"/></linearGradient><radialGradient id="hbz" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#5CC8FF" stop-opacity=".22"/><stop offset="1" stop-color="#5CC8FF" stop-opacity="0"/></radialGradient><radialGradient id="hbg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#F5A524" stop-opacity=".28"/><stop offset="1" stop-color="#F5A524" stop-opacity="0"/></radialGradient></defs><ellipse cx="195" cy="172" rx="120" ry="110" fill="url(#hbg)"/><ellipse cx="195" cy="290" rx="260" ry="34" fill="url(#hbz)"/><g stroke="url(#hbf)" stroke-width="1">${[
			-56.7,
			-28.8,
			-.8,
			27.2,
			55.1,
			83.1,
			111.1,
			139.1,
			167,
			195,
			223,
			250.9,
			278.9,
			306.9,
			334.9,
			362.8,
			390.8,
			418.8,
			446.7
		].map((x, i) => `<line x1="${x}" y1="288" x2="${-381 + 64 * i}" y2="440"/>`).join("")}${[
			288,
			293,
			300,
			310,
			323,
			340,
			362,
			390,
			425
		].map((y) => `<line x1="-200" y1="${y}" x2="590" y2="${y}"/>`).join("")}</g><line x1="-200" y1="288" x2="590" y2="288" stroke="#6FD0FF" stroke-opacity=".28" stroke-width="1"/></svg>${[
			[
				30,
				92,
				38,
				"?",
				1,
				.22,
				17
			],
			[
				156,
				62,
				28,
				"?",
				1,
				.15,
				13
			],
			[
				322,
				120,
				32,
				"🛸",
				0,
				.19,
				15
			],
			[
				262,
				228,
				28,
				"🦾",
				1,
				.16,
				13
			],
			[
				22,
				226,
				30,
				"🔧",
				0,
				.16,
				15
			],
			[
				334,
				214,
				34,
				"?",
				1,
				.19,
				17
			]
		].map(([x, y, s, t, oct, o, f]) => `<i class="${oct ? "a" : "h"}" style="left:${x + 200}px;top:${y}px;width:${s}px;height:${s}px;opacity:${o};font-size:${f}px"><b>${t}</b></i>`).join("")}</div></div>`;
	})();
	const WATCHER = `<svg class="watcher" viewBox="0 0 64 64" width="104" height="104" aria-hidden="true" focusable="false"><defs><linearGradient id="w4h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFBA45"/><stop offset=".55" stop-color="#F5A524"/><stop offset="1" stop-color="#E08A0B"/></linearGradient><radialGradient id="w4g"><stop offset="0" stop-color="#FF5C5C" stop-opacity=".55"/><stop offset="1" stop-color="#FF5C5C" stop-opacity="0"/></radialGradient><linearGradient id="w4t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF5C5C" stop-opacity="0"/><stop offset="1" stop-color="#FF5C5C" stop-opacity=".5"/></linearGradient></defs><path d="M21.23 6 L42.77 6 L58 21.23 L58 42.77 L42.77 58 L21.23 58 L6 42.77 L6 21.23 Z" fill="url(#w4h)"/><path d="M22.2 8.34 L41.8 8.34 L55.66 22.2 L55.66 41.8 L41.8 55.66 L22.2 55.66 L8.34 41.8 L8.34 22.2 Z" fill="none" stroke="#FFD27A" stroke-opacity=".38" stroke-width="0.94"/><path d="M15.52 23.99 L48.48 23.99 L53.01 28.52 L53.01 34.55 L48.48 39.07 L15.52 39.07 L10.99 34.55 L10.99 28.52 Z" fill="#06121C"/><clipPath id="w4v"><path d="M15.52 23.99 L48.48 23.99 L53.01 28.52 L53.01 34.55 L48.48 39.07 L15.52 39.07 L10.99 34.55 L10.99 28.52 Z"/></clipPath><g clip-path="url(#w4v)"><g class="eye"><rect x="16.03" y="30.03" width="23.11" height="3.01" rx="1.5" fill="url(#w4t)"/><circle cx="39.14" cy="31.53" r="10.17" fill="url(#w4g)"/><circle cx="39.14" cy="31.53" r="4.42" fill="#FF5C5C"/><circle cx="37.55" cy="29.94" r="1.33" fill="#FFE1E1"/></g></g></svg>`;
	const WORDMARK = `<svg viewBox="0 0 632.6 70" aria-hidden="true" focusable="false"><g fill="#E6EDF3"><path d="M6.50 70L6.50 0L20.10 0L20.10 29.30L30.70 29.30L47.60 0L62.90 0L42.40 34.90L64.60 70L49 70L30.60 40.90L20.10 40.90L20.10 70L6.50 70Z"/><path d="M75.10 70L75.10 0L88.70 0L88.70 70L75.10 70Z"/><path d="M105.20 70L105.20 0L118.80 0L118.80 58.50L153.80 58.50L153.80 70L105.20 70Z"/><path d="M164.30 70L164.30 0L177.90 0L177.90 58.50L212.90 58.50L212.90 70L164.30 70Z"/><path d="M262.90 70L252.10 59.20L252.10 49.20L265.50 49.20L265.50 55.10L268.80 58.40L289.50 58.40L292.90 55L292.90 43.40L289.60 40.10L263.10 40.10L252.30 29.30L252.30 10.80L263.10 0L294.70 0L305.50 10.80L305.50 20.90L292.10 20.90L292.10 14.90L288.80 11.60L269 11.60L265.70 14.90L265.70 25.20L269 28.50L295.50 28.50L306.30 39.30L306.30 59L295.30 70L262.90 70Z"/><path d="M329.80 70L315.30 0L329 0L337.50 49.40L337.90 49.40L351.80 0L362 0L375.60 49.40L376 49.40L384.50 0L398.20 0L383.70 70L371 70L357.10 20.80L356.70 20.80L342.50 70L329.80 70Z"/><path d="M410.70 70L410.70 0L424.30 0L424.30 70L410.70 70Z"/><path d="M456.70 70L456.70 11.50L435.80 11.50L435.80 0L491.20 0L491.20 11.50L470.30 11.50L470.30 70L456.70 70Z"/><path d="M511.20 70L499.70 58.50L499.70 11.50L511.20 0L545.40 0L556.70 11.30L556.70 22L543.10 22L543.10 16.30L538.40 11.60L518.40 11.60L513.30 16.70L513.30 53.30L518.40 58.40L538.40 58.40L543.10 53.70L543.10 48L556.70 48L556.70 58.70L545.40 70L511.20 70Z"/><path d="M569.20 70L569.20 0L582.80 0L582.80 29.30L612.40 29.30L612.40 0L626 0L626 70L612.40 70L612.40 40.90L582.80 40.90L582.80 70L569.20 70Z"/></g></svg>`;
	function renderIntro() {
		app.innerHTML = `<div class="overlay home"><div class="card">
      <div id="acctslot"></div>
      <div class="hero">${HERO_BG}${WATCHER}<h1 class="logo" aria-label="Kill Switch">${WORDMARK}</h1></div>
      <div class="rules" id="introrules">${introRules(soloSide)}</div>
      <div class="seg sides" role="group" aria-label="Play as"><button class="h" id="asH" aria-pressed="${soloSide === "H"}">🕵️ HUMANS</button><button class="ai" id="asAI" aria-pressed="${soloSide === "AI"}">🧠 THE AI</button></div>
      <div class="seg lv" role="group" aria-label="Bot level">${BOT_LEVELS.map((l) => `<button id="lv-${l}" aria-pressed="${soloLevel === l}">${l.toUpperCase()}</button>`).join("")}</div>
      <button class="primary${soloSide === "AI" ? " ai" : ""}" id="play">PLAY AS ${soloSide === "H" ? "HUMANS" : "THE AI"}</button>
      <div class="introrow"><button class="ghost" id="friend">PLAY A FRIEND</button><button class="ghost" id="joinopen" aria-expanded="false" aria-controls="joinform">JOIN CODE</button><button class="ghost" id="stats">STATS</button></div>
      <form class="join" id="joinform" hidden><input id="joincode" maxlength="4" placeholder="CODE" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="Game code"><button class="ghost" id="joinbtn">JOIN</button><button type="button" class="ghost sm" id="joinclose" aria-label="Close">✕</button></form>
      <div class="games" id="mygames" hidden></div></div></div>`;
		const pick = (side) => () => {
			sfx.tap();
			soloSide = side;
			try {
				localStorage.setItem("ks-side", side);
			} catch (e) {}
			document.getElementById("asH").setAttribute("aria-pressed", side === "H");
			document.getElementById("asAI").setAttribute("aria-pressed", side === "AI");
			const play = document.getElementById("play");
			play.textContent = "PLAY AS " + (side === "H" ? "HUMANS" : "THE AI");
			play.classList.toggle("ai", side === "AI");
			document.getElementById("introrules").innerHTML = introRules(side);
			fitHero();
		};
		for (const l of BOT_LEVELS) document.getElementById("lv-" + l).addEventListener("click", () => {
			sfx.tap();
			soloLevel = l;
			try {
				localStorage.setItem("ks-level", l);
			} catch (e) {}
			for (const k of BOT_LEVELS) document.getElementById("lv-" + k).setAttribute("aria-pressed", k === l);
		});
		document.getElementById("asH").addEventListener("click", pick("H"));
		document.getElementById("asAI").addEventListener("click", pick("AI"));
		document.getElementById("play").addEventListener("click", () => {
			sfx.win();
			start("solo", soloSide);
		});
		document.getElementById("friend").addEventListener("click", () => {
			sfx.win();
			createLive();
		});
		document.getElementById("stats").addEventListener("click", () => {
			sfx.tap();
			openStats();
		});
		const jf = document.getElementById("joinform"), jo = document.getElementById("joinopen");
		const showJoin = (open) => {
			jf.hidden = !open;
			jo.setAttribute("aria-expanded", open);
			if (open) document.getElementById("joincode").focus();
		};
		jo.addEventListener("click", () => {
			sfx.tap();
			showJoin(jf.hidden);
		});
		document.getElementById("joinclose").addEventListener("click", () => {
			sfx.tap();
			showJoin(false);
			jo.focus();
		});
		jf.addEventListener("submit", (e) => {
			e.preventDefault();
			sfx.tap();
			openGame(document.getElementById("joincode").value);
		});
		renderMyGames();
		paintAcct();
		fitHero();
		if (document.fonts) document.fonts.ready.then(fitHero);
	}
	function fitHero() {
		const ov = app.querySelector(".overlay.home");
		if (!ov) return;
		const card = ov.querySelector(".card"), row = ov.querySelector(".introrow"), cs = getComputedStyle(ov);
		const avail = ov.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
		const fits = (hs) => {
			ov.style.setProperty("--hs", String(hs));
			return row.getBoundingClientRect().bottom - card.getBoundingClientRect().top <= avail + .5;
		};
		ov.classList.remove("noacct");
		if (fits(1)) {
			const ROOM = 24, roomy = (hs) => fits(hs) && row.getBoundingClientRect().bottom - card.getBoundingClientRect().top <= avail - ROOM + .5;
			let lo = 1, hi = 1.2;
			if (!roomy(hi)) for (let k = 0; k < 8; k++) {
				const mid = (lo + hi) / 2;
				if (roomy(mid)) lo = mid;
				else hi = mid;
			}
			else lo = hi;
			fits(Math.floor(lo * 1e3) / 1e3);
			return;
		}
		const slot = document.getElementById("acctslot");
		if (!fits(.5) && slot && !slot.childElementCount) ov.classList.add("noacct");
		if (!fits(.5)) return;
		let lo = .5, hi = 1;
		for (let k = 0; k < 8; k++) {
			const mid = (lo + hi) / 2;
			if (fits(mid)) lo = mid;
			else hi = mid;
		}
		fits(Math.floor(lo * 1e3) / 1e3);
	}
	addEventListener("resize", () => requestAnimationFrame(fitHero));
	function paintAcct() {
		const slot = document.getElementById("acctslot");
		if (!slot) return;
		slot.innerHTML = screens.buttonHtml();
		const b = document.getElementById("profile");
		if (b) b.addEventListener("click", () => {
			sfx.tap();
			screens.open();
			phase = "account";
			render();
		});
		const f = document.getElementById("friends-btn");
		if (f) f.addEventListener("click", () => {
			sfx.tap();
			openFriends();
		});
		fitHero();
	}
	function openFriends(back = "home") {
		phase = "friends";
		friendScr.openList(back);
	}
	function openProfile() {
		screens.open();
		phase = "account";
		render();
	}
	let statsTab = "solo", statsConfirm = false;
	function renderStats() {
		const a = current();
		const label = a && (a.user.handle ? `${a.user.avatar} @${a.user.handle}` : "Your account");
		const note = !a ? null : a.expired ? "Sign in again to sync these with your other devices. Games still count." : a.queue.length ? `${a.queue.length} game${a.queue.length > 1 ? "s" : ""} waiting to sync.` : null;
		app.innerHTML = `<div class="overlay"><div class="card stats">${statsHtml(a ? a.stats : loadStats(), statsTab, statsConfirm, a ? {
			label,
			note
		} : null)}</div></div>`;
		const on = (id, fn) => {
			const el = document.getElementById(id);
			if (el) el.addEventListener("click", () => {
				sfx.tap();
				fn();
				render();
			});
		};
		on("st-solo", () => {
			statsTab = "solo";
			statsConfirm = false;
		});
		on("st-friends", () => {
			statsTab = "friends";
			statsConfirm = false;
		});
		on("st-back", () => {
			statsConfirm = false;
			phase = "intro";
		});
		on("st-reset", () => {
			statsConfirm = true;
		});
		on("st-cancel", () => {
			statsConfirm = false;
		});
		on("st-yes", () => {
			resetStats();
			statsConfirm = false;
		});
	}
	function openStats(tab = "solo") {
		statsTab = tab;
		statsConfirm = false;
		phase = "stats";
		render();
		if (signedIn()) sync().then(() => {
			if (phase === "stats" && !statsConfirm) render();
		});
	}
	let counts = false;
	function countSolo() {
		if (!counts) return;
		counts = false;
		const g = {
			level: gameLevel,
			side: me,
			winner: state.winner,
			reason: endReason(state)
		};
		if (!record({
			kind: "solo",
			...g
		})) updateStats((s) => recordSolo(s, g));
	}
	function countFriend(m) {
		const g = {
			key: LIVE.code + ":" + m.moveSeq,
			side: m.you,
			winner: m.s.winner,
			rounds: Math.min(m.s.round, BAL.MAX_ROUNDS)
		};
		if (!record({
			kind: "friend",
			...g
		})) updateStats((s) => recordFriend(s, g));
	}
	const DC_INFO = () => {
		const b = brainOf(state), head = `<span class="you">🏢 ${me === "H" ? "Your" : "The humans'"} datacenter.</span>`;
		const dead = me === "H" && !state.pieces.some(isCTO), who = me === "H" ? dead ? `${BACKUPS()} of yours` : "your CTO" : `their CTO (once it's dead, ${BACKUPS()})`;
		if (state.cut) return `${head} ${!b ? "The 🧠 is gone." : b.str <= 0 ? "The 🧠 is drained to 0: fragile." : state.drainOn ? `${me === "H" ? cap$1(who) : "A human piece"} is draining the 🧠: ${b.str} now, −${BAL.DRAIN} each human turn it stays.` : `The 🧠 is down to ${b.str}. ${me === "H" ? `${cap$1(who)} back here drains it on.` : `If ${who} comes back, it drains on.`}`} No more +1s.`;
		return me === "H" ? `${head} AI fighters 5–6 get +1 here, once. Once the 🧠 is a ${BAL.ASI}, each turn you end with ${dead ? who : `your CTO (once it's dead, ${BACKUPS()})`} here takes ${BAL.DRAIN} off it.` : `${head} Your fighters 5–6 get +1 here, once. Once your 🧠 is a ${BAL.ASI}, ${who} standing here drains it ${BAL.DRAIN} a turn.`;
	};
	function explain(p) {
		p = face(p);
		const n = (isTurned(p) ? "turned " : "") + (LEVELS_UP(p.type) ? `${roleName(p)} ${p.str}` : roleName(p));
		return `<span class="${p.side === me ? "you" : "them"}">${iconOf(p)} ${cap$1(n)}.</span> ${ABOUT[p.type](p, state)}`;
	}
	function tap(r, c) {
		if (busy) return;
		engage = null;
		const p = at$1(state, r, c);
		if (phase === "setup") {
			if (mode === "live" && LIVE.ready[me]) return;
			const mineSq = SETUP_ROWS[me].includes(r) && !BLOCKED$1.has(r + "," + c);
			if (me === "H" && dcPick) {
				dcPick = false;
				if (mineSq && !onDC(state, r, c)) {
					sfx.move();
					if (p) {
						p.r = state.dc[0];
						p.c = state.dc[1];
					}
					state.dc = [r, c];
				}
				return render();
			}
			if (me === "H" && !sel && !p && onDC(state, r, c)) {
				sfx.tap();
				dcPick = true;
				return render();
			}
			if (sel && !p && mineSq) {
				sfx.move();
				if (onDC(state, r, c)) state.dc = [sel.r, sel.c];
				sel.r = r;
				sel.c = c;
				sel = null;
				return render();
			}
			if (!p || p.side !== me) return;
			if (!sel) {
				sfx.tap();
				sel = p;
				return render();
			}
			if (sel.id !== p.id) {
				sfx.move();
				const t = [sel.r, sel.c];
				sel.r = p.r;
				sel.c = p.c;
				p.r = t[0];
				p.c = t[1];
			}
			sel = null;
			return render();
		}
		if (phase !== "play" || state.turn !== me) return;
		if (p && p.side === me) {
			sfx.tap();
			sel = sel && sel.id === p.id ? null : p;
			copyMode = false;
			info$1 = null;
			return render();
		}
		if (!p && !sel && onDC(state, r, c)) {
			sfx.tap();
			info$1 = DC_INFO();
			return render();
		}
		if (p && p.side !== me && p.revealed && !sel) {
			sfx.tap();
			info$1 = explain(p);
			return render();
		}
		if (sel) {
			const mv = legalMoves(state, sel).find((m) => m.to[0] === r && m.to[1] === c && !!m.copy === copyMode);
			if (mv) play({
				p: sel,
				...mv
			});
		}
	}
	function play(move) {
		if (busy || phase !== "play" || state.turn !== me) return;
		if (mode === "live") {
			sel = null;
			copyMode = false;
			info$1 = null;
			if (!send({
				t: "move",
				id: move.p.id,
				to: move.to,
				copy: !!move.copy
			})) {
				info$1 = "Not connected to the game server. Reconnecting…";
				return render();
			}
			busy = true;
			noSlide.clear();
			app.querySelectorAll(".sq.can,.sq.sel,.sq.copy").forEach((q) => q.classList.remove("can", "sel", "copy"));
			const msg = app.querySelector(".msg");
			if (msg) msg.innerHTML = `Sending your move<span class="dots"><i>.</i><i>.</i><i>.</i></span>`;
			return;
		}
		const before = state;
		state = apply(state, move);
		sel = null;
		copyMode = false;
		info$1 = null;
		const big = !FAST && state.events.some((e) => e.kind === "drain" && (e.first || e.to === 0) || e.kind === "agi" || e.kind === "asi");
		afterMove(before).then(() => {
			if (state.winner) return;
			setTimeout(botTurn, FAST ? 0 : big ? 1800 : 420);
		});
	}
	const wait = (ms) => new Promise((res) => setTimeout(res, ms));
	const trace = (k) => {
		if (params.has("trace")) (window.__trace = window.__trace || []).push([k, Math.round(performance.now())]);
	};
	const fin = (a, ms) => Promise.race([a.finished.catch(() => {}), wait(ms + 80)]);
	function rectOf(r, c) {
		const el = app.querySelector(`.sq[data-r="${r}"][data-c="${c}"]`);
		return el ? {
			left: el.offsetLeft,
			top: el.offsetTop,
			width: el.offsetWidth,
			height: el.offsetHeight
		} : null;
	}
	const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
	const A = (el, frames, ms, easing = "ease", extra = {}) => fin(el.animate(frames, {
		duration: reduce ? 1 : ms,
		easing,
		fill: "forwards",
		...extra
	}), reduce ? 1 : ms);
	const blk = (el) => el.querySelector(".blk");
	function cloneAt(p, rect, show) {
		const fx = document.getElementById("fx");
		if (!fx) return null;
		const el = document.createElement("div");
		el.className = "clone";
		Object.assign(el.style, {
			left: rect.left + "px",
			top: rect.top + "px",
			width: rect.width + "px",
			height: rect.height + "px"
		});
		el.innerHTML = blockHtml(show ? faceHtml(p) : `<span class="q">?</span>`, p.side, !show);
		fx.appendChild(el);
		return el;
	}
	function fxAt(cls, c, f, style = {}) {
		const e = document.createElement("div");
		e.className = cls;
		Object.assign(e.style, {
			left: c.x0 + c.dx * f + "px",
			top: c.y0 + c.dy * f + "px"
		}, style);
		document.getElementById("fx").appendChild(e);
		return e;
	}
	function sparks(c, f = 1, color) {
		if (reduce) return;
		for (let i = 0; i < 18; i++) {
			const s = fxAt("spk", c, f);
			if (color) s.style.background = color;
			else if (i % 3 === 0) s.style.background = "#fff";
			const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 50;
			s.animate([{
				transform: "translate(0,0) scale(1.4)",
				opacity: 1
			}, {
				transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(.6)`,
				opacity: 0
			}], {
				duration: 600 + Math.random() * 300,
				easing: "cubic-bezier(.1,.7,.3,1)"
			}).finished.then(() => s.remove(), () => s.remove());
		}
	}
	const T = (ry = 0, rz = 0, k = 1.1, y = -3) => `perspective(300px) translateY(${y}px) scale(${k}) rotateY(${ry}deg) rotate(${rz}deg)`;
	const LIFT = T();
	const lift = (el, ms = 220) => A(blk(el), [{ transform: T(0, 0, 1, 0) }, { transform: LIFT }], ms, "ease-out");
	const land = (el) => A(blk(el), [{ transform: T(0, 0, 1, 0) }], 220, "cubic-bezier(.3,1.6,.5,1)");
	const slide = (el, c, f, ms, easing = "ease-out") => A(el, [{
		left: c.ra.left + c.dx * f + "px",
		top: c.ra.top + c.dy * f + "px"
	}], ms, easing);
	function knockOff(el, c, f, sign) {
		const s = c.size, ux = c.dx / c.len, uy = c.dy / c.len;
		A(el, [{
			left: c.ra.left + c.dx * f + (ux * .9 - uy * .4) * s * sign + "px",
			top: c.ra.top + c.dy * f + (uy * .9 + ux * .4) * s * sign + "px"
		}], 380, "ease-out");
		return A(blk(el), [
			{
				transform: LIFT,
				opacity: 1
			},
			{
				transform: T(0, 300 * sign, .8, 0),
				opacity: 1,
				offset: .55
			},
			{
				transform: T(0, 540 * sign, 0, 0),
				opacity: 0
			}
		], 380, "ease-out");
	}
	const sink = (el) => A(blk(el), [{
		transform: LIFT,
		opacity: 1
	}, {
		transform: T(0, 0, 0, 4),
		opacity: 0
	}], 260, "ease-in");
	async function flip(el, html) {
		const b = blk(el);
		await A(b, [{ transform: LIFT }, { transform: T(90) }], 90, "ease-in");
		b.innerHTML = html;
		b.classList.remove("hid");
		await A(b, [{ transform: T(-90) }, { transform: LIFT }], 150, "cubic-bezier(.3,1.5,.5,1)");
	}
	function fightTier(a, d) {
		const m = Math.max(a.type === "X" || LEVELS_UP(a.type) ? a.str : 0, d.type === "X" || LEVELS_UP(d.type) ? d.str : 0);
		return m >= 7 ? 2 : m >= 4 ? 1 : 0;
	}
	function bump(el, k) {
		if (!el || reduce) return;
		el.classList.remove(k);
		el.offsetWidth;
		el.classList.add(k);
	}
	function squareFlash(rect) {
		if (reduce) return;
		const fx = document.getElementById("fx");
		if (!fx) return;
		const e = document.createElement("div");
		e.className = "sqflash";
		Object.assign(e.style, {
			left: rect.left + "px",
			top: rect.top + "px",
			width: rect.width + "px",
			height: rect.height + "px"
		});
		fx.prepend(e);
		setTimeout(() => e.remove(), 800);
	}
	let lastFight = null;
	async function animateFight(before, ev) {
		const a = before.pieces.find((x) => x.r === state.last.from[0] && x.c === state.last.from[1]);
		const d = before.pieces.find((x) => x.r === ev.r && x.c === ev.c);
		const ra = rectOf(a.r, a.c), rd = rectOf(ev.r, ev.c);
		if (!ra || !rd) return;
		const tier = fightTier(a, d);
		const sqA = app.querySelector(`.sq[data-r="${a.r}"][data-c="${a.c}"]`), sqD = app.querySelector(`.sq[data-r="${ev.r}"][data-c="${ev.c}"]`);
		const masked = (x) => x.side !== me && !x.revealed;
		const shown = (x) => ev.mirror != null && x.type === "K" ? {
			...x,
			mirror: ev.mirror
		} : x;
		let ca = cloneAt(face(a), ra, a.side === me || a.revealed);
		const cd = cloneAt(face(d), rd, d.side === me || d.revealed);
		for (const sq of [sqA, sqD]) {
			const pz = sq && sq.querySelector(".pz");
			if (pz) pz.style.visibility = "hidden";
		}
		app.querySelectorAll(".sq.can,.sq.sel,.sq.copy").forEach((q) => q.classList.remove("can", "sel", "copy", "fight"));
		for (const sq of [sqA, sqD]) if (sq) sq.classList.add("clash");
		const font = getComputedStyle(sqA).fontSize;
		ca.style.fontSize = cd.style.fontSize = font;
		setConsole(engageHtml(a, d, ev, "meet"));
		const dx = rd.left - ra.left, dy = rd.top - ra.top, len = Math.hypot(dx, dy) || 1, L = len / (Math.abs(dx) / len * ra.width + Math.abs(dy) / len * ra.height);
		const c = {
			ra,
			dx,
			dy,
			len,
			size: ra.width,
			x0: ra.left + ra.width / 2,
			y0: ra.top + ra.height / 2
		};
		const meet = (L - .5) / L, gap = .34 / L;
		const still = d.type === "T" || d.type === "F", aPos = still ? 1 - 2 * gap : meet - gap, dPos = still ? 1 : meet + gap, hit = (aPos + dPos) / 2;
		trace("fight start");
		const ms = reduce ? 1 : Math.min(300, 190 + (L - 1) * 30);
		await Promise.all([
			slide(ca, c, aPos, ms, "cubic-bezier(.5,0,.9,.6)"),
			slide(cd, c, dPos, ms, "cubic-bezier(.5,0,.9,.6)"),
			lift(ca, ms),
			lift(cd, ms)
		]);
		trace("clash");
		sfx.hit();
		if (tier === 2) sfx.big();
		sparks(c, hit);
		if (tier === 2) squareFlash(rd);
		const flips = [];
		if (masked(a) || shown(a) !== a) flips.push(flip(ca, faceHtml(shown(a))));
		if (masked(d) || shown(d) !== d) flips.push(flip(cd, faceHtml(shown(d))));
		setConsole(engageHtml(a, d, ev, "open"));
		await Promise.all([...flips, wait(reduce ? 0 : [
			700,
			740,
			800
		][tier])]);
		trace("resolve");
		engage = engageHtml(a, d, ev, "done");
		setConsole(engage);
		const r = ev.result;
		const aWins = r === "win" || r === "flag" || r === "defuse";
		const take = (el, f) => Promise.all([slide(el, c, f, 200, "ease-in-out"), land(el)]);
		if (aWins) await Promise.all([r === "defuse" ? sink(cd) : knockOff(cd, c, dPos, 1), take(ca, 1)]);
		else if (r === "lose") await Promise.all([knockOff(ca, c, aPos, -1), take(cd, 1)]);
		else if (r === "tie") await Promise.all([knockOff(ca, c, aPos, -1), knockOff(cd, c, dPos, 1)]);
		else if (r === "trapped") {
			sink(cd);
			await slide(ca, c, 1, 200, "ease-in-out");
			const turned = cloneAt({
				...a,
				side: d.side,
				revealed: true
			}, rd, true);
			turned.style.fontSize = font;
			blk(turned).style.transform = LIFT;
			ca.remove();
			ca = turned;
			sparks(c, 1, d.side === "H" ? "#5CC8FF" : "#F5A524");
			await A(blk(ca), [
				{ transform: LIFT },
				{ transform: T(0, 360, .95, 0) },
				{ transform: T(0, 360, 1, 0) }
			], 300);
		} else if (r === "convert") {
			const b = blk(cd);
			b.classList.toggle("h");
			b.classList.toggle("a");
			await Promise.all([take(ca, 0), take(cd, 1)]);
		} else await Promise.all([take(ca, 1), sink(cd)]);
		trace("fight end");
		const you = a.side === me;
		const good = r === "tie" ? null : r === "trapped" ? !you : aWins === you;
		if (good === true) sfx.win();
		else if (good === false) sfx.lose();
		ca.remove();
		cd.remove();
		return /* @__PURE__ */ new Set([String(a.id), String(d.id)]);
	}
	async function afterMove(before) {
		info$1 = null;
		engage = null;
		const events = state.events;
		if (state.winner) {
			phase = "over";
			if (mode === "solo") countSolo();
		}
		const fight = events.find((e) => e.kind === "fight");
		let skip = null;
		if (fight) lastFight = {
			...fight,
			round: before.round
		};
		if (fight && !FAST) {
			busy = true;
			skip = await animateFight(before, fight);
			busy = false;
		} else if (!FAST && state.last && !events.some((e) => e.kind === "copy")) sfx.move();
		render({ skip });
		if (FAST) return;
		if (fight) {
			floatWinner(fight);
			trace("board free, AI may move");
		}
		for (const e of events) {
			if (e.kind === "reveal") sfx.reveal();
			if (e.kind === "rsi") {
				toast("🧠 the self-improver grew");
				sfx.level();
			}
			if (e.kind === "agi") {
				toast("THE AI HAS REACHED AGI", true, "agi");
				sfx.big();
			}
			if (e.kind === "asi") {
				toast(me === "H" ? `SUPERINTELLIGENCE · park ${state.pieces.some(isCTO) ? "your CTO" : BACKUPS()} on 🏢` : "SUPERINTELLIGENCE · keep their CTO off 🏢", true);
				sfx.big();
			}
			if (e.kind === "boost") {
				toast(`🏢 ${e.from} → ${e.to} · fighters 5–6 get +1, once`);
				sfx.level();
			}
			if (e.kind === "drain") {
				if (e.to > 0) {
					toast(`⚡ Power draining: the 🧠 drops to ${e.to}`, e.first, "drain");
					if (e.first) {
						sfx.big();
						bump(document.getElementById("meter"), "jolt");
					} else sfx.level();
				} else {
					toast("⚡ POWER OUT · the 🧠 is at 0, fragile", true, "drain");
					sfx.big();
					bump(document.getElementById("meter"), "jolt");
				}
			}
		}
		if (state.winner) {
			const win = state.winner === me;
			if (state.winner === "D") sfx.level();
			else {
				bump(app.querySelector(".console.end"), win ? "won" : "lost");
				win ? sfx.gameWin() : sfx.gameLose();
			}
		}
	}
	function toast(text, big, extra) {
		const box = document.getElementById("toasts");
		if (!box) return;
		const el = document.createElement("div");
		el.className = "toast" + (big ? " big" : "") + (extra ? " " + extra : "");
		el.textContent = text.replace(/ · /g, "\xA0· ");
		if (params.has("hold")) el.style.setProperty("--hold", "999s");
		box.appendChild(el);
		setTimeout(() => el.remove(), params.has("hold") ? 1e9 : big ? 3800 : 2200);
	}
	function hadFight(s) {
		return s.pieces.length < ARMIES.H.length + ARMIES.AI.length + 2 * BAL.COPIES - s.copies.H - s.copies.AI;
	}
	function lastFightIn(s) {
		for (let i = s.history.length - 1; i >= 0; i--) {
			const h = s.history[i];
			if (h.a && h.d && h.result) return h;
		}
		return null;
	}
	function floatWinner(ev) {
		const sq = app.querySelector(`.sq[data-r="${ev.r}"][data-c="${ev.c}"]`);
		if (!sq) return;
		const m = mid(sq), r = ev.result, el = document.createElement("div");
		const num = (x) => x.type === "K" && ev.mirror != null ? iconOf(x) + ev.mirror : LEVELS_UP(x.type) ? x.str : iconOf(x);
		if (r === "tie") {
			el.className = "float n";
			el.innerHTML = `<span class="${cls(ev.a.side) === "h" ? "b" : "a"}">${num(ev.a)}</span><span class="x">✕</span><span class="${cls(ev.d.side) === "h" ? "b" : "a"}">${num(ev.d)}</span>`;
		} else if (r === "trapped") {
			el.className = "float " + cls(ev.d.side);
			el.textContent = iconOf(ev.d);
		} else {
			const w = r === "lose" ? ev.d : ev.a;
			el.className = "float " + cls(w.side);
			el.textContent = num(w);
		}
		el.style.top = m.y + "px";
		document.body.appendChild(el);
		const half = el.offsetWidth / 2 + 6;
		el.style.left = Math.min(Math.max(m.x, half), innerWidth - half) + "px";
		if (params.has("hold")) {
			el.style.transform = "translate(-50%,-140%)";
			return;
		}
		const ms = reduce ? 900 : 1200;
		el.animate(reduce ? [{ opacity: 1 }, { opacity: 0 }] : [
			{
				transform: "translate(-50%,-30%) scale(.7)",
				opacity: 0
			},
			{
				transform: "translate(-50%,-70%) scale(1.1)",
				opacity: 1,
				offset: .15
			},
			{
				transform: "translate(-50%,-160%) scale(1)",
				opacity: 1,
				offset: .6
			},
			{
				transform: "translate(-50%,-220%) scale(1)",
				opacity: 0
			}
		], {
			duration: ms,
			easing: "ease-out",
			fill: "forwards"
		});
		setTimeout(() => el.remove(), ms + 50);
	}
	function showLog() {
		const ov = document.createElement("div");
		ov.className = "overlay logov";
		ov.id = "logov";
		ov.innerHTML = `<div class="card"><div class="eyebrow">Log · the last 40 · newest first</div><div class="lgs">${state.history.slice().reverse().map((h) => `<div class="${h.mile ? "mile" : ""}"><i>R${h.round}</i><span>${color(logText(h))}</span></div>`).join("") || "<div><i></i><span>Nothing yet.</span></div>"}</div><button class="primary" id="logclose">CLOSE</button></div>`;
		document.body.appendChild(ov);
		const close = () => ov.remove();
		ov.addEventListener("click", (e) => {
			if (e.target === ov || e.target.id === "logclose") close();
		});
	}
	const SERVER = (params.get("server") || "https://kill-switch.franknowinski.workers.dev").replace(/\/+$/, "");
	setServer(SERVER);
	const goHome = () => {
		phase = "intro";
		render();
	};
	const screens = accountScreens({
		app,
		sfx,
		home: goHome,
		stats: () => openStats(),
		friends: () => openFriends("profile"),
		friend: (handle) => {
			phase = "friends";
			friendScr.openFriend(handle, "profile");
		}
	});
	const friendScr = friendScreens({
		app,
		sfx,
		home: goHome,
		profile: openProfile,
		expired: openProfile,
		play: (code, token) => {
			rememberGame(code, {
				token,
				seat: "host"
			});
			openGame(code);
		}
	});
	const LIVE = {
		code: null,
		token: null,
		seat: null,
		host: false,
		hostSide: "H",
		guestIn: false,
		online: {
			host: false,
			guest: false
		},
		ready: {
			H: false,
			AI: false
		},
		note: null,
		fail: null,
		full: false,
		ws: null,
		opened: false,
		tries: 0,
		retryT: null,
		beatT: null,
		heard: 0,
		moveSeq: -1,
		chain: Promise.resolve()
	};
	const queue = (fn) => {
		LIVE.chain = LIVE.chain.then(fn).catch((e) => {
			console.error(e);
			busy = false;
		});
	};
	const liveYou = () => LIVE.host ? LIVE.hostSide : other(LIVE.hostSide);
	const SIDE_NAME = {
		H: "the Humans",
		AI: "the AI"
	};
	const serverParam = () => params.get("server") ? "&server=" + encodeURIComponent(params.get("server")) : "";
	const inApp = () => {
		const C = window.Capacitor;
		return !!(C && typeof C.isNativePlatform === "function" && C.isNativePlatform());
	};
	function inviteLink() {
		return (/^https?:$/.test(location.protocol) && !/claude/.test(location.hostname) && !inApp() ? location.href.split("#")[0].split("?")[0] : PUBLIC_URL) + "?g=" + LIVE.code + serverParam();
	}
	async function api(path, opts = {}) {
		const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8e3);
		const headers = opts.body ? { "Content-Type": "application/json" } : {};
		const a = opts.auth && current();
		if (a && !a.expired) headers.Authorization = "Bearer " + a.session;
		try {
			const res = await fetch(SERVER + path, {
				method: opts.method,
				body: opts.body,
				signal: ctl.signal,
				headers
			});
			return {
				status: res.status,
				body: await res.json().catch(() => ({}))
			};
		} catch (e) {
			return null;
		} finally {
			clearTimeout(t);
		}
	}
	function send(m) {
		try {
			if (LIVE.ws && LIVE.ws.readyState === 1) {
				LIVE.ws.send(JSON.stringify(m));
				return true;
			}
		} catch (e) {}
		return false;
	}
	function closeSocket() {
		clearTimeout(LIVE.retryT);
		clearInterval(LIVE.beatT);
		LIVE.beatT = null;
		const ws = LIVE.ws;
		LIVE.ws = null;
		if (ws) {
			ws.onclose = ws.onmessage = ws.onopen = null;
			try {
				ws.close();
			} catch (e) {}
		}
	}
	function leaveLive() {
		closeSocket();
		LIVE.chain = Promise.resolve();
		Object.assign(LIVE, {
			code: null,
			token: null,
			seat: null,
			note: null,
			fail: null,
			full: false,
			tries: 0
		});
		mode = "solo";
		history.replaceState(null, "", location.pathname + (params.get("server") ? "?server=" + encodeURIComponent(params.get("server")) : ""));
	}
	function liveFail(text, full) {
		closeSocket();
		LIVE.fail = text;
		LIVE.full = !!full;
		mode = "live";
		phase = "lobby";
		render();
	}
	async function createLive() {
		leaveLive();
		mode = "live";
		phase = "joining";
		LIVE.note = "Making a game…";
		render();
		const r = await api("/games", {
			method: "POST",
			auth: true
		});
		if (!r || r.status !== 200 || !CODE_OK.test(r.body.code || "")) return liveFail("Couldn't reach the game server. Check the internet and try again.");
		rememberGame(r.body.code, {
			token: r.body.token,
			seat: "host"
		});
		openGame(r.body.code);
	}
	async function openGame(raw) {
		const code = String(raw || "").trim().toUpperCase();
		closeSocket();
		Object.assign(LIVE, {
			code,
			token: null,
			fail: null,
			full: false,
			note: null,
			tries: 0,
			opened: false,
			ready: {
				H: false,
				AI: false
			}
		});
		mode = "live";
		phase = "joining";
		state = null;
		lastFight = null;
		engage = null;
		brainSeen = null;
		keyPick = null;
		sel = null;
		info$1 = null;
		render();
		if (!CODE_OK.test(code)) return liveFail(`"${code}" isn't a game code. Codes are 4 letters and numbers.`);
		history.replaceState(null, "", location.pathname + "?g=" + code + serverParam());
		let mine = myGames().find((x) => x.code === code);
		if (!mine) {
			const r = await api(`/games/${code}/join`, {
				method: "POST",
				body: "{}",
				auth: true
			});
			if (LIVE.code !== code) return;
			if (!r) return liveFail("Couldn't reach the game server. Check the internet and try again.");
			if (r.status === 409) return liveFail("This game is full.", true);
			if (r.status !== 200) return liveFail(`There's no game ${code}. Check the code.`);
			rememberGame(code, {
				token: r.body.token,
				seat: r.body.seat
			});
			mine = myGames().find((x) => x.code === code) || { token: r.body.token };
		}
		LIVE.token = mine.token;
		LIVE.moveSeq = Number.isInteger(mine.moveSeq) ? mine.moveSeq : -1;
		connect();
	}
	function connect() {
		clearTimeout(LIVE.retryT);
		if (!LIVE.code || !LIVE.token || LIVE.ws || LIVE.fail) return;
		let ws;
		try {
			ws = new WebSocket(SERVER.replace(/^http/, "ws") + `/games/${LIVE.code}/ws?token=${LIVE.token}`);
		} catch (e) {
			return lost(false);
		}
		LIVE.ws = ws;
		let opened = false;
		const openT = setTimeout(() => {
			if (!opened && LIVE.ws === ws) {
				LIVE.ws = null;
				ws.onclose = null;
				try {
					ws.close();
				} catch (e) {}
				lost(false);
			}
		}, 9e3);
		ws.onopen = () => {
			opened = true;
			LIVE.opened = true;
			clearTimeout(openT);
			LIVE.tries = 0;
			LIVE.heard = Date.now();
			send({
				t: "hello",
				moveSeq: LIVE.moveSeq
			});
			clearInterval(LIVE.beatT);
			LIVE.beatT = setInterval(() => {
				if (LIVE.ws !== ws) return clearInterval(LIVE.beatT);
				if (Date.now() - LIVE.heard > 25e3) {
					LIVE.ws = null;
					ws.onclose = null;
					try {
						ws.close();
					} catch (e) {}
					return lost(true);
				}
				try {
					ws.send("ping");
				} catch (e) {}
				if (phase === "over") send({
					t: "hello",
					moveSeq: LIVE.moveSeq
				});
			}, 1e4);
		};
		ws.onmessage = (e) => {
			if (LIVE.ws !== ws) return;
			LIVE.heard = Date.now();
			if (e.data === "pong") return;
			let m;
			try {
				m = JSON.parse(e.data);
			} catch (x) {
				return;
			}
			onServer(m);
		};
		ws.onclose = (ev) => {
			clearTimeout(openT);
			if (LIVE.ws !== ws) return;
			LIVE.ws = null;
			clearInterval(LIVE.beatT);
			if (ev.code === 4004) {
				forgetGame(LIVE.code);
				return liveFail("This game was deleted after 30 days with no moves.");
			}
			if (ev.code === 4005) {
				const who = LIVE.challenge && LIVE.challenge.handle;
				forgetGame(LIVE.code);
				LIVE.code = null;
				return liveFail(who ? `@${who} declined the challenge, or it ran out after 7 days. Nothing counts.` : "This challenge was declined, or it ran out after 7 days. Nothing counts.");
			}
			lost(opened);
		};
	}
	async function lost(wasOpen) {
		if (!LIVE.code || LIVE.fail) return;
		LIVE.tries++;
		if (!wasOpen && LIVE.tries >= 2) {
			const r = await api(`/games/${LIVE.code}?token=${LIVE.token}`);
			if (!LIVE.code || LIVE.fail || LIVE.ws) return;
			if (r && r.status === 404) {
				forgetGame(LIVE.code);
				return liveFail(`There's no game ${LIVE.code} any more.`);
			}
			if (r && r.status === 403) {
				forgetGame(LIVE.code);
				return liveFail("This phone isn't a player in that game any more.");
			}
		}
		LIVE.note = LIVE.tries > 5 ? "Can't reach the game server. Reconnecting…" : "Reconnecting…";
		render();
		const wait = Math.min(1e4, 400 * 2 ** Math.min(LIVE.tries, 6)) * (.8 + Math.random() * .4);
		clearTimeout(LIVE.retryT);
		LIVE.retryT = setTimeout(connect, LIVE.tries === 1 ? 150 : wait);
	}
	function resume() {
		if (mode !== "live" || !LIVE.code || LIVE.fail || document.visibilityState === "hidden") return;
		if (LIVE.ws && LIVE.ws.readyState === 1) {
			LIVE.heard = Date.now();
			send({
				t: "hello",
				moveSeq: LIVE.moveSeq
			});
		} else if (!LIVE.ws) {
			LIVE.tries = 0;
			connect();
		}
	}
	document.addEventListener("visibilitychange", resume);
	window.addEventListener("pageshow", resume);
	window.addEventListener("online", resume);
	function onServer(m) {
		if (m.t === "error") {
			info$1 = "That didn't go through. Here is the game as it is.";
			return;
		}
		if (m.t !== "sync" && m.t !== "turn") return;
		queue(() => {
			const moved = m.t === "turn" && m.before && m.moveSeq !== LIVE.moveSeq;
			const friend = m.seat === "host" ? "guest" : "host";
			if (m.t === "sync" && phase === "over" && m.phase === "over" && state && m.moveSeq === LIVE.moveSeq && !!(m.online || {})[friend] === !!LIVE.online[friend]) return;
			Object.assign(LIVE, {
				seat: m.seat,
				host: m.seat === "host",
				hostSide: m.hostSide,
				guestIn: m.guestIn,
				online: m.online || {},
				ready: m.ready,
				note: null,
				fail: null,
				moveSeq: m.moveSeq,
				challenge: m.challenge || null
			});
			me = m.you;
			document.body.classList.toggle("me-ai", me === "AI");
			rememberGame(LIVE.code, {
				token: LIVE.token,
				seat: m.seat,
				moveSeq: m.moveSeq,
				seenOver: m.phase === "over"
			});
			if (m.phase === "over" && m.s && m.s.winner) countFriend(m);
			busy = false;
			lastFight = m.lastFight ? {
				...m.lastFight,
				round: m.lastFight.round || (m.s && lastFightIn(m.s) || {}).round
			} : null;
			if (m.t === "sync") engage = null;
			if (m.phase === "lobby" || !m.s) {
				phase = "lobby";
				state = null;
				lastFight = null;
				sel = null;
				return render();
			}
			if (phase !== m.phase || !state) {
				sel = null;
				dcPick = false;
				info$1 = null;
				if (m.phase === "setup") keyPick = null;
			}
			if (moved) {
				sel = null;
				copyMode = false;
				info$1 = null;
				LIVE.played = (LIVE.played || 0) + 1;
				state = m.before;
				phase = "play";
				render();
				state = m.s;
				return afterMove(m.before);
			}
			if (phase === "setup" && m.phase === "setup" && state && !LIVE.ready[me]) {
				for (const p of m.s.pieces) {
					const mine = p.side === me && state.pieces.find((x) => x.id === p.id);
					if (mine) {
						p.r = mine.r;
						p.c = mine.c;
					}
				}
				if (me === "H" && state.dc) m.s.dc = state.dc;
				m.s.forms = {
					...m.s.forms,
					[me]: state.forms[me]
				};
			}
			state = m.s;
			phase = m.phase;
			reselect();
			render();
		});
	}
	function reselect() {
		if (!sel) return;
		const p = state.pieces.find((x) => x.id === sel.id && x.side === me && x.r >= 0);
		const open = phase === "setup" ? !LIVE.ready[me] : phase === "play" && state.turn === me;
		if (p && open) {
			sel = p;
			return;
		}
		sel = null;
		copyMode = false;
		if (phase === "play") info$1 = null;
	}
	function renderLobby() {
		const you = liveYou(), dot = (on) => `<i class="dot ${on ? "yes" : ""}" title="${on ? "here" : "away"}"></i>`;
		const sideRow = (side, who, here) => `<div class="rule"><div class="k">${icon(side, side === "H" ? "🕵️" : "🧠")}</div><div><b>${who}</b> ${who === "You" ? "play" : "plays"} ${here == null ? SIDE_NAME[side] : `<span class="nw">${SIDE_NAME[side]} ${dot(here)}</span>`}</div></div>`;
		const friend = LIVE.host ? "guest" : "host";
		let body;
		if (LIVE.fail) body = `<div class="eyebrow">Play a friend</div><h1>${LIVE.full ? "GAME FULL" : "NO GAME"}</h1><p>${LIVE.fail}</p>${LIVE.full || !LIVE.code ? "" : `<button class="primary" id="lvretry">TRY AGAIN</button>`}<button class="ghost" id="lvleave">BACK</button>`;
		else if (phase === "joining") body = `<div class="eyebrow">Play a friend${LIVE.code ? " · " + LIVE.code : ""}</div><h1>${LIVE.opened ? "RECONNECTING" : "CONNECTING"}<span class="dots"><i>.</i><i>.</i><i>.</i></span></h1><p>${LIVE.note || "Reaching the game server."}</p><button class="ghost" id="lvleave">BACK</button>`;
		else if (!LIVE.guestIn && LIVE.challenge) body = `<div class="eyebrow">Challenge · ${LIVE.code}</div><h1 id="chsent">CHALLENGE SENT</h1>
      <p>Waiting for <b>@${esc(LIVE.challenge.handle)}</b> to accept. It's in their My games now; unanswered, it goes in ${daysLeft(LIVE.challenge.expires)}.</p>
      <div class="panel">${sideRow(you, "You")}</div>${LIVE.note ? `<p class="lvnote">${LIVE.note}</p>` : ""}<div class="row2"><button class="ghost" id="lvswap">SWITCH SIDES</button><button class="ghost" id="lvleave">BACK</button></div>`;
		else if (!LIVE.guestIn) body = `<div class="eyebrow">Play a friend · invite</div><p class="codebig" id="code">${[...LIVE.code].map((ch) => `<span>${ch}</span>`).join("")}</p>
      <p>Send your friend the link, or they tap JOIN CODE and type <b>${LIVE.code}</b>.</p>
      <div class="row2"><button class="primary" id="lvshare">SHARE</button><button class="ghost" id="lvcopy">COPY</button></div>
      <div class="panel">${sideRow(you, "You")}</div>${LIVE.note ? `<p class="lvnote">${LIVE.note}</p>` : ""}<div class="row2"><button class="ghost" id="lvswap">SWITCH SIDES</button><button class="ghost" id="lvleave">BACK</button></div>`;
		else body = `<div class="eyebrow">Play a friend · ${LIVE.code}</div><h1>${LIVE.host ? "YOUR FRIEND IS IN" : "YOU'RE IN"}</h1>
      <div class="panel">${sideRow(you, "You")}${sideRow(other(you), LIVE.host ? "Your friend" : "The host", !!LIVE.online[friend])}</div>
      <button class="ghost" id="lvswap">SWITCH SIDES</button>
      ${LIVE.host ? `<button class="primary" id="lvstart">START</button>` : `<p class="eyebrow" id="lvwait">Waiting for the host to start<span class="dots"><i>.</i><i>.</i><i>.</i></span></p>`}
      ${LIVE.note ? `<p class="lvnote">${LIVE.note}</p>` : ""}<button class="ghost" id="lvleave">BACK</button>`;
		app.innerHTML = `<div class="overlay"><div class="card lobby">${body}</div></div>`;
		const on = (id, fn) => {
			const el = document.getElementById(id);
			if (el) el.addEventListener("click", fn);
		};
		on("lvshare", async () => {
			sfx.tap();
			const url = inviteLink();
			try {
				if (navigator.share) await navigator.share({
					title: "Kill Switch",
					text: `Play Kill Switch with me. Code ${LIVE.code}`,
					url
				});
				else {
					await navigator.clipboard.writeText(url);
					toastLobby("Link copied");
				}
			} catch (e) {}
		});
		on("lvcopy", async () => {
			sfx.tap();
			try {
				await navigator.clipboard.writeText(inviteLink());
				toastLobby("Link copied");
			} catch (e) {
				toastLobby(inviteLink());
			}
		});
		on("lvswap", () => {
			sfx.tap();
			if (!send({ t: "swap" })) toastLobby("Not connected. Reconnecting…");
		});
		on("lvstart", () => {
			sfx.win();
			if (!send({
				t: "start",
				hostSide: LIVE.hostSide
			})) toastLobby("Not connected. Reconnecting…");
		});
		on("lvleave", () => {
			sfx.tap();
			leaveLive();
			phase = "intro";
			render();
		});
		on("lvretry", () => {
			sfx.tap();
			const code = LIVE.code;
			LIVE.fail = null;
			openGame(code);
		});
	}
	function toastLobby(text) {
		const c = app.querySelector(".card");
		if (!c) return;
		const p = document.createElement("p");
		p.className = "eyebrow";
		p.textContent = text;
		c.appendChild(p);
		setTimeout(() => p.remove(), 1600);
	}
	const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	})[c]);
	const daysLeft = (exp) => {
		const d = Math.ceil((exp - Date.now()) / 864e5);
		return d <= 1 ? "a day" : d + " days";
	};
	const statusText = (s) => {
		const side = s.you === "H" ? "Humans" : "AI";
		return s.phase === "over" ? `<b>game over</b> · ${s.winner === s.you ? "you won" : s.winner === "D" ? "a draw" : "you lost"}` : s.phase === "lobby" ? s.guestIn ? "in the lobby" : s.challenge ? `waiting for @${esc(s.challenge.handle)}` : "waiting for your friend" : s.phase === "setup" ? s.ready[s.you] ? "waiting for their setup" : `<b>set up</b> · ${side}` : s.yourTurn ? `<b>your move</b> · ${side}` : `their move · ${side}`;
	};
	const gameRow = (code) => `<div class="grow" id="gr-${code}"><button class="game" data-code="${code}"><span class="gc">${code}</span><span class="gs" id="gs-${code}">…</span></button><button class="gx" id="gx-${code}" aria-label="Remove game ${code}">✕</button></div>`;
	function renderMyGames() {
		const box = document.getElementById("mygames");
		if (!box) return;
		const list = myGames();
		const tidy = () => {
			box.hidden = !box.querySelector(".game");
		};
		const wireRows = (el) => el.querySelectorAll("button.game").forEach((b) => b.addEventListener("click", () => {
			sfx.tap();
			openGame(b.dataset.code);
		}));
		box.innerHTML = `<div class="eyebrow" id="mg-title">My games</div><div class="games" id="mg-chal"></div>` + list.map((g) => gameRow(g.code)).join("") + `<div class="games" id="mg-more"></div>`;
		tidy();
		wireRows(box);
		const over = /* @__PURE__ */ new Set(), linked = /* @__PURE__ */ new Set(), drop = (code) => {
			forgetGame(code);
			hideGame(code);
			const r = document.getElementById("gr-" + code);
			if (r) r.remove();
			tidy();
		};
		const wireX = (code) => document.getElementById("gx-" + code).addEventListener("click", () => {
			sfx.tap();
			if (over.has(code)) return drop(code);
			const row = document.getElementById("gr-" + code), was = row.innerHTML;
			row.innerHTML = `<div class="game gq"><span>Remove <b>${code}</b>? ${linked.has(code) ? `It stays on your account: join it again with code ${code}.` : "This phone can't get back into it."}</span><span class="row2"><button class="ghost" id="gy-${code}">REMOVE</button><button class="ghost" id="gn-${code}">KEEP</button></span></div>`;
			document.getElementById("gy-" + code).addEventListener("click", () => {
				sfx.tap();
				drop(code);
			});
			document.getElementById("gn-" + code).addEventListener("click", () => {
				sfx.tap();
				row.innerHTML = was;
				wireRows(row);
				wireX(code);
			});
		});
		for (const g of list) wireX(g.code);
		for (const g of list) api(`/games/${g.code}?token=${g.token}`).then((r) => {
			const el = document.getElementById("gs-" + g.code);
			if (!el) return;
			if (r && (r.status === 404 || r.status === 403 || r.status === 200 && r.body.phase === "over" && g.seenOver)) {
				forgetGame(g.code);
				const b = el.closest(".grow");
				if (b) b.remove();
				tidy();
				return;
			}
			if (!r || r.status !== 200) {
				el.textContent = "offline";
				return;
			}
			if (r.body.phase === "over") over.add(g.code);
			el.innerHTML = statusText(r.body);
		});
		const a = current();
		if (!a || a.expired || !a.user.handle) return;
		friendsApi.rooms().then((d) => {
			if (!box.isConnected || d.error) return;
			const chal = document.getElementById("mg-chal"), more = document.getElementById("mg-more");
			chal.innerHTML = d.incoming.map((c) => `<div class="game chal" id="ch-${c.code}"><div class="ch-who"><span class="fr-av">${esc(c.from.avatar)}</span><span><b>@${esc(c.from.handle)}</b> challenged you</span></div>
        <div class="ch-sub">You play ${c.you === "H" ? "🕵️ Humans" : "🧠 the AI"} · ${daysLeft(c.expires)} to answer</div>
        <div class="row2"><button class="ghost" id="acc-${c.code}">ACCEPT</button><button class="ghost" id="dec-${c.code}">DECLINE</button></div></div>`).join("");
			const badge = () => {
				const n = chal.querySelectorAll(".chal").length;
				document.getElementById("mg-title").innerHTML = "My games" + (n ? ` · <b class="badge" id="mg-badge">${n} challenge${n > 1 ? "s" : ""}</b>` : "");
			};
			for (const c of d.incoming) {
				document.getElementById("acc-" + c.code).addEventListener("click", () => {
					sfx.win();
					openGame(c.code);
				});
				document.getElementById("dec-" + c.code).addEventListener("click", async (e) => {
					sfx.tap();
					e.target.disabled = true;
					const r = await friendsApi.decline(c.code);
					if (r.error === "accepted") return renderMyGames();
					if (r.error && r.error !== "not found") {
						e.target.disabled = false;
						e.target.textContent = r.error === "offline" ? "OFFLINE" : "DECLINE";
						return;
					}
					const row = document.getElementById("ch-" + c.code);
					if (row) row.remove();
					badge();
					tidy();
				});
			}
			for (const s of d.rooms) linked.add(s.code);
			const here = new Set(myGames().map((g) => g.code)), gone = hiddenGames(), extra = d.rooms.filter((s) => !here.has(s.code) && !gone.has(s.code));
			more.innerHTML = extra.map((s) => gameRow(s.code)).join("");
			for (const s of extra) wireX(s.code);
			for (const s of extra) document.getElementById("gs-" + s.code).innerHTML = statusText(s);
			wireRows(more);
			badge();
			tidy();
		});
	}
	if (params.has("trace")) window.__ksRender = () => render();
	if (params.has("trace")) window.__ksAuto = () => {
		if (mode !== "solo" || phase !== "play" || busy || !state || state.winner || state.turn !== me) return false;
		const m = botMove(state, me, bot);
		if (m) play(m);
		return !!m;
	};
	Object.assign(window, {
		newGame,
		botSetup,
		rng,
		legalMoves,
		botMove,
		apply,
		BLOCKED: BLOCKED$1,
		SETUP_ROWS
	});
	window.ksScreen = () => phase;
	window.ksHome = () => {
		if (phase === "intro") return;
		dropDrag();
		if (mode === "live") leaveLive();
		counts = false;
		dcPick = false;
		phase = "intro";
		render();
	};
	if (params.has("trace")) window.__ks = () => ({
		state,
		me,
		phase,
		busy,
		sel,
		mode,
		ready: LIVE.ready,
		hostSide: LIVE.hostSide,
		host: LIVE.host,
		code: LIVE.code,
		ws: !!LIVE.ws,
		online: LIVE.online,
		note: LIVE.note,
		moveSeq: LIVE.moveSeq,
		played: LIVE.played || 0
	});
	function botTurn() {
		if (mode !== "solo" || phase !== "play" || state.turn === me || state.winner) return;
		const m = levelMove(state, other(me), bot);
		if (!m) return afterMove(state);
		const before = state;
		state = apply(state, m);
		afterMove(before);
	}
	const either = () => state.turn === me ? botMove : levelMove;
	if (params.has("over")) {
		start();
		phase = "play";
		while (!state.winner) {
			const m = either()(state, state.turn, bot);
			if (!m) break;
			state = apply(state, m);
		}
		phase = "over";
		render();
	} else if (params.has("battle") || params.has("until")) {
		const want = params.get("until") || "fight";
		start("solo", params.get("side") === "AI" ? "AI" : "H");
		phase = "play";
		counts = false;
		let n = 0, before = state;
		while (!state.winner && n++ < 400) {
			const m = either()(state, state.turn, bot);
			if (!m) break;
			before = state;
			state = apply(state, m);
			if (state.events.some((e) => e.kind === want || e.result === want)) break;
		}
		const after = state;
		state = before;
		render();
		state = after;
		afterMove(before);
	} else if (params.has("play")) start("solo", params.get("side") === "AI" ? "AI" : "H");
	else if (params.has("g")) openGame(params.get("g"));
	else if (params.has("stats")) openStats(params.get("stats") === "friends" ? "friends" : "solo");
	else if (params.has("profile")) {
		screens.open();
		phase = "account";
		render();
	} else render();
	{
		const was = JSON.stringify(info());
		refreshInfo().then((i) => {
			if (JSON.stringify(i) === was) return;
			if (phase === "intro") paintAcct();
			else if (phase === "account" && screens.view === "signin") render();
		});
	}
	if (signedIn()) sync().then(() => {
		if (phase === "intro") paintAcct();
	});
	window.addEventListener("online", () => {
		flush();
	});
}
