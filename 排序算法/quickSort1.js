// //快排
const quickSort1 = (arr,left,right) => {
    let i,j,t,temp;
    if(left >= right) return;
    temp = arr[left];
    i = left;
    j = right - 1;
    while( i < j){
        while(i < j && arr[j] >= temp) --j;
        while(i < j && arr[i] <= temp) ++i;
        if(i < j) {
            t = arr[i];
            arr[i] = arr[j];
            arr[j] = t;
        }
    }
    // 基准归位
    arr[left] = arr[i];
    arr[i] = temp;
    quickSort1(arr,left,i - 1);
    quickSort1(arr,i + 1,right);
};
let test = [0, 5, 6, 7, -1, 0, 2, 3, 2, 1, -9, 10, 99, 55, 22, 3, 33];
quickSort1(test, 0, test.length);
console.log(test)