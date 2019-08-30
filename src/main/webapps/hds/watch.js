(function() {
	"use strict";

	const QUERIES = [
		{parentName: "", name: "history"},
		{parentName: "", name: "id"},
		{parentName: "", name: "redirectfrom"},
		{parentName: "", name: "servername"},
		{parentName: "", name: "clientname"},
		{parentName: "", name: "from"},
		{parentName: "", name: "to"},
		{parentName: "", name: "state"},
		{parentName: "", name: "progress"},
		{parentName: "", name: "minprogress"},
		{parentName: "", name: "maxprogress"},
		{parentName: "", name: "starttime"},
		{parentName: "", name: "minstarttime"},
		{parentName: "", name: "maxstarttime"},
		{parentName: "", name: "elapsed"},
		{parentName: "", name: "minelapsed"},
		{parentName: "", name: "maxelapsed"},
		{parentName: "", name: "expectedsize"},
		{parentName: "", name: "minexpectedsize"},
		{parentName: "", name: "maxexpextedsize"},
		{parentName: "", name: "transferredsize"},
		{parentName: "", name: "mintransferredsize"},
		{parentName: "", name: "maxtransferredsize"},
		{parentName: "", name: "limit"},
		{parentName: "", name: "offset"}
	];

	function renderQueryFormGroups() {
		//createQueryFormGroup(parentName, name, isHidden, isRequired, isProtocolButtonGroup)
		var content = ''
			+ createQueryFormGroup("", "history", false, false, false, "true/false")
			+ createQueryFormGroup("", "id", false, false, false)
			+ createQueryFormGroup("", "redirectfrom", false, false, false)
			+ createQueryFormGroup("", "servername", false, false, false)
			+ createQueryFormGroup("", "clientname", false, false, false)
			+ createQueryFormGroup("", "from", false, false, false)
			+ createQueryFormGroup("", "to", false, false, false)
			+ createQueryFormGroup("", "state", false, false, false, "pending/running/succeed/failed")
			+ createQueryFormGroup("", "progress", false, false, false, "0.0 ~ 1.0")
			+ createQueryFormGroup("", "minprogress", false, false, false, "0.0 ~ 1.0")
			+ createQueryFormGroup("", "maxprogress", false, false, false, "0.0 ~ 1.0")
			+ createQueryFormGroup("", "starttime", false, false, false, "yyyy-MM-dd'T'HH:mm:ss.SSS")
			+ createQueryFormGroup("", "minstarttime", false, false, false, "yyyy-MM-dd'T'HH:mm:ss.SSS")
			+ createQueryFormGroup("", "maxstarttime", false, false, false, "yyyy-MM-dd'T'HH:mm:ss.SSS")
			+ createQueryFormGroup("", "elapsed", false, false, false)
			+ createQueryFormGroup("", "minelapsed", false, false, false)
			+ createQueryFormGroup("", "maxelapsed", false, false, false)
			+ createQueryFormGroup("", "expectedsize", false, false, false)
			+ createQueryFormGroup("", "minexpectedsize", false, false, false)
			+ createQueryFormGroup("", "maxexpectedsize", false, false, false)
			+ createQueryFormGroup("", "transferredsize", false, false, false)
			+ createQueryFormGroup("", "mintransferredsize", false, false, false)
			+ createQueryFormGroup("", "maxtransferredsize", false, false, false)
			+ createQueryFormGroup("", "limit", false, false, false)
			+ createQueryFormGroup("", "offset", false, false, false);

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
			url = "http://slave01:8000/dataservice/v1/watch" + getQuery();
			//url = "http://" + $("#text-host").val() + ":" + $("#number-port").val() + "/dataservice/v1/access?" + getQuery();
		}

		window.location.hash = url;

		$.get(url, function(data) {
			// render template: dust.render(templateName, data, callback);
			dust.render('response', data, function(err, out) {
				$('#result-table').html(out);

				$('#table-response').dataTable( {
					'lengthMenu': [ [25, 50, 100, -1], [25, 50, 100, "All"] ],
					'columns': [
						null, // id
						null, // redirectFrom
						null, // serverName
						null, // clientname
						null, // from
						null, // to
						null, // state
						null, // progress
						null, // starttime
						null, // elapsed
						null, // expectedsize
						null, // transfeeredsize
					],
					"deferRender": true,
					"scrollX": true,
					"autoWidth": true,
					"order": [[ 8, "desc" ]]

					//"order": [[ 6, "asc" ]]
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

	//function refillInputFieldsByURL(url) {

	function initialize() {
		renderStaticContents();

		// compile and register Dust.js
		dust.loadSource(dust.compile($('#tmpl-response').html(), 'response'));

		var url = window.location.hash.slice(1);
		refreshResponseTable(url);
	}

	//$(window).bind('hashchange', function () {
	//	var url = decodeURIComponent(window.location.hash.slice(1));
	//	refreshResponseTable(url);
	//});

	$("#button-send").click(function () {
		refreshResponseTable("button.send");
	});

	initialize();
})();
