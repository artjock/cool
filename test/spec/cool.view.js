
describe('cool.view', function() {

    beforeEach(function() {
        cool.view({name: 'v1'});
        cool.view({name: 'v2'});
        cool.view({name: 'v3'});
    });

    afterEach(function() {
        cool.view._insts = {};
        cool.view._ctors = {};
    });

    describe('init', function() {

        var init = cool.view.init;

        beforeEach(function() {
            this.view = new cool.view();

            sinon.spy(init, 'views');
            sinon.spy(init, 'models');
        });

        afterEach(function() {
            init.views.restore();
            init.models.restore();

            cool.view._insts = {};
            cool.view._ctors = {};
        });

        it('should set params', function() {
            this.view.init({a: 1}, {});

            expect( this.view.param() ).to.eql( {a: 1} );
        });

        it('should set data', function() {
            this.view.init({}, {b: 2});

            expect( this.view.data() ).to.eql( {b: 2} );
        });

        it('should call `init.views`', function() {
            this.view.init({}, {});

            expect( init.views.calledOnce ).to.be.ok();
            expect( init.views.getCall(0).args[0])
                .to.eql( this.view );
        });

        it('should call `init.models`', function() {
            this.view.init({}, {});

            expect( init.models.calledOnce ).to.be.ok();
            expect( init.models.getCall(0).args[0])
                .to.eql( this.view );
        });

        it('should call `render` immediately w/o models', function() {
            sinon.spy(this.view, 'render');
            this.view.init({}, {});

            expect( this.view.render.calledOnce ).to.be.ok();
        });

        it('should return this', function() {

            expect( this.view.init({}, {}) ).to.eql( this.view );
        });


    });

    describe('find', function() {

        beforeEach(function() {
            this.view = cool.view('v1');
            this.v201 = cool.view('v2');
            this.v202 = cool.view('v2');

            this.view.append( this.v201 );
            this.view.append( this.v202 );
        });

        it('should find subview by instance', function() {
            expect( this.view.find(this.v202) ).to.eql( this.v202 );
        });

        it('should find first subview by name', function() {
            expect( this.view.find('v2') ).to.eql( this.v201 );
        });

        it('should return undefined if no one found', function() {
            expect( this.view.find('v3') ).to.be( undefined );
        });

    });

    describe('toJSON', function() {

        beforeEach(function() {
            this.view = new cool.view();
        });

        it('should return all json of the view', function() {
            this.view.data({a: 1});
            this.view.param({b: 2});

            expect( this.view.toJSON() ).to.eql( {
                data: {a: 1},
                params: {b: 2}
            } );
        });

    });

    describe('render', function() {

        beforeEach(function() {
            this.view = new cool.view();
            this.view.param({a: 'a'});
            this.view.html = function(json) {
                return '<i>' + json.params.a + '</i><b>123</b>';
            };
            sinon.spy(this.view, 'html');
            sinon.spy(this.view, 'toJSON');
        });

        it('should ensure element', function() {
            this.view.render();

            expect( this.view.el.length ).to.eql( 1 );
        });

        it('should call "html"', function() {
            this.view.render();

            expect( this.view.html.calledOnce ).to.be.ok();
        });

        it('should call "toJSON"', function() {
            this.view.render();

            expect( this.view.toJSON.calledOnce ).to.be.ok();
        });

        it('should call "html" with "toJSON" data', function() {
            this.view.render();

            expect( this.view.toJSON.returnValues[0] )
                .to.eql( this.view.html.getCall(0).args[0] );
        });

        it('should set get first root element', function() {
            this.view.render();

            expect( this.view.el[0].tagName.toLowerCase() ).to.eql( 'i' );
        });

        it('should replace only content of element', function() {
            this.view.render();

            var el = this.view.el[0];

            this.view.param({a: 'b'});
            this.view.render();

            expect( this.view.el[0] ).to.eql( el );
            expect( this.view.el.html() ).to.eql( 'b' );
        });

    });

    describe('append', function() {

        beforeEach(function() {
            cool.view.prototype.html = function() {
                return  '<i class="' + this.name + '">' +
                            '<i class="' + this.name + '__i"></i>' +
                        '</i>';
            };
            this.view = cool.view('v1');
            this.v201 = cool.view('v2');
            this.v202 = cool.view('v2');
        });

        it('should ensure specified store', function() {
            this.view.append(this.v201);

            expect( this.view._views['v2'] ).to.be.an( Array );
        });

        it('should add subviews to store', function() {
            this.view.append(this.v201);
            this.view.append(this.v202);

            expect( this.view._views['v2'] )
                .to.eql( [this.v201, this.v202] );
        });

        it('should call `detach` if subview has parent', function() {
            this.v201.append(this.v202);
            sinon.spy(this.v202, 'detach');
            this.view.append(this.v202);

            expect( this.v202.detach.calledOnce ).to.be.ok();
            expect( this.v202.detach.getCall(0).args[0] ).to.eql( true );
        });

        it('should not call `detach` if subview has no parent', function() {
            sinon.spy(this.v202, 'detach');
            this.view.append(this.v202);

            expect( this.v202.detach.called ).not.to.be.ok();
        });

        it('should set `_parent` of subview', function() {
            this.view.append(this.v202);

            expect( this.v202._parent ).to.eql( this.view );
        });

        it('should append dom element', function() {
            this.view.append(this.v202);

            expect( this.view.el.children( '.v2' ).length ).to.eql( 1 );
        });

        it('should consider `operation.root`', function() {
            this.view.on('append', function(evt) {
                evt.operation.root = '.v1__i';
            });

            this.view.append(this.v202);

            expect( this.view.el.find('.v1__i > .v2' ).length ).to.eql( 1 );
        });

        it('should return apended instance', function() {
            expect( this.view.append( this.v202 ) ).to.eql( this.v202 );
        });

    });

    describe('detach', function() {

        beforeEach(function() {
            this.view = cool.view('v1');
            this.v201 = cool.view('v2');
            this.v202 = cool.view('v2');

            this.view.append(this.v201);
            this.view.append(this.v202);
        });

        it('should remove view from subviews store', function() {
            this.v202.detach();

            expect( this.view._views['v2'] ).to.eql( [this.v201] );
        });

        it('should throw on view w/o parent', function() {
            var view = this.view;

            expect( function() { view.detach(); } )
                .to.throwError(/_parent/);
        });

        it('should leave empty array after detaching last', function() {
            this.v201.detach();
            this.v202.detach();

            expect( this.view._views['v2'] ).to.eql( [] );
        });

        it('should remove `_parent` link', function() {
            this.v201.detach();

            expect( this.v201 ).not.to.have.property( '_parent' );
            expect( this.v202 ).to.have.property( '_parent' );
        });

        it('should detach dom by default', function() {
            this.v201.detach();

            expect( this.view.el.find( this.v201.el ).length ).to.eql( 0 );
            expect( this.view.el.find( this.v202.el ).length ).to.eql( 1 );
        });

        it('should not detach dom with `skipDom`', function() {
            this.v201.detach(true);

            expect( this.view.el.find( this.v201.el ).length ).to.eql( 1 );
            expect( this.view.el.find( this.v202.el ).length ).to.eql( 1 );
        });

        it('should return parent', function() {

            expect( this.v201.detach() ).to.eql( this.view );
        });

    });

    describe('remove', function() {
        beforeEach(function() {
            this.view = cool.view('v1');
            this.v201 = cool.view('v2');

            this.view.append(this.v201);
        });

        it('should call `detach` if view has _parent', function() {
            sinon.spy(this.v201, 'detach');
            this.v201.remove();

            expect( this.v201.detach.calledOnce ).to.be.ok();
        });

        it('should not call `detach` for view w/o _parent', function() {
            sinon.spy(this.view, 'detach');
            this.view.remove();

            expect( this.view.detach.called ).not.to.be.ok();
        });

        it('should call `empty`', function() {
            sinon.spy(this.view, 'empty');
            this.view.remove();

            expect( this.view.empty.calledOnce ).to.be.ok();
        });

        it('should remove element', function() {
            sinon.spy(this.view.el, 'remove');
            this.view.remove();

            expect( this.view.el.remove.calledOnce ).to.be.ok();
        });

    });

    describe('empty', function() {

        beforeEach(function() {
            this.view = cool.view('v1');
            this.v201 = cool.view('v2');
            this.v202 = cool.view('v2');
            this.v301 = cool.view('v3');

            this.view.append(this.v201);
            this.view.append(this.v202);
            this.view.append(this.v301);

            sinon.spy(this.v201, 'remove');
            sinon.spy(this.v202, 'remove');
            sinon.spy(this.v301, 'remove');
        });

        it('should call `remove` for each subview', function() {
            this.view.empty();

            expect( this.v201.remove.calledOnce ).to.be.ok();
            expect( this.v202.remove.calledOnce ).to.be.ok();
            expect( this.v301.remove.calledOnce ).to.be.ok();
        });

        it('should empty all stores', function() {
            this.view.empty();

            expect( this.view._views['v2'] ).to.eql( [] );
            expect( this.view._views['v3'] ).to.eql( [] );
        });

    });

});
