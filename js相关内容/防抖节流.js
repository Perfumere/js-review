const debounce = (fn,delay) =>{
    let timer = null; // 区别点1
    return (...args) =>{
        clearTimeout(timer); // 区别点2
        timer = setTimeout(() => {
            fn.apply(this,args);
        },delay);
    };
}

const throttle = (fn,delay = 500) =>{
    const flag = true; // 区别点1
    return (...args) => {
        if(!flag) return;
        flag = false;
        setTimeout(()=>{
            fn.apply(this,args);
            flag = true; // 区别点2
        },delay);
    }
};