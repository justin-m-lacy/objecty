/**
 * Recursively collects all properties in an object which do not appear in
 * the original, or which have been changed.
 * Changed variables are collected and returned _without_ cloning.
 * NOTE: This is NOT a complete diff: props appearing in original but deleted in clone
 * are not copied unless they exist with new values.
 * @param {Object} clone 
 * @param {Object} original
 * @returns {Object} collection of changed values, or null if none are changed.
 */
function changes( clone, original ) {

	let res = null;

	for( let p in clone ) {

		var sub = clone[p];
		var orig = original[p];

		if ( (sub === original[p]) ) continue;
		if ( !sub ) {

			if (!orig) continue;

		} else if ( typeof sub === 'object' ) {

			if ( typeof orig === 'object' && orig !== null ) {

				sub = changes( sub, orig );
				if ( sub === null ) continue;

			}

		}

		if ( res === null ) res = {};
		res[p] = sub;		

	}

	return res;

}

/**
 * Merge two objects with overwrites from src.
 * @param {Object} dest 
 * @param {Object} src 
 */
function merge( dest, src ) {

	for( let p in src ) {

		var srcSub = src[p];

		if ( ( typeof srcSub !== 'object' && typeof srcSub !== 'function') ) {
			dest[p] = srcSub;
			continue;
		}

		var destSub = dest[p];
		if ( destSub instanceof Array ) {

			if (srcSub instanceof Array ) dest[p] = mergeArrays( destSub, srcSub );
			else if ( !destSub.includes(srcSub) ) destSub.push(srcSub);

		} else if ( typeof destSub === 'object') merge( destSub, srcSub );


	}

}

/**
 * Recursively merge values from src into dest, without overwriting any of dest's existing values.
 * Object and array values are deep-cloned before being assigned to dest.
 * Conflicting arrays are not merged.
 * @param {Object} dest 
 * @param {Object} src 
 */
function mergeSafe( dest, src ) {

	for( let p in src ) {

		var destSub = dest[p];
		let srcSub = src[p];

		if ( destSub === undefined ) {

			if ( typeof srcSub === 'object' ) dest[p] = clone( srcSub, srcSub instanceof Array ? [] : {} );
			else dest[p] = srcSub;

			continue;

		} else if ( destSub == null ) continue;


		if ( srcSub && typeof destSub === 'object' && typeof srcSub === 'object') {

			if ( !(destSub instanceof Array) && !(srcSub instanceof Array) ) mergeSafe( destSub, srcSub );

		}

	}

}

/**
 * Merge two arrays, ignoring entries duplicated between arrays.
 * @param {Array} a1 
 * @param {Array} a2
 * @returns {Array}
 */
function mergeArrays( a1, a2) {
	return a1.concat( a2.filter(v=>!a1.includes(v) ) );
}

/**
 * Performs a deep-clone of an object, including class prototype
 * and class methods.
 * @param {Object} src  
 */
function cloneClass( src ) {
	
	let o, f;

	let proto = Object.getPrototypeOf( src );
	let dest = proto ? Object.create( proto ) : {};

	for( let p in src ) {

		o = src[p];
		if ( o === null || o === undefined ) dest[p] = o;
		else if ( typeof o === 'object' ) {

			f = ( o.clone );
			if ( f && typeof f === 'function' ) dest[p] = f.call( o );
			else dest[p] = cloneClass( o );

		} else dest[p] = o;

	}

	return dest;

}

function clone( src, dest={} ){

	let o, f;
	for( let p in src ) {

		o = src[p];
		if ( o === null || o === undefined ) dest[p] = o;
		else if ( o instanceof Array ) {

			dest[p] = clone( o, [] );

		} else if ( typeof o === 'object' ) {

			f = ( o.clone );
			if ( f && typeof f === 'function' ) dest[p] = f.call( o );
			else dest[p] = clone( o );

		} else dest[p] = o;

	}

	return dest;

}

/**
 * Return an array of all string paths from base object
 * which lead to a non-object property in the object or subobject.
 * Paths to arrays are also returned, but not subpaths of arrays.
 * Path strings are concatenated with '.'
 * @param {Object} base
 * @return {string[]}
 */
