/**
 * Create a deep clone of an object.
 * @todo eliminate circular references.
 * @param {object} src - objec to clone.
 * @param {object} [dest={}] object to merge cloned values into.
 */
export function clone( src, dest={} ) {

	var o, f;
	for( let p in src ) {

		o = src[p];
		if ( o instanceof Array ) {

			dest[p] = clone( [], o );

		} else if ( o instanceof Object ) {

			f = ( o.clone );
			if ( f && typeof f === 'function' ) dest[p] = f.call( o );
			else dest[p] = clone( {}, o );

		} else dest[p] = o;

	}

	return dest;

}


/**
 * Return an array of all Properties on an Object, and its ancestors.
 * @param {Object} obj - Object whose properties are returned.
 * @param {bool} ownData - whether to include private data properties.
 * @param {bool} getters - whether to include getter properties.
 * @return {string[]} Array of property names.
 */
export function getProps( obj, ownData=true, getters=true ) {

	if ( !obj ) return [];

	let proto = ownData ? obj : Object.getPrototypeOf(obj);

	let p, props = [];

	/// fast version for when private variables and getters don't
	/// have to be ruled out.
	if ( ownData === true && getters === true ) {
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
					if ( ownData === true ) props.push( p );
					else console.log( 'hiding internal prop: ' + p );
				} else {
					if ( getters === true ) props.push(p)
				}

			}
			proto = Object.getPrototypeOf( proto );

		} // while-loop.

	}

	return props;

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
 * Copies all values from a source object into a destination object.
 * @param {Object} dest - Destination for json data.
 * @param {Object} src - Object data to write into dest.
 * @param {string[]} [exclude=null] - Array of properties not to copy from src to dest.
 * @returns {Object} the destination object.
 */
function assign(dest, src, exclude = null) {

	for (let p in src) {

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
 * @param {string[]} [excludes=null] - Array of properties to exclude from encoding. 
 * @param {string[]} [includes=null] - Array of properties to always include in encoding, if they exist. 
 * @param {bool} [writableOnly=true] - Whether to only include writable properties.
 */
function jsonify(obj, excludes=null, includes=null, writableOnly = true) {

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

/**
 * Copies all values from a source object into a destination object.
 * @param {Object} dest - Destination for json data.
 * @param {Object} src - Object data to write into dest.
 * @param {string[]} [exclude=null] - Array of properties not to copy from src to dest.
 * @returns {Object} the destination object.
 */
export function assign(dest, src, exclude = null) {

	for (let p in src) {

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
 * @param {string[]} [excludes=null] - Array of properties to exclude from encoding. 
 * @param {string[]} [includes=null] - Array of properties to always include in encoding, if they exist. 
 * @param {bool} [writableOnly=true] - Whether to only include writable properties.
 */
export function jsonify(obj, excludes=null, includes=null, writableOnly = true) {

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