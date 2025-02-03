const task3Element = document.getElementById('task-3');
function func1(){
    alert("Hi");
}
function func2(name){
    alert(name);
}
func1();
func2("akhilesh");
task3Element.addEventListener("click",func1);
function func3( str1, str2, str3) {
    return str1+str2+str3;
}
alert(func3("hi","there","stranger"));
