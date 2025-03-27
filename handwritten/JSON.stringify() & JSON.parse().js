let arr = [1,2,3];
console.log(JSON.stringify(arr))//'[1,2,3]'
console.log(typeof JSON.stringify(arr))//string

let string = '["1","2","3"]'
console.log(JSON.parse(string))//[1,2,3]
console.log(typeof JSON.parse(string))//object