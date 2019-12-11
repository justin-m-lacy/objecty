/**
 * Recursively collect all properties in an object which do not appear in
 * an original template object, or which have been changed.
 * Changed variables are collected and returned _without_ cloning.
 * NOTE: falsey values are all considered equal when determining changes.
 * NOTE: This is NOT a complete diff: props appearing in original but deleted in clone
 * are NOT listed unless they exist with new values.
 * @param {Object} clone
 * @param {Object} original
 * @returns {Object} collection of properties existing in clone, which are different from values in original.
 */
export function changes( clone, original ) {

	let res = null;

	for( let p in clone ) {

		var sub = clone[p];
		var orig = original[p];

		if ( sub == orig ){
			continue;
		}
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
 * Recursively merge two objects, with duplicate entries overwritten
 * by src. Arrays are concatenated without duplicating array elements.
 * @param {Object} dest
 * @param {Object} src
 */
export function merge( dest, src ) {

	for( let p in src ) {

		var srcSub = src[p];

		if ( ( typeof srcSub !== 'object' && typeof srcSub !== 'function') ) {
			dest[p] = srcSub;
			continue;
		}

		var destSub = dest[p];
		if (  Array.isArray(destSub) ) {

			if ( Array.isArray(srcSub) ) dest[p] = mergeArrays( destSub, srcSub );
			else if ( !destSub.includes(srcSub) ) destSub.push(srcSub);

		} else if ( typeof destSub === 'object') merge( destSub, srcSub );


	}

}

/**
 * Recursively merge values from src into dest, without overwriting any of dest's existing values.
 * Object and array values merged from src are deep-cloned before being copied to dest.
 * Conflicting arrays are not merged.
 * Nothing is returned, as all the changes are made _within_ dest.
 * @param {Object} dest
 * @param {Object} src
 */
export function mergeSafe( dest, src ) {

	for( let p in src ) {

		var destSub = dest[p];
		let srcSub = src[p];

		if ( destSub === undefined ) {

			if ( srcSub !== null && typeof srcSub === 'object' ) dest[p] = clone( srcSub, Array.isArray(srcSub) ? [] : {} );
			else dest[p] = srcSub;

			continue;

		} else if ( destSub === null ) continue;


		if ( srcSub && typeof destSub === 'object' && typeof srcSub === 'object') {

			if ( !Array.isArray(destSub) && !Array.isArray(srcSub) ) mergeSafe( destSub, srcSub );

		}

	}

}

/**
 * Merge two arrays, ignoring entries duplicated between arrays.
 * This does not remove duplicated entries already existing in
 * either array separately.
 * @param {Array} a1
 * @param {Array} a2
 * @returns {Array}
 */
export function mergeArrays( a1, a2) {

	let a = a1.slice();
	let len = a2.length;

	for( let i = 0; i < len; i++ ) {

		var v = a2[i];
		if ( a1.includes(v) === false ) {
			a.push(v);
		}

	}
	return a;
}

/**
 * Performs a deep-clone of an object, including class prototype
 * and class methods.
 * @param {Object} src
 * @param {?Object} [dest=null] - optional base object of the clone.
 * if set, root object will not be cloned, only subobjects.
 */
export function cloneClass( src, dest=null ) {

	let o;

	let proto = Object.getPrototypeOf( src );
	if ( !dest ) dest = Array.isArray(src) ? [] : ( proto ? Object.create( proto ) : {} );

	for( let p in src ) {

		o = src[p];

		var def = getPropDesc( dest, p );
		if ( def && ( !def.writable || def.set === undefined ) ) continue;

		if ( o === null || o === undefined ) dest[p] = o;
		else if ( typeof o === 'object' ) {

			if ( o.clone && typeof o.clone === 'function' ) dest[p] = o.clone.call( o );
			else dest[p] = cloneClass( o );

		} else dest[p] = o;

	}

	return dest;

}

/**
 * Create a deep clone of an object. Any clone functions in source objects
 * or sub-objects are called to provide their own clone implementations.
 * @note dest is second parameter, whereas in Object.assign() it is first.
 * 		This makes syntax of: var obj = clone(src); much clearer.
 * @todo eliminate circular references.
 * @param {object} src - object to clone.
 * @param {object} [dest={}] object to merge cloned values into.
 */
export function clone( src, dest={} ){

	let o, f;
	for( let p in src ) {

		o = src[p];
		if ( o === null || o === undefined ) dest[p] = o;
		else if ( Array.isArray(o) ) {

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
 * Return an array of all string paths from the base object
 * which lead to a non-object property in the base object or subobject.
 * Paths to arrays are also returned, but not subpaths of arrays.
 * Path strings are concatenated with '.'
 * ex. [ 'myObject.sub.prop1', 'myObject.sub.prop2' ]
 * @param {Object} base
 * @return {string[]} - array of non-object properties reachable through base.
 */
export function propPaths( base ) {

	let res = [];
	let objStack = [];
	let pathStack = [];

	let path = '';

	while ( base ) {

		for( let p in base ) {

			var sub = base[p];
			if ( typeof sub === 'object' && !( Array.isArray(sub)) ) {
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

/**
 * Returns a Map of all properties in an object's prototype chain,
 * not including Object.prototype, which cannot be assigned to,
 * either because they are marked writable=false, or because
 * they are properties without setters.
 * @param {object} obj
 * @returns {Map.<string,true>} map of unwritable property names
 * mapping to true.
 */
export function getNoWrite( obj ) {

	let m = new Map();

	let proto = obj;
	while ( proto !== Object.prototype ) {

		var descs = Object.getOwnPropertyDescriptors( proto );
		for ( let p in descs ) {

			var d = descs[p];
			if ( (d.writable !== true) && d.set === undefined )  m.set(p,true);

		}

		proto = Object.getPrototypeOf( proto );

	} // while-loop.

	return m;

}

/**
 * Get all property descriptors in an object's prototype chain,
 * not including the Object.prototype itself.
 * Descriptors are returned as a Map where property names
 * map to property descriptors.
 * @param {object} obj
 * @param {Map}
 */
export function getDescs( obj ) {

	let m = new Map();

	let proto = obj;
	while ( proto !== Object.prototype ) {

		var descs = Object.getOwnPropertyDescriptors( proto );
		for ( let p in descs ) {
			m.set( p, descs[p]);
		}

		proto = Object.getPrototypeOf( proto );

	} // while-loop.

	return m;

}

/**
 * Return an array of all properties defined by an Object or its ancestors.
 * @param {Object} obj - Object whose properties are returned.
 * @param {bool} ownData - whether to include private data variables.
 * @param {bool} getters - whether to include getter properties.
 * @return {string[]} Array of property names.
 */
export function getProps( obj, ownData=true, getters=true ) {

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

}


/**
 * Determines if array contains any of the given params.
 * @param {Array} arr - array to test for inclusions.
 * @param  {...any} params - arguments to test for inclusion in array.
 * @returns {boolean} - true if at least one param is found in the array.
 */
export function includesAny( arr, ...params ) {

	for( let i = params.length-1; i>= 0; i-- ) {
		if ( arr.includes(params[i]) ) return true;
	}
	return false;

}

/**
 * Return random element of an array.
 * @param {Array} a
 * @returns {*} Random element of array.
 */
export function randElm( a ) { return a[Math.floor( Math.random()*a.length) ]; }

/**
 * Return a random element from and array which matches
 * a predicate.
 * @param {Array} a
 * @param {(*)=>boolean} pred - predicate test which a picked array element must pass.
 * @returns {*} random element of array which passes predicate.
 */
export function randMatch( a, pred ) {

	let start = Math.floor( Math.random()*a.length );
	let ind = start;

	do {

		if ( pred( a[ind] ) ) return a[ind];
		ind = --ind >= 0 ? ind : a.length-1;

	} while ( ind !== start );

	return null;

}

/**
 * Sort item of a target array or object into sublists
 * based on each subobject's indexer value.
 * @param {Array|Object} arr
 * @param {string|function} indexer - property indexer or function that returns sublist index.
 * @returns {Object.<string|number,Array>} An object containing arrays
 * of sub-objects with matching property values.
 */
export function sublists( arr, indexer ) {

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

}

/**
 * Define values for all of an Object's undefined properties with setters
 * up through its Object chain.
 * This can be useful in frameworks like Vue, where watched Objects must
 * have all their properties defined when the template is created.
 * @param {Object} obj - Object to assign properties for.
 * @param {*} [defaultVal=null] - Value to assign to undefined properties.
 */
export function defineVars( obj, defaultVal=null ) {

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

}

/**
 * Define values for all of an Object's undefined properties with setters
 * up through its Object chain.
 * This can be useful in frameworks like Vue, where watched Objects must
 * have all their properties defined when the template is created.
 * @param {Object} obj - Object to assign properties for.
 * @param {*} [defaultVal=null] - Value to assign to undefined properties.
 * @param {object.<string,*>} [except={}] - object whose keys indicate properties to ignore.
 */
export function defineExcept( obj, defaultVal=null, except={} ) {

	if ( !obj ) return;
	let proto = obj;

	while ( proto !== Object.prototype ) {

		for ( let p of Object.getOwnPropertyNames(proto)) {

			if ( except.hasOwnProperty(p) || obj[p] !== undefined ) continue;
			if ( Object.getOwnPropertyDescriptor(proto, p).set !== undefined ) {

				obj[p] = defaultVal;

			}

		}
		proto = Object.getPrototypeOf( proto );

	} // while-loop.

}

/**
 * Searches an object's prototype chain for a property descriptor.
 * @param {Object} obj
 * @param {string} k - property key.
 * @returns {PropertyDescriptor|null}
 */
export function getPropDesc(obj, k) {

	while (obj !== Object.prototype) {

		var desc = Object.getOwnPropertyDescriptor(obj, k);
		if (desc) return desc;
		obj = Object.getPrototypeOf(obj);

	}
	return null;

}

/**
 * Copies all values from a source object into a destination object,
 * ignoring properties that are unwritable and have no setter.
 * @param {Object} dest - Destination object.
 * @param {Object} src - Object data to write into dest.
 * @param {string[]} [exclude=null] - Array of properties not to copy from src to dest.
 * @returns {Object} the destination object.
 */
export function assign(dest, src, exclude = null) {

	var nowrite = getNoWrite(dest);
	if ( exclude ) {
		// mark exclusions.
		for( let i = exclude.length-1; i >= 0; i-- ) nowrite.set(exclude[i], true);
	}

	var svars = src;
	while ( svars !== Object.prototype ) {

		for (let p of Object.getOwnPropertyNames(svars) ) {

			if ( nowrite.has(p) !== true ) dest[p] = src[p];

		} //for

		svars = Object.getPrototypeOf(svars);
	}

	return dest;

}

/**
 * Copies all values from a source object into a destination object,
 * when those values exist as properties of the destination.
 * @param {Object} dest - Destination for json data.
 * @param {Object} src - Object data to write into dest.
 * @param {string[]} [exclude=null] - Array of properties not to copy from src to dest.
 * @returns {Object} the destination object.
 */
export function assignOwn(dest, src, exclude = null) {

	for (let p in src ) {

		if (exclude && exclude.includes(p)) continue;
		var desc = getPropDesc(dest, p );

		if ( desc === null || (desc.set === undefined && !desc.writable )) continue;

		dest[p] = src[p];

	} //for


	return dest;

}

/**
 * Convert an object to a JSON object ready to be stringified.
 * @param {Object} obj - the objet to convert.
 * @param {object.<string,*>} [excludes=null] - object with keys to be excluded from encoding if found on the target object.
 * @param {.<string,*>} [includes=null] - object with keys which will always be encoded if found on the target object.
 * @param {bool} [writableOnly=true] - Whether to only include writable properties / exclude read-only properties.
 */
export function jsonify(obj, excludes=null, includes=null, writableOnly = true) {

	let r = {}, p, sub;

	if ( excludes == null ) excludes = {};
	if (includes) {

		for( p in includes ) {

			sub = obj[p];
			if ( sub === undefined ) continue;
			else if ( typeof sub === 'object' && sub !== null && sub.toJSON ) r[p] = sub.toJSON();
			else r[p] = sub;

		}
	}

	var proto = Object.getPrototypeOf(obj);
	while (proto != Object.prototype) {

		for ( p of Object.getOwnPropertyNames(proto)) {

			if ( excludes.hasOwnProperty(p) ) continue;

			var desc = Object.getOwnPropertyDescriptor(proto, p);
			if (writableOnly && desc.set === undefined && !desc.writable) continue;

			sub = obj[p];
			if ( sub === undefined || typeof sub === 'function') continue;
			else if ( typeof sub === 'object' && sub !== null && sub.toJSON ) r[p] = sub.toJSON();
			else r[p] = sub;

		}

		proto = Object.getPrototypeOf(proto);

	} //

	return r;

}