const uid = Symbol();
console.log(uid);

const user = {
    id: "p1",
    [uid]: "p2",
    name: "max",
    age:30
};

console.log(user);