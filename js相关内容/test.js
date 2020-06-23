/**
 * @param {number[]} nums
 * @return {boolean}
 */
var isStraight = function(nums) {
    if(!nums.length) return true;
    let flag = true;
    let count = 0;
    const changeNums = nums.map(item =>{
        if(!item) ++count;
        if(typeof item === 'string'){
            switch(item.toLowerCase()){
                case  'a':
                    return 1;
                case  'j':
                    return 11;
                case  'q':
                    return 12;
                case  'k':
                    return 13;
            }
        }
        return item;
    });
    changeNums.sort((item1,item2) => item1 - item2);
    console.log(changeNums);
    changeNums.reduce((prev,next)=>{
        if(prev === 0) return next;
        if(prev === next && prev !== 0){
            flag = false;
        }
        if(next - prev === 1){
            return next;
        }else{
            if(count >= next - prev - 1){
                count -= next - prev - 1;
                return next;
            }else{
                flag = false;
            }
        }
    })

    return flag;
};

console.log(isStraight([10,'J',0,'k',6]));