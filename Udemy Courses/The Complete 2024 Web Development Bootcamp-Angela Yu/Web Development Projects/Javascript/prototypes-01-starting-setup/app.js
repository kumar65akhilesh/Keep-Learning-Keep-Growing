function Person() {
    this.name ="Max";
    this.age =30;
    this.greet = ()=> {
        console.log(`Name: ${this.name} Age: ${this.age}`);
    }
}
Person.prototype = {printAge(){console.log(this.age);}}
const p = new Person();
p.greet();
p.printAge();
console.log(p);