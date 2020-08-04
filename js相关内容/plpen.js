"use strict";

/**
 * @description 操作SVG的绘制
 * @author Perfumere<1061393710@qq.com>
 * @time 2020/07/08
 */
// namespace from www.w3.org/2000/svg
const SVG_NS = 'http://www.w3.org/2000/svg';
// SVGElement => Pen(SVG) 原始类型到Pen类型的映射
const SVG_MAPREDUCE = new WeakMap;
// SVGElement => Pen(SVG) subscriber对应的子元素
const SVG_SUBSCRIBER_ELMENT = new WeakMap;
// 已经生成的带有名字的svg存储结构
const SVG_MARK_ELEMENT = new Map;
// 判断类型工具
const checkType = (o, type) => {
  let str = Object.prototype.toString.call(o).split(' ')[1];
  str = str.toLowerCase().substring(0, str.length - 1);
  return str === type.toLowerCase();
};
// 深克隆工具
const deClone = (o) => JSON.parse(JSON.stringify(o));
// 核心画笔类
class Pen {
  constructor(type = 'svg', name, options) {
    // 挂载订阅者队列
    this.subscribers = [];
    // 挂载append|replace|remove|insert DOM操作的队列
    this.batchers = new Set;
    // 元素上绑定的事件列表
    this.eventers = {};
    // 若传入的第一个参数是Pen类型,并且没有name 直接返回
    if (type instanceof Pen && !name) {
      return type;
    }
    // 若传入的第一个参数是对象类型,进行包装
    if (typeof type === 'object') {
      // 如果传入的SVGElement已经存在 SVGElement => Pen(SVG)中
      if (SVG_MAPREDUCE.has(type)) {
        return SVG_MAPREDUCE.get(type);
      }
      if (SVG_SUBSCRIBER_ELMENT.has(type)) {
        return SVG_SUBSCRIBER_ELMENT.get(type);
      }
      this.value = type.cloneNode(true);
    } else {
      this.value = document.createElementNS(SVG_NS, type);
    }
    // 若第二个参数name是非空串认为是起别名,若为对象且具有字段则认为是配置项
    if (typeof name === 'string' && name.length) {
      if (!SVG_MARK_ELEMENT.has(name)) {
        SVG_MARK_ELEMENT.set(name, []);
      }
      SVG_MARK_ELEMENT.get(name).push(this.value);
    } else if (typeof name === 'object' && Object.keys(name).length) {
      options = name;
    }
    // 如果创建的text标签，特殊处理
    if (type === 'text') {
      const text = document.createTextNode(options.textContent || '');
      delete options.textContent;
      this.value.appendChild(text);
    }

    for (let index in options) {
      this.value.setAttribute(index, options[index]);
    }
    const proxy = new Proxy(this, {
      get(target, key, reciver) {
        switch (key) {
          // 特殊参数，访问this本身
          case 'subscribers':
          case 'batchers':
          case 'eventers':
          case 'mount':
          case 'options':
          case 'value':
          case 'appendChild':
          case 'insertBefore':
          case 'insertAfter':
          case 'removeChild':
          case 'replaceChild':
          case 'bind':
          case 'unbind':
          case 'add':
          case 'cloneNode':
            return Reflect.get(target, key);
          default:
            // 返回SVGElement对象上的属性
            if (typeof target.value[key] === 'function') {
              return target.value[key].bind(target.value);
            }
            return target.value[key];
        }
      },
      set(target, key, value, reciver) {
        if (key === 'value') return false;
        try {
          // 单个节点操作成功,被挂载的subscribers需要做批量的等效操作
          const list = [...Reflect.get(target, 'subscribers'), ...Reflect.get(target, 'batchers')];
          if (key === 'textContent') {
            const text = document.createTextNode(value);
            while (target.value.firstChild) {
              target.value.removeChild(target.value.firstChild);
            }
            target.value.appendChild(text);
            list.forEach(item => {
              while (item.firstChild) {
                item.removeChild(item.firstChild);
              }
              item.appendChild(text.cloneNode(true))
            });
            return true;
          }
          target.value.setAttribute(key, value);
          list.forEach(item => item.setAttribute(key, value));
        } catch {
          throw new Error('SVGElement设置属性时发生错误');
        }
        return true;
      },
      has(target, key) {
        return Reflect.has(target, key)
      },
      deleteProperty(target, key) {
        return false
      },
    });
    // SVGElement => Pen(SVG) 原始类型到Pen类型的映射
    SVG_MAPREDUCE.set(this.value, proxy);
    SVG_MAPREDUCE.set(proxy, proxy);
    return proxy;
  }
  // 事件绑定
  bind = (name, callback) => {
    if (typeof name !== 'string' || !name.length || typeof callback !== 'function') return;
    if (!this.eventers[name]) {
      this.eventers[name] = [];
    }
    // 若预绑定的监听器已经存在列表中，则直接返回
    if (this.eventers[name].includes(callback)) return;
    this.eventers[name].push(callback);
    this.value.addEventListener(name, callback);
    [...this.subscribers, ...this.batchers].forEach(item => {
      item.addEventListener(name, callback);
    });
  }
  // 事件解绑
  unbind = (name, callback) => {
    if (typeof name !== 'string' || !name.length || typeof callback !== 'function') return;
    if (!this.eventers[name]) {
      this.eventers[name] = [];
    }
    // 若预绑定的监听器不在列表中，则直接返回
    const index = this.eventers[name].indexOf(callback);
    if (index === -1) return;
    this.eventers[name].split(index, 1);
    // 逻辑节点
    this.value.removeEventListener(name, callback);
    [...this.subscribers, ...this.batchers].forEach(item => {
      item.removeEventListener(name, callback);
    });
  }

