describe('cool.model', function() {

    beforeEach(function() {
        this.model = new cool.model();
        this.model.url = '/test';
        this.model.name = 'test';
        this.model._cache = {};
    });

    describe('init', function() {

        it('should throw if no url specified', function() {
            var model = new cool.model();

            expect( function() { model.init(); } )
                .to.throwError();
        });

        it('should set data', function() {
            this.model.init({}, {a: 1});

            expect( this.model.data() ).to.eql( {a: 1} );
        });

        it('should set params', function() {
            this.model.init({b: 2}, {});

            expect( this.model.param() ).to.eql( {b: 2} );
        });

        it('should save bibb', function() {
            this.model.bibb = 123;
            this.model.init({}, {});

            expect( this.model.bibb ).to.eql( 123 );
        });

        it('should set bibb', function() {
            this.model.init({}, {});

            expect( this.model.bibb ).to.eql( {} );
        });

        it('should set plural bibb', function() {
            this.model.name = 'tests';
            this.model.init({}, {});

            expect( this.model.bibb ).to.eql( [] );
        });

        it('should initialize _cache', function() {
            this.model.init({}, {});

            expect( this.model._cache ).to.eql( {} );
        });

        it('should return `this`', function() {

            expect( this.model.init({}, {}) ).to.eql( this.model );
        });

    });

    describe('fetch', function() {

        beforeEach(function() {

            var requests = this.requests = [];

            this.xhr = sinon.useFakeXMLHttpRequest();
            this.xhr.onCreate = function (xhr) {
                requests.push(xhr);
                setTimeout(function() {
                    xhr.respond(200,
                        { 'Content-Type': 'application/json' },
                        '{ "user": "artjock" }'
                    );
                }, 10);
            };

            this.model = new cool.model({a: 1}, {b: 2});
            this.model.url = '/test';
        });

        afterEach(function() {
            this.xhr.restore();
        });

        it('should call server once', function() {
            this.model.fetch();

            expect( this.requests.length ).to.eql( 1 );
        });

        it('should call server with `this.url`', function() {
            this.model.fetch();

            expect( this.requests[0].url ).to.eql( '/test' );
        });

        it('should call server with "GET" method', function() {
            this.model.fetch();

            expect( this.requests[0].method ).to.eql( 'GET' );
        });

        it('should return promise', function() {
            expect( cool.promise.is( this.model.fetch() ) ).to.be.ok();
        });

        it('should resolve with model', function(done) {
            var model = this.model;

            model.fetch()
                .then(function(res) {
                    expect( res ).to.equal( model );
                    done();
                });
        });

        it('should save returned data', function(done) {
            var model = this.model;

            model.fetch()
                .then(function() {
                    expect( model.data() ).to.eql( {user: 'artjock'} );
                    done();
                });
        });

        it('should emit with model', function(done) {
            var model = this.model;

            model.on('fetched', function(evt, res) {
                expect( res ).to.equal( model );
                done();
            });

            model.fetch();
        });

    });

    describe('_params', function() {

        it('should return null on required absense', function() {
            this.model.params = {req: null};

            expect( this.model._params({}) )
                .to.eql( null );
        });

        it('should return defaults', function() {
            this.model.params = {def: 40};

            expect( this.model._params({}) )
                .to.eql( {def: 40} );
        });

        it('should skip undefineds', function() {
            this.model.params = {def: 40, foo: undefined};

            expect( this.model._params({}) )
                .to.eql( {def: 40} );
        });

        it('should extend defaults', function() {
            this.model.params = {def: 40, foo: undefined};

            expect( this.model._params({foo: 50}) )
                .to.eql( {def: 40, foo: 50} );
        });

        it('should owerwite listed', function() {
            this.model.params = {def: 10, req: null, ext: undefined};

            expect( this.model._params({def: 30, req: 20, ext: 10}) )
                .to.eql( {def: 30, req: 20, ext: 10} );
        });

        it('should owerwrite with \'\'', function() {
            this.model.params = {def: 20};

            expect( this.model._params({def: ''}) )
                .to.eql( {def: ''} );
        });

        it('should owerwrite with 0', function() {
            this.model.params = {def: 20};

            expect( this.model._params({def: 0}) )
                .to.eql( {def: 0} );
        });

        it('should skip not listed', function() {
            this.model.params = {def: 10};

            expect( this.model._params({foo: 50}) )
                .to.eql( {def: 10} );
        });

    });

    describe('key', function() {

        it('should create key by name', function() {

            expect( this.model.key({}) ).to.eql( 'test' );
        });

        it('should create key by name and params', function() {

            expect( this.model.key({a: [1, 2], b: 3}) )
                .to.eql( 'test?a=1&a=2&b=3' );
        });
    });

    describe('defaults', function() {

        it('should return defaults object', function() {
            var defaults = this.model.defaults();

            expect( defaults ).to.have.property( 'url', '/test' );
            expect( defaults ).to.have.property( 'type', 'get' );
            expect( defaults ).to.have.property( 'context', this.model );
            expect( defaults ).to.have.property( 'dataType', 'json' );
        });

        it('should return different objects', function() {
            this.model.defaults().url = 'foo';

            expect( this.model.defaults() ).to.have.property( 'url', '/test' );
        });

    });

    describe('cache', function() {

        beforeEach(function() {
            this.model._cache = { 'test?a=1': [1, 2, 3] };
        });

        it('should return existing cache item', function() {

            expect( this.model.cache({a: 1}) ).to.eql( [1, 2, 3] );
        });

        it('should return undefined for unexisting cache', function() {

            expect( this.model.cache({a: 2}) ).to.eql( undefined );
        });

        it('should set cache item', function() {
            this.model.cache({b: 1}, [4, 5, 6]);

            expect( this.model._cache['test?b=1'] ).to.eql( [4, 5, 6] );
        });
    });

    describe('request', function() {

        beforeEach(function() { sinon.spy($, 'ajax'); });
        afterEach(function() { $.ajax.restore(); });

        it('should abort existing request', function() {
            var abort = sinon.spy();

            this.model._request = { abort: abort };
            this.model.request();

            expect( abort.calledOnce ).to.be.ok();
        });

        it('should pass option to $.ajax()', function() {
            this.model.request({a: 1});

            expect( $.ajax.calledWith({a: 1}) ).to.be.ok();
        });

        it('should save request object', function() {

            expect( this.model.request() )
                .to.eql( this.model._request );
        });

        it('should return $.ajax() object', function() {
            expect( this.model.request() ).to.be.an( Object );
        });

    });

});
