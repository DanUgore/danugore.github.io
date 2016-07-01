var sf = module.exports = {}
/* Formats text and replaces {{placeholders}} with respective text.
 * {{placeholder}} is replaced with `replacements["placeholder"]`
 * Recursive replacement [[placeholder]]seperator[[format]]
 * - For each `replacements` object in `replacements["placeholder"]` array
 * - Repeat `format` formatted with the specified {{placeholders}} filled
 * - Join with the `seperator`
*/

sf.format = sf.tkformat = function (text, replacements, debug) {
	var format = sf.format;
	var rep = replacements || {};
	var delimiters = "{}[]";
	var splitrx = new RegExp("("+(delimiters.split("").map(ch => "\\"+ch+"{2}").join("|"))+")");
	var tokens = text.split(splitrx);
	// Buffers
	var out = "", ph = "", sep = "", fmt = "", lastdelim = "", open = 0;
	/* 5 States
	 * Normal (NORM)
	 * Reading a Simple Placeholder (TXPH)
	 * Reading a Recursive Placeholder (RCPH)
	 * Reading a RCPH Seperator (RCSP)
	 * Reading a RCPH Format (RFMT)
	*/
	var STATE = "NORM";
	for (var i = 0; i < tokens.length; i++) {
		var token = tokens[i];
		if (!token) continue;
		if (debug) console.log(STATE);
		var delim = (token.length === 2 && token[0] === token[1] && delimiters.indexOf(token[0]) !== -1) ? token[0] : false;
		if (delim) {
			if (delim === '{') {
				switch (STATE) {
					case "RCSP": sep += token; delim = false; break;
					case "RFMT": fmt += token; delim = false; break;
					case "TXPH":
					case "RCPH":
						out += lastdelim + ph;
						ph = "";
					case "NORM":
						STATE = "TXPH";
				}
			} else if (delim === '}') {
				switch (STATE) {
					case "NORM": out += token; delim = false; break;
					case "RCSP": sep += token; delim = false; break;
					case "RFMT": fmt += token; delim = false; break;
					case "RCPH":
					case "TXPH":
						var phname = ph.trim();
						var replace = (STATE == "TXPH" && phname in rep);
						if (replace) out += rep[phname];
						else out += lastdelim + ph + token;
						STATE = "NORM";
						ph = ""; break;
				}
			} else if (delim === '[') {
				switch (STATE) {
					case "RCSP":
						open++;
						STATE = "RFMT"; break;
					case "RFMT":
						open++; fmt += token;
						delim = false; break;
					case "RCPH":
					case "TXPH":
						out += lastdelim + ph;
						ph = "";
					case "NORM":
						STATE = "RCPH";
				}
			} else if (delim === ']') {
				switch (STATE) {
					case "RCPH":
						STATE = "RCSP"; break;
					case "TXPH":
						out += lastdelim + ph;
						ph = ""; STATE = "NORM";
					case "NORM":
						out += token; delim = false; break;
					case "RCSP": 
						out += lastdelim + ph + token + sep + token;
						STATE = "NORM";
						ph = ""; sep = ""; fmt = ""; break;					
					case "RFMT":
						open--;
						// if (debug) console.log("PH: "+ph+"\nSEP: "+sep+"\nFMT: "+fmt);
						if (open) {
							fmt += token; delim = false;
							break;
						}
						var phname = ph.trim();
						var replace = phname in rep;
						if (debug) console.log(format("Replace: {{a}}\nPH: '{{b}}'\nSEP: '{{c}}'\nFMT: '{{d}}'\n", {a:replace,b:ph,c:sep,d:fmt}));
						if (replace) {
							var arr = [].concat(rep[phname]); // Ensures it's an array.
							out += arr.map(dict => format(fmt, dict, debug)).join(sep);
						} else {
							out += lastdelim + ph + token + sep + token + lastdelim + fmt + token;
						}
						STATE = "NORM";
						ph = ""; sep = ""; fmt = ""; break;
				}
			}
			if (delim) lastdelim = token;
		} else {
			switch (STATE) {
				case "NORM": out += token; break;
				case "TXPH": ph += token; break;
				case "RCPH": ph += token; break;
				case "RCSP": sep += token; break;
				case "RFMT": fmt += token; break;
			}
		}
	}
	switch (STATE) {
		case "RCPH": case "TXPH":
			out += lastdelim + ph; break;
		case "RCSP": case "RFMT": 
			out += "[[" + ph + "]]" + sp + (fmt && ("[[" + fmt));
		case "NORM": default:
	}
	return out;
}
