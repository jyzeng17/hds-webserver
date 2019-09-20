const PLACEHOLDER = {
	BOOLEAN: 		'true/false',
	HDS_LOCATION: 	'hdfs/hbase',
	TIME: 			'yyyy-MM-dd\'T\'HH:mm:ss.SSS',
	PROGRESS: 		'0.0 ~ 1.0'
}
const PROTOCOLS = [
	'http',
	'ftp',
	'smb',
	'hdfs',
	'local',
	'file',
	'hds',
	'jdbc'
];

$.fn.exists = function() {
	return this.length > 0;
}

function QueryFormGroup(name) {
	this.name = name;
	this.parentName = '';
	this.isHidden = false;
	this.isRequired = false;
	this.isProtocolButtonGroup = false;
	this.placeholder = '';

	this.setParentName = function(parentName) {
		this.parentName = parentName;
		return this;
	}

	this.setHidden = function() {
		this.isHidden = true;
		return this;
	}

	this.setRequired = function() {
		this.isRequired = true;
		return this;
	}

	this.setProtocolButtonGroup = function() {
		this.isProtocolButtonGroup = true;
		return this;
	}

	this.setPlaceholder = function(placeholder) {
		this.placeholder = placeholder;
		return this;
	}

	this.html = function() {
		let isSubQuery = (this.parentName !== "");
		let id = ((!isSubQuery)? '' : this.parentName + '-') + this.name;
		let hidden = (this.isHidden)? ' hidden' : '';
		let labelSize = (!isSubQuery)? '2' : '3';
		let inputGroupSize = (!isSubQuery)? '9' : '8';
		let required = (this.isRequired)? 'checked disabled' : '';
		let protocolButtonGroup = (!this.isProtocolButtonGroup)?
			'<input type="text" class="form-control" id="text-' + id +
			'" placeholder="' + this.placeholder + '">' :
			createProtocolButtonGroup(id);

		return '<div class="form-group" id="' + id + '-form-group"' +
			hidden + '>' + '<label for="checkbox-' + id + '" class="col-sm-' +
			labelSize + ' control-label">' + this.name + '</label>' +
			'<div class="col-sm-' + inputGroupSize + ' input-group">' +
			'<span class="input-group-addon">' +
			'<input type="checkbox" id="checkbox-' + id + '"' +
			required + '></span>' + protocolButtonGroup + '</div></div>';
	}
}

function createProtocolButtonGroup(query) {
	let html = '<div class="btn-group" id="btn-group-' + query + '">';

	PROTOCOLS.forEach(function(protocol) {
		html += '<button type="button" class="btn btn-default protocol-btn" ' +
			'id="button-' + query + '-' + protocol + '" ' + 'query="' + query +
			'" ' + 'protocol="' + protocol + '">' + protocol + '://' +
			'</button>';
	});

	html += '</div>';

	return html;
}

function createSelectPickerFormGroup(query) {
	return '<div class="form-group"><label class="col-sm-2 control-label">' +
		query + '</label><div class="col-sm-9 input-group">' +
		'<span class="input-group-addon">' +
		'<input type="checkbox" checked disabled></span><div id="' + query +
		'-select-picker"></div>' +
		'<input type="text" class="form-control" id="text-' + query +
		'" placeholder="Additional path..."></div></div>';
}

function createCollapseButton(parentName) {
	return '<div class="form-group"><div class="col-sm-offset-2 col-sm-1">' +
		'<button type="button" class="btn btn-default" onclick="$(\'#' +
		parentName + '-queries\').toggle();$(\'#' + parentName +
		'-queries-glyphicon\').toggleClass(\'glyphicon-chevron-down\');$(\'#' +
		parentName +
		'-queries-glyphicon\').toggleClass(\'glyphicon-chevron-up\');">' +
		'<span class="glyphicon glyphicon-chevron-down" id="' + parentName +
		'-queries-glyphicon"></span></button></div></div>';
}

function createSelectPicker(dataInfo, query, selectPickerID) {
	// Do not show selectpicker if no result
	if (dataInfo.length <= 0)
		return '';

	let html = '<select class="selectpicker inodeSelector" '
		+ 'id="selectpicker-' + query + '-' + selectPickerID + '" '
		+ 'selectpicker-query="' + query + '" '
		+ 'selectpicker-id="' + selectPickerID + '" '
		+ 'data-width="fit" '
		+ 'data-title="---" '
		+ 'data-live-search="true">';

	dataInfo.forEach(function(element) {
		let name = element.name;

		if (element.type === 'directory') {
			name += '/';
		}

		html += '<option>' + name + '</option>';
	});

	html += '</select>';

	return html;
}

(function() {
	"use strict";

	function createNavbar(tagID) {
		const apis = [
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
		const currentPage = window.location.pathname.split('/').pop();

		let html = '<nav class="navbar navbar-default">' +
			'<div class="container-fluid"><div class="navbar-header">' +
			'<a class="navbar-brand" href="home">HDS</a></div>' +
			'<ul class="nav navbar-nav">';

		for (let i = 0; i < apis.length; ++i) {
			let capitalizedApi = apis[i].charAt(0).toUpperCase() +
				apis[i].slice(1);

			html += (currentPage === (apis[i] + ".html"))
				? '<li class="active"><a href="#">' + capitalizedApi +
				'</a></li>'
				: '<li><a href="' + apis[i] + '.html">' + capitalizedApi +
				'</a></li>';
		}

		html += '</ul></div></nav>';

		$("#" + tagID).html(html);
	}

	function createResultPanel(tagID) {
		$("#" + tagID).html('<div class="panel panel-default">' +
			'<div class="panel-heading"><h3 class="panel-title">Result</h3>' +
			'</div><div id="result-table" style="padding:10px"></div></div>');
	}

	function initialize() {
		let navBarID = 'navbar';
		let resultPanelID = 'result-panel';

		if ($("#" + navBarID).exists())
			createNavbar(navBarID);
		else
			throw 'Tag ID "' + navBarID + '" not found.';

		if ($("#" + resultPanelID).exists())
			createResultPanel(resultPanelID);
		else
			throw 'Tag ID "' + resultPanelID + '" not found.';
	}

	initialize();
})();
