;(function(root) {

root.coolViewEventsInfo = {

    'click': {
        kind: 'dom',
        type: 'click',
        slave: '',
        master: 'this',
        context: 'this'
    },
    '.b-button -> focus': {
        kind: 'dom',
        type: 'focus',
        slave: '',
        master: '.b-button',
        context: 'this'
    },
    '.b-button .js-button -> keydown': {
        kind: 'dom',
        type: 'keydown',
        slave: '',
        master: '.b-button .js-button',
        context: 'this'
    },
    'form -> submit': {
        kind: 'dom',
        type: 'submit',
        slave: '',
        master: 'form',
        context: 'this'
    },
    'model -> fetch': {
        kind: 'model',
        type: 'fetch',
        slave: '',
        master: 'model',
        context: ''
    },
    '* -> aborted': {
        kind: 'model',
        type: 'aborted',
        slave: '',
        master: '*',
        context: ''
    },
    'append': {
        kind: 'view',
        type: 'append',
        slave: '*',
        master: 'this',
        context: ''
    },
    '* -> append': {
        kind: 'view',
        type: 'append',
        slave: '*',
        master: '*',
        context: ''
    },
    'append subview': {
        kind: 'view',
        type: 'append',
        slave: 'subview',
        master: 'this',
        context: ''
    },
    'view -> append subview': {
        kind: 'view',
        type: 'append',
        slave: 'subview',
        master: 'view',
        context: ''
    },
    'view->append subview': {
        kind: 'view',
        type: 'append',
        slave: 'subview',
        master: 'view',
        context: ''
    },
    'view    ->     append      subview': {
        kind: 'view',
        type: 'append',
        slave: 'subview',
        master: 'view',
        context: ''
    }
};

})(this);
