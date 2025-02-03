console.log(document.cookie);

const btns = document.querySelectorAll("button");

const userId = "u123";
let db;
const dbRequest = indexedDB.open("StorageDummy",1);

dbRequest.onsuccess = function(event) {
    db = event.target.result;

}

dbRequest.onupgradeneeded = function(event) {
    db = event.target.result;
    
    const objStore = db.createObjectStore("products",{keyPath:"id"});
    
    objStore.transaction.oncomplete = function(event) {
        const prodStore =db.transaction("products","readwrite").objectStore("products");
        prodStore.add({
            id:"p1", 
            title:"A first product",
            price:"12.99"
        })
    }
};

dbRequest.onerror = function(event) {
    console.log("Error");
};


btns[0].addEventListener("click",()=>{
    if(!db) {
        return;
    }
    const objStore = db.transaction("products","readwrite").objectStore("products");
    
    objStore.transaction.oncomplete = function(event) {
        const prodStore =db.transaction("products","readwrite").objectStore("products");
        prodStore.add({
            id:"p2", 
            title:"A Second product",
            price:"122.99"
        })
    }
});
btns[1].addEventListener("click",()=>{
    console.log();
});