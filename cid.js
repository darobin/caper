
const b32codes = new Map('abcdefghijklmnopqrstuvwxyz234567'.split('').map((k, i) => [k, i]));
const cidContentTypes = {
  raw: 0x55,
  dagCBOR: 0x71,
  dagPB: 0x70,
  car: 0x0202,
  dagJSON: 0x0129,
};
const supportedContentTypes = new Set(Object.values(cidContentTypes));

const MSB = 0x80;
const REST = 0x7F;

// Gets a CID as string or Uint8Array.
// Returns a structure with all components.
// Throws if we don't support it.
// (Code heavily inspired by js-multiformats.)
export function parse (cid) {
  // If we get a string, parse it into Uint8Array.
  let uarr;
  if (typeof cid === 'string') {
    if (cid.length === 46 && /^Qm/.test(cid)) throw new Error('CIDv0 is not supported.');
    if (cid[0] !== 'b') throw new Error('Only base32 lowercase is supported.');
    const bitsPerChar = 5;
    uarr = new Uint8Array((cid.length * bitsPerChar / 8) | 0);
    let bits = 0;
    let buffer = 0;
    let written = 0;
    for (let i = 0; i < cid.length; i++) {
      if (!b32codes.has(cid[i])) throw new Error(`Invalid character "${cid[i]}"`);
      const value = b32codes.get(cid[i]);
      buffer = (buffer << bitsPerChar) | value;
      bits += bitsPerChar;
      if (bits >= 8) {
        bits -= 8;
        uarr[written++] = 0xff & (buffer >> bits);
      }
    }
    if (bits >= bitsPerChar || 0xff & (buffer << (8 - bits))) {
      throw new Error('Unexpected end of data');
    }
  }
  else {
    uarr = cid;
  }
  if (uarr[0] === 18) throw new Error('CIDv0 is not supported.');
  const { value: version, offset } = varint(uarr);
  if (version !== 1) throw new Error(`Only version 1 is supported, got ${version}.`);
  const { value: contentType, offset: restOffset } = varint(uarr, offset);
  if (!supportedContentTypes.has(contentType)) throw new Error(`Unsupported CID content type ${contentType}`);
  const multihash = new Uint8Array(uarr, restOffset);
  return { version, contentType, multihash };
}

function varint (buf, offset = 0) {
  let value = 0;
  let shift = 0;
  let counter = offset;
  let b;

  do {
    if (counter >= buf.length) throw new Error('Could not decode varint');
    b = buf[counter++];
    value += shift < 28
      ? (b & REST) << shift
      : (b & REST) * Math.pow(2, shift);
    shift += 7;
  } while (b >= MSB)

  return { value, offset: counter };
}
