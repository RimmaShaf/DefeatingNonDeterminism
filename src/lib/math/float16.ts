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

function float16BitsToFloat32(bits: number): number {
	const sign = (bits & 0x8000) << 16;
	const exponent = (bits >> 10) & 0x1f;
	const fraction = bits & 0x03ff;

	if (exponent === 0) {
		if (fraction === 0) {
			return bitsToFloat32(sign);
		}
		// subnormal
		let frac = fraction;
		let exp = -14;
		while ((frac & 0x0400) === 0) {
			frac <<= 1;
			exp -= 1;
		}
		frac &= 0x03ff;
		const f32Exponent = (exp + 127) << 23;
		const f32Fraction = frac << 13;
		return bitsToFloat32(sign | f32Exponent | f32Fraction);
	}

	if (exponent === 0x1f) {
		return bitsToFloat32(sign | 0x7f800000 | (fraction << 13));
	}

	const f32Exponent = (exponent - 15 + 127) << 23;
	const f32Fraction = fraction << 13;
	return bitsToFloat32(sign | f32Exponent | f32Fraction);
}

export function float32ToFloat16Bits(value: number): number {
	const bits = float32ToBits(value);
	const sign = (bits >> 16) & 0x8000;
	let exponent = (bits >> 23) & 0xff;
	let fraction = bits & 0x7fffff;

	if (exponent === 0xff) {
		if (fraction === 0) {
			return sign | 0x7c00;
		}
		return sign | 0x7e00;
	}

	const halfExp = exponent - 127 + 15;

	if (halfExp >= 0x1f) {
		return sign | 0x7c00;
	}

	if (halfExp <= 0) {
		if (halfExp < -10) {
			return sign;
		}
		fraction |= 0x800000;
		const shift = 1 - halfExp;
		const rounded = (fraction + (1 << (shift + 12 - 1))) >> (shift + 12);
		return sign | rounded;
	}

	const roundedMantissa = fraction + 0x1000;
	if (roundedMantissa & 0x00800000) {
		exponent += 1;
		fraction = 0;
		if (exponent - 127 + 15 >= 0x1f) {
			return sign | 0x7c00;
		}
	} else {
		fraction = roundedMantissa;
	}

	return sign | ((exponent - 127 + 15) << 10) | (fraction >> 13);
}

export function roundToFloat16(value: number): number {
	return float16BitsToFloat32(float32ToFloat16Bits(value));
}
