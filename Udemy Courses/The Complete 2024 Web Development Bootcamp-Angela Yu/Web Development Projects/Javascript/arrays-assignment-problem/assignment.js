const array = [2,5,6,7,1,8,1,-1];
console.log(array.filter(val =>  val > 5));
console.log(array.map(val => ({num:val})));
console.log(array.reduce((init, val) => {
    return val*init;
}));

function findMax(...args) {
    let maxVal = Number.NEGATIVE_INFINITY;
    for(const a of args) {
        maxVal = Math.max(a, maxVal);
    }
    return maxVal;
}

function findMax1(...args) {    
    return Math.max(...args);
}

function findMinMax(...args) {    
    return [Math.max(...args), Math.min(...args)];
}

console.log(findMax(...array));
console.log(findMax1(...array));
const [max, min] = findMinMax(...array);
console.log(max, min);

const unique = new Set();
array.forEach(val => unique.add(val));
console.log(unique);