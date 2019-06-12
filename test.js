let Objecty = require('./index.js');

class Parent {

	get parentPublic(){ return this._parentPublic; }
	set parentPublic(v) { this._parentPublic = v; }

	constructor(){

		this.parentPrivate = "parentPrivate";

	}

}

class Child extends Parent {

	get childPublic() { return 'childPublic'; }

	constructor() {

		super();
		this.childPrivate = "childPrivate";

	}

}

let sample = new Child();
sample.selfPrivate = "selfPrivate";

Objecty.defineVars( sample, 'defined');

let list = Objecty.getProps( sample, false, true );

console.log( 'no private: ' + list.join(', ') );

list = Objecty.getProps( sample, true, true );

console.log( 'with private: ' + list.join(', ') );

list = Objecty.getProps( sample, true, false );

console.log( 'only private: ' + list.join(', ') );