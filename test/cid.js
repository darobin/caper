
import { parse } from "../cid.js";

const wtf = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
// base32 - cidv1 - dag-pb - (sha2-256 : 256 : C3C4733EC8AFFD06CF9E9FF50FFC6BCD2EC85A6170004BB709669C31DE94391A)

describe('CID parsing', () => {
  it('parses a valid CID', () => {
    const { version, contentType, multihash } = parse(wtf);
    console.warn(version, contentType, multihash);
  });
});
