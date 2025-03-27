/* 
// 定义接口 Person
interface Person {
    name: string;
    age: number;
}
// 定义变量 Aaron,类型为 Person,形状与接口必须一致
let Aaron: Person = {
    name: 'Aaron',
    age: 22
};

// 可选属性: 该属性可以不存在
interface Person2 {
    name: string;
    age?: number;
}
let Aaron2: Person2 = {
    name: 'Aaron',
};

// 任意属性
interface Person3 {
    name: string;
    //age: number; 报错：一旦定义了任意属性，那么确定属性和可选属性的类型都必须是它的类型的子集
    [propName: string]: string;
}
let Aaron3: Person3 = {
    name: 'Aaron',
    gender: 'male'
};
	// 一个接口中只能定义一个任意属性。如果接口中有多个类型的属性，则可以在任意属性中使用联合类型：
	interface Person4 {
		name: string;
		age?: number;
		[propName: string]: string | number;
	}
	let Aaron4: Person4 = {
		name: 'Tom',
		age: 25,
		gender: 'male'
	};

// 只读属性
interface Person5 {
  readonly id: number;
  name: string;
  age?: number;
  [propName: string]: string | number;
}
let Aaron5: Person5 = {
  id: 23, // 只读的约束存在于第一次给对象赋值的时候
  name: 'Aaron',
  gender: 'male'
};
// Aaron5.id = 233 报错：只读的约束存在于第一次给对象赋值的时候

function reverse(x: number): number;
function reverse(x: string): string;
function reverse(x: number | string): number | string | void {
    if (typeof x === 'number') {
        return Number(x.toString().split('').reverse().join(''));
    } else if (typeof x === 'string') {
        return x.split('').reverse().join('');
    }
}

function reverse(x: number): number
function reverse(x: string): string
function reverse(x: string | number): string | number {
if (typeof x === 'number') {
return Number(x.toString().split('').reverse().join(''));
} else { // 注意这里
return x.split('').reverse().join('');
}
} 
*/

/* 
function aaron(){
    let web: string = "Hello World"
    console.log(web);
}
aaron() 

class Animal {
    public name: string;
    public constructor(name: string) {
      this.name = name;
    }
  }
  
  let a = new Animal('Jack');
  console.log(a.name); // Jack
  a.name = 'Tom';
  console.log(a.name); // Tom 

  class Animal {
    protected name: any;
    public constructor(name: any) {
      this.name = name;
    }
  }
  
  class Cat extends Animal {
    constructor(name: any) {
      super(name);
      console.log(this.name);
    }
  }

class Animal {
    public name: string;
    private constructor(name: string) {
      this.name = name;
    }
  }
  class Cat extends Animal {
    constructor(name) {
      super(name);
    }
  }
  
  let a = new Animal('Jack');


class Animal {
    public name;
    protected constructor(name) {
      this.name = name;
    }
  }
  class Cat extends Animal {
    constructor(name) {
      super(name);
    }
  }
  
  let a = new Animal('Jack');
  
class Animal {
    // public name: string;
    public constructor(public name: string) {
    //   this.name = name;
    }
  }


  class Animal {
    public constructor(public readonly name: string) {}
  }
  
  let a = new Animal('Jack');
  console.log(a.name); // Jack
//   a.name = 'Tom';

//父类
class Person{
    public constructor(private name:string, public age:number, protected sex:string){
        this.name=name;
        this.age=age;
        this.sex=sex;
    }
    run(){
        return `我是${this.name}我${this.age}岁`
    }
}
//子类
class My extends Person{
    constructor(name:string,age:number,sex:string){
        super(name,age,sex)
    }
    run1(){
        // console.log(this.name);//报错 私有属性只能在它本类中使用
        console.log(this.sex);//正确 保护类型可以在子类中使用
        console.log(this.age);//正确
    }
}
let p=new Person("张三",23,"男");
console.log(p.age);//正确，公有可以在本类，子类，类外部访问
// console.log(p.name);//报错，私有的属性不能再类外部访问
// console.log(p.sex);//报错，受保护类型只能在本类或者子类中访问

abstract class Animal {
    public name;
    public constructor(name) {
      this.name = name;
    }
    public abstract sayHi();
  }
  
  let a = new Animal('Jack');
  
 
  abstract class Animal {
      public name: string;
      public constructor(name: string){
          this.name = name;
      }
      public abstract sayHi(): any;
  }

  class Cat extends Animal {
      public sayHi() {
          console.log(`Hi, My name is ${this.name}`);
      }
  }
  let cat = new Cat('Tom').sayHi();

  
  class Animal {
    name: string;
    constructor(name: string) {
      this.name = name;
    }
    sayHi(): string {
      return `My name is ${this.name}`;
    }
  }
  
  let a: Animal = new Animal('Jack');
  console.log(a.sayHi()); // My name is Jack
  
  

  interface Alarm {
      alert(): void;
  }

  interface Light {
    lightOn(): void;
    lightOff(): void;
  }

  class Car implements Alarm, Light {
    alert() {
      console.log('Car alert');
    }
    lightOn() {
      console.log('Car light on');
    }
    lightOff() {
      console.log('Car light off');
    }
  }

  function createArray(length: number, value: any): Array<any> {
    let result = [];
    for (let i = 0; i < length; i++) {
        result[i] = value;
    }
    return result;
}

console.log(createArray(3, 'x')); // ['x', 'x', 'x']

 function createArray<T>(length: number, value: T): Array<T> {
    let result: T[] = [];
    for (let i = 0; i < length; i++) {
        result[i] = value;
    }
    return result;
}

console.log(createArray<string>(3, 'x')); 

function swap<T, U>(tuple: [T, U]): [U, T] {
  return [tuple[1], tuple[0]];
}

console.log(swap([7, 'seven'])); // ['seven', 7]

function loggingIdentity<T>(arg: T): T {
  console.log(arg.length);
  return arg;
}

interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}


interface CreateArrayFunc {
  <T>(length: number, value: T): Array<T>;
}

let createArray: CreateArrayFunc;
createArray = function<T>(length: number, value: T): Array<T> {
  let result: T[] = [];
  for (let i = 0; i < length; i++) {
      result[i] = value;
  }
  return result;
}

console.log(createArray(3, 'x'));


class GenericNumber<T> {
  zeroValue: T;
  add!: (x: T, y: T) => T;
}
let myGenericNumber = new GenericNumber<number>();
myGenericNumber.zeroValue = 0;
myGenericNumber.add = function(x, y) { return x + y; };

class GenericNumber<T> {
  // to get rid of  error, you can define constructor 
  // which takes [zeroValue] and [add] as arguments
      constructor(public zeroValue: T, public add: (x: T, y: T) => T){
          this.zeroValue = zeroValue;
          this.add = add;
      }
  }
  const zeroValue = 0;
  let myGenericNumber = new GenericNumber<number>(zeroValue, (a,b)=>a+b);
  const result = myGenericNumber.add(40,2) // 42
  console.log(result);

    
  function createArray<T = string>(length: number, value: T): Array<T> {
    let result: T[] = [];
    for (let i = 0; i < length; i++) {
        result[i] = value;
    }
    return result;
}
*/
