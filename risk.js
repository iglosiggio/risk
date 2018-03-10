const risk = document.getElementById("risk");
const ctx = risk.getContext("2d");

const NUM_TILES = 64;
const NUM_SPRITES = 32;
const NUM_PALETTES = 4;

/* Tiles are 8x8px, 1 bit depth
                  Pixels | Bits per byte */
const TILE_SIZE = 8 * 8  / 8;

/* Sprites have     TILE_ID| PAL_ID |    X   |    Y
                    6 bits | 2 bits | 1 byte | 1 byte */
const SPRITE_SIZE = 0.75   + 0.25   + 1      + 1;
/* (0, 0) on the screen is (64, 64) */
/* (127, 127) on the screen is (191, 191) */

/* The canvas is  8x8  |  TILE_ID | PALETTE_ID */
const MAP_SIZE = (8*8) * (0.8     +    0.2);

/* Two 8 bit colors */
const PALETTE_SIZE = 2;

const mem = new ArrayBuffer( TILE_SIZE    * NUM_TILES
                           + SPRITE_SIZE  * NUM_SPRITES
                           + PALETTE_SIZE * NUM_PALETTES
                           + MAP_SIZE);

let start = 0;
const tilemem    = mem.slice(start, start += TILE_SIZE    * NUM_TILES);
const spritemem  = mem.slice(start, start += SPRITE_SIZE  * NUM_SPRITES);
const palettemem = mem.slice(start, start += PALETTE_SIZE * NUM_PALETTES);
const mapmem     = mem.slice(start, start += MAP_SIZE);

const tiles = new Uint8Array(tilemem);
const palettes = new Uint16Array(palettemem);

/* hardcoded palettes for now */
palettes[0] = 0xFF00;
palettes[1] = 0xAA22;
palettes[2] = 0x15A5;
palettes[3] = 0x6418;

tiles[0] = 0b11111111;
tiles[1] = 0b10011001;
tiles[2] = 0b10011001;
tiles[3] = 0b11111111;
tiles[4] = 0b11111111;
tiles[5] = 0b10011001;
tiles[6] = 0b10011001;
tiles[7] = 0b11111111;

tiles[8]  = 0b00001000;
tiles[9]  = 0b00001100;
tiles[10] = 0b00001110;
tiles[11] = 0b11111111;
tiles[12] = 0b11111111;
tiles[13] = 0b00001110;
tiles[14] = 0b00001100;
tiles[15] = 0b00001000;

/* Letters */
/* a */
tiles[16] = 0b00000000;
tiles[17] = 0b00000000;
tiles[18] = 0b00111000;
tiles[19] = 0b00000100;
tiles[20] = 0b00111100;
tiles[21] = 0b01000100;
tiles[22] = 0b00111100;
tiles[23] = 0b00000000;
/* B */
tiles[24] = 0b00000000;
tiles[25] = 0b01000000;
tiles[26] = 0b01000000;
tiles[27] = 0b01111100;
tiles[28] = 0b01000010;
tiles[29] = 0b01000010;
tiles[30] = 0b01111100;
tiles[31] = 0b00000000;
/* M */
tiles[32] = 0b00000000;
tiles[33] = 0b00000000;
tiles[34] = 0b01111000;
tiles[35] = 0b01010100;
tiles[36] = 0b01010100;
tiles[37] = 0b01010100;
tiles[38] = 0b01010100;
tiles[39] = 0b00000000;
/* E */
tiles[40] = 0b00000000;
tiles[41] = 0b00000000;
tiles[42] = 0b00111000;
tiles[43] = 0b01000100;
tiles[44] = 0b01111100;
tiles[45] = 0b01000000;
tiles[46] = 0b00111000;
tiles[47] = 0b00000000;
/* G */
tiles[48] = 0b00000000;
tiles[49] = 0b00000000;
tiles[50] = 0b00111000;
tiles[51] = 0b01000000;
tiles[52] = 0b01011100;
tiles[53] = 0b01000100;
tiles[54] = 0b00111000;
tiles[55] = 0b00000000;

function get_image(tile_id, palette_id) {
	if (tile_id    > NUM_TILES    || tile_id    < 0) throw new Error("Tile id out of range");
	if (palette_id > NUM_PALETTES || palette_id < 0) throw new Error("Palette id out of range");

	const img = ctx.createImageData(8, 8);
	const data = img.data;
	const palette = palettes[palette_id];

	for (let y = 0; y < 8; y++)
	for (let x = 0; x < 8; x++) {
		let pixel = tiles[tile_id * TILE_SIZE + y] >> (7 - x) & 0x1;
		let color = palette >> (pixel * 8) & 0xFF
		/* pix_fmt = RGB332 */
		data[(y * 8 + x) * 4 + 0] = ((color >> 5) & 0x7) << 5 /*   red */
		data[(y * 8 + x) * 4 + 1] = ((color >> 2) & 0x7) << 5 /* green */
		data[(y * 8 + x) * 4 + 2] = ((color >> 0) & 0x3) << 6 /*  blue */
		data[(y * 8 + x) * 4 + 3] = 0xFF;
	}
	return img;
}

function draw() {
	for (let i = 0; i < 128; i += 8)
	for (let j = 0; j < 128; j += 8)
		ctx.putImageData(get_image(j / 8 % 3, i / 8 % 4), i, j);

	ctx.putImageData(get_image(4,1), 8*4, 8*5);
	ctx.putImageData(get_image(5,1), 8*5, 8*5);
	ctx.putImageData(get_image(6,1), 8*6, 8*5);
	ctx.putImageData(get_image(2,1), 8*7, 8*5);
}

setInterval(function () {
	palettes[0] = Math.floor(Math.random() * (1 << 16));
	draw();
}, 532);
setInterval(function () {
	palettes[1] = Math.floor(Math.random() * (1 << 16));
	draw();
}, 1333);
setInterval(function () {
	palettes[2] = Math.floor(Math.random() * (1 << 16));
	draw();
}, 167);
setInterval(function () {
	palettes[3] = Math.floor(Math.random() * (1 << 16));
	draw();
}, 269);



draw();
