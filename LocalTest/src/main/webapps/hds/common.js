const PROTOCOLS = [
	"http",
	"ftp",
	"smb",
	"hdfs",
	"local",
	"file",
	"hds",
	"jdbc"
];

$.fn.exists = function() {
	return this.length > 0;
}

//$.fn.toggleDisabled = function() {
//	var isDisabled = this.is(":disabled");
//	this.attr("disabled", !isDisabled);
//}

function createProtocolButtonGroup(idName) {
	const LENGTH = PROTOCOLS.length;
	var content = '';
	content += '<div class="btn-group" id="btn-group-' + idName + '">';
	for (let i = 0; i < LENGTH; ++i) {
		let protocol = PROTOCOLS[i];
		content += '<button type="button" class="btn btn-default" id="button-' + idName + '-'
			+ protocol + '" onclick="selectProtocolButton(\'' + protocol
			+ '\', \'' + idName + '\');">' + protocol + '://</button>';
	}
	content += '</div>';
	return content;
}

function createQueryFormGroup(parentName, name, isHidden, isRequired, isProtocolButtonGroup, placeholder = "") {
	var isSubQuery = (parentName !== "");
	var idName = ((!isSubQuery)? '' : parentName + '-') + name;
	var content = '';
	content += '<div class="form-group" id="' + idName + '-form-group"'
		+ ((isHidden)? ' hidden' : '') + '>';
	content += '<label for="checkbox-' + idName + '" class="col-sm-'
		+ ((!isSubQuery)? '2' : '3')  + ' control-label">' + name + '</label>';
	content += '<div class="col-sm-' + ((!isSubQuery)? '9' : '8')
		+ ' input-group">';
	content += '<span class="input-group-addon">';
	content += '<input type="checkbox" id="checkbox-' + idName + '"'
		+ ((isRequired)? 'checked disabled' : '') + '>';
	content += '</span>';
	content += (!isProtocolButtonGroup)
		? '<input type="text" class="form-control" id="text-' + idName + '" placeholder="' + placeholder + '">'
		: createProtocolButtonGroup(idName);
	content += '</div>';
	content += '</div>';
	return content;
}

function createCollapseButton(parentName) {
	var content = '';
	content += '<div class="form-group">';
	content += '<div class="col-sm-offset-2 col-sm-1">';
	content += '<button type="button" class="btn btn-default" onclick="$(\'#'
		+ parentName + '-queries\').toggle();$(\'#' + parentName
		+ '-queries-glyphicon\').toggleClass(\'glyphicon-chevron-down\');$(\'#'
		+ parentName
		+ '-queries-glyphicon\').toggleClass(\'glyphicon-chevron-up\');">';
	content += '<span class="glyphicon glyphicon-chevron-down" id="'
		+ parentName + '-queries-glyphicon"></span>';
	content += '</button>';
	content += '</div>';
	content += '</div>';
	return content;
}

(function() {
	"use strict";


	function renderNavbar() {
		const APIS = [
			"access",
			"list",
			"delete",
			"batchdelete",
			"watch",
			"addmapping",
			"listmapping",
			"deletemapping",
			"loading",
			"kill"
		]
		const LENGTH = APIS.length;
		const currentPage = window.location.pathname.split('/').pop();
		var i, content = '';
		content += '<nav class="navbar navbar-default">'
		content += '<div class="container-fluid">';
		content += '<div class="navbar-header">';
		content += '<a class="navbar-brand" href="home.html">HDS</a>';
		content += '</div>';
		content += '<ul class="nav navbar-nav">';
		for (i = 0; i < LENGTH; ++i) {
			let api = APIS[i];
			let apiCapitalized = api.charAt(0).toUpperCase() + api.slice(1);
			content += (currentPage === (api + ".html"))
				? '<li class="active"><a href="#">' + apiCapitalized + '</a></li>'
				: '<li><a href="' + api + '.html">' + apiCapitalized + '</a></li>';

		}
		content += '</ul>';
		content += '</div>';
		content += '</nav>';
		$("#navbar").html(content);
	}

	function renderResultPanel() {
		var content = '';
		content += '<div class="panel panel-default">';
		content += '<div class="panel-heading">';
		content += '<h3 class="panel-title">Result</h3>';
		content += '</div>';
		content += '<div id="result-table" style="padding:10px"></div>';
		content += '</div>';
		$("#result-panel").html(content);
	}


	function initialize() {
		if ($("#navbar").exists())
			renderNavbar();
		if ($("#result-panel").exists())
			renderResultPanel();
	}

	initialize();
})();