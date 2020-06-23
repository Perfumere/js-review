const dpClone = (o) => {
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

let a = [1,2,3];
a.test = a;
a.__proto__.what = 'hello,world';

console.log(dpClone(a))
