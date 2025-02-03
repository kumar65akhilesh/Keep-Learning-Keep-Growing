class Course {
    #_price;
    constructor(title, length, p) {
        this.title = title;
        this.length = length;
        this.price = p;
    }
    lengthPerPriceUnit() {
        return this.length/this.#_price;
    }
    get price(){ 
        return "$"+this.#_price;
    }
    set price(p) {
        if(p > 0) {
            this.#_price = p;
        }
    }
}

class PracticalCourse extends Course {
    constructor(title, length, price, numOfExerices) {
        super(title, length, price);
        this.numOfExerices = numOfExerices;
    }
}
class TheoreticalCourse extends Course {
    constructor(title, length, price) {
        super(title, length, price);
        
    }
    publish() {
        console.log("Publish theory paper");
    }
}

const course1 = new Course("Englist", 20, 20);
const course2 = new Course("CS", 10, 40);
//console.log(course1, course2);
//console.log(course1.lengthPerPriceUnit(), course2.lengthPerPriceUnit());
const practical = new PracticalCourse("Englist", 20,-20, 4);
const theory = new TheoreticalCourse("CS", 10, 40);
practical.price=-40;
theory.price = 80;
console.log(practical.price, theory.price);
theory.publish();