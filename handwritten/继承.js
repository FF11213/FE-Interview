// 寄生组合式继承
function Parent(name) {
  this.name = name;
}
Parent.prototype.getName = function () {
  console.log(this.name);
};

function Child(name, age) {
  Parent.call(this, name);
  this.age = age;
}

Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;
Child.prototype.getAge = function () {
  console.log(this.age);
};
