//Array.prototype.reduce
Array.prototype.Reduce = function(callback, initialVal) {
    let len = this.length;
    const checkType = Object.prototype.toString.call.bind(Object.prototype.toString);
    let i = 0;
    if (checkType(initialVal) === '[object Null]' || checkType(initialVal) === '[object Undefined]') {
        i = 1;
        initialVal = this[0];
    }
    while (i < len) {
        //index是从1开始的,并且如果数组中存在empty项目 [,<empty>,],依旧j++,但是不调用callback函数
        if (!this.hasOwnProperty(i)) {
            i++;
            continue;
        }
        initialVal = callback(initialVal, this[i], i++, this);
    }
    return initialVal;
};
//Array.prototype.flat
Array.prototype.Flat = function() {
    let temp = 0,
        i = 0;
    while (i < this.length) {
        if (Object.prototype.toString.call(this[i]) === '[object Array]') {
            temp = this[i].length; //后面的项目往后算打开后的数组len - 原来占用一个位置1
            this.splice(i, 1, ...this[i]); //Don't Worry,这里this[i]是splice在去除i项之前的
        } else {
            temp = 1;
        }
        i += temp;
    }
    return this;
}
//deepClone 未解决循环引用
function dpClone(o) {
    const checkType = Object.prototype.toString.call.bind(Object.prototype.toString);
    let result = checkType(o) === '[object Object]' ? {} : [];
    for (let index of Object.keys(o)) {
        if (checkType(o[index]) === '[object Object]') {
            result[index] = dpClone(o[index]);
        } else if (checkType(o[index]) === '[object Array]') {
            result[index] = [];
            for (let i = 0; i < o[index].length; ++i) result[index][i] = o[index][i];
        } else {
            result[index] = o[index];
        }
    }
    return result;
}

const dpClone2 = (o) => {
    if (typeof o !== 'object') return o;
    const checkType = Object.prototype.toString.call.bind(Object.prototype.toString);
    // 处理正则
    const getRegExp = (re) => {
        let flag = '';
        if (re.global) flag += 'g';
        if (re.ignoreCase) flag += 'i';
        if (re.multiline) flag += 'm';
        return flag;
    }
    // 维护两个存储循环引用的数组
    const parents = [];
    const children = [];

    const _clone = parent => {
        if (parent === null) return null;
        if (typeof parent !== 'object') return parent;
        let child, proto;
        const type = checkType(parent);
        if (type === '[object Array]') {
            // 判断传入的数据是数组类型
            child = [];
        } else if (type === '[object RegExp]') {
            // 判断传入的数据是正则类型
            child = new RegExp(parent.source, getRegExp(parent));
        } else if (type === '[object Date]') {
            // 判断传入的数据是时间类型
            child = new Date(parent.getTime());
        } else {
            // 处理对象原型
            proto = Object.getPrototypeOf(parent);
            // 利用Object.create切断原型
            child = Object.create(proto);
        }

        //处理循环引用
        const index = parents.indexOf(parent);
        if(~index){
            // 如果父数组存在本对象，说明之前已经被引用过,直接返回此对象
            return children[index];
        }
        parents.push(parent);
        children.push(child);

        for(let i of Object.keys(parent)){
            child[i] = _clone(parent[i]);
        }
        return child;
    };
    return _clone(o);
};
