const { assert } = require('chai')
const jlinkexe = require('../../../lib/jlinkexe')

const stringResultWith4BytesMemory = `
PC = 0000D16C, CycleCnt = 00000000
R0 = 2000007F, R1 = 000000D3, R2 = E000E200, R3 = 000000D3
R4 = 20002C0C, R5 = 20002E16, R6 = 20002C28, R7 = 00000000
R8 = FFFFFFFF, R9 = FFFFFFFF, R10= FFFFFFFF, R11= FFFFFFFF
R12= 00000000
SP(R13)= 20003C10, MSP= 20003C10, PSP= FFFFFFFC, R14(LR) = 0000119B
XPSR = 61000000: APSR = nZCvq, EPSR = 01000000, IPSR = 000 (NoException)
CFBP = 00000000, CONTROL = 00, FAULTMASK = 00, BASEPRI = 00, PRIMASK = 00
FPU regs: FPU not enabled / not implemented on connected CPU.
10001080 = 01 00 03 00                                       ....
`
const bufferResultWith4BytesMemory = Buffer.from([0x01, 0x00, 0x03, 0x00]);

const stringResultWith72BytesMemory = `
PC = 0000D16C, CycleCnt = 00000000
R0 = 2000007F, R1 = 000000D3, R2 = E000E200, R3 = 000000D3
R4 = 20002C0C, R5 = 20002E16, R6 = 20002C28, R7 = 00000000
R8 = FFFFFFFF, R9 = FFFFFFFF, R10= FFFFFFFF, R11= FFFFFFFF
R12= 00000000
SP(R13)= 20003C10, MSP= 20003C10, PSP= FFFFFFFC, R14(LR) = 0000119B
XPSR = 61000000: APSR = nZCvq, EPSR = 01000000, IPSR = 000 (NoException)
CFBP = 00000000, CONTROL = 00, FAULTMASK = 00, BASEPRI = 00, PRIMASK = 00
FPU regs: FPU not enabled / not implemented on connected CPU.
100000A4 = 36 0B 7E 3C 54 68 D6 38  F6 FF FF FF 00 50 00 78  6.~.Th.8.....P.x
100000B4 = 4E 00 00 54 05 80 0C 60  24 64 72 00 3E 42 03 82  N..T....$dr..B..
100000C4 = 4E 00 00 54 05 80 0C 60  24 64 72 00 3E 42 03 82  N..T....$dr..B..
100000D4 = FF FF FF FF FF FF FF FF  FF FF FF FF FF FF FF FF  ................
100000E4 = FF FF FF FF FF FF FF FF                           62......
`
const bufferResultWith72BytesMemory = Buffer.from([
	0x36, 0x0B, 0x7E, 0x3C, 0x54, 0x68, 0xD6, 0x38, 0xF6, 0xFF, 0xFF, 0xFF, 0x00, 0x50, 0x00, 0x78,
	0x4E, 0x00, 0x00, 0x54, 0x05, 0x80, 0x0C, 0x60, 0x24, 0x64, 0x72, 0x00, 0x3E, 0x42, 0x03, 0x82,
	0x4E, 0x00, 0x00, 0x54, 0x05, 0x80, 0x0C, 0x60, 0x24, 0x64, 0x72, 0x00, 0x3E, 0x42, 0x03, 0x82,
	0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
	0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
]);

describe('jlinkexe', function(){
	describe( 'parseMemoryStringToBuffer', function(){
		it('read 4 bytes', function(){
			const result = jlinkexe.parseMemoryStringToBuffer( stringResultWith4BytesMemory,0x10001080,4 );
			assert.deepEqual( result, Buffer.from([0x01, 0x00, 0x03, 0x00]));
		});

		it('reads 72 bytes', function(){
			const result = jlinkexe.parseMemoryStringToBuffer( stringResultWith72BytesMemory,0x100000A4,72 );
			assert.deepEqual( result, bufferResultWith72BytesMemory);
		})
	});
});
