var selectedProtocol;

function selectProtocolButton(protocol, queryName) {
	const LENGTH = PROTOCOLS.length;
	for (let i = 0; i < LENGTH; ++i) {
		let element = PROTOCOLS[i];
		if (element === protocol ) {
			$("#button-" + element).attr("style", "background:#ededed");
		} else {
			$("#button-" + element).removeAttr("style");
		}
		// toggle from-location query
		if (protocol === "hds") {
			$("#" + queryName + "-location-form-group").show();
		} else {
			$("#" + queryName + "-location-form-group").hide();
		}
	}
	selectedProtocol = protocol;
	$("#text-" + queryName).val(protocol + "://");
}

(function() {
	"use strict";

	const QUERIES = [
		{parentName: "", name: "from"},
		{parentName: "from", name: "file"},
		{parentName: "from", name: "directory"},
		{parentName: "from", name: "time"},
		{parentName: "from", name: "mintime"},
		{parentName: "from", name: "maxtime"},
		{parentName: "from", name: "size"},
		{parentName: "from", name: "minsize"},
		{parentName: "from", name: "maxsize"},
		{parentName: "from", name: "name"},
		{parentName: "from", name: "location"},
		{parentName: "", name: "limit"},
		{parentName: "", name: "offset"}
	];

	function renderQueryFormGroups() {
		var content = '';
		content += createQueryFormGroup("", "from", false, true, true);
		content += createQueryFormGroup("", "from", false, true, false);
		content += createCollapseButton("from");
		content += '<div id="from-queries" hidden>';
		content += createQueryFormGroup("from", "file", false, false, false, "true/false");
		content += createQueryFormGroup("from", "directory", false, false, false, "true/false");
		content += createQueryFormGroup("from", "time", false, false, false, "yyyy-MM-dd'T'HH:mm:ss.SSS");
		content += createQueryFormGroup("from", "mintime", false, false, false, "yyyy-MM-dd'T'HH:mm:ss.SSS");
		content += createQueryFormGroup("from", "maxtime", false, false, false, "yyyy-MM-dd'T'HH:mm:ss.SSS");
		content += createQueryFormGroup("from", "size", false, false, false);
		content += createQueryFormGroup("from", "minsize", false, false, false);
		content += createQueryFormGroup("from", "maxsize", false, false, false);
		content += createQueryFormGroup("from", "name", false, false, false);
		content += createQueryFormGroup("from", "location", true, false, false, "hdfs/hbase");
		content += '</div>';
		content += createQueryFormGroup("", "limit", false, false, false);
		content += createQueryFormGroup("", "offset", false, false, false);
		$("#query-form-groups").html(content);
	}

	function renderStaticContents() {
		renderQueryFormGroups();
	}

	function getUrlWithInodePath(inodePath) {
		return "http://slave01:8000/dataservice/v1/list" + getQuery(inodePath);
	}

	function getQuery(inodePath = "") {
		const LENGTH = QUERIES.length;
		var query = "";
		var isFirstQuery = true, isInSubQuery = false;
		for (let i = 0; i < LENGTH; ++i) {
			let element = QUERIES[i];
			let isSubQuery = (element.parentName !== "");
			let idName = ((!isSubQuery)? '' : element.parentName + '-')
				+ element.name;
			let newQuery = "";
			if ($("#checkbox-" + idName).is(":checked")) {
				let textValue = $("#text-" + idName).val();
				if (isFirstQuery && !isInSubQuery) {
					newQuery += "?";
					isFirstQuery = false;
				} else if (!isFirstQuery && !isInSubQuery) {
					if (isSubQuery) {
						isInSubQuery = true;
						newQuery += "?";
					} else {
						newQuery += "&";
					}
				} else if (!isFirstQuery && isInSubQuery) {
					if (!isSubQuery) {
						isInSubQuery = false;
					}
					newQuery += "&";
				}
				if (inodePath && (element.name === "from")) {
					newQuery += element.name + "=" + encodeURIComponent(inodePath);
				}
				else {
					newQuery += element.name + "=" + encodeURIComponent(textValue);
				}
				query += (!isSubQuery)? newQuery : encodeURIComponent(newQuery);
			}
		}
		return query;
	}

	function refreshDirectoryTable(url) {
		$("#alert-panel").hide();

		if (url === "button.send") {
			//url = "http://" + window.location.host + "/dataservice/v1/list?" + getQuery();
			url = "http://slave01:8000/dataservice/v1/list" + getQuery();
			//url = "http://" + $("#text-host").val() + ":" + $("#number-port").val() + "/dataservice/v1/list?" + getQuery();
			//console.log("url === " + url);
		}

		window.location.hash = url;
		//console.log("2 url === " + url);

		$.get(url, function(data) {
			// render template: dust.render(templateName, data, callback);
			dust.render('explorer', data, function(err, out) {
				$('#result-table').html(out);

				$(".explorer-browse-links").click(function () {
					let inodePath = $(this).attr('inode-path');
					let url = getUrlWithInodePath(inodePath);
					refreshDirectoryTable(url);
					console.log(url);
				});

				//This needs to be last because it repaints the table
				$('#table-explorer').dataTable( {
					'lengthMenu': [ [25, 50, 100, -1], [25, 50, 100, "All"] ],
					'columns': [
						null, // uri
						null, // location
						null, // name
						null, // size
						null, // ts
						null, // type
						null, // dataowner
					],
					"deferRender": true,
					"order": [[ 5, "asc" ]]
				});
			});
		}).error(function(jqxhr, text, err) {
			// text = textStatus = "error"
			// err = errorThrown = "Internal Server Error"
			// jqxhr = jqXHR = Object
			let msg = "<p><b>Error!</b><ul>";
			if (jqxhr.status == 500) {
				// Show user the received error message
				let response = JSON.parse(jqxhr.responseText);
				msg += "<li><b>url:</b> " + url + "</li>";
				msg += "<li><b>exception:</b> " + response.RemoteException.RemoteException.exception + "</li>";
				msg += "<li><b>message:</b> " + response.RemoteException.RemoteException.message + "</li>";
			} else {
				// Show user the default error message
				msg += "<li><b>url:</b> " + url + "</li>";
				msg += "<li><b>errorThrown:</b> " + err + "</li>";
			}
			msg += "</ul></p>";
			$('#alert-panel-body').html(msg);
			$('#alert-panel').show();
		});
	}

	function refillInputFieldsByURL(url) {
		// Clear all checkboxes and input fields first
		const LENGTH = QUERIES.length;
		for (var i = 0; i < LENGTH; ++i) {
			let element = QUERIES[i];
			let isSubQuery = (element.parentName !== "");
			let idName = ((!isSubQuery)? '' : element.parentName + '-')
				+ element.name;
			if (element.name !== "from") {
				$("#checkbox-" + idName).prop('checked', false);
			}
			$("#text-" + idName).val("");
		}
		// Parse query part
		let querySplitter = url.split("?");
		if (querySplitter.length > 1) {
			let queryPart = querySplitter[1];
			let queries = queryPart.split("&");
			for (let i = 0; i < queries.length; ++i) {
				let queryPair = queries[i].split("=");
				let key = queryPair[0];
				let valueWithSubQueries = decodeURIComponent(queryPair[1]);
				// Parse sub queries
				let subQuerySplitter = valueWithSubQueries.split("?");
				let value = subQuerySplitter[0];
				if (subQuerySplitter.length > 1) {
					// Parse sub query value
					let subQueryPart = subQuerySplitter[1];
					let subQueries = subQueryPart.split("&");
					for (let j = 0; j < subQueries.length; ++j) {
						let subQueryPair = subQueries[j].split("=");
						let subKey = subQueryPair[0];
						let subValue = decodeURIComponent(subQueryPair[1]);
						refillInputField(subKey, subValue, true, key);
					}
				}
				refillInputField(key, value);
			}
		}
	}
	
	function refillInputField(key, value, isSubQuery = false, parentKey = "") {
		// Re-check the checkbox
		let idName = (!isSubQuery)? key : parentKey + "-" + key;
		if (key !== "from") {
			$("#checkbox-" + idName).prop('checked', true);
		}
		// Re-enter the input field
		$("#text-" + idName).val(value);
	}

	function initialize() {
		renderStaticContents();

		// compile and register Dust.js
		dust.loadSource(dust.compile($('#tmpl-explorer').html(), 'explorer'));

		var url = window.location.hash.slice(1);
		refillInputFieldsByURL(url);
		refreshDirectoryTable(url);
	}

	// Refresh page once url changed
	$(window).bind('hashchange', function () {
		//var url = decodeURIComponent(window.location.hash.slice(1));
		var url = window.location.hash.slice(1);
		refillInputFieldsByURL(url);
		refreshDirectoryTable(url);
		//console.log("window bind");
	});

	$("#button-send").click(function () {
		refreshDirectoryTable("button.send");
	});

	initialize();
})();
