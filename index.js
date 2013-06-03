;(function(root) {
    var cool = function() {};

    cool.promise = pzero;

    /* cool.store.js begin */
;(function() {

var store = function(name) {
    var mixin = {};

    mixin[name] = function(val) {
        var prop = '_' + name;

        if (arguments.length) {
            this[prop] = val;
        } else {
            return this[prop];
        }
    };

    return mixin;
};

cool.store = store;

})();

/* cool.store.js end */

    /* cool.assert.js begin */
;(function(cool) {

var assert = function(cond, msg) {
    if (cond) { return; }

    var args = xtnd.array(arguments).slice(2);

    throw new Error( cool.assert.msg(msg, args) );
};

assert.re = /(%(\d))/g;

assert.msg = function(msg, args) {
    msg = msg || 'unknown error';

    msg = msg.replace(assert.re, function(a, b, index) {
        return args[index - 1];
    });

    msg = msg.charAt(0).toUpperCase() + msg.substr(1);

    return msg;
};

cool.assert = assert;

})(cool);

/* cool.assert.js end */

    /* cool.events.js begin */
;(function(){

/**
 * Events mixin
 */
var events = {

    /**
     * Listeners store
     *
     * @type Object
     */
    _events: undefined,

    /**
     * Event constructor
     *
     * @private
     *
     * @param {String} type
     * @param {Object} extra
     *
     * @returns Object
     */
    _event: function(type, extra) {

        var event = {
            type: type,
            slave: undefined,
            emitter: this,

            operation: {},
           _prevented: false,
            preventDefault: preventDefault
        };

        xtnd(event, extra);

        return event;
    },

    /**
     * Adds listener for the specified event
     *
     * @param {String} type
     * @param {Function} listener
     * @param {String} slave
     *
     * @returns this
     */
    on: function(type, listener, slave) {
        var events = this._events = this._events || {};

        cool.assert(typeof listener === 'function',
            'listener for %1 should be a function', type);

        if (!events[type]) { events[type] = []; }

        events[type].push({
            listener: listener,
            slave: slave || '*'
        });

        return this;
    },

    /**
     * Removes listener by event/listener/slave
     *
     * @param {String} type
     * @param {Function} listener
     * @param {String} slave
     *
     * @returns this
     */
    off: function(type, listener, slave) {
        var events = this._events;

        if (type) {
            events = events && events[type] && events;
        } else {
            type = xtnd.keys(events);
        }
        if (!events) { return this; }

        xtnd.each(type, function(type) {
            events[type] = events[type].filter(function(item) {
                var exclude = true;
                var slaveMatch = slave === item.slave;
                var listenerMatch = listener === item.listener;

                // exclude all
                if (!slave && !listener) {
                    exclude = true;
                // exclude by slave
                // but can't exclude '*' by specific slave
                } else if (slave && !listener) {
                    exclude = slaveMatch;
                // exclude by listener
                } else if (!slave && listener) {
                    exclude = listenerMatch;
                // exclude by both slave and listener
                } else {
                    exclude = slaveMatch && listenerMatch;
                }

                return !exclude;
            });
        });

        return this;
    },

    /**
     * Adds listener for specified event
     * and removes it after first execution
     *
     * @param {String} type
     * @param {Function} listener
     * @param {Object} slave
     */
    one: function(type, listener, slave) {
        var that = this;

        cool.assert(typeof listener === 'function',
            'listener for %1 should be a function', type);

        var proxy = function() {
            listener.apply(this, arguments);
            that.off(type, proxy, slave);
        };

        this.on(type, proxy, slave);

        return this;
    },

    /**
     * Executes each of the listeners
     *
     * @param {Object|String} event
     * @param {Object} data
     */
    emit: function(event, data) {
        var that = this;
        var events = this._events;

        if (typeof event === 'string') {
            event = this._event(event);
        }

        events = events && events[event.type];

        xtnd.each(events, function(item) {
            if (item.slave === '*' || event.slave === item.slave) {
                item.listener.call(that, event, data);
            }
        });

    }
};

cool.events = events;

function preventDefault() {
    this._prevented = true;
}

})();

/* cool.events.js end */

    /* cool.method.js begin */
;(function() {


var method = function(name, action) {

    if ( xtnd.isObject(name) ) {
        return method.extend(name, action);
    }

    return function() {
        var reply, event, binded, op;
        var that = this;
        var args = xtnd.array(arguments);
        var slave = args[0] instanceof cool ? args[0].name : undefined;

        // console.log(this.name + ' -> ' + name, slave);

        binded = method.bindAction(action, this, args);
        event = this._event(name, {action: binded, slave: slave});
        op = this.operation = event.operation;

        this.emit(event);

        if (!event._prevented) {

            reply = binded();
            event = this._event(name + 'ed', {operation: op, slave: slave});

            if (cool.promise.is(reply)) {
                reply.then(function(data) {
                    that.emit(event, data);
                });
            } else {
                this.emit(event, reply);
            }
        }

        delete this.operation;
        return reply;
    };
};

/**
 * Creates ready for execution action
 * with multiexecution protections
 *
 * @param {Function} action
 * @param {Object} context
 * @param {Array} args
 *
 * @returns Function
 */
method.bindAction = function(action, context, args) {
    var reply, resolved = false;

    return function() {
        if (!resolved) {
            reply = action.apply(context, args);
            resolved = true;
        }

        return reply;
    };
};

/**
 * Binds set of methods to destination object
 *
 * @param {Object} dest
 * @param {Object} props
 *
 * @returns Object
 */
method.extend = function(dest, props) {

    xtnd.each(props, function(action, name) {
        dest[name] = method(name, action);
    });

    return dest;
};

cool.method = method;

})();

/* cool.method.js end */

    /* cool.factory.js begin */
;(function() {

function factory(type, proto) {

    cool[type] = function (desc, params, data) {
        if (this instanceof cool[type]) { return; }

        return cool[type].ctor(desc, params, data);
    };

    // instanceof chain
    cool[type].prototype = new cool();

    // prototype
    xtnd(cool[type].prototype, cool.events, proto);

    // static
    xtnd(cool[type],
        factory,
        { _type: type, _insts: {}, _ctors: {}, _events: {} }
    );
}

xtnd(factory, {

    ctor: function(desc, params, data) {

        // view defenition
        if (typeof desc === 'object') {
            return this.define(desc.name, desc);

        // view instatntiation
        } else if (typeof desc === 'string') {
            data = data || {};
            params = params || {};

            return this.create(desc, params, data);
        }
    },

    define: function(name, desc) {
        var ctor;
        var type = this._type;
        var ctors = this._ctors;

        cool.assert(name, 'Property "name" is mandatory.');
        cool.assert(!ctors[name], '%1 "%2" is already defined.', type, name);

        ctor = ctors[name] = function() {};
        ctor.prototype = new cool[type]();
        xtnd( ctor.prototype, desc );

        return cool;
    },

    create: function(name, params, data) {
        /* jshint -W101 */
        var inst;
        var type = this._type;
        var ctor = this._ctors[name];
        var insts = this._insts;

        // ensure we have a ctor
        cool.assert(ctor, '%1 "%2" in not defined. Use cool.%1({name: "%2"}).', type, name);

        // creating new instance
        inst = new ctor();

        // binding events
        events[type](inst);

        // initializing
        inst.init(params, data);

        // ensure instances store
        if (!insts[name]) { insts[name] = []; }

        // add instance to store
        insts[name].push( inst );

        return inst;
    }

});

cool.factory = factory;

var events = {

    re: /^(?:(.+?)\s*->\s*)?([^\s]+)(?:\s+(.*))?$/,

    /**
     * Parses event descriptions, which could be:
     * @example
     *
     *           submit
     *  form  -> submit
     *           append
     *  view  -> append
     *  view  -> append subview
     *  model -> fetch
     *
     * @param {String} desc
     *
     * @returns Object
     */
    info: function(desc) {
        var info = {};
        var match = desc.match(this.re);

        cool.assert(match, 'wrong event format %1', desc);

        info.type = match[2];

        if (info.type in events.DOM) {
            info.kind = 'dom';
        } else if (info.type in cool.model.EVENTS) {
            info.kind = 'model';
        } else {
            info.kind = 'view';
        }

        info.slave = match[3] || info.kind === 'view' && '*' || '';
        info.master = match[1] || 'this';
        info.context = info.kind === 'dom' ? 'this' : '';


        return info;
    },

    /**
     * Initialize events for the view
     *
     * @param {cool.view} view
     */
    view: function(view) {
        view.events = view.events || {};

        var parsed = events.parse(view);

        view.one('rendered', function() {
            events.dom(view, parsed);
        });

        events.on(view, parsed);
        events.restore(view, 'view');
    },

    /**
     * Binds events from queue for model
     *
     * @param {cool.model} model
     */
    model: function(model) {
        events.restore(model, 'model');
    },

    /**
     * Parses user's defined events
     *
     * @param {cool.view} view
     */
    parse: function(view) {
        var parsed = [];

        xtnd.each(view.events, function(listener, desc) {
            var info = events.info(desc);
            listener = typeof listener === 'function' ?
                listener : view[listener];

            cool.assert(typeof listener === 'function',
                'listener for "%1" should be a function', desc);

            info.listener = listener.bind(view);

            parsed.push( info );
        });

        return parsed;
    },

    /**
     * Stores custom events for instances
     * which will be created later
     *
     * @param {cool.view} view
     * @param {Array} parsed
     */
    on: function(view, parsed) {
        var that = this;

        xtnd.each(parsed, function(info) {
            if (!(/view|model/).test(info.kind)) { return; }

            var store = cool[info.kind]._insts;

            if (info.master === 'this') {
                // bind event only for current view
                view.on(info.type, info.listener, info.slave);
            } else {

                // bind current event to existing views and models
                xtnd.each(store, function(inst) {
                    if (inst.name === info.master) {
                        inst.on(info.type, info.listener, info.slave);
                    }
                });

                that.store(view, info);
            }
        });
    },

    /**
     * Stores event in queue of events
     *
     * @param {cool.view} view
     * @param {Object} info
     */
    store: function(view, info) {
        var queue = cool[info.kind]._events;

        if (!queue[ info.master ]) {
            queue[ info.master ] = [];
        }

        // add to queue for upcoming views and models
        queue[ info.master ].push({
            type: info.type,
            slave: info.slave,
            listener: info.listener
        });
    },

    /**
     * Restores all events from queue
     * and binds them to current instance
     *
     * @param {cool} inst
     * @param {String} kind
     */
    restore: function(inst, kind) {
        var queue = cool[kind]._events;

        xtnd.each(queue[ inst.name ], function(evt) {
            inst.on(evt.type, evt.listener, evt.slave);
        });
    },

    /**
     * Unbinds custom events
     *
     * @param {cool.view} view
     */
    off: function(view) {
        return view;
    },

    /**
     * Binds dom events
     *
     * @param {cool.view} view
     * @param {Array} parsed
     */
    dom: function(view, parsed) {

        xtnd.each(parsed, function(info) {
            if (info.kind !== 'dom') { return; }

            if (info.master === 'this') {
                view.el.on(info.type, info.listener);
            } else {
                view.el.on(info.type, info.master, info.listener);
            }
        });
    },

    DOM: xtnd.hash([
        'blur',
        'change',
        'click',
        'dblclick',
        'dragstart',
        'dragenter',
        'dragover',
        'dragleave',
        'drag',
        'drop',
        'dragend',
        'focus',
        'focusin',
        'focusout',
        'keydown',
        'keypress',
        'keyup',
        'mousedown',
        'mouseenter',
        'mouseleave',
        'mousemove',
        'mouseout',
        'mouseover',
        'mouseup',
        'resize',
        'scroll',
        'submit'
    ])

};

cool.factory.events = events;

})();

/* cool.factory.js end */


    xtnd(cool.prototype,
        cool.events,
        cool.store('data'),
        cool.store('param')
    );

    /* cool.view.js begin */
;(function() {

cool.factory('view', {

    /**
     * Returns all the data and params
     *
     * @returns Object
     */
    toJSON: function() {
        return {
            data: this.data(),
            params: this.param()
        };
    },

    /**
     * Renders HTML string
     *
     * @param {Object} json
     *
     * @return String
     */
    html: function(json) {
        return '<h1>' + json.params.name + '</h1>';
    }

});

cool.method(cool.view.prototype, {

    /**
     * Initializes view
     * Requests all models and renders html
     *
     * @private
     * @param {Object} params for models request
     * @param {Object} data for template rendering
     */
    init: function(params, data) {
        var that = this;

        that.data(data);
        that.param(params);

        init.models(that)
            .then(function() {
                that.render();
            });

        init.views(that);

        return this;
    },

    /**
     * Ensures element
     * and replaces its content
     */
    render: function() {

        var json = this.toJSON();
        var html = this.html( json );
        var el = $( html ).eq(0);

        if (this.el) {
            this.el.html( el.html() );
        } else {
            this.el = el;
        }
    },

    /**
     * Appends subview
     *
     * @param {cool.view} view
     */
    append: function(view) {
        var name = view.name;
        var views = this._views;

        if (!views[name]) {
            views[name] = [];
        }

        if (view._parent) {
            view.detach(true);
        }

        this.el.append(view.el);
        view._parent = this;
        views[name].push(view);
    },

    /**
     * Removes view
     * from it's parent subviews list.
     * Removes subview from DOM if `!skipDom`
     *
     * @param {Boolean} skipDom
     */
    detach: function(skipDom) {

        cool.assert(this._parent,
            'detach for %1 called w/o _parent', this.name);

        var views = this._parent._views[this.name];
        var index = views.indexOf(this);

        if (index > -1) {
            views.splice(index, 1);
        } else {
            // indicates inifite recursion
            cool.assert(0,
                'view %1 not found in subviews', this.name);
        }

        delete this._parent;

        if (!skipDom) {
            this.el.detach();
        }
    },

    /**
     * Removes view from wherever,
     * unbind it's events and destroys it.
     */
    remove: function() {

        if (this._parent) {
            this.detach();
        }

        this.empty();

        this.el.remove();
    },

    /**
     * Removes all subviews
     */
    empty: function() {

        xtnd.each(this._views, function(set) {
            while (set.length) { set[0].remove(); }
        });
    }

});

var init = {

    views: function(that) {
        var data = that.data();
        var params = that.param();
        var views = that._views = {};

        xtnd.each(that.views, function(name) {

            var view = cool.view(name, params, data);

            if (!views[name]) {views[name] = [];}

            views[name].push(view);

            if (view.el) {
                that.append(view);
            } else {
                view.one('rendered', function() {
                    that.append(this);
                });
            }
        });
    },

    models: function(that) {
        var models = {};
        var data = that.data();
        var params = that.param();

        var fetches = xtnd.map(that.models, function(name) {
            models[name] = cool.model(name, params, data);
            return models[name].fetch();
        });

        that.models = models;

        return cool.promise.when(fetches);
    }
};

cool.view.init = init;

})();

/* cool.view.js end */

    /* cool.model.js begin */
;(function() {

cool.factory('model', {});

cool.method(cool.model.prototype, {

    init: function(params, data) {

        cool.assert(this.url, 'you should specify url for model %1', this.name);

        this.data(data);
        this.param(params);

        return this;
    },

    fetch: function() {
        var url = this.url;
        var type = 'get';
        var params = this.param();
        var promise = cool.promise();

        $.ajax({
            url: url,
            traditional: true,
            type: type,
            data: params,
            context: this,
            dataType: 'json',
            success: function(data) {
                this.data(data);
                promise.resolve(this);
            }
        });

        return promise;
    }

});

cool.model.EVENTS = xtnd.hash([
    'read',
    'readed', /* %) */
    'fetch',
    'fetched',
    'init',
    'inited'
]);

})();

/* cool.model.js end */


    root.cool = cool;
})(this);
