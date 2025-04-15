/* class Animal {
  constructor(name) {
    this.name = name;
  }
  get name() {
    return 'Jack';
  }
  set name(value) {
    console.log('setter: ' + value);
  }
}

let a = new Animal('Kitty'); // setter: Kitty
a.name = 'Tom'; // setter: Tom
console.log(a.name); // Jack */

const User = {
  count: 1,
  action: {
    count: 1,

    getCount() {
      console.log(this);
      return this.count;
    },
  },
};

const action = User.action;
const getCount = User.action.getCount;
console.log(User.action.getCount());
console.log(action.getCount());
console.log(getCount());