  // 获取指定名字的svg元素
  static get = (name) => {
    if (SVG_MARK_ELEMENT.has(name)) {
      return SVG_MARK_ELEMENT.get(name);
    } else if (SVG_MAPREDUCE.has(name)) {
      return [SVG_MAPREDUCE.get(name).value];
    } else {
      return [];
    }
  }
  // 获取元素的挂载列表
  static getRef = (el) => {
    el = SVG_MAPREDUCE.has(el) ? el : Pen(el);
    return el.batchers.size ? [...el.batchers] : el.subscribers;
  }
  // 获取元素事件列表
  static getEvent = (el, name) => {
    if (typeof name === 'string') {
      return el.eventers[name];
    }
    return el.eventers;
  }
  // 添加实例方法
  add = (elementName, name, options) => {
    const errorString = `
    (1)svg.add(xmlName,{ })
    (2)svg.add(xmlName,[{ },{ },...])
    (3)svg.add(xmlName,markupName,{ })
    (4)svg.add(xmlName,markupName,[{ },{ },...])
  `;
    // 没有元素名称，返回空列表
    if (typeof elementName !== 'string' || !elementName.length || !name) {
      throw new Error(errorString);
    };
    // 如果name是对象
    try {
      if (typeof name === 'string') {
        // (3)svg.add(xmlName,markupName,{ }) 
        if (!SVG_MARK_ELEMENT.has(name)) {
          SVG_MARK_ELEMENT.set(name, []);
        }
        const elementList = SVG_MARK_ELEMENT.get(name);
        if (checkType(options, 'object')) {
          const element = new Pen(elementName, options);
          elementList.push(element);
          return [this.appendChild(element)];
          // (4)svg.add(xmlName,markupName,[{ },{ },...])
        } else if (checkType(options, 'array')) {
          return options.map(item => {
            const element = new Pen(elementName, item);
            elementList.push(element);
            return this.appendChild(element);
          });
        }
        // (1)svg.add(xmlName,{ })
      } else if (checkType(name, 'object')) {
        const element = new Pen(elementName, name);
        return [this.appendChild(element)];
        // (2)svg.add(xmlName,[{ },{ },...])
      } else if (checkType(name, 'array')) {
        return name.map(item => {
          const element = new Pen(elementName, item);
          return this.appendChild(element);
        });
      } else {
        throw new Error(errorString);
      }
    } catch {
      throw new Error(errorString);
    }
  }

