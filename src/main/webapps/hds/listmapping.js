(function() {
	"use strict";

	function createQueryFormGroups() {
		let html = new QueryFormGroup('id').html() +
			new QueryFormGroup('domain').html() +
			new QueryFormGroup('user').html() +
			new QueryFormGroup('password').html() +
			new QueryFormGroup('host').html() +
			new QueryFormGroup('port').html() +
			new QueryFormGroup('minport').html() +
			new QueryFormGroup('maxport').html() +
			new QueryFormGroup('limit').html() +
			new QueryFormGroup('offset').html();

		$("#query-form-groups").html(html);
	}

	function getQuery() {
		const QUERIES = [
			{parentName: "", name: "id"},
			{parentName: "", name: "domain"},
			{parentName: "", name: "user"},
			{parentName: "", name: "password"},
			{parentName: "", name: "host"},
			{parentName: "", name: "port"},
			{parentName: "", name: "minport"},
			{parentName: "", name: "maxport"},
			{parentName: "", name: "limit"},
			{parentName: "", name: "offset"}
		];
		const LENGTH = QUERIES.length;

		let query = "";
		let isFirstQuery = true, isInSubQuery = false;
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
			url = "http://" + window.location.hostname +
				":8000/dataservice/v1/listmapping" + getQuery();
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
						null, // domain
						null, // user
						null, // password
						null, // host
						null // port
					],
					"deferRender": true,
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
				msg += "<li><b>exception:</b> " +
					response.RemoteException.RemoteException.exception + "</li>";
				msg += "<li><b>message:</b> " +
					response.RemoteException.RemoteException.message + "</li>";
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

	function initialize() {
		createQueryFormGroups();

		// compile and register Dust.js
		dust.loadSource(dust.compile($('#tmpl-response').html(), 'response'));
	}

	$("#button-send").click(function () {
		refreshResponseTable("button.send");
	});

	initialize();
})();
