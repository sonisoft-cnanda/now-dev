//registering with the vscode API
const vscode = acquireVsCodeApi();

const onwindowLoad = () => emitMessage("Window has been reloaded", "reload");

//registering an event listener which will get triggered 
//by the extension to load the js tree with the data 
//coming from the extension.
window.addEventListener("message", event => {
	emitMessage("[Webview] Loading js tree");
	loadJSTree(event.data);
});

(function ($, undefined) {
	$.jstree.plugins.noclose = function () {
		this.close_node = $.noop;
	};
})(jQuery);

// Loads the jstree with the data given
function loadJSTree(data) {
	$('#container1').jstree(getJSTreeConfig(data)); //registering left js tree
	$('#container2').jstree(getJSTreeConfig(data)); // registering right js tree

	addEventListenerToTrees();

	document.getElementById('openDiff').disabled = true;
	document.getElementById('markAsResolved').disabled = true;
}

function getJSTreeConfig(data) {
	return {
		core: {
			animation: 0,
			check_callback: true,
			themes: {
				xstripes: true
			},
			data: data
		},
		checkbox: {
			three_state: false,
			keep_selected_style: true
		},
		plugins: [
			'noclose', "checkbox",
			"contextmenu", "dnd", "search",
			"state", "types", "wholerow"
		],
		contextmenu: getContextMenuObj()
	};
}

// Emit message from the webview to the extension
function emitMessage(message, command = 'alert') {
	vscode.postMessage({
		command,
		text: message
	});
}

function onJSTreeChanged1(e, data) {
	onJSTreeChanged(e, data, 1);

}

function onJSTreeChanged2(e, data) {
	onJSTreeChanged(e, data, 2);
}

function onJSTreeChanged(e, data, number) {
	if (data.action === 'select_node') {
		emitMessage('Select node event called');
		selectOtherNode(number, data.node.id, true);

	} else if (data.action === 'deselect_node') {
		selectOtherNode(number, data.node.id, false);
	}

	if (data.selected.length === 0) {
		//disable the buttons
		document.getElementById('openDiff').disabled = true;
		document.getElementById('markAsResolved').disabled = true;
	} else {
		//enable the buttons
		document.getElementById('openDiff').disabled = false;
		document.getElementById('markAsResolved').disabled = false;
	}
}

function selectOtherNode(num, id, select) {
	if (num === 1) {
		//node from tree 1 has been clicked
		// id[1] = '2';
		id = replaceAt(id, 1, '2');
		// emitMessage(id);
		// $('#container2').jstree('deselect_all');
		if (select) {
			$('#container2').jstree('select_node', id);
		} else {
			$('#container2').jstree('deselect_node', id);
		}
	} else {
		//node from tree 2 has been clicked 
		// id[1] = '1';
		id = replaceAt(id, 1, '1');
		// emitMessage(id);
		// $('#container1').jstree('deselect_all');
		if (select) {
			$('#container1').jstree('select_node', id);
		} else {
			$('#container1').jstree('deselect_node', id);
		}
	}
}

function getOtherNodeId(num, id) {
	return num === 1 ? replaceAt(id, 1, '2') : replaceAt(id, 1, '1');
}

function replaceAt(msg, index, replacement) {
	return msg.substr(0, index) + replacement + msg.substr(index + replacement.length);
}

function getNode(id, number) {
	if (number === 1) {
		return $('#container1').jstree(true).get_node(id);
	} else {
		return $('#container2').jstree(true).get_node(id);
	}
}

function openDiffClicked() {
	const instance = $('#container1').jstree(true);

	for (let i = 0; i < instance.get_selected().length; i++) {
		const nodeId = instance.get_selected()[i];
		const node = instance.get_node(nodeId);
		const parents = node.parents;

		if (parents.length >= 4) {
			const fileMetadata = { appName: getNode(parents[2], 1).text, superCoverName: getNode(parents[1], 1).text, coverName: getNode(parents[0], 1).text, fileName: node.text };
			emitMessage(fileMetadata, 'openFile');
		}
	}
}

function markAsResolved() {
	const arrayOfFileMetadata = [];

	emitMessage('mark as resolve called');
	const instance = $('#container1').jstree(true);

	for (let i = 0; i < instance.get_selected().length; i++) {
		const nodeId = instance.get_selected()[i];
		const node = instance.get_node(nodeId);
		const parents = node['parents'];

		if (parents.length >= 4) {
			const fileMetadata = getParentPathFromNode(node);
			arrayOfFileMetadata.push(fileMetadata);
			emitMessage(fileMetadata);
		}
	}

	deleteSelectedNodesFromTree('#container1');
	deleteSelectedNodesFromTree('#container2');
	emitMessage(JSON.stringify(arrayOfFileMetadata), 'changeTime');
}

function markAsResolvedFromNodeObj(node) {
	const parents = node.parents;

	if (parents && parents.length >= 4) {
		const arrayOfFileMetadata = [];
		const fileMetadata = getParentPathFromNode(node);

		arrayOfFileMetadata.push(fileMetadata);
		emitMessage(JSON.stringify(arrayOfFileMetadata), 'changeTime');

		deleteNode(node);
		emitMessage('second tree done');
	}
}

