const risk = document.getElementById("risk");
const ctx = risk.getContext("2d");

/*****************
 * MEMORY BLOCKS *
 *****************/

const NUM_TILES = 128;
const NUM_SPRITES = 32;
const NUM_PALETTES = 32;

/* Tiles are 8x8px, 1 bit depth
                  Pixels | Bits per byte */
const TILE_SIZE = 8 * 8  / 8;

/* Sprites have     TILE_ID | PAL_ID + ALPHA |    X   |    Y
                    7 bits  | 5 bits + 2 bits| 1 byte | 1 byte */
const SPRITE_SIZE = 1       + 1              + 1      + 1;
/* (0, 0) on the screen is (64, 64) */
/* (127, 127) on the screen is (191, 191) */

/* Only the first half of the sprites are available
 * for the screen (and four palettes)
   The canvas is  16x16  |  TILE_ID | PALETTE_ID
                         |  6 bits  | 2 bits */
const MAP_SIZE = (16*16) * (0.75    + 0.25);

/* Two 8 bit colors */
const PALETTE_SIZE = 2;

const mem = new ArrayBuffer( TILE_SIZE    * NUM_TILES
                           + SPRITE_SIZE  * NUM_SPRITES
                           + PALETTE_SIZE * NUM_PALETTES
                           + MAP_SIZE);

let start = 0;
const tiles    = new  Uint8Array(mem, 0,                           TILE_SIZE *  NUM_TILES);
const sprites  = new Uint32Array(mem, TILE_SIZE    * NUM_TILES,    NUM_SPRITES);
const palettes = new Uint16Array(mem, TILE_SIZE    * NUM_TILES
                                    + SPRITE_SIZE  * NUM_SPRITES,  NUM_PALETTES);
const map      = new  Uint8Array(mem, TILE_SIZE    * NUM_TILES
                                    + SPRITE_SIZE  * NUM_SPRITES
                                    + PALETTE_SIZE * NUM_PALETTES, 16 * 16);

/***********
 * DRAWING *
 ***********/

/* Create framebuffer */
const buffer = ctx.createImageData(128, 128);
/* Fill the alpha values*/
for (let i = 3; i < 128 * 128 * 4; i += 4) buffer.data[i] = 0xFF;

function draw() {
	draw_map();
	draw_sprites();
	ctx.putImageData(buffer, 0, 0);
}

function draw_map() {
	const data = buffer.data;
	for (let ymap = 0; ymap < 16; ymap++)
	for (let xmap = 0; xmap < 16; xmap++) {
		let palette = palettes[map[ymap * 16 + xmap] & 0x3];
		let tile_id = map[ymap * 16 + xmap] >> 2;
		for (let y    = 0; y    < 8; y++)
		for (let x    = 0; x    < 8; x++) {
			let pixel = tiles[tile_id * TILE_SIZE + y] >> (7 - x) & 0x1;
			let color = palette >> (pixel * 8) & 0xFF
			/* pix_fmt = RGB332 */
			data[((y + ymap * 8) * 128 + x + xmap * 8) * 4 + 0] = ((color >> 5) & 0x7) << 5 /*   red */
			data[((y + ymap * 8) * 128 + x + xmap * 8) * 4 + 1] = ((color >> 2) & 0x7) << 5 /* green */
			data[((y + ymap * 8) * 128 + x + xmap * 8) * 4 + 2] = ((color >> 0) & 0x3) << 6 /*  blue */
		}
	}
}

