const kata = ["kita", "atik", "aku", "kia", "makan", "kua"];
const groupAnagramWords = (kata = []) => {
   if (kata.length === 0){
      return kata;
   };
   const map = new Map();
   for(let str of kata){
      let sorted = [...str];
      sorted.sort();
      sorted = sorted.join('');
      if(map.has(sorted)){
         map.get(sorted).push(str);
      }else{
         map.set(sorted, [str])
      };
   };
   return [...map.values()];
};
console.log('OUTPUT - Result anagram group  : \n', groupAnagramWords(kata));