function deleteSelectedNodesFromTree(tree) {
	emitMessage('inside the delete selected nodes from tree');
	const instance = $(tree).jstree(true);
	const selectedNodes = instance.get_selected();

	for (let i = 0; i < selectedNodes.length; i++) {
		const node = instance.get_node(selectedNodes[i]);
		const parents = node.parents;
		instance.delete_node(node);

		const parentId = parents[0];
		const parentNode = instance.get_node(parentId);
		const childrenOfParent = parentNode.children;

		if (childrenOfParent.length === 0) {
			instance.delete_node(parentId);
		}

		const superParentId = parents[1];
		const superParentNode = instance.get_node(superParentId);
		const childrenOfSuperParent = superParentNode['children'];

		if (childrenOfSuperParent.length === 0) {
			instance.delete_node(superParentId);
		}

		const rootId = parents[2];
		const rootNode = instance.get_node(rootId);
		const childrenOfRoot = rootNode.children;

		if (childrenOfRoot.length === 0) {
			instance.delete_node(rootId);
		}
	}

	emitMessage('after delete node cascade');
}

function deleteNodeCascade(node, instance) {
	const parents = node.parents;
	instance.delete_node(node); // My_script

	const parentId = parents[0];
	const parentNode = instance.get_node(parentId); // Script include
	const childrenOfParent = parentNode.children;

	if (childrenOfParent.length === 0) {
		instance.delete_node(parentId);
	}

	const superParentId = parents[1];
	const superParentNode = instance.get_node(superParentId); // Server development
	const childrenOfSuperParent = superParentNode.children;

	if (childrenOfSuperParent.length === 0) {
		instance.delete_node(superParentId);
	}

	const rootId = parents[2];
	const rootNode = instance.get_node(rootId); // My app
	const childrenOfRoot = rootNode.children;

	if (childrenOfRoot.length === 0) {
		instance.delete_node(rootId);
	}
}

function deleteNode(node) {
	emitMessage('before delete node');
	const otherNode = getOtherNodeFromNode(node);
	emitMessage('after getting other node');
	emitMessage(otherNode);
	deleteNodeCascade(node, getInstanceFromNode(node));
	emitMessage('after delete from instance 1');
	deleteNodeCascade(otherNode, getInstanceFromNode(otherNode));
	emitMessage('after delete node');
}

function addEventListenerToTrees() {
	// adding event listeners to the js tree
	$('#container1').on("changed.jstree", onJSTreeChanged1); //adding event listeners ends for left tree
	$('#container2').on("changed.jstree", onJSTreeChanged2); //adding event listeners ends for left tree

}

function removeEventListenerToTrees() {
	// Not working
	$('#container1').off('changed.jstree');
	$('#container2').off('changed.jstree');
}

function getContextMenuObj() {
	return {
		items(node) {
			function openDiff(obj) {
				openDiffFromNodeFunction(node);
			};

			function markAsResolved() {
				markAsResolvedFromNodeObj(node);
			};

			function overwriteServer() {
				overwriteServerFile(node);
			};

			function overwriteLocal() {
				overwriteLocalFile(node);
			};

			if (node.parents.length >= 3) {
				return {
					'Open Diff': {
						separator_before: false,
						separator_after: true,
						label: "Open Diff",
						action(obj) {
							openDiff(obj);
						},
					},
					'Mark as resolved': {
						separator_before: false,
						separator_after: true,
						label: "Mark as resolved",
						action(obj) {
							markAsResolved();
						},
					},
					'Overwrite server': {
						separator_before: false,
						separator_after: true,
						label: "Overwrite Server",
						action(obj) {
							overwriteServer();
						},
					},
					'Overwrite Local': {
						separator_before: false,
						separator_after: true,
						label: "Overwrite Local",
						action(obj) {
							overwriteLocal();
						}
					}
				};
			}
			return {};
		}
	};
}

function overwriteLocalFile(node) {
	emitMessage('in overwrite local method');
	//get the path
	const fileMetadata = getParentPathFromNode(node);
	emitMessage(fileMetadata);
	//emit 
	emitMessage(fileMetadata, 'overwriteLocal');
	//delete the node
	deleteNode(node);
}

function overwriteServerFile(node) {
	//get the path
	const fileMetadata = getParentPathFromNode(node);
	//emit
	emitMessage(fileMetadata, 'overwriteServer');
	//delete the node
	deleteNode(node);
}

function openDiffFromNode(node) {
	emitMessage('open diff from node');
}

function openDiffFromNodeFunction(node) {
	const path = getParentPathFromNode(node);
	emitMessage(path, 'openFile');
}

function getTreeFromNodeId(nodeId) {
	return nodeId[1] === '1' ? 1 : 2;
}

function getParentPathFromNode(node) {
	const parents = node.parents;

	if (parents.length >= 4) {
		const treeId = getTreeFromNodeId(node.id);
		return { appName: getNode(parents[2], treeId).text, superCoverName: getNode(parents[1], treeId).text, coverName: getNode(parents[0], treeId).text, fileName: node.text };
	} else {
		return '';
	}
}

function getInstanceFromNode(node) {
	emitMessage('Get instance from node');
	const treeId = getTreeFromNodeId(node['id']);
	return treeId === 1 ? $('#container1').jstree(true) : $('#container2').jstree(true);
}

function getOtherNodeFromNode(node) {
	const id = node.id;
	const treeId = getTreeFromNodeId(id);
	const otherTreeId = getOtherTreeIdFromTreeId(treeId);
	const otherNodeId = getOtherNodeId(treeId, id);
	return getNode(otherNodeId, otherTreeId);
}

function getOtherTreeIdFromTreeId(treeid) {
	return treeid === 1 ? 2 : 1;
}