function propPaths( base ) {

	let res = [];
	let objStack = [];
	let pathStack = [];

	let path = '';

	while ( base ) {

		for( let p in base ) {

			var sub = base[p];
			if ( typeof sub === 'object' && !(sub instanceof Array) ) {
				objStack.push(sub);
				pathStack.push( path + p + '.' );
				continue;
			} else res.push( path + p );

		}

		base = objStack.pop();
		if ( base === undefined ) break;
		path = pathStack.pop();

	}

	return res;

}

module.exports = {

	changes:changes,

/**
 * Create a deep clone of an object. Any clone functions in source objects
 * or sub-objects are called to provide their own clone implementations.
 * @todo eliminate circular references.
 * @param {object} src - object to clone.
 * @param {object} [dest={}] object to merge cloned values into.
 */
clone:clone,

/**
 * Deep clone of object, including class prototype information.
 * @param {*} src 
 * @param {*} dest 
 */
cloneClass:cloneClass,

propPaths:propPaths,

/**
 * Recursively merge two objects, with duplicate entries overwritten
 * by src. Arrays are concatenated without duplicating array elements.
 * @param {Object} dest
 * @param {Object} src
 */
merge:merge,

mergeSafe:mergeSafe,

/**
 * Return an array of all properties defined by an Object or its ancestors.
 * @param {Object} obj - Object whose properties are returned.
 * @param {bool} ownData - whether to include private data variables.
 * @param {bool} getters - whether to include getter properties.
 * @return {string[]} Array of property names.
 */
getProps( obj, ownData=true, getters=true ) {

	if ( !obj ) return [];

	let proto = ownData ? obj : Object.getPrototypeOf(obj);

	let p, props = [];

	/// fast version for when private variables and getters don't
	/// have to be ruled out.
	if ( getters === true ) {
		while ( proto !== Object.prototype ) {

			for ( p of Object.getOwnPropertyNames(proto)) {

				if ( typeof obj[p] !== 'function') props.push( p );
			}

			// quick push.
			//props.push.apply( props, Object.getOwnPropertyNames(proto) );
			proto = Object.getPrototypeOf( proto );
	
		} // while-loop.

	} else {

		while ( proto !== Object.prototype ) {

			for ( p of Object.getOwnPropertyNames(proto)) {

				if ( typeof obj[p] === 'function') continue;
				if ( Object.getOwnPropertyDescriptor(proto, p).get === undefined ) {
					props.push( p );
					//else console.log( 'hiding internal prop: ' + p );
				} else {
					if ( getters === true ) props.push(p);
				}

			}
			proto = Object.getPrototypeOf( proto );

		} // while-loop.

	}

	return props;

},

/**
 * 
 * @param {Array} a
 * @returns {*} Random element of array. 
 */
randElm( a ) { return a[Math.floor( Math.random()*a.length) ]; },

/**
 * Return a random element from and array which matches
 * a predicate.
 * @param {Array} a 
 * @param {(*)=>boolean} pred - predicate test which a picked array element must pass.
 * @returns {*} random element of array which passes the predicate.
 */
randMatch( a, pred ) {

	let start = Math.floor( Math.random()*a.length );
	let ind = start;

	do {

		if ( pred( a[ind] ) ) return a[ind];
		ind = --ind >= 0 ? ind : a.length-1;

	} while ( ind !== start );

	return null;

},

/**
 * Sort item of a target array or object into sublists
 * based on each subobject's indexer value.
 * @param {Array|Object} arr 
 * @param {string|function} indexer - property indexer or function that returns sublist index.
 * @returns {Object.<string|number,Array>} An object containing arrays
 * of sub-objects with matching property values. 
 */
sublists( arr, indexer ) {

	let lists = {};

	let func = ((typeof indexer) === 'function');

	for( let i in arr ) {

		var sub = arr[i];
		if ( sub === null || sub === undefined ) continue;

		var ind = func ? func(sub) : sub[indexer];

		var list = lists[ind];
		if ( list === null || list === undefined ) lists[ind] = list = [];

		list.push(sub);

	}

	return lists;

},

/**
 * Define values for all of an Object's undefined properties with setters
 * up through its Object chain.
 * This can be useful in frameworks like Vue, where watched Objects must
 * have all their properties defined when the template is created.
 * @param {Object} obj - Object to assign properties for.
 * @param {*} [defaultVal=null] - Value to assign to undefined properties.
 */
defineVars( obj, defaultVal=null ) {

	if ( !obj ) return;
	let proto = obj;

	while ( proto !== Object.prototype ) {

		for ( p of Object.getOwnPropertyNames(proto)) {

			if ( obj[p] !== undefined ) continue;
			if ( Object.getOwnPropertyDescriptor(proto, p).set !== undefined ) {

				obj[p] = defaultVal;

			}

		}
		proto = Object.getPrototypeOf( proto );

	} // while-loop.

},

/**
 * Define values for all of an Object's undefined properties with setters
 * up through its Object chain.
 * This can be useful in frameworks like Vue, where watched Objects must
 * have all their properties defined when the template is created.
 * @param {Object} obj - Object to assign properties for.
 * @param {*} [defaultVal=null] - Value to assign to undefined properties.
 * @param {string[]} [except=[]] - Properties to ignore.
 */
defineExcept( obj, defaultVal=null, except=[] ) {

	if ( !obj ) return;
	let proto = obj;

	while ( proto !== Object.prototype ) {

		for ( p of Object.getOwnPropertyNames(proto)) {

			if ( except.includes(p) || obj[p] !== undefined ) continue;
			if ( Object.getOwnPropertyDescriptor(proto, p).set !== undefined ) {

				obj[p] = defaultVal;

			}

		}
		proto = Object.getPrototypeOf( proto );

	} // while-loop.

},

/**
 * Searches an object's prototype chain for a property descriptor.
 * @param {Object} obj 
 * @param {string} k - property key.
 * @returns {PropertyDescriptor|null}
 */
getPropDesc(obj, k) {

	while (obj !== Object.prototype) {

		var desc = Object.getOwnPropertyDescriptor(obj, k);
		if (desc) return desc;
		obj = Object.getPrototypeOf(obj);

	}
	return null;

},

/**
 * Copies all values from a source object into a destination object.
 * @param {Object} dest - Destination for json data.
 * @param {Object} src - Object data to write into dest.
 * @param {string[]} [exclude=null] - Array of properties not to copy from src to dest.
 * @returns {Object} the destination object.
 */
assign(dest, src, exclude = null) {

	for (let p in src) {

		if (exclude && exclude.includes(p)) continue;
		var desc = getPropDesc(dest, p );
		if ( desc === null || (desc.set === undefined && !desc.writable )) continue;
		dest[p] = src[p];

	} //for

	return dest;

},

/**
 * Convert an object to a JSON object ready to be stringified.
 * @param {Object} obj - the objet to convert. 
 * @param {string[]} [excludes=null] - Array of properties to exclude from encoding. 
 * @param {string[]} [includes=null] - Array of properties to always include in encoding, if they exist. 
 * @param {bool} [writableOnly=true] - Whether to only include writable properties.
 */
jsonify(obj, excludes=null, includes=null, writableOnly = true) {

	let r = {}, p;

	if (includes) {
		let len = includes.length;
		for (let i = len - 1; i >= 0; i--) {
			p = includes[i];
			if (obj.hasOwnProperty(p)) r[p] = obj[p];
		}
	}

	var proto = Object.getPrototypeOf(obj);
	while (proto != Object.prototype) {

		for (p of Object.getOwnPropertyNames(proto)) {

			if ( excludes && excludes.includes(p) ) continue;

			var desc = Object.getOwnPropertyDescriptor(proto, p);
			if (writableOnly && desc.set === undefined && !desc.writable) continue;

			var val = obj[p];
			if (typeof val === 'function') continue;
			r[p] = val;

		}

		proto = Object.getPrototypeOf(proto);

	} //

	return r;

}

};