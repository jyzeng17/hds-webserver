var selectedProtocol;

function selectProtocolButton(protocol, queryName) {
	const LENGTH = PROTOCOLS.length;
	for (let i = 0; i < LENGTH; ++i) {
		let element = PROTOCOLS[i];
		if (element === protocol ) {
			$("#button-" + queryName + "-" + element).attr("style", "background:#ededed");
		} else {
			$("#button-" + queryName + "-" + element).removeAttr("style");
		}
		// toggle from-location query
		if (queryName === "to") {
			if (protocol === "hds") {
				$("#" + queryName + "-name-form-group").show();
				$("#" + queryName + "-location-form-group").show();
			} else {
				$("#" + queryName + "-name-form-group").hide();
				$("#" + queryName + "-location-form-group").hide();
			}
		}
	}
	selectedProtocol = protocol;
	$("#text-" + queryName).val(protocol + "://");
}

(function() {
	"use strict";

	const QUERIES = [
		{parentName: "", name: "from"},
		{parentName: "from", name: "keep"},
		{parentName: "", name: "to"},
		{parentName: "to", name: "name"},
		{parentName: "to", name: "location"},
		{parentName: "to", name: "time"}
	];

	function renderQueryFormGroups() {
		//createQueryFormGroup(parentName, name, isHidden, isRequired, isProtocolButtonGroup)
		var content = '';
		content += createQueryFormGroup("", "from", false, true, true);
		content += createQueryFormGroup("", "from", false, true, false);
		content += createCollapseButton("from");
		content += '<div id="from-queries" hidden>'
		content += createQueryFormGroup("from", "keep", false, false, false, "true/false");
		content += '</div>'
		content += createQueryFormGroup("", "to", false, true, true);
		content += createQueryFormGroup("", "to", false, true, false);
		content += createCollapseButton("to");
		content += '<div id="to-queries" hidden>'
		content += createQueryFormGroup("to", "name", true, false, false);
		content += createQueryFormGroup("to", "location", true, false, false, "hdfs/hbase");
		content += createQueryFormGroup("to", "time", false, false, false, "yyyy-MM-dd'T'HH:mm:ss.SSS");
		content += '</div>'
		$("#query-form-groups").html(content);
	}

	function renderStaticContents() {
		renderQueryFormGroups();
	}

	//function getUrlWithInodePath(inodePath) {
	//	return "http://slave01:8000/dataservice/v1/list" + getQuery(inodePath);
	//}

	function getQuery() {
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
				newQuery += element.name + "=" + encodeURIComponent(textValue);
				query += (!isSubQuery)? newQuery : encodeURIComponent(newQuery);
			}
		}
		return query;
	}

	function refreshResponseTable(url) {
		$("#alert-panel").hide();

		if (url == "button.send") {
			//url = "http://" + window.location.host + "/dataservice/v1/access?" + getQuery();
			url = "http://slave01:8000/dataservice/v1/access" + getQuery();
			//url = "http://" + $("#text-host").val() + ":" + $("#number-port").val() + "/dataservice/v1/access?" + getQuery();
		}

		window.location.hash = url;

		$.get(url, function(data) {

			// render template: dust.render(templateName, data, callback);
			dust.render('response', data, function(err, out) {
				$('#result-table').html(out);
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

	//function refillInputFieldsByURL(url) {

	function initialize() {
		renderStaticContents();

		// compile and register Dust.js
		dust.loadSource(dust.compile($('#tmpl-response').html(), 'response'));

		//var url = window.location.hash.slice(1);
		//refreshResponseTable(url);
	}

	// Re-send requests once url changes
	//$(window).bind('hashchange', function () {
	//	var url = decodeURIComponent(window.location.hash.slice(1));
	//	refreshResponseTable(url);
	//});

	$("#button-send").click(function () {
		refreshResponseTable("button.send");
	});

	initialize();
})();
