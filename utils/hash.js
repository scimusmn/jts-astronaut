var {addMod32: add, xor, shiftLeft: left, shiftRight: right} = require('uint32');

function getU16Int(u8IntArray, index) {
    var ret = add(left(u8IntArray[index+1], 8), u8IntArray[index]);
    return ret;
}

exports.hash = (inputString)=> {
    var u8IntArray = new Buffer(inputString);//util.toU8IntArray(inputString + "");

    var hash = u8IntArray.length;
    var tmp;
    var rem;

    if (!inputString) {
        return hash.toString(16);
    }

    var len = u8IntArray.length;
    var pointer = 0;
    rem = len & 3;
    len >>>= 2;

    // the main loop
    for (; len > 0; len--) {
        // for every 32 bits
        hash = add(hash, getU16Int(u8IntArray, pointer));
        tmp = xor(left(getU16Int(u8IntArray, pointer + 2), 11), hash);
        hash = xor(left(hash, 16), tmp);
        pointer += 4;
        hash = add(hash, right(hash, 11));
    }

    // Handle end cases
    switch(rem) {
        case 3:
            hash = add(hash,getU16Int(u8IntArray, pointer));
            hash = xor(hash,left(hash, 16));
            hash = xor(hash,left(u8IntArray[pointer + 2], 18));
            hash = add(hash, right(hash, 11));
            break;
        case 2:
            hash = add(hash,getU16Int(u8IntArray, pointer));
            hash = xor(hash, left(hash, 11));
            hash = add(hash,right(hash, 17));
            break;
        case 1:
            hash = add(hash,u8IntArray[pointer]);
            hash = xor(hash,left(hash, 10));
            hash = add(hash, right(hash, 1));
            break;
    }

    // Force "avalanching" of final 127 bits
    hash = xor(hash,left(hash, 3));
    hash = add(hash,right(hash, 5));
    hash = xor(hash, left(hash, 4));
    hash = add(hash,right(hash, 17));
    hash = xor(hash,left(hash, 25));
    hash = add(hash, right(hash, 6));

    return hash;
}
