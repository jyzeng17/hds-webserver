(function() {
	"use strict";

	function createQueryFormGroups() {
		let html = new QueryFormGroup('history').
			setPlaceholder(PLACEHOLDER.BOOLEAN).html() +
			new QueryFormGroup('id').html() +
			new QueryFormGroup('redirectfrom').html() +
			new QueryFormGroup('servername').html() +
			new QueryFormGroup('clientname').html() +
			new QueryFormGroup('from').html() +
			new QueryFormGroup('to').html() +
			new QueryFormGroup('state').
			setPlaceholder('pending/running/succeed/failed').html() +
			new QueryFormGroup('progress').
			setPlaceholder(PLACEHOLDER.PROGRESS).html() +
			new QueryFormGroup('minprogress').
			setPlaceholder(PLACEHOLDER.PROGRESS).html() +
			new QueryFormGroup('maxprogress').
			setPlaceholder(PLACEHOLDER.PROGRESS).html() +
			new QueryFormGroup('starttime').
			setPlaceholder(PLACEHOLDER.TIME).html() +
			new QueryFormGroup('minstarttime').
			setPlaceholder(PLACEHOLDER.TIME).html() +
			new QueryFormGroup('maxstarttime').
			setPlaceholder(PLACEHOLDER.TIME).html() +
			new QueryFormGroup('elapsed').html() +
			new QueryFormGroup('minelapsed').html() +
			new QueryFormGroup('maxelapsed').html() +
			new QueryFormGroup('expectedsize').html() +
			new QueryFormGroup('minexpectedsize').html() +
			new QueryFormGroup('maxexpectedsize').html() +
			new QueryFormGroup('transferredsize').html() +
			new QueryFormGroup('mintransferredsize').html() +
			new QueryFormGroup('maxtransferredsize').html() +
			new QueryFormGroup('limit').html() +
			new QueryFormGroup('offset').html();

		$("#query-form-groups").html(html);
	}

	function getQuery() {
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
				":8000/dataservice/v1/watch" + getQuery();
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

	function initialize() {
		createQueryFormGroups();

		// compile and register Dust.js
		dust.loadSource(dust.compile($('#tmpl-response').html(), 'response'));

		let url = window.location.hash.slice(1);
		refreshResponseTable(url);
	}

	$("#button-send").click(function () {
		refreshResponseTable("button.send");
	});

	initialize();
})();
