sum = arr => arr.reduce((a, b) => a + b, 0);

transpose = m => m[0].map((r, i) => m.map(r => r[i])); // https://stackoverflow.com/a/17428965

// the numbers 0...n
range = n => [...Array(n).keys()];

diagonal = m => {
    // elements on the main diagonal of square matrix m
    let n = m.length;
    return range(n).map(i => m[i][i]);
};

/*
   mirror elements on the vertical axis, eg:
   1 2 3     3 2 1
   4 5 6  ~> 6 5 4
   7 8 9     9 8 7
 */
mirror = m => m.map(row => [...row].reverse());

deepCopyArray = arr => $.extend(true, [], arr);
//# sourceMappingURL=utils.js.map