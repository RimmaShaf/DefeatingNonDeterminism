const buffer = new ArrayBuffer(4);
const view = new DataView(buffer);

function float32ToBits(value: number): number {
	view.setFloat32(0, value, false);
	return view.getUint32(0, false);
}

function bitsToFloat32(bits: number): number {
	view.setUint32(0, bits, false);
	return view.getFloat32(0, false);
}

export function float32ToBfloat16Bits(value: number): number {
	const bits = float32ToBits(value);
	const lsb = (bits >> 16) & 1;
	const roundingBias = 0x7fff + lsb;
	return ((bits + roundingBias) >> 16) & 0xffff;
}

export function bfloat16BitsToFloat32(bits: number): number {
	return bitsToFloat32((bits & 0xffff) << 16);
}

export function roundToBfloat16(value: number): number {
	return bfloat16BitsToFloat32(float32ToBfloat16Bits(value));
}
