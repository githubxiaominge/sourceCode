/* Zepto v1.2.0 - zepto event ajax form ie - zeptojs.com/license */
(function (global, factory) {
    //amd模块
    if (typeof define === 'function' && define.amd)
        define(function () {
            return factory(global)
        })
    else
        factory(global)
}(this, function (window) {
    var Zepto = (function () {
        var undefined, key, $, classList, emptyArray = [], concat = emptyArray.concat, filter = emptyArray.filter,
            slice = emptyArray.slice,
            document = window.document,
            elementDisplay = {}, classCache = {},
            cssNumber = {
                'column-count': 1,
                'columns': 1,
                'font-weight': 1,
                'line-height': 1,
                'opacity': 1,
                'z-index': 1,
                'zoom': 1
            },
            fragmentRE = /^\s*<(\w+|!)[^>]*>/,//匹配html标签，包括注释在内
            singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,//?:不捕获分组，此处匹配简单空标签
            tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,//匹配除了area|br|col|embed|hr|img|input|link|meta|param之外其他标签，类似这个形式<div/>
            rootNodeRE = /^(?:body|html)$/i,//匹配html和body
            capitalRE = /([A-Z])/g,//匹配大写字母

            // special attributes that should be get/set via method calls
            //需要通过get/set方法获取的特殊属性，意思是要操作这些属性，需要调用val(),css(),html()等等这些方法，不能直接通过修改属性
            methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

            adjacencyOperators = ['after', 'prepend', 'before', 'append'],
            table = document.createElement('table'),
            tableRow = document.createElement('tr'),
            containers = {
                'tr': document.createElement('tbody'),
                'tbody': table, 'thead': table, 'tfoot': table,
                'td': tableRow, 'th': tableRow,
                '*': document.createElement('div')
            },//自定义的一些container元素
            readyRE = /complete|loaded|interactive/,
            simpleSelectorRE = /^[\w-]*$/,//匹配包括下划线和‘-’的任何单词字符,识别html标签
            class2type = {},
            toString = class2type.toString,
            zepto = {},
            camelize, uniq,
            tempParent = document.createElement('div'),
            propMap = {
                'tabindex': 'tabIndex',
                'readonly': 'readOnly',
                'for': 'htmlFor',
                'class': 'className',
                'maxlength': 'maxLength',
                'cellspacing': 'cellSpacing',
                'cellpadding': 'cellPadding',
                'rowspan': 'rowSpan',
                'colspan': 'colSpan',
                'usemap': 'useMap',
                'frameborder': 'frameBorder',
                'contenteditable': 'contentEditable'
            },//此处应是转换js的保留字
            //是否为数组对象
            isArray = Array.isArray ||
                function (object) {
                    return object instanceof Array
                }

        //判断给定元素是否和给定的css表达式契合
        zepto.matches = function (element, selector) {
            if (!selector || !element || element.nodeType !== 1) return false

            /*新api matches或matchesSelector*/
            var matchesSelector = element.matches || element.webkitMatchesSelector ||
                element.mozMatchesSelector || element.oMatchesSelector ||
                element.matchesSelector
            if (matchesSelector) return matchesSelector.call(element, selector)


            // 兼容方案
            var match, parent = element.parentNode, temp = !parent
            //不存在父节点，动态创建div作为父节点
            if (temp) (parent = tempParent).appendChild(element)
            match = ~zepto.qsa(parent, selector).indexOf(element)//~为按位取反，找不到对应值时-1被转化为0，其他转化为非0值，if判断时0 为假，非0 均为真，妈的智障
            temp && tempParent.removeChild(element)//恢复临时变量
            return match
        }

        //调用Object的toString方法获取当前obj类型
        function type(obj) {
            return obj == null ? String(obj) :
                class2type[toString.call(obj)] || "object"
        }

        //是否为函数
        function isFunction(value) {
            return type(value) == "function"
        }

        //当前对象是否为window
        function isWindow(obj) {
            return obj != null && obj == obj.window
        }

        //是否为document节点
        function isDocument(obj) {
            return obj != null && obj.nodeType == obj.DOCUMENT_NODE
        }

        //是否为object
        function isObject(obj) {
            return type(obj) == "object"
        }


        //是否为原始Object对象
        function isPlainObject(obj) {
            return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
        }

        //是否类数组类型
        function likeArray(obj) {
            var length = !!obj && 'length' in obj && obj.length,
                type = $.type(obj)

            //排除函数对象，全局属性自动添加到window，估需要排除window
            return 'function' != type && !isWindow(obj) && (
                'array' == type || length === 0 ||
                (typeof length == 'number' && length > 0 && (length - 1) in obj)//看起来像鸭子，他就是鸭子
            )
        }

        //去除数组null值，保留非空值
        function compact(array) {
            return filter.call(array, function (item) {
                return item != null
            })
        }

        //数组降维（可以）
        function flatten(array) {
            return array.length > 0 ? $.fn.concat.apply([], array) : array
        }

        //字符串驼峰化
        camelize = function (str) {
            return str.replace(/-+(.)?/g, function (match, chr) {
                return chr ? chr.toUpperCase() : ''//.匹配除“\n”和"\r"之外的任何单个字符，将-后面的第一个字符变成大写
            })
        }

        //命名从驼峰转化为-隔开
        function dasherize(str) {
            return str.replace(/::/g, '/')
                .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
                .replace(/([a-z\d])([A-Z])/g, '$1_$2')
                .replace(/_/g, '-')
                .toLowerCase()
        }

        //去重。。。（工具）
        uniq = function (array) {
            return filter.call(array, function (item, idx) {
                return array.indexOf(item) == idx
            })
        }

        //返回一个正则表达式，用来判断当前指定的name是否存在node的class中
        function classRE(name) {
            return name in classCache ?//使用过的话则缓存起来，下次再用
                classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))//此处前后空格的意义在于，class存在多个值时，中间是以空格隔开
        }

        //除去cssNumber中规定的css字段外，统一加上px后缀
        function maybeAddPx(name, value) {
            return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
        }

        //获取节点的当前的display属性
        function defaultDisplay(nodeName) {
            var element, display
            //首先检查是否有缓存，没有缓存时利用新创建的节点来获取display属性
            if (!elementDisplay[nodeName]) {
                element = document.createElement(nodeName)
                document.body.appendChild(element)
                display = getComputedStyle(element, '').getPropertyValue("display")
                element.parentNode.removeChild(element)
                display == "none" && (display = "block")//当display属性是隐藏时，修改为block
                elementDisplay[nodeName] = display
            }
            return elementDisplay[nodeName]//命中缓存则直接返回
        }

        //兼容写法，获取子节点
        function children(element) {
            return 'children' in element ?
                slice.call(element.children) :
                $.map(element.childNodes, function (node) {
                    if (node.nodeType == 1) return node//兼容写法，仅获取Element元素
                })
        }

        //Z对象构造函数
        function Z(dom, selector) {
            var i, len = dom ? dom.length : 0
            for (i = 0; i < len; i++) this[i] = dom[i]
            this.length = len
            this.selector = selector || ''
        }

        // `$.zepto.fragment` takes a html string and an optional tag name
        // to generate DOM nodes from the given html string.
        // The generated DOM nodes are returned as an array.
        // This function can be overridden in plugins for example to make
        // it compatible with browsers that don't support the DOM fully.
        //通过传入的html字符串构建节点，可以指定额外的属性
        zepto.fragment = function (html, name, properties) {
            var dom, nodes, container

            // A special case optimization for a single tag
            if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))//创建简单标签

            if (!dom) {
                if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")//类似<div/>转化成<div></div>
                if (name === undefined) name = fragmentRE.test(html) && RegExp.$1//不传入name则取当前tag的名称作为name
                if (!(name in containers)) name = '*'//除了所定义之外的传入*，当做div处理

                //选择合适的标签包裹起来
                container = containers[name]
                container.innerHTML = '' + html
                //返回一个新的数组，并清空container里面的内容，借助这个函数将html字符串转化为node列表
                dom = $.each(slice.call(container.childNodes), function () {
                    container.removeChild(this)
                })
            }

            //此处是对传入的属性列表添加到构建的node列表上
            if (isPlainObject(properties)) {
                nodes = $(dom)
                $.each(properties, function (key, value) {
                    if (methodAttributes.indexOf(key) > -1) nodes[key](value)
                    else nodes.attr(key, value)
                })
            }

            return dom
        }

        // `$.zepto.Z` swaps out the prototype of the given `dom` array
        // of nodes with `$.fn` and thus supplying all the Zepto functions
        // to the array. This method can be overridden in plugins.
        //zepto.Z继承自$.fn，Z构造函数复制了节点列表的所有节点，从而使节点列表具有$.fn的所有功能
        zepto.Z = function (dom, selector) {
            return new Z(dom, selector)
        }

        // `$.zepto.isZ` should return `true` if the given object is a Zepto
        // collection. This method can be overridden in plugins.

        //是否Z对象
        zepto.isZ = function (object) {
            return object instanceof zepto.Z
        }

        // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
        // takes a CSS selector and an optional context (and handles various
        // special cases).
        // This method can be overridden in plugins.
        zepto.init = function (selector, context) {
            var dom
            // If nothing given, return an empty Zepto collection
            //选择器为空则返回空的Z对象
            if (!selector) return zepto.Z()
            // Optimize for string selectors
            else if (typeof selector == 'string') {
                selector = selector.trim()//去空格
                // If it's a html fragment, create nodes from it
                // Note: In both Chrome 21 and Firefox 15, DOM error 12
                // is thrown if the fragment doesn't begin with <
                //检测出如果是用字符串直接构建dom
                if (selector[0] == '<' && fragmentRE.test(selector))
                    dom = zepto.fragment(selector, RegExp.$1, context), selector = null
                // If there's a context, create a collection on that context first, and select
                // nodes from there
                //如果提供context，则对context的每一个子元素进行selector匹配，返回一个列表
                else if (context !== undefined) return $(context).find(selector)
                // If it's a CSS selector, use it to select nodes.
                //css选择器，以document为根进行查找
                else dom = zepto.qsa(document, selector)
            }
            // If a function is given, call it when the DOM is ready
            //$(function(){})能执行的原因，在ready时会调用
            else if (isFunction(selector)) return $(document).ready(selector)
            // If a Zepto collection is given, just return it
            //如果传入的已经是zeptop对象，则直接返回
            else if (zepto.isZ(selector)) return selector
            else {
                // normalize array if an array of nodes is given
                //传入的是一个数组，则先去除null
                if (isArray(selector)) dom = compact(selector)
                // Wrap DOM nodes.
                //dom节点，构建成数组
                else if (isObject(selector))
                    dom = [selector], selector = null
                // If it's a html fragment, create nodes from it
                //此处要通过字符串匹配，上面在string判断中已经出现过，理论上应该不可能再次命中，以下部分存疑
                else if (fragmentRE.test(selector))
                    dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
                // If there's a context, create a collection on that context first, and select
                // nodes from there
                else if (context !== undefined) return $(context).find(selector)
                // And last but no least, if it's a CSS selector, use it to select nodes.
                else dom = zepto.qsa(document, selector)
            }
            // create a new Zepto collection from the nodes found
            //最终结果实例化成一个zepto对象
            return zepto.Z(dom, selector)
        }

        // `$` will be the base `Zepto` object. When calling this
        // function just call `$.zepto.init, which makes the implementation
        // details of selecting nodes and creating Zepto collections
        // patchable in plugins.
        //$(什么鬼)直接调用init方法
        $ = function (selector, context) {
            return zepto.init(selector, context)
        }

        //target继承source的方法和属性
        function extend(target, source, deep) {
            for (key in source)
                //深复制，递归
                if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                    if (isPlainObject(source[key]) && !isPlainObject(target[key]))
                        target[key] = {}
                    if (isArray(source[key]) && !isArray(target[key]))
                        target[key] = []
                    extend(target[key], source[key], deep)
                }
                else if (source[key] !== undefined) target[key] = source[key]
        }

        // Copy all but undefined properties from one or more
        // objects to the `target` object.
        //继承操作，支持多重继承
        $.extend = function (target) {
            var deep, args = slice.call(arguments, 1)
            //第一个参数为bool类型时，表示是否深克隆
            if (typeof target == 'boolean') {
                deep = target
                target = args.shift()//第二个参数作为target
            }
            //遍历所有其他参数，逐个继承
            args.forEach(function (arg) {
                extend(target, arg, deep)
            })
            return target
        }

        // `$.zepto.qsa` is Zepto's CSS selector implementation which
        // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
        // This method can be overridden in plugins.
        //兼容版css选择器，使用querySelectorAll，获取所选节点下符合的所有元素
        zepto.qsa = function (element, selector) {
            var found,
                maybeID = selector[0] == '#',//识别#id
                maybeClass = !maybeID && selector[0] == '.',//识别.className
                nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // 获取筛选体，同时确保仅有一个字符的选择器能得到保留，例如a
                isSimple = simpleSelectorRE.test(nameOnly)//识别html标签
            return (element.getElementById && isSimple && maybeID) ? // Safari旧机型对getElementById不兼容
                ((found = element.getElementById(nameOnly)) ? [found] : []) :
                (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] ://非可选择节点
                    slice.call(//转化为数组
                        isSimple && !maybeID && element.getElementsByClassName ? // DocumentFragment doesn't have getElementsByClassName/TagName
                            maybeClass ? element.getElementsByClassName(nameOnly) : // 为.classname，使用getElementsByClassName获取
                                element.getElementsByTagName(selector) : // 单纯的tag
                            element.querySelectorAll(selector) // 组合表达式，返回取得的所有元素
                    )
        }

        //简单封装
        function filtered(nodes, selector) {
            return selector == null ? $(nodes) : $(nodes).filter(selector)
        }

        //dom节点是否包含
        $.contains = document.documentElement.contains ?
            function (parent, node) {
                return parent !== node && parent.contains(node)
            } :
            function (parent, node) {
                while (node && (node = node.parentNode))
                    if (node === parent) return true
                return false
            }

        //关键方法，arg如果为函数，则绑定执行环境之后返回执行结果，否则返回arg
        function funcArg(context, arg, idx, payload) {
            return isFunction(arg) ? arg.call(context, idx, payload) : arg
        }

        //依旧简单封装，设置或删除属性
        function setAttribute(node, name, value) {
            value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
        }

        // access className property while respecting SVGAnimatedString
        //获取或设置className属性，兼容svg,svg并不了解，此处略过
        function className(node, value) {
            var klass = node.className || '',
                svg = klass && klass.baseVal !== undefined

            if (value === undefined) return svg ? klass.baseVal : klass
            svg ? (klass.baseVal = value) : (node.className = value)
        }

        // "true"  => true
        // "false" => false
        // "null"  => null
        // "42"    => 42
        // "42.5"  => 42.5
        // "08"    => "08"
        // JSON    => parse if valid
        // String  => self
        //简单的反序列化
        function deserializeValue(value) {
            try {
                return value ?
                    value == "true" ||
                    (value == "false" ? false :
                        value == "null" ? null :
                            +value + "" == value ? +value :
                                /^[\[\{]/.test(value) ? $.parseJSON(value) :
                                    value)
                    : value
            } catch (e) {
                return value
            }
        }

        $.type = type
        $.isFunction = isFunction
        $.isWindow = isWindow
        $.isArray = isArray
        $.isPlainObject = isPlainObject

        //是否空对象
        $.isEmptyObject = function (obj) {
            var name
            for (name in obj) return false
            return true
        }

        //判断是否是数字
        $.isNumeric = function (val) {
            var num = Number(val), type = typeof val
            return val != null && type != 'boolean' &&
                (type != 'string' || val.length) &&
                !isNaN(num) && isFinite(num) || false
        }

        //检测数组中是否存在值
        $.inArray = function (elem, array, i) {
            return emptyArray.indexOf.call(array, elem, i)
        }

        $.camelCase = camelize
        $.trim = function (str) {
            return str == null ? "" : String.prototype.trim.call(str)
        }

        // plugin compatibility
        $.uuid = 0
        $.support = {}
        $.expr = {}
        $.noop = function () {
        }

        //map，遍历elements并对每一个项执行回调
        $.map = function (elements, callback) {
            var value, values = [], i, key
            if (likeArray(elements))
                for (i = 0; i < elements.length; i++) {
                    value = callback(elements[i], i)
                    if (value != null) values.push(value)//返回所有callback执行后的结果
                }
            else
                for (key in elements) {
                    value = callback(elements[key], key)
                    if (value != null) values.push(value)//返回所有callback执行后的结果
                }
            return flatten(values)
        }

        //遍历数组或对象，对内容执行方法，直到callback返回false为止，返回原数组或对象
        $.each = function (elements, callback) {
            var i, key
            if (likeArray(elements)) {
                for (i = 0; i < elements.length; i++)
                    if (callback.call(elements[i], i, elements[i]) === false) return elements
            } else {
                for (key in elements)
                    if (callback.call(elements[key], key, elements[key]) === false) return elements
            }

            return elements
        }

        //filter简单封装
        $.grep = function (elements, callback) {
            return filter.call(elements, callback)
        }

        if (window.JSON) $.parseJSON = JSON.parse

        // Populate the class2type map
        //初始化对象类型字典
        $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function (i, name) {
            class2type["[object " + name + "]"] = name.toLowerCase()
        })

        // Define methods that will be available on all
        // Zepto collections
        $.fn = {
            constructor: zepto.Z,
            length: 0,

            // Because a collection acts like an array
            // copy over these useful array functions.
            forEach: emptyArray.forEach,
            reduce: emptyArray.reduce,
            push: emptyArray.push,
            sort: emptyArray.sort,
            splice: emptyArray.splice,
            indexOf: emptyArray.indexOf,
            //将传入的所有数组合并成一个数组，同时支持Z实例
            concat: function () {
                var i, value, args = []
                //这一步主要是起到转化作用
                for (i = 0; i < arguments.length; i++) {
                    value = arguments[i]
                    args[i] = zepto.isZ(value) ? value.toArray() : value//当前如果是Z的实例，则将Z中的节点转化成数组
                }
                //此处起到数组降维的作用
                return concat.apply(zepto.isZ(this) ? this.toArray() : this, args)//将获得的所有数组拼接成一个数组，args如果是多维，将会降一级拼接
            },

            // `map` and `slice` in the jQuery API work differently
            // from their array counterparts
            //此处应是为了兼容jquery api，将参数位置调转
            //封装后返回zepto对象
            map: function (fn) {
                return $($.map(this, function (el, i) {
                    return fn.call(el, i, el)
                }))
            },
            slice: function () {
                return $(slice.apply(this, arguments))
            },

            //$.ready
            ready: function (callback) {
                // need to check if document.body exists for IE as that browser reports
                // document ready when it hasn't yet created the body element
                if (readyRE.test(document.readyState) && document.body) callback($)//已加载完毕则立刻执行回调
                else document.addEventListener('DOMContentLoaded', function () {//监听加载完毕事件
                    callback($)
                }, false)
                return this
            },
            //idx为空：将当前对象转化为数组返回，idx大于等于0时返回第idx个，小于0返回倒数第idx值
            get: function (idx) {
                return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
            },
            //类数组转化为数组
            toArray: function () {
                return this.get()
            },
            size: function () {
                return this.length
            },
            //将当前集合中的元素从父节点中移除
            remove: function () {
                return this.each(function () {
                    if (this.parentNode != null)
                        this.parentNode.removeChild(this)
                })
            },
            //遍历操作，直到回调函数返回false
            each: function (callback) {
                emptyArray.every.call(this, function (el, idx) {
                    return callback.call(el, idx, el) !== false
                })
                return this
            },
            //筛选出所有符合的节点
            filter: function (selector) {
                if (isFunction(selector)) return this.not(this.not(selector))//负负得正。。。
                //调用原生的fileter方法，选出匹配的节点列表
                return $(filter.call(this, function (element) {
                    return zepto.matches(element, selector)
                }))
            },
            //数组合并后去重
            add: function (selector, context) {
                return $(uniq(this.concat($(selector, context))))
            },
            is: function (selector) {
                return this.length > 0 && zepto.matches(this[0], selector)
            },
            //找出所有不符合selector的项
            not: function (selector) {
                var nodes = []
                //如果是函数，则对每个子节点执行函数并取出返回false的节点列表
                if (isFunction(selector) && selector.call !== undefined)
                    this.each(function (idx) {
                        if (!selector.call(this, idx)) nodes.push(this)
                    })
                else {
                    var excludes = typeof selector == 'string' ? this.filter(selector) ://字符串，正则匹配获取符合项
                        (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) ://dom node列表，类数组
                            $(selector)//数组
                    this.forEach(function (el) {
                        if (excludes.indexOf(el) < 0) nodes.push(el)//筛选出所有不符合的节点
                    })
                }
                return $(nodes)
            },
            //slector为对象时，判断当前对象是否包含selector,为选择器时，返回符合选择器的节点
            has: function (selector) {
                return this.filter(function () {
                    return isObject(selector) ?
                        $.contains(this, selector) :
                        $(this).find(selector).size()
                })
            },
            //获取当前对象指定index位置的元素，负数则从后往前数
            eq: function (idx) {
                return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1)
            },
            //获取第一个子元素
            first: function () {
                var el = this[0]
                return el && !isObject(el) ? el : $(el)//包装成zepto对象
            },
            //最后一个元素
            last: function () {
                var el = this[this.length - 1]
                return el && !isObject(el) ? el : $(el)
            },
            //与filter的区别在于，find是对所有后代元素的子元素中进行筛选
            find: function (selector) {
                var result, $this = this
                if (!selector) result = $()
                else if (typeof selector == 'object')
                //当slector是object时，如果当前对象子元素包含了selector的项，这个项才会返回
                    result = $(selector).filter(function () {
                        var node = this//此处this已经被绑定为特定的item
                        return emptyArray.some.call($this, function (parent) {
                            return $.contains(parent, node)
                        })
                    })
                else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
                else result = this.map(function () {
                        return zepto.qsa(this, selector)
                    })
                return result
            },
            //逐级往上，获取最上面一个匹配的父级节点
            closest: function (selector, context) {
                var nodes = [], collection = typeof selector == 'object' && $(selector)
                this.each(function (_, node) {
                    while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))//collection为对象时，判断当前节点是否在对象中，，不为对象时，则判断当前node和selector表达式是否契合
                        node = node !== context && !isDocument(node) && node.parentNode//逐级往上走，document节点除外
                    if (node && nodes.indexOf(node) < 0) nodes.push(node)
                })
                return $(nodes)
            },
            //与closest相似，但parents值匹配所有符合要求的父级元素
            parents: function (selector) {
                var ancestors = [], nodes = this
                while (nodes.length > 0)
                    nodes = $.map(nodes, function (node) {
                        if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
                            ancestors.push(node)
                            return node
                        }
                    })
                return filtered(ancestors, selector)
            },
            //返回符合要求的直接父级节点
            parent: function (selector) {
                return filtered(uniq(this.pluck('parentNode')), selector)
            },
            //获取所有元素的子节点，并用selector进行筛选
            children: function (selector) {
                return filtered(this.map(function () {
                    return children(this)
                }), selector)
            },
            //返回每个元素的内容
            contents: function () {
                return this.map(function () {
                    return this.contentDocument || slice.call(this.childNodes)//frame节点时返回对应文档，其他的返回子节点
                })
            },
            //获取符合条件的兄弟节点
            siblings: function (selector) {
                return filtered(this.map(function (i, el) {
                    return filter.call(children(el.parentNode), function (child) {
                        return child !== el
                    })
                }), selector)
            },
            //清空所有子元素
            empty: function () {
                return this.each(function () {
                    this.innerHTML = ''
                })
            },
            // `pluck` is borrowed from Prototype.js
            //遍历元素列表，获取某个特定的属性的值拼成一个数组返回
            pluck: function (property) {
                return $.map(this, function (el) {
                    return el[property]
                })
            },
            //显示所有元素
            show: function () {
                return this.each(function () {
                    this.style.display == "none" && (this.style.display = '')
                    if (getComputedStyle(this, '').getPropertyValue("display") == "none")
                        this.style.display = defaultDisplay(this.nodeName)
                })
            },
            //替换当前节点
            replaceWith: function (newContent) {
                return this.before(newContent).remove()//在当前节点插入新节点，随后删除当前节点
            },
            // 在每个匹配的元素外层包上一个html元素。structure参数可以是一个单独的元素或者一些嵌套的元素。也可以是一个html字符串片段或者dom节点。还可以是一个生成用来包元素的回调函数，这个函数返回前两种类型的包裹片段。
            wrap: function (structure) {
                var func = isFunction(structure)
                if (this[0] && !func)
                    var dom = $(structure).get(0),//获取当前元素的第一个子节点，支持多种形式的元素如dom节点，html字符串原因在于此处用了$构造函数初始化
                        clone = dom.parentNode || this.length > 1//存在父节点，则dom存在于当前dom文档中，需要复制节点，防止改变原有dom结构

                //对所有子节点调用wrapAll
                return this.each(function (index) {
                    $(this).wrapAll(
                        func ? structure.call(this, index) ://支持返回包裹元素的函数形式
                            clone ? dom.cloneNode(true) : dom
                    )
                })
            },
            //在当前元素外面包裹元素
            wrapAll: function (structure) {
                if (this[0]) {
                    //插入到同级节点
                    $(this[0]).before(structure = $(structure))
                    var children
                    // drill down to the inmost element
                    //一直往下走，直到没有子节点位置
                    while ((children = structure.children()).length) structure = children.first();
                    //将当前节点包裹进去
                    $(structure).append(this)
                }
                return this
            },
            //将当前每一个子节点的内容包裹在structure中，structure支持节点，函数
            wrapInner: function (structure) {
                var func = isFunction(structure)
                return this.each(function (index) {
                    var self = $(this), contents = self.contents(),
                        dom = func ? structure.call(this, index) : structure//兼容函数和节点
                    contents.length ? contents.wrapAll(dom) : self.append(dom)//仅有一个子节点时直接用append
                })
            },
            //解套，去除当前元素的第一层包裹
            unwrap: function () {
                this.parent().each(function () {
                    $(this).replaceWith($(this).children())
                })
                return this
            },

            //深度克隆当前元素，并返回克隆的子节点列表
            clone: function () {
                return this.map(function () {
                    return this.cloneNode(true)
                })
            },
            //隐藏当前元素
            hide: function () {
                return this.css("display", "none")
            },
            //切换显示或隐藏，setting为true显示，false隐藏
            toggle: function (setting) {
                return this.each(function () {
                    var el = $(this);
                    //setting不显式传入时，根据当前的display属性，按相反切换
                    (setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
                })
            },
            //获取当前对象的所有节点的上一个兄弟节点，支持筛选器
            prev: function (selector) {
                return $(this.pluck('previousElementSibling')).filter(selector || '*')
            },
            //获取当前对象的所有节点的下一个兄弟节点，支持筛选器
            next: function (selector) {
                return $(this.pluck('nextElementSibling')).filter(selector || '*')
            },
            //获取或修改当前内容
            html: function (html) {
                return 0 in arguments ?//相当于arguments.length>=1
                    this.each(function (idx) {
                        var originHtml = this.innerHTML
                        $(this).empty().append(funcArg(this, html, idx, originHtml))//清空当前节点的内容，放入新的内容，支持函数，会传入新的html和旧的html内容
                    }) :
                    (0 in this ? this[0].innerHTML : null)//无参数时返回当前内容
            },
            //设置当前所有元素的文本
            text: function (text) {
                return 0 in arguments ?
                    this.each(function (idx) {
                        var newText = funcArg(this, text, idx, this.textContent)
                        this.textContent = newText == null ? '' : '' + newText//利用textContent设置节点文本
                    }) :
                    (0 in this ? this.pluck('textContent').join("") : null)
            },
            //获取或设置属性
            attr: function (name, value) {
                var result
                return (typeof name == 'string' && !(1 in arguments)) ?
                    (0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) ://传入一个参数，获取属性值
                    this.each(function (idx) {
                        if (this.nodeType !== 1) return//非element，直接返回，没有获取attribute的必要
                        if (isObject(name)) for (key in name) setAttribute(this, key, name[key])//对于object或array，直接配置键值对作为attribute
                        else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))//对于字符串的以value为值进行配置
                    })
            },
            //移除属性，支持多个属性名用空格隔开的字符串
            removeAttr: function (name) {
                return this.each(function () {
                    this.nodeType === 1 && name.split(' ').forEach(function (attribute) {
                        setAttribute(this, attribute)//不传入属性值，即为移除
                    }, this)
                })
            },
            //读取或设置dom属性
            prop: function (name, value) {
                name = propMap[name] || name//转换class等保留字
                return (1 in arguments) ?//参数值多于一个，遍历所有元素设置属性值
                    this.each(function (idx) {
                        this[name] = funcArg(this, value, idx, this[name])
                    }) :
                    (this[0] && this[0][name])//返回属性值
            },
            //移除属性值
            removeProp: function (name) {
                name = propMap[name] || name//转换class等保留字
                return this.each(function () {
                    delete this[name]//直接移除
                })
            },
            //读取或写入dom的 data-* 属性，html5 data规范
            data: function (name, value) {
                var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()//转化为data-xxx形式，html5的data

                var data = (1 in arguments) ?
                    this.attr(attrName, value) ://设置属性
                    this.attr(attrName)//返回属性

                return data !== null ? deserializeValue(data) : undefined//返回属性值时将属性值反序列化之后返回
            },
            //获取或设置value属性，支持传入函数，不传入值时返回第一个元素的value
            val: function (value) {
                if (0 in arguments) {
                    if (value == null) value = ""
                    //设置所有元素的value
                    return this.each(function (idx) {
                        this.value = funcArg(this, value, idx, this.value)
                    })
                } else {
                    return this[0] && (this[0].multiple ?
                        $(this[0]).find('option').filter(function () {
                            return this.selected
                        }).pluck('value') ://这里是对多选select元素进行操作，遍历所有子节点获取选中项
                        this[0].value)
                }
            },
            //传入参数时，设置对于document的偏移，包括top,left，不传参数时，返回自身长宽已经相对于document的left和top
            offset: function (coordinates) {
                if (coordinates) return this.each(function (index) {
                    var $this = $(this),
                        coords = funcArg(this, coordinates, index, $this.offset()),//获取配置参数
                        parentOffset = $this.offsetParent().offset(),//父节点偏移量
                        props = {
                            top: coords.top - parentOffset.top,//相对于document偏移量=父节点偏移量+节点对于父节点的偏移量（fixed，absolute）或节点对于自身的偏移量(relative)
                            left: coords.left - parentOffset.left
                        }

                    if ($this.css('position') == 'static') props['position'] = 'relative'
                    $this.css(props)
                })
                if (!this.length) return null//不存在元素，直接返回
                if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0]))//html元素外的元素
                    return {top: 0, left: 0}
                var obj = this[0].getBoundingClientRect()//这个方法返回一个矩形对象，包含四个属性：left、top、right和bottom。分别表示元素各边与页面上边和左边的距离
                return {
                    left: obj.left + window.pageXOffset,//加上滚动距离，即为距离根节点的距离
                    top: obj.top + window.pageYOffset,
                    width: Math.round(obj.width),//舍入为最接近的整数
                    height: Math.round(obj.height)
                }
            },
            //操作css属性的方法，value不传值时返回当前属性，传入时为修改，property支持字符串和数组
            css: function (property, value) {
                if (arguments.length < 2) {
                    var element = this[0]
                    if (typeof property == 'string') {//获取单个css属性
                        if (!element) return
                        return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property)//获取当前节点特定的css样式
                    } else if (isArray(property)) {//获取属性列表
                        if (!element) return
                        var props = {}
                        var computedStyle = getComputedStyle(element, '')
                        $.each(property, function (_, prop) {
                            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
                        })
                        return props//返回集合
                    }
                }

                var css = ''
                if (type(property) == 'string') {
                    if (!value && value !== 0)//此处应是如null，意为移除当前css,'',显式传入undefined时
                        this.each(function () {
                            this.style.removeProperty(dasherize(property))//移除css属性
                        })
                    else
                        css = dasherize(property) + ":" + maybeAddPx(property, value)//拼凑css字符串
                } else {
                    //property传入数组
                    for (key in property)
                        if (!property[key] && property[key] !== 0)//同上，移除整个列表的css属性
                            this.each(function () {
                                this.style.removeProperty(dasherize(key))
                            })
                        else
                            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
                }

                return this.each(function () {
                    this.style.cssText += ';' + css//直接将属性写入style中
                })
            },
            //传入参数时返回传入节点在当前元素列表中的位置，否则返回当前第一个元素在父节点中的位置
            index: function (element) {
                return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
            },
            //判断当前实例的集合中是否存在指定name的class
            hasClass: function (name) {
                if (!name) return false
                return emptyArray.some.call(this, function (el) {
                    return this.test(className(el))
                }, classRE(name))
            },
            //添加class
            addClass: function (name) {
                if (!name) return this
                return this.each(function (idx) {
                    if (!('className' in this)) return//不支持className直接返回
                    classList = []
                    //先获取当前class
                    var cls = className(this), newName = funcArg(this, name, idx, cls)
                    //支持用空格隔开的字符串
                    newName.split(/\s+/g).forEach(function (klass) {
                        if (!$(this).hasClass(klass)) classList.push(klass)//仅添加新class
                    }, this)
                    classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))//合并最终classs并添加
                })
            },
            //移除classname
            removeClass: function (name) {
                return this.each(function (idx) {
                    if (!('className' in this)) return
                    if (name === undefined) return className(this, '')//清空所有的class
                    classList = className(this)
                    funcArg(this, name, idx, classList).split(/\s+/g).forEach(function (klass) {
                        classList = classList.replace(classRE(klass), " ")//移除匹配的属性
                    })
                    className(this, classList.trim())//重新设置classname
                })
            },
            //当前class有则移除，无则添加
            toggleClass: function (name, when) {
                if (!name) return this
                return this.each(function (idx) {
                    var $this = $(this), names = funcArg(this, name, idx, className(this))
                    names.split(/\s+/g).forEach(function (klass) {
                        (when === undefined ? !$this.hasClass(klass) : when) ?
                            $this.addClass(klass) : $this.removeClass(klass)
                    })
                })
            },

            //获取或设置当前元素的scrollTop
            scrollTop: function (value) {
                if (!this.length) return
                var hasScrollTop = 'scrollTop' in this[0]
                if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset//没传入value时，当前元素如有scrollTop,返回当前元素的，否则返回文档的滚动距离
                //设置所有元素的滚动距离
                return this.each(hasScrollTop ?
                    function () {
                        this.scrollTop = value
                    } :
                    function () {
                        this.scrollTo(this.scrollX, value)//不兼容scrollTop时，使用scrollTo
                    })
            },
            //基本如上
            scrollLeft: function (value) {
                if (!this.length) return
                var hasScrollLeft = 'scrollLeft' in this[0]
                if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
                return this.each(hasScrollLeft ?
                    function () {
                        this.scrollLeft = value
                    } :
                    function () {
                        this.scrollTo(value, this.scrollY)
                    })
            },
            //放回position,仅相对于已定位元素有用
            position: function () {
                if (!this.length) return

                var elem = this[0],
                    // Get *real* offsetParent
                    offsetParent = this.offsetParent(),
                    // Get correct offsets
                    offset = this.offset(),//当前元素性对于document的位置
                    parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? {top: 0, left: 0} : offsetParent.offset()//offsetParent相对于document的位置

                // Subtract element margins
                // note: when an element has margin: auto the offsetLeft and marginLeft
                // are the same in Safari causing offset.left to incorrectly be 0
                //移除margin的干扰
                offset.top -= parseFloat($(elem).css('margin-top')) || 0
                offset.left -= parseFloat($(elem).css('margin-left')) || 0

                // Add offsetParent borders
                //移除border宽度的干扰
                parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0
                parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0

                // Subtract the two offsets
                return {
                    top: offset.top - parentOffset.top,
                    left: offset.left - parentOffset.left
                }
            },
            //获取offsetParent，找到第一个定位过的祖先元素，意味着它的css中的position 属性值为“relative”, “absolute” or “fixed”
            offsetParent: function () {
                return this.map(function () {
                    var parent = this.offsetParent || document.body
                    while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")//此处最后一个判定条件应是兼容，防止部分浏览器获取到未定位的元素
                        parent = parent.offsetParent
                    return parent
                })
            }
        }

        // for now
        $.fn.detach = $.fn.remove

        // Generate the `width` and `height` functions
        //定义widht和height函数
        ;['width', 'height'].forEach(function (dimension) {
            var dimensionProperty =
                dimension.replace(/./, function (m) {
                    return m[0].toUpperCase()//首字母大写
                })

            $.fn[dimension] = function (value) {
                var offset, el = this[0]
                if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] ://innerHeight
                    isDocument(el) ? el.documentElement['scroll' + dimensionProperty] ://scrollHeight
                        (offset = this.offset()) && offset[dimension]//返回自身宽高
                else return this.each(function (idx) {
                    el = $(this)
                    el.css(dimension, funcArg(this, value, idx, el[dimension]()))//设置宽高
                })
            }
        })

        //对当前节点及子节点递归执行fun函数
        function traverseNode(node, fun) {
            fun(node)
            for (var i = 0, len = node.childNodes.length; i < len; i++)
                traverseNode(node.childNodes[i], fun)
        }

        //初始化after，prepend，before，append
        // Generate the `after`, `prepend`, `before`, `append`,
        // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
        adjacencyOperators.forEach(function (operator, operatorIndex) {
            var inside = operatorIndex % 2 //=> prepend, append

            $.fn[operator] = function () {
                // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
                //提取出所有需要操作的节点，构造成数组
                var argType, nodes = $.map(arguments, function (arg) {
                        var arr = []
                        argType = type(arg)
                        if (argType == "array") {
                            arg.forEach(function (el) {
                                if (el.nodeType !== undefined) return arr.push(el)
                                else if ($.zepto.isZ(el)) return arr = arr.concat(el.get())
                                arr = arr.concat(zepto.fragment(el))
                            })
                            return arr
                        }
                        return argType == "object" || arg == null ?
                            arg : zepto.fragment(arg)
                    }),
                    parent, copyByClone = this.length > 1
                if (nodes.length < 1) return this

                return this.each(function (_, target) {
                    parent = inside ? target : target.parentNode

                    // convert all methods to a "before" operation
                    //通过变换parent和target节点，将四个方法统一转化成用before操作，最终用insertbefore操作来执行
                    target = operatorIndex == 0 ? target.nextSibling :
                        operatorIndex == 1 ? target.firstChild :
                            operatorIndex == 2 ? target :
                                null

                    var parentInDocument = $.contains(document.documentElement, parent)

                    nodes.forEach(function (node) {
                        if (copyByClone) node = node.cloneNode(true)//当前对象有多个节点时，需要有多次插入，必须做节点复制
                        else if (!parent) return $(node).remove()//此处应是处理顶级html元素,防止在html同级插入元素导致报错

                        parent.insertBefore(node, target)
                        //此处处理所有内嵌的script标签，对内嵌的脚本进行立即执行
                        if (parentInDocument) traverseNode(node, function (el) {
                            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
                                (!el.type || el.type === 'text/javascript') && !el.src) {
                                var target = el.ownerDocument ? el.ownerDocument.defaultView : window
                                target['eval'].call(target, el.innerHTML)
                            }
                        })
                    })
                })
            }

            // after    => insertAfter
            // prepend  => prependTo
            // before   => insertBefore
            // append   => appendTo
            $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function (html) {
                $(html)[operator](this)
                return this
            }
        })

        zepto.Z.prototype = Z.prototype = $.fn//Z继承自$.fn，获得$.fn的所有能力

        // Export internal API functions in the `$.zepto` namespace
        zepto.uniq = uniq//去重函数
        zepto.deserializeValue = deserializeValue
        $.zepto = zepto

        return $
    })()

    window.Zepto = Zepto
    window.$ === undefined && (window.$ = Zepto)

    //事件处理
    ;(function ($) {
        var _zid = 1,//应该是一个内部的uuid
            undefined,
            slice = Array.prototype.slice,
            isFunction = $.isFunction,
            isString = function (obj) {
                return typeof obj == 'string'
            },
            handlers = {},
            specialEvents = {},
            focusinSupported = 'onfocusin' in window,//是否支持onfocusin，与onfocus的区别在于onfocus不支持冒泡
            focus = {focus: 'focusin', blur: 'focusout'},//转化成支持冒泡的事件
            hover = {mouseenter: 'mouseover', mouseleave: 'mouseout'}//依旧是转化成支持冒泡的事件

        specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

        //获取唯一id
        function zid(element) {
            return element._zid || (element._zid = _zid++)
        }

        //找到事件绑定的执行函数
        function findHandlers(element, event, fn, selector) {
            event = parse(event)
            if (event.ns) var matcher = matcherFor(event.ns)
            return (handlers[zid(element)] || []).filter(function (handler) {
                return handler
                    && (!event.e || handler.e == event.e)
                    && (!event.ns || matcher.test(handler.ns))
                    && (!fn || zid(handler.fn) === zid(fn))
                    && (!selector || handler.sel == selector)
            })
        }

        //转换事件对象，实现事件命名空间
        function parse(event) {
            var parts = ('' + event).split('.')
            return {e: parts[0], ns: parts.slice(1).sort().join(' ')}//真实事件存放在e中，命名空间存放在ns中
        }

        //构造匹配命名空间的正则
        function matcherFor(ns) {
            return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
        }

        function eventCapture(handler, captureSetting) {
            return handler.del &&
                (!focusinSupported && (handler.e in focus)) ||
                !!captureSetting
        }

        function realEvent(type) {
            return hover[type] || (focusinSupported && focus[type]) || type
        }

        //绑定事件
        function add(element, events, fn, data, selector, delegator, capture) {
            var id = zid(element), set = (handlers[id] || (handlers[id] = []))//缓存当前对象所绑定的所有事件
            events.split(/\s/).forEach(function (event) {
                if (event == 'ready') return $(document).ready(fn)//页面加载完成事件
                var handler = parse(event)//获取事件对象，实现事件命名空间
                handler.fn = fn
                handler.sel = selector
                // emulate mouseenter, mouseleave
                //mouseenter, mouseleave转化为mouseover,mouseout，
                // 对于 mouseover 事件来说，该属性是鼠标指针移到目标节点上时所离开的那个节点。对于 mouseout 事件来说，该属性是离开目标时，鼠标指针进入的节点。
                //因为mouseover和mouseout支持冒泡，此处排除掉在组件内部移动时，离开子节点触发的情况
                if (handler.e in hover) fn = function (e) {
                    var related = e.relatedTarget
                    if (!related || (related !== this && !$.contains(this, related)))
                        return handler.fn.apply(this, arguments)
                }
                handler.del = delegator//事件代理
                var callback = delegator || fn
                handler.proxy = function (e) {
                    e = compatible(e)
                    if (e.isImmediatePropagationStopped()) return//事件已被取消
                    e.data = data
                    var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
                    if (result === false) e.preventDefault(), e.stopPropagation()//返回值为false是取消默认操作，阻止冒泡
                    return result
                }
                handler.i = set.length
                set.push(handler)
                if ('addEventListener' in element)
                    element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))//绑定事件
            })
        }

        //对事件进行解绑
        function remove(element, events, fn, selector, capture) {
            var id = zid(element);//获取当前自定义id
            (events || '').split(/\s/).forEach(function (event) {
                findHandlers(element, event, fn, selector).forEach(function (handler) {
                    delete handlers[id][handler.i]//将函数从缓存中删除，避免下次再次命中
                    if ('removeEventListener' in element)
                        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))//解绑函数
                })
            })
        }

        $.event = {add: add, remove: remove}

        //代理函数，返回一个绑定了上下文的函数
        $.proxy = function (fn, context) {
            var args = (2 in arguments) && slice.call(arguments, 2)//获取剩余未定义的参数
            if (isFunction(fn)) {
                var proxyFn = function () {
                    return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments)
                }
                proxyFn._zid = zid(fn)
                return proxyFn
            } else if (isString(context)) {//另外一种方式，当前不传入特定的执行函数，第一个函数传入context,对应的执行函数从context.context中读取，此时context需要传入一个字符串用来标识执行函数所在的属性名
                if (args) {
                    args.unshift(fn[context], fn)//存在多于2个参数时，将取得的函数置于队列最前方，重新调用proxy
                    return $.proxy.apply(null, args)
                } else {
                    return $.proxy(fn[context], fn)
                }
            } else {
                throw new TypeError("expected function")
            }
        }

        //on事件的转换器，大概是为了兼容jquery
        $.fn.bind = function (event, data, callback) {
            return this.on(event, data, callback)
        }
        //off事件的转换器，大概是为了兼容jquery
        $.fn.unbind = function (event, callback) {
            return this.off(event, callback)
        }
        //仅绑定事件执行一次
        $.fn.one = function (event, selector, data, callback) {
            return this.on(event, selector, data, callback, 1)
        }

    //构造一个函数，支持返回true
        var returnTrue = function () {
                return true
            },
            //构造一个函数，支持返回false
            returnFalse = function () {
                return false
            },
            ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
            eventMethods = {
                preventDefault: 'isDefaultPrevented',
                stopImmediatePropagation: 'isImmediatePropagationStopped',
                stopPropagation: 'isPropagationStopped'
            }

            //包装代理事件类型
        function compatible(event, source) {
            if (source || !event.isDefaultPrevented) {
                source || (source = event)

                //将event中的方法添加到代理，并添加标识
                $.each(eventMethods, function (name, predicate) {
                    var sourceMethod = source[name]
                    event[name] = function () {
                        this[predicate] = returnTrue//执行之后将标识设置为true，标识已执行过，例如默认操作已被阻止，冒泡被取消等等
                        return sourceMethod && sourceMethod.apply(source, arguments)
                    }
                    event[predicate] = returnFalse
                })

                event.timeStamp || (event.timeStamp = Date.now())//添加时间戳

                if (source.defaultPrevented !== undefined ? source.defaultPrevented :
                        'returnValue' in source ? source.returnValue === false :
                            source.getPreventDefault && source.getPreventDefault())//defaultPrevented,returnVlaue,getPreventDefault都是不同标准下标识当前默认操作是否被取消，defaultPrevented为最新标准，其他两个目前已经被取消
                    event.isDefaultPrevented = returnTrue//将当前是否已被取消默认操作包装到代理事件中
            }
            return event
        }

        //构造代理事件
        function createProxy(event) {
            var key, proxy = {originalEvent: event}
            for (key in event)
                //清除掉多余的属性后复制一份自定义事件
                if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

            return compatible(proxy, event)
        }

        //基于当前元素绑定事件，通过选择器匹配绑定的子组件组件
        $.fn.delegate = function (selector, event, callback) {
            return this.on(event, selector, callback)
        }
        //基于当前元素的解绑
        $.fn.undelegate = function (selector, event, callback) {
            return this.off(event, selector, callback)
        }

        //基于body的绑定，delegate的二次包装
        $.fn.live = function (event, callback) {
            $(document.body).delegate(this.selector, event, callback)
            return this
        }
        //基于body的解绑
        $.fn.die = function (event, callback) {
            $(document.body).undelegate(this.selector, event, callback)
            return this
        }

        //绑定事件，可通过空格隔开绑定多个事件，也可传入键值对绑定事件，返回false时会阻止默认事件和冒泡，支持选择器
        $.fn.on = function (event, selector, data, callback, one) {
            var autoRemove, delegator, $this = this
            if (event && !isString(event)) {//传入键值对obj，此处循环调用on函数绑定
                $.each(event, function (type, fn) {
                    $this.on(type, selector, data, fn, one)
                })
                return $this
            }

            //没有筛选器selecter的情况，所有参数往前移
            if (!isString(selector) && !isFunction(callback) && callback !== false)
                callback = data, data = selector, selector = undefined
            //$(document).on('click', 'nav a', false)这种形式，相当于callback传入false
            if (callback === undefined || data === false)
                callback = data, data = undefined
            //callback为false时绑定一个返回false的函数
            if (callback === false) callback = returnFalse

            return $this.each(function (_, element) {
                //one有值时，定义移除函数，回调仅执行一次
                if (one) autoRemove = function (e) {
                    remove(element, e.type, callback)
                    return callback.apply(this, arguments)
                }

                //事件委托，当存在选择器时，事件是直接绑定在当前节点上，选择器上面的方法冒泡到当前节点上执行
                if (selector) delegator = function (e) {
                    var evt, match = $(e.target).closest(selector, element).get(0)//寻找最近的根节点
                    if (match && match !== element) {
                        evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
                        return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))//回调函数绑定作用域
                    }
                }

                add(element, event, callback, data, selector, delegator || autoRemove)
            })
        }
        //解绑操作
        $.fn.off = function (event, selector, callback) {
            var $this = this
            if (event && !isString(event)) {
                //批量解绑事件
                $.each(event, function (type, fn) {
                    $this.off(type, selector, fn)
                })
                return $this
            }

            //参数前移，不带选择器的情况下
            if (!isString(selector) && !isFunction(callback) && callback !== false)
                callback = selector, selector = undefined

            if (callback === false) callback = returnFalse

            //对当前选中的元素全部解绑
            return $this.each(function () {
                remove(this, event, callback, selector)
            })
        }

        //模拟触发事件
        $.fn.trigger = function (event, args) {
            event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
            event._args = args
            return this.each(function () {
                // handle focus(), blur() by calling them directly
                if (event.type in focus && typeof this[event.type] == "function") this[event.type]()
                // items in the collection might not be DOM elements
                else if ('dispatchEvent' in this) this.dispatchEvent(event)
                else $(this).triggerHandler(event, args)
            })
        }

        // triggers event handlers on current element just as if an event occurred,
        // doesn't trigger an actual event, doesn't bubble
        //此处是一个兼容，兼容不支持dispatchEvent的情况，通过对事件名称进行匹配，从handlers中取得对应的函数并触发
        $.fn.triggerHandler = function (event, args) {
            var e, result
            this.each(function (i, element) {
                e = createProxy(isString(event) ? $.Event(event) : event)
                e._args = args
                e.target = element
                $.each(findHandlers(element, event.type || event), function (i, handler) {
                    result = handler.proxy(e)
                    if (e.isImmediatePropagationStopped()) return false
                })
            })
            return result
        }

        // shortcut methods for `.bind(event, fn)` for each event type
        //触发或者绑定事件，不传入事件时，模拟触发对应的事件
        ;('focusin focusout focus blur load resize scroll unload click dblclick ' +
            'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
            'change select keydown keypress keyup error').split(' ').forEach(function (event) {
            $.fn[event] = function (callback) {
                return (0 in arguments) ?
                    this.bind(event, callback) :
                    this.trigger(event)
            }
        })

        //构建事件对象
        $.Event = function (type, props) {
            if (!isString(type)) props = type, type = props.type
            var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
            if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
            event.initEvent(type, bubbles, true)
            return compatible(event)
        }

    })(Zepto)

    //ajax实现
    ;(function ($) {
        var jsonpID = +new Date(),
            document = window.document,
            key,
            name,
            rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            scriptTypeRE = /^(?:text|application)\/javascript/i,
            xmlTypeRE = /^(?:text|application)\/xml/i,
            jsonType = 'application/json',
            htmlType = 'text/html',
            blankRE = /^\s*$/,
            originAnchor = document.createElement('a')

        //构建a标签，指向当前访问地址
        originAnchor.href = window.location.href

        // trigger a custom event and return false if it was cancelled
        //模拟触发一个事件，返回当前事件是否已经被取消默认操作
        function triggerAndReturn(context, eventName, data) {
            var event = $.Event(eventName)
            $(context).trigger(event, data)
            return !event.isDefaultPrevented()
        }

        // 触发全局事件，如无指定context，则指定为document对象
        function triggerGlobal(settings, context, eventName, data) {
            if (settings.global) return triggerAndReturn(context || document, eventName, data)
        }

        // ajax请求标识当前进行中的ajax请求数量
        $.active = 0

        //触发一个名为ajaxStart的自定义事件，所有ajax请求开始发生
        function ajaxStart(settings) {
            if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
        }

        //触发一个名为ajaxStop的自定义事件，所有ajax结束时发生
        function ajaxStop(settings) {
            if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
        }

        // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
        //调用beforeSend回调，如返回false，则不会继续后面的操作
        function ajaxBeforeSend(xhr, settings) {
            var context = settings.context
            //调用beforeSend回调，如返回false，则不会继续后面的操作
            if (settings.beforeSend.call(context, xhr, settings) === false ||
                triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
                return false

            triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])//发送全局ajaxSend事件
        }

        //ajax成功后的一系列操作
        function ajaxSuccess(data, xhr, settings, deferred) {
            var context = settings.context, status = 'success'
            settings.success.call(context, data, status, xhr)//调用success回调
            if (deferred) deferred.resolveWith(context, [data, status, xhr])//deferred模块兼容
            triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])//触发全局ajaxSuccess事件
            ajaxComplete(status, xhr, settings)
        }

        // type: "timeout", "error", "abort", "parsererror"
        //ajax调用出错后的一系列操作
        function ajaxError(error, type, xhr, settings, deferred) {
            var context = settings.context
            settings.error.call(context, xhr, type, error)//执行error回调
            if (deferred) deferred.rejectWith(context, [xhr, type, error])//deferred模块兼容
            triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])//触发全局ajaxError事件
            ajaxComplete(type, xhr, settings)//执行结束操作
        }

        // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
        //所有ajax结束时统一执行的操作
        function ajaxComplete(status, xhr, settings) {
            var context = settings.context
            settings.complete.call(context, xhr, status)//调用complete回调
            triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])//触发全局ajaxComplete事件
            ajaxStop(settings)//触发全局ajaxStop事件
        }

        //此处调用传入的dataFilter回调，提前筛选返回的ajax响应数据
        function ajaxDataFilter(data, type, settings) {
            if (settings.dataFilter == empty) return data
            var context = settings.context
            return settings.dataFilter.call(context, data, type)
        }

        // Empty function, used as default callback
        //空函数，定义默认配置
        function empty() {
        }

        //jsonp方式执行
        $.ajaxJSONP = function (options, deferred) {
            if (!('type' in options)) return $.ajax(options)//无设置type默认为get请求

            var _callbackName = options.jsonpCallback,
                callbackName = ($.isFunction(_callbackName) ?
                    _callbackName() : _callbackName) || ('Zepto' + (jsonpID++)),//jsonpcallback传入一个字符串或一个函数，用于指定全局回掉函数的名字
                script = document.createElement('script'),
                originalCallback = window[callbackName],//全局回调函数名指定的函数如果已经存在，则会将它存放起来，最后会用执行结果调用
                responseData,
                //定义验证失败函数
                abort = function (errorType) {
                //触发error事件
                    $(script).triggerHandler('error', errorType || 'abort')
                },
                xhr = {abort: abort}, abortTimeout

            if (deferred) deferred.promise(xhr)

            //监听onload和erroe事件
            $(script).on('load error', function (e, errorType) {
                //清除过时计时器
                clearTimeout(abortTimeout)
                $(script).off().remove()//移除添加的script标签

                if (e.type == 'error' || !responseData) {
                    //出错
                    ajaxError(null, errorType || 'error', xhr, options, deferred)
                } else {
                    //执行成功
                    ajaxSuccess(responseData[0], xhr, options, deferred)
                }

                window[callbackName] = originalCallback//重新取得全局回调函数
                if (responseData && $.isFunction(originalCallback))
                    originalCallback(responseData[0])//执行全局回调

                originalCallback = responseData = undefined//将结果跟缓存置空
            })

            //beforeSend回调返回false
            if (ajaxBeforeSend(xhr, options) === false) {
                abort('abort')
                return xhr
            }

            //定义全局方法，将数据存放到responseData中
            window[callbackName] = function () {
                responseData = arguments
            }

            script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)//将占位符替换为回调函数名
            document.head.appendChild(script)//插入script标签发出请求

            //定义timeout，超时时直接失败
            if (options.timeout > 0) abortTimeout = setTimeout(function () {
                abort('timeout')
            }, options.timeout)

            return xhr
        }

        //ajax默认配置
        $.ajaxSettings = {
            // 默认请求方法
            type: 'GET',
            // 请求发出前调用
            beforeSend: empty,
            // 请求成功后回调
            success: empty,
            // 请求出错时调用
            error: empty,
            // 请求完成时调用，无论请求失败或成功。
            complete: empty,
            // 设置回调函数的上下文
            context: null,
            // 请求是否触发全局Ajax事件处理程序
            global: true,
            // 返回xhr对象
            xhr: function () {
                return new window.XMLHttpRequest()
            },
            //  从服务器请求的MIME类型，指定dataType值
            accepts: {
                script: 'text/javascript, application/javascript, application/x-javascript',
                json: jsonType,
                xml: 'application/xml, text/xml',
                html: htmlType,
                text: 'text/plain'
            },
            //是否跨域
            crossDomain: false,
            // 默认超时时间
            timeout: 0,
            // 对于非Get请求。是否自动将 data 转换为字符串
            processData: true,
            // 是否允许缓存GET响应
            cache: true,
            //一个过滤函数，筛选响应的数据，响应数据经过此函数的处理之后才会返回
            dataFilter: empty
        }

        //将mimeType转化成datatype
        function mimeToDataType(mime) {
            if (mime) mime = mime.split(';', 2)[0]
            return mime && (mime == htmlType ? 'html' :
                mime == jsonType ? 'json' :
                    scriptTypeRE.test(mime) ? 'script' :
                        xmlTypeRE.test(mime) && 'xml') || 'text'
        }

        //将参数添加到url后面
        function appendQuery(url, query) {
            if (query == '') return url
            return (url + '&' + query).replace(/[&?]{1,2}/, '?')//将第一个&符号替换为？
        }

        // 请求序列化请求参数，如果是get请求，则添加到url上
        function serializeData(options) {
            if (options.processData && options.data && $.type(options.data) != "string")
                options.data = $.param(options.data, options.traditional)
            if (options.data && (!options.type || options.type.toUpperCase() == 'GET' || 'jsonp' == options.dataType))
                options.url = appendQuery(options.url, options.data), options.data = undefined//url赋值后清空data的值
        }

        //兼容的ajax请求
        $.ajax = function (options) {
            var settings = $.extend({}, options || {}),
                deferred = $.Deferred && $.Deferred(),//此处是用于支持deferred模块，用于支持promise
                urlAnchor, hashIndex
            //没有指定自定义配置的字段使用默认配置
            for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

            //触发请求开始事件
            ajaxStart(settings)

            //无指定是否跨域时，动态创建a标签，利用dom属性对比是否跨域
            if (!settings.crossDomain) {
                urlAnchor = document.createElement('a')
                urlAnchor.href = settings.url
                // cleans up URL for .href (IE only), see https://github.com/madrobby/zepto/pull/1049
                urlAnchor.href = urlAnchor.href
                settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host)
            }

            if (!settings.url) settings.url = window.location.toString()//无请求地址时获取当前url
            if ((hashIndex = settings.url.indexOf('#')) > -1) settings.url = settings.url.slice(0, hashIndex)//url去掉hash部分
            //序列化配置参数
            serializeData(settings)

            var dataType = settings.dataType, hasPlaceholder = /\?.+=\?/.test(settings.url)//如果已经提前按照规则构建好占位符，则直接把dataTpye定义为jsonp
            if (hasPlaceholder) dataType = 'jsonp'

            //不设置缓存时，url后面追加时间戳
            if (settings.cache === false || (
                    (!options || options.cache !== true) &&
                    ('script' == dataType || 'jsonp' == dataType)
                ))
                settings.url = appendQuery(settings.url, '_=' + Date.now())

            //jsonp请求
            if ('jsonp' == dataType) {
                if (!hasPlaceholder)
                    settings.url = appendQuery(settings.url,
                        settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')//此处是构建占位符，把url构建成?abc/sss?test=1&callback=？这种形式，之后的ajaxJSONP方法中会把后面一个？替换成对应的全局函数名
                return $.ajaxJSONP(settings, deferred)
            }

            var mime = settings.accepts[dataType],//获取对应的mime类型
                headers = {},
                setHeader = function (name, value) {
                    headers[name.toLowerCase()] = [name, value]
                },
                protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,//获取协议
                xhr = settings.xhr(),//ajaxSettings默认配置中已配置方法
                nativeSetHeader = xhr.setRequestHeader,
                abortTimeout

            if (deferred) deferred.promise(xhr)//兼容deferred模块

            if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
            setHeader('Accept', mime || '*/*')
            if (mime = settings.mimeType || mime) {
                if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]//取第一个mimetype
                xhr.overrideMimeType && xhr.overrideMimeType(mime)//设置mimeType，按浏览器指定的类型进行操作此处应是修改某些版本浏览器的bug
            }
            if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
                setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

            if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name])
            xhr.setRequestHeader = setHeader

            //请求状态发生改变
            xhr.onreadystatechange = function () {
                //请求完成，响应就绪
                if (xhr.readyState == 4) {
                    xhr.onreadystatechange = empty
                    clearTimeout(abortTimeout)
                    var result, error = false
                    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {//枚举成功status
                        dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))

                        if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob')
                            result = xhr.response
                        else {
                            result = xhr.responseText

                            try {
                                // http://perfectionkills.com/global-eval-what-are-the-options/
                                // sanitize response accordingly if data filter callback provided
                                //对不同数据格式进行处理
                                result = ajaxDataFilter(result, dataType, settings)
                                if (dataType == 'script') (1, eval)(result)
                                else if (dataType == 'xml') result = xhr.responseXML
                                else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
                            } catch (e) {
                                error = e
                            }

                            //触发全局error事件
                            if (error) return ajaxError(error, 'parsererror', xhr, settings, deferred)
                        }
                        //成功
                        ajaxSuccess(result, xhr, settings, deferred)
                    } else {
                        //失败
                        ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
                    }
                }
            }

            //请求前的ajaxBeforeSend验证操作，若返回false，则请求终端
            if (ajaxBeforeSend(xhr, settings) === false) {
                xhr.abort()
                ajaxError(null, 'abort', xhr, settings, deferred)
                return xhr
            }

            var async = 'async' in settings ? settings.async : true//设置请求方式为异步请求
            xhr.open(settings.type, settings.url, async, settings.username, settings.password)//

            if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]//配置中配置的额外属性

            for (name in headers) nativeSetHeader.apply(xhr, headers[name])//调用原生方法设置header

            //超时操作
            if (settings.timeout > 0) abortTimeout = setTimeout(function () {
                xhr.onreadystatechange = empty
                xhr.abort()
                ajaxError(null, 'timeout', xhr, settings, deferred)
            }, settings.timeout)

            // avoid sending empty string (#319)
            xhr.send(settings.data ? settings.data : null)//发送请求
            return xhr
        }

        // handle optional data/success arguments
        //构建$.ajax参数
        function parseArguments(url, data, success, dataType) {
            if ($.isFunction(data)) dataType = success, success = data, data = undefined//不传入data时，参数前移，共三个参数
            if (!$.isFunction(success)) dataType = success, success = undefined//不传入succss时，参数前移，共两个参数
            //构建配置对象
            return {
                url: url
                , data: data
                , success: success
                , dataType: dataType
            }
        }

        //get请求快捷方法
        $.get = function (/* url, data, success, dataType */) {
            return $.ajax(parseArguments.apply(null, arguments))
        }

        //post请求快捷方法
        $.post = function (/* url, data, success, dataType */) {
            var options = parseArguments.apply(null, arguments)
            options.type = 'POST'
            return $.ajax(options)
        }

        //预期返回json请求
        $.getJSON = function (/* url, data, success */) {
            var options = parseArguments.apply(null, arguments)
            options.dataType = 'json'
            return $.ajax(options)
        }

        //通过GET Ajax载入远程 HTML 内容代码并插入至 当前的集合 中。另外，一个css选择器可以在url中指定，像这样，可以使用匹配selector选择器的HTML内容来更新集合。
        $.fn.load = function (url, data, success) {
            if (!this.length) return this//当前选择器无法命中，直接返回
            var self = this, parts = url.split(/\s/), selector,
                options = parseArguments(url, data, success),
                callback = options.success
            if (parts.length > 1) options.url = parts[0], selector = parts[1]//从url中提取出真正的url和选择器
            options.success = function (response) {
                //将获取的节点添加到选择器中
                self.html(selector ?
                    $('<div>').html(response.replace(rscript, "")).find(selector)//筛选出返回数据中匹配选择器的节点
                    : response)
                callback && callback.apply(self, arguments)
            }
            $.ajax(options)//发起请求
            return this
        }

        var escape = encodeURIComponent

        //参数序列化，将序列化后的值存放到paraams中
        function serialize(params, obj, traditional, scope) {
            var type, array = $.isArray(obj), hash = $.isPlainObject(obj)
            $.each(obj, function (key, value) {
                type = $.type(value)
                if (scope) key = traditional ? scope :
                    scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'//从递归传入的对象中提取键值，形式例如test[a]
                // handle data in serializeArray() format
                if (!scope && array) params.add(value.name, value.value)//为数组时，每一项都为对象，获取每一项的name作为key值，获取每一项的value作为值构造字符串
                // traditional为true时，嵌套的对象不进行序列化
                else if (type == "array" || (!traditional && type == "object"))//多重数组或数组里面包含对象
                    serialize(params, value, traditional, key)//递归调用
                else params.add(key, value)
            })
        }

        //序列化一个对象，在Ajax请求中提交的数据使用URL编码的查询字符串表示形式，traditional为true时，嵌套的对象不进行序列化
        $.param = function (obj, traditional) {
            var params = []

            //添加add方法
            params.add = function (key, value) {
                //value为方法时，执行方法获取value
                if ($.isFunction(value)) value = value()
                if (value == null) value = ""
                this.push(escape(key) + '=' + escape(value))//实际执行push，将键值对编码后推入数组中
            }
            //序列化
            serialize(params, obj, traditional)
            //将数组拼接
            return params.join('&').replace(/%20/g, '+')
        }
    })(Zepto)

    //表单序列化
    ;(function ($) {
        //将用作提交的表单元素的值编译成拥有name和value对象组成的数组
        $.fn.serializeArray = function () {
            var name, type, result = [],
                //序列化后添加到数组中
                add = function (value) {
                    if (value.forEach) return value.forEach(add)//对于集合元素，递归调用
                    result.push({name: name, value: value})
                }
            if (this[0]) $.each(this[0].elements, function (_, field) {
                type = field.type, name = field.name
                //去除不需要序列化值的元素
                if (name && field.nodeName.toLowerCase() != 'fieldset' &&
                    !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' &&
                    ((type != 'radio' && type != 'checkbox') || field.checked))
                    add($(field).val())//序列化
            })
            return result
        }
        //在Ajax post请求中将用作提交的表单元素的值编译成 URL编码的 字符串
        $.fn.serialize = function () {
            var result = []
            //序列化表单元素
            this.serializeArray().forEach(function (elm) {
                //序列化后的元素进行编码
                result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
            })
            //拼接字符串
            return result.join('&')
        }

        //为 "submit" 事件绑定一个处理函数，或者触发元素上的 "submit" 事件
        $.fn.submit = function (callback) {
            if (0 in arguments) this.bind('submit', callback)//传入回调函数时，为submit绑定默认事件
            else if (this.length) {
                var event = $.Event('submit')
                this.eq(0).trigger(event)//触发一个submit事件
                if (!event.isDefaultPrevented()) this.get(0).submit()//执行submit操作
            }
            return this
        }

    })(Zepto)

    ;(function () {
        // getComputedStyle shouldn't freak out when called
        // without a valid element as argument
        //此处是为了屏蔽参数为空时抛出的异常，异常发生时，返回null值
        try {
            getComputedStyle(undefined)
        } catch (e) {
            var nativeGetComputedStyle = getComputedStyle
            window.getComputedStyle = function (element, pseudoElement) {
                try {
                    return nativeGetComputedStyle(element, pseudoElement)
                } catch (e) {
                    return null
                }
            }
        }
    })()
    return Zepto
}))
