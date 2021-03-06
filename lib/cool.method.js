;(function() {


var method = function(name, action, isSilent) {

    if ( xtnd.isObject(name) ) {
        return method.extend(name, action);
    }

    return function() {
        var reply, event, binded, op;
        var that = this;
        var args = xtnd.array(arguments);
        var slave = args[0] instanceof cool ? args[0].name : undefined;
        var silent = typeof isSilent === 'function' ?
            isSilent.apply(this, args) : false;

        // console.log(this.name + ' -> ' + name, slave);

        binded = method.bindAction(action, this, args);

        if (!silent) {
            event = this._event(name, {action: binded, slave: slave});
            op = this.operation = event.operation;
            this.emit(event);
        }

        if (!event || !event._prevented) {

            reply = binded();

            if (!silent) {
                event = this._event(name + 'ed', {operation: op, slave: slave});
                if (cool.promise.is(reply)) {
                    reply.then(function(data) {
                        that.emit(event, data);
                    });
                } else {
                    this.emit(event, reply);
                }
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