  // 批量更新配置项
  options(options) {
    try {
      for (let key in options) {
        this[key] = options[key];
      }
    } catch {
      throw new Error('SVGElement设置属性时发生错误');
    }
    return this;
  }
  // 挂载到内存元素,或者DOM中
  mount(name) {
    // 禁止循环挂载
    if (name === this) return this;
    let parent = [];
    // 若传入的参数是Pen实例则直接
    if (name instanceof Pen) {
      const {
        value,
        subscribers,
        batchers
      } = name;
      parent = [value];
      [...subscribers, ...batchers].forEach(item => {
        // 清空待挂载节点内部的子元素
        while (item.firstChild) {
          item.removeChild(item.firstChild);
        }
        item.appendChild(this.cloneNode());
      });
    } else {
      parent = Pen.get(name);
    }

    if (!parent.length) {
      parent = [...document.querySelectorAll(name)];
    }
    parent.forEach(item => {
      // 清空待挂载节点内部的子元素
      while (item.firstChild) {
        item.removeChild(item.firstChild);
      }
      const cloneNode = this.cloneNode(true);
      item.appendChild(cloneNode);
      // 加入subscribers队列
      this.subscribers.push(cloneNode);
    });
    console.log('挂载成功', parent)
    return this;
  }
  // @Override appendChild
  appendChild = (o) => {
    if (!o || o === this) return null;
    // 将传入对象转换成Pen类型,并且将o记录在映射表中
    o = SVG_MAPREDUCE.has(o) ? SVG_MAPREDUCE.get(o) : new Pen(o);
    // 插入到SVGElement & 订阅者中
    const element = Reflect.get(this, 'value');
    const subscribers = Reflect.get(this, 'subscribers');
    const batchers = Reflect.get(o, 'batchers');
    const node = Reflect.get(o, 'value');
    // 逻辑节点
    element.appendChild(node);
    // 如果逻辑节点中没有记录子节点
    if (!SVG_SUBSCRIBER_ELMENT.has(node)) {
      SVG_SUBSCRIBER_ELMENT.set(node, []);
    }
    const childrenList = SVG_SUBSCRIBER_ELMENT.get(node);
    // 挂载节点
    subscribers.forEach(item => {
      const cloneNode = o.cloneNode();
      item.appendChild(cloneNode);
      batchers.add(cloneNode);
      childrenList.push(cloneNode);
    });
    return o;
  }
  // @Override insertBefore
  insertBefore = (o, which = null) => {
    if (!o) return null;
    if (o === which || (o.value === which) || (which && o === which.value)) return o;
    // 将传入对象转换成Pen类型,并记录在映射表中
    o = SVG_MAPREDUCE.has(o) ? SVG_MAPREDUCE.get(o) : new Pen(o);
    if (which && typeof which === 'object') {
      if (which instanceof Pen) {
        which = which.value;
      } else {
        which = SVG_MAPREDUCE.has(which) ? which : new Pen(which).value;
      }
    }
    // 插入到SVGElement & 订阅者中
    const element = Reflect.get(this, 'value');
    const subscribers = Reflect.get(this, 'subscribers');
    const batchers = Reflect.get(o, 'batchers');
    const node = Reflect.get(o, 'value');
    // 逻辑节点
    try {
      element.insertBefore(node, which);
    } catch {
      throw new Error(`
      (1)参数必须为Pen类型或者DOM类型
      (2)参数一必须是合适的XML节点
      (3)参数二必须是父元素子节点或者null,若为null则行为与appendChild方法一致`);
    }
    // 如果逻辑节点中没有记录子节点
    if (!SVG_SUBSCRIBER_ELMENT.has(node)) {
      SVG_SUBSCRIBER_ELMENT.set(node, []);
    }
    const childrenList = SVG_SUBSCRIBER_ELMENT.get(node);
    const list = SVG_SUBSCRIBER_ELMENT.get(which);
    // 挂载节点
    subscribers.forEach((item, index) => {
      const cloneNode = o.cloneNode();
      // 如果列表中存再做批量插入的操作
      if (list && list[index]) {
        item.insertBefore(cloneNode, list[index]);
      } else {
        item.insertBefore(cloneNode, null);
      }
      batchers.add(cloneNode);
      childrenList.push(cloneNode);
    });
    return o;
  }
  // @Override insertAfter
  insertAfter = (o, which) => {
    if (!o) return null;
    if (o === which || (o.value === which) || (which && o === which.value)) return o;
    // 将传入对象转换成Pen类型,并记录在映射表中
    o = SVG_MAPREDUCE.has(o) ? SVG_MAPREDUCE.get(o) : new Pen(o);
    if (which && typeof which === 'object') {
      if (which instanceof Pen) {
        which = which.value;
      } else {
        which = SVG_MAPREDUCE.has(which) ? which : new Pen(which).value;
      }
    }
    // 插入到SVGElement & 订阅者中
    const element = Reflect.get(this, 'value');
    const subscribers = Reflect.get(this, 'subscribers');
    const batchers = Reflect.get(o, 'batchers');
    const node = o.value;
    // 逻辑节点
    try {
      if (element.lastChild === which) {
        element.appendChild(node);
      } else {
        element.insertBefore(node, which.nextSibling);
      }
    } catch {
      throw new Error(`
      (1)参数必须为Pen类型或者DOM类型
      (2)参数一必须是合适的XML节点
      (3)参数二必须是父元素子节点或者null,若为null则行为与appendChild方法一致`);
    }
    // 如果逻辑节点中没有记录子节点
    if (!SVG_SUBSCRIBER_ELMENT.has(node)) {
      SVG_SUBSCRIBER_ELMENT.set(node, []);
    }
    const childrenList = SVG_SUBSCRIBER_ELMENT.get(node);
    const list = SVG_SUBSCRIBER_ELMENT.get(which);
    // 挂载节点
    subscribers.forEach((item, index) => {
      if (!list || !list[index]) return;
      const cloneNode = o.cloneNode();
      if (item.lastChild === list[index]) {
        item.appendChild(cloneNode);
      } else {
        item.insertBefore(cloneNode, which.nextSibling);
      }
      batchers.add(cloneNode);
      childrenList.push(cloneNode);
    });
    return o;
  }
  // @Override removeChild
  removeChild = (o) => {
    if (!o) return null;
    // 将传入对象转换成Pen类型,并且将o记录在映射表中
    if (typeof o === 'object') {
      if (o instanceof Pen) {
        o = o.value;
      } else {
        o = SVG_MAPREDUCE.has(o) ? o : new Pen(o).value;
      }
    }
    // 插入到SVGElement & 订阅者中
    const element = Reflect.get(this, 'value');
    const subscribers = Reflect.get(this, 'subscribers');
    const childrenList = SVG_SUBSCRIBER_ELMENT.get(o);
    // 逻辑节点
    element.removeChild(o);
    // 挂载节点
    subscribers.forEach((item, index) => {
      if (!childrenList[index]) return;
      item.removeChild(childrenList[index]);
    });
    SVG_SUBSCRIBER_ELMENT.set(o, []);
    return o;
  }
  // @Override replaceChild
  replaceChild = (o, which) => {
    if (!o || !which) return null;
    if (o === which) return null;
    // 将传入对象转换成Pen类型,并记录在映射表中
    o = SVG_MAPREDUCE.has(o) ? SVG_MAPREDUCE.get(o) : new Pen(o);
    if (which instanceof Pen) {
      which = which.value;
    } else {
      which = SVG_MAPREDUCE.has(which) ? which : new Pen(which).value;
    }
    const element = Reflect.get(this, 'value');
    const subscribers = Reflect.get(this, 'subscribers');
    const batchers = Reflect.get(o, 'batchers');
    const node = o.value;
    if (!SVG_SUBSCRIBER_ELMENT.has(node)) {
      SVG_SUBSCRIBER_ELMENT.set(node, []);
    }
    const list1 = SVG_SUBSCRIBER_ELMENT.get(node);
    const list2 = SVG_SUBSCRIBER_ELMENT.get(which);
    // 逻辑节点
    element.replaceChild(node, which);
    // 挂载节点
    subscribers.forEach((item, index) => {
      if (!list2[index]) return;
      const cloneNode = o.cloneNode();
      item.replaceChild(cloneNode, list2[index]);
      list1.push(cloneNode);
      batchers.add(cloneNode);
    });
    SVG_SUBSCRIBER_ELMENT.set(which, []);
    return o;
  }
  // @Override cloneNode
  cloneNode = (flag = true) => {
    const cloneNode = this.value.cloneNode(flag);
    // 复制元素上绑定的监听器
    for (let name in this.eventers) {
      this.eventers[name].forEach(callbackItem => {
        cloneNode.addEventListener(name, callbackItem)
      });
    }
    return cloneNode;
  };
}

export default Pen;