function draw_sprites() {
	const data = buffer.data;
	for (let id = 0; id < NUM_SPRITES; id++) {
		let sprite = sprites[id];
		if ((sprite >> 16 & 0x3) === 0x3) continue;
		/* Draw sprite */
		let tile_id    = sprite >> 24;
		let palette_id = sprite >> 18 & 0x1F;
		let alpha      = sprite >> 16 & 0x3;
		let xpos       = sprite >> 8 & 0xFF;
		let ypos       = sprite & 0xFF;
		let palette    = palettes[palette_id];

		for (let y = 0; y < 8; y++)
		for (let x = 0; x < 8; x++) {
			let pixel = tiles[tile_id * TILE_SIZE + y] >> (7 - x) & 0x1;
			if ((1 << pixel) & alpha) continue;
			let color = palette >> (pixel * 8) & 0xFF
			/* pix_fmt = RGB332 */
			data[((y + ypos) * 128 + x + xpos) * 4 + 0] = ((color >> 5) & 0x7) << 5 /*   red */
			data[((y + ypos) * 128 + x + xpos) * 4 + 1] = ((color >> 2) & 0x7) << 5 /* green */
			data[((y + ypos) * 128 + x + xpos) * 4 + 2] = ((color >> 0) & 0x3) << 6 /*  blue */
			data[((y + ypos) * 128 + x + xpos) * 4 + 3] = 0xFF;
		}
	}
}

/* RISK MANAGEMENT */
function set_map(tile_id, palette_id, x, y) {
	map[y << 4 | x & 0xF] = (tile_id & 0x3F) << 2 | palette_id & 0x3;
}

const FRONT  = 0b10;
const BACK   = 0b01;
const OPAQUE = 0b00;
function put_sprite(id, tile_id, palette_id, x, y, alpha = OPAQUE) {
	sprites[id] = tile_id << 24
	            | (palette_id << 18) & 0xFF0000
	            | alpha << 16 & 0x030000
	            | (x << 8) & 0xFF00 | y & 0xFF;
}

/* Draw loop */
requestAnimationFrame(function frame() {
	draw();
	meganimation();
	requestAnimationFrame(frame);
});

/*************************
 * ###    #  #####  #    *
 * #  #  # #   #   # #   *
 * #  # #####  #  #####  *
 * ### #     # # #     # *
 *************************/

/* hardcoded palettes for now */

palettes[0] = 0xFF00;
palettes[1] = 0xAA22;
palettes[2] = 0x15A5;
palettes[3] = 0x6418;
palettes[4] = 0xFF00;

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


/* Generate background */
for (let i = 0; i < 256; i++)
	set_map((i % 16) % 7, i >> 4 % 3, i & 0xF, i >> 4);

/* Make the MEGA text */
put_sprite(0, 4, 4, 8*4, 8*5, FRONT);
put_sprite(1, 5, 4, 8*5, 8*5, BACK);
put_sprite(2, 6, 4, 8*6, 8*5, FRONT);
put_sprite(3, 2, 4, 8*7, 8*5, BACK);

/* Add a sprite in the middle */
put_sprite(4, 0, 2, 60, 60);

/* Change palettes peridodically */
setInterval(() => palettes[0] = Math.floor(Math.random() * (1 << 16)), 532);
setInterval(() => palettes[1] = Math.floor(Math.random() * (1 << 16)), 1333);
setInterval(() => palettes[2] = Math.floor(Math.random() * (1 << 16)), 167);
setInterval(() => palettes[3] = Math.floor(Math.random() * (1 << 16)), 269);

let t = 0;
function meganimation() {
	t++;
	let ycenter = 8*5;
	for (let i = 0; i < 4; i++) {
		let sprite = sprites[i];
		let y = ycenter + Math.floor(Math.sin(Date.now() / 200 + i) * 6);
		let x = ((sprite >> 8 & 0xFF) + 1) % 128;
		let a = sprite >> 16 & 0x3;
		if (t % 40 === 0) {
			a ^= 0x3;
			palettes[4] ^= 0xFFFF;
		}
		sprite &= 0xFFFC0000;
		sprites[i] = sprite | a << 16 | x << 8 | y;
	}
}

console.log(`BOOTING RISK(TM) PICTURE MACHINE
   ** RISK STATUS **
+---------------------+
|RISK MEM: ${mem.byteLength / 2}  words |
|TILES:    ${tiles.byteLength / 2}  words |
|SPRITES:  ${sprites.byteLength / 2}   words |
|PALETTES: ${palettes.byteLength / 2}   words |
|MAP:      ${map.byteLength / 2}  words |
+---------------------+`);
