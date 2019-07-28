var clone = function( src, dest={} ){

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

module.exports = {
	
/**
 * Create a deep clone of an object. Any clone functions in source objects
 * or sub-objects are called to provide their own clone implementations.
 * @todo eliminate circular references.
 * @param {object} src - object to clone.
 * @param {object} [dest={}] object to merge cloned values into.
 */
clone:clone,


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