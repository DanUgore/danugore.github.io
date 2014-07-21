TextParser = {};

TextParser.parseCustomFormat = function (text) {
	var content = text.replace(/\n\s*/g,'').split(':'); // Removes newlines \n and leading spaces \s* after newlines.
	var commands = {};
	for (var i = 0, depth = 0, levels = []; i < content.length; i++) {
		var arg = content[i];
		if (!arg) { // "" means consecutive. Go down one level.
			depth++;
			continue;
		}
		if (!levels[depth-1]) depth = 0; // If we go down but there were no levels above use... then we must be at the top.
		if (!depth) { // Make New Property
			addLevel(commands, arg, true);
			levels = [arg];
			continue;
		}
		// TRAVERSING THE DEPTHS!!!
		var currentLevel = commands;
		for (var d = 0; d < depth-1; d++) {
			if (typeof currentLevel[levels[d]] !== 'object') { // parent[level] = value
				var val = currentLevel[levels[d]];
				currentLevel[levels[d]] = {};
				currentLevel[levels[d]][val] = true;
				currentLevel = currentLevel[levels[d]];
				continue;
			}
			if (currentLevel[levels[d]].length) { // parent[level] = []
				if (typeof currentLevel[levels[d]][currentLevel[levels[d]].length-1] !== 'object') { // parent[level][N] = value
					var val = currentLevel[levels[d]][currentLevel[levels[d]].length-1];
					currentLevel[levels[d]][currentLevel[levels[d]].length-1] = {};
					currentLevel[levels[d]][currentLevel[levels[d]].length-1][val] = true;
					currentLevel = currentLevel[levels[d]][currentLevel[levels[d]].length-1];
				} else {
					currentLevel = currentLevel[levels[d]][currentLevel[levels[d]].length-1];
				}
			} else {
				currentLevel = currentLevel[levels[d]];
			}
		}
		//addLevel(currentLevel[levels[depth-1]], arg);
		// parent = true | make parent = child
		// parent = child | make parent = {child:[true, true]}
		// parent = value | make parent = {value: true,child: true}
		if (typeof currentLevel[levels[depth-1]] !== 'object') { // parent = someVal
			if (currentLevel[levels[depth-1]] === true) { // parent = true
				currentLevel[levels[depth-1]] = arg;
			} else { // parent = value
				var val = currentLevel[levels[depth-1]];
				currentLevel[levels[depth-1]] = {};
				currentLevel[levels[depth-1]][val] = true;
				if (currentLevel[levels[depth-1]][arg]) currentLevel[levels[depth-1]][arg] = [val, true];
				else {
					currentLevel[levels[depth-1]][val] = true;
					currentLevel[levels[depth-1]][arg] = true;
				}
			}
		}
		else if (currentLevel[levels[depth-1]].length) { // parent = []
			var n = currentLevel[levels[depth-1]].length-1
			if (typeof currentLevel[levels[depth-1]][n] !== 'object') { // parent[n] = true or parent[n] = value
				if (currentLevel[levels[depth-1]][n] === true) { // parent[n] 
					currentLevel[levels[depth-1]][n] = arg;
				} else { // parent[n] = value
					var val = currentLevel[levels[depth-1]][n];
					currentLevel[levels[depth-1]][n] = {};
					currentLevel[levels[depth-1]][n][val] = true;
					if (currentLevel[levels[depth-1]][n][arg]) currentLevel[levels[depth-1]][n][arg] = [val, true];
					else {
						currentLevel[levels[depth-1]][n][val] = true;
						currentLevel[levels[depth-1]][n][arg] = true;
					}
				}
			} else {
				addLevel(currentLevel[levels[depth-1]][n], arg);
			}
		} else {
			addLevel(currentLevel[levels[depth-1]], arg);
		}
		levels[depth] = arg;
		depth = 0;
	}
	return commands; // Return the object built from the parsed text
	
	// Define addLevel() function
	// Eases the headache of rewriting this code a lot.
	function addLevel(parent, child, topLevel) {
		// topLevel is a bool to indicate whether our parent is the `commands` object.
		if (topLevel) {
			if (!parent[child]) parent[child] = true; // child: undefined
			else if (typeof parent[child] === 'object' && parent[child].length) parent[child].push(true); // child: []
			else parent[child] = [parent[child], true]; // child: value
		} else {
			// parent = [...] | make parent = [...,child]
			// parent = {} | make parent[child] = true
			// parent = {child:true} | make parent[child] = [true, true]
			if (!parent[child]) { // parent = {...} | make parent[child] = true
				parent[child] = true;
			} else if (typeof parent[child] !== 'object') { // parent[child] = ... | make parent[child] = [..., true]
				var val = parent[child]; 
				parent[child] = {};
				parent[child] = [val, true];
			} else if (parent[child].length) {
				parent[child].push(true);
			} else {
				parent[child] = [parent[child], true];
			}
		}
	};
}

