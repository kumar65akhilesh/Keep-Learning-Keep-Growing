const ids = new Set(["hi:", "from", "set"]);
console.log(ids);


for(const entry of ids.entries()) {
    console.log(entry[0]);
}

const person1 = {name:"Max"};
const person2 = {name: "manuel"}

const personData = new Map([[person1, "dummy data"]]);
personData.set(person2,"another ex");
console.log(personData);
for([key, value] of personData) {
    console.log(key, value);
